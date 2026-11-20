// refile.js — REFILE 비행: 결심점(Refile point) 연료 요약, NAR(교체공항 미지정) 요구량, REFILE 경로
// 업로드한 OFP마다 새로 읽는다 (특정 편명·노선에 고정된 값 없음)
// OFP 단위(보통 100 LBS)의 정수 그대로 보관하고, 화면에서 ×1000 / 실제값으로 바꾼다.

const hm = s => { const m = /^(\d{1,2})\.(\d{2})$/.exec(s || ''); return m ? +m[1] * 60 + +m[2] : null; };
const ROW = /([A-Z][A-Z/ ]*?) (\d{4}) (\d{1,2}\.\d{2})(?: (\d{4}))?(?=\s|$)/g;
const NAV_A = /^(\d{4}) ([NS])(\d{2}) (\d{2}\.\d) (\d{3}) (\S+) (\S+) (\d{4})\b/;
const NAV_B = /^(\S+) ([EW])(\d{3}) (\d{2}\.\d)\b.*?(\d{2})\.(\d{2}) (\d{4})\/$/;
const deg = (h, d, m) => (+d + +m / 60) * (h === 'S' || h === 'W' ? -1 : 1);

// navlog 한 블록 읽기: s = "DIST LATITUDE MC" 줄 번호
function navlog(T, s) {
  const out = [];
  for (let i = s + 1; i < T.length; i++) {
    if (/^ROUTE TO ALTN/.test(T[i]) || /^END OF JEPPESEN/.test(T[i]) || /^REFILE FLT PLAN/.test(T[i])) break;
    const a = NAV_A.exec(T[i]); if (!a) continue;
    let j = i + 1; while (j < T.length && j < i + 4 && !NAV_B.test(T[j])) j++;
    const b = NAV_B.exec(T[j] || ''); if (!b) continue;
    const nm = /^(?:\d{3} (.+)|\/ ([A-Z]{4}) FIR\b.*)$/.exec(T[j + 1] || '');
    out.push({ name: b[1], leg: +a[1], lat: deg(a[2], a[3], a[4]), lon: deg(b[2], b[3], b[4]), fl: a[6], rf: +a[8],
      cum: +b[5] * 60 + +b[6], burn: +b[7], full: nm?.[1]?.trim() || '', fir: nm?.[2] || null, src: `${T[i]}\n${T[j]}` });
    i = j;
  }
  return out;
}

