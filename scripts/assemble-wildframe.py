"""Embed catalog, CSS and browser behavior into the buildless application."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parent.parent
catalog=json.loads((ROOT/'assets/prompt-catalog.json').read_text(encoding='utf-8'))
shell=(ROOT/'source/index.template.html').read_text(encoding='utf-8')
script=(ROOT/'source/app.js').read_text(encoding='utf-8')
visuals=(ROOT/'source/visuals.js').read_text(encoding='utf-8')
experiments=json.loads((ROOT/'assets/visual-experiments.json').read_text(encoding='utf-8'))
annotations=json.loads((ROOT/'assets/prompt-annotations.json').read_text(encoding='utf-8'))
atlas=json.loads((ROOT/'assets/atlas-recipes.json').read_text(encoding='utf-8'))
shell=shell.replace('/* DATA_PLACEHOLDER */', "'use strict';\nconst catalog="+json.dumps(catalog,ensure_ascii=False,indent=2)+';')
shell=shell.replace('/* SCRIPT_PLACEHOLDER */',script.replace("'use strict';\n",'',1))
shell=shell.replace('/* VISUALS_PLACEHOLDER */',visuals)
shell=shell.replace('/* LAB_DATA */','const experimentData='+json.dumps(experiments,ensure_ascii=False)+';\nconst promptAnnotations='+json.dumps(annotations,ensure_ascii=False)+';')
shell=shell.replace('/* ATLAS_DATA */','const atlasRecipes='+json.dumps(atlas,ensure_ascii=False)+';')
shell=shell.replace('<!-- SPHERE_COUNT -->',str(len(catalog)+len(atlas)+len(experiments['recipes'])))
shell=shell.replace('<!-- LIBRARY_COUNT -->',str(len(catalog)+len(atlas)))
for token,filename in [('LAB_CORE','lab-core.js'),('LAB_UI','lab-ui.js'),('LAB_STYLES','lab.css'),('JOURNEY_SCRIPT','journey.js'),('JOURNEY_STYLES','journey.css'),('ATLAS_UX','atlas-ux.js'),('ATLAS_STYLES','atlas-ux.css')]:
    shell=shell.replace('/* '+token+' */',(ROOT/'source'/filename).read_text(encoding='utf-8'))
for name in ['dna','history','experiments','teaser','atlas']:
    shell=shell.replace('<!-- '+name.upper()+'_PANEL -->',(ROOT/'source/panels'/f'{name}.html').read_text(encoding='utf-8'))
notice=(ROOT/'THIRD_PARTY_NOTICES.md').read_text(encoding='utf-8')
shell=shell.replace('<head>','<!--\n'+notice+'\n-->\n<head>',1)
(ROOT/'index.html').write_text(shell,encoding='utf-8')
print(f'Assembled WildFrame with {len(catalog)+len(atlas)} library recipes and {len(catalog)+len(atlas)+len(experiments["recipes"])} sphere images.')
