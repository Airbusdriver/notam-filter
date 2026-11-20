# CLAUDE.md — OFP 추출 / NOTAM 경로 필터

이 파일은 Claude Code가 이 저장소에서 작업할 때마다 먼저 읽는 지침이다.
아래 내용은 claude.ai 프로젝트 "OFP 추출"에서 사용자와 정한 사항을 옮겨 적은 것이다.

## 프로젝트 목적
비행할 때 쓰는 OFP 안의 데이터를 뽑아서 비행 중에 편하게 쓰는 것이 목적이다. 예를 들면:
- NOTAM이 너무 많으므로 해당되는 것만 골라서 원문(raw)과 해석본으로 보여준다.
- OFP 요약 내용을 FMS에 입력하기 좋은 형태로 정리한다.

## 사용 환경 (중요)
- **주 사용 기기: 회사 EFB로 쓰는 iPad. 브라우저는 Safari와 Chrome을 모두 쓴다 (홈 화면 PWA 포함).**
- iPad의 Chrome도 Safari와 같은 WebKit 엔진이므로, 새 기능은 Safari와 Chrome(iPad) 양쪽에서 확인한다. Chrome 데스크톱 전용 API(File System Access API 등)는 쓰지 않는다.
- 저장 데이터(번역 파일, 설정, 이륙시간 입력값)는 브라우저·홈 화면 앱마다 따로 저장되어 서로 공유되지 않는다.
- 기내에서는 네트워크가 없을 수 있으므로 모든 기능은 **오프라인으로, 기기 안에서만** 동작해야 한다. 외부 서버나 API로 데이터를 보내지 않는다.
- 회사가 관리하는 기기라서 설치·저장소·파일 접근에 MDM 제한이 걸려 있을 수 있다. 새 기능을 만들 때는 iPad 브라우저 기본 기능(File input, localStorage/IndexedDB, Service Worker)만 쓰고, 별도 앱 설치나 프로필이 필요한 방식은 쓰지 않는다.
- 화면은 iPad 터치 조작 기준(손가락으로 누르기 좋은 버튼 크기, 가로/세로 모두)으로 만든다. 야간(적색) 모드를 지원한다.
- 회사 OFP 원본(PDF·txt)은 **저장소에 커밋하지 않는다** (`.gitignore`로 제외, 로컬에만 보관). 공개 저장소(GitHub Pages)이기 때문이다.

## 저장소와 배포
- 저장소: https://github.com/Airbusdriver/notam-filter (main 브랜치 루트)
- 웹 주소: https://airbusdriver.github.io/notam-filter/
- 현재 버전: v1.11.1 (2026-11-20) — 오프라인 열기 보강(페이지 열기 요청 index.html 대체, 실제 오프라인 준비 상태 표시)
- 오프라인 주의: 주소는 반드시 끝에 / 를 붙인 https://airbusdriver.github.io/notam-filter/ 로 연다. / 없는 주소는 서비스워커 범위 밖이라 오프라인에서 열리지 않는다(GitHub 리디렉트가 온라인에서만 동작).
- **반영 방식(사용자 결정):** 앱 동작에 영향이 없는 변경(CLAUDE.md·README·.gitignore 등 문서·설정)은 PR 없이 main에 바로 올린다. 앱 코드(HTML·JS·sw.js 등)를 바꾸는 변경은 브랜치에서 PR을 열어 사용자 확인을 받은 뒤 합친다.
- **업데이트 규칙:** 파일을 수정하면 `sw.js`의 `VERSION` 값을 올려야 설치된 홈 화면 앱이 새 버전을 받는다. 새 파일은 `sw.js`의 `FILES`에도 추가한다.