export function parseRefile(T, ofp = {}) {
  const r = { warnings: [], checks: [], left: [], right: [], wpts: [], raw: '' };
  const ri = T.findIndex(t => /^REFILE FLT PLAN/.test(t));
  r.isRefile = ri >= 0 || (ofp.flightType || []).some(x => /^REFILE$/i.test(x));
  if (!r.isRefile) return r;
  if (ri < 0) { r.warnings.push('OFP에 REFILE 표시는 있지만 "REFILE FLT PLAN" 요약을 찾지 못했습니다.'); return r; }

  // 단위
  const hi = T.findIndex(t => /^A\/C REG/.test(t) && /UNIT$/.test(t.trim()));
  const um = hi >= 0 && /(\d+)(LBS|KGS?)\s*$/.exec(T[hi + 1] || '');
  r.unit = um && /^KG/.test(um[2]) ? 'KG' : 'LBS'; r.unitBase = um ? +um[1] : 100;

  // ---- 요약 블록: 머리 ~ REFILE navlog 머리 전 ----
  let ni = T.findIndex((t, i) => i > ri && /^DIST LATITUDE MC/.test(t));
  const B = T.slice(ri, ni > 0 ? ni : ri + 20); r.raw = B.join('\n');
  const pr = /^- ([A-Z]{4}) TO ([A-Z]{4})\s+- ([A-Z0-9]+) TO ([A-Z]{4})/.exec(B.find(t => /^- [A-Z]{4} TO /.test(t)) || '');
  if (pr) Object.assign(r, { dep: pr[1], refDest: pr[2], point: pr[3], dest: pr[4] });
  else r.warnings.push('REFILE 요약에서 "- 출발 TO 재계획공항 - 결심점 TO 목적지" 줄을 찾지 못했습니다.');
  for (const t of B) {
    if (/^(TRIP TIME|- |REFILE FLT|RIF\/)/.test(t) || /ELDW|R\/F AT REFILE|WEIGHT AT REF|OVER WEIGHT/.test(t)) continue;
    const ms = [...t.matchAll(ROW)].map(m => ({ k: m[1].trim(), f: +m[2], t: hm(m[3]), d: m[4] != null ? +m[4] : null }));
    if (ms.length >= 2) { r.left.push(ms[0]); r.right.push(ms[1]); }
    else if (ms.length === 1) (/^VFR$/.test(ms[0].k) ? r.right : r.left).push(ms[0]);
  }
  const bs = B.join('\n'), n = (re) => { const m = re.exec(bs); return m ? +m[1] : null; };
  r.eldw = n(/ELDW (\d{4})/); r.mldw = n(/MLDW (\d{4})/);
  r.overWt = n(/OVER WEIGHT AT [A-Z]{4} (\d{4})/);
  r.rfPlan = n(/PLANNED R\/F AT REFILE POINT (\d+)/);
  r.wtAtPoint = n(/WEIGHT AT REF POINT\s+[A-Z0-9]+\s+(\d+)/);
  const rif = B.find(t => /^RIF\//.test(t)); r.rif = rif ? rif.replace(/^RIF\//, '').split(/\.\.|\s+/).filter(Boolean) : ofp.rif || [];

  const L = k => r.left.find(x => x.k === k), R = k => r.right.find(x => x.k === k);
  const g = (arr, re) => arr.find(x => re.test(x.k));
  r.L = { toPoint: g(r.left, new RegExp(`TO ${r.point}$`)), pointToRef: g(r.left, new RegExp(`^${r.point} TO`)), altn: g(r.left, /^ALTN\//), final: L('FINAL RES'), cont: L('CONT'), rqrd: L('RQRD') };
  r.R = { trip: g(r.right, new RegExp(`^${r.point} TO`)), altn: g(r.right, /^ALTN\//), final: R('FINAL RES'), cont: R('CONT'), rqrd: R('RQRD'), vfr: R('VFR') };
  r.L.altnApt = r.L.altn?.k.split('/')[1] || null; r.R.altnApt = r.R.altn?.k.split('/')[1] || null;

  // ---- NAR 요구량 = OFP VFR + 15분 체공(FINAL RES의 50%)  [FOM 5장 (135)] ----
  if (r.R.vfr && r.R.final) {
    r.hold15 = r.R.final.f / 2;                 // OFP 단위 (예: 0051 → 25.5)
    r.nar = r.R.vfr.f + r.hold15;               // 예: 0195 + 25.5 = 220.5
  } else r.warnings.push('VFR 또는 FINAL RES 값을 찾지 못해 NAR 요구량을 계산하지 못했습니다.');

  // ---- 합계 대조 ----
  const sum = (...xs) => xs.every(x => x) ? xs.reduce((a, x) => a + x.f, 0) : null;
  const chk = (name, got, parts, label) => { if (got == null || parts == null) return; r.checks.push({ st: got === parts ? 'ok' : 'chk', msg: `${name} ${pad(got)} ${got === parts ? '=' : '≠'} ${label} ${pad(parts)}` }); };
  chk(`${r.point}→${r.dest} RQRD`, r.R.rqrd?.f, sum(r.R.trip, r.R.altn, r.R.final, r.R.cont), 'TRIP+ALTN+FINAL+CONT');
  chk('VFR', r.R.vfr?.f, sum(r.R.trip, r.R.final, r.R.cont), 'TRIP+FINAL+CONT');
  chk(`${r.dep}→${r.refDest} RQRD`, r.L.rqrd?.f, sum(r.L.toPoint, r.L.pointToRef, r.L.altn, r.L.final, r.L.cont), 'TRIP 2구간+ALTN+FINAL+CONT');

  // ---- 본 navlog의 결심점 (ETO·계획 잔량) ----
  const s0 = T.findIndex(t => /^DIST LATITUDE MC/.test(t));
  if (s0 >= 0 && s0 < ri) {
    const main = navlog(T, s0);
    r.pointMain = main.find(w => w.name === r.point) || null;
    r.destMain = main[main.length - 1] || null;
    if (r.pointMain && r.rfPlan != null && r.pointMain.rf !== r.rfPlan) r.checks.push({ st: 'chk', msg: `본 navlog ${r.point} R/F ${pad(r.pointMain.rf)} ≠ PLANNED R/F AT REFILE POINT ${pad(r.rfPlan)}` });
    else if (r.pointMain && r.rfPlan != null) r.checks.push({ st: 'ok', msg: `본 navlog ${r.point} R/F ${pad(r.pointMain.rf)} = PLANNED R/F AT REFILE POINT` });
  }
  if (!r.pointMain) r.warnings.push(`본 navlog에서 결심점 ${r.point || ''}을(를) 찾지 못해 통과 예정 시각을 계산하지 못했습니다.`);

  // ---- REFILE navlog (결심점 → 재계획 공항) ----
  if (ni > 0) {
    r.wpts = navlog(T, ni);
    const ae = T.findIndex((t, i) => i > ni && /^ROUTE TO ALTN/.test(t));
    if (ae > 0) {
      r.altnRoute = T[ae].replace(/^ROUTE TO ALTN\s*:\s*/, '').trim();
      const al = T.slice(ae, ae + 5).map(t => /^ALTERNATE\s*-\s*\d+\s+([A-Z]{4})\s+(\d{3})\s+(\d{3})\s+(\d{4})\s+(\d{3})\s+([MP]\d{3})\s+(\d{2}\.\d{2})\s+(\d+)/.exec(t)).find(Boolean);
      if (al) r.refAltn = { apt: al[1], msa: al[2], ttk: al[3], dist: +al[4], fl: al[5], wc: al[6], t: hm(al[7]), fuel: +al[8] };
    }
  }

  // ---- 재계획 공항 NOTAM 패키지 정보 ----
  r.pkgRefile = ofp.refile || [];
  r.airports = {};
  for (const icao of [r.refDest, r.L.altnApt].filter(Boolean)) {
    const h = T.findIndex(t => new RegExp(`^\\[REFILE\\]${icao}/`).test(t)); if (h < 0) continue;
    const a = {}; const m = /^\[\w+\][A-Z]{4}\/\s*([A-Z0-9]{3})?\/?\s*(.*)$/.exec(T[h]); if (m) { a.iata = m[1] || ''; a.name = m[2].trim(); }
    let rw = '';
    for (let k = h + 1; k < Math.min(T.length, h + 10); k++) {
      const t = T[k]; if (/^\[|^◼|NO CURRENT NOTAMS/.test(t)) break;
      let x = /^1\.\s*RUNWAY\s*:\s*(.*)$/.exec(t); if (x) { rw = x[1]; continue; }
      x = /^2\.\s*COMPANY RADIO\s*:\s*(.*)$/.exec(t); if (x) { a.radio = x[1].replace(/\s*\bnull\b\s*/i, ' ').trim(); continue; }
      if (rw && /^\d{2}[LRC]?\/\d{2}[LRC]?\s*:/.test(t)) rw += ' ' + t;
    }
    a.rwys = [...rw.matchAll(/(\d{2}[LRC]?\/\d{2}[LRC]?)\s*:\s*(\d+)\s*FT\s*X\s*(\d+)\s*FT/g)].map(x => ({ id: x[1], len: +x[2], wid: +x[3] })).sort((p, q) => q.len - p.len);
    r.airports[icao] = a;
  }

  r.ok = !!(r.point && r.R.rqrd);
  return r;
}
export const pad = v => (v == null ? '----' : Number.isInteger(v) ? String(v).padStart(4, '0') : v.toFixed(1).padStart(6, '0'));
