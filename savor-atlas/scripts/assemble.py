"""Assemble the standalone Savor Atlas cooking site. No framework or bundler."""
from pathlib import Path
import json

root = Path(__file__).resolve().parent.parent
source = root / 'source'
data = (source / 'recipes.json').read_text(encoding='utf-8')
json.loads(data)
data = data.replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')
home = (source / 'index.template.html').read_text(encoding='utf-8')
motion = (source / 'motion-preference.js').read_text(encoding='utf-8')
home = home.replace('/* MOTION_PREFERENCE */', motion)
for token, filename in [('HOME_CSS', 'home.css'), ('HOME_JS', 'home.js'), ('SPHERE_JS', 'sphere.js')]:
    home = home.replace('/* ' + token + ' */', (source / filename).read_text(encoding='utf-8'))
home = home.replace('/* RECIPE_DATA */', 'const recipeData=' + data + ';')
(root / 'index.html').write_text(home, encoding='utf-8')
table = (source / 'kitchen.template.html').read_text(encoding='utf-8')
table = table.replace('/* MOTION_PREFERENCE */', motion)
table = table.replace('/* RECIPE_DATA */', 'const recipeMenu=' + data + ';')
app = (source / 'table-app.js').read_text(encoding='utf-8').replace('/* COOKING_ADAPTER */', (source / 'cooking-adapter.js').read_text(encoding='utf-8'))
table = table.replace('/* TABLE_APP */', app)
(root / 'kitchen' / 'index.html').write_text(table, encoding='utf-8')
print(f'Assembled Savor Atlas: {len(json.loads(data)["dishes"])} recipes, 60 food cards.')
