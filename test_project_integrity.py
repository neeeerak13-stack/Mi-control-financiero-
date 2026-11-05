from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "index.html").read_text(encoding="utf-8")
ENGINE = (ROOT / "finance-engine.js").read_text(encoding="utf-8")
WORKFLOW = (ROOT / ".github/workflows/build-apk.yml").read_text(encoding="utf-8")


def test_required_android_inputs_exist():
    for name in (
        "index.html",
        "manifest.json",
        "service-worker.js",
        "styles.css",
        "finance-engine.js",
        "icon-192.png",
        "icon-512.png",
    ):
        path = ROOT / name
        assert path.is_file() and path.stat().st_size > 0, name


def test_nilo_design_is_present():
    assert "nilo" in HTML.lower()
    assert "Nilo" in HTML or "nilo" in HTML
    assert "finance-engine.js" in HTML
    assert "styles.css" in HTML


def test_core_finance_logic_present():
    assert "function load()" in ENGINE
    assert "function showApp()" in ENGINE
    assert "function monthTotals()" in ENGINE or "monthTotals" in ENGINE
    assert "mcf_profile_data_" in ENGINE or "PROFILES_KEY" in ENGINE
    assert "bindEngine" in ENGINE


def test_android_workflow_is_debug_only():
    assert 'appId": "com.micontrolfinanciero.preview"' in WORKFLOW
    assert "assembleDebug" in WORKFLOW
    assert "assembleRelease" not in WORKFLOW
    assert "upload-artifact@v4" in WORKFLOW


def test_service_worker_cache_is_nilo():
    sw = (ROOT / "service-worker.js").read_text(encoding="utf-8")
    assert "mcf-nilo-v1" in sw
    assert "event.request.method !== \"GET\"" in sw or "event.request.method!=='GET'" in sw
    assert "caches.delete" in sw


def test_manifest_points_to_index():
    man = (ROOT / "manifest.json").read_text(encoding="utf-8")
    assert "index.html" in man
    assert "Mi Control" in man
