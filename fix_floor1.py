from pathlib import Path
p = Path('app/utils/Floor1SVG.jsx')
txt = p.read_text('utf-8')
repls = [
    ('<svg','<Svg'),
    ('</svg>','</Svg'),
    ('<g','<G'),
    ('</g>','</G'),
    ('<path','<Path'),
    ('</path>','</Path'),
    ('<rect','<Rect'),
    ('</rect>','</Rect'),
    ('<circle','<Circle'),
    ('</circle>','</Circle'),
    (' stroke-width=',' strokeWidth='),
    (' stroke-dasharray=',' strokeDasharray=')
]
for o,n in repls:
    txt = txt.replace(o,n)
p.write_text(txt,'utf-8')
print('Floor1SVG updated')
