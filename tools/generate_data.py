#!/usr/bin/env python
"""Generate the static archive-guide data from the production CSV.

Usage:
  python tools/generate_data.py
  python tools/generate_data.py --catalog path/to/catalog.csv --drive-index path/to/drive-index.json
"""
from __future__ import annotations
import argparse,csv,json,re
from collections import Counter
from datetime import date
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
FOLDER_LABELS={
 "01_ילדות_ומשפחה":"ילדות ומשפחה",
 "02_עלייה_וישראל":"עלייה וחיים בישראל",
 "03_שירות_צבאי_וחברים":"שירות צבאי וחברים",
 "04_הלוויה_והשבעה":"הלוויה והשבעה",
 "05_הנצחה_והקבר":"הנצחה והקבר",
 "06_מורשת_והשפעה":"מורשת והשפעה",
 "07_סרטים_וכתבות_לרישוי":"סרטים וכתבות לרישוי",
}

def rights_group(value:str)->str:
 if "פתוח" in value: return "open"
 if "מסחרי" in value: return "commercial"
 if "משפחה" in value: return "family"
 if "לא אומת" in value or "לפי פריט" in value: return "verify"
 return "permission"

def media_group(value:str)->str:
 if "אודיו" in value: return "audio"
 if any(x in value for x in ("וידאו","סרט","דוקומנטרי","שידור","טקס")): return "video"
 if any(x in value for x in ("צילום","תצלום","תמונות","גלריה","סטילס")): return "stills"
 return "web"

def load_rows(path:Path):
 with path.open(encoding="utf-8-sig",newline="") as f: return list(csv.DictReader(f))

def main():
 ap=argparse.ArgumentParser()
 ap.add_argument("--catalog",type=Path,default=ROOT/"source"/"catalog.csv")
 ap.add_argument("--drive-index",type=Path,default=ROOT/"source"/"drive-index.json")
 ap.add_argument("--output",type=Path,default=ROOT/"data"/"archive.json")
 args=ap.parse_args()
 rows=load_rows(args.catalog); drive=json.loads(args.drive_index.read_text(encoding="utf-8"))
 if len(rows)!=72: raise SystemExit(f"expected 72 rows, got {len(rows)}")
 ids=[r["מזהה"].strip() for r in rows]; urls=[r["קישור"].strip() for r in rows]
 if len(set(ids))!=len(ids): raise SystemExit("duplicate item IDs")
 if len(set(urls))!=len(urls): raise SystemExit("duplicate source URLs")
 items=[]
 for r in rows:
  item_id=r["מזהה"].strip(); folder=r["תיקייה"].strip()
  items.append({
   "id":item_id,
   "section":folder,
   "sectionLabel":FOLDER_LABELS.get(folder,folder),
   "period":r["תקופה"].strip(),
   "title":r["כותרת"].strip(),
   "mediaType":r["סוג חומר"].strip(),
   "mediaGroup":media_group(r["סוג חומר"]),
   "description":r["מה רואים / ערך תיעודי"].strip(),
   "source":r["מקור"].strip(),
   "rightsOwner":r["בעלים / בעל זכויות משוער"].strip(),
   "date":r["תאריך"].strip(),
   "rightsStatus":r["סטטוס זכויות"].strip(),
   "rightsGroup":rights_group(r["סטטוס זכויות"]),
   "nextAction":r["הפעולה הבאה"].strip(),
   "sourceUrl":r["קישור"].strip(),
   "driveUrl":drive["items"].get(item_id),
  })
 if any(not i["driveUrl"] for i in items):
  missing=[i["id"] for i in items if not i["driveUrl"]]; raise SystemExit(f"missing Drive handles: {missing}")
 payload={
  "meta":{
   "title":"מייקל לוין — מדריך חומרי גלם",
   "subject":"סמ״ר מייקל (מיכאל) לוין ז״ל",
   "catalogDate":"2026-08-11",
   "generatedAt":date.today().isoformat(),
   "total":len(items),
   "openLicensed":sum(i["rightsGroup"]=="open" for i in items),
   "driveRoot":drive["root"],
   "guidePdf":drive["guidePdf"],
   "rightsMap":drive["rightsMap"],
   "sections":[{"id":k,"label":v,"count":sum(i["section"]==k for i in items),"driveUrl":drive["folders"].get(k)} for k,v in FOLDER_LABELS.items()],
   "rightsCounts":dict(Counter(i["rightsGroup"] for i in items)),
   "mediaCounts":dict(Counter(i["mediaGroup"] for i in items)),
  },
  "items":items,
 }
 args.output.parent.mkdir(parents=True,exist_ok=True)
 args.output.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print(json.dumps({"output":str(args.output),"items":len(items),"open":payload["meta"]["openLicensed"]},ensure_ascii=False))
if __name__=="__main__": main()
