// core.js — OFP / NOTAM 파싱과 경로 기반 필터 (DOM 없음, 브라우저·Node 공용)
export const CORE_VERSION = '1.1.0';

const MON = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11 };
const MIN = 60000, HOUR = 3600000, DAY = 86400000;
const EARTH_NM = 3440.065;

/* ------------------------------------------------------------------ */
/* PDF → 줄 단위 텍스트                                                 */
/* ------------------------------------------------------------------ */
export async function extractLines(pdfjs, data, onProgress) {
  const doc = await pdfjs.getDocument({ data, isEvalSupported: false, useSystemFonts: true, disableFontFace: true }).promise;
  const out = [];
  const N = doc.numPages, BATCH = 4;
  let seenNavlog = false, seenPkgEnd = false, stopAt = 0;
  for (let p0 = 1; p0 <= N && !stopAt; p0 += BATCH) {
    const nums = []; for (let p = p0; p < p0 + BATCH && p <= N; p++) nums.push(p);
    const pages = await Promise.all(nums.map(p => pageLines(doc, p)));
    for (let k = 0; k < pages.length; k++) {
      const p = nums[k], lines = pages[k];
      // NOTAM 패키지가 끝난 뒤 다시 시작되는 OFP 사본은 읽지 않음
      if (seenNavlog && seenPkgEnd && lines.slice(0, 3).some(t => /^CFP PLAN\b/.test(t))) { stopAt = p; break; }
      for (const t of lines) {
        if (!seenNavlog && /^DIST LATITUDE MC/.test(t)) seenNavlog = true;
        if (/^END OF NOTAM PACKAGE/.test(t)) seenPkgEnd = true;
        out.push({ t, p });
      }
      onProgress && onProgress(p, N);
    }
  }
  if (stopAt) onProgress && onProgress(N, N);
  return out;
}
async function pageLines(doc, p) {
  const page = await doc.getPage(p);
  const tc = await page.getTextContent();
  const res = [];
  {
    const rows = [];
    for (const it of tc.items) {
      if (!it.str || !it.str.trim()) continue;
      const y = it.transform[5], x = it.transform[4];
      let row = rows.find(r => Math.abs(r.y - y) <= 2);
      if (!row) { row = { y, items: [] }; rows.push(row); }
      row.items.push({ x, s: it.str, w: it.width });
    }
    rows.sort((a, b) => b.y - a.y);
    for (const r of rows) {
      r.items.sort((a, b) => a.x - b.x);
      let line = '', end = null;
      for (const it of r.items) {
        if (end !== null && it.x - end > 1.5) line += ' ';
        line += it.s; end = it.x + it.w;
      }
      line = line.replace(/\s+/g, ' ').trim();
      if (line) res.push(line);
    }
  }
  page.cleanup && page.cleanup();
  return res;
}

const JUNK = [/^Page \d+$/i, /^Page - \d+ of \d+$/i];
export function cleanLines(lines) {
  return lines.filter(l => !JUNK.some(r => r.test(l.t)));
}

/* ------------------------------------------------------------------ */
/* 시간 유틸                                                            */
/* ------------------------------------------------------------------ */
export function parseDT(s) { // "31OCT26 15:00"
  const m = /^(\d{2})([A-Z]{3})(\d{2}) (\d{2}):(\d{2})$/.exec(s);
  if (!m || !(m[2] in MON)) return null;
  return Date.UTC(2000 + +m[3], MON[m[2]], +m[1], +m[4], +m[5]);
}
export function fmtZ(t, withDate = true) {
  if (t == null || !isFinite(t)) return '';
  const d = new Date(t);
  const hh = String(d.getUTCHours()).padStart(2, '0'), mm = String(d.getUTCMinutes()).padStart(2, '0');
  if (!withDate) return `${hh}${mm}Z`;
  const mon = Object.keys(MON)[d.getUTCMonth()];
  return `${String(d.getUTCDate()).padStart(2, '0')}${mon} ${hh}${mm}Z`;
}

/* ------------------------------------------------------------------ */
/* 기본 공항 좌표 (OFP 항법기록에 출발·도착 공항 좌표가 없을 때 보조)     */
/* ------------------------------------------------------------------ */
export const AIRPORTS = {
  RKSI: [37.4602, 126.4407], RKSS: [37.5583, 126.7906], RKPC: [33.5113, 126.4930], RKPK: [35.1795, 128.9382],
  RKTN: [35.8941, 128.6589], RKJB: [34.9914, 126.3828], RJAA: [35.7720, 140.3929], RJTT: [35.5523, 139.7798],
  RJBB: [34.4347, 135.2440], RJFF: [33.5859, 130.4510], RJCC: [42.7752, 141.6923], RJGG: [34.8584, 136.8054],
  ROAH: [26.1958, 127.6460], ZBAA: [40.0801, 116.5846], ZBAD: [39.5097, 116.4106], ZSPD: [31.1434, 121.8052],
  ZSSS: [31.1979, 121.3363], ZSQD: [36.3614, 120.0883], ZGGG: [23.3924, 113.2988], ZGSZ: [22.6393, 113.8107],
  ZUUU: [30.5785, 103.9471], ZUTF: [30.3125, 104.4411], ZWWW: [43.9071, 87.4742], VHHH: [22.3080, 113.9185],
  VMMC: [22.1496, 113.5916], RCTP: [25.0777, 121.2328], RPLL: [14.5086, 121.0198], VVNB: [21.2212, 105.8072],
  VVTS: [10.8188, 106.6520], VVDN: [16.0439, 108.1993], VTBS: [13.6900, 100.7501], VTSP: [8.1132, 98.3169],
  WSSS: [1.3644, 103.9915], WMKK: [2.7456, 101.7099], WIII: [-6.1256, 106.6559], WADD: [-8.7482, 115.1672],
  VIDP: [28.5665, 77.1031], VABB: [19.0887, 72.8679], OMDB: [25.2528, 55.3644], OTHH: [25.2731, 51.6081],
  UUEE: [55.9726, 37.4146], UAAA: [43.3521, 77.0405], UTTT: [41.2579, 69.2812], LTFM: [41.2753, 28.7519],
  EDDF: [50.0333, 8.5706], EDDM: [48.3538, 11.7861], EDDH: [53.6304, 9.9882], EDFH: [49.9487, 7.2639],
  EGLL: [51.4700, -0.4543], LFPG: [49.0097, 2.5479], EHAM: [52.3105, 4.7683], LIRF: [41.8003, 12.2389],
  LIMC: [45.6306, 8.7281], LIPZ: [45.5053, 12.3519], LEMD: [40.4983, -3.5676], LEBL: [41.2974, 2.0833],
  LPPT: [38.7742, -9.1342], LOWW: [48.1103, 16.5697], LHBP: [47.4298, 19.2611], LKPR: [50.1008, 14.2600],
  LSZH: [47.4582, 8.5555], LSGG: [46.2381, 6.1090], EKCH: [55.6180, 12.6508], ESSA: [59.6519, 17.9186],
  ENGM: [60.1939, 11.1004], EFHK: [60.3172, 24.9633], EPWA: [52.1657, 20.9671], LGAV: [37.9364, 23.9445],
  LLBG: [32.0114, 34.8867], KJFK: [40.6413, -73.7781], KEWR: [40.6895, -74.1745], KIAD: [38.9531, -77.4565],
  KBOS: [42.3656, -71.0096], KORD: [41.9742, -87.9073], KATL: [33.6407, -84.4277], KDFW: [32.8998, -97.0403],
  KLAX: [33.9416, -118.4085], KSFO: [37.6213, -122.3790], KSEA: [47.4502, -122.3088], KLAS: [36.0840, -115.1537],
  KHNL: [21.3245, -157.9251], PANC: [61.1743, -149.9963], PGUM: [13.4834, 144.7960], CYVR: [49.1967, -123.1815],
  CYYZ: [43.6777, -79.6248], YSSY: [-33.9399, 151.1753], YBBN: [-27.3942, 153.1218], NZAA: [-37.0082, 174.7850],
};

