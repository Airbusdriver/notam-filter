// decode.js — NOTAM 영문 디코딩 (ICAO Doc 8400 / FAA JO 7340.2 약어 기준, 오프라인)
// 원문의 약어·축약형을 풀어쓴 영어로 바꾼다. 식별부호(지점·항로·시설 ID)와 숫자는 그대로 둔다.

export const EN = {
  // A
  ABN: 'aerodrome beacon', ABT: 'about', ABV: 'above', ACC: 'area control centre', ACCID: 'accident', ACFT: 'aircraft',
  ACK: 'acknowledge', ACPT: 'accept', ACT: 'active', ADA: 'advisory area', ADDN: 'addition', ADJ: 'adjacent', ADZ: 'advise',
  AFIS: 'aerodrome flight information service', AFT: 'after', AGN: 'again', ALRS: 'alerting service', ALS: 'approach lighting system',
  ALT: 'altitude', ALTN: 'alternate', AMDT: 'amendment', AMSL: 'above mean sea level', ANS: 'answer', AP: 'airport', APCH: 'approach',
  APN: 'apron', APP: 'approach control', APPROX: 'approximately', APRX: 'approximately', APSG: 'after passing', APV: 'approve',
  ARNG: 'arrange', ARP: 'aerodrome reference point', ARR: 'arrival', ARS: 'special air-report', ASDA: 'accelerate-stop distance available',
  ASPH: 'asphalt', ATA: 'actual time of arrival', ATD: 'actual time of departure', ATIS: 'automatic terminal information service',
  ATZ: 'aerodrome traffic zone', AUTH: 'authorized', AUW: 'all up weight', AUX: 'auxiliary', AVBL: 'available', AVG: 'average',
  AWY: 'airway', AZM: 'azimuth',
  // B
  BA: 'braking action', BCFG: 'fog patches', BCN: 'beacon', BCST: 'broadcast', BDRY: 'boundary', BFR: 'before', BLDG: 'building',
  BLW: 'below', BRG: 'bearing', BRKG: 'braking', BTL: 'between layers', BTN: 'between',
  // C
  CAT: 'category', CAUT: 'caution', CCA: 'corrected', CFM: 'confirm', CGL: 'circling guidance light', CH: 'channel', CHG: 'change',
  CHGD: 'changed', CIV: 'civil', CL: 'centre line', CLA: 'clear type of ice formation', CLBR: 'calibration', CLD: 'cloud',
  CLR: 'clear', CLSD: 'closed', CMB: 'climb', CMPL: 'complete', CNL: 'cancel', CNLD: 'cancelled', CNS: 'communications navigation surveillance',
  COM: 'communications', CONC: 'concrete', COND: 'condition', CONS: 'continuous', CONST: 'construction', CONT: 'continue',
  COOR: 'coordinate', COORD: 'coordinates', COP: 'change-over point', COR: 'correct', COT: 'at the coast', COV: 'cover',
  CPDLC: 'controller-pilot data link communications', CRZ: 'cruise', CTA: 'control area', CTAM: 'climb to and maintain', CTC: 'contact',
  CTL: 'control', CTN: 'caution', CTR: 'control zone', CUF: 'cumuliform', CUST: 'customs', CWY: 'clearway',
  // D
  DA: 'decision altitude', DCKG: 'docking', DCT: 'direct', DEG: 'degrees', DEP: 'departure', DER: 'departure end of runway',
  DES: 'descend', DETRESFA: 'distress phase', DEV: 'deviation', DFTI: 'distance from touchdown indicator', DH: 'decision height',
  DIST: 'distance', DIV: 'divert', DLA: 'delay', DLY: 'daily', DME: 'distance measuring equipment', DNG: 'dangerous',
  DOM: 'domestic', DP: 'de-icing pad', DPT: 'depth', DR: 'dead reckoning', DRG: 'during', DSB: 'double sideband', DTG: 'date-time group',
  DTHR: 'displaced runway threshold', DTRT: 'deteriorate', DUC: 'dense upper cloud', DVOR: 'Doppler VOR',
  // E
  EB: 'eastbound', EET: 'estimated elapsed time', EFC: 'expect further clearance', ELEV: 'elevation', ELR: 'extremely long range',
  EM: 'emission', EMERG: 'emergency', END: 'stop-end', ENE: 'east-north-east', ENG: 'engine', ENR: 'en-route', ENRT: 'en route',
  EOBT: 'estimated off-block time', EQPT: 'equipment', ESE: 'east-south-east', EST: 'estimated', ETA: 'estimated time of arrival',
  ETD: 'estimated time of departure', ETO: 'estimated time over', EV: 'every', EXC: 'except', EXER: 'exercises', EXP: 'expect',
  EXTD: 'extend',
  // F
  FAC: 'facilities', FAF: 'final approach fix', FAL: 'facilitation', FAP: 'final approach point', FATO: 'final approach and take-off area',
  FAX: 'facsimile', FCST: 'forecast', FCT: 'friction coefficient', FIC: 'flight information centre', FIR: 'FIR', FIS: 'flight information service',
  FLD: 'field', FLG: 'flashing', FLT: 'flight', FLTCK: 'flight check', FLUC: 'fluctuating', FLW: 'follows', FLY: 'fly',
  FM: 'from', FMS: 'flight management system', FNA: 'final approach', FPL: 'flight plan', FPM: 'feet per minute', FPR: 'flight plan route',
  FREQ: 'frequency', FRI: 'Friday', FRNG: 'firing', FRQ: 'frequent', FSL: 'full stop landing', FST: 'first', FTP: 'fictitious threshold point',
  FZ: 'freezing',
  // G
  GA: 'go ahead', GEN: 'general', GEO: 'geographic', GES: 'ground earth station', GLD: 'glider', GND: 'ground', GNDCK: 'ground check',
  GP: 'glide path', GRASS: 'grass landing area', GRVL: 'gravel', GS: 'ground speed / glide slope', GUND: 'geoid undulation',
  // H
  H24: '24 hours', HBN: 'hazard beacon', HDG: 'heading', HEL: 'helicopter', HGT: 'height', HJ: 'sunrise to sunset',
  HLDG: 'holding', HN: 'sunset to sunrise', HO: 'service available to meet operational requirements', HOSP: 'hospital aircraft',
  HPA: 'hectopascal', HR: 'hours', HS: 'service available during hours of scheduled operations', HURCN: 'hurricane', HVY: 'heavy',
  HX: 'no specific working hours', HYR: 'higher',
  // I
  IAC: 'instrument approach chart', IAF: 'initial approach fix', IAO: 'in and out of clouds', IAP: 'instrument approach procedure',
  IAS: 'indicated airspeed', IBN: 'identification beacon', ID: 'identifier', IDENT: 'identification', IF: 'intermediate approach fix',
  IFR: 'instrument flight rules', ILS: 'instrument landing system', IM: 'inner marker', IMC: 'instrument meteorological conditions',
  IMPR: 'improve', IMT: 'immediate', INA: 'initial approach', INBD: 'inbound', INC: 'in cloud', INCERFA: 'uncertainty phase',
  INFO: 'information', INOP: 'inoperative', INP: 'if not possible', INPR: 'in progress', INSTL: 'install', INSTR: 'instrument',
  INT: 'intersection', INTL: 'international', INTRP: 'interrupt', INTRG: 'interrogator', INTST: 'intensity', IR: 'ice on runway',
  ISA: 'international standard atmosphere',
  // K-L
  KM: 'kilometres', KMH: 'kilometres per hour', KPA: 'kilopascal', KT: 'knots', KW: 'kilowatts',
  LAM: 'logical acknowledgement', LAN: 'inland', LAT: 'latitude', LDA: 'landing distance available', LDAH: 'landing distance available helicopter',
  LDG: 'landing', LDI: 'landing direction indicator', LEN: 'length', LGT: 'light', LGTD: 'lighted', LIH: 'light intensity high',
  LIL: 'light intensity low', LIM: 'light intensity medium', LLZ: 'localizer', LM: 'locator middle', LMT: 'local mean time',
  LO: 'locator outer', LOC: 'localizer', LONG: 'longitude', LORAN: 'long range air navigation system', LRG: 'long range',
  LTD: 'limited', LTP: 'landing threshold point', LVE: 'leave', LVL: 'level', LYR: 'layer',
  // M
  MAG: 'magnetic', MAINT: 'maintenance', MAP: 'aeronautical maps and charts', MAPT: 'missed approach point', MAR: 'at sea',
  MAX: 'maximum', MBST: 'microburst', MCA: 'minimum crossing altitude', MCW: 'modulated continuous wave', MDA: 'minimum descent altitude',
  MDF: 'medium frequency direction-finding station', MDH: 'minimum descent height', MEA: 'minimum en-route altitude', MEHT: 'minimum eye height over threshold',
  MET: 'meteorological', MHZ: 'MHz', KHZ: 'kHz', MID: 'mid-point', MIFG: 'shallow fog', MIL: 'military', MIN: 'minutes', MKR: 'marker radio beacon',
  MLS: 'microwave landing system', MM: 'middle marker', MNM: 'minimum', MNPS: 'minimum navigation performance specifications',
  MNT: 'monitor', MNTN: 'maintain', MOA: 'military operating area', MOC: 'minimum obstacle clearance', MOCA: 'minimum obstacle clearance altitude',
  MOD: 'moderate', MON: 'Monday', MOPS: 'minimum operational performance standards', MOV: 'move', MRA: 'minimum reception altitude',
  MRG: 'medium range', MRP: 'ATS/MET reporting point', MS: 'minus', MSA: 'minimum sector altitude', MSAW: 'minimum safe altitude warning',
  MSG: 'message', MSL: 'mean sea level', MSSR: 'monopulse secondary surveillance radar', MT: 'mountain', MTU: 'metric units',
  MTW: 'mountain waves', MVDF: 'medium and very high frequency direction-finding stations', MWO: 'meteorological watch office',
  // N
  NAT: 'North Atlantic', NAV: 'navigation', NB: 'northbound', NBFR: 'not before', NDB: 'non-directional radio beacon', NE: 'north-east',
  NEB: 'north-eastbound', NEG: 'no / negative', NGT: 'night', NIL: 'none', NML: 'normal', NNE: 'north-north-east', NNW: 'north-north-west',
  NOF: 'international NOTAM office', NOSIG: 'no significant change', NR: 'number', NRH: 'no reply heard', NW: 'north-west',
  NWB: 'north-westbound', NXT: 'next',
  // O
  OAC: 'oceanic area control centre', OAS: 'obstacle assessment surface', OBS: 'observe', OBSC: 'obscure', OBST: 'obstacle',
  OCA: 'obstacle clearance altitude', OCC: 'occulting', OCH: 'obstacle clearance height', OCNL: 'occasional', OCS: 'obstacle clearance surface',
  OFZ: 'obstacle free zone', OGN: 'originate', OHD: 'overhead', OM: 'outer marker', OPA: 'opaque white type of ice formation',
  OPC: 'operational control', OPMET: 'operational meteorological', OPN: 'open', OPR: 'operational', OPS: 'operations',
  ORD: 'order', OSV: 'ocean station vessel', OTLK: 'outlook', OTP: 'on top', OTS: 'organized track system', OUBD: 'outbound',
  // P
  PA: 'precision approach', PALS: 'precision approach lighting system', PANS: 'procedures for air navigation services',
  PAPI: 'precision approach path indicator', PAR: 'precision approach radar', PARL: 'parallel', PATC: 'precision approach terrain chart',
  PAX: 'passengers', PCD: 'proceed', PCL: 'pilot-controlled lighting', PCN: 'pavement classification number', PDG: 'procedure design gradient',
  PER: 'performance', PERM: 'permanent', PIB: 'pre-flight information bulletin', PJE: 'parachute jumping exercise', PLA: 'practice low approach',
  PLN: 'flight plan', PLVL: 'present level', PN: 'prior notice required', PNR: 'point of no return', POB: 'persons on board',
  POSS: 'possible', PPI: 'plan position indicator', PPR: 'prior permission required', PPSN: 'present position', PRI: 'primary',
  PRKG: 'parking', PROB: 'probability', PROC: 'procedure', PROV: 'provisional', PSG: 'passing', PSN: 'position', PSP: 'pierced steel plank',
  PSR: 'primary surveillance radar', PSYS: 'pressure system(s)', PTN: 'procedure turn', PTS: 'polar track structure', PWR: 'power',
  // Q-R
  QUAD: 'quadrant', RAC: 'rules of the air and air traffic services', RAG: 'ragged', RAI: 'runway alignment indicator', RCA: 'reach cruising altitude',
  RCC: 'rescue coordination centre', RCL: 'runway centre line', RCLL: 'runway centre line lights', RCLR: 'recleared', RDH: 'reference datum height',
  RDL: 'radial', RDO: 'radio', RE: 'recent', REC: 'receive', REDL: 'runway edge lights', REF: 'reference', REG: 'registration',
  RENL: 'runway end lights', REP: 'report', REQ: 'request', RERTE: 're-route', RESA: 'runway end safety area', RG: 'range lights',
  RHC: 'right-hand circuit', RIF: 'reclearance in flight', RITE: 'right', RL: 'report leaving', RLA: 'relay to', RLCE: 'request level change en route',
  RLLS: 'runway lead-in lighting system', RLNA: 'requested level not available', RMK: 'remark', RNG: 'radio range', RNP: 'required navigation performance',
  ROC: 'rate of climb', ROD: 'rate of descent', ROFOR: 'route forecast', RON: 'receiving only', RPI: 'radar position indicator',
  RPLC: 'replace', RPS: 'radar position symbol', RQMNTS: 'requirements', RQP: 'request flight plan', RQS: 'request supplementary flight plan',
  RR: 'report reaching', RSC: 'rescue sub-centre', RSCD: 'runway surface condition', RSP: 'responder beacon', RSR: 'en-route surveillance radar',
  RTD: 'delayed', RTE: 'route', RTF: 'radiotelephone', RTG: 'radiotelegraph', RTHL: 'runway threshold light(s)', RTN: 'return',
  RTODAH: 'rejected take-off distance available helicopter', RTS: 'return to service', RTT: 'radioteletypewriter', RTZL: 'runway touchdown zone light(s)',
  RUT: 'standard regional route transmitting frequencies', RV: 'rescue vessel', RVR: 'runway visual range', RVSM: 'reduced vertical separation minimum',
  RWY: 'runway',
  // S
  SALS: 'simple approach lighting system', SAN: 'sanitary', SAP: 'as soon as possible', SAR: 'search and rescue', SARPS: 'standards and recommended practices',
  SAT: 'Saturday', SATCOM: 'satellite communication', SB: 'southbound', SCT: 'scattered', SDBY: 'stand by', SE: 'south-east',
  SEB: 'south-eastbound', SEC: 'section', SECN: 'section', SECT: 'sector', SELCAL: 'selective calling system', SER: 'service',
  SEV: 'severe', SFC: 'surface', SGL: 'signal', SID: 'standard instrument departure', SIF: 'selective identification feature',
  SIG: 'significant', SIMUL: 'simultaneous', SKC: 'sky clear', SKED: 'schedule', SLW: 'slow', SMC: 'surface movement control',
  SMR: 'surface movement radar', SPECI: 'special meteorological report', SPOC: 'SAR point of contact', SPOT: 'spot wind', SQ: 'squall',
  SR: 'sunrise', SRA: 'surveillance radar approach', SRE: 'surveillance radar element', SRG: 'short range', SRR: 'search and rescue region',
  SRY: 'secondary', SS: 'sunset', SSB: 'single sideband', SSE: 'south-south-east', SSR: 'secondary surveillance radar', SST: 'supersonic transport',
  SSW: 'south-south-west', STA: 'straight-in approach', STAR: 'standard instrument arrival', STD: 'standard', STF: 'stratiform',
  STN: 'station', STNR: 'stationary', STOL: 'short take-off and landing', STS: 'status', STWL: 'stopway light(s)', SUBJ: 'subject to',
  SUN: 'Sunday', SUP: 'supplement', SUPPS: 'regional supplementary procedures', SVC: 'service message', SVCBL: 'serviceable', SW: 'south-west',
  SWB: 'south-westbound', SWY: 'stopway',
  // T
  TA: 'transition altitude', TAA: 'terminal arrival altitude', TACAN: 'UHF tactical air navigation aid', TAIL: 'tail wind',
  TAR: 'terminal area surveillance radar', TAX: 'taxiing', TCAS: 'traffic alert and collision avoidance system', TDO: 'tornado',
  TDZ: 'touchdown zone', TECR: 'technical reason', TEL: 'telephone', TEMPO: 'temporary', TFC: 'traffic', TGL: 'touch-and-go landing',
  TGS: 'taxiing guidance system', THR: 'threshold', THRU: 'through', THU: 'Thursday', TIL: 'until', TIP: 'until past', TKOF: 'take-off',
  TL: 'till', TLOF: 'touchdown and lift-off area', TMA: 'terminal control area', TNA: 'turn altitude', TNH: 'turn height', TOC: 'top of climb',
  TODA: 'take-off distance available', TODAH: 'take-off distance available helicopter', TORA: 'take-off run available', TP: 'turning point',
  TR: 'track', TRA: 'temporary reserved airspace', TRANS: 'transmits / transmitter', TRL: 'transition level', TSUNAMI: 'tsunami',
  TT: 'teletypewriter', TUE: 'Tuesday', TURB: 'turbulence', TVOR: 'terminal VOR', TWR: 'aerodrome control tower', TWY: 'taxiway',
  TWYL: 'taxiway-link', TXT: 'text', TYP: 'type of aircraft', TYPH: 'typhoon',
  // U
  UAB: 'until advised by', UAC: 'upper area control centre', UAR: 'upper air route', UAS: 'unmanned aircraft system', UFN: 'until further notice',
  UHDT: 'unable higher due traffic', UIC: 'upper information centre', UIR: 'upper flight information region', ULR: 'ultra long range',
  UNA: 'unable', UNAP: 'unable to approve', UNL: 'unlimited', UNREL: 'unreliable', 'U/S': 'unserviceable', UTA: 'upper control area',
  // V-Z
  VAC: 'visual approach chart', VAL: 'in valleys', VAN: 'runway control van', VAR: 'magnetic variation', VASIS: 'visual approach slope indicator system',
  VDF: 'VHF direction-finding station', VER: 'vertical', VFR: 'visual flight rules', VHF: 'very high frequency', VIA: 'by way of', VIP: 'very important person',
  VIS: 'visibility', VLR: 'very long range', VMC: 'visual meteorological conditions', VOLMET: 'meteorological information for aircraft in flight',
  VOR: 'VHF omnidirectional radio range', VORTAC: 'VOR and TACAN combination', VRB: 'variable', VSA: 'by visual reference to the ground',
  VTOL: 'vertical take-off and landing', WAC: 'world aeronautical chart', WAFC: 'world area forecast centre', WB: 'westbound', WBAR: 'wing bar lights',
  WDI: 'wind direction indicator', WDSPR: 'widespread', WED: 'Wednesday', WEF: 'with effect from', WI: 'within', WID: 'width',
  WIE: 'with immediate effect', WILCO: 'will comply', WIND: 'wind', WIP: 'work in progress', WKN: 'weaken', WNW: 'west-north-west',
  WO: 'without', WPT: 'waypoint', WRNG: 'warning', WSW: 'west-south-west', WT: 'weight', WTSPT: 'waterspout', WX: 'weather',
  XNG: 'crossing', XS: 'atmospherics', YCZ: 'yellow caution zone', YR: 'your',
  // 흔한 비공식 축약
  AD: 'aerodrome', APRON: 'apron', ASAP: 'as soon as possible', FLWG: 'following', ACTV: 'active', ACTVT: 'activate',
  BTWN: 'between', CTRL: 'control', DEACT: 'deactivated', DEACTIVATED: 'deactivated', ESTB: 'established', ESTBD: 'established',
  INSTD: 'installed', LGTS: 'lights', NOTAM: 'NOTAM', OBSTN: 'obstruction', PROHIB: 'prohibited', RSTD: 'restricted',
  SVCS: 'services', TMPRY: 'temporary', TWRS: 'towers', TXL: 'taxilane', UNSERVICEABLE: 'unserviceable', NOTAMN: 'new NOTAM',
  NOTAMR: 'replacement NOTAM', NOTAMC: 'cancellation NOTAM', AIP: 'AIP', AIRAC: 'AIRAC', ATC: 'ATC', ATS: 'ATS', ATM: 'air traffic management',
  RNAV: 'RNAV', GNSS: 'GNSS', GPS: 'GPS', GBAS: 'ground-based augmentation system', SBAS: 'satellite-based augmentation system',
  LPV: 'localizer performance with vertical guidance', LNAV: 'lateral navigation', VNAV: 'vertical navigation', RAIM: 'receiver autonomous integrity monitoring',
  ADS: 'automatic dependent surveillance', 'ADS-B': 'automatic dependent surveillance-broadcast', 'ADS-C': 'automatic dependent surveillance-contract',
  APU: 'auxiliary power unit', GPU: 'ground power unit', PCA: 'pre-conditioned air', VDGS: 'visual docking guidance system',
  HIRO: 'high intensity runway operation', CFMU: 'central flow management unit', NPP: 'nuclear power plant', SODO: 'sector operations',
  MCRC: 'master control and reporting centre', ROKAF: 'Republic of Korea Air Force', SSN: 'Seoul Air Base', GMP: 'Gimpo',
};

