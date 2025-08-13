// api/normalize.js (CommonJS)
// Converts phrases like "tomorrow at 11am" into ISO start/end (15m by default)
// No external deps. Works with a provided IANA time zone.

function toTZNow(tz) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour12: false,
    year:'numeric', month:'2-digit', day:'2-digit',
    hour:'2-digit', minute:'2-digit', second:'2-digit'
  }).formatToParts(now).reduce((a,p)=>{ a[p.type]=p.value; return a; },{});
  return new Date(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`);
}

function pad2(n){ return String(n).padStart(2,'0'); }

function parseTime(text) {
  const m = String(text||'').toLowerCase().match(/(\b\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
  if (!m) return null;
  let h = parseInt(m[1],10);
  const min = m[2] ? parseInt(m[2],10) : 0;
  const ampm = m[3];
  if (ampm === 'am' && h === 12) h = 0;
  if (ampm === 'pm' && h < 12) h += 12;
  return { hour:h, minute:min };
}

function nextWeekday(base, targetIdx) {
  const d = new Date(base);
  const cur = d.getDay();
  let delta = (targetIdx - cur + 7) % 7;
  if (delta === 0) delta = 7; // "next" = strictly future
  d.setDate(d.getDate() + delta);
  return d;
}

function parseRelativeDate(base, text) {
  const low = String(text||'').toLowerCase();

  if (/\btoday\b/.test(low)) return new Date(base);
  if (/\btomorrow\b/.test(low)) { const d = new Date(base); d.setDate(d.getDate()+1); return d; }

  const wds = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const wd = wds.find(w => new RegExp(`\\bnext\\s+${w}\\b`).test(low));
  if (wd) return nextWeekday(base, wds.indexOf(wd));

  const iso = low.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) return new Date(`${iso[1]}-${iso[2]}-${iso[3]}T00:00:00`);

  const mdY = low.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/);
  if (mdY) {
    let y = parseInt(mdY[3],10); if (y<100) y+=2000;
    return new Date(y, parseInt(mdY[1],10)-1, parseInt(mdY[2],10));
  }

  const md = low.match(/\b(\d{1,2})[\/\-](\d{1,2})\b/);
  if (md) return new Date(base.getFullYear(), parseInt(md[1],10)-1, parseInt(md[2],10));

  return new Date(base);
}

module.exports = (req, res) => {
  try {
    const input = (req.query.input || '').toString();
    const timeZone = (req.query.timeZone || 'America/New_York').toString();
    const durationMinutes = parseInt(req.query.durationMinutes || '15', 10);

    const base = toTZNow(timeZone);
    const day = parseRelativeDate(base, input);
    const t = parseTime(input) || { hour: 9, minute: 0 };

    const start = new Date(day);
    start.setHours(t.hour, t.minute, 0, 0);

    const curYear = base.getFullYear();
    if (start.getFullYear() < curYear) start.setFullYear(curYear);

    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

    const iso = d => `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:00`;

    const humanReadable = start.toLocaleString('en-US', {
      timeZone, weekday:'long', year:'numeric', month:'long', day:'numeric',
      hour:'numeric', minute:'2-digit'
    });

    res.status(200).json({
      startDateTime: iso(start),
      endDateTime: iso(end),
      timeZone,
      humanReadable
    });
  } catch (e) {
    res.status(500).json({ error: e && e.message ? e.message : 'normalize failed' });
  }
};

