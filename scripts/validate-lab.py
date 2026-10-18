"""Check source integrity and generated-example provenance before delivery."""
import json,hashlib
from pathlib import Path
root=Path(__file__).resolve().parent.parent
read=lambda name:json.loads((root/name).read_text(encoding='utf-8'))
catalog=read('assets/prompt-catalog.json')
digest=hashlib.sha256(json.dumps(catalog,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
assert digest==(root/'assets/catalog-baseline.sha256').read_text().strip(),'Existing masterprompts must remain unchanged'
if (root/'index.before-lab.html').is_file():
    baseline=(root/'index.before-lab.html').read_text(encoding='utf-8')
    start=baseline.index('const catalog=')+len('const catalog=')
    original,_=json.JSONDecoder().raw_decode(baseline[start:])
    assert original==catalog,'Existing masterprompts must remain unchanged'
experiments=read('assets/visual-experiments.json')
annotations=read('assets/prompt-annotations.json')
atlas=read('assets/atlas-recipes.json')
manifest=read('assets/experiments/manifest.json')+read('assets/atlas/manifest.json')
all_recipes=catalog+atlas+experiments['recipes']
by_id={recipe['id']:recipe for recipe in all_recipes}
assert len(catalog)==41 and len(atlas)==18 and len(by_id)==65
assert len(manifest)==24
for item in manifest:
    assert item['prompt']==by_id[item['id']]['prompt']
    assert item['generation']=='Built-in ImageGen'
    assert all((root/item[key]).is_file() for key in ['original','thumb','full'])
for recipe in all_recipes:
    notes=annotations[recipe['id']]
    assert len(notes)>=3
    assert len({note['field'] for note in notes})==len(notes)
    assert all(note['quote'] in recipe['prompt'] for note in notes)
for group in experiments['groups']:
    recipes=[by_id[id] for id in group['variants']]
    assert len(recipes)==3
    assert len({recipe['style'] for recipe in recipes})==3
    assert len({recipe['prompt'].split('Visual language:')[0] for recipe in recipes})==1
    assert len({recipe['prompt'].split('Constraints:')[1] for recipe in recipes})==1
html=(root/'index.html').read_text(encoding='utf-8')
assert 'PLACEHOLDER' not in html and '<!-- DNA_PANEL -->' not in html and '/* LAB_' not in html
license_path=root/'references/react-bits/LICENSE.md'
license_text=license_path.read_text(encoding='utf-8') if license_path.is_file() else (root/'THIRD_PARTY_NOTICES.md').read_text(encoding='utf-8').split('## Upstream license (verbatim)\n\n',1)[1]
assert license_text.strip() in html
print('PASS: 41 unchanged original recipes, 18 new atlas images, 6 generated experiments, 65 exact-source DNA records, shared scene instructions and bundled source/license integrity.')
