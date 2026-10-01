from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
import json
base=Path(__file__).resolve().parent.parent/'outputs'
folder=base/'Glacia Authenticator v0.4.3'
output=base/'Glacia-Authenticator-Windows-v0.4.3.zip'
with ZipFile(output,'w',compression=ZIP_DEFLATED,compresslevel=6) as z:
 for p in sorted(folder.rglob('*')):
  if p.is_file():
   if p.name in ['vault.winterbell','links.txt','preferences.json','google-sync.secure','remembered-login.secure','remembered-login.secure.tmp','preview-cloud.js','preview-cloud.html']:
    raise ValueError('Unexpected user data in packaged output')
   z.write(p,p.relative_to(base))
with ZipFile(output) as z:
 if z.testzip() is not None:raise ValueError('ZIP verification failed')
 assert 'Glacia Authenticator v0.4.3/Glacia Authenticator.exe' in z.namelist()
print(json.dumps({'archive':str(output),'bytes':output.stat().st_size,'files':len(z.namelist())}))
