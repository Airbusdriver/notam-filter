// route.js — OFP company route ↔ ATS FPL(15항) 대조 (DOM 없음, 브라우저·Node 공용)
export const ROUTE_VERSION = '1.0.0';

const AWY_RE = /^U?[A-Z]{1,3}\d{1,4}[A-Z]?$/;     // Y697, UM11, OTR7 …
const PROC_RE = /^[A-Z]{3,5}\d{1,2}[A-Z]?$/;       // DEBHI2B, IRNMN2 (경로 처음·끝에서만 절차로 봄)
const ICAO_RE = /^[A-Z]{4}$/;
const SPDLVL_RE = /^([KNM])(\d{3,4})(F\d{3}|A\d{3}|S\d{4}|M\d{4}|VFR)$/;

/* ---------------- 좌표 지점 표기 통일 ---------------- */
// 39N160E · 3930N16000E (ICAO) / N39E160 · N3930E16000 (Jeppesen) → 3900N16000E
export function latlonKey(t) {
  let m = /^(\d{2})(\d{2})?([NS])(\d{3})(\d{2})?([EW])$/.exec(t);
  if (m) return `${m[1]}${m[2] || '00'}${m[3]}${m[4]}${m[5] || '00'}${m[6]}`;
  m = /^([NS])(\d{2})(\d{2})?([EW])(\d{3})(\d{2})?$/.exec(t);
  if (m) return `${m[2]}${m[3] || '00'}${m[1]}${m[5]}${m[6] || '00'}${m[4]}`;
  return null;
}
const isAwy = t => AWY_RE.test(t) && /\d/.test(t) && !latlonKey(t);
const isProc = t => PROC_RE.test(t) && !latlonKey(t);
// navlog 지점 키: ARINC 약식 좌표(39E60, 40N70)는 navlog 위경도로 변환
const dm = (v, w) => { const a = Math.abs(v), d = Math.floor(a + 1e-9), m = Math.round((a - d) * 60); return String(d).padStart(w, '0') + String(m).padStart(2, '0'); };
function navKey(w) {
  const k = latlonKey(w.name) || latlonKey(w.fullName || '');
  if (k) return k;
  if (/^(\d{2}[NESW]\d{2}|\d{4}[NESW])$/.test(w.name) && w.lat != null) return `${dm(w.lat, 2)}${w.lat < 0 ? 'S' : 'N'}${dm(w.lon, 3)}${w.lon < 0 ? 'W' : 'E'}`;
  return w.name;
}

/* ---------------- 속도·고도 표기 ---------------- */
// METER/FEET CONVERSION TABLE (China / Mongolia) — 회사 환산표 그대로
// FL Conversion: 미터 레벨 → ft (WB 180°~359°, EB 360°~179°)
const FL_WB = { 13100: 43000, 12200: 40100, 11600: 38100, 11000: 36100, 10400: 34100, 9800: 32100, 9200: 30100, 8400: 27600, 7800: 25600,
  7200: 23600, 6600: 21700, 6000: 19700, 5400: 17700, 4800: 15700, 4200: 13800, 3600: 11800, 3000: 9800, 2400: 7900, 1800: 5900, 1200: 3900 };
const FL_EB = { 13700: 44900, 12500: 41100, 11900: 39100, 11300: 37100, 10700: 35100, 10100: 33100, 9500: 31100, 8900: 29100, 8100: 26600,
  7500: 24600, 6900: 22600, 6300: 20700, 5700: 18700, 5100: 16700, 4500: 14800, 3900: 12800, 3300: 10800, 2700: 8900, 2100: 6900, 1500: 4900 };
