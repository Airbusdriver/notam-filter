// fuel.js — OFP(Jeppesen Dataplan) 연료·무게 요약 → A350 FMS FUEL&LOAD 페이지 값
// 내부 값은 OFP 단위 그대로(100 LBS 또는 100 KGS 정수). 화면에서 /10 하면 FMS 표기(천 단위, 소수 1자리).

const num = s => (s == null ? null : +String(s).replace(/,/g, ''));
const hm = s => { if (!s) return null; const m = /^(\d{1,2})[.:](\d{2})$/.exec(s); return m ? +m[1] * 60 + +m[2] : null; };

// 연료표에서 "이름 연료(4자리) 시간(hh.mm)" 꺼내기 — 같은 줄 오른쪽 무게 열과 섞여 있어도 줄 앞쪽만 본다
function row(T, re) {
  for (const t of T) { const m = re.exec(t); if (m) return m; }
  return null;
}

export function parseFuel(T, ofp = {}) {
  const r = { warnings: [], src: {} };
  // CFP 머리 부분(첫 FLIGHT RELEASE ~ navlog 머리)만 사용
  let s = T.findIndex(t => /^FLIGHT RELEASE /.test(t));
  if (s < 0) s = T.findIndex(t => /^FUEL TIME DIST/.test(t));
  if (s < 0) { r.warnings.push('OFP 연료 요약(FUEL TIME DIST)을 찾지 못했습니다.'); return r; }
  let e = T.findIndex((t, i) => i > s && /^DIST LATITUDE MC/.test(t));
  if (e < 0) e = Math.min(T.length, s + 60);
  const H = T.slice(s, e), all = H.join('\n');
  r.head = H.filter(t => !/^(RKSI|[A-Z]{4})\.\./.test(t)); // 원문 표시용

  // 단위: 헤더 "… UNIT" 줄 다음 값 "100LBS" / "100KGS"
  const um = /\b(\d+)\s?(LBS|LB|KGS|KG)\b/.exec(H.slice(0, 6).join(' '));
  r.unit = um && /^KG/.test(um[2]) ? 'KG' : 'LB';
  r.unitBase = um ? +um[1] : 100;
  if (r.unitBase !== 100) r.warnings.push(`OFP 단위가 ${r.unitBase}${r.unit}입니다. 표시 값의 단위를 확인하세요.`);

  const F = (key, re, i = 1, ti = 2) => {
    const m = row(H, re); if (!m) return null;
    const o = { f: num(m[i]), t: ti && m[ti] ? hm(m[ti]) : null, line: m.input };
    r.src[key] = m.input; return o;
  };
  r.trip = F('trip', /^TRIP (\d{4}) (\d{1,2}\.\d{2})(?: (\d{4}))?/);
  if (r.trip) { const m = /^TRIP \d{4} \S+ (\d{4})/.exec(r.src.trip); if (m) r.dist = +m[1]; }
  r.reserve = F('reserve', /^RESERVE (\d{4}) (\d{1,2}\.\d{2})/);
  const am = row(H, /^ALTN\/([A-Z]{4}) (\d{4}) (\d{1,2}\.\d{2})(?: (\d{4}))?/);
  if (am) { r.altn = { icao: am[1], f: +am[2], t: hm(am[3]), dist: am[4] ? +am[4] : null }; r.src.altn = am.input; }
  r.final = F('final', /^FINAL RES (\d{4}) (\d{1,2}\.\d{2})/);
  const cm = row(H, /^(\d+(?:\.\d+)?) PCT CONT (\d{4}) (\d{1,2}\.\d{2})/) || row(H, /^()CONT(?:INGENCY)? (\d{4}) (\d{1,2}\.\d{2})/);
  if (cm) { r.cont = { pct: cm[1] ? +cm[1] : null, f: +cm[2], t: hm(cm[3]) }; r.src.cont = cm.input; }
  r.refileRes = F('refileRes', /^REFILE RES (\d{4}) (\d{1,2}\.\d{2})/);
  r.rqd = F('rqd', /^RQD TAKEOFF (\d{4}) (\d{1,2}\.\d{2})/);
  r.disc = F('disc', /^DISC (\d{4}) (\d{1,2}\.\d{2})/);
  r.tank = F('tank', /^TANKERING (\d{4}) (\d{1,2}\.\d{2})/);
  r.plnTo = F('plnTo', /^PLN TAKEOFF (\d{4}) (\d{1,2}\.\d{2})/);
  r.taxi = F('taxi', /^TAXI (\d{4})(?: (\d{1,2}\.\d{2}))?/);
  r.ramp = F('ramp', /^RAMP OUT (\d{4})(?: (\d{1,2}\.\d{2}))?/);
  r.fod = F('fod', /^FOD (\d{4}) (\d{1,2}\.\d{2})/);

  // 무게 열 (5자리)
  const W = k => { const m = new RegExp(`(?:^|\\s)${k} (\\d{5})\\b`).exec(all); return m ? +m[1] : null; };
  r.w = {
    zfw: W('ZFW'), mzfw: W('MZFW'), tow: W('TOW'), mtow: W('MTOW'), ldw: W('LDW'), mldw: W('MLDW'),
    tof: W('TOF'), tif: W('TIF'), pld: W('PLD'), sow: W('SOW') ?? W('DOW') ?? W('OEW'), agtow: W('AGTOW'), rwy: W('RWY'), tcap: W('TCAP'), acl: W('ACL'),
  };

  // CI: "SPEED SKD CLB-310/.85 CRZ- 40 DSC-…"
  const ci = /CRZ-\s*(\d{1,3})\b(?![./])/.exec(all) || /\bCI\s*[-/:]?\s*(\d{1,3})\b/.exec(all);
  r.ci = ci ? +ci[1] : null;
  const sp = /SPEED SKD (.+?)(?:\s+APMS|$)/m.exec(all); if (sp) r.speedSkd = sp[1].trim();
  const pf = /APMS\/P\s+(\S+)\s+PCNT/.exec(all); if (pf) r.perfFactor = pf[1];

  // ---- OFP 뒤쪽: 승객·디스패치 노트·REFILE ----
  const rest = T.slice(e).join('\n');
  // PAX NBR = DISPATCH RELEASE INFORMATION > PAX/CARGO RESERVATION의 PASSENGERS: FIRST a/x BUSINESS b/y ECONOMY c/z → a+b+c
  const rs = rest.search(/PAX\/CARGO RESERVATION/);
  const px = /PASSENGERS:\s*(.+)/.exec(rs >= 0 ? rest.slice(rs) : rest);
  if (px) {
    const cls = ['FIRST', 'BUSINESS', 'ECONOMY'].map(c => { const m = new RegExp(`\\b${c}\\s+(\\d+)\\s*\\/\\s*(\\d+)`).exec(px[1]); return m ? { c, n: +m[1], cap: +m[2] } : null; }).filter(Boolean);
    if (cls.length) r.pax = { total: cls.reduce((a, x) => a + x.n, 0), cls, line: px[0].trim() };
    if (cls.length < 3) r.warnings.push('PASSENGERS 줄에서 FIRST·BUSINESS·ECONOMY 중 일부를 찾지 못했습니다. PAX NBR를 확인하세요.');
  }
  const pw = /PAX:\s*([\d,]+)\s*(LBS|KGS?)\s*,\s*CARGO:\s*([\d,]+)\s*(LBS|KGS?)/.exec(rest);
  if (pw) r.payload = { pax: num(pw[1]), cargo: num(pw[3]), u: pw[2] };
  const adj = /TRIP FUEL INCREASE FOR ([\d,]+)\s*(LBS|KGS?) ADDITIONAL TAKE ?OFF WEIGHT\s*:\s*([\d,]+)\s*(LBS|KGS?)/.exec(rest);
  if (adj) r.tripAdj = { per: num(adj[1]), inc: num(adj[3]) }; // 실제 단위(LBS)
  const ccf = /CCF\s*:\s*([\d,]+)\s*(LBS|KGS?)\s*(INCLUDED IN \w+)?/.exec(rest);
  if (ccf) r.ccf = { v: num(ccf[1]), note: ccf[3] || '' };
  const stat = /MEAN\/\s*(-?[\d,]+)\s*(LBS|KGS?),\s*90% STAT\/\s*(-?[\d,]+)\s*\w+,\s*99% STAT\/\s*(-?[\d,]+)/.exec(rest);
  if (stat) r.stat = { mean: num(stat[1]), p90: num(stat[3]), p99: num(stat[4]) };
  r.discWhy = [...rest.matchAll(/^- (DISC FUEL [^\n]+)/gm)].map(m => m[1].trim());

  // REFILE (결심점) 블록
  const ri = T.findIndex(t => /^REFILE FLT PLAN/.test(t));
  if (ri >= 0) {
    const B = T.slice(ri, ri + 14), bs = B.join('\n');
    const pr = /^- ([A-Z]{4}) TO ([A-Z]{4}) - ([A-Z0-9]+) TO ([A-Z]{4})/m.exec(bs);
    const segs = B.map(t => [...t.matchAll(/([A-Z][A-Z/ ]*?) (\d{4}) (\d{1,2}\.\d{2})/g)].map(m => ({ k: m[1].trim(), f: +m[2], t: hm(m[3]) })));
    const right = segs.map(x => x[1]).filter(Boolean), left = segs.map(x => x[0]).filter(Boolean);
    const rq = right.find(x => x.k === 'RQRD'), lq = left.find(x => x.k === 'RQRD');
    const rf = /PLANNED R\/F AT REFILE POINT (\d+)/.exec(bs);
    if (pr) r.refile = { dep: pr[1], refDest: pr[2], point: pr[3], dest: pr[4], rqdAtPoint: rq?.f ?? null, rqdToRef: lq?.f ?? null, planAtPoint: rf ? +rf[1] : null,
      contDest: right.find(x => x.k === 'CONT')?.f ?? null, contRef: left.find(x => x.k === 'CONT')?.f ?? null };
  }

  // 필수 항목 확인
  for (const [k, n] of [['trip', 'TRIP'], ['altn', 'ALTN'], ['final', 'FINAL RES'], ['taxi', 'TAXI'], ['ramp', 'RAMP OUT(BLOCK)']]) if (!r[k]) r.warnings.push(`OFP에서 ${n} 값을 찾지 못했습니다.`);
  if (r.w.zfw == null) r.warnings.push('OFP에서 계획 ZFW를 찾지 못했습니다.');
  r.ok = !!(r.trip && r.ramp);
  return r;
}

