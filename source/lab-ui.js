let remixStore=null,experimentGroup='fox',experimentReturnFocus=null,dnaSelection=null;

function showPromptMode(dna) {
  $('#dnaPanel').hidden=!dna;$('#masterText').hidden=dna;
  $('#rawMode').setAttribute('aria-pressed',!dna);$('#dnaMode').setAttribute('aria-pressed',dna);
}
function selectDnaPart(part) {
  dnaSelection=part;
  $$('#dnaParts button').forEach(button=>button.setAttribute('aria-pressed',button.dataset.dnaField===part.field));
  $('#dnaLabel').textContent=part.label;$('#dnaNote').textContent=part.note;
  const prompt=byId.get(activeId).prompt,index=prompt.indexOf(part.quote),mark=document.createElement('mark');
  mark.textContent=part.quote;$('#dnaReading').replaceChildren(document.createTextNode(prompt.slice(0,index)),mark,document.createTextNode(prompt.slice(index+part.quote.length)));
  $('#editDnaPart').textContent='Edit '+part.label.toLowerCase()+' in the studio →';
}
function renderDna() {
  showPromptMode(false);dnaSelection=null;
  const recipe=byId.get(activeId),parts=(promptAnnotations[activeId]||[]).filter(part=>typeof part.quote==='string'&&recipe.prompt.includes(part.quote));
  $('#dnaMode').hidden=!parts.length;$('#dnaParts').replaceChildren();
  for(const part of parts){const button=document.createElement('button');button.className='dna-part';button.dataset.dnaField=part.field;button.textContent=part.label;button.setAttribute('aria-pressed','false');button.addEventListener('click',()=>selectDnaPart(part));$('#dnaParts').append(button)}
  if(parts.length)selectDnaPart(parts[0]);
}
function currentVersions() { return remixStore.load().items.filter(item=>item.recipeId===studioSeed.id).reverse(); }
function restoreRemix(item) {
  fillStudio(item.values);$('#variationName').value=item.name;
  $('#studioStatus').textContent='Restored “'+item.name+'”. Your saved version stays unchanged.';
  $('#studioSubject').focus();
}
function renderRemixHistory() {
  const state=remixStore.load(),items=state.items.filter(item=>item.recipeId===studioSeed.id).reverse();
  $('#historyCount').textContent=items.length+' saved';$('#historyEmpty').hidden=!!items.length;
  $('#historyEmpty').textContent=state.error||'Save a named variation to start a history for this recipe. Your versions stay in this browser.';
  $('#variationHistory').hidden=!items.length;$('#downloadHistory').hidden=!items.length;
  $('#versionList').replaceChildren();$('#versionA').replaceChildren();$('#versionB').replaceChildren();
  $('#versionCompareTools').hidden=items.length<2;$('#versionComparison').hidden=true;
  for(const item of items){
    const row=document.createElement('div');row.className='version-row';const text=document.createElement('div'),name=document.createElement('strong'),date=document.createElement('time'),button=document.createElement('button');
    name.textContent=item.name;date.dateTime=item.createdAt;date.textContent=new Date(item.createdAt).toLocaleString('en',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});text.append(name,date);
    button.className='button small';button.textContent='Restore';button.dataset.restoreVersion=item.id;button.setAttribute('aria-label','Restore '+item.name);button.addEventListener('click',()=>restoreRemix(item));row.append(text,button);$('#versionList').append(row);
    for(const select of [$('#versionA'),$('#versionB')]){const option=document.createElement('option');option.value=item.id;option.textContent=item.name;select.append(option)}
  }
  if(items.length>1)$('#versionB').value=items[1].id;
  return items;
}
function prepareStudioHistory() {
  const items=renderRemixHistory();$('#variationName').value='Variation '+(items.length+1);
}
function saveRemix() {
  if(!$('#studioForm').reportValidity())return;
  const id=globalThis.crypto?.randomUUID?.()||'remix-'+Date.now()+'-'+Math.random().toString(36).slice(2);
  const result=remixStore.save(studioValues(),$('#variationName').value,id);
  if(result.ok){const items=renderRemixHistory();$('#variationName').value='Variation '+(items.length+1);$('#studioStatus').textContent='Saved “'+result.item.name+'” in this browser.';toast('Variation saved to this recipe’s history.');recordJourneySave(result.item)}
  else{$('#studioStatus').textContent=result.error;toast('Copy or download this variation to keep it.')}
}
function compareRemixes() {
  const items=currentVersions(),a=items.find(item=>item.id===$('#versionA').value),b=items.find(item=>item.id===$('#versionB').value);
  if(!a||!b||a.id===b.id){$('#studioStatus').textContent='Choose two different saved versions to compare.';$('#versionComparison').hidden=true;return}
  const comparison=$('#versionComparison');comparison.replaceChildren();
  PromptLab.diff(PromptLab.text(a.values),PromptLab.text(b.values)).forEach((lines,index)=>{
    const column=document.createElement('div'),heading=document.createElement('h4'),pre=document.createElement('pre');heading.textContent=(index?'B / ':'A / ')+[a,b][index].name;
    for(const line of lines){const span=document.createElement(line.changed&&line.text?'mark':'span');span.className='diff-line';span.textContent=line.text||' ';pre.append(span)}column.append(heading,pre);comparison.append(column);
  });
  comparison.hidden=false;$('#studioStatus').textContent='Changed lines are highlighted. This comparison contains text only.';
  comparison.scrollIntoView({block:'nearest',behavior:reduced.matches?'instant':'smooth'});
}
function groupRecipes() { const group=experimentData.groups.find(group=>group.id===experimentGroup);return group.variants.map(id=>byId.get(id)); }
function renderExperimentPair() {
  const pair=[$('#experimentA').value,$('#experimentB').value].map(id=>byId.get(id));
  pair.forEach((recipe,index)=>{
    const letter=index?'B':'A',image=$('#experimentImage'+letter);image.hidden=false;image.dataset.recipe=recipe.id;image.src=recipe.thumb;image.alt=recipe.subject+' / '+recipe.style;
    $('#experimentCaption'+letter).textContent=recipe.style+' · Generated example / ImageGen';
    image.onerror=()=>{image.hidden=true;$('#experimentCaption'+letter).textContent=recipe.style+' · Preview unavailable. The exact prompt is still ready to read.'};
    const full=new Image();full.decoding='async';full.onload=()=>{if(image.dataset.recipe===recipe.id){image.hidden=false;image.src=recipe.full;$('#experimentCaption'+letter).textContent=recipe.style+' · Generated example / ImageGen'}};full.src=recipe.full;
  });
  const difference=$('#experimentDifference');difference.replaceChildren();
  pair.forEach((recipe,index)=>{const box=document.createElement('div'),label=document.createElement('strong'),text=document.createElement('p');label.textContent=(index?'B / ':'A / ')+recipe.style;text.textContent=recipe.prompt.match(/Visual language: ([^\n]+)/)?.[1]||recipe.style;box.append(label,text);difference.append(box)});
}
function selectExperimentGroup(id) {
  if(!experimentData.groups.some(group=>group.id===id))return;experimentGroup=id;
  $$('[data-experiment-group]').forEach(button=>button.setAttribute('aria-pressed',button.dataset.experimentGroup===id));
  const recipes=groupRecipes();for(const select of [$('#experimentA'),$('#experimentB')]){select.replaceChildren();for(const recipe of recipes){const option=document.createElement('option');option.value=recipe.id;option.textContent=recipe.style;select.append(option)}}
  $('#experimentB').value=recipes[1].id;$('#experimentSceneTitle').textContent=experimentData.groups.find(group=>group.id===id).title;$('#experimentScene').textContent=recipes[0].subject+'.';renderExperimentPair();
}
function openExperiments(trigger) {
  experimentReturnFocus=trigger;experiments.classList.add('open');experiments.scrollTop=0;selectExperimentGroup(experimentGroup);syncLayers();$('#experimentsClose').focus({preventScroll:true});
}
function closeExperiments() {
  experiments.classList.remove('open');syncLayers();(experimentReturnFocus?.isConnected?experimentReturnFocus:$('#browsePrompts')).focus({preventScroll:true});
}
function useExperiment(letter,inStudio) {
  const id=$('#experiment'+letter).value,trigger=$('#experiment'+(inStudio?'Use':'Open')+letter);
  openPrompt(id,trigger);if(inStudio)openStudio();
}
function initializeLab() {
  remixStore=PromptLab.createHistory({getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)},new Set(byId.keys()));
  remixStore.load();
  $('#rawMode').addEventListener('click',()=>showPromptMode(false));$('#dnaMode').addEventListener('click',()=>showPromptMode(true));
  $('#copyDnaOriginal').addEventListener('click',()=>copyWithStatus(byId.get(activeId).prompt,'promptStatus','promptCopyFallback','Original masterprompt copied.'));
  $('#editDnaPart').addEventListener('click',()=>{if(!dnaSelection)return;const field=dnaSelection.field;openStudio();const names={subject:'Subject',setting:'Setting',light:'Light',palette:'Palette',composition:'Composition',style:'Style',negative:'Negative'};$('#studio'+names[field])?.focus()});
  $('#compareVersions').addEventListener('click',compareRemixes);
  for(const id of ['versionA','versionB'])$('#'+id).addEventListener('change',()=>$('#versionComparison').hidden=true);
  $('#downloadHistory').addEventListener('click',()=>downloadText(JSON.stringify({collection:'WildFrame remix history',recipeId:studioSeed.id,versions:currentVersions()},null,2),'wildframe-'+studioSeed.id+'-history.json','application/json'));
  $('#openExperiments').addEventListener('click',event=>openExperiments(event.currentTarget));$('#experimentsClose').addEventListener('click',closeExperiments);
  experiments.addEventListener('click',event=>{if(event.target===experiments)closeExperiments()});
  $$('[data-experiment-group]').forEach(button=>button.addEventListener('click',()=>selectExperimentGroup(button.dataset.experimentGroup)));
  for(const letter of ['A','B']){$('#experiment'+letter).addEventListener('change',renderExperimentPair);$('#experimentOpen'+letter).addEventListener('click',()=>useExperiment(letter,false));$('#experimentUse'+letter).addEventListener('click',()=>useExperiment(letter,true))}
}