// ALT / HEIGHT Conversion
const ALT_TBL = { 1000: 3300, 900: 3000, 800: 2600, 700: 2300, 600: 2000, 500: 1600, 450: 1500, 400: 1300, 350: 1100, 300: 1000 };
const FT = 3.28084;
const n0 = n => n.toLocaleString('en-US');
export function metricToFeet(m, kind = 'S') {
  if (FL_WB[m]) return { ft: FL_WB[m], tbl: 'WB' };
  if (FL_EB[m]) return { ft: FL_EB[m], tbl: 'EB' };
  if (ALT_TBL[m]) return { ft: ALT_TBL[m], tbl: 'ALT' };
  return { ft: Math.round(m * FT), tbl: null };
}
export function decodeLevel(s) {
  if (!s) return null;
  if (s === 'VFR') return { raw: s, text: 'VFR', fl: null };
  const k = s[0], v = +s.slice(1);
  if (k === 'F') return { raw: s, text: `FL${s.slice(1)}`, fl: v };
  if (k === 'A') return { raw: s, text: `${n0(v * 100)}ft (고도)`, fl: v, alt: true };
  // S: 표준 미터 레벨(10m 단위), M: 미터 고도(10m 단위)
  const m = v * 10, { ft, tbl } = metricToFeet(m, k);
  const fl = Math.round(ft / 100);
  const fls = `FL${String(fl).padStart(3, '0')}`;
  const text = k === 'M'
    ? `${n0(m)}m 고도 ${tbl ? '=' : '≈'} ${n0(ft)}ft${tbl ? '' : ' (계산값)'}`
    : `${n0(m)}m ${tbl ? '=' : '≈'} ${fls} (${n0(ft)}ft${tbl ? '' : ', 표에 없음·계산값'})`;
  return { raw: s, metric: true, m, ft, fl, exact: !!tbl, tbl, text };
}
export function decodeSpeed(s) {
  const k = s[0], v = +s.slice(1);
  if (k === 'N') return { raw: s, text: `${v}kt` };
  if (k === 'M') return { raw: s, text: `M.${String(v).padStart(3, '0').slice(1)}` };
  return { raw: s, text: `${v}km/h (≈${Math.round(v / 1.852)}kt)` };
}
function decodeSL(spec) {
  const m = SPDLVL_RE.exec(spec || ''); if (!m) return null;
  return { raw: spec, spd: decodeSpeed(m[1] + m[2]), lvl: decodeLevel(m[3]) };
}

/* ---------------- 원문 추출 ---------------- */
// OFP 상단 요약 경로: "RKSI..NOPIK Y697 ... DEBH2B EDDF"
export function findCompanyRoute(T, dep, dest) {
  const starts = [];
  T.forEach((t, i) => { if (/^[A-Z]{4}\.\.\S/.test(t) || (dep && t.startsWith(dep + ' '))) starts.push(i); });
  for (const i of starts) {
    let s = T[i];
    if (dep && !s.startsWith(dep)) continue;
    for (let k = i + 1; k < i + 12 && k < T.length; k++) {
      const toks = s.replace(/\.\./g, ' ').trim().split(/\s+/);
      if (dest ? toks[toks.length - 1] === dest : ICAO_RE.test(toks[toks.length - 1]) && toks.length > 2) break;
      const nx = T[k];
      if (/^DIST\b/.test(nx) || !/^[A-Z0-9. /]+$/.test(nx)) break;
      s += /\.\.$/.test(s) ? nx : ' ' + nx;
    }
    const toks = s.replace(/\.\./g, ' ').trim().split(/\s+/);
    if (toks.length >= 3 && (!dest || toks[toks.length - 1] === dest)) return s.replace(/\s+/g, ' ').trim();
  }
  return null;
}
// 모든 ATS FPL 사본의 15항 (사본끼리 다르면 경고용)
export function findFplCopies(T) {
  const out = [];
  T.forEach((t, i) => {
    if (!t.startsWith('(FPL-')) return;
    const fields = []; let cur = t;
    for (let k = i + 1; k < Math.min(T.length, i + 60); k++) {
      const x = T[k];
      if (x.startsWith('(FPL-')) break;
      if (x.startsWith('-')) { fields.push(cur); cur = x.slice(1); } else cur += ' ' + x;
      if (/\)\s*$/.test(x)) break;
      if (fields.length >= 6) break;
    }
    fields.push(cur);
    const ri = fields.findIndex(x => /^[KNM]\d{3,4}(F\d{3}|A\d{3}|S\d{4}|M\d{4}|VFR)\s/.test(x));
    const r = ri >= 0 ? fields[ri] : null;
    const a = ri > 0 && /^[A-Z]{4}\d{4}$/.test(fields[ri - 1].trim()) ? fields[ri - 1] : null;
    const d = ri >= 0 && fields[ri + 1] && /^[A-Z]{4}\d{4}(\s+[A-Z]{4})*\s*$/.test(fields[ri + 1].trim()) ? fields[ri + 1] : null;
    if (r) out.push({ line: i, item15: r.replace(/\s+/g, ' ').trim(), dep: a ? a.trim().slice(0, 4) : null, dest: d ? d.trim().slice(0, 4) : null });
  });
  return out;
}