// FMS FUEL&LOAD 페이지 값 계산. ov = 로드시트/실제 입력(OFP 단위 ×100 정수) {zfw, block, cg, pax}
export function fmsPage(fu, ofp = {}, ov = {}, ctx = {}) {
  const v = x => (x == null ? null : x);
  const zfw = ov.zfw ?? fu.w.zfw, block = ov.block ?? fu.ramp?.f;
  const taxi = fu.taxi?.f ?? 0;
  // ZFW·BLOCK 변화에 따른 TRIP 보정(OFP 디스패치 노트 기준, 참고값)
  let trip = fu.trip?.f, tripAdj = 0;
  const towPlan = (fu.w.zfw ?? 0) + (fu.ramp?.f ?? 0) - taxi;
  const tow = zfw != null && block != null ? zfw + block - taxi : null;
  if (fu.tripAdj && tow != null && fu.w.zfw != null && fu.ramp && tow !== towPlan) {
    const dTowReal = (tow - towPlan) * fu.unitBase;
    tripAdj = Math.round(dTowReal / fu.tripAdj.per * fu.tripAdj.inc / fu.unitBase);
    trip += tripAdj;
  }
  const rsv = fu.cont?.f ?? 0, altn = fu.altn?.f ?? 0, fin = fu.final?.f ?? 0;
  const extra = block != null ? block - taxi - trip - rsv - altn - fin : null;
  const lw = tow != null ? tow - trip : null;
  // EFOB DEST = OFP FOD, EFOB ALTN = FOD − ALTN FUEL (계산값 BLOCK − TAXI − TRIP과 대조는 checkFuel)
  const efobCalc = block != null ? block - taxi - trip : null;
  const efobDest = fu.fod?.f ?? efobCalc;
  const efobAltn = efobDest != null ? efobDest - altn : null;
  const tripMin = fu.trip?.t;
  const extraMin = fu.disc && fu.tank ? (fu.disc.t ?? 0) + (fu.tank.t ?? 0) : fu.disc?.t ?? null;
  const ETA = ctx.eta ?? ofp.eta ?? null;
  return {
    zfw, block, taxi, trip, tripAdj, tripMin, rsv, rsvPct: trip ? rsv / trip * 100 : null, altn, altnMin: fu.altn?.t, fin, finMin: fu.final?.t,
    ci: fu.ci, pax: ov.pax ?? fu.pax?.total ?? null, cg: ov.cg ?? null,
    tow, lw, gw: zfw != null && block != null ? zfw + block : null,
    extra, extraMin: extra === (fu.disc?.f ?? 0) + (fu.tank?.f ?? 0) ? extraMin : null,
    minDest: altn + fin, efobDest, efobAltn, efobCalc,
    destUtc: ETA, altnUtc: ETA != null && fu.altn?.t != null ? ETA + fu.altn.t * 60000 : null,
    dest: ofp.dest, altnIcao: fu.altn?.icao || ofp.altn,
    overridden: ov.zfw != null || ov.block != null,
  };
}

