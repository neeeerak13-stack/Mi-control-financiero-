from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
ANDROID_RES = ROOT / "android" / "app" / "src" / "main" / "res"
FOREGROUND = ROOT / "resources-icon-foreground.png"
FULL_ICON = ROOT / "resources-icon.png"

if not ANDROID_RES.exists():
    raise SystemExit("No existe android/app/src/main/res. Ejecuta primero: npx cap add android")

sizes = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
try:
    from PIL import Image
except ImportError as exc:
    raise SystemExit("Falta Pillow en el entorno de compilación") from exc

full = Image.open(FULL_ICON).convert("RGBA")
foreground = Image.open(FOREGROUND).convert("RGBA")

for density, size in sizes.items():
    folder = ANDROID_RES / f"mipmap-{density}"
    folder.mkdir(parents=True, exist_ok=True)
    full.resize((size, size), Image.Resampling.LANCZOS).save(folder / "ic_launcher.png")
    full.resize((size, size), Image.Resampling.LANCZOS).save(folder / "ic_launcher_round.png")
    fg_size = int(size * 2.25)
    foreground.resize((fg_size, fg_size), Image.Resampling.LANCZOS).save(folder / "ic_launcher_foreground.png")

adaptive = ANDROID_RES / "mipmap-anydpi-v26"
adaptive.mkdir(parents=True, exist_ok=True)
xml = '''<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
'''
(adaptive / "ic_launcher.xml").write_text(xml, encoding="utf-8")
(adaptive / "ic_launcher_round.xml").write_text(xml, encoding="utf-8")
values = ANDROID_RES / "values"
values.mkdir(parents=True, exist_ok=True)
color = '''<?xml version="1.0" encoding="utf-8"?>
<resources><color name="ic_launcher_background">#070908</color></resources>
'''
(values / "ic_launcher_background.xml").write_text(color, encoding="utf-8")
print("Iconos Android de Nilo aplicados.")
