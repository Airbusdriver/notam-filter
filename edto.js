// edto.js — EDTO(ETOPS) 비행: EEP / ETP / EXP 좌표, ETP 임계연료(CFR), EDTO 교체공항
// 업로드한 OFP마다 새로 읽는다 (특정 편명·노선에 고정된 값 없음)

const PT = /^((?:EEP|ETP|EXP)\d*)$/;                               // navlog 지점 이름
const NAV_A = /^(\d{4}) ([NS])(\d{2}) (\d{2}\.\d) (\d{3}) (\S+) (\S+) (\d{4}) (\d{2}) (\S+)/; // 첫 줄: DIST LAT MC FL ETO/MSA R/F OT WIND
const NAV_B = /^(\S+) ([EW])(\d{3}) (\d{2}\.\d)\b.*?(\d{2})\.(\d{2}) (\d{4})\/$/;            // 둘째 줄: 이름 LON … 누적시간 누적소모
const SUM = /^ETP(\d+)\s+([A-Z]{4})\/([A-Z]{4})\s+(\d+)\/(\d+)\s+([MP]\d{3})\/([MP]\d{3})\s+(\d{5,7})\s+(\d{5,7})\s+(-?\d{5,7})\s+(\d{2})\.(\d{2})\/(\d{2})\.(\d{2})/;
const SUIT = /^([A-Z]{4})\s+SUITABLE FROM\s+(\d{4})\s*UTC\s*\/\s*TO\s+(\d{4})\s*UTC/;
const DET = /^([A-Z]{4})\/([A-Z]{4})\s*-\s*EQUAL TIME POINT DATA\s*-\s*ETP0*(\d+)/;