// 약어 아님(식별자/일반 단어와 겹쳐 오해 소지) — 그대로 둠
const KEEP = new Set(['FIR', 'ATC', 'ATS', 'AIP', 'AIRAC', 'RNAV', 'GNSS', 'GPS', 'NOTAM', 'MHZ', 'KHZ', 'FLY', 'END', 'WIND', 'VIA',
  'GRASS', 'APRON', 'SPOT', 'MAP', 'MIN', 'MON', 'SUN', 'SAT', 'WED', 'TUE', 'THU', 'FRI', 'ID', 'IF', 'AP', 'TR', 'TT', 'TL', 'TP', 'CH',
  'GS', 'RE', 'EV', 'DR', 'TA', 'PA', 'GA', 'MT', 'LO', 'LM', 'IM', 'OM', 'MM', 'SS', 'SR', 'IR', 'SE', 'SW', 'NW', 'NE', 'MS',
  'SQ', 'RG', 'RV', 'DP', 'HR', 'KM', 'KT', 'KW', 'EM', 'YR', 'XS', 'LAN', 'MAR', 'VAL', 'VAN', 'ORD', 'SVC', 'COT', 'COV', 'ANS',
  'TEL', 'REG', 'ENG', 'LEN', 'RTN', 'CONT', 'RITE', 'TAIL', 'HOSP', 'DOM', 'GMP', 'SSN', 'SODO', 'TYP',
  // 조종사가 그대로 쓰는 약어는 풀지 않음
  'DME', 'VOR', 'DVOR', 'NDB', 'ILS', 'TACAN', 'VORTAC', 'LOC', 'GP', 'PAPI', 'ATIS', 'RVR', 'CPDLC', 'ADS', 'ADS-B', 'ADS-C',
  'SID', 'STAR', 'MSA', 'MOCA', 'OCA', 'OCH', 'DA', 'DH', 'MDA', 'MDH', 'RNP', 'RVSM', 'VFR', 'IFR', 'TMA', 'CTR', 'CTA', 'UIR', 'ACC',
  'APP', 'TWR', 'SSR', 'PSR', 'GBAS', 'SBAS', 'LPV', 'LNAV', 'VNAV', 'RAIM', 'DCT', 'IAF', 'FAF', 'MAPT', 'ETA', 'ETD', 'EOBT', 'TCAS',
  'APU', 'GPU', 'PCA', 'FMS', 'SELCAL', 'SATCOM', 'VHF', 'HF', 'UHF', 'IAS', 'TAS', 'QNH', 'QFE', 'ATM', 'NOF', 'MCRC', 'ROKAF', 'NPP',
  'HIRO', 'VDGS', 'CFMU', 'PJE', 'UAS', 'IAC', 'OCC', 'VIP', 'MON', 'TRA', 'MOA', 'FIC', 'AFIS', 'ARP', 'THR', 'TDZ', 'TORA', 'TODA', 'ASDA', 'LDA', 'PCN', 'CL']);
