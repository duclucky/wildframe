  let currentRecipe = null, cookingStep = -1;
  const quantityFormat = new Intl.NumberFormat('en-US', {maximumFractionDigits:2});
  function sendToHome(message) { if (parent !== window) parent.postMessage(message, location.origin); }
  function renderQuantities() {
    if (!currentRecipe) return;
    const checked = [...document.querySelectorAll('#recipe-ingredients input')].map(input => input.checked);
    const servings = Number(document.querySelector('#servings').value);
    document.querySelector('#modal-servings').textContent = servings + ' servings';
    document.querySelector('#recipe-ingredients').replaceChildren(...currentRecipe.quantities.map(([name, amount, unit], index) => {
      const li=document.createElement('li'), label=document.createElement('label'), check=document.createElement('input'), text=document.createElement('span'), quantity=document.createElement('strong');
      check.type='checkbox'; check.checked=checked[index]||false; text.textContent=name; quantity.textContent=quantityFormat.format(amount*servings/currentRecipe.servings)+' '+unit;
      label.append(check,text,quantity);li.append(label);return li;
    }));
  }
  function updateCookingStep() {
    const count=currentRecipe.steps.length, complete=cookingStep===count;
    document.querySelectorAll('#recipe-steps li').forEach((li,index)=>{
      li.classList.toggle('step-done',index<cookingStep);
      if(index===cookingStep)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');
    });
    document.querySelector('#cooking-controls').hidden=cookingStep<0||complete;
    document.querySelector('#cooking-actionline').hidden=cookingStep>=0&&!complete;
    document.querySelector('.detail-price-label').textContent=complete?'Recipe complete':'Ready in';
    document.querySelector('#previous-step').disabled=cookingStep<=0;
    document.querySelector('#next-step').disabled=complete;
    document.querySelector('#next-step').textContent=cookingStep===count-1?'Finish cooking ✓':'Done, next →';
    document.querySelector('#step-count').textContent=complete?'Finished '+count+' steps':`${cookingStep+1} / ${count}`;
    document.querySelector('#cooking-status').textContent=cookingStep<0?'':complete?'All done! Enjoy the meal you made.':`Step ${cookingStep+1} / ${count}: ${currentRecipe.steps[cookingStep][0]}`;
    document.querySelector('#start-cooking').textContent=complete?'Cook it again ↺':cookingStep>=0?'Back to current step ↑':'Start cooking →';
  }
  function scrollToCookingStep() {
    const target=document.querySelector('#recipe-steps li[aria-current="step"]')||document.querySelector('#cooking-controls');
    target.scrollIntoView({block:'center',behavior:reducedMotion.matches?'instant':'smooth'});
  }
  function renderCookingRecipe(d) {
    currentRecipe=d;cookingStep=-1;document.querySelector('#recipe-scroll').scrollTop=0;document.querySelector('#servings').value=String(d.servings);document.querySelector('#recipe-ingredients').replaceChildren();renderQuantities();
    document.querySelector('#recipe-steps').replaceChildren(...d.steps.map(([title,copy],index)=>{
      const li=document.createElement('li'), heading=document.createElement('h4'), text=document.createElement('p');li.dataset.step=index;heading.textContent=title;text.textContent=copy;li.append(heading,text);return li;
    }));
    document.querySelector('#recipe-tip').textContent=d.tip;
    document.querySelector('#recipe-safety').textContent=d.safety;
    document.querySelector('#recipe-safety').hidden=!d.safety;
    document.querySelector('#safety-source').hidden=!d.safety;
    document.querySelector('#safety-source').href=d.safetySource;
    document.querySelector('#safety-source').textContent=d.safetySourceLabel+' ↗';
    updateCookingStep();
  }
  function selectRecipeById(id) {
    const index=dishes.findIndex(d=>d.id===id);if(index<0||index===selectedDishIndex)return;
    if(dialog.open)resetDishDetails();
    menuPage=Math.floor(index/PAGE_SIZE);renderMenuPage();selectDish(index);
    sendToHome({type:'savor-atlas:selected',id:dishes[index].id});
  }
  function initializeCookingNavigation() {
    document.querySelector('#view-recipe').addEventListener('click',openDishDetails);
    document.querySelector('#servings').addEventListener('change',renderQuantities);
    document.querySelector('#start-cooking').addEventListener('click',()=>{
      if(cookingStep<0||cookingStep===currentRecipe.steps.length)cookingStep=0;
      updateCookingStep();scrollToCookingStep();document.querySelector('#next-step').focus({preventScroll:true});
    });
    document.querySelector('#previous-step').addEventListener('click',()=>{if(cookingStep>0)cookingStep--;updateCookingStep();scrollToCookingStep()});
    document.querySelector('#next-step').addEventListener('click',()=>{if(cookingStep<currentRecipe.steps.length)cookingStep++;updateCookingStep();scrollToCookingStep();if(cookingStep===currentRecipe.steps.length)document.querySelector('#start-cooking').focus({preventScroll:true})});
    const goHome=e=>{e.preventDefault();if(parent===window)location.href='../';else sendToHome({type:'savor-atlas:home'})};
    document.querySelector('#backToSphere').addEventListener('click',goHome);document.querySelector('#kitchenHome').addEventListener('click',goHome);
    addEventListener('keydown',e=>{if(e.key==='Escape'&&!dialog.open)goHome(e)});
    addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==parent||!event.data||event.data.type!=='savor-atlas:select')return;if(typeof event.data.id==='string')selectRecipeById(event.data.id);if(parent!==window&&!dialog.open)stage.focus({preventScroll:true})});
    const id=new URLSearchParams(location.search).get('dish');if(id)selectRecipeById(id);
    track.addEventListener('click',()=>sendToHome({type:'savor-atlas:selected',id:dishes[selectedDishIndex].id}));
    stage.setAttribute('aria-label','Open selected recipe');
    plates[tableTurn % 4].decode().catch(()=>{}).then(()=>sendToHome({type:'savor-atlas:ready'}));
  }