const deg = (h, d, m) => (+d + +m / 60) * (h === 'S' || h === 'W' ? -1 : 1);
const hm = (h, m) => +h * 60 + +m;
// 좌표 표기
export function llOfp(lat, lon) {
  const f = (v, w, p, n) => { const a = Math.abs(v), d = Math.floor(a + 1e-9), m = (a - d) * 60; return `${v < 0 ? n : p}${String(d).padStart(w, '0')} ${m.toFixed(1).padStart(4, '0')}`; };
  return `${f(lat, 2, 'N', 'S')} ${f(lon, 3, 'E', 'W')}`;
}
export function llFms(lat, lon) { // Airbus LAT/LONG 입력 형식 DDMM.MN/DDDMM.ME
  const f = (v, w, p, n) => { const a = Math.abs(v); let d = Math.floor(a + 1e-9), m = Math.round((a - d) * 600) / 10; if (m >= 60) { d++; m = 0; } return `${String(d).padStart(w, '0')}${m.toFixed(1).padStart(4, '0')}${v < 0 ? n : p}`; };
  return `${f(lat, 2, 'N', 'S')}/${f(lon, 3, 'E', 'W')}`;
}
const parseComp = s => { const m = /^([NS])(\d{2})(\d{2})(\d)\s+([EW])(\d{3})(\d{2})(\d)$/.exec(s.trim()); return m ? { lat: deg(m[1], m[2], `${m[3]}.${m[4]}`), lon: deg(m[5], m[6], `${m[7]}.${m[8]}`) } : null; };
const nm = (a, b) => { // 대권거리 NM
  const r = Math.PI / 180, x = Math.sin((b.lat - a.lat) * r / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin((b.lon - a.lon) * r / 2) ** 2;
  return 2 * 3440.065 * Math.asin(Math.min(1, Math.sqrt(x)));
};

export function parseEdto(T, ofp = {}) {
  const r = { warnings: [], checks: [], points: [], etps: [], suit: [], alts: [], era: [], notes: [], raw: {} };
  const ft = (ofp.flightType || []).map(x => x.toUpperCase());
  r.isEdto = ft.includes('EDTO') || ft.includes('ETOPS') || T.some(t => /^(EDTO|ETOPS) EQUAL TIME POINT DATA/.test(t));
  if (!r.isEdto) return r;

  // 단위 (머리 표 마지막 칸: 100LBS / 100KGS)
  const hi = T.findIndex(t => /^A\/C REG/.test(t) && /UNIT$/.test(t.trim()));
  const um = hi >= 0 && /(\d+)(LBS|KGS?)\s*$/.exec(T[hi + 1] || '');
  r.unit = um && /^KG/.test(um[2]) ? 'KG' : 'LBS'; r.unitBase = um ? +um[1] : 100;

  // ---- navlog: 첫 번째 블록만 (OFP 사본 중복 방지) ----
  const s = T.findIndex(t => /^DIST LATITUDE MC/.test(t));
  let cumDist = 0;
  if (s >= 0) {
    for (let i = s + 1; i < T.length; i++) {
      if (/^ROUTE TO ALTN/.test(T[i]) || /^END OF JEPPESEN/.test(T[i])) break;
      const a = NAV_A.exec(T[i]); if (!a) continue;
      let j = i + 1; while (j < T.length && j < i + 4 && !NAV_B.test(T[j])) j++;
      const b = NAV_B.exec(T[j] || ''); if (!b) continue;
      cumDist += +a[1];
      if (PT.test(b[1])) {
        r.points.push({
          name: b[1], kind: b[1].slice(0, 3), n: +(b[1].slice(3) || 1),
          lat: deg(a[2], a[3], a[4]), lon: deg(b[2], b[3], b[4]),
          fl: /^\d{3}$/.test(a[6]) ? +a[6] : null, rf: +a[8], wind: a[10],
          cum: hm(b[5], b[6]), burn: +b[7], dist: cumDist, src: `${T[i]}\n${T[j]}`,
        });
      }
      i = j;
    }
    r.totalDist = cumDist;
  }
  if (!r.points.length) r.warnings.push('항법기록(navlog)에서 EEP / ETP / EXP 지점을 찾지 못했습니다.');

  // ---- EDTO EQUAL TIME POINT DATA (요약) ----
  const ei = T.findIndex(t => /^(EDTO|ETOPS) EQUAL TIME POINT DATA/.test(t));
  if (ei >= 0) {
    const end = T.findIndex((t, i) => i > ei && /^I HEREBY RELEASE|^\(FPL-/.test(t));
    const S = T.slice(ei, end > 0 ? end : ei + 40); r.raw.summary = S.join('\n');
    for (let k = 0; k < S.length; k++) {
      const t = S[k];
      let m = SUIT.exec(t); if (m) { r.suit.push({ icao: m[1], from: m[2], to: m[3] }); continue; }
      m = /MOST CRITICAL FUEL SCENARIO AT\s*:\s*ETP0*(\d+)/.exec(t); if (m) { r.critical = +m[1]; continue; }
      m = SUM.exec(t);
      if (m) {
        const e = { n: +m[1], a1: m[2], a2: m[3], d1: +m[4], d2: +m[5], wc1: m[6], wc2: m[7], cfr: +m[8], fob: +m[9], exc: +m[10], tPt: hm(m[11], m[12]), tAlt: hm(m[13], m[14]), line: t };
        const c = parseComp(S[k + 1] || ''); if (c) { e.sumLat = c.lat; e.sumLon = c.lon; e.line += '\n' + S[k + 1]; k++; }
        r.etps.push(e);
      }
    }
  } else r.warnings.push('"EDTO EQUAL TIME POINT DATA" 요약을 찾지 못했습니다.');

  // ---- ETP 상세 (DIVERSION SUMMARY / CRITICAL FUEL REQUIRED CALCULATION) ----
  for (let i = 0; i < T.length; i++) {
    const m = DET.exec(T[i]); if (!m) continue;
    const n = +m[3];
    let e = r.etps.find(x => x.n === n);
    if (!e) { e = { n, a1: m[1], a2: m[2] }; r.etps.push(e); }
    if (e.det) continue; // 사본 중복
    let j = i + 1; while (j < T.length && !DET.test(T[j]) && !/WIND AND TEMPERATURE SUMMARY|^NOTAM PACKAGE|^\(FPL-/.test(T[j]) && j < i + 60) j++;
    const D = T.slice(i, j); e.det = D.join('\n');
    for (const t of D) {
      let x = /^ETP LOCATION\s+([NS])(\d{2}) (\d{2}\.\d) ([EW])(\d{3}) (\d{2}\.\d)\s+ETE\s+(\d{2})\.(\d{2})/.exec(t);
      if (x) { e.locLat = deg(x[1], x[2], x[3]); e.locLon = deg(x[4], x[5], x[6]); e.ete = hm(x[7], x[8]); continue; }
      x = /^GWT AT DIVERSION\s+(\d+)\s+FOB\s+(\d+)/.exec(t); if (x) { e.gwt = +x[1]; e.fob ??= +x[2]; continue; }
      x = /^G\/C DIST\s+(\d+)\s+(\d+)/.exec(t); if (x) { e.d1 ??= +x[1]; e.d2 ??= +x[2]; continue; }
      x = /^CRITICAL FUEL REQUIRED AT ETP\d+\s*-\s*(.+?)\s+TO\s+([A-Z]{4})\s*$/.exec(t); if (x) { e.scen = x[1].trim(); e.critApt = x[2]; continue; }
      x = /^CFR\s+(\d+)\s+(\d{2})\.(\d{2})/.exec(t); if (x) { e.cfr ??= +x[1]; e.tAlt ??= hm(x[2], x[3]); continue; }
      x = /^QTY DIFF\.?\s+(-?\d+)/.exec(t); if (x) { e.exc ??= +x[1]; continue; }
    }
    // 시나리오 표: 공항별 3열(DECOMP 2 ENG / DECOMP 1 ENG / PRESS 1 ENG)
    const row = lbl => { const t = D.find(x => x.startsWith(lbl)); return t ? t.slice(lbl.length).trim().split(/\s+/) : null; };
    const cond = row('FLIGHT CONDITION'), cfg = (D.find(x => x.startsWith('CONFIG')) || '').match(/\d\s*ENG/g);
    if (cond && cond.length >= 6) {
      const sp = row('SPEED'), fl = row('F.L.'), wc = row('AVG W/C'), tt = row('TIME TO ALT NO HOLD'), tot = row('TOTAL');
      e.scens = [0, 1, 2, 3, 4, 5].map(k => ({
        apt: k < 3 ? e.a1 : e.a2, cond: `${cond[k]} ${cfg?.[k]?.replace(/\s+/, ' ') || ''}`.trim(),
        spd: sp?.[k], fl: fl?.[k], wc: wc?.[k], t: tt?.[k], tot: tot?.[k] != null ? +tot[k] : null,
      }));
    }
  }
  r.etps.sort((a, b) => a.n - b.n);

  // navlog 지점과 ETP 데이터 연결 + 대조
  const tol = 0.15 / 60; // 0.1' 반올림 차이 허용
  for (const e of r.etps) {
    const p = r.points.find(x => x.kind === 'ETP' && x.n === e.n);
    e.pt = p || null; if (p) p.etp = e;
    const name = `ETP${e.n}`;
    if (!p) { r.checks.push({ st: 'chk', msg: `${name}: navlog에 지점이 없습니다.` }); continue; }
    const pos = [['ETP LOCATION', e.locLat, e.locLon], ['요약 좌표', e.sumLat, e.sumLon]].filter(x => x[1] != null);
    const bad = pos.filter(([, la, lo]) => Math.abs(la - p.lat) > tol || Math.abs(lo - p.lon) > tol);
    r.checks.push(bad.length ? { st: 'bad', msg: `${name} 좌표 불일치: navlog ${llOfp(p.lat, p.lon)} ↔ ${bad.map(([k, la, lo]) => `${k} ${llOfp(la, lo)}`).join(', ')}` }
      : { st: 'ok', msg: `${name} 좌표 일치 (navlog · ${pos.map(x => x[0]).join(' · ')})` });
    const ete = e.ete ?? e.tPt;
    if (ete != null && Math.abs(ete - p.cum) > 1) r.checks.push({ st: 'chk', msg: `${name} 통과 시간 차이: navlog ${fmtHM(p.cum)} ↔ ETP 데이터 ${fmtHM(ete)}` });
    if (e.fob != null) {
      const rf = p.rf * r.unitBase;
      e.rfDiff = e.fob - rf;
      if (Math.abs(e.rfDiff) > r.unitBase) r.checks.push({ st: 'chk', msg: `${name} FOB ${fmtN(e.fob)} ↔ navlog R/F ${fmtN(rf)} (${r.unit}) 차이 ${fmtN(e.rfDiff)}` });
    }
    if (e.cfr != null && e.fob != null) {
      const exc = e.fob - e.cfr;
      if (e.exc != null && Math.abs(exc - e.exc) > 1) r.checks.push({ st: 'chk', msg: `${name} EXC 계산값 ${fmtN(exc)} ↔ OFP ${fmtN(e.exc)}` });
      e.exc ??= exc;
      if (e.exc < 0) r.checks.push({ st: 'bad', msg: `${name}: FOB가 CFR보다 ${fmtN(-e.exc)} ${r.unit} 부족합니다.` });
    }
  }
  const crit = r.critical ?? (r.etps.length ? r.etps.reduce((a, b) => (b.exc ?? Infinity) < (a.exc ?? Infinity) ? b : a).n : null);
  r.critical = crit;
  const minExc = r.etps.filter(e => e.exc != null).sort((a, b) => a.exc - b.exc)[0];
  if (minExc && r.critical != null && minExc.n !== r.critical) r.checks.push({ st: 'chk', msg: `OFP의 MOST CRITICAL은 ETP${r.critical}, 여유(EXC)가 가장 작은 곳은 ETP${minExc.n}` });

  // ---- 디스패치 노트: "180 MIN EDTO APPLIED", Entry/Exit 공항 ----
  for (let i = 0; i < T.length; i++) {
    const t = T[i];
    let m = /\b(\d{2,3})\s*MIN(?:UTES?)?\s+(EDTO|ETOPS)\s+APPLIED/i.exec(t);
    if (m && r.ruleMin == null) r.ruleMin = +m[1];
    m = /^Entry point\s+(\d+)\s*:\s*([A-Z]{4})/i.exec(t); if (m) (r.entry ||= []).push({ n: +m[1], icao: m[2] });
    m = /^Exit point\s+(\d+)\s*:\s*([A-Z]{4})/i.exec(t); if (m) (r.exit ||= []).push({ n: +m[1], icao: m[2] });
  }
  // 노트 블록: "- Please check the EDTO Chart …" ~ Entry/Exit 목록 (다음 번호 머리 전까지)
  const ni = T.findIndex(t => /(EDTO|ETOPS) Chart|MIN (EDTO|ETOPS) APPLIED/i.test(t));
  if (ni >= 0) {
    for (let k = ni; k <Math.min(T.length, ni + 14); k++) {
      if (k > ni && (/^\d{1,2}\s*\.\s+[A-Z][A-Z /&()-]{3,}$/.test(T[k]) || /^END OF PACKAGE|^NOTAM PACKAGE/.test(T[k]))) break;
      r.notes.push(T[k].trim());
    }
  }
  const uniq = a => a && a.filter((x, k) => a.findIndex(y => y.icao === x.icao && y.n === x.n) === k);
  r.entry = uniq(r.entry); r.exit = uniq(r.exit);
  for (const p of r.points) {
    if (p.kind === 'EEP') p.apt = r.entry?.[p.n - 1]?.icao || r.entry?.[0]?.icao || null;
    if (p.kind === 'EXP') p.apt = r.exit?.[p.n - 1]?.icao || r.exit?.[0]?.icao || null;
  }

  // ---- NOTAM 패키지: EDTO / ERA 공항 목록과 공항 정보 ----
  const li = T.findIndex(t => /^EDTO:\s+[A-Z]{4}/.test(t));
  const list = li >= 0 ? T[li].replace(/^EDTO:\s*/, '').trim().split(/\s+/).filter(x => /^[A-Z]{4}$/.test(x)) : [];
  const ri = T.findIndex(t => /^ERA:\s+[A-Z]{4}/.test(t));
  if (ri >= 0) {
    let k = ri; let txt = T[ri].replace(/^ERA:\s*/, '');
    while (/^\s*([A-Z]{4}\s*)+$/.test(T[k + 1] || '')) txt += ' ' + T[++k];
    r.era = [...new Set(txt.trim().split(/\s+/).filter(x => /^[A-Z]{4}$/.test(x)))];
  }
  const ralt = /\bRALT\/((?:\s*[A-Z]{4}\b)+)/.exec(ofp.item18 || '');
  r.ralt = ralt ? ralt[1].trim().split(/\s+/) : [];
  const etpApts = [...new Set(r.etps.flatMap(e => [e.a1, e.a2]))];
  const order = [...new Set([...list, ...r.suit.map(x => x.icao), ...etpApts])];
  for (const icao of order) {
    const a = { icao, inList: list.includes(icao), suit: r.suit.find(x => x.icao === icao) || null, etps: r.etps.filter(e => e.a1 === icao || e.a2 === icao).map(e => e.n), rwys: [] };
    const h = T.findIndex(t => new RegExp(`^\\[(EDTO|ETOPS)\\]${icao}/`).test(t));
    if (h >= 0) {
      const hm2 = /^\[\w+\][A-Z]{4}\/\s*([A-Z0-9]{3})?\/?\s*(.*)$/.exec(T[h]); if (hm2) { a.iata = hm2[1] || ''; a.name = hm2[2].trim(); }
      let rw = '';
      for (let k = h + 1; k < Math.min(T.length, h + 12); k++) {
        const t = T[k];
        if (/^\[/.test(t) || /^◼/.test(t) || /NO CURRENT NOTAMS/.test(t)) break;
        let m = /^1\.\s*RUNWAY\s*:\s*(.*)$/.exec(t); if (m) { rw = m[1]; continue; }
        m = /^2\.\s*COMPANY RADIO\s*:\s*(.*)$/.exec(t); if (m) { a.radio = m[1].replace(/\s*\bnull\b\s*/i, ' ').trim(); continue; }
        if (rw && /^\d{2}[LRC]?\/\d{2}[LRC]?\s*:/.test(t)) rw += ' ' + t;
      }
      for (const m of rw.matchAll(/(\d{2}[LRC]?\/\d{2}[LRC]?)\s*:\s*(\d+)\s*FT\s*X\s*(\d+)\s*FT/g)) a.rwys.push({ id: m[1], len: +m[2], wid: +m[3] });
      a.rwys.sort((x, y) => y.len - x.len);
    }
    r.alts.push(a);
  }
  // 목록 대조
  const setEq = (x, y) => x.length === y.length && x.every(v => y.includes(v));
  const suitL = r.suit.map(x => x.icao);
  if (list.length && suitL.length && !setEq(list, suitL)) r.checks.push({ st: 'chk', msg: `NOTAM 패키지 EDTO 목록(${list.join(' ')})과 ENROUTE ALTERNATES(${suitL.join(' ')})가 다릅니다.` });
  if (r.ralt.length && (list.length || suitL.length) && !setEq(r.ralt, list.length ? list : suitL)) r.checks.push({ st: 'chk', msg: `ATS FPL RALT/${r.ralt.join(' ')} ↔ EDTO 교체공항 ${(list.length ? list : suitL).join(' ')}` });
  else if (r.ralt.length) r.checks.push({ st: 'ok', msg: `ATS FPL RALT/${r.ralt.join(' ')} = EDTO 교체공항 목록` });
  for (const e of r.etps) for (const ap of [e.a1, e.a2]) if (!suitL.includes(ap) && suitL.length) r.checks.push({ st: 'chk', msg: `ETP${e.n} 교체공항 ${ap}의 적합 시간(SUITABLE FROM/TO)이 OFP에 없습니다.` });

  // 지점 간 간격 (참고)
  const ordered = [...r.points].sort((a, b) => a.cum - b.cum);
  ordered.forEach((p, k) => { if (k) { p.legNm = Math.round(nm(ordered[k - 1], p)); p.legMin = p.cum - ordered[k - 1].cum; } });
  r.points = ordered;

  r.ok = !!(r.points.length || r.etps.length);
  return r;
}

export function fmtHM(min) { if (min == null || !isFinite(min)) return ''; const s = min < 0 ? '-' : ''; min = Math.abs(min); return `${s}${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`; }
export function fmtN(v) { return v == null || !isFinite(v) ? '' : Math.round(v).toLocaleString('en-US'); }