/* ------------------------------------------------------------------ */
/* OFP 파싱                                                             */
/* ------------------------------------------------------------------ */
const AWY_RE = /^U?[A-Z]{1,2}\d{1,4}[A-Z]?$/;
const PROC_RE = /^[A-Z]{2,5}\d[A-Z]$/;

export function parseOFP(L) {
  const T = L.map(l => l.t);
  const f = { warnings: [] };
  const all = T.join('\n');

  let m = /FLIGHT RELEASE (\S+)\s+([A-Z]{4})\/([A-Z]{4}) ON (\d{2})\/([A-Z]{3})\/(\d{2})/.exec(all);
  if (m) { f.flight = m[1]; f.dep = m[2]; f.dest = m[3]; f.date = Date.UTC(2000 + +m[6], MON[m[5]], +m[4]); }
  m = /ETD ([A-Z]{4}) (\d{2})(\d{2})Z ETA ([A-Z]{4}) (\d{2})(\d{2})Z/.exec(all);
  if (m && f.date != null) {
    f.etd = f.date + (+m[2]) * HOUR + (+m[3]) * MIN;
    f.etaPlanned = f.date + (+m[5]) * HOUR + (+m[6]) * MIN;
    if (f.etaPlanned < f.etd) f.etaPlanned += DAY;
    f.dep = f.dep || m[1]; f.dest = f.dest || m[4];
  }
  m = /\bALTN\/([A-Z]{4})/.exec(all); if (m) f.altn = m[1];
  // 회사 노선 코드 (ROUTE 열)
  const hi = T.findIndex(t => /^A\/C REG\.MK ENGINE SELCAL ROUTE/.test(t));
  if (hi >= 0) {
    const h = T[hi].split(' '), v = (T[hi + 1] || '').split(' ');
    const k = h.indexOf('ROUTE'); if (k >= 0 && v[k]) f.routeCode = v[k];
  }
  { // CFP PLAN 번호 (예: CFP PLAN 7445)
    const cp = /^CFP PLAN\s+(\S+)/m.exec(all); if (cp) f.cfpPlan = cp[1];
    // 비행 종류: 'ATTN CAPT.  7771  REFILE' 줄 끝 (EDTO, REFILE 등)
    const at = /^ATTN CAPT\.?\s+\S+\s+([A-Z][A-Z0-9 /&+-]*?)\s*$/m.exec(all);
    if (at) f.flightType = at[1].trim().split(/\s+/).filter(Boolean);
  }
  // 도시쌍 (ICN/FRA)
  m = /\b(?:OZ|KE|AAR|KAL)\s?\d+\s*\/\s*([A-Z]{3})\s*\/\s*([A-Z]{3})/.exec(all) || /AAR\d+\/\d+[A-Z]{3}, ([A-Z]{3})\/([A-Z]{3})/.exec(all);
  if (m) f.cityPair = `${m[1]}/${m[2]}`;

  // ---- ATS FPL ----
  let fplIdx = -1;
  const fplStarts = T.map((t, i) => t.startsWith('(FPL-') ? i : -1).filter(i => i >= 0);
  for (const i of fplStarts) { if (T.slice(i, i + 40).some(t => /COPY OF ATS FPL/.test(t))) { fplIdx = i; break; } }
  if (fplIdx < 0 && fplStarts.length) fplIdx = fplStarts[0];
  if (fplIdx >= 0) {
    const fields = []; let cur = null;
    for (let i = fplIdx; i < Math.min(T.length, fplIdx + 60); i++) {
      const t = T[i];
      if (i === fplIdx) { cur = t; continue; }
      if (t.startsWith('-')) { fields.push(cur); cur = t.slice(1); } else cur += ' ' + t;
      if (/\)\s*$/.test(t) && fields.length >= 5) { fields.push(cur); cur = null; break; }
    }
    if (cur) fields.push(cur);
    // fields: [ (FPL-ID-RULES, TYPE/WAKE-EQUIP, DEPTIME, ROUTE, DEST+EET ALTN, ITEM18, ITEM19 ]
    const routeField = fields.find(x => /^[KNM]\d{3,4}[FASM]\d{3,4}\s/.test(x));
    if (routeField) f.item15 = routeField.trim();
    const i18 = fields.find(x => /^(PBN|STS|DOF|REG|EET|SEL|RMK|NAV|COM|DAT|SUR)\//.test(x));
    if (i18) f.item18 = i18.replace(/\)\s*$/, '');
    const destField = fields.find(x => /^[A-Z]{4}\d{4}(\s+[A-Z]{4})*\s*$/.test(x.trim()));
    if (destField) { const tk = destField.trim().split(/\s+/); f.fplAltn = tk.slice(1); f.eetTotal = +tk[0].slice(4, 6) * 60 + +tk[0].slice(6, 8); }
  }
  // 경로 토큰
  f.airways = new Set(); f.procedures = new Set(); f.fplPoints = [];
  if (f.item15) {
    const toks = f.item15.split(/\s+/).slice(1);
    for (let raw of toks) {
      const t = raw.split('/')[0];
      if (t === 'DCT' || !t) continue;
      if (PROC_RE.test(t)) f.procedures.add(t);
      else if (AWY_RE.test(t) && /\d/.test(t)) f.airways.add(t);
      else f.fplPoints.push(t);
    }
  } else {
    // FPL 없으면 OFP 요약 경로 사용
    const ri = T.findIndex(t => new RegExp(`^${f.dep}\\.\\.`).test(t));
    if (ri >= 0) {
      let s = ''; for (let i = ri; i < ri + 8 && !/^DIST /.test(T[i]); i++) s += ' ' + T[i];
      s.replace(/\.\./g, ' ').trim().split(/\s+/).forEach(t => {
        if (PROC_RE.test(t)) f.procedures.add(t); else if (AWY_RE.test(t) && /\d/.test(t)) f.airways.add(t); else f.fplPoints.push(t);
      });
    } else f.warnings.push('ATS 비행계획(FPL)과 경로 문자열을 찾지 못했습니다.');
  }
  // EET
  f.eet = [];
  if (f.item18) {
    const em = /EET\/((?:\s*[A-Z]{4}\d{4})+)/.exec(f.item18);
    if (em) for (const tk of em[1].trim().split(/\s+/)) f.eet.push({ fir: tk.slice(0, 4), min: +tk.slice(4, 6) * 60 + +tk.slice(6, 8) });
    const rf = /RIF\/([A-Z0-9 ]+?)(?:\s+[A-Z]{3,4}\/|$)/.exec(f.item18);
    if (rf) f.rif = rf[1].trim().split(/\s+/);
    const dof = /DOF\/(\d{2})(\d{2})(\d{2})/.exec(f.item18);
    if (dof && f.date == null) f.date = Date.UTC(2000 + +dof[1], +dof[2] - 1, +dof[3]);
  }

  // ---- 항법기록(navlog) ----
  f.wpts = [];
  const start = T.findIndex(t => /^DIST LATITUDE MC/.test(t));
  if (start >= 0) {
    let curFir = null;
    for (let i = start + 1; i < T.length; i++) {
      const t = T[i];
      if (/^ROUTE TO ALTN/.test(t) || /^END OF JEPPESEN/.test(t)) break;
      const a = /^(\d{4}) ([NS])(\d{2}) (\d{2}\.\d) (\d{3}) (\S+)/.exec(t);
      if (!a) continue;
      let j = i + 1; while (j < T.length && !/^\S+ [EW]\d{3} \d{2}\.\d/.test(T[j]) && j < i + 4) j++;
      const b = /^(\S+) ([EW])(\d{3}) (\d{2}\.\d)\b.*?(\d{2})\.(\d{2}) (\d{4})\/$/.exec(T[j] || '');
      if (!b) continue;
      const lat = (+a[3] + +a[4] / 60) * (a[2] === 'S' ? -1 : 1);
      const lon = (+b[3] + +b[4] / 60) * (b[2] === 'W' ? -1 : 1);
      const flTok = a[6];
      const fl = /^\d{3}$/.test(flTok) ? +flTok : null;
      const w = { name: b[1], lat, lon, cum: +b[5] * 60 + +b[6], fl, phase: fl == null ? flTok : 'CRZ', fullName: '' };
      const c = T[j + 1] || '';
      const fm = /^\/ ([A-Z]{4}) FIR\b/.exec(c);
      if (fm) { curFir = fm[1]; w.firEntry = fm[1]; }
      else { const nm = /^\d{3} (.+)$/.exec(c); if (nm) w.fullName = nm[1].trim(); }
      w.fir = curFir;
      if (w.name === 'FIR') { w.name = `${curFir || ''} 경계`; w.isFirBdry = true; }
      f.wpts.push(w);
      i = j;
    }
  }
  if (!f.wpts.length) f.warnings.push('항법기록(navlog) 좌표를 찾지 못했습니다. 좌표 기반 매칭이 제한됩니다.');
  if (f.wpts.length) {
    const last = f.wpts[f.wpts.length - 1];
    f.flightMin = last.cum;
    if (f.etd != null) f.eta = f.etd + last.cum * MIN;
  }
  if (f.eta == null) f.eta = f.etaPlanned;

  // 패키지 헤더에서 FIR / ERA / REFILE 목록
  f.pkgFirs = listAfter(T, /^FIR: /); f.era = listAfter(T, /^ERA: /); f.refile = listAfter(T, /^REFILE: /);
  return f;
}
function listAfter(T, re) {
  const i = T.findIndex(t => re.test(t)); if (i < 0) return [];
  let s = T[i].replace(re, ' ');
  for (let k = i + 1; k < i + 5 && /^([A-Z]{4}\s*)+$/.test(T[k]); k++) s += ' ' + T[k];
  return s.trim().split(/\s+/).filter(x => /^[A-Z]{4}$/.test(x));
}

