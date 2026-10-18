/* Pure prompt composition and local remix storage. Shared by UI and Node checks. */
const PromptLab = (() => {
  const styles = {
    Photography: 'Fine-art photographic realism. Believable natural detail, realistic textures and atmosphere, restrained editorial finish, subtle depth of field.',
    Painterly: 'A contemporary oil painting on linen. Expressive yet controlled brushwork, layered pigments, subtle visible canvas texture, gallery-quality painterly edges.',
    'Ink wash': 'An ink-wash artwork on warm rice paper. Restrained ink tonal gradations, delicate warm colour washes, expressive brushwork and subtle ink bleeding, generous breathing room.',
    Dreamscape: 'A cinematic dreamscape blending believable natural textures with restrained magical atmosphere, softly luminous details and intentional visual storytelling.'
  };
  const key = 'wildframe:remixes:v2', legacyKey = 'wildframe:variation:v1';
  const limits = { subject:220, setting:250, light:220, palette:220, composition:500, negative:450 };
  function values(value, known) {
    if (!value || typeof value !== 'object' || !known.has(value.id) || !Object.hasOwn(styles,value.style) || !['3:2','16:9','1:1','4:5','9:16'].includes(value.ratio)) return null;
    const result = { id:value.id, style:value.style, ratio:value.ratio };
    for (const [field,max] of Object.entries(limits)) {
      const text = value[field] ?? '';
      if (typeof text !== 'string' || text.length > max) return null;
      result[field] = text.trim();
    }
    return result.subject && result.setting ? result : null;
  }
  function compose(value) {
    return `Create a ${value.ratio} ${value.style.toLowerCase()} image of ${value.subject || '[your subject]'}.\n\nEnvironment: ${value.setting || '[your setting]'}.\n\nVisual language: ${styles[value.style] || styles.Photography}\n\nLighting and atmosphere: ${value.light || 'Soft natural light and a quiet mood'}.\n\n${value.palette ? 'Palette: '+value.palette+'.\n\n' : ''}Composition and details: ${value.composition || 'A clear focal point and carefully considered framing'}.\n\nNo text, watermark, logo, border or collage.`;
  }
  function text(value) { return compose(value)+'\n\nSuggested exclusions / negative prompt:\n'+(value.negative || ''); }
  function diff(a,b) {
    const left=a.split('\n'),right=b.split('\n');
    const lengths=Array.from({length:left.length+1},()=>new Uint16Array(right.length+1)),keepLeft=new Set(),keepRight=new Set();
    for(let i=left.length-1;i>=0;i--)for(let j=right.length-1;j>=0;j--)lengths[i][j]=left[i]===right[j]?1+lengths[i+1][j+1]:Math.max(lengths[i+1][j],lengths[i][j+1]);
    let i=0,j=0;
    while(i<left.length&&j<right.length){if(left[i]===right[j]){keepLeft.add(i++);keepRight.add(j++)}else if(lengths[i+1][j]>=lengths[i][j+1])i++;else j++}
    return [left.map((line,index)=>({text:line,changed:!keepLeft.has(index)})),right.map((line,index)=>({text:line,changed:!keepRight.has(index)}))];
  }
  function createHistory(storage,known) {
    function load() {
      try {
        const raw=storage.getItem(key);
        if (raw !== null) {
          const data=JSON.parse(raw);
          if (data?.version!==2 || !Array.isArray(data.items) || data.items.length>known.size*20) throw Error('invalid');
          const ids=new Set();
          for(const item of data.items) {
            if (!item || typeof item.id!=='string' || !item.id || item.id.length>100 || ids.has(item.id) || typeof item.name!=='string' || !item.name.trim() || item.name.length>80 || item.recipeId!==item.values?.id || !values(item.values,known) || typeof item.createdAt!=='string' || !Number.isFinite(Date.parse(item.createdAt))) throw Error('invalid');
            ids.add(item.id);
          }
          return {items:data.items,writable:true};
        }
        const legacyRaw=storage.getItem(legacyKey);
        let legacy=null;
        if(legacyRaw){try{legacy=values(JSON.parse(legacyRaw),known)}catch{}}
        const items=legacy ? [{id:'legacy-'+legacy.id,recipeId:legacy.id,name:'Your previous variation',values:legacy,createdAt:new Date().toISOString()}] : [];
        if(items.length){try{storage.setItem(key,JSON.stringify({version:2,items}))}catch{return {items,writable:false,error:'Your previous variation is available to restore, but migration could not be saved. Copy or download it to keep a backup.'}}}
        return {items,writable:true};
      } catch {
        return {items:[],writable:false,error:'History is unavailable or could not be read. Your existing data has been kept. Copy or download your variation to keep it.'};
      }
    }
    function save(input,name,id) {
      const state=load(),clean=values(input,known);
      if(!state.writable)return {ok:false,error:state.error};
      if(!clean)return {ok:false,error:'Complete the subject and setting before saving.'};
      if(typeof name!=='string'||!name.trim()||name.length>80)return {ok:false,error:'Use a variation name between 1 and 80 characters.'};
      if(typeof id!=='string'||!id||id.length>100||state.items.some(item=>item.id===id))return {ok:false,error:'This version could not be given a unique identifier. Please try saving again.'};
      if(state.items.filter(item=>item.recipeId===clean.id).length>=20)return {ok:false,error:'This recipe already has 20 saved variations. Download this variation to keep another copy.'};
      const item={id,recipeId:clean.id,name:name.trim(),values:clean,createdAt:new Date().toISOString()};
      const items=[...state.items,item];
      try{storage.setItem(key,JSON.stringify({version:2,items}));return {ok:true,item,items}}catch{return {ok:false,error:'Browser storage is full or unavailable. Your previous versions are safe. Copy or download this variation.'}}
    }
    return {load,save};
  }
  return {styles,values,compose,text,diff,createHistory};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=PromptLab;