// OFP 안 합계 검증 (OFP 단위 정수, 0.1 단위 반올림 차이는 1까지 허용)
export function checkFuel(fu, P) {
  const C = [], f = k => fu[k]?.f, w = fu.w;
  const add = (label, a, b, how) => { if (a == null || b == null) return; const d = a - b; C.push({ label, a, b, ok: Math.abs(d) <= 1, d, how }); };
  add('RESERVE', f('reserve'), (fu.altn?.f ?? 0) + f('final') + (f('cont') ?? fu.cont?.f ?? 0) + (f('refileRes') ?? 0), 'ALTN + FINAL + CONT + REFILE RES');
  add('RQD TAKEOFF', f('rqd'), f('trip') + f('reserve'), 'TRIP + RESERVE');
  add('PLN TAKEOFF', f('plnTo'), f('rqd') + (f('disc') ?? 0) + (f('tank') ?? 0), 'RQD + DISC + TANKERING');
  add('RAMP(BLOCK)', f('ramp'), f('plnTo') + f('taxi'), 'PLN TAKEOFF + TAXI');
  add('FOD', f('fod'), f('plnTo') - f('trip'), 'PLN TAKEOFF − TRIP');
  add('EFOB DEST', f('fod'), P.efobCalc, 'OFP FOD ↔ BLOCK − TAXI − TRIP');
  add('TOF', w.tof, f('plnTo'), 'PLN TAKEOFF');
  add('TOW', w.tow, w.zfw != null && w.tof != null ? w.zfw + w.tof : null, 'ZFW + TOF');
  add('LDW', w.ldw, w.tow != null && w.tif != null ? w.tow - w.tif : null, 'TOW − TIF');
  add('ZFW', w.zfw, w.sow != null && w.pld != null ? w.sow + w.pld : null, 'SOW + PLD');
  add('FMS EXTRA', P.overridden ? null : P.extra, (f('disc') ?? 0) + (f('tank') ?? 0), 'DISC + TANKERING');
  const L = [];
  const lim = (label, val, max) => { if (val == null || max == null) return; L.push({ label, val, max, ok: val <= max, margin: max - val }); };
  lim('ZFW', P.zfw, w.mzfw); lim('TOW', P.tow, w.mtow); lim('TOW (PLAN AGTOW)', P.tow, w.agtow); lim('LW', P.lw, w.mldw);
  return { sums: C, limits: L };
}