/* ------------------------------------------------------------------ */
/* NOTAM 패키지 파싱                                                     */
/* ------------------------------------------------------------------ */
const NOTAM_HDR = /^(?:(\d+)\.\s*)?(\d{2}[A-Z]{3}\d{2} \d{2}:\d{2}) - (UFN|PERM|\d{2}[A-Z]{3}\d{2} \d{2}:\d{2})(?:\s*(EST))?\s+([A-Z]{4})\s+(.+)$/;
const SECT_HDR = /^\[(DEP|DEST|ALTN|REFILE|ERA|FIR|ENR|EDTO|ETOPS|TALT|DALT)\]\s*([A-Z]{4})\/?\s*(.*)$/;
const CAT_HDR = /^[◼■□▪▣◾●]\s*(.+)$/;
const PKG_LINE = /^(NOTAM PACKAGE \d+|END OF NOTAM PACKAGE|.*PRINTED AT|FIR: |ERA: |REFILE: |DEP: )/;

export function parseNotams(L) {
  const T = L.map(l => l.t), P = L.map(l => l.p);
  const first = T.findIndex(t => /^NOTAM PACKAGE \d+/.test(t));
  if (first < 0) return { notams: [], sections: [] };
  let lastEnd = -1; T.forEach((t, i) => { if (/^END OF NOTAM PACKAGE/.test(t)) lastEnd = i; });
  const end = lastEnd > first ? lastEnd : T.length;
  const notams = [], sections = [];
  let sect = null, cat = null, cur = null, pkg = null;
  const close = () => { if (cur) { finishNotam(cur); notams.push(cur); cur = null; } };
  for (let i = first; i <= end && i < T.length; i++) {
    const t = T[i];
    let m;
    if ((m = /^NOTAM PACKAGE (\d+)/.exec(t))) { close(); pkg = +m[1]; sect = null; cat = null; continue; }
    if (PKG_LINE.test(t)) { close(); continue; }
    if ((m = SECT_HDR.exec(t))) {
      close(); cat = null;
      sect = { type: m[1], icao: m[2], name: m[3].replace(/^[A-Z]{3}\/\s*/, '').trim(), pkg, note: '' };
      sections.push(sect); continue;
    }
    if ((m = CAT_HDR.exec(t))) { close(); cat = m[1].trim(); continue; }
    if ((m = NOTAM_HDR.exec(t)) && sect) {
      close();
      cur = {
        sect: sect.type, sectIcao: sect.icao, sectName: sect.name, pkg, cat: cat || 'OTHER',
        startTxt: m[2], endTxt: m[3], est: !!m[4], loc: m[5], id: m[6].trim(), coad: /^COAD/.test(m[6]),
        page: P[i], lines: []
      };
      cur.start = parseDT(m[2]);
      cur.end = /UFN|PERM/.test(m[3]) ? Infinity : parseDT(m[3]);
      continue;
    }
    if (/NO CURRENT NOTAMS FOUND/.test(t)) { if (sect) sect.note = '현재 유효 NOTAM 없음'; continue; }
    if (/^SEE THE SAME AIRPORT IN PACKAGE/.test(t)) { if (sect) sect.note = t; continue; }
    if (cur) cur.lines.push(t);
  }
  close();
  notams.forEach((n, i) => n.key = `${n.loc}-${n.id}-${i}`);
  return { notams, sections };
}

function joinSmart(lines) {
  let s = '';
  for (const ln of lines) {
    if (!s) { s = ln; continue; }
    const lastTok = s.split(/\s/).pop();
    const partialCoord = /\d$/.test(s) && /\d{4,}[NS]|^-?\d+$|-\d+$/.test(lastTok) && /^[0-9NSEW]/.test(ln) && /\d{3,}[NS]\d|[NS]\d{4}/.test(lastTok + ln.split(/\s/)[0]);
    s += (partialCoord ? '' : '\n') + ln;
  }
  return s;
}