// 특정 문맥에서만 푸는 약어
const CONTEXT = {
  MIN: (prev) => /^\d+$/.test(prev || '') ? 'minutes' : null,
  ID: (prev) => /^[A-Z]{2,4}$/.test(prev || '') ? null : null,
  SR: (prev, next) => /^-|^SS$/.test(next || '') || /-$/.test(prev || '') ? 'sunrise' : null,
  SS: (prev, next) => /SR/.test(prev || '') || /^-/.test(next || '') ? 'sunset' : null,
  CH: (prev, next) => /^\d+[XY]?$/.test(next || '') ? 'channel' : null,
  GS: (prev, next) => /ILS|LOC/.test(prev || '') || /U\/S|OUT/.test(next || '') ? 'glide slope' : null,
  AD: (prev, next) => /^\d/.test(next || '') ? null : 'aerodrome',
  DP: (prev, next) => /^\d/.test(next || '') ? null : 'de-icing pad',
};

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// 좌표 → 사람이 읽는 형식
function coordTxt(lat, ns, lon, ew) {
  const f = (s, w) => { const d = s.slice(0, w), m = s.slice(w, w + 2), sec = s.slice(w + 2, w + 4); return `${+d}°${m}′${sec ? sec + '″' : ''}`; };
  return `${f(lat, 2)}${ns} ${f(lon, 3)}${ew}`;
}
const MON = { JAN: 'January', FEB: 'February', MAR: 'March', APR: 'April', MAY: 'May', JUN: 'June', JUL: 'July', AUG: 'August', SEP: 'September', OCT: 'October', NOV: 'November', DEC: 'December' };

