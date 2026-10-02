# -*- coding: utf-8 -*-

p = r'e2e/smoke.spec.ts'
with open(p,'r',encoding='utf-8',errors='replace') as f:
    s=f.read()
s=s.replace('cartÃ³n','cartón')
s=s.replace('condiciÃ³n','condición')
s=s.replace('EstadÃ­sticas','Estadísticas')
s=s.replace('Ã³','ó').replace('Ã¡','á').replace('Ã©','é').replace('Ã­','í').replace('Ãº','ú').replace('Ã±','ñ')
with open(p,'w',encoding='utf-8') as f:
    f.write(s)
print('ok')
