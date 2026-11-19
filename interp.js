// interp.js — NOTAM 오프라인 한국어 해석 (규칙 기반: 유형별 요약 + 구조화 정보 + 약어 풀이)
import { parseSchedule, fmtZ, sectKo } from './core.js';

export const CAT_KO = {
  'RUNWAY': '활주로', 'TAXIWAY': '유도로', 'RAMP': '램프·주기장', 'NAVAID': '항행안전시설', 'APPROACH': '접근',
  'DEPARTURE': '출발', 'RUNWAY LIGHT': '활주로 등화', 'APPROACH LIGHT': '접근등', 'AIRSPACE': '공역', 'AIRWAY': '항로',
  'GPS': 'GPS/GNSS', 'COMMUNICATION': '통신', 'OTHER': '기타', 'COMPANY ADVISORY': '회사 공지', 'OBSTACLE': '장애물',
  'AERODROME': '비행장', 'FACILITY': '시설', 'ARRIVAL': '도착', 'APRON': '계류장', 'LIGHTING': '등화', 'WARNING': '경고',
};

// ICAO NOTAM 약어 → 한국어
export const ABBR = {
  ABN: '비행장등대', ABV: '이상', ACC: '지역관제소', ACFT: '항공기', ACT: '활성', ACTIVATED: '활성화됨', AD: '비행장', ADJ: '인접',
  'ADS-B': '자동종속감시방송', 'ADS-C': '자동종속감시계약', AFIS: '비행장비행정보업무', AGL: '지표기준', AIP: '항공정보간행물',
  ALS: '접근등화', ALT: '고도', ALTN: '교체공항', AMDT: '개정', AMSL: '평균해수면기준', APCH: '접근', APN: '계류장', APP: '접근관제',
  APR: '4월', APRX: '약', APV: '승인', ARP: '비행장기준점', ARR: '도착', ASDA: '가속정지가용거리', ATC: '항공교통관제', ATIS: '자동비행정보',
  ATS: '항공교통업무', AUTH: '승인', AVBL: '사용가능', AWY: '항로', AZM: '방위각', BCST: '방송', BDRY: '경계', BLW: '이하', BRG: '방위',
  BTN: '사이', CAT: '범주', CFM: '확인', CH: '채널', CHG: '변경', CHGD: '변경됨', CIV: '민간', CL: '중심선', CLBR: '교정', CLSD: '폐쇄',
  CLOSED: '폐쇄', CMB: '상승', CNL: '취소', COM: '통신', CONC: '콘크리트', COORD: '좌표/조정', COP: '변경지점', CPDLC: '관제사-조종사 데이터링크',
  CTA: '관제구역', CTC: '연락', CTL: '관제', CTN: '주의', CTR: '관제권', DCT: '직항', DEG: '도', DEP: '출발', DES: '강하', DIST: '거리',
  DLY: '매일', DME: '거리측정시설', DP: '제빙패드', DVOR: '도플러VOR', E: '동', EB: '동향', ELEV: '표고', EMERG: '비상', ENR: '항로',
  EQPT: '장비', EST: '예상', ETA: '도착예정', ETD: '출발예정', EXC: '제외', EXER: '훈련', FAF: '최종접근지점', FIC: '비행정보센터',
  FIR: '비행정보구역', FL: '비행고도', FLT: '비행', FLW: '다음과같이', FM: '부터', FPL: '비행계획', FREQ: '주파수', FRNG: '사격',
  FT: '피트', GND: '지면', GNSS: '위성항법', GP: '활공각', GPS: 'GPS', H24: '24시간', HDG: '기수방향', HEL: '헬기', HGT: '높이',
  HLDG: '대기(홀딩)', HR: '시간', IAC: '계기접근차트', IAF: '초기접근지점', IAP: '계기접근절차', IAS: '지시대기속도', ID: '식별부호',
  IFR: '계기비행', ILS: '계기착륙시설', IM: '내측마커', INFO: '정보', INOP: '작동불가', INSTL: '설치', INT: '교차점', INTL: '국제',
  KM: 'km', KT: '노트', LAT: '위도', LDA: '착륙가용거리', LDG: '착륙', LGT: '등화', LGTD: '등화설치', LOC: '로컬라이저', LONG: '경도',
  LTD: '제한', MAG: '자기', MAINT: '정비', MAX: '최대', MET: '기상', MHZ: 'MHz', KHZ: 'kHz', MIL: '군', MIN: '분/최저', MKR: '마커',
  MNM: '최저', MOA: '군작전구역', MOCA: '최저장애물회피고도', MON: '감시', MSA: '최저안전고도', MSL: '해수면', MTA: '군훈련구역',
  NAV: '항법', NB: '북향', NDB: '무지향표지', NIL: '없음', NM: '해리', NML: '정상', NOF: 'NOTAM 사무소', NR: '번호', NXT: '다음',
  OBS: '관측', OBST: '장애물', OCA: '장애물회피고도', OCH: '장애물회피높이', OPN: '개방', OPR: '운영', OPS: '운항', OTS: '사용중지',
  OUT: '중단', PAPI: '정밀진입경로지시등', PARL: '평행', PAX: '승객', PCN: '포장강도', PERM: '영구', PJE: '낙하산강하훈련',
  PPR: '사전허가필요', PROC: '절차', PROHIBITED: '금지', PROV: '임시', PSN: '위치', PSR: '1차레이더', PWR: '출력', QDM: '자방위',
  RAD: '반경', RADAR: '레이더', RCL: '활주로중심선', RCLL: '활주로중심선등', RDO: '무선', REDL: '활주로경계등', REF: '참조',
  RENL: '활주로종단등', REQ: '요청', RESTRICTED: '제한', RMK: '비고', RNAV: '지역항법', RNP: '요구항법성능', RTE: '노선/항로',
  RVR: '활주로가시거리', RVSM: '수직분리축소', RWY: '활주로', S: '남', SAR: '수색구조', SB: '남향', SEC: '초', SECT: '구역',
  SEG: '구간', SEGMENT: '구간', SER: '업무', SFC: '지표면', SID: '표준계기출발', SKED: '정기', SR: '일출', SS: '일몰', SSR: '2차레이더',
  STAR: '표준계기도착', STD: '표준', SUP: '보충판', SVC: '업무', TAR: '터미널레이더', TDZ: '접지구역', TEMPO: '임시', TFC: '교통',
  THR: '활주로시단', TIL: '까지', TKOF: '이륙', TMA: '접근관제구역', TODA: '이륙가용거리', TORA: '이륙활주가용거리', TRA: '임시예약공역',
  TWR: '관제탑', TWY: '유도로', U: '상층', UAS: '무인항공기', UFN: '추가통보시까지', UIR: '상층비행정보구역', UNL: '무제한',
  'U/S': '사용불가', UTC: '협정세계시', VAR: '편차', VASIS: '시각진입각지시', VDGS: '시각도킹유도', VER: '수직', VFR: '시계비행',
  VIS: '시정', VOR: '전방향표지', VORTAC: 'VOR+TACAN', W: '서', WB: '서향', WEF: '부터 유효', WI: '이내', WIE: '즉시', WIP: '공사중',
  WKN: '약화', WX: '기상', ACT_: '', ESTABLISHED: '설정됨', REALIGNED: '재정렬', WITHDRAWN: '폐지', REPLACEMENT: '교체',
  'DE-ICING': '제빙', DEICING: '제빙', CRANE: '크레인', LASER: '레이저', FIRING: '사격', EXERCISE: '훈련', MILITARY: '군',
  UNRELIABLE: '신뢰불가', INTERMITTENTLY: '간헐적', CAUTION: '주의', INSTEAD: '대신', STAND: '주기장', STANDS: '주기장', APRON: '계류장',
  HOLDING: '대기', PROCEDURE: '절차', MANDATORY: '의무', REQUIRED: '필요', PERMITTED: '허용', EXCEPT: '제외', BUFFER: '완충',
  ZONE: '구역', AREA: '구역', CIRCLE: '원', RADIUS: '반경', CENTERED: '중심', BOUNDED: '경계', LATERAL: '수평', VERTICAL: '수직',
  LIMITS: '한계', LIMIT: '한계', LOWER: '하한', UPPER: '상한', DUE: '~로인해', MAINTENANCE: '정비', CONSTRUCTION: '공사',
  SEPARATION: '분리', TEMPORARY: '임시', PERMANENT: '영구', CANCELLED: '취소', REPORT: '보고', REPORTING: '보고', SECURITY: '보안',
  SURVEILLANCE: '감시', TRANSPONDER: '트랜스폰더', DESCENT: '강하', OFFSET: '오프셋', EASTBOUND: '동쪽방향', WESTBOUND: '서쪽방향',
  NORTHBOUND: '북쪽방향', SOUTHBOUND: '남쪽방향', CALLSIGN: '호출부호', FLOW: '흐름', MOVEMENT: '이동', MARKING: '표지',
  CLSD_: '', BEAM: '광선', DISTRACTION: '시야방해', ADVISORY: '권고', UNSERVICEABLE: '사용불가', SERVICE: '운용',
};
const SKIP_GLOSS = new Set(['FIR', 'E', 'W', 'S', 'U', 'MIN', 'OUT', 'ACT_', 'CLSD_', 'GPS', 'KM', 'MHZ', 'KHZ', 'NM', 'FT', 'KT', 'UTC', 'RADAR']);

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- 유형별 요약 규칙 ---------- */
const FAC = { 'VOR/DME': 'VOR/DME', 'DVOR/DME': 'DVOR/DME', VORTAC: 'VORTAC', TACAN: 'TACAN', NDB: 'NDB', DME: 'DME', VOR: 'VOR', DVOR: 'DVOR', ILS: 'ILS', LOC: '로컬라이저(LOC)', GP: '활공각(GP)', GS: '활공각(GS)' };
function navaidLine(E) {
  const f = /\b(DVOR\/DME|VOR\/DME|VORTAC|TACAN|DVOR|VOR|NDB|DME|ILS|LOC|GP)\b/.exec(E);
  if (!f) return null;
  const id = /'([A-Z]{2,3})'/.exec(E) || new RegExp(`${f[1].replace('/', '\\/')}\\s+([A-Z]{2,3})\\b`).exec(E) || /\b([A-Z]{2,3})\s+(?:D?VOR|NDB|TACAN)/.exec(E);
  const fr = /(\d{3}\.\d{1,3})\s?MHZ/.exec(E) || /(\d{3,4})\s?KHZ/.exec(E);
  const name = /\b([A-Z]{4,})\s+(?:D?VOR|VORTAC|TACAN|NDB)/.exec(E);
  const bad = /U\/S|OUT OF SERVICE|UNSERVICEABLE|NOT AVBL|OTS|WITHDRAWN|ON MAINT|DO NOT USE/.test(E);
  const part = /PART|DVOR PART|DME PART/.test(E) ? ' 일부' : '';
  return `${name && !FAC[name[1]] ? name[1] + ' ' : ''}${FAC[f[1]] || f[1]}${id && id[1] !== f[1] ? ` '${id[1]}'` : ''}${fr ? ` (${fr[1]}${fr[0].includes('KHZ') ? 'kHz' : 'MHz'})` : ''}${part} ${bad ? '사용 불가' : '변경/운용 공지'}`;
}
const RULES = [
  [/TRIGGER NOTAM/, E => { const m = /AIP\s+(SUP|AMDT|SUPPLEMENT)\s*([\d\/]+)/.exec(E); return `AIP ${m ? (m[1] === 'AMDT' ? '개정 ' : '보충판(SUP) ') + m[2] : ''} 발효 안내 (트리거 NOTAM — 상세는 AIP 참조)`; }],
  [/\bRWY\s+\d{2}[LRC]?(\/\d{2}[LRC]?)?\s+(CLSD|CLOSED)/, E => { const m = /\bRWY\s+(\d{2}[LRC]?(?:\/\d{2}[LRC]?)?)\s+(?:CLSD|CLOSED)/.exec(E); return `활주로 ${m[1]} 폐쇄`; }],
  [/\bTWY\b[^.\n]*?\b(CLSD|CLOSED)\b/, E => { const m = /\bTWY\s+([A-Z0-9][A-Z0-9 ,\/AND]*?)\s+(?:(?:SOUTH|NORTH|EAST|WEST) OF (?:TWY )?[A-Z0-9]+\s+)?(?:CLSD|CLOSED)/.exec(E); return `유도로${m ? ' ' + m[1].replace(/\s+AND\s+/g, ', ').trim() : ''} 폐쇄${/SOUTH OF|NORTH OF|EAST OF|WEST OF|BTN/.test(E) ? ' (일부 구간)' : ''}`; }],
  [/\bTWY\b[^.\n]*\b(LTD|NOT PERMITTED|RESTRICTED)\b/, E => { const m = /CODE LETTER ([A-F])/.exec(E), t = /TYPE ([AB]\d{3}|[A-Z]\d{2,3})\b/.exec(E); return `유도로 사용 제한${m ? ` (코드 ${m[1]} 이하 항공기만)` : ''}${t ? ` (${t[1]} 불가)` : ''}`; }],
  [/(STANDS?|PRKG PSN|STAND NR)\b[^.\n]*\b(CLSD|CLOSED)/, () => '주기장(스탠드) 폐쇄'],
  [/(PRKG PSN|STAND)[^.\n]*DIMENSION/, () => '주기장 규격(최대 날개폭·길이) 변경'],
  [/\b(DVOR\/DME|VOR\/DME|VORTAC|TACAN|DVOR|VOR|NDB|DME)\b[^\n]{0,80}?(U\/S|OUT OF SERVICE|UNSERVICEABLE|NOT AVBL|ON MAINT)/, navaidLine],
  [/SUSPENDED/, E => { const it = [...new Set([...E.matchAll(/(?:^|[:,.]\s*)([A-Z0-9][A-Z0-9 \/]{2,40}?)\s+SUSPENDED/g)].map(m => m[1].trim()))]; return `절차 일시 중단${it.length ? ': ' + it.slice(0, 5).join(', ') : ''}`; }],
  [/OCA\(H\) VALUES RAISED/, E => { const it = [...new Set([...E.matchAll(/((?:LPV|LNAV|RNP|ILS|LOC|VOR)[A-Z0-9 \/]*?RWY \d{2}[LRC]?)/g)].map(m => m[1].trim()))]; return `접근 최저치 OCA(H) 상향${it.length ? ': ' + it.slice(0, 4).join(', ') : ''}`; }],
  [/GBAS DOWNGRADED/, E => `GBAS(GLS) 등급 하향${/CAT 1|CAT I\b/.test(E) ? ' — CAT I만 가능' : ''}`],
  [/GP COVERAGE|IFWR/, () => 'ILS 활공각(GP) 커버리지 제한 — 범위 밖 사용 금지'],
  [/([A-Z][A-Z\-]+) SERVICE NOT AVAILABLE/, E => `${/([A-Z][A-Z\-]+) SERVICE NOT AVAILABLE/.exec(E)[1]} 서비스 중단`],
  [/TAXI IN NOT POSS/, E => { const m = /STAND\s+(\S+)/.exec(E); return `주기장 ${m ? m[1] + ' ' : ''}자력 진입(Taxi-in) 불가`; }],
  [/(HOLDING POINT|HLDG POINT)[^.]*RELOCATED/, () => '활주로 대기지점(홀딩포인트) 위치 이동'],
  [/USING APU|APU\(AUXILIARY POWER UNIT\)/, () => '게이트에서 APU 사용 제한 — GPU·PCA 사용'],
  [/ANTI-ICING FLUID|KILFROST|TYPE 1,4/, () => '제·방빙액 종류 안내'],
  [/\b(ILS|LOC|GP|GS)\b[^\n]{0,60}?(U\/S|OUT OF SERVICE|UNSERVICEABLE|NOT AVBL)/, navaidLine],
  [/(PAPI|ALS|REDL|RCLL|RENL|TDZ|LGT|LIGHT)S?\b[^.\n]*(U\/S|OUT OF SERVICE|UNSERVICEABLE|NOT AVBL|INOP)/, E => `등화${(/(PAPI|ALS|REDL|RCLL|RENL|TDZ)/.exec(E) || [, ''])[1] ? ' ' + /(PAPI|ALS|REDL|RCLL|RENL|TDZ)/.exec(E)[1] : ''} 사용 불가`],
  [/(TEMPO\s+(?:RESTRICTED|PROHIBITED|DANGER)\s+AREA)|(?<!SPECIAL )(RESTRICTED|PROHIBITED|DANGER)\s+AREA\b[^.]{0,30}\b(ACT|ACTIVATED|ESTABLISHED)\b/, E => { const m = /(TEMPO\s+)?(RESTRICTED|PROHIBITED|DANGER)\s+AREA/.exec(E); const k = { RESTRICTED: '제한구역', PROHIBITED: '금지구역', DANGER: '위험구역' }[m[2]]; const st = /ESTABLISHED/.test(E) ? '설정' : /ACT/.test(E) ? '활성화' : '관련'; return `${m[1] ? '임시 ' : ''}${k} ${st}`; }],
  [/SPECIAL RESTRICTED AREA/, E => { const n = /\(([A-Z]{2}\(SR\)\d+)\)/.exec(E); return `특별제한구역${n ? ' ' + n[1] : ''} — 진입 전 보안상태 보고 등 요구`; }],
  [/MILITARY TRAINING AREA|\bMTA\b/, E => { const n = /(?:MTA|AREA\s*-?)\s+([A-Z][A-Z ]{2,20}?)\s*(?:\(|-|ACT|ESTABLISHED)/.exec(E); return `군 훈련공역${n ? ' ' + n[1].trim() : ''} ${/ESTABLISHED/.test(E) ? '설정 (활성 시각은 별도 NOTAM)' : '활성화'}`; }],
  [/FIRING|LIVE FIRE|MISSILE|ROCKET|FRNG/, () => '사격(실사격) 훈련 — 해당 공역 회피/제한'],
  [/TEST FLT WILL|TEST FLIGHTS? WILL/, () => '시험비행 실시'],
  [/MASS MOVEMENT/, () => '대규모 항공기 이동(편대 비행) — 지정 구역 내'],
  [/(GPS|GNSS)[^.]*?(UNREL|LOST|NOT BE RECEIVED|INTERFERENCE|JAMMING|SPOOF|INTERRUPT)|(UNRELIABLE|LOST|INTERFERENCE)[^.]*?(GPS|GNSS)/, () => 'GPS(GNSS) 신호 불안정·상실 보고 — 사용 시 각별히 주의'],
  [/FLOW CTL|FLOW CONTROL/, () => '교통 흐름 관리(Flow control) 시행'],
  [/FL\s?(\d{3})\s+NOT AVBL/, E => [...E.matchAll(/FL\s?(\d{3})\s+NOT AVBL/g)].map(m => `FL${m[1]} 사용 불가`).join(', ')],
  [/FL\s?(\d{3})\s+AT OR BELOW AVBL/, E => `FL${/FL\s?(\d{3})\s+AT OR BELOW AVBL/.exec(E)[1]} 이하만 사용 가능`],
  [/(\d+)\s?MIN SEPARATION/, E => `동일 고도 ${/(\d+)\s?MIN SEPARATION/.exec(E)[1]}분 간격 분리`],
  [/SEGMENTS?\s+(CLSD|CLOSED)|CLSD TO ALL TFC/, E => {
    const segs = [...E.matchAll(/AWY\s+((?:[A-Z]\/)?U?[A-Z]{1,2}\d+)\s+([A-Z]{2,5})-([A-Z]{2,5})\s+SEGMENT/g)].map(m => `${m[1]} ${m[2]}–${m[3]}`);
    const l = [...E.matchAll(/\b(U?[A-Z]\d{2,4})\s+([A-Z]{3,5})-([A-Z]{3,5}),?/g)].map(m => `${m[1]} ${m[2]}–${m[3]}`);
    const all = segs.length ? segs : l;
    if (/CLSD TO ALL TFC/.test(E)) { const b = /([A-Z]{3,5}) FIR BDRY CLSD TO ALL TFC (AT AND BELOW|AT AND ABOVE) FL(\d{3})/.exec(E); if (b) return `${b[1]} FIR 경계 지점 FL${b[3]} ${b[2] === 'AT AND BELOW' ? '이하' : '이상'} 통과 금지`; }
    return `항로 구간 폐쇄${all.length ? ': ' + all.slice(0, 8).join(', ') + (all.length > 8 ? ` 외 ${all.length - 8}건` : '') : ''}`;
  }],
  [/ROUTE DESIGNATOR\s+\S+\s+SPECIFICATIONS CHANGED|REALIGNED/, E => { const m = /(?:ROUTE DESIGNATOR|ATS ROUTE)\s+(\S+)/.exec(E); return `항로${m ? ' ' + m[1] : ''} 제원(트랙·고도한계 등) 변경`; }],
  [/EMERGENCY DESCENT/, () => '특별 비상강하 절차: 진행 트랙에서 우측 30° 선회, 5NM 오프셋 후 강하'],
  [/LATERAL OFFSET/, E => { const m = /OFFSET AT A DISTANCE OF\s*(\d+)\s*NM TO THE (RIGHT|LEFT)/.exec(E); return `측방 오프셋${m ? ` ${m[1]}NM ${m[2] === 'RIGHT' ? '우측' : '좌측'}` : ''} 비행 요구`; }],
  [/SECURITY STATUS/, E => { const pts = [...new Set([...E.matchAll(/REPORTING POINT:\s*([A-Z]{3,5})/g)].map(m => m[1]))]; return `특별제한구역 진입 전 보안상태 ATC 보고${pts.length ? ` (보고지점 ${pts.length}곳)` : ''}`; }],
  [/RADIO TELEPHONY CALLSIGN|CALL ?SIGN[^.]*CHANGE/, () => '무선 호출부호(콜사인) 변경'],
  [/LASER/, () => '레이저 광선 방사(레이저 쇼) — 시야 방해 주의'],
  [/\bCRANE|\bOBST/, () => '장애물(크레인 등) 설치'],
  [/SHALL NOT EXCEED\s+(\d+)\s?KT|SPEED RESTRICTION/, E => { const m = /SHALL NOT EXCEED\s+(\d+)\s?KT\s*(?:IAS)?\s*(BELOW\s+\S+)?/.exec(E); return `속도 제한${m ? `: ${m[1]}kt 이하${m[2] ? ` (${m[2].replace('BELOW', '').trim()} 미만)` : ''}` : ''}`; }],
  [/(\d{3}\.\d{1,3})\s?MHZ\s*(?:FREQ\s*)?CHANGE(?:D)?\s+TO\s+(\d{3}\.\d{1,3})/, E => '주파수 변경: ' + [...E.matchAll(/(?:([A-Z]+ (?:ACC|FIC|APP|TWR)) )?(?:FREQ )?(\d{3}\.\d{1,3})\s?MHZ\s*(?:FREQ\s*)?CHANGE(?:D)?\s+TO\s+(\d{3}\.\d{1,3})/g)].map(m => `${m[1] ? m[1] + ' ' : ''}${m[2]}→${m[3]}`).join(', ')],
  [/TRANSFER OF CONTROL|TRANSFERRED FROM/, () => '관제 이양 지점·주파수 안내'],
  [/DE-?ICING/, () => '제빙(De-icing) 관련 운용 공지'],
  [/CURFEW|NOISE CONTROL|NIGHT HOURS/, () => '야간 운항 제한(소음/커퓨) 안내'],
  [/HOMONYMOUS/, () => '같은 식별부호의 VOR/NDB 혼동 주의 — 항로에서는 VOR 선택'],
  [/NOT ELIGIBLE TO GIVE ENTRY|ATS IS NOT PROVIDED/, E => { const m = /INTO THE ([A-Z]+) AIRSPACE/.exec(E); return `${m ? m[1] + ' ' : ''}공역 진입·횡단 허가 불가 (뇌우 회피 시 포함)`; }],
  [/PROHIBITED TO LAND|PROHIBITED TO[^.]*OVERFLY|PROHIBITED FOR ANY ACFT OPERATED BY/, E => { const m = /OPERATED BY ([A-Z]+) AIR CARRIERS/.exec(E); return `${m ? m[1] + ' 항공사 ' : '특정 항공기 '}착륙·이륙·영공 통과 금지`; }],
  [/OBLIGATION TO SUBMIT A FLIGHT PLAN/, () => '비행계획 제출 의무 변경 (VFR 관련)'],
  [/DOCKING GUIDANCE|VDGS/, () => '주기장 도킹 유도장치 사용 불가 — 마셜러 유도'],
  [/COMPASS CHECK/, () => '나침반 점검 위치 변경'],
  [/MARKING/, () => '지상 표지(마킹) 보수 작업'],
  [/(CHANGED|CHGD|CHG)\b[^.]*\b(MOCA|MSA|MINIMA|OCA|OCH|DA|MDA)\b|\b(MOCA|OCA|OCH)\b[^.]*\b(CHANGED|CHGD|CHG)/, () => '접근 차트의 최저고도(MOCA/OCA 등) 변경'],
  [/HIRO|HIGH INTENSITY RUNWAY OPERATION/, () => '고밀도 활주로 운영(HIRO) 탈출 유도로·거리 변경'],
  [/GRINDED|GROOVING|FRICTION/, () => '활주로 접지구역 그라인딩(표면 처리) 완료'],
  [/(ARRIVAL )?RUSH\s+HOURS/, () => '도착 혼잡 시간대 안내'],
  [/\b(WIP|WORK IN PROGRESS|CONSTRUCTION)\b/, () => '공사(작업) 진행'],
  [/BIRD/, () => '조류 활동 주의'],
  [/\b(UAS|UAV|DRONE)S?\s+(ACT|OPS|FLT|FLIGHTS? WILL|ACTIVITY)/, () => '무인항공기(드론) 활동'],
  [/PARACHUT|\bPJE\b/, () => '낙하산 강하 훈련'],
  [/CONDITIONAL WAYPOINT|LNAV ARMING|PREMATURE TURN/, () => 'SID 초기 선회 관련 FMS 확인 사항 (조건부 웨이포인트 확인)'],
  [/FMS NOTICE|NAVDATA ALERT/, () => 'FMS 항법데이터 주의 공지 (Jeppesen NavData Alert 참조)'],
  [/SATCOM|ONBOARD INTERNET/, () => '제빙 시 SATCOM 광대역/기내 인터넷 기능 비활성화 필요'],
  [/BREAKAWAY AREA|PUSH ?BACK/, () => '푸시백 절차·위치 안내'],
  [/CERTIFIED (APPROACHES|A\/C)/, () => '회사 인가 기종·접근 방식 안내'],
  [/CONTACT POINT|CO\.?RADIO/, () => '현지 회사 연락처·주파수 안내'],
  [/SEND FPL ACCORDING TO THE\s+NEW FLIGHTS? ROUTES/, () => '특정 출발공항 경유 신규 항로 지정 (FPL 작성 기준)'],
  [/SHALL FLY TO [A-Z]{3,5} FM [A-Z]{3,5} DIRECTLY/, () => '특정 항로 이용 시 직항(DCT) 비행 지시'],
];

export function summarize(n) {
  const E = (n.E || n.text || '').toUpperCase().replace(/\n/g, ' ');
  const out = [];
  for (const [re, fn] of RULES) {
    if (re.test(E)) { try { const s = fn(E); if (s && !out.includes(s)) out.push(s); } catch (e) { /* 규칙 실패 무시 */ } }
    if (out.length >= 4) break;
  }
  if (!out.length) {
    const first = E.split(/(?<=\.)\s|\s(?=\d\.\s)/)[0].slice(0, 90);
    out.push(`${CAT_KO[n.cat] || n.cat}: "${first}${first.length >= 90 ? '…' : ''}"`);
  }
  return out;
}

/* ---------- 구조화 정보 ---------- */
const MON_KO = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
const WD_KO = ['일', '월', '화', '수', '목', '금', '토'];
const hm = m => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}${String(m % 60).padStart(2, '0')}`;
export function scheduleKo(D, base) {
  if (!D) return '';
  const g = parseSchedule(D, base);
  if (!g) return `${D} (자동 해석 불가 — 원문 확인)`;
  return g.map(x => {
    const rs = x.ranges.map(([a, b]) => b - a === 1440 ? '24시간' : `${hm(a)}–${hm(b)}Z`).join(', ');
    let when = '매일';
    if (x.dr) when = `${MON_KO[x.dr[0]]} ${x.dr[1]}일–${MON_KO[x.dr[2]]} ${x.dr[3]}일 매일`;
    else if (x.days.length) when = `${MON_KO[x.month]} ${compactDays(x.days)}일`;
    if (x.wd.length) when = (x.days.length ? when + ' ' : '') + x.wd.map(d => WD_KO[d]).join('·') + '요일';
    return `${when} ${rs}`;
  }).join(' / ');
}
function compactDays(ds) {
  const s = [...new Set(ds)].sort((a, b) => a - b), out = [];
  for (let i = 0; i < s.length; i++) { let j = i; while (j + 1 < s.length && s[j + 1] === s[j] + 1) j++; out.push(j > i + 1 ? `${s[i]}–${s[j]}` : j === i + 1 ? `${s[i]}, ${s[j]}` : `${s[i]}`); i = j; }
  return out.join(', ');
}
const altKo = s => !s ? '' : s.replace(/\bSFC\b/, '지표면(SFC)').replace(/\bGND\b/, '지면(GND)').replace(/\bUNL\b/, '무제한(UNL)').replace(/AMSL/, '해발').replace(/AGL/, '지표 기준');
const dm = (v, pos, neg, w) => { const a = Math.abs(v); const d = Math.floor(a), m = Math.round((a - d) * 60); return `${v >= 0 ? pos : neg}${String(d).padStart(w, '0')}°${String(m).padStart(2, '0')}′`; };
const ll = p => `${dm(p[0], 'N', 'S', 2)} ${dm(p[1], 'E', 'W', 3)}`;

export function interpret(n, ctx) {
  const a = n.a || {};
  const meta = [];
  const vEnd = n.end === Infinity ? (n.endTxt === 'PERM' ? '영구(PERM)' : '추가 통보 시까지(UFN)') : fmtZ(n.end);
  meta.push(['유효기간', `${fmtZ(n.start)} ~ ${vEnd}${n.est ? ' (종료시각 예상치 EST)' : ''}`]);
  if (n.D) meta.push(['운용 시간', scheduleKo(n.D, n.start)]);
  if (a.shapes && a.shapes.length) {
    const s = a.shapes.map(s => {
      const near = s.nearIdx != null && ctx?.route[s.nearIdx] ? ctx.pts[ctx.route[s.nearIdx].near]?.name : '';
      const d = s.minNM != null ? ` → 경로 최근접 ${s.minNM === 0 ? '구역 통과' : s.minNM + 'NM'}${near ? ` (${near} 부근)` : ''}` : '';
      if (s.type === 'circle') return `중심 ${ll(s.c)} 반경 ${Math.round(s.r * 10) / 10}NM 원${d}`;
      if (s.type === 'polygon') return `꼭짓점 ${s.pts.length}개 다각형 구역${d}`;
      if (s.type === 'line') return `${ll(s.pts[0])}–${ll(s.pts[1])} 연결선 구역${d}`;
      return `지점 ${ll(s.c)}${d}`;
    });
    meta.push(['범위', s.slice(0, 4).join('\n') + (s.length > 4 ? `\n외 ${s.length - 4}개` : '')]);
  }
  if (n.F || n.G) meta.push(['고도', `${altKo(n.F) || '?'} ~ ${altKo(n.G) || '?'}`]);
  if (a.when) meta.push(['본 비행', [a.when.label, a.alt?.our ? `통과 고도 ${a.alt.our}` : ''].filter(Boolean).join(' · ')]);
  const summary = summarize(n);
  if (ctx && /SECURITY STATUS/.test(n.E)) {
    const pairs = [...n.flat.toUpperCase().matchAll(/ROUTE ([A-Z]\d{1,4})(?: VIA ([A-Z]{3,5}))?[^:]{0,30}?REPORTING POINT:\s*([A-Z]{3,5})/g)]
      .filter(m => ctx.airwayList.includes(m[1])).map(m => `${m[1]}→${m[3]}${ctx.wptNames.has(m[3]) ? '(경로상)' : ''}`);
    if (pairs.length) summary.push(`본 경로 항로별 보고지점: ${[...new Set(pairs)].join(', ')}`);
  }
  return { summary, meta, gloss: glossHtml(n.E || n.raw || ''), comment: n.comment ? glossHtml(n.comment) : '' };
}

export function glossHtml(text) {
  const used = new Set();
  return esc(text).replace(/\bU\/S\b|[A-Z][A-Z0-9\-]{1,}/g, w => {
    const k = ABBR[w];
    if (!k || SKIP_GLOSS.has(w)) return w;
    if (used.has(w) && w.length > 3) return w; // 긴 단어는 처음 한 번만 풀이
    used.add(w);
    return `${w}<small class="ko">${k}</small>`;
  });
}
export { esc, sectKo };