function finishNotam(n) {
  const raw = n.lines.join('\n');
  n.raw = raw;
  const text = joinSmart(n.lines);
  n.text = text;
  // 필드 분리
  const grab = (re) => { const m = re.exec(text); return m ? m[1].trim() : ''; };
  const eAt = text.search(/(?:^|\n)\s*E\)/);
  const preE = eAt >= 0 ? text.slice(0, eAt) : '';
  const dm = /(?:^|\n)\s*D\)\s*([\s\S]*)$/.exec(preE);
  n.D = dm ? dm[1].trim().replace(/\n/g, ' ') : '';
  n.E = grab(/(?:^|\n)\s*E\)\s*([\s\S]*?)(?=\n?\s*F\)\s*\S|\n\s*COMMENT\)|$)/) || (n.coad ? text.replace(/\n?--\s*BY[\s\S]*$/, '').trim() : text.trim());
  const fg = /F\)\s*([^\n]*?)\s*G\)\s*([^\n)]*)/.exec(text);
  n.F = fg ? fg[1].trim() : ''; n.G = fg ? fg[2].trim() : '';
  n.comment = grab(/(?:^|\n)\s*COMMENT\)\s*([\s\S]*)$/);
  if (!n.F) {
    const vl = /VERTICAL LIMITS?\s*:?\s*([A-Z0-9 ]+?)\s*-\s*([A-Z0-9 ]+?)(?:\n|$|\.)/.exec(text);
    if (vl) { n.F = vl[1].trim(); n.G = vl[2].trim(); }
  }
  n.flat = text.replace(/\n/g, ' ');
}

