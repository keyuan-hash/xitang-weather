"""Offline subject extraction for the four locally composed weather scenes.

Optional asset-authoring environment: pip install 'rembg[cpu]==2.0.69'.
The app itself needs only npm install. Original reference files are never edited.
"""
from pathlib import Path
from PIL import Image, ImageOps
from rembg import remove, new_session

root = Path(__file__).resolve().parents[1]
output = root / '.asset-work' / 'cutouts'
output.mkdir(parents=True, exist_ok=True)
session = new_session('isnet-general-use', providers=['CPUExecutionProvider'])
for name in ['sitting', 'shelter', 'alert', 'hot']:
    source = root / 'src/assets/xitang/placeholders' / f'{name}.jpeg'
    target = output / f'{name}.png'
    if target.exists():
        continue
    picture = ImageOps.exif_transpose(Image.open(source)).convert('RGB')
    cutout = remove(picture, session=session)
    cutout = cutout.crop(cutout.getbbox())
    if name == 'hot':
        cutout = cutout.rotate(90, expand=True)
    cutout.save(target)
    print(f'{name}: {cutout.size}', flush=True)
