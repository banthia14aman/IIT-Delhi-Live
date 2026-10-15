"""Fetch openly licensed photos for IITD Live listings. Runs in GitHub Actions
(the dev container has no access to image hosts).

  python tools/fetch_images.py candidates   # contact sheets -> tools/candidates/
  python tools/fetch_images.py final        # picks -> site/assets/img/*.webp + credits.json

Source: the Wikimedia Commons API (keyless; CC0 / public domain / CC BY / CC BY-SA only).
An Openverse helper is kept for reference but times out from GitHub's runners.
"""
import io, json, sys, time, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps

ROOT = Path(__file__).resolve().parent.parent
UA = {"User-Agent": "IITDLive-class-project/1.0 (https://github.com/banthia14aman/IIT-Delhi-Live)"}
# CC0 / PDM / BY / BY-SA only: free for commercial use and modification.
OK_LICENCES = {"cc0", "pdm", "by", "by-sa"}


def get(url, timeout=15):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def openverse(q, n=8):
    url = "https://api.openverse.org/v1/images/?" + urllib.parse.urlencode(
        {"q": q, "license": ",".join(sorted(OK_LICENCES)), "page_size": n, "mature": "false"})
    try:
        data = json.loads(get(url))
    except Exception as e:  # rate limit or outage: fewer candidates, not a failed run
        print("openverse failed", q, e)
        return []
    out = []
    for r in data.get("results", []):
        out.append({
            "src": "openverse", "id": r["id"], "title": r.get("title") or "",
            "creator": r.get("creator") or "Unknown", "license": r.get("license"),
            "license_version": r.get("license_version") or "",
            "page": r.get("foreign_landing_url") or "", "full": r.get("url"),
            "thumb": r.get("thumbnail") or r.get("url"),
            "w": r.get("width") or 0, "h": r.get("height") or 0,
        })
    return out


def commons(q, n=8):
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({
        "action": "query", "format": "json", "generator": "search", "gsrnamespace": 6,
        "gsrsearch": f"{q} filetype:bitmap", "gsrlimit": n, "prop": "imageinfo",
        "iiprop": "url|extmetadata|size", "iiurlwidth": 1600})
    try:
        pages = json.loads(get(url)).get("query", {}).get("pages", {})
    except Exception as e:
        print("commons failed", q, e)
        return []
    out = []
    for p in pages.values():
        ii = (p.get("imageinfo") or [{}])[0]
        md = ii.get("extmetadata", {})
        lic = (md.get("LicenseShortName", {}).get("value") or "").lower()
        if not any(k in lic for k in ("cc0", "public domain", "cc by")) or "nc" in lic or "nd" in lic:
            continue
        artist = md.get("Artist", {}).get("value", "Unknown")
        artist = __import__("re").sub("<[^>]+>", "", artist).strip()[:80] or "Unknown"
        out.append({
            "src": "commons", "id": p["title"], "title": p["title"].removeprefix("File:"),
            "creator": artist, "license": lic, "license_version": "",
            "page": ii.get("descriptionurl", ""), "full": ii.get("thumburl") or ii.get("url"),
            "thumb": ii.get("thumburl") or ii.get("url"),
            "w": ii.get("width", 0), "h": ii.get("height", 0),
        })
    return out


def load_thumb(c):
    """Openverse's thumbnail proxy can be slow; fall back to the original file."""
    for url in dict.fromkeys([c["thumb"], c["full"]]):
        try:
            im = Image.open(io.BytesIO(get(url, 20))).convert("RGB")
            im.thumbnail((720, 720))
            return im
        except Exception:
            continue
    return None


def sheet(cands, path):
    """Numbered 4-column contact sheet so a reviewer can pick by index."""
    cell_w, cell_h, cols = 360, 240, 4
    rows = (len(cands) + cols - 1) // cols
    img = Image.new("RGB", (cell_w * cols, cell_h * max(rows, 1)), "white")
    d = ImageDraw.Draw(img)
    with ThreadPoolExecutor(16) as pool:
        thumbs = list(pool.map(load_thumb, cands))
    for i, (c, im) in enumerate(zip(cands, thumbs)):
        x, y = (i % cols) * cell_w, (i // cols) * cell_h
        if im is None:
            d.text((x + 10, y + 100), "load failed", fill="red")
        else:
            img.paste(ImageOps.fit(im, (cell_w - 6, cell_h - 6)), (x + 3, y + 3))
        d.rectangle([x + 3, y + 3, x + 60, y + 33], fill="black")
        d.text((x + 10, y + 8), f"#{i}", fill="yellow")
    img.save(path, quality=72)


def candidates():
    queries = json.loads((ROOT / "tools/image-queries.json").read_text())
    outdir = ROOT / "tools/candidates"
    outdir.mkdir(parents=True, exist_ok=True)
    start = time.time()
    for key, qs in queries.items():
        if (outdir / f"{key}.json").exists():  # only fetch new categories
            continue
        if time.time() - start > 20 * 60:  # commit what we have; the next run picks up the rest
            print("time budget reached, stopping before", key)
            break
        seen, cands = set(), []
        for q in qs:
            # Openverse times out from GitHub's runners; Commons is fast and every file carries its licence.
            for c in commons(q, 14):
                if c["full"] and c["full"] not in seen and min(c["w"] or 0, c["h"] or 0) >= 800:
                    seen.add(c["full"])
                    cands.append(c)
            time.sleep(1)  # stay under anonymous rate limits
        cands = cands[:16]
        (outdir / f"{key}.json").write_text(json.dumps(cands, indent=1))
        sheet(cands, outdir / f"{key}.jpg")
        print(key, len(cands))


def final():
    picks = json.loads((ROOT / "tools/image-picks.json").read_text())
    outdir = ROOT / "site/assets/img"
    outdir.mkdir(parents=True, exist_ok=True)
    credits, failed = [], []
    for key, ref in picks.items():  # ref = "<category>#<index>"
        cat, idx = ref.split("#")
        c = json.loads((ROOT / f"tools/candidates/{cat}.json").read_text())[int(idx)]
        try:
            im = Image.open(io.BytesIO(get(c["full"], 60))).convert("RGB")
        except Exception as e:
            failed.append(key)
            print("FAILED", key, e)
            continue
        for suffix, width in (("", 1280), ("-sm", 560)):
            w = min(width, im.width)
            im.resize((w, round(im.height * w / im.width)), Image.LANCZOS).save(
                outdir / f"{key}{suffix}.webp", "WEBP", quality=70, method=6)
        credits.append({"key": key, "title": c["title"], "creator": c["creator"],
                        "license": c["license"], "license_version": c["license_version"],
                        "page": c["page"], "source": c["src"]})
        time.sleep(0.5)
    (outdir / "credits.json").write_text(json.dumps(credits, indent=1, ensure_ascii=False))
    print("done", len(credits), "failed", failed)


if __name__ == "__main__":
    {"candidates": candidates, "final": final}[sys.argv[1]]()
