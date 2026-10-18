"""Author exact-source reading notes without rewriting the supplied prompts."""
from pathlib import Path
import json,re
root=Path(__file__).resolve().parent.parent
recipes=json.loads((root/'assets/prompt-catalog.json').read_text(encoding='utf-8'))
recipes+=json.loads((root/'assets/visual-experiments.json').read_text(encoding='utf-8'))['recipes']
result={}
notes={
 'subject':('Subject','Names the focal subject and the details that make it recognisable.'),
 'setting':('Environment','Gives the subject a place and establishes the world around it.'),
 'light':('Light & atmosphere','Describes how the light and atmosphere shape the mood and visible detail.'),
 'palette':('Colour palette','Gives the image a colour direction. Use a few related tones to keep the scene coherent.'),
 'composition':('Composition','Guides framing, visual hierarchy and the space around the focal point.'),
 'style':('Visual language','Describes the medium, texture and rendering qualities to explore.'),
 'negative':('Constraints','States what to leave out. Exclusions are guidance, not a guarantee.')}
scene_notes={
 'ai-snow-leopard':{'subject':'a solitary snow leopard','setting':'on a dark rocky ledge in a cold mountain landscape'},
 'ai-giraffes':{'subject':'Two giraffes','setting':'a wide quiet savanna at first light','light':'thin band of warm gold on the horizon beneath a blue-grey sky','composition':'one nearer and one farther away'},
 'ai-kingfisher':{'subject':'A single common kingfisher','setting':'above a dark forest river','light':'delicate soft side light','composition':'include the full branch and breathing room'},
 'ai-humpback':{'subject':'An immense humpback whale','setting':'beneath a blue-green ocean surface','light':'soft natural sunbeams from the rippled surface','composition':'viewed underwater from a respectful distant side angle'},
 'ai-red-panda':{'subject':'A red panda','setting':'a cool misty cloud forest','light':'rusty fur touched by soft daylight','composition':'full ringed tail draping downward'},
 'ai-penguins':{'subject':'A small group of five gentoo penguins','setting':'a dark stony shore at the edge of Antarctic blue ice','light':'overcast cold daylight','composition':'Layered depth and ample space'},
 'ai-stag':{'subject':'A red deer stag','setting':'the edge of an autumn woodland in early dawn mist','light':'Soft rim of natural morning light','composition':'complete animal and branching antlers fully inside frame'},
 'ai-sea-turtle':{'subject':'A green sea turtle','setting':'a shallow coral reef','light':'soft sunlight moving across turquoise water','composition':'full turtle in a three-quarter view'},
 'ai-zebras':{'subject':'Three plains zebras','setting':'tall dry grass','light':'soft cloudy late-afternoon light','composition':'one in foreground in profile and two partially overlapping at distance'},
 'ai-puffin':{'subject':'One Atlantic puffin','setting':'a mossy rugged sea-cliff edge','light':'natural overcast coastal light with a very subtle bright break in clouds','composition':'complete bird including orange feet'},
 'ai-octopus':{'subject':'A single common octopus','setting':'a dark rocky seabed in shallow Mediterranean-like water','light':'dappled natural underwater light','composition':'one eye visible'},
 'ai-moth':{'subject':'a single grey peppered moth','setting':'a dark lichen-covered tree trunk','light':'soft diffused forest daylight','composition':'bark and wing patterns visually echo each other'},
 'ai-polar-bear':{'subject':'One polar bear','setting':'a flat expanse of sea ice','light':'soft blue-grey polar morning light','composition':'complete body seen from side with head slightly turned'},
 'ai-seal':{'subject':'one harbour seal','setting':'a still dark cold-water inlet','light':'delicate side light','composition':'quiet intimate composition with breathing room'},
 'ai-butterfly':{'subject':'a single orange-and-black butterfly','setting':'a meadow at dusk','light':'gentle natural backlight','composition':'wings folded upright'}
}
for recipe in recipes:
    prompt=recipe['prompt']
    patterns={
      'subject':[r'Subject: ([^.\n]+\.?)',r'Scene: ([^,.\n]+)',r'photograph of ([^.]+\.)',r'Scene and art direction: ([^,]+)'],
      'setting':[r'Environment: ([^\n]+)',r'Set the scene[^.]+\.'],
      'light':[r'Lighting: ([^\n]+)',r'(?:cinematic but believable )?natural overcast side light',r'soft directional light',r'delicate shafts of natural early light',r'(?:soft|warm|cold|golden|moonlit|early|natural)[^,.]{0,65}light[^,.]*'],
      'palette':[r'Palette: ([^\n]+)',r'subdued slate and ivory palette',r'muted organic colours',r'(?:muted|subdued|organic)[^,.]{0,65}palette'],
      'composition':[r'Composition: ([^\n]+)',r'Build the composition[^.]+\.',r'generous breathing room[^,.]+',r'generous negative space',r'intentional composition'],
      'style':[r'Visual language: ([^\n]+)',r'Use realistic textures[^.]+\.',r'restrained documentary-style photographic aesthetic',r'Naturalistic anatomy[^,]+',r'editorial fine-art landscape photography',r'contemporary[^,.]*(?:oil painting|ink-wash)[^,.]*',r'(?:oil painting|ink-wash|dreamscape)[^,.]*'],
      'negative':[r'Constraints: ([^\n]+)',r'No text[^.]+\.',r'The image itself must contain no text[^.]+\.']}
    annotations=[]
    for field,choices in patterns.items():
        preferred=scene_notes.get(recipe['id'],{}).get(field)
        if preferred:
            assert preferred in prompt,(recipe['id'],preferred)
            label,note=notes[field]
            annotations.append({'field':field,'label':label,'quote':preferred,'note':note})
            continue
        for pattern in choices:
            match=re.search(pattern,prompt,re.I)
            if not match:continue
            quote=match.group(1) if match.lastindex else match.group()
            label,note=notes[field]
            annotations.append({'field':field,'label':label,'quote':quote,'note':note})
            break
    assert len(annotations)>=3,(recipe['id'],annotations)
    assert all(a['quote'] in prompt for a in annotations)
    result[recipe['id']]=annotations
(root/'assets/prompt-annotations.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Validated exact-source reading notes for {len(result)} recipes.')
