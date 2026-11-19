// init.js — OFP(Jeppesen Dataplan) → A350 FMS ACTIVE/INIT 페이지 값
// 업로드한 OFP마다 새로 읽는다 (특정 편명·노선에 고정된 값 없음)

export const ISA_TROPO_FT = 36090; // OFP에 대류권계면 값이 없을 때 FMS 기본값

export function parseInit(T, ofp = {}) {
  const r = { warnings: [], src: {} };
  let s = T.findIndex(t => /^FLIGHT RELEASE /.test(t));
  if (s < 0) { r.warnings.push('OFP 머리(FLIGHT RELEASE)를 찾지 못했습니다.'); return r; }
  let e = T.findIndex((t, i) => i > s && /^DIST LATITUDE MC/.test(t));
  if (e < 0) e = Math.min(T.length, s + 60);
  const H = T.slice(s, e);
  r.src.release = H[0];

  r.flt = ofp.flight || null;
  r.from = ofp.dep || null; r.to = ofp.dest || null;
  const am = H.map(t => /^ALTN\/([A-Z]{4})\b/.exec(t)).find(Boolean);
  r.altn = am ? am[1] : ofp.altn || null;

  // 머리 표: "A/C REG.MK ENGINE SELCAL ROUTE PRF WX PROGS AVG WIND/TEMP UNIT" 다음 줄 값
  const hi = H.findIndex(t => /^A\/C REG/.test(t) && /\bROUTE\b/.test(t) && /AVG WIND\/TEMP/.test(t));
  if (hi >= 0) {
    const v = (H[hi + 1] || '').trim(); r.src.head = `${H[hi]}\n${v}`;
    const toks = v.split(/\s+/);
    // 평균 바람/온도: M039/M56 (M=맞바람, P=뒷바람 / M=영하)
    const wt = toks.map(x => /^([MP])(\d{2,3})\/([MP])(\d{2})$/.exec(x)).find(Boolean);
    if (wt) {
      r.avgWc = (wt[1] === 'M' ? -1 : 1) * +wt[2];
      r.tripWind = `${wt[1] === 'M' ? 'HD' : 'TL'}${String(+wt[2]).padStart(3, '0')}`;
      r.crzTemp = (wt[3] === 'M' ? -1 : 1) * +wt[4];
      r.src.wind = wt[0];
    }
    // ROUTE 칸: 헤더 단어 위치 기준 (REG.MK 는 값 2개: 형식번호+등록부호)
    const h = H[hi].replace('A/C REG.MK', 'AC REG').split(/\s+/);
    const k = h.indexOf('ROUTE');
    if (k >= 0 && toks[k]) r.routeCode = toks[k];
  }
  if (!r.routeCode && ofp.routeCode) r.routeCode = ofp.routeCode;
  r.cityPair = ofp.cityPair || null;
  if (r.tripWind == null) r.warnings.push('OFP 머리에서 AVG WIND/TEMP 값을 찾지 못했습니다. TRIP WIND·CRZ TEMP를 확인하세요.');

  // CI: SPEED SKD "CRZ- 40"
  const sp = H.find(t => /^SPEED SKD/.test(t));
  const ci = sp && /CRZ-\s*(\d{1,3})\b(?![./])/.exec(sp);
  r.ci = ci ? +ci[1] : null; if (sp) r.src.speed = sp;
  if (r.ci == null) r.warnings.push('SPEED SKD에서 CI(CRZ- nn)를 찾지 못했습니다.');

  // CRZ FL: navlog 첫 순항 고도, 이후 변경 지점 목록
  const W = (ofp.wpts || []).filter(w => w.fl != null);
  r.steps = [];
  for (const w of W) { const last = r.steps[r.steps.length - 1]; if (!last || last.fl !== w.fl) r.steps.push({ fl: w.fl, at: w.name, cum: w.cum }); }
  r.crzFl = r.steps.length ? r.steps[0].fl : null;
  r.maxFl = W.length ? Math.max(...W.map(w => w.fl)) : null;
  if (r.crzFl == null) r.warnings.push('항법기록(navlog)에서 순항 고도를 찾지 못했습니다.');
  // FPL 15항 첫 순항 속도·고도 (참고)
  const f15 = /^([KNM]\d{3,4})([FASM]\d{3,4})/.exec(ofp.item15 || '');
  if (f15) r.fplInit = { spd: f15[1], lvl: f15[2] };

  // 교체 공항 경로: navlog 뒤 첫 "ROUTE TO ALTN : …"
  const ar = T.slice(e).find(t => /^ROUTE TO ALTN\s*:/.test(t));
  if (ar) { r.altnRoute = ar.replace(/^ROUTE TO ALTN\s*:\s*/, '').trim(); r.src.altnRoute = ar; }

  // TROPO: OFP 값이 있으면 사용, 없으면 ISA 기본값
  const tp = T.slice(s, e + 400).map(t => /\bTROPO?(?:PAUSE)?\s*[:/]?\s*(?:FL)?\s*(\d{3,5})\b/.exec(t)).find(Boolean);
  if (tp) { const v = +tp[1]; r.tropo = v < 1000 ? v * 100 : v; r.tropoSrc = 'OFP'; }
  else { r.tropo = ISA_TROPO_FT; r.tropoSrc = 'ISA'; }

  r.ok = !!(r.from && r.to);
  return r;
}
