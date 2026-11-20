// sr.js — OFP navlog의 SR(Shear Rate) 값 추출
// navlog 한 기록의 첫 줄(DIST·위도·MC·FL·…·WIND/COMP·SR·TAS·ZT·B/O)은 "이전 지점 → 이 지점" 구간 값이다.
// 업로드한 OFP마다 새로 읽는다 (특정 편명·노선에 고정된 값 없음)

export const SR_LIMIT = 5; // 사용자 기준: SR 5 이상 구간 표시

export function parseSr(T) {
  const r = { warnings: [], legs: [], segs: [], max: null, maxLegs: [], ok: false };
  const start = T.findIndex(t => /^DIST\s+LATITUDE\s+MC/.test(t));
  if (start < 0) { r.warnings.push('항법기록(navlog)을 찾지 못했습니다.'); return r; }

  let prev = null, curFir = null;
  for (let i = start + 1; i < T.length; i++) {
    const t = T[i].trim();
    if (/^ROUTE TO ALTN/.test(t) || /^END OF JEPPESEN/.test(t)) break; // 본 navlog만 (REFILE navlog 제외)
    const a = /^(\d{4})\s+[NS]\d{2}\s+\d{2}\.\d\s+\d{3}\s+(\S+)\s+\S+\s+(\d{4})\s+(\d{2})\s+(.*)$/.exec(t);
    if (!a) continue;
    // 두 번째 줄: "IKEKA E123 21.3 253 / 47 398 00.30 0144/"
    let j = i + 1; while (j < T.length && j < i + 4 && !/^\S+\s+[EW]\d{3}\s+\d{2}\.\d/.test(T[j].trim())) j++;
    const b = /^(\S+)\s+[EW]\d{3}\s+\d{2}\.\d\b.*?(\d{2})\.(\d{2})\s+\d{4}\/$/.exec((T[j] || '').trim());
    if (!b) continue;
    // 첫 줄 뒷부분: WIND/COMP(공백 포함 가능: "21020 000") · SR · TAS · ZT · B/O → 끝에서부터 읽는다
    const tk = a[5].trim().split(/\s+/);
    if (tk.length < 5) { i = j; continue; }
    const srTok = tk[tk.length - 4], tasTok = tk[tk.length - 3];
    const wind = tk.slice(0, tk.length - 4).join(' ');
    const c = (T[j + 1] || '').trim();
    const fm = /^\/\s*([A-Z]{4}) FIR\b/.exec(c);
    if (fm) curFir = fm[1];
    let name = b[1];
    if (name === 'FIR') name = `${curFir || ''} FIR 경계`;
    const leg = {
      from: prev, to: name, dist: +a[1], fl: /^\d{3}$/.test(a[2]) ? +a[2] : null, phase: /^\d{3}$/.test(a[2]) ? 'CRZ' : a[2],
      sr: /^\d{1,2}$/.test(srTok) ? +srTok : null, tas: /^\d{3}$/.test(tasTok) ? +tasTok : null,
      wind: /^\.+$/.test(wind) ? '' : wind, cum: +b[2] * 60 + +b[3], fir: curFir,
    };
    r.legs.push(leg);
    prev = name;
    i = j;
  }
  if (!r.legs.length) { r.warnings.push('navlog 구간을 읽지 못했습니다.'); return r; }
  const withSr = r.legs.filter(l => l.sr != null);
  if (!withSr.length) { r.warnings.push('navlog에서 SR 값을 찾지 못했습니다.'); return r; }

  // 최대 SR 지점 (같은 값이면 모두)
  r.max = Math.max(...withSr.map(l => l.sr));
  r.maxLegs = withSr.filter(l => l.sr === r.max);

  // SR ≥ 기준 연속 구간 묶기
  let cur = null;
  for (const l of r.legs) {
    if (l.sr != null && l.sr >= SR_LIMIT) {
      if (!cur) { cur = { from: l.from, legs: [] }; r.segs.push(cur); }
      cur.legs.push(l);
    } else cur = null;
  }
  for (const s of r.segs) {
    s.to = s.legs[s.legs.length - 1].to;
    s.max = Math.max(...s.legs.map(l => l.sr));
    s.dist = s.legs.reduce((x, l) => x + l.dist, 0);
    const i0 = r.legs.indexOf(s.legs[0]);
    s.cumFrom = i0 > 0 ? r.legs[i0 - 1].cum : 0;
    s.cumTo = s.legs[s.legs.length - 1].cum;
    s.fls = [...new Set(s.legs.map(l => l.fl ?? l.phase))];
  }
  r.ok = true;
  return r;
}