/* ---------------- 토큰 → 지점 목록 ---------------- */
// 결과: { dep, dest, sid, star, init, pts:[{id, key, via, sl}] }  via = 이 지점으로 들어오는 항로(또는 DCT)
function build(toks, kind, depIn, destIn) {
  const r = { dep: depIn || null, dest: destIn || null, sid: null, star: null, init: null, pts: [], odd: [] };
  toks = toks.slice();
  if (kind === 'fpl') { const m = decodeSL(toks[0]); if (m) { r.init = m; toks.shift(); } }
  if (kind === 'co') {
    if (ICAO_RE.test(toks[0])) r.dep = toks.shift();
    if (ICAO_RE.test(toks[toks.length - 1])) r.dest = toks.pop();
  }
  // SID / STAR
  let i0 = 0; while (toks[i0] === 'DCT') i0++;
  if (toks[i0] && isProc(toks[i0].split('/')[0])) { r.sid = toks[i0]; toks.splice(i0, 1); }
  const lastTok = toks[toks.length - 1];
  if (lastTok && isProc(lastTok.split('/')[0])) r.star = toks.pop();
  let via = null;
  for (const raw of toks) {
    if (raw === 'DCT') { via = 'DCT'; continue; }
    const [id, spec] = raw.split('/');
    if (isAwy(id)) { via = id; continue; }
    if (!/^[A-Z0-9]{2,11}$/.test(id)) { r.odd.push(raw); continue; }
    r.pts.push({ id, key: latlonKey(id) || id, via: r.pts.length ? (via || 'DCT') : (via || (r.sid ? r.sid : 'DCT')), sl: spec ? decodeSL(spec) : null, raw });
    via = null;
  }
  return r;
}
// 같은 항로 안의 중간 지점(step climb/descent 지점 등)을 접어서 골격만 남김
function skeleton(pts) {
  const sk = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], nx = pts[i + 1];
    if (nx && p.via !== 'DCT' && nx.via === p.via && i > 0) { (p.inner = true); }
  }
  let pending = [];
  for (const p of pts) {
    if (p.inner) { pending.push(p); continue; }
    sk.push({ ...p, inners: pending }); pending = [];
  }
  return sk;
}
// 절차명 비교: 같거나, ARINC 6자 약식(DEBH2B ↔ DEBHI2B)
function procMatch(a, b) {
  if (!a && !b) return 'same';
  if (!a || !b) return 'diff';
  if (a === b) return 'same';
  const ta = a.slice(-2), tb = b.slice(-2);
  if (ta !== tb) return 'diff';
  const ba = a.slice(0, -2), bb = b.slice(0, -2);
  const [s, l] = ba.length <= bb.length ? [ba, bb] : [bb, ba];
  if (l.startsWith(s)) return 'abbr';
  let j = 0; for (const c of l) if (c === s[j]) j++;
  return j === s.length && s[0] === l[0] ? 'abbr' : 'diff';
}
// LCS 정렬
function align(A, B) {
  const n = A.length, m = B.length;
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
    dp[i][j] = A[i].key === B[j].key ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out = []; let i = 0, j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && A[i].key === B[j].key) { out.push([A[i++], B[j++]]); }
    else if (j < m && (i >= n || dp[i][j + 1] >= dp[i + 1][j])) out.push([null, B[j++]]);
    else out.push([A[i++], null]);
  }
  return out;
}