/* ------------------------------------------------------------------ */
/* 지오메트리                                                           */
/* ------------------------------------------------------------------ */
const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
export function distNM(a, b) {
  const dLat = rad(b[0] - a[0]), dLon = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_NM * Math.asin(Math.min(1, Math.sqrt(h)));
}
function interpGC(a, b, f) {
  const d = distNM(a, b) / EARTH_NM; if (d < 1e-9) return [a[0], a[1]];
  const A = Math.sin((1 - f) * d) / Math.sin(d), B = Math.sin(f * d) / Math.sin(d);
  const [la1, lo1, la2, lo2] = [rad(a[0]), rad(a[1]), rad(b[0]), rad(b[1])];
  const x = A * Math.cos(la1) * Math.cos(lo1) + B * Math.cos(la2) * Math.cos(lo2);
  const y = A * Math.cos(la1) * Math.sin(lo1) + B * Math.cos(la2) * Math.sin(lo2);
  const z = A * Math.sin(la1) + B * Math.sin(la2);
  return [deg(Math.atan2(z, Math.hypot(x, y))), deg(Math.atan2(y, x))];
}
function densify(pts, step = 5) { // pts: [{lat,lon,...}] → [{p:[lat,lon], seg, cum, fl}]
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const A = [a.lat, a.lon], B = [b.lat, b.lon];
    const n = Math.max(1, Math.ceil(distNM(A, B) / step));
    for (let k = 0; k < n; k++) {
      const f = k / n;
      out.push({ p: interpGC(A, B, f), seg: i, cum: a.cum + (b.cum - a.cum) * f, fl: (a.fl != null && b.fl != null) ? Math.round(a.fl + (b.fl - a.fl) * f) : null, near: f < 0.5 ? i : i + 1 });
    }
  }
  const z = pts[pts.length - 1];
  if (z) out.push({ p: [z.lat, z.lon], seg: pts.length - 1, cum: z.cum, fl: z.fl, near: pts.length - 1 });
  return out;
}
function pip(p, poly) { // 위경도 평면 근사 ray casting
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [yi, xi] = poly[i], [yj, xj] = poly[j];
    if (((yi > p[0]) !== (yj > p[0])) && (p[1] < (xj - xi) * (p[0] - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

/* 좌표 추출: 373201N1265554E, 3705N12701E, N395410E1162327 */
const COORD_A = /(?<![0-9])(\d{4}|\d{6})(?:\.\d+)?([NS])\s?(\d{5}|\d{7})(?:\.\d+)?([EW])(?![0-9])/g;
const COORD_B = /(?<![A-Z0-9])([NS])(\d{4}|\d{6})(?:\.\d+)?\s?([EW])(\d{5}|\d{7})(?:\.\d+)?(?![0-9])/g;
function dmsToDeg(s, isLon) {
  const dd = isLon ? 3 : 2;
  const d = +s.slice(0, dd), m = +s.slice(dd, dd + 2), sec = s.length > dd + 2 ? +s.slice(dd + 2, dd + 4) : 0;
  return d + m / 60 + sec / 3600;
}
export function extractCoords(text) {
  const out = [];
  const flat = text.replace(/\n/g, ' ');
  for (const m of flat.matchAll(COORD_A)) {
    const lat = dmsToDeg(m[1], false) * (m[2] === 'S' ? -1 : 1), lon = dmsToDeg(m[3], true) * (m[4] === 'W' ? -1 : 1);
    if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) out.push({ lat, lon, i: m.index, len: m[0].length, txt: m[0] });
  }
  for (const m of flat.matchAll(COORD_B)) {
    const lat = dmsToDeg(m[2], false) * (m[1] === 'S' ? -1 : 1), lon = dmsToDeg(m[4], true) * (m[3] === 'W' ? -1 : 1);
    if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180 && !out.some(o => Math.abs(o.i - m.index) < 3)) out.push({ lat, lon, i: m.index, len: m[0].length, txt: m[0] });
  }
  return out.sort((a, b) => a.i - b.i);
}
export function extractShapes(text) {
  const flat = text.replace(/\n/g, ' ');
  const cs = extractCoords(text);
  const used = new Set(), shapes = [];
  // 원형: RADIUS ... CENTERED ON coord / coord ... RADIUS
  const rRe = /RADIUS\s*(?:OF\s*)?([\d.]+)\s*(NM|KM|M)\b/g;
  for (const m of flat.matchAll(rRe)) {
    let r = +m[1]; r = m[2] === 'KM' ? r / 1.852 : m[2] === 'M' ? r / 1852 : r;
    let best = null, bd = 1e9;
    cs.forEach((c, k) => { if (used.has(k)) return; const d = c.i >= m.index ? c.i - m.index : (m.index - c.i - c.len) * 1.5; if (d < bd && d < 120) { bd = d; best = k; } });
    if (best != null) { used.add(best); shapes.push({ type: 'circle', c: [cs[best].lat, cs[best].lon], r, txt: cs[best].txt }); }
  }
  // 다각형: '-'로 이어진 좌표 체인
  let chain = [];
  const flush = () => {
    if (chain.length >= 3) { chain.forEach(k => used.add(k)); shapes.push({ type: 'polygon', pts: chain.map(k => [cs[k].lat, cs[k].lon]) }); }
    else if (chain.length === 2 && /EITHER SIDE|LINE|ALONG|BTN|BETWEEN/.test(flat)) { chain.forEach(k => used.add(k)); shapes.push({ type: 'line', pts: chain.map(k => [cs[k].lat, cs[k].lon]) }); }
    chain = [];
  };
  for (let k = 0; k < cs.length; k++) {
    if (used.has(k)) { flush(); continue; }
    if (chain.length) {
      const prev = cs[chain[chain.length - 1]];
      const gap = flat.slice(prev.i + prev.len, cs[k].i);
      if (/^\s*(-|TO|THEN)?\s*$/.test(gap) || /^\s*-\s*$/.test(gap)) { chain.push(k); continue; }
      flush();
    }
    chain.push(k);
  }
  flush();
  cs.forEach((c, k) => { if (!used.has(k)) shapes.push({ type: 'point', c: [c.lat, c.lon], txt: c.txt }); });
  return shapes;
}
function shapeDist(route, s, thr) { // 경로 각 점에서 도형까지 거리(NM)
  if (s.type === 'circle') return route.map(rp => Math.max(0, distNM(rp.p, s.c) - s.r));
  if (s.type === 'point') return route.map(rp => distNM(rp.p, s.c));
  // 경계선 표본점은 한 번만 계산
  const samples = [];
  const nEdge = s.type === 'line' ? s.pts.length - 1 : s.pts.length;
  for (let i = 0; i < nEdge; i++) {
    const a = s.pts[i], b = s.pts[(i + 1) % s.pts.length];
    const n = Math.max(1, Math.ceil(distNM(a, b) / 10));
    for (let k = 0; k < n; k++) samples.push(interpGC(a, b, k / n));
  }
  samples.push(s.pts[nEdge % s.pts.length]);
  let la0 = 90, la1 = -90, lo0 = 180, lo1 = -180;
  for (const [la, lo] of s.pts) { la0 = Math.min(la0, la); la1 = Math.max(la1, la); lo0 = Math.min(lo0, lo); lo1 = Math.max(lo1, lo); }
  let best = Infinity;
  return route.map(rp => {
    const [la, lo] = rp.p;
    // 경계상자까지의 대략 거리로 먼 점은 정밀 계산 생략
    const dLa = Math.max(0, la0 - la, la - la1) * 60;
    const dLo = Math.max(0, lo0 - lo, lo - lo1) * 60 * Math.cos(rad(la));
    const approx = Math.hypot(dLa, dLo) * 0.8;
    if (approx > best + 60 && approx > thr + 60) return approx;
    if (s.type === 'polygon' && approx === 0 && pip(rp.p, s.pts)) { best = 0; return 0; }
    let mn = Infinity;
    for (const q of samples) { const d = distNM(rp.p, q); if (d < mn) mn = d; }
    if (mn < best) best = mn;
    return mn;
  });
}

/* ------------------------------------------------------------------ */
/* 고도 / 시간 스케줄                                                   */
/* ------------------------------------------------------------------ */
export function parseAlt(s) {
  if (!s) return null;
  s = s.toUpperCase().replace(/\)$/, '').trim();
  if (/^(SFC|GND)/.test(s)) return { ft: 0, txt: s };
  if (/^UNL/.test(s)) return { ft: 99999, txt: s };
  let m = /^FL\s?(\d{2,3})/.exec(s); if (m) return { ft: +m[1] * 100, txt: s };
  m = /^([\d,]+)\s*(FT|M)\b\s*(AMSL|MSL|AGL|SFC)?/.exec(s);
  if (m) { let v = +m[1].replace(/,/g, ''); if (m[2] === 'M') v *= 3.28084; return { ft: Math.round(v), agl: m[3] === 'AGL' || m[3] === 'SFC', txt: s }; }
  return null;
}

const WD = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };
export function parseSchedule(d, base) { // → groups | null(해석 불가)
  if (!d) return [];
  const toks = d.toUpperCase().replace(/\(NEXT DAY\)/g, ' ').replace(/,/g, ' ').replace(/\s+-\s+/g, '-')
    .replace(/\b([A-Z]{3}) ?(\d{1,2})-([A-Z]{3}) ?(\d{1,2})\b/g, 'R:$1:$2:$3:$4')
    .split(/\s+/).filter(Boolean);
  const bd = new Date(base);
  let curMonth = bd.getUTCMonth();
  const groups = []; let g = { month: curMonth, days: [], wd: [], ranges: [] }; let lastRange = false, onMode = false;
  const push = () => { if (g.ranges.length) groups.push(g); g = { month: curMonth, days: [], wd: [], ranges: [] }; };
  for (const t of toks) {
    let m;
    if ((m = /^R:([A-Z]{3}):(\d+):([A-Z]{3}):(\d+)$/.exec(t)) && m[1] in MON && m[3] in MON) {
      if (lastRange || g.days.length) push(); g.dr = [MON[m[1]], +m[2], MON[m[3]], +m[4]]; curMonth = MON[m[3]]; lastRange = false; continue;
    }
    if (t in MON) { if (lastRange || g.days.length) push(); curMonth = MON[t]; g.month = curMonth; lastRange = false; continue; }
    if (/^\d{1,2}$/.test(t) && +t >= 1 && +t <= 31) { if (lastRange) push(); g.days.push(+t); lastRange = false; continue; }
    if ((m = /^(\d{1,2})-(\d{1,2})$/.exec(t)) && +m[2] <= 31) { if (lastRange) push(); for (let k = +m[1]; k <= +m[2]; k++) g.days.push(k); lastRange = false; continue; }
    if ((m = /^(\d{4})-(\d{4})$/.exec(t))) { if (onMode) { push(); onMode = false; } g.ranges.push([+m[1].slice(0, 2) * 60 + +m[1].slice(2), +m[2].slice(0, 2) * 60 + +m[2].slice(2)]); lastRange = true; continue; }
    if (t === 'ON' || t === 'EVERY') { onMode = true; continue; }
    if (t in WD) { if (lastRange && !onMode) push(); g.wd.push(WD[t]); if (!onMode) lastRange = false; continue; }
    if ((m = /^([A-Z]{3})-([A-Z]{3})$/.exec(t)) && m[1] in WD && m[2] in WD) {
      if (lastRange) push(); let k = WD[m[1]]; for (let c = 0; c < 7; c++) { g.wd.push(k); if (k === WD[m[2]]) break; k = (k + 1) % 7; } lastRange = false; continue;
    }
    if (t === 'DAILY' || t === 'AND' || t === 'UTC' || t === 'DLY') continue;
    if (t === 'H24') { g.ranges.push([0, 1440]); lastRange = true; continue; }
    return null;
  }
  push();
  return groups;
}
export function activeIn(n, ws, we) { // true / false / null(D항 해석불가)
  const s = Math.max(n.start ?? -Infinity, ws), e = Math.min(n.end ?? Infinity, we);
  if (s > e) return false;
  if (!n.D) return true;
  const groups = parseSchedule(n.D, n.start ?? ws);
  if (groups === null) return null;
  if (!groups.length) return true;
  const year0 = new Date(n.start ?? ws).getUTCFullYear(), m0 = new Date(n.start ?? ws).getUTCMonth();
  for (let day = Math.floor(s / DAY) * DAY - DAY; day <= e; day += DAY) {
    const dd = new Date(day);
    for (const g of groups) {
      if (g.days.length) {
        if (!g.days.includes(dd.getUTCDate())) continue;
        const gy = g.month < m0 ? year0 + 1 : year0;
        if (dd.getUTCMonth() !== g.month || dd.getUTCFullYear() !== gy) continue;
      }
      if (g.dr) {
        const md = dd.getUTCMonth() * 100 + dd.getUTCDate(), a0 = g.dr[0] * 100 + g.dr[1], b0 = g.dr[2] * 100 + g.dr[3];
        if (a0 <= b0 ? (md < a0 || md > b0) : (md < a0 && md > b0)) continue;
      }
      if (g.wd.length && !g.wd.includes(dd.getUTCDay())) continue;
      for (const [a, b] of g.ranges) {
        const is = day + a * MIN, ie = day + (b <= a ? b + 1440 : b) * MIN;
        if (is <= e && ie >= s) return true;
      }
    }
  }
  return false;
}