## 사용자가 정한 원칙
- **추가 비용이 드는 API(AI) 번역은 쓰지 않는다** (v1.4.0에서 제거). 해석은 오프라인 전문 직역과, Claude 대화(구독)에서 만든 번역 파일을 함께 쓴다.
- **NOTAM 해석은 축약하지 않는다.**
- 파서에 특정 편명·노선 값을 하드코딩하지 않는다. 실제로는 사용자가 매번 새 OFP를 올린다. AAR541·AAR204는 검증용일 뿐이다.
- OFP에 없는 값은 추측해서 채우지 않는다 (빈칸 또는 "끝 잘림?" 같은 표시).
- FMS 관련 탭은 **FMS 초기 셋업 전용**이다. 로드시트 입력이나 재계산은 고려하지 않는다.

## 하는 일
OFP PDF(아시아나 Jeppesen Dataplan + NOTAM PACKAGE 1~3 형식)를 열면 FPL 항로, navlog 지점, 좌표 구역, FIR 진입시각(EET), 통과 고도, D) 운용시간으로 NOTAM을 관련 / 검토 / 제외로 나누고, 원문과 해석을 함께 보여준다. 처리는 모두 기기 안(iPad Safari·Chrome)에서 오프라인으로 한다.

### 탭 순서
경로·FIR / 출발·도착·교체 / REFILE·ERA / 제외됨 / 전체 / 항로 대조 / MEL/CDL / INIT / FUEL & LOAD
(EDTO·REFILE 탭은 해당 비행일 때만 보인다)

## 메인 정보줄 (v1.8.1 ~ v1.11.0)
- 순서: 편명 구간 [비행 종류] · 날짜 · ETD · 이륙 [입력칸] · ETA · ALTN · CFP PLAN · 비행시간
- 비행 종류: OFP 첫 장 `ATTN CAPT.  7771  REFILE` 줄의 끝 단어(EDTO, REFILE, 또는 둘 다). 없으면 표시하지 않는다.
- **CFP PLAN 번호를 표시한다** (`CFP PLAN 7445` 줄). 노선코드(R13/NR14)는 화면에서 빼고 INIT CPNY RTE와 회사 영향노선 판정에만 쓴다.
- 이륙 입력칸(UTC HHMM): 값을 넣으면 navlog 누적시간을 그 시각부터 적용해서 지점 ETO, FIR 시간, ETA, NOTAM 판정, EDTO/REFILE 탭 시각을 다시 계산한다. 비우면 OFP 계획 ETD를 쓴다. 같은 OFP를 다시 열면 입력값을 유지하고, 새 OFP를 열면 초기화한다. '계획으로' 버튼으로 되돌린다. 잘못된 값은 빨간 칸으로 표시하고 계산에 반영하지 않는다.

## EDTO / REFILE 탭
- **EDTO 비행:** EEP · ETP · EXP 좌표와 EDTO 교체공항을 뽑아 보여준다 (OZ204 OFP로 테스트).
- **EDTO가 아닌 REFILE 비행:** REFILE 데이터(결심점 연료 요약 등)를 보여준다. VFR 값은 **'VFR + ½ FINAL RES'(NAR 요구량)로 수정했다고 표시**한다. 근거: FOM 5장 (135), FLEET NOTICE.

## 항로 대조 탭 (v1.5.x, route.js · route-view.js)
- 비교 대상: OFP 상단 company route 문자열(`RKSI..NOPIK Y697 … DEBH2B EDDF` 형식) ↔ ATS FPL 15항
- 지점 이름과 각 지점으로 들어오는 항로(또는 DCT)를 LCS로 정렬해서 비교한다. 출발·SID·STAR·목적지는 따로 비교한다.
- 좌표 표기 통일: 39N160E = N39E160 = navlog ARINC 약식(39E60, 40N70은 navlog 위경도로 변환)
- 절차명 ARINC 6자 약식(DEBH2B ↔ DEBHI2B)은 "일치(약식 표기)"로 처리한다.
- **사용자 규칙:** step climb/descent 때문에 FPL에 지점이 추가돼도 같은 항로 안(W28 KEVOB W28)이면 일치로 표시한다. navlog에서 앞뒤 지점 사이에 있는지 확인하고, 없으면 "확인"으로 표시한다.
- 미터 고도(S/M)는 회사 China/Mongolia METER/FEET CONVERSION TABLE 기준으로 미터와 FL·ft를 함께 쓴다.
- 속도·고도 변경점 표: navlog에서 그 지점 뒤 처음 도달하는 순항 FL과 비교한다(±1은 ≈).
- OFP 안에 있는 ATS FPL 사본끼리 15항이 다르면 경고한다.
- 항로 DB가 없어서 항로 안쪽 경유 지점은 검증하지 않는다.

