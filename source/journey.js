// An optional path through the real interface. No telemetry or tutorial storage.
let journeyState=null,journeyPanel=null;
function stopJourney(){journeyState=null;journeyPanel?.remove();journeyPanel=null;experiments.classList.remove('guided')}
function startJourney(trigger){
  journeyState={readRecipeId:null,saves:[]};
  openExperiments(trigger);
}
function renderJourney(){
  if(!journeyState)return;
  let step=0,title='Choose a look',description='Compare two styles below. Choose the look in View B, then open its recipe.',label='Read the recipe in View B',action=()=>useExperiment('B',false),target=experiments;
  if(studio.classList.contains('open')){
    step=2;target=studio;const count=journeyState.saves.filter(item=>item.recipeId===studioSeed.id).length;
    title=count?'Your remix is saved':'Make it yours';
    description=count?'Your version is in this browser’s remix history. Change the light and save a second direction to compare.':'Change the subject, give your variation a name, then use Save variation. The example image stays unchanged.';
    label=count>=2?'Compare your two versions':count?'Try a different light':'Edit the subject';
    action=()=>{
      if(count>=2){const versions=journeyState.saves.filter(item=>item.recipeId===studioSeed.id);const first=versions[0].id,last=versions.at(-1).id;stopJourney();$('#versionA').value=first;$('#versionB').value=last;compareRemixes();return}
      $('#studio'+(count?'Light':'Subject')).focus();
    };
  }else if(dialog.classList.contains('open')){
    step=1;target=dialog;const read=journeyState.readRecipeId===activeId;
    title='Understand the words';description=read?'Select a part of the prompt to see what it does. Then take the recipe into the Studio.':'Prompt DNA explains the subject, light, composition and visual language without changing the original text.';
    label=read?'Remix this recipe':'Explore Prompt DNA';
    action=()=>{if(read){openStudio();$('#studioSubject').focus()}else{showPromptMode(true);journeyState.readRecipeId=activeId;renderJourney();$('#dnaParts button')?.focus()}};
  }else if(!experiments.classList.contains('open')){stopJourney();return}
  experiments.classList.toggle('guided',target===experiments);
  if(!journeyPanel){journeyPanel=document.createElement('aside');journeyPanel.id='journeyPanel';journeyPanel.className='journey-panel';journeyPanel.setAttribute('aria-label','Your first remix guide')}
  const progress=document.createElement('p');progress.className='eyebrow';progress.textContent='Your first remix / Step '+(step+1)+' of 3';
  const content=document.createElement('div');content.className='journey-content';const text=document.createElement('div'),heading=document.createElement('h3'),note=document.createElement('p');
  heading.id='journeyTitle';heading.tabIndex=-1;heading.textContent=title;note.textContent=description;text.append(heading,note);
  const actions=document.createElement('div');actions.className='journey-actions';const next=document.createElement('button'),skip=document.createElement('button');next.id='journeyNext';next.className='button primary';next.textContent=label;next.addEventListener('click',action);
  skip.id='journeySkip';skip.className='text-button';skip.textContent=step===2&&journeyState.saves.length?'Finish guide':'Skip guide';skip.addEventListener('click',()=>{stopJourney();target.querySelector('.close-button')?.focus({preventScroll:true})});actions.append(next,skip);content.append(text,actions);journeyPanel.replaceChildren(progress,content);
  target.querySelector('.dialog-top').after(journeyPanel);
}
function recordJourneySave(item){
  if(!journeyState)return;
  journeyState.saves.push({id:item.id,recipeId:item.recipeId});renderJourney();
  journeyPanel.scrollIntoView({block:'start',behavior:reduced.matches?'instant':'smooth'});$('#journeyTitle').focus({preventScroll:true});
}
function initializeJourney(){
  for(const id of ['startJourney','startJourneyLibrary'])$('#'+id).addEventListener('click',event=>startJourney(event.currentTarget));
}