/* ------------------------------------------------------------------ */
/* 분석 컨텍스트                                                         */
/* ------------------------------------------------------------------ */
const STOP = new Set(('AND THE FOR NOT ALL ARE WILL WITH FROM THIS THAT INTO ONLY BTN FLW ACT AREA RWY TWY APCH DEP ARR FIR UIR ACC APP TWR '
  + 'VOR DME NDB ILS LOC GP RNAV RNP GPS GNSS ATC CTC REF AIP SUP AMDT NIL UFN EST TOC TOD SID STAR MSL AGL SFC GND UNL').split(' '));

export const DEFAULTS = { bufferNM: 25, before: 30, after: 120, altMargin: 2000, includeEra: true };

export function buildContext(ofp, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const etd = o.etdOverride ?? ofp.etd ?? Date.now();
  const shift = etd - (ofp.etd ?? etd);
  const pts = [];
  const depC = AIRPORTS[ofp.dep];
  if (depC && ofp.wpts[0] && ofp.wpts[0].name !== ofp.dep) pts.push({ name: ofp.dep, lat: depC[0], lon: depC[1], cum: 0, fl: null, phase: 'DEP', fir: ofp.pkgFirs?.[0] || null });
  pts.push(...ofp.wpts);
  const destC = AIRPORTS[ofp.dest];
  if (destC && pts.length && pts[pts.length - 1].name !== ofp.dest) pts.push({ name: ofp.dest, lat: destC[0], lon: destC[1], cum: (ofp.flightMin || pts[pts.length - 1].cum), fl: null, phase: 'ARR' });
  const route = pts.length > 1 ? densify(pts) : [];
  const eto = cum => etd + cum * MIN;
  const eta = ofp.flightMin != null ? eto(ofp.flightMin) : (ofp.eta ?? etd) + shift;

  // FIR 시간창
  const firWin = {};
  const entries = [{ fir: ofp.pkgFirs?.[0] || pts[0]?.fir || ofp.dep?.slice(0, 2) + 'RR', min: 0 }, ...(ofp.eet || [])];
  const total = ofp.flightMin ?? ofp.eetTotal ?? 0;
  entries.forEach((e, k) => {
    const nx = entries[k + 1] ? entries[k + 1].min : total;
    (firWin[e.fir] ||= []).push([eto(e.min), eto(nx)]);
  });
  for (const fir of ofp.pkgFirs || []) {
    if (firWin[fir]) continue;
    const same = Object.keys(firWin).filter(k => k.slice(0, 2) === fir.slice(0, 2));
    if (same.length) firWin[fir] = [[Math.min(...same.flatMap(k => firWin[k].map(w => w[0]))), eta]];
    else firWin[fir] = [[etd, eta]];
  }

  const wptNames = new Set(), navaids = new Map();
  for (const w of pts) {
    if (!w.name || w.isFirBdry || /^\d/.test(w.name) || STOP.has(w.name)) continue;
    wptNames.add(w.name);
    if (w.name.length <= 3 && w.fullName && w.fullName !== w.name) navaids.set(w.name, w.fullName);
  }
  for (const p of ofp.fplPoints || []) if (/^[A-Z]{2,5}$/.test(p) && !STOP.has(p) && p !== ofp.dep && p !== ofp.dest) wptNames.add(p);
  const airwayList = [...(ofp.airways || [])];
  // 항로별 구간(포함 웨이포인트)
  const awySeg = {};
  if (ofp.item15) {
    const toks = ofp.item15.split(/\s+/).slice(1).map(t => t.split('/')[0]);
    for (let k = 1; k < toks.length - 1; k++) if (ofp.airways.has(toks[k])) {
      const a = toks[k - 1], b = toks[k + 1];
      const ia = pts.findIndex(p => p.name === a), ib = pts.findIndex(p => p.name === b);
      if (ia >= 0 && ib >= ia) (awySeg[toks[k]] ||= []).push({ from: a, to: b, names: pts.slice(ia, ib + 1).map(p => p.name), ia, ib });
    }
  }
  const re = {
    awy: airwayList.map(a => [a, [...awyVariants(a)].map(v => [v, new RegExp(`(?<![A-Z0-9/])(?:[A-Z]\\/)?${v}(?![A-Z0-9])`, 'g')])]),
    wpt: [...wptNames].filter(w => w.length >= 2).map(w => [w, wordRe(w)]),
    nav: [...navaids].map(([id, full]) => [id, full, new RegExp(`${full.split(' ')[0]}\\s+(D?VOR|VORTAC|NDB|DME|TACAN)`)]),
    proc: [...(ofp.procedures || [])].map(p => [p, wordRe(p)]),
    ap: [ofp.dep, ofp.dest, ofp.altn, ...(ofp.fplAltn || [])].filter(Boolean).map(a => [a, wordRe(a)]),
  };
  return {
    re, o, ofp, pts, route, etd, eta, eto, firWin, wptNames, navaids, airwayList, awySeg,
    ourAirports: new Set([ofp.dep, ofp.dest, ofp.altn, ...(ofp.fplAltn || [])].filter(Boolean)),
    eraSet: new Set([...(ofp.era || []), ...(ofp.refile || [])]),
    refileEto: (() => { const r = ofp.rif?.[0]; const p = pts.find(x => x.name === r); return p ? eto(p.cum) : null; })(),
  };
}

/* ------------------------------------------------------------------ */
/* NOTAM 1건 분석                                                       */
/* ------------------------------------------------------------------ */
const wordRe = w => new RegExp(`(?<![A-Z0-9])${w.replace(/[/]/g, '\\/')}(?![A-Z0-9])`);
function awyVariants(a) { const s = new Set([a]); if (a.startsWith('U')) s.add(a.slice(1)); else s.add('U' + a); return s; }

