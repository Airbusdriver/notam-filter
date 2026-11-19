// mel.js — OFP "DISPATCH RELEASE INFORMATION" 페이지의 "MEL / CDL ITEMS" 항목
// 업로드한 OFP마다 새로 읽는다 (특정 편명·등록부호에 고정된 값 없음)

// ATA 장(chapter) 이름 — 참고 표시용
export const ATA = {
  '05': 'Time Limits / Checks', '11': 'Placards', '21': 'Air Conditioning · 공조', '22': 'Auto Flight · 자동비행', '23': 'Communications · 통신',
  '24': 'Electrical Power · 전기', '25': 'Equipment / Furnishings · 객실 장비', '26': 'Fire Protection · 화재 방호', '27': 'Flight Controls · 비행 조종',
  '28': 'Fuel · 연료', '29': 'Hydraulic Power · 유압', '30': 'Ice & Rain Protection · 방빙/방우', '31': 'Indicating / Recording · 지시/기록',
  '32': 'Landing Gear · 착륙장치', '33': 'Lights · 조명', '34': 'Navigation · 항법', '35': 'Oxygen · 산소', '36': 'Pneumatic · 공압',
  '38': 'Water / Waste · 급배수', '42': 'Integrated Modular Avionics · IMA', '44': 'Cabin Systems · 객실 시스템', '45': 'Central Maintenance System',
  '46': 'Information Systems · 정보 시스템', '47': 'Inert Gas System · 연료탱크 불활성화', '49': 'APU', '50': 'Cargo Compartments · 화물칸',
  '51': 'Structures (General)', '52': 'Doors · 도어', '53': 'Fuselage · 동체', '54': 'Nacelles / Pylons · 나셀/파일론', '55': 'Stabilizers · 안정판',
  '56': 'Windows · 창', '57': 'Wings · 날개', '70': 'Power Plant (General)', '71': 'Power Plant · 동력장치', '72': 'Engine · 엔진', '73': 'Engine Fuel & Control',
  '74': 'Ignition · 점화', '75': 'Engine Air · 엔진 공기', '76': 'Engine Controls', '77': 'Engine Indicating', '78': 'Exhaust / Reverser · 배기/역추력',
  '79': 'Oil · 오일', '80': 'Starting · 시동',
};

const HEAD = /^\s*(\d{1,2})\s*\.\s*MEL\s*\/\s*CDL\s+ITEMS?\b/i;      // "3. MEL / CDL ITEMS"
const NEXT = /^\s*\d{1,2}\s*\.\s+[A-Z][A-Z /&()-]{3,}$/;               // "4. FUEL BURN ADJUSTMENT"
const ITEM = /^\s*-\s*([A-Z]{2,4})\s+([0-9A-Z][0-9A-Z-]*)\s*:\s*(.*)$/; // "- MEL 21-59-01A : …" / "- CDL 27-21 : …"
const NIL = /^\s*-?\s*(NIL|NONE|N\/A|NO (MEL|CDL|ITEMS?)\b.*)\s*$/i;
const TRUNC_LEN = 36; // OFP가 설명을 약 40자에서 자르는 경우 (pdf 추출 시 겹공백이 줄어 몇 자 짧아짐)

const unbalanced = s => (s.match(/"/g) || []).length % 2 === 1 || (s.match(/\(/g) || []).length > (s.match(/\)/g) || []).length;

export function parseMel(T) {
  const r = { warnings: [], items: [], notes: [], raw: [] };
  const di = T.findIndex(t => /DISPATCH RELEASE INFORMATION/.test(t));
  const from = di >= 0 ? di : 0;
  const hi = T.findIndex((t, i) => i >= from && HEAD.test(t));
  if (hi < 0) { r.found = false; r.warnings.push('DISPATCH RELEASE INFORMATION 페이지에서 "MEL / CDL ITEMS" 항목을 찾지 못했습니다.'); return r; }
  r.found = true;
  if (di >= 0) {
    r.release = T[di].replace(/^[-\s]+|[-\s]+$/g, '');
    const rl = T.slice(di, di + 6).find(t => /I HEREBY RELEASE THE FLIGHT/.test(t));
    if (rl) { r.releaseLine = rl.trim(); const m = /,\s*([A-Z]{2}\d{3,5}|[A-Z]-?[A-Z0-9]{3,5})\s*,\s*ETD/.exec(rl); if (m) r.reg = m[1]; }
  }

  // 항목 범위: 머리 다음 줄 ~ 다음 번호 머리("4. FUEL BURN …") 전
  let end = T.findIndex((t, i) => i > hi && NEXT.test(t.trim()));
  if (end < 0) end = Math.min(T.length, hi + 40);
  r.raw = T.slice(hi, end);
  for (const t of T.slice(hi + 1, end)) {
    const s = t.trim(); if (!s) continue;
    const m = ITEM.exec(s);
    if (m) {
      const [, type, ref, desc] = m;
      const ch = (/^(\d{2})/.exec(ref) || [])[1] || null;
      r.items.push({ type, ref, desc: desc.trim(), ata: ch, ataName: ch ? ATA[ch] || null : null, line: s });
    } else if (NIL.test(s)) r.nil = true;
    else if (r.items.length) r.items[r.items.length - 1].desc += ' ' + s; // 이어지는 줄
    else r.notes.push(s);
  }
  for (const it of r.items) it.trunc = it.desc.length >= TRUNC_LEN || unbalanced(it.desc);
  if (!r.items.length && !r.nil) r.nil = true; // 머리만 있고 항목 없음 → NIL로 표시

  // 디스패치 노트 중 MEL/CDL 관련 문장 (예: "CHECKED ABOVE MEL (NO RESTRICTION ON FLIGHT PLANNING)")
  const stop = T.findIndex((t, i) => i > end && /\*\*\* ATTENTION \*\*\*|WEATHER BRIEFING/.test(t));
  for (const t of T.slice(end, stop > 0 ? stop : end + 40)) if (/\b(MEL|CDL)\b/.test(t)) r.notes.push(t.trim().replace(/^-\s*/, ''));

  r.counts = { MEL: r.items.filter(i => i.type === 'MEL').length, CDL: r.items.filter(i => i.type === 'CDL').length };
  r.ok = true;
  return r;
}