/** 원문 → {html, text}. html은 풀어쓴 부분을 <b class="dx">로 감싼다. */
export function decodeEN(raw) {
  if (!raw) return { html: '', text: '' };
  let s = raw.replace(/\r/g, '');
  // 줄 끝에서 끊긴 좌표 잇기 (35150\n1N125… → 351501N125…)
  s = s.replace(/(\d)\n(\d+[NSEW])/g, '$1$2').replace(/(\d)\n([NSEW]\b|[NSEW]\d)/g, '$1$2');
  const out = [], plain = [];
  const lines = s.split('\n');
  for (const line of lines) {
    const toks = line.split(/(\s+|[(),;:])/);
    const words = toks.filter(t => t && !/^\s+$/.test(t));
    let wi = -1;
    let h = '', p = '';
    for (const t of toks) {
      if (!t) continue;
      if (/^\s+$/.test(t) || /^[(),;:]$/.test(t)) { h += esc(t); p += t; continue; }
      wi++;
      const prev = words[wi - 1], next = words[wi + 1];
      const r = decodeToken(t, prev, next);
      if (r == null) { h += esc(t); p += t; }
      else { const u = upper(r); h += `<b class="dx" title="${esc(t)}">${esc(u)}</b>`; p += u; }
    }
    out.push(h); plain.push(p);
  }
  return { html: out.join('\n'), text: plain.join('\n') };
}