## MEL/CDL 탭 (v1.8.0, mel.js · mel-view.js) — INIT 탭 왼쪽
- 출처: DISPATCH RELEASE INFORMATION 페이지의 "n. MEL / CDL ITEMS"부터 다음 번호 머리("4. FUEL BURN ADJUSTMENT") 앞까지
- 항목 형식 `- MEL 21-59-01A : 설명` / `- CDL 27-21 : 설명` → 구분, 번호, OFP 원문, ATA 장 이름(참고용 표)
- 등록부호: "I HEREBY RELEASE THE FLIGHT …, HL7771, ETD …" 줄
- 디스패치 노트 중 MEL/CDL 문장(예: CHECKED ABOVE MEL (NO RESTRICTION ON FLIGHT PLANNING))도 함께 보여준다.
- OFP가 설명을 약 40자에서 잘라 출력하므로, 설명이 36자 이상이거나 따옴표·괄호 짝이 맞지 않으면 "끝 잘림?"으로 표시한다. 잘린 문구는 추측해서 채우지 않는다.
- 항목이 없거나 NIL이면 "MEL / CDL 항목 없음 (NIL)", 머리 자체가 없으면 경고한다. 탭 숫자 = 항목 수

## INIT 탭 (v1.7.x, init.js · init-view.js) — FUEL & LOAD 탭 왼쪽
- A350 FMS ACTIVE/INIT 페이지 배치대로 표시한다.
- 값 출처:
  - FLT NBR = FLIGHT RELEASE 편명
  - FROM/TO = FLIGHT RELEASE
  - ALTN = ALTN/xxxx
  - **CPNY RTE = OFP 머리표 ROUTE 칸 노선코드 그대로** (사용자 확인: AAR204 = NR14, AAR541 = R13), 도시쌍도 함께 표시
  - CRZ FL = navlog 첫 순항 FL (변경 지점 목록은 참고로)
  - MODE = ECON
  - CI = SPEED SKD "CRZ- nn"
  - TRIP WIND · CRZ TEMP = 머리표 AVG WIND/TEMP (M039/M56 → HD039, −56°C; P는 TL)
- TROPO: OFP에 값이 없으므로 ISA 기본값 36090 FT(점선 칸). OFP에 TROPO 값이 생기면 그 값을 쓴다.
- ALTN RTE: 빈칸, 옆에 OFP "ROUTE TO ALTN" 경로를 표시한다.

## FUEL & LOAD 탭 (v1.6.x, fuel.js · fuel-view.js)
- 용도(사용자 결정): FMS 초기 셋업 전용. 로드시트 입력·재계산 없음(v1.6.1에서 제거). OFP 계획값만 표시한다.
- 파싱 대상: OFP CFP 머리(FLIGHT RELEASE ~ DIST LATITUDE)의 연료표(TRIP · RESERVE · ALTN/xxxx · FINAL RES · n PCT CONT · REFILE RES · RQD TAKEOFF · DISC · TANKERING · PLN TAKEOFF · TAXI · RAMP OUT · FOD)와 무게 열(ZFW · MZFW · TOW · MTOW · LDW · MLDW · TOF · TIF · PLD · SOW · PLAN AGTOW)
- 단위: 헤더 UNIT 값(100LBS/100KGS) 그대로 쓰고, 화면에는 ÷10 (예: 1935 → 193.5 = ×1000 LB)
- 값 출처(사용자 확정):
  - ZFW = OFP ZFW · BLOCK = RAMP OUT · TAXI · TRIP(연료/시간)
  - RTE RSV = n PCT CONT 값 (%는 TRIP 대비 자동 계산)
  - ALTN = ALTN/xxxx · FINAL = FINAL RES · CI = SPEED SKD "CRZ- nn"
  - TOW = ZFW + BLOCK − TAXI · LW = TOW − TRIP
  - MIN FUEL AT DEST = ALTN + FINAL
  - EXTRA = BLOCK − TAXI − TRIP − RSV − ALTN − FINAL (= DISC + TANKERING)
