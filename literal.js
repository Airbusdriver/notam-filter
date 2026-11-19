// literal.js — NOTAM 전문 한국어 직역 (오프라인, 규칙 기반)
// 원문을 줄 단위로 빠짐없이 옮긴다. 어순은 원문을 따르며(전보체), 식별부호·숫자는 그대로 둔다.
import { ABBR } from './interp.js';

// 일반 영단어 → 한국어 (NOTAM에 자주 나오는 단어 위주)
const W = {
  // 기능어
  THE: '', A: '', AN: '', IS: '', ARE: '', BE: '', BEEN: '', WAS: '', WERE: '', HAS: '', HAVE: '', OF: '', AT: '', IN: '', ON: '',
  BY: '', IT: '', ITS: '', THIS: '이', THESE: '이', THAT: '', WHICH: '', WHO: '', THERE: '', THEIR: '', SUCH: '해당', THOSE: '해당',
  AND: '및', OR: '또는', FOR: '', TO: '→', WITH: '', WITHOUT: '없이', INTO: '안으로', THROUGH: '통과', THROUGHOUT: '전 구간',
  ALSO: '또한', ONLY: '만', ALL: '모든', ANY: '모든', EACH: '각', OTHER: '기타', SAME: '동일', BOTH: '양쪽', EITHER: '양쪽', SOME: '일부',
  MOST: '대부분', MORE: '추가', LESS: '미만', THAN: '보다', NO: '없음', NOT: '아님', NON: '비', IF: '만약', WHEN: '할 때', WHILE: '동안',
  THEN: '그 다음', UNLESS: '단, 예외:', OTHERWISE: '달리', UPON: '즉시', AS: '', ABOUT: '약', AROUND: '주변', NEAR: '근처', VIA: '경유',
  BEYOND: '이후(너머)', ALONG: '따라', ACROSS: '가로질러', UNDER: '아래', OVER: '위', UP: '위로', DOWN: '아래로', OFF: '해제', OUT: '밖',
  BACK: '복귀', NEXT: '다음', FIRST: '첫째', SECOND: '둘째', LAST: '마지막', CURRENT: '현재', NEW: '신규', EXISTING: '기존', ORIGINAL: '원래',
  FURTHER: '추가', CAN: '가능', COULD: '가능', MAY: '[가능]', SHALL: '[의무]', MUST: '[의무]', SHOULD: '[권고]', WILL: '예정', WOULD: '',
  PLEASE: '바람', PLZ: '바람', YOU: '', ONE: '1', TWO: '2', BETWEEN: '사이', DURING: '동안', AFTER: '이후', BEFORE: '이전', PRIOR: '이전',
  UNTIL: '까지', FROM: '부터', SINCE: '이후', WITHIN: '이내', OUTSIDE: '밖', INSIDE: '안', ABOVE: '이상', BELOW: '이하', LEFT: '좌측',
  RIGHT: '우측', LEFTSIDE: '좌측', RIGHTSIDE: '우측', FRONT: '앞', SIDE: '측', CENTRE: '중앙', CENTER: '중앙', MID: '중간',
  // 방향
  NORTH: '북', SOUTH: '남', EAST: '동', WEST: '서', NORTHEAST: '북동', NORTHWEST: '북서', SOUTHEAST: '남동', SOUTHWEST: '남서',
  NORTHERN: '북부', SOUTHERN: '남부', EASTERN: '동부', WESTERN: '서부', EASTBOUND: '동쪽 방향', WESTBOUND: '서쪽 방향',
  NORTHBOUND: '북쪽 방향', SOUTHBOUND: '남쪽 방향', CLOCKWISE: '시계방향', 'IN-BOUND': '입항(도착)', 'OUT-BOUND': '출항(출발)',
  // 항공 일반
  AIRCRAFT: '항공기', AIRPORT: '공항', AIRPORTS: '공항', AERODROME: '비행장', AIRFIELD: '비행장', RUNWAY: '활주로', TAXIWAY: '유도로',
  TWYS: '유도로들', TLN: '유도선', APRON: '계류장', RAMP: '램프', STAND: '주기장', STANDS: '주기장', GATE: '게이트', PAD: '패드',
  ROUTE: '항로', ROUTES: '항로', AIRWAY: '항로', AIRWAYS: '항로', SEGMENT: '구간', SEGMENTS: '구간', POINT: '지점', POINTS: '지점',
  FIX: '픽스', WAYPOINT: '웨이포인트', AREA: '구역', AREAS: '구역', ZONE: '구역', ZONES: '구역', SECTOR: '섹터', CORRIDOR: '회랑',
  AIRSPACE: '공역', TERRITORY: '영토', BORDER: '국경', BOUNDARY: '경계', FLIGHT: '비행', FLIGHTS: '편', FLYING: '비행 중', OPERATING: '운항 중',
  TRAFFIC: '교통', TRAFFICS: '교통', PILOT: '조종사', PILOTS: '조종사', CREW: '승무원', CREWS: '승무원', PIC: '기장', PASSENGER: '승객',
  CABIN: '객실', COMPANY: '회사', OPERATOR: '운항사', CARRIERS: '항공사', USER: '이용자', UNIT: '기관', AUTHORITY: '당국', STATE: '국가',
  LANDING: '착륙', 'TAKE-OFF': '이륙', TAKE: '취함', MEAN: '평균', SET: '설정', DEPARTURE: '출발', DEPARTURES: '출발편', DEPARTING: '출발하는', ARRIVAL: '도착',
  ARRIVALS: '도착편', APPROACH: '접근', APPROACHES: '접근', MISSED: '실패(복행)', HOLDING: '대기', TAXI: '지상활주', TAXIING: '지상활주',
  TOWING: '토잉', PUSH: '푸시', ENTRY: '진입', ENTERING: '진입', EXIT: '이탈', CROSSING: '횡단', CROSSINGS: '횡단', OVERFLYING: '상공 통과',
  OVERFLY: '상공 통과', CLIMB: '상승', DESCENT: '강하', DESCEND: '강하', TURN: '선회', TURNS: '선회', HEADING: '기수방향', TRACK: '트랙',
  COURSE: '코스', LEVEL: '레벨', LEVELS: '레벨', ALTITUDE: '고도', HEIGHT: '높이', ELEVATION: '표고', SPEED: '속도', DISTANCE: '거리',
  RADIUS: '반경', CIRCLE: '원', LATERAL: '수평', VERTICAL: '수직', LIMITS: '한계', LIMIT: '한계', UPPER: '상한', LOWER: '하한',
  LONGITUDE: '경도', LATITUDE: '위도', COORDINATES: '좌표', POSITION: '위치', LOCATION: '위치', LOCATED: '위치한', DIRECTION: '방향',
  DIRECTIONS: '방향', OFFSET: '오프셋', PARALLEL: '평행', LINE: '선', CENTERLINE: '중심선', THRESHOLD: '시단', SURFACE: '지표면',
  GROUND: '지상', TERRAIN: '지형', OBSTACLE: '장애물', CRANE: '크레인', BUILDING: '건물', LIGHTS: '등화', LIGHT: '등화', LIGHTED: '등화 설치',
  MARKING: '표지', MARKINGS: '표지', MARKED: '표지됨', SIGN: '표지판', SIGNAL: '신호', SIGNALS: '신호', GUIDANCE: '유도', DOCKING: '도킹',
  FREQUENCY: '주파수', RADIO: '무선', TELEPHONY: '전화', CALLSIGN: '호출부호', CALL: '호출', COMMUNICATION: '통신', TRANSPONDER: '트랜스폰더',
  RADAR: '레이더', SURVEILLANCE: '감시', NAVIGATION: '항법', EQUIPMENT: '장비', EQUIPPED: '장착', SYSTEM: '시스템', SYSTEMS: '시스템',
  FACILITY: '시설', SERVICE: '업무', SERVICES: '업무', CONTROL: '관제', CLEARANCE: '허가', INSTRUCTIONS: '지시', PHRASEOLOGY: '용어',
  CHART: '차트', PROCEDURE: '절차', PROCEDURES: '절차', PLAN: '계획', CODE: '코드', CODELETTER: '코드문자', CATEGORY: '범주', TYPE: '기종',
  MEDIUM: '중형', JET: '제트', HEAVY: '대형', MILITARY: '군', CIVIL: '민간', COMMERCIAL: '상업', BUSINESS: '비즈니스', STATE_: '',
  MANNED: '유인', UNMANNED: '무인', REMOTE: '원격', AIRBORNE: '공중', WEATHER: '기상', THUNDERSTORM: '뇌우', BIRD: '조류', BIRDS: '조류',
  FLOCKS: '떼', MIGRATION: '이동', MIGRATORY: '이동성', LASER: '레이저', BEAM: '광선', BEAMS: '광선', FIRING: '사격', EXERCISE: '훈련',
  TRAINING: '훈련', TEST: '시험', MASS: '대규모', MOVEMENT: '이동', ACTIVITY: '활동', ACTIVITIES: '활동', OPERATIONS: '운영', OPERATION: '운영',
  CARGO: '화물', PARKING: '주차', FUEL: '연료', TANK: '탱크', VEHICLE: '차량', PERSONNEL: '인원', DE_: '', 'DE-ICING': '제빙',
  DEICING: '제빙', 'ANTI-ICING': '방빙', FLUID: '액', ICE: '얼음', SNOW: '눈', WATER: '물', SEA: '해상', ISLAND: '섬', MOUNTAIN: '산',
  // 상태·동작
  CLOSED: '폐쇄', OPEN: '개방', OPENED: '개방됨', ACTIVE: '활성', ACTIVATED: '활성화', ACTIVATION: '활성화', DEACTIVATED: '비활성화',
  ESTABLISHED: '설정', ESTABLISH: '설정', AVAILABLE: '사용 가능', UNAVAILABLE: '사용 불가', UNSERVICEABLE: '사용 불가', SUSPENDED: '중단',
  RESTRICTED: '제한', RESTRICTION: '제한', RESTRICTIONS: '제한', PROHIBITED: '금지', PERMITTED: '허용', ALLOWED: '허용', APPROVED: '승인된',
  APPROVAL: '승인', PERMISSION: '허가', AUTHORISED: '인가된', AUTHORIZED: '인가된', CERTIFIED: '인가된', REQUIRED: '필요', REQUIREMENTS: '요구사항',
  REQUEST: '요청', REQD: '필요', NECESSARY: '필요', MANDATORY: '의무', ADVISED: '권고됨', ADVISORY: '권고', CAUTION: '주의', CAUTIONARY: '주의',
  WARNING: '경고', WARNINGS: '경고', ALERT: '경보', NOTICE: '통보', INFORMED: '통보됨', NOTIFY: '통보', REPORT: '보고', REPORTED: '보고됨',
  REPORTING: '보고', CONTACT: '연락', COORDINATION: '협조', MONITOR: '감시', MAINTAIN: '유지', REMAIN: '유지', REMAINS: '유지', KEEP: '유지',
  COMPLY: '준수', ADHERE: '준수', FOLLOW: '따름', FOLLOWS: '다음과 같음', FOLLOWING: '다음', USE: '사용', USED: '사용됨', USING: '사용',
  USAGE: '사용', APPLY: '적용', APPLIED: '적용', APPLICABLE: '적용', SELECT: '선택', CHANGE: '변경', CHANGED: '변경', CHANGES: '변경',
  REPLACEMENT: '교체', REPLACED: '교체', RELOCATED: '이전', MOVED: '이동', MOVE: '이동', INSTALLED: '설치', INSTALLATION: '설치',
  CONSTRUCTION: '공사', DISMANTLING: '해체', EXCAVATION: '굴착', MAINTENANCE: '정비', WORK: '작업', WORKS: '작업', PROGRESS: '진행',
  REPAIR: '수리', INSPECTION: '점검', CHECK: '점검', CALIBRATION: '교정', UPDATE: '갱신', UPDATED: '갱신', PUBLISHED: '공시', ISSUED: '발행',
  ANNOUNCED: '공지', INCLUDED: '포함', INCLUDE: '포함', INCLUDING: '포함', EXCLUDED: '제외', EXCLUDING: '제외', EXCEPT: '제외',
  AFFECTED: '영향', AFFECT: '영향', LIMITED: '제한', LIMITATION: '제한', REDUCED: '감소', REDUCE: '감소', INCREASED: '증가', RAISED: '상향',
  DOWNGRADED: '하향', EXTENDED: '연장', SHORTENED: '단축', TEMPORARY: '임시', TEMPORARILY: '임시로', PERMANENT: '영구', PERMANENTLY: '영구히',
  EFFECTIVE: '유효', VALID: '유효', CANCELLED: '취소', WITHDRAWN: '폐지', RESOLVED: '해결', DELETE: '삭제', ADD: '추가', ADDED: '추가',
  POSSIBLE: '가능', IMPOSSIBLE: '불가', UNABLE: '불가', RELIABLE: '신뢰 가능', UNRELIABLE: '신뢰 불가', INTERMITTENTLY: '간헐적으로',
  LOST: '상실', INTERRUPTED: '중단', INTERFERENCE: '간섭', JAMMING: '재밍', SPOOFING: '스푸핑', RECEIVED: '수신', FALSE: '오류',
  INDICATION: '지시', READINGS: '판독값', CRITICAL: '중요', EXTREME: '극도의', NUISANCE: '불필요한', SAFETY: '안전', SAFE: '안전',
  SECURITY: '보안', EMERGENCY: '비상', RESCUE: '구조', SEARCH: '수색', DIRECTLY: '직접', DIRECT: '직항', IMMEDIATELY: '즉시', STRICTLY: '엄격히',
  EXPECT: '예상', EXPECTED: '예상', ESTIMATED: '예상', PLANNED: '계획된', SCHEDULED: '정기', ACTUAL: '실제', CONFIRMED: '확인됨',
  SPECIAL: '특별', SPECIFIED: '지정된', RELEVANT: '관련', RELATED: '관련', MAIN: '주', MAINLY: '주로', PRIMARY: '주', SECONDARY: '보조',
  INITIAL: '초기', FINAL: '최종', MINIMUM: '최저', MAXIMUM: '최대', HIGH: '높음', LOW: '낮음', LONG: '장', SHORT: '단', DEEP: '깊은',
  WIDTH: '폭', LENGTH: '길이', DIMENSION: '규격', CAPACITY: '수용', QUANTITY: '수량', NUMBER: '번호', PERIOD: '기간', TIME: '시간',
  TIMES: '시간', HOURS: '시간', DAY: '주간', NIGHT: '야간', DAILY: '매일', SUMMER: '하계', WINTER: '동계', PHASE: '단계', STATUS: '상태',
  CONDITION: '상태', CONDITIONS: '상태', SITUATION: '상황', CASE: '경우', RISK: '위험', STRIKE: '충돌', NOTE: '참고', DETAILS: '세부',
  DETAILED: '상세', INFORMATION: '정보', CONTENT: '내용', DATA: '데이터', PERFORMANCE: '성능', CONFIGURATION: '형상', PURPOSES: '목적',
  INTENTION: '의도', MEANS: '수단', MEASURES: '조치', ACTION: '조치', STRUCTURE: '구조', COVERAGE: '커버리지', RANGE: '범위', PART: '부분',
  SECTION: '구간', ITEM: '항목', PARAGRAPH: '항', VALUES: '값', CONTAINS: '포함', INCORRECT: '오류', CORRECT: '정확', WRONG: '잘못',
  VICINITY: '주변', PERIMETER: '외곽', FACILITIES: '시설', IDENTIFICATION: '식별', REGISTRATION: '등록', NAME: '이름', REPUBLIC: '공화국',
  REGULATION: '규정', EQUIVALENT: '동등', COMPASS: '나침반', OCCASIONALLY: '가끔', OCCASSIONALY: '가끔', ESPECIALLY: '특히', FULLY: '완전히',
  EXTRA: '추가', INDEPENDENT: '독립', SIMULTANEOUS: '동시', RAPID: '고속', SEE: '참조', REFER: '참조', READ: '읽음', DEEMED: '간주',
  PROVIDED: '제공', PROVIDE: '제공', GIVEN: '주어진', OBTAIN: '획득', EXECUTE: '수행', EXECUTED: '수행', PERFORM: '수행', TAKES: '실시',
  PLACE: '장소', JOIN: '합류', START: '시작', STOP: '정지', SHUT: '정지', CONTINUE: '계속', COMMENCED: '시작됨', COMPLETED: '완료',
  DELAY: '지연', PREVENT: '방지', AVOID: '회피', AVOIDED: '회피', AVOIDANCE: '회피', PROTECTION: '보호', INADEQUATE: '부적절',
  AIR: '항공', 'PRE-COORDINATION': '사전 협조', EXCEED: '초과', MISSION: '임무', RECONNAISSANCE: '정찰', PASSING: '통과', VECTOR: '벡터', VECTORS: '벡터', RESUME: '재개', OWN: '자체',
  SETTING: '설정', AERODROMES: '비행장', BROADBAND: '광대역', ONBOARD: '기내', INTERNET: '인터넷', TELEVISION: 'TV', UNKNOWN: '알 수 없는',
  EMISSION: '방출', UNCHANGED: '변경 없음', POSS: '가능', OPERATIONAL: '운용', SUBJECT: '대상', ACCESS: '접근', MANNER: '방식',
  OPERATED: '운항되는', OPERATES: '운항', OPERATE: '운항', SEGREGATED: '분리된', RESERVATION: '예약', MANAGED: '관리', VACATE: '이탈',
  SURFACES: '표면', GROUPS: '그룹', LINK: '연결', GOING: '가는', SUPPORTS: '지원', ADJUSTED: '조정', PATTERN: '패턴', CROSS: '횡단',
  AUXILIARY: '보조', TRANSFER: '이양', ROUTING: '경로 지정', CUSTOMS: '세관', POLICE: '경찰', 'FIRE-FIGHTING': '소방', CAPABILITY: '능력',
  FITTED: '장착된', TRANSMITTING: '송신', MODULE: '모듈', CONTINUOUS: '지속적', LOSS: '상실', FAILURE: '고장', FEASIBLE: '가능한',
  ACKNOWLEDGEMENT: '수신 확인', COOPERATE: '협조', TARGET: '목표', RECOGNITION: '식별', VERIFICATION: '검증', DEVIATE: '이탈',
  EXECUTION: '실행', INDICATED: '지시', AIRSPEED: '대기속도', FERRY: '페리', PRODUCTION: '생산', TESTS: '시험', PROVISIONS: '규정',
  'NON-SCHEDULE': '부정기', BASIS: '기준', TICKET: '항공권', ADMINISTRATIVE: '행정', SLOTS: '슬롯', INDIVIDUAL: '개인', INCLUDES: '포함',
  NATIONALITY: '국적', MARK: '기호', NORMALITY: '정상 여부', THREATENS: '위협하는', COMMAND: '지휘', ORIGINALLY: '원래', ASSIGNED: '배정된',
  RESPONSIBLE: '책임', TAKEN: '취한', DEGREES: '도', SOON: '곧', ONCE: '일단', THREAT: '위협', ADVISE: '통보', PROMPTLY: '신속히',
  REQUIRING: '필요한', REJOIN: '재합류', CONSIDERING: '고려', METEOROLOGICAL: '기상', TABLE: '표', COLUMN: '열', PARTS: '지역',
  CAUTIOUS: '주의', LOSES: '상실', REMARKS: '비고', ENTER: '진입', PLANNING: '계획', REQUESTS: '요청', DECIDED: '결정', MANEUVERS: '기동',
  INFORM: '통보', MAKE: '하다', ORDER: '명령', MINISTER: '장관', AMBULANCE: '구급', FIRE: '화재', FIGHTING: '진압', MINISTRY: '부처',
  DATE: '날짜', PURPOSE: '목적', OBTAINED: '획득', CONVENTIONAL: '재래식', LAND: '착륙', OVERFLIGHT: '영공 통과', HUMANITARIAN: '인도주의',
  PRIVATE: '개인', REQUESTED: '요청된', RESPECTIVE: '해당', ARMING: '아밍', PREMATURE: '조기', ISSUES: '문제', FLEETS: '기단',
  'PRE-FLIGHT': '비행 전', VERIFY: '확인', CONDITIONAL: '조건부', UNCOMMANDED: '의도치 않은', LATEST: '최신', OCCURRED: '발생',
  REVIEW: '검토', ASSURANCE: '보증', TEAM: '팀', CYCLE: '주기', MANUALS: '매뉴얼', PHRASE: '문구', PUSHBACK: '푸시백', PULL: '당김',
  FACING: '향함', CURFEW: '커퓨', TOUCHDOWN: '접지', GRINDED: '그라인딩됨', LETTER: '문자', TYPES: '기종', GUARD: '경계', SPACE: '공간',
  REMAINING: '남은', CHECKS: '점검', REFURBISHMENT: '보수', VISUAL: '시각', MARSHALLER: '마셜러', NOISE: '소음', CURRENTLY: '현재',
  CONSIDERED: '간주', RUSH: '혼잡', MENTIONED: '언급된', EARLIER: '더 일찍', WINGSPAN: '날개폭', EXISTS: '존재', ANTENNA: '안테나',
  METERS: 'm', PHONE: '전화', 'E-MAIL': '이메일', INCREASE: '증가', PEAK: '최고조', DISPERSAL: '퇴치', METHODS: '방법', RESORTS: '수단',
  NATURAL: '자연', INVASION: '침공', FEDERATION: '연방', STATEMENT: '진술', INSTRUMENT: '계기', BREAKAWAY: '분리', DATED: '일자',
  RELATION: '관계', TERMINAL: '터미널', SPOT: '스팟', THROUGHPUT: '처리량', LOCALIZER: '로컬라이저', 'BREAK-OUT': '이탈', POSSIBILTY: '가능성',
  POSSIBILITY: '가능성', OPERATING_: '', INFORMATIONS: '정보', TRAFFIC_: '', SETTINGS: '설정', AUTOMATIC: '자동', MANUAL: '수동',
  INTENSE: '강한', INTENSITY: '강도', POWER: '출력', RED: '적색', GREEN: '녹색', BLUE: '청색', WHITE: '백색', YELLOW: '황색', COLOR: '색',
};

