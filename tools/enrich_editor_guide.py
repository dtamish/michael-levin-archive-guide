#!/usr/bin/env python
from pathlib import Path
import json

p=Path(__file__).resolve().parents[1]/'data'/'archive.json'
d=json.loads(p.read_text(encoding='utf-8'))
meta=d['meta']
meta.update({
  'title':'מייקל לוין — מדריך חומרי גלם לעורך',
  'projectTitle':'מייקל לוין','projectSubtitle':'מדריך חומרי גלם לעורך',
  'metaDescription':'מדריך עריכתי ל-72 מקורות על מייקל לוין: מה רואים, למה זה חשוב לסרט, זכויות וקישורי מקור ו-Drive.',
  'heroLede':'לא עוד רשימת לינקים: לכל מקור מוסבר מה רואים בו, למה הוא רלוונטי לסרט ומה צריך לאמת לפני קאט.',
  'heroRule':'מה רואים · למה זה חשוב · ורק אז פותחים',
  'heroRuleNote':'התיאור חוסך צפייה עיוורת; הוא אינו מחליף אימות shot-by-shot ורישוי.',
  'metricTotalLabel':'מקורות מתוארים','metricSectionLabel':'תחנות בסיפור','metricOpenLabel':'פריטים ברישיון פתוח',
  'metricRouteValue':'2','metricRouteLabel':'נתיבים לכל פריט: מקור + Drive','journeyTitle':'ניווט לפי תקופה',
  'collectionLabel':'פתיחת Drive ↗','itemCollectionLabel':'איתור ב־Drive ↗',
  'startTitle':'חמש דלתות הכניסה החזקות','startIntro':'אם יש לעורך שעה אחת בלבד, מתחילים מכאן.',
  'startLeads':[
    {'title':'משפחה והקרן','description':'ילדות, home movies, חומרים אישיים ו-A Hero in Heaven.','section':'01'},
    {'title':'הבחירה בישראל','description':'עלייה, לימודים, צבא והמעבר מחו״ל לחיים ישראליים.','section':'02'},
    {'title':'חברי גדוד 890','description':'עדויות, תמונות פרטיות והאישיות שמאחורי הסמל.','section':'03'},
    {'title':'הלוויה בהר הרצל','description':'התיעוד המקצועי המרכזי של רגע השבר וההפיכה לסמל ציבורי.','section':'04'},
    {'title':'מורשת והשפעה','description':'17+ שנות הנצחה, חיילים בודדים ופעולה שנולדה מתוך הזיכרון.','section':'06'}]
})
sections={
'01':('החיים לפני ישראל','חומרי ילדות, משפחה והקשר אישי שמציגים את מייקל כאדם לפני שהפך לסמל.','בונה הזדהות ודמות; מתאים לפתיח, פלאשבק ואלבומי משפחה.'),
'02':('הדרך לישראל','עלייה, בחירה בישראל והמעבר אל מסלול החיים והגיוס.','מחבר בין מניע אישי לפעולה ומבסס את קשת הבחירה.'),
'03':('השירות והחברים','חומרים מהצבא ועדויות של מי ששירתו והכירו אותו.','נותן אופי, חברות ועדות ממקור ראשון; גשר מהביוגרפיה אל הסיפור הצבאי.'),
'04':('הנפילה והלוויה','חדשות, סטילס ותיעוד מקצועי של ההלוויה והתגובה הציבורית.','שיא רגשי והיסטורי; ממחיש את היקף האבל והמעבר מאדם פרטי לסמל.'),
'05':('זיכרון והנצחה','טקסים, פרויקטים ופעולות הנצחה לאורך השנים.','מאפשר מונטאז׳ זמן ומראה כיצד הזיכרון נשמר ומשתנה.'),
'06':('מורשת והשפעה','ארגונים, חיילים בודדים ופעולות שנולדו בהשראתו.','מבסס את טענת הסרט שהמורשת הפכה לפעולה ממשית.'),
'07':('סרטים ומקורות־על','סרטים ארוכים, כתבות ומאגרים שמרכזים שכבות רבות של הסיפור.','נקודת כניסה למחקר עמוק, reference לעריכה ומפת דרכים לרישוי נוסף.')}
for s in meta['sections']:
    key=s['id'].split('_',1)[0]
    label,desc,use=sections[key]
    s.update(label=label,description=desc,editorialUse=use)
for x in d['items']:
    key=x['section'].split('_',1)[0]
    desc=x.get('description','')
    group=x.get('mediaGroup')
    clean=' '.join(desc.rstrip('.').split())[:180]
    prefix={'stills':'יכול להמחיש חזותית','video':'עשוי לספק רצף, סינק או שוטים של','audio':'עשוי לספק קול או עדות סביב'}.get(group,'מספק הקשר ומפתח למקורות נוספים סביב')
    x['editorialUse']=f"{prefix}: {clean}. {sections[key][2]}"
    x['relevanceType']='evidence' if key in ('03','04') else ('character' if key in ('01','02') else ('context' if key=='07' else 'story'))
    x['subcategory']=x.get('mediaType')
    if x.get('rightsGroup')=='open':
        x['verificationNote']='הרישיון והמטא־דאטה אומתו. מייקל אינו מופיע בפריט; זהו חומר הקשר בלבד.'
    elif any(k in (x.get('nextAction','')+desc).lower() for k in ['לצפות','shot','לא אומת']):
        x['verificationNote']='מבוסס כותרת/מטא־דאטה ציבורית; נדרשת צפייה מלאה ו-shot list לפני קאט.'
    else:
        x['verificationNote']='מבוסס עמוד המקור והתיאור הפומבי; יש לאמת את הפריט המלא לפני קאט.'
description_overrides={
 'ML-019':'תיעוד טקס זיכרון ליד קברו של מייקל בהר הרצל; מתאים לאיתור רגעי הנצחה ממוסדים.',
 'ML-025':'תיעוד מלא של טקס יום הזיכרון ב־2025, הכולל עדויות, מוזיקה וקהל לפי תיאור המקור.',
 'ML-027':'גרסת הסרט Because of Michael עם כתוביות עברית; שימושית להבנת מבנה הסרט והחומרים שכבר נבחרו.',
 'ML-050':'צילום של מארק לוין, אביו של מייקל, במהלך ההלוויה; פריים משפחתי מתוך רגע הפרידה הציבורי.',
 'ML-063':'צילום של קבר מייקל בהר הרצל; מתאים לרגעי זיכרון, מעבר זמן והמחשת מקום ההנצחה.'}
for x in d['items']:
    if x['id'] in description_overrides:
        x['description']=description_overrides[x['id']]
        key=x['section'].split('_',1)[0];group=x.get('mediaGroup');clean=' '.join(x['description'].rstrip('.').split())[:180]
        prefix={'stills':'יכול להמחיש חזותית','video':'עשוי לספק רצף, סינק או שוטים של','audio':'עשוי לספק קול או עדות סביב'}.get(group,'מספק הקשר ומפתח למקורות נוספים סביב')
        x['editorialUse']=f"{prefix}: {clean}. {sections[key][2]}"
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f"enriched {len(d['items'])} items and {len(meta['sections'])} sections")