// NOTAM 문체에 맞춰 대문자로 (단위 표기는 유지)
const upper = r => r.replace(/[A-Za-z]+/g, w => /^(MHz|kHz|km|ft|kt|NM|m|UTC)$/.test(w) ? w : w.toUpperCase());
function decodeToken(t, prev, next) {
  let m;
  // 좌표 DDMM(SS)N DDDMM(SS)E
  if ((m = /^(\d{4}|\d{6})(?:\.\d+)?([NS])(\d{5}|\d{7})(?:\.\d+)?([EW])([-.,]?)$/.exec(t))) return coordTxt(m[1], m[2], m[3], m[4]) + m[5];
  if ((m = /^([NS])(\d{4}|\d{6})([EW])(\d{5}|\d{7})([-.,]?)$/.exec(t))) return coordTxt(m[2], m[1], m[4], m[3]) + m[5];
  if ((m = /^(\d{4}|\d{6})(?:\.\d+)?([NS])$/.exec(t)) && /^(\d{5}|\d{7})(?:\.\d+)?[EW]/.test(next || '')) return null;
  // 비행고도
  if ((m = /^FL(\d{2,3})([-/]FL(\d{2,3}))?$/.exec(t))) return null;
  // F)/G) 같은 항목 표시는 그대로
  if (/^[A-G]\)$/.test(t)) return null;
  // 시각 범위 0200-0400
  if ((m = /^(\d{4})-(\d{4})$/.exec(t))) return `${m[1]}–${m[2]} UTC`;
  // 날짜형 15OCT26
  if ((m = /^(\d{2})([A-Z]{3})(\d{2})$/.exec(t)) && MON[m[2]]) return `${+m[1]} ${MON[m[2]]} 20${m[3]}`;
  // 단위가 붙은 숫자 3NM 300KM 116.900MHZ 250KT 7000FT
  if ((m = /^([\d.,]+)(NM|KM|M|FT|KT|MHZ|KHZ|DEG|MIN|HR|SEC)([.,]?)$/.exec(t))) {
    const u = { NM: ' NM', KM: ' km', M: ' m', FT: ' ft', KT: ' kt', MHZ: ' MHz', KHZ: ' kHz', DEG: '°', MIN: ' minutes', HR: ' hours', SEC: ' seconds' }[m[2]];
    return m[1] + u + m[3];
  }
  // 'XXX/YYY' 형태(예: U/S, VOR/DME, M/UM11)
  if (t === 'U/S' || t === 'U/S.') return 'unserviceable' + (t.endsWith('.') ? '.' : '');
  if (/[\/-]/.test(t) && t.length > 3) { // INFO/SURVEILLANCE, SFC-UNL, 115.90MHZ/CH106X 등
    const parts = t.split(/([\/-])/);
    // 'A/B'형은 모든 글자 부분이 풀릴 때만 (BCN/ICN 같은 도시쌍 보호)
    if (t.includes('/') && parts.some(x => /^[A-Z]{2,}$/.test(x) && decodeToken(x) == null)) return null;
    let changed = false;
    const res = parts.map((x, i) => {
      if (x === '/' || x === '-' || !x) return x;
      const r = decodeToken(x, parts[i - 2], parts[i + 2]);
      if (r != null) { changed = true; return upper(r); }
      return x;
    });
    return changed ? res.join('') : null;
  }
  // 끝 문장부호 분리
  const pm = /^(.+?)([.,]+)$/.exec(t);
  const core = pm ? pm[1] : t, tail = pm ? pm[2] : '';
  if (CONTEXT[core]) { const r = CONTEXT[core](prev, next); return r == null ? null : r + tail; }
  if (KEEP.has(core)) return null;
  if (core.length < 2) return null;
  const e = EN[core];
  if (!e) return null;
  return e + tail;
}