/* ---------------- 대조 ---------------- */
// T: 줄 텍스트 배열, ofp: core.parseOFP 결과(navlog·dep/dest 사용)
export function compareRoutes(T, ofp = {}) {
  const res = { ok: false, rows: [], issues: [], notes: [], levels: [] };
  const copies = findFplCopies(T);
  const fpl0 = ofp.item15 ? copies.find(c => c.item15 === ofp.item15.replace(/\s+/g, ' ').trim()) || copies[0] : copies[0];
  const coStr = findCompanyRoute(T, ofp.dep || fpl0?.dep, ofp.dest || fpl0?.dest);
  res.coStr = coStr; res.fplStr = fpl0?.item15 || null;
  if (!coStr) res.issues.push({ kind: 'missing', text: 'OFP의 company route 문자열(예: RKSI..NOPIK …)을 찾지 못했습니다.' });
  if (!fpl0) res.issues.push({ kind: 'missing', text: 'ATS FPL(15항)을 찾지 못했습니다.' });
  if (!coStr || !fpl0) return res;
  const uniq = [...new Set(copies.map(c => c.item15))];
  res.fplCopies = copies.length;
  if (uniq.length > 1) res.issues.push({ kind: 'copies', text: `OFP 안의 ATS FPL 사본 ${copies.length}개 중 15항이 서로 다른 것이 있습니다 (${uniq.length}종). 첫 사본 기준으로 대조했습니다.` });

  const co = build(coStr.replace(/\.\./g, ' DCT ').trim().split(/\s+/), 'co');
  const fp = build(fpl0.item15.split(/\s+/), 'fpl', fpl0.dep, fpl0.dest);
  res.co = co; res.fpl = fp;

  // 공항 / 절차
  const head = [];
  head.push({ label: '출발', co: co.dep, fpl: fp.dep, st: co.dep === fp.dep ? 'ok' : 'bad' });
  const sidM = procMatch(co.sid, fp.sid?.split('/')[0]);
  if (co.sid || fp.sid) head.push({ label: 'SID', co: co.sid || '—', fpl: fp.sid || '—', st: sidM === 'same' ? 'ok' : sidM === 'abbr' ? 'abbr' : 'bad' });
  const starM = procMatch(co.star, fp.star?.split('/')[0]);
  if (co.star || fp.star) head.push({ label: 'STAR', co: co.star || '—', fpl: fp.star || '—', st: starM === 'same' ? 'ok' : starM === 'abbr' ? 'abbr' : 'bad' });
  head.push({ label: '목적지', co: co.dest, fpl: fp.dest, st: co.dest === fp.dest ? 'ok' : 'bad' });
  res.head = head;

  // 경로 지점
  const nav = (ofp.wpts || []).map(w => ({ ...w, key: navKey(w) }));
  const navIdx = k => nav.findIndex(w => w.key === k);
  const sa = skeleton(co.pts.map(p => ({ ...p }))), sb = skeleton(fp.pts.map(p => ({ ...p })));
  const pairs = align(sa, sb);
  let prevA = null, prevB = null;
  for (const [a, b] of pairs) {
    const row = { co: a, fpl: b, st: 'ok', msg: [] };
    if (a && b) {
      const va = a.via, vb = b.via;
      const sameVia = va === vb || (prevA && prevB && prevA.key === prevB.key && va === vb);
      if (!prevA !== !prevB) { /* 첫 지점 이전 정렬 깨짐 */ }
      if (va !== vb) {
        // 첫 지점: company는 DCT, FPL은 SID 이름일 수 있음
        const first = !prevA && !prevB;
        const viaIsProc = x => x === co.sid || x === fp.sid;
        if (first && (viaIsProc(va) || viaIsProc(vb) || va === 'DCT' || vb === 'DCT')) row.msg.push('첫 지점 진입 방식 표기 차이');
        else { row.st = 'bad'; row.msg.push(`항로 다름: company ${va} / FPL ${vb}`); }
      }
      if (prevA && prevB && prevA.key !== prevB.key && !sameVia) { /* 이미 불일치 행에서 표시됨 */ }
      // FPL에만 있는 같은 항로 내 지점 → 일치(step 지점)
      for (const p of b.inners || []) {
        if (a.inners?.some(x => x.key === p.key)) continue;
        const iP = prevB ? navIdx(prevB.key) : -1, iX = navIdx(p.key), iN = navIdx(b.key);
        const onNav = iX >= 0 && (iP < 0 || iP < iX) && (iN < 0 || iX < iN);
        row.msg.push(`${p.id}: ${vb} 항로 안 지점${p.sl ? '(속도·고도 변경)' : ''} — 일치로 봄${iX < 0 ? ' · navlog에 없음, 확인 필요' : onNav ? '' : ' · navlog 순서 확인 필요'}`);
        if (iX < 0 || !onNav) row.st = row.st === 'bad' ? 'bad' : 'chk';
      }
      for (const p of a.inners || []) {
        if (b.inners?.some(x => x.key === p.key)) continue;
        row.msg.push(`${p.id}: company route의 ${va} 항로 안 지점 (FPL에는 생략) — 일치로 봄`);
      }
      prevA = a; prevB = b;
    } else if (a) {
      row.st = 'bad'; row.msg.push(`FPL에 없음 (company: ${a.via} ${a.id})`);
    } else {
      row.st = 'bad'; row.msg.push(`company route에 없음 (FPL: ${b.via} ${b.id})`);
    }
    res.rows.push(row);
  }
  // 속도·고도 변경점 (FPL) + navlog 비교
  // navlog에서 그 지점 이후 순항 FL을 찾아 FPL 고도와 비교 (상승·강하 중 구간은 건너뛰고 도달 지점 표시)
  const lv = [];
  const look = (from, f) => {
    const nx = nav.slice(from).filter(w => w.fl != null).slice(0, 8);
    if (!nx.length) return { nav: null };
    const hit = f == null ? null : nx.find(w => Math.abs(w.fl - f) <= 1);
    return hit ? { nav: hit.fl, navAt: hit.name, navOk: true, exact: hit.fl === f, direct: hit === nx[0] }
      : { nav: nx[0].fl, navAt: nx[0].name, navOk: f == null ? null : false };
  };
  if (fp.init) lv.push({ at: fp.dep || '출발', sl: fp.init, first: true, ...look(0, fp.init.lvl?.fl) });
  for (const p of fp.pts) if (p.sl) {
    const i = navIdx(p.key);
    lv.push({ at: p.id, sl: p.sl, ...(i >= 0 ? look(i + 1, p.sl.lvl?.fl) : { nav: null, noNav: true }) });
  }
  res.levels = lv;
  res.counts = { ok: res.rows.filter(r => r.st === 'ok').length, chk: res.rows.filter(r => r.st === 'chk').length, bad: res.rows.filter(r => r.st === 'bad').length + head.filter(h => h.st === 'bad').length };
  res.ok = res.counts.bad === 0 && !res.issues.length;
  return res;
}