export function analyze(n, ctx) {
  const { o } = ctx;
  const r = { status: 'relevant', reasons: [], excl: [], notes: [], hits: [], when: null, alt: null, shapes: [], group: n.sect };
  const stripPairs = x => x.replace(/\b[A-Z]{3}\/[A-Z]{3}\([^)]*\)/g, ' ');
  const txt = stripPairs((n.E + '\n' + n.comment).toUpperCase());
  const etxt = n.E.toUpperCase() + ' ' + (n.F ? `F)${n.F} G)${n.G}` : '');

  // ---- 공항 섹션 ----
  if (n.sect !== 'FIR' && n.sect !== 'ENR') {
    let ws, we, label;
    switch (n.sect) {
      case 'DEP': ws = ctx.etd - o.before * MIN; we = ctx.etd + o.after * MIN; label = `출발 ${fmtZ(ctx.etd, false)}`; break;
      case 'DEST': ws = ctx.eta - o.before * MIN; we = ctx.eta + o.after * MIN; label = `도착 ${fmtZ(ctx.eta, false)}`; break;
      case 'ALTN': ws = ctx.eta - o.before * MIN; we = ctx.eta + (o.after + 60) * MIN; label = `교체공항 도착 가능 시간 ${fmtZ(ctx.eta, false)} 이후`; break;
      case 'REFILE': { const t = ctx.refileEto ?? ctx.eta; ws = t - o.before * MIN; we = t + (o.after + 60) * MIN; label = `REFILE 지점 ${ctx.ofp.rif?.[0] || ''} ${fmtZ(t, false)} 기준`; break; }
      default: ws = ctx.etd; we = ctx.eta + o.after * MIN; label = `비행 전 구간 (${fmtZ(ctx.etd, false)}–${fmtZ(ctx.eta, false)})`;
    }
    r.when = { ws, we, label };
    const act = n.coad ? true : activeIn(n, ws, we);
    if (act === false) r.excl.push(`해당 시간대에 비활성 (${label})`);
    if (act === null) r.notes.push('D) 시간표를 자동 해석하지 못함 — 직접 확인');
    r.reasons.push(n.sect === 'ERA' ? 'ERA 공항' : n.sect === 'REFILE' ? 'REFILE 공항' : `${sectKo(n.sect)} 공항 NOTAM`);
    r.status = r.excl.length ? 'excluded' : (act === null ? 'review' : 'relevant');
    return r;
  }

  // ---- FIR / 항로 ----
  let idxs = []; // route(densified) index 범위 [min,max]
  const nameIdx = nm => ctx.pts.findIndex(p => p.name === nm);
  const ptToRoute = pi => ctx.route.findIndex(rp => rp.near === pi);

  // 1) 항로(airway)
  const segMiss = [];
  for (const [a, vars] of ctx.re.awy) {
    for (const [v, re] of vars) {
      if (!txt.includes(v)) continue;
      for (const m of txt.matchAll(re)) {
        const after = txt.slice(m.index + m[0].length, m.index + m[0].length + 40);
        const before = txt.slice(Math.max(0, m.index - 12), m.index);
        if (/TYPE\s*$|ACFT\s*$/.test(before)) continue;
        if (/^\/\d{2}\b/.test(after)) continue; // NOTAM 번호(A4646/26)
        const sg = /^[\s,(]*(?:SEGMENT\s*|SEG\s*|BTN\s*)?\(?([A-Z]{2,5})\s*-\s*([A-Z]{2,5})\b/.exec(after) || /^[\s,]*(?:SEGMENT|BTN)\s+([A-Z]{2,5})\s+(?:AND|-)\s+([A-Z]{2,5})/.exec(after);
        const seg = (ctx.awySeg[a] || []);
        if (sg) {
          const inSeg = seg.some(s => s.names.includes(sg[1]) || s.names.includes(sg[2])) || ctx.wptNames.has(sg[1]) || ctx.wptNames.has(sg[2]);
          if (!inSeg) { segMiss.push(`${v} ${sg[1]}-${sg[2]}`); continue; }
        }
        const s0 = seg[0];
        r.hits.push({ kind: '항로', id: a + (v !== a ? `(${v})` : ''), seg: sg ? `${sg[1]}-${sg[2]}` : (s0 ? `${s0.from}-${s0.to}` : '') });
        if (s0) { const i1 = ptToRoute(s0.ia), i2 = ptToRoute(s0.ib); if (i1 >= 0) idxs.push(i1, i2 >= 0 ? i2 : i1); }
        break;
      }
    }
  }
  // 2) 웨이포인트 / 항행시설
  for (const [w, re] of ctx.re.wpt) {
    if (!txt.includes(w) || !re.test(txt)) continue;
    if (w.length <= 3 && !ctx.navaids.has(w) && !/^[A-Z]{3}$/.test(w)) continue;
    const pi = nameIdx(w);
    r.hits.push({ kind: ctx.navaids.has(w) ? '항행시설' : '지점', id: w });
    if (pi >= 0) { const ri = ptToRoute(pi); if (ri >= 0) idxs.push(ri); }
  }
  for (const [id, full, nre] of ctx.re.nav) {
    if (r.hits.some(h => h.id === id)) continue;
    if (nre.test(txt)) {
      r.hits.push({ kind: '항행시설', id: `${id}(${full})` });
      const ri = ptToRoute(nameIdx(id)); if (ri >= 0) idxs.push(ri);
    }
  }
  for (const [p, pre] of ctx.re.proc) if (pre.test(txt)) r.hits.push({ kind: '절차', id: p });
  for (const [ap, are] of ctx.re.ap) if (are.test(txt)) {
    r.hits.push({ kind: '공항', id: ap });
    const ri = ap === ctx.ofp.dep ? 0 : ctx.route.length - 1; if (ctx.route.length) idxs.push(ri);
  }

  // 3) 좌표 지오메트리
  const shapes = (n.shapes0 || extractShapes(n.E + '\n' + n.D)).map(s => ({ ...s }));
  let geoNear = null, geoFar = null;
  if (shapes.length && ctx.route.length) {
    for (const s of shapes) {
      const ds = shapeDist(ctx.route, s, o.bufferNM);
      const thr = s.type === 'point' ? o.bufferNM : o.bufferNM;
      let mn = Infinity, mi = -1; const inIdx = [];
      ds.forEach((d, i) => { if (d < mn) { mn = d; mi = i; } if (d <= thr) inIdx.push(i); });
      s.minNM = Math.round(mn); s.nearIdx = mi;
      r.shapes.push(s);
      if (inIdx.length) { idxs.push(inIdx[0], inIdx[inIdx.length - 1]); geoNear = geoNear == null ? mn : Math.min(geoNear, mn); }
      else geoFar = geoFar == null ? mn : Math.min(geoFar, mn);
    }
    if (geoNear != null) r.hits.push({ kind: '좌표', id: geoNear < 1 ? '경로가 구역 통과' : `경로에서 ${Math.round(geoNear)}NM` });
  }

  // 4) 회사 영향 노선 목록 (COMMENT의 AFFECTED RTE)
  let company = null;
  if (/AFFECTED (RTE|ROUTE)/.test(n.comment.toUpperCase()) && ctx.ofp.cityPair) {
    const cm = n.comment.toUpperCase();
    const pairs = [...cm.matchAll(/([A-Z]{3})\/([A-Z]{3})\(([^)]*)\)/g)];
    if (pairs.length) {
      const mine = pairs.filter(p => `${p[1]}/${p[2]}` === ctx.ofp.cityPair);
      const codes = mine.flatMap(p => p[3].split(',').map(s => s.trim()));
      if (mine.length && ctx.ofp.routeCode && codes.includes(ctx.ofp.routeCode)) company = 'in';
      else company = mine.length ? 'pair-only' : 'none';
      r.company = { company, codes };
    }
  }

  const hasHit = r.hits.length > 0;
  const strongHit = r.hits.some(h => h.kind === '항로' || h.kind === '좌표' || h.kind === '공항' || h.kind === '절차');
  // 다른 항로/공항/시설만 언급?
  const otherAwy = [...etxt.matchAll(/(?:AWY|ATS (?:RTE|ROUTE)S?|ROUTE|RTE|AIRWAY)S?\s*(?:DESIGNATOR\s*)?(?:[A-Z]\/)?(U?[A-Z]{1,2}\d{1,4})\b/g)].map(m => m[1]).filter(a => !ctx.airwayList.some(x => awyVariants(x).has(a)));
  for (const m of etxt.matchAll(/(?:^|[\s-])(U?[A-Z]{1,2}\d{1,4})-[A-Z]{3,5}\b|[A-Z]{3,5}-(U?[A-Z]{1,2}\d{1,4})(?=[\s-]|$)/g)) {
    const a = m[1] || m[2]; if (!ctx.airwayList.some(x => awyVariants(x).has(a))) otherAwy.push(a);
  }
  const quotedNav = [...etxt.matchAll(/'([A-Z]{2,3})'/g)].map(m => m[1]).filter(x => !ctx.wptNames.has(x));
  const navCat = /NAVAID/.test(n.cat.toUpperCase());

  if (!hasHit) {
    if (segMiss.length) { r.status = 'review'; r.reasons.push(`같은 항로의 다른 구간: ${segMiss.slice(0, 3).join(', ')}`); }
    else if (geoFar != null && !shapes.some(s => s.type !== 'point' ? false : false)) { r.excl.push(`좌표가 경로에서 ${Math.round(geoFar)}NM 떨어짐 (기준 ${o.bufferNM}NM)`); }
    else if (navCat && (quotedNav.length || /VOR|DME|NDB|ILS|TACAN/.test(etxt))) r.excl.push(`경로에 없는 항행시설${quotedNav.length ? ` (${quotedNav.join(', ')})` : ''}`);
    else if (otherAwy.length) r.excl.push(`경로에 없는 항로만 언급 (${[...new Set(otherAwy)].slice(0, 5).join(', ')})`);
    else { r.status = 'review'; r.reasons.push('위치 특정 없음 — FIR 전반 적용 가능'); }
  } else {
    r.reasons.push(...r.hits.map(h => `${h.kind} ${h.id}${h.seg ? ` (${h.seg})` : ''}`));
    if (segMiss.length) r.notes.push(`다른 구간 언급: ${segMiss.slice(0, 3).join(', ')}`);
    if (!strongHit && otherAwy.length) { r.status = 'review'; r.notes.push(`주 대상은 다른 항로(${[...new Set(otherAwy)].slice(0, 4).join(', ')}) — 경로 지점만 언급됨`); }
  }
  if (/NO COMPANY (RTE|ROUTE)S? INCLUDED|NO COMPANY (RTE|ROUTE)S? AFFECTED/.test(n.comment.toUpperCase())) r.excl.push('회사 COMMENT: 회사 노선 해당 없음');
  if (company === 'in') r.reasons.unshift(`회사 영향 노선에 ${ctx.ofp.routeCode} 포함`);
  else if (company === 'pair-only') r.excl.push(`회사 영향 노선 목록에 ${ctx.ofp.cityPair}는 있으나 ${ctx.ofp.routeCode}는 없음`);
  else if (company === 'none') r.excl.push(`회사 영향 노선 목록에 ${ctx.ofp.cityPair || '본 노선'} 없음`);

  // 5) 시간
  let ws, we, label;
  if (idxs.length && ctx.route.length) {
    const a = Math.min(...idxs), b = Math.max(...idxs);
    const ra = ctx.route[a], rb = ctx.route[b];
    ws = ctx.eto(ra.cum) - o.before * MIN; we = ctx.eto(rb.cum) + o.after * MIN;
    const pa = ctx.pts[ra.near], pb = ctx.pts[rb.near];
    label = a === b || pa === pb ? `${pa?.name || ''} ${fmtZ(ctx.eto(ra.cum), false)} 통과 예정` : `${pa?.name} ${fmtZ(ctx.eto(ra.cum), false)} ~ ${pb?.name} ${fmtZ(ctx.eto(rb.cum), false)}`;
    // 고도
    const fls = ctx.route.slice(a, b + 1).map(x => x.fl);
    const nullFl = fls.some(x => x == null);
    const ok = fls.filter(x => x != null);
    r.alt = { our: nullFl ? (ok.length ? `상승/강하 포함 (~FL${Math.max(...ok)})` : '상승/강하 구간') : (Math.min(...ok) === Math.max(...ok) ? `FL${ok[0]}` : `FL${Math.min(...ok)}–${Math.max(...ok)}`) };
    const lo = parseAlt(n.F), hi = parseAlt(n.G);
    if ((lo || hi) && !nullFl && ok.length) {
      const ourLo = Math.min(...ok) * 100, ourHi = Math.max(...ok) * 100;
      const L = lo ? lo.ft : 0, H = hi ? hi.ft + (hi.agl ? 3000 : 0) : 99999;
      r.alt.area = `${n.F || 'SFC'} ~ ${n.G || 'UNL'}`;
      if (H + o.altMargin < ourLo) r.excl.push(`고도 무관: 구역 상한 ${n.G} < 통과고도 ${r.alt.our}`);
      else if (L - o.altMargin > ourHi) r.excl.push(`고도 무관: 구역 하한 ${n.F} > 통과고도 ${r.alt.our}`);
    } else if (lo || hi) r.alt.area = `${n.F || 'SFC'} ~ ${n.G || 'UNL'}`;
  } else {
    const fir = n.sectIcao;
    const wins = ctx.firWin[fir] || [[ctx.etd, ctx.eta]];
    ws = Math.min(...wins.map(w => w[0])) - o.before * MIN; we = Math.max(...wins.map(w => w[1])) + o.after * MIN;
    label = `${fir} FIR ${wins.map(w => `${fmtZ(w[0], false)}–${fmtZ(w[1], false)}`).join(', ')}`;
  }
  r.when = { ws, we, label };
  if (idxs.length && ctx.route.length > 1) {
    const a = Math.min(...idxs), b = Math.max(...idxs);
    const p1 = ctx.route[Math.max(0, a - 1)].p, p2 = ctx.route[Math.min(ctx.route.length - 1, b + 1)].p;
    const dLon = ((p2[1] - p1[1] + 540) % 360) - 180, dLat = p2[0] - p1[0];
    const ours = Math.abs(dLon) * Math.cos(rad(p1[0])) >= Math.abs(dLat) ? (dLon > 0 ? 'EAST' : 'WEST') : (dLat > 0 ? 'NORTH' : 'SOUTH');
    const ds = [...new Set([...txt.matchAll(/\b(EAST|WEST|NORTH|SOUTH)BOUND\b/g)].map(m => m[1]))];
    if (ds.length && !ds.includes(ours)) { r.notes.push(`${ds.map(d => d + 'BOUND').join('/')} 대상 — 본 비행은 ${ours}BOUND`); if (r.status === 'relevant') r.status = 'review'; }
  }
  const act = n.coad ? true : activeIn(n, ws, we);
  if (act === false) r.excl.push(`통과 시간대에 비활성 (${label})`);
  if (act === null) r.notes.push('D) 시간표 자동 해석 불가 — 직접 확인');

  if (r.excl.length) r.status = 'excluded';
  else if (act === null && r.status === 'relevant') r.status = 'review';
  return r;
}

export function sectKo(s) {
  return { DEP: '출발', DEST: '목적지', ALTN: '교체', REFILE: 'REFILE', ERA: 'ERA', FIR: 'FIR', ENR: '항로' }[s] || s;
}

// 파싱(한 번) → 판정(설정이 바뀔 때마다)
export function prepare(lines) {
  const L = cleanLines(lines);
  const ofp = parseOFP(L);
  const { notams, sections } = parseNotams(L);
  for (const n of notams) n.shapes0 = extractShapes(n.E + '\n' + n.D);
  return { ofp, notams, sections };
}
export function evaluate(prep, opts) {
  const ctx = buildContext(prep.ofp, opts);
  for (const n of prep.notams) n.a = analyze(n, ctx);
  return { ...prep, ctx };
}
export function runAll(lines, opts) { return evaluate(prepare(lines), opts); }
