"""Optional maintainer audit: parse the original as data, never import/execute it."""
import ast
import json
from pathlib import Path
import re
root = Path(__file__).resolve().parents[1]
source = ast.parse((root / 'palette-source/COLOUR_CONSTANTS.py.txt').read_text())
pairs = []
for node in source.body:
    if not isinstance(node, ast.Assign):
        continue
    if isinstance(node.value, ast.Dict):
        pairs.extend((ast.literal_eval(k), ast.literal_eval(v)) for k, v in zip(node.value.keys, node.value.values))
    elif isinstance(node.value, ast.Constant) and isinstance(node.value.value, str):
        pairs.extend((t.id, node.value.value) for t in node.targets if isinstance(t, ast.Name))
expected = list(dict.fromkeys((name, '#' + value.lstrip('#').lower()) for name, value in pairs if re.fullmatch('#?[0-9a-fA-F]{6}', value)))
js = (root / 'src/main/resources/static/palettes.js').read_text()
actual = json.loads(js.split('const namedEntries = ', 1)[1].split(';', 1)[0])
assert actual == [list(pair) for pair in expected], 'A source name/hex pair was omitted or changed'
assert len(actual) == 320
assert len(set(pair[1] for pair in actual)) == 317
print('PASS: all source colours preserved without executing source Python')
