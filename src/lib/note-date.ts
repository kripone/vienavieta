// Atpazīst dienu un laiku brīvā piezīmes tekstā („jātiekas sestdien 2”, „rīt 18:30”, „15.11. plkst. 14”),
// lai favorītos piedāvātu pievienot notikumu kalendāram. Strādā pārlūkā, neko nesūta uz serveri.

export type NoteDate = { start: Date; allDay: boolean };

// nedēļas dienas (0 = svētdiena) pēc vārda saknes: LV, LT, RU, EN
const WEEKDAYS: [RegExp, number][] = [
  [/pirmdien|pirmadien|понедельник|monday/, 1],
  [/otrdien|antradien|вторник|tuesday/, 2],
  [/trešdien|tresdien|trečiadien|сред[уаы]|wednesday/, 3],
  [/ceturtdien|ketvirtadien|четверг|thursday/, 4],
  [/piektdien|penktadien|пятниц|friday/, 5],
  [/sestdien|šeštadien|суббот|saturday/, 6],
  [/svētdien|svetdien|sekmadien|воскресень|sunday/, 0],
];
const RELATIVE: [RegExp, number][] = [
  [/parīt|parit|послезавтра|poryt|day after tomorrow/, 2],
  [/rītdien|послезавтра/, 1],
  [/(?<![\p{L}])(rīt|rit|завтра|rytoj|tomorrow)(?![\p{L}])/u, 1],
  [/šodien|sodien|сегодня|šiandien|today|šovakar|sovakar/, 0],
];
const MONTHS = ["janv", "febr", "mart", "apr", "maij", "jūn", "jūl", "aug", "sept", "okt", "nov", "dec"];

/** Laiks tekstā aiz dienas: „14:30”, „plkst. 14”, „в 15”, vai skaitlis uzreiz aiz dienas vārda („sestdien 2” → 14:00). */
function findTime(rest: string): [number, number] | null {
  let m = /(?<!\d)([01]?\d|2[0-3])[:.]([0-5]\d)(?![\d.])/.exec(rest);
  if (m) return [Number(m[1]), Number(m[2])];
  m = /(?:plkst\.?|pulksten|pl\.|в|at|@)\s*([01]?\d|2[0-3])(?![\d.:])/u.exec(rest) ?? /^[\p{L}]*[\s,]*(?:ap\s+|uz\s+)?([01]?\d|2[0-3])(?![\d.:])/u.exec(rest);
  if (!m) return null;
  const h = Number(m[1]);
  // „sestdien 2” gandrīz vienmēr nozīmē pēcpusdienu
  return [h >= 1 && h <= 7 ? h + 12 : h, 0];
}

export function parseNoteDate(text: string, now = new Date()): NoteDate | null {
  const s = text.toLowerCase();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let day: Date | null = null;
  let at = -1;

  // datums: 15.11. / 15.11.2026 / 15. novembrī
  const d1 = /(?<!\d)([0-3]?\d)\.([01]?\d)\.(20\d\d)?/.exec(s);
  const d2 = new RegExp(`(?<!\\d)([0-3]?\\d)\\.?\\s*(${MONTHS.join("|")})`).exec(s);
  if (d1 && Number(d1[2]) >= 1 && Number(d1[2]) <= 12 && Number(d1[1]) >= 1 && Number(d1[1]) <= 31) {
    day = new Date(d1[3] ? Number(d1[3]) : today.getFullYear(), Number(d1[2]) - 1, Number(d1[1]));
    if (!d1[3] && day < today) day.setFullYear(day.getFullYear() + 1);
    at = d1.index + d1[0].length;
  } else if (d2 && Number(d2[1]) >= 1 && Number(d2[1]) <= 31) {
    day = new Date(today.getFullYear(), MONTHS.indexOf(d2[2]), Number(d2[1]));
    if (day < today) day.setFullYear(day.getFullYear() + 1);
    at = d2.index + d2[0].length;
  }
  if (!day) for (const [re, add] of RELATIVE) {
    const m = re.exec(s);
    if (m) { day = new Date(today); day.setDate(day.getDate() + add); at = m.index + m[0].length; break; }
  }
  if (!day) for (const [re, wd] of WEEKDAYS) {
    const m = re.exec(s);
    if (m) {
      // tuvākā šāda diena; ja tā ir šodien, pieņemam šodienu
      day = new Date(today); day.setDate(day.getDate() + ((wd - today.getDay() + 7) % 7)); at = m.index + m[0].length; break;
    }
  }
  if (!day || Number.isNaN(day.getTime())) return null;
  const time = findTime(s.slice(at)) ?? findTime(s.replace(/(?<!\d)[0-3]?\d\.[01]?\d\.(20\d\d)?/, " "));
  if (!time) return { start: day, allDay: true };
  day.setHours(time[0], time[1]);
  return { start: day, allDay: false };
}

const p2 = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}`;
const stamp = (d: Date) => `${ymd(d)}T${p2(d.getHours())}${p2(d.getMinutes())}00`;

/** Sākums/beigas kalendāra formātā (vietējais laiks; notikums ar laiku ilgst 1 stundu). */
function range(e: NoteDate) {
  const end = new Date(e.start);
  if (e.allDay) { end.setDate(end.getDate() + 1); return [ymd(e.start), ymd(end)]; }
  end.setHours(end.getHours() + 1);
  return [stamp(e.start), stamp(end)];
}

export function googleCalendarUrl(e: NoteDate, title: string, details: string) {
  const [a, b] = range(e);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${a}/${b}&details=${encodeURIComponent(details)}`;
}

/** .ics fails Apple, Outlook un citiem kalendāriem. */
export function icsFile(e: NoteDate, title: string, details: string, uid: string) {
  const [a, b] = range(e);
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");
  const v = e.allDay ? ";VALUE=DATE" : "";
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//VienaVieta//LV", "BEGIN:VEVENT", `UID:${uid}@vienavieta.lv`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]|\.\d+/g, "")}`, `DTSTART${v}:${a}`, `DTEND${v}:${b}`,
    `SUMMARY:${esc(title)}`, `DESCRIPTION:${esc(details)}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
}