- **EFOB 규칙:** EFOB DEST = OFP FOD, EFOB ALTN = FOD − ALTN FUEL. 계산값 BLOCK − TAXI − TRIP과 다르면 검증표에 ✗
- **PAX NBR 규칙:** DISPATCH RELEASE INFORMATION > PAX/CARGO RESERVATION의 "PASSENGERS: FIRST a/x BUSINESS b/y ECONOMY c/z"에서 a+b+c (예: 0+27+283)
- ZFWCG는 OFP에 없으므로 빈칸
- OFP 합계 검증(RESERVE · RQD · PLN TAKEOFF · RAMP · FOD · EFOB DEST · TOF · TOW · LDW · ZFW · EXTRA)과 무게 제한 여유(MZFW · MTOW · PLAN AGTOW · MLDW)를 보여준다.
- 참고 정보: REFILE 결심점 필요/계획 연료, CCF(DISC 포함), DISC 사유, PERF FACTOR, PAX NBR 계산식, PAYLOAD, 노선 TRIP 통계
- n PCT CONT 값이 REFILE 기준일 때(예: AAR541의 5 PCT CONT 0.9 = REFILE TEGRI→EDDF 기준, TRIP의 0.5%) 화면에 설명을 표시한다.

## NOTAM 해석 구성
1. 요약 (한국어 한 줄, 규칙 기반) — interp.js
2. 전문 해석 — 설정에서 방식 선택: 번역 파일 우선(없으면 직역, 기본) / 번역 파일 + 직역 함께 / 직역만
   - 전문 직역: literal.js, 오프라인, 축약 없음 (어순은 영어식)
   - 번역 파일: Claude 대화(구독)에서 만든 자연스러운 전문 번역 JSON을 불러와 기기에 저장 — trfile.js
3. 영문 디코딩 (ICAO Doc 8400·FAA 약어 풀어쓰기) — decode.js. 조종사가 흔히 쓰는 약어(DME, ILS, SID 등)는 그대로 둔다.

## 번역 파일 만드는 절차
1. 사용자가 OFP PDF를 주면 `node tools/export.mjs <OFP.pdf> to-translate.json` 실행 (앱과 같은 판정, 제외·ERA 항목 제외)
2. 각 항목을 축약 없이 자연스러운 한국어로 전문 번역해 `ko`에 채운다. 식별부호·주파수·좌표·FL·시각은 원문 그대로 둔다.
3. 형식: `{"format":"notam-ko-v1","flight","dep","dest","date","items":[{"loc","id","h","ko"}]}`
   파일명은 영문 (예: `AAR541_RKSI-EDDF_20261102_ko.json`). **번역 파일도 OFP 내용을 담으므로 커밋하지 않는다.**
4. 사용자는 iPad 앱에서 PDF와 함께 선택하거나 설정 → 번역 파일 불러오기. 해시(h)가 같으면 정확히 연결된다.

## 기본 설정
판정 폭 25NM · 시간 여유 통과 전 30분 / 후 120분 · 고도 여유 2000ft · 화면 모드 자동/라이트/다크/야간(적색). 이륙시간은 메인 정보줄에서 입력한다.