// 구문 규칙: 원문 어순을 한국어로 바꾸기 어려운 상투 표현을 먼저 처리
const K = s => `«${s}»`; // 직역 보호(이후 단어 치환에서 제외)
const fmtC = (lat, ns, lon, ew) => { const f = (s, w) => `${+s.slice(0, w)}°${s.slice(w, w + 2)}′${s.length > w + 2 ? s.slice(w + 2, w + 4) + '″' : ''}`; return `${f(lat, 2)}${ns} ${f(lon, 3)}${ew}`; };
const DIR = { NORTH: '북', SOUTH: '남', EAST: '동', WEST: '서' };
const RULES = [
  [/(\d{4}|\d{6})(?:\.\d+)?([NS])\s?(\d{5}|\d{7})(?:\.\d+)?([EW])/g, (m, a, b, c, d) => K(fmtC(a, b, c, d))],
  [/\b([NS])(\d{4}|\d{6})([EW])(\d{5}|\d{7})\b/g, (m, b, a, d, c) => K(fmtC(a, b, c, d))],
  [/\b(\d{4})-(\d{4})\b/g, (m, a, b) => K(`${a}–${b}Z`)],
  [/\bAS (?:FLW|FOLLOWS?|FOLLOWING)\s*:?/g, () => K('다음과 같음:')],
  [/\bTHE FOLLOWING\b/g, () => K('다음')],
  [/\bWILL TAKE PLACE\b/g, () => K('실시 예정')],
  [/\bTAKE PLACE\b/g, () => K('실시')],
  [/\bWILL BE (CLSD|CLOSED)\b/g, () => K('폐쇄 예정')],
  [/\bWILL BE (ANNOUNCED|ISSUED)\b/g, () => K('공지 예정')],
  [/\b(U\/S|UNSERVICEABLE|OUT OF SERVICE|INOP|OTS)\b/g, () => K('사용 불가')],
  [/\bNOT (AVBL|AVAILABLE|POSS|POSSIBLE)\b/g, () => K('불가')],
  [/\bDO NOT USE\b/g, () => K('사용 금지')],
  [/\b(CAN NOT|CANNOT|CAN'T)\b/g, () => K('불가:')],
  [/\b(CLSD|CLOSED)\b/g, () => K('폐쇄')],
  [/\b(SHALL|MUST) NOT EXCEED\b/g, () => K('초과 금지:')],
  [/\b(SHALL|MUST|SHOULD) NOT\b/g, () => K('[금지]')],
  [/\bUNABLE TO\b/g, () => K('불가:')],
  [/\bCOMPLY WITH\b/g, () => K('준수')],
  [/\bALONG (?:ROUTE|AWY|AIRWAY|RTE) ([^\s,.]+)/g, (m, a) => `${K('항로')} ${a}${K(' 따라')}`],
  [/\bTAKING-OFF\b/g, () => K('이륙')],
  [/\bON (?:TEST|MAINT|MAINTENANCE)\b/g, m => K(/TEST/.test(m) ? '시험 중' : '정비 중')],
  [/\bDUE TO\b/g, () => K('사유:')],
  [/\bIN ACCORDANCE WITH\b|\bACCORDING TO\b/g, () => K('기준:')],
  [/\bPRIOR TO\b/g, () => K('(이전에)')],
  [/\bIN CASE OF\b/g, () => K('다음의 경우:')],
  [/\bIN THE EVENT OF\b/g, () => K('다음의 경우:')],
  [/\bINSTEAD OF\b/g, () => K('대신:')],
  [/\bAT OR BELOW\b|\bAT AND BELOW\b/g, () => K('이하')],
  [/\bAT OR ABOVE\b|\bAT AND ABOVE\b/g, () => K('이상')],
  [/\bUNTIL FURTHER NOTICE\b|\bUFN\b/g, () => K('추가 통보 시까지')],
  [/\bSEE NOTAM\s*:?\s*/g, () => K('NOTAM 참조: ')],
  [/\bREF(?:ER)?(?: TO)?\b/g, () => K('참조:')],
  [/\bBTN (\S+) AND (\S+)/g, (m, a, b) => `${a}${K('–')}${b}${K(' 사이')}`],
  [/\b(NORTH|SOUTH|EAST|WEST) OF (TWY |RWY |TAXIWAY |RUNWAY )?(\S+)/g, (m, d, t, x) => `${t || ''}${x}${K(' ' + DIR[d] + '쪽')}`],
  [/\bWI(?:THIN)? ([\d.]+)\s?(NM|KM|M) (?:RADIUS )?(?:OF|FROM)\b/g, (m, r, u) => K(`반경 ${r}${u} 이내:`)],
  [/\bRADIUS (?:OF )?([\d.]+)\s?(NM|KM|M)\b/g, (m, r, u) => K(`반경 ${r}${u}`)],
  [/\bCENT(?:ER|RE)D? (?:ON|AT)\b/g, () => K('중심')],
  [/\b(?:AREA )?BOUNDED BY(?: THE FOLLOWING)?(?: (?:COORDINATES|POINTS))?\s*:?/g, () => K('다음 좌표로 둘러싸인 구역:')],
  [/\b(?:FM|FROM) ([^\s,.]+) TO ([^\s,.]+)/g, (m, a, b) => `${a}${K('부터')} ${b}${K('까지')}`],
  [/\bTRANSFERRED\b/g, () => K('이양')],
  [/\bTRIGGER NOTAM\b/g, () => K('트리거 NOTAM')],
  [/\bAIR TRAFFIC CONTROL\b/g, () => K('항공교통관제')],
  [/\bSPECIAL RESTRICTED AREA\b/g, () => K('특별제한구역')],
  [/\bRESTRICTED AREA\b/g, () => K('제한구역')],
  [/\bPROHIBITED AREA\b/g, () => K('금지구역')],
  [/\bDANGER AREA\b/g, () => K('위험구역')],
  [/\bBUFFER ZONE\b/g, () => K('완충구역')],
  [/\bMILITARY TRAINING AREA\b/g, () => K('군 훈련공역')],
  [/\bFLOW CTL\b|\bFLOW CONTROL\b/g, () => K('흐름 관리')],
  [/\bTWO-WAY COMMUNICATION\b/g, () => K('양방향 통신')],
  [/\bHOLDING POINT\b|\bHLDG POINT\b/g, () => K('대기지점')],
  [/\bLATERAL OFFSET\b/g, () => K('측방 오프셋')],
  [/\bIT IS REPORTED BY PILOTS THAT\b|\bPILOTS HAVE REPORTED THAT\b/g, () => K('조종사 보고에 따르면,')],
  [/\bEXERCISE (EXTREME )?CAUTION\b/g, (m, e) => K(e ? '각별히 주의' : '주의')],
  [/\bFLIGHT PLAN\b/g, () => K('비행계획')],
  [/\bSTANDARD INSTRUMENT DEPARTURE\b/g, () => K('SID')],
];

// 조종사가 그대로 쓰는 약어는 번역하지 않음 (예: FMS NDB = 항법 데이터베이스)
const KEEP_LIT = new Set(['SID', 'STAR', 'NDB', 'VOR', 'DVOR', 'DME', 'ILS', 'LOC', 'GP', 'FMS', 'ATIS', 'RNAV', 'RNP', 'CPDLC', 'GNSS', 'GPS',
  'TCAS', 'SSR', 'APU', 'GPU', 'PCA', 'AIRAC', 'NOTAM', 'LNAV', 'VNAV', 'LPV', 'GBAS', 'RVSM', 'ATC', 'ACC', 'APP', 'TWR', 'FIR', 'UIR', 'TMA',
  'CTR', 'CTA', 'IAC', 'MSA', 'MOCA', 'OCA', 'OCH', 'DA', 'MDA', 'VFR', 'IFR', 'QNH', 'EOBT', 'ETD', 'ETA', 'UTC', 'AIP']);
const NUM_UNIT = /^([\d.,]+)(NM|KM|M|FT|KT|MHZ|KHZ|DEG|MIN|HR)$/;
function word(t) {
  const pm = /^(.*?)([.,:;]*)$/.exec(t); const core = pm[1], tail = pm[2];
  if (!core) return t;
  if (/^[\d]/.test(core)) {
    const u = NUM_UNIT.exec(core);
    if (u) return u[1] + { NM: 'NM', KM: 'km', M: 'm', FT: 'ft', KT: 'kt', MHZ: 'MHz', KHZ: 'kHz', DEG: '°', MIN: '분', HR: '시간' }[u[2]] + tail;
    return t;
  }
  if (core.includes('/') && core !== 'U/S') return core.split('/').map(x => word(x)).join('/') + tail;
  const k = W[core];
  if (k !== undefined) return k + tail;
  if (KEEP_LIT.has(core)) return t;
  const a = ABBR[core];
  if (a && core.length > 1 && !/^(E|W|S|N|U|MIN|OUT|FIR|GPS|KM|NM|FT|KT|UTC)$/.test(core)) return a + tail;
  return t; // 식별부호·고유명사는 그대로
}

// 식별부호로 보이는 자리(지점·시설)에서는 약어 풀이를 하지 않음
const ID_PREV = /^(VIA|POINT:?|POINT|FIX|AT|VOR|NDB|DME|VORTAC|TACAN|TO)$/;
const ID_NEXT = /^(VOR|DVOR|NDB|DME|VORTAC|TACAN|VOR\/DME|DVOR\/DME)$/;
function tokenWord(t, prev, next) {
  const m = /^([("']*)(.*?)([)"'.,:;]*)$/.exec(t);
  const lead = m[1], core = m[2], tail = m[3];
  if (!core) return t;
  if (/^[A-Z]{1,3}\([A-Z]+\)\d+$/.test(core)) return t; // ZB(SR)801 같은 구역 명칭
  if (/[()]/.test(core)) return lead + core.split(/([()])/).map(x => /^[A-Z][A-Z\-]*$/.test(x) ? word(x) : x).join('') + tail;
  if (/^[A-Z]{2,5}$/.test(core) && (ID_PREV.test(prev || '') || ID_NEXT.test(next || '')) && W[core] === undefined) return t;
  return lead + word(core) + tail;
}

export function literalKO(raw) {
  if (!raw) return '';
  let s = raw.replace(/\r/g, '').replace(/(\d)\n(\d+[NSEW])/g, '$1$2');
  // 줄바꿈으로 끊긴 문장 잇기 (번호·글머리로 시작하는 줄과 ':'로 끝나는 줄은 유지)
  const merged = [];
  for (const ln of s.split('\n')) {
    const t = ln.trim(); if (!t) continue;
    const prev = merged[merged.length - 1];
    const newItem = /^(\d+(\.\d+)*[.)]|\(\d+\)|[-•*]|[A-Z]\)|\/\/|NOTE|RMK|REF\b)/.test(t);
    if (prev && !newItem && !/[:.]$/.test(prev) && !/^(\/\/|\[)/.test(prev)) merged[merged.length - 1] = prev + ' ' + t;
    else merged.push(t);
  }
  return merged.map(line => {
    let L = line.toUpperCase()
      .replace(/([A-Z])([:,;])(?=[A-Z])/g, '$1$2 ')   // ROUTE:NORTH → ROUTE: NORTH
      .replace(/(\d\))(?=[A-Z])/g, '$1 ')            // 2)PILOTS → 2) PILOTS
      .replace(/([A-Z]{2})\.(?=[A-Z]{2})/g, '$1. ');  // CLSD.ACFT → CLSD. ACFT
    for (const [re, fn] of RULES) L = L.replace(re, fn);
    // 보호구간(«»)은 그대로 두고 나머지 단어만 치환
    const parts = L.split(/(«[^»]*»)/);
    const out = parts.map(p => {
      if (p.startsWith('«')) return p.slice(1, -1);
      const toks = p.split(/(\s+)/), words = toks.filter(t => t && !/^\s+$/.test(t));
      let wi = -1;
      return toks.map(t => { if (!t || /^\s+$/.test(t)) return t; wi++; return tokenWord(t, (words[wi - 1] || '').replace(/[.,:;]$/, ''), words[wi + 1]); }).join('');
    }).join('');
    return out.replace(/\s{2,}/g, ' ').replace(/\s+([.,:)])/g, '$1').replace(/\(\s+/g, '(').trim();
  }).filter(x => x !== '').join('\n');
}