## 파일 구성
- `index.html` · `app.js` · `core.js`(파싱·경로 매칭)
- `route.js` / `route-view.js` (항로 대조)
- `mel.js` / `mel-view.js` (MEL/CDL)
- `init.js` / `init-view.js` (INIT)
- `fuel.js` / `fuel-view.js` (FUEL & LOAD)
- `edto.js` / `edto-view.js` · `refile.js` / `refile-view.js`
- `interp.js`(요약) · `literal.js`(전문 직역) · `decode.js`(영문 디코딩) · `trfile.js`(번역 파일)
- `tools/export.mjs`
- `pdf.min.mjs` / `pdf.worker.min.mjs` (pdf.js)
- `sw.js` · manifest · 아이콘

## 검증 방법
- 검증용 OFP는 로컬 폴더에만 둔다 (커밋하지 않음). pdftotext 추출본과 앱(pdf.js)의 줄 구성이 다를 수 있으므로 앱 검증은 원본 PDF로 한다.
- 수정 후에는 헤드리스 Chrome으로 PDF를 열고 모든 탭을 오가며 오류가 없는지 확인한다.

### 검증 기록 (기대값)
- AAR541 RKSI→EDDF 02NOV26 (96쪽, NOTAM 243건): FIR NOTAM 85건 중 관련 8 / 검토 26 / 제외 51. v1.1.0 최적화 후 결과 동일, 판정 계산 약 310ms → 55ms.
- v1.4.0 번역 파일 불러오기: 샘플 번역 파일(경로·FIR 34건) 34건 모두 해시 일치.
- v1.5.0 항로 대조: AAR541(30지점, step 지점 KEVOB·FKG·NEBIT·ASPAT, STAR DEBH2B/DEBHI2B 약식) 일치. AAR204 RKSI→KLAX(17지점, OTR7·좌표 지점, LESBU step) 일치. 인위적으로 만든 불일치는 모두 검출.
- v1.6.x FUEL & LOAD (AAR541): ZFW 395.8 · BLOCK 193.5 · TAXI 1.2 · TRIP 176.1/13:04 · RSV 0.9 · ALTN EDFH 5.0/00:19 · FINAL 5.1/00:30 · PAX 310 · CI 40 · TOW 588.1 · LW 412.0 · EFOB DEST 16.2(FOD) / ALTN 11.2 · MIN DEST 10.1 · EXTRA 5.2. OFP 합계 11항목 모두 일치.
- v1.7.x INIT:
  - AAR541: AAR541 · RKSI/EDDF/EDFH · R13 · FL320(→321→361→381→380→400) · CI 40 · HD039 · −56°C · 36090
  - AAR204 RKSI→KLAX 14NOV26: AAR204 · RKSI/KLAX/KONT · NR14 · FL330(→350→370→390, FPL N0500F330 일치) · CI 40 · TL104(P104) · −55°C · 36090 · ALTN 경로 KLAX..LAX J96 PDZ..KONT
- v1.8.0 MEL/CDL:
  - AAR541: MEL 3건 21-59-01A · 30-81-01A · 50-20-01A (3건 모두 끝 잘림), 노트 CHECKED ABOVE MEL, HL7771
  - AAR204: CDL 2건 27-21(잘림) · 27-23, 노트 CHECKED ABOVE CDL, HL8360
- v1.11.0 이륙시간 입력 (AAR541): 기본 ETA 1529Z. 이륙 0610 입력 시 ETA 1914Z · RKRR 0610Z · ZSHA 0634Z…, FIR NOTAM 관련 8→6. 잘못된 값(2575)은 빨간 칸, 계산 미반영.

## 앞으로 할 것
- PERF(T.O PERF) 입력용 요약 화면

## 하지 않기로 한 것
- 부기장이 만든 FMS 셋업용 HTML 페이지는 가져오지 않는다. FMS 입력은 이 앱의 INIT 탭과 FUEL & LOAD 탭을 보고 한다 (사용자 결정, 2026-11-20).
