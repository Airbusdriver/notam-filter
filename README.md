# OFP SUMMARY (오프라인 PWA)

OFP PDF를 열면 비행 경로(항로·지점·항행시설·좌표·FIR 통과 시각·고도)를 기준으로
NOTAM 패키지를 **관련 / 검토 / 제외**로 나누고, 원문과 한국어 해석을 함께 보여줍니다.
모든 처리는 기기 안에서 이뤄집니다. OFP는 어디에도 업로드되지 않습니다.

## GitHub Pages에 올리기 (아이패드 Safari)
1. github.com에 로그인 → 오른쪽 위 **+** → **New repository**
   - 이름: `notam-filter`, **Public** 선택 → Create repository
2. 저장소 첫 화면에서 **uploading an existing file** 누르기
   - 파일 앱에서 zip을 탭해 압축을 풀고, 폴더 안 파일 **전부**를 선택해 올리기 → **Commit changes**
3. **Settings → Pages**
   - Source: **Deploy from a branch**, Branch: **main / (root)** → Save
   - 1~2분 뒤 `https://<GitHub아이디>.github.io/notam-filter/` 주소가 생깁니다
4. Safari에서 위 주소 열기 → 공유 버튼 → **홈 화면에 추가**
5. **홈 화면 아이콘으로 한 번 실행**(온라인 상태)해서 캐시를 받아두면, 이후에는 비행기 모드에서도 열립니다.

> 저장소에는 도구 코드만 올라갑니다. OFP·NOTAM 파일은 저장소에 올리지 마세요.

## 사용법
- **PDF 열기**: NOTAM 패키지가 포함된 OFP PDF 한 개, 또는 OFP와 NOTAM PDF를 함께 선택
- 탭: 경로·FIR / 출발·도착·교체 / REFILE·ERA / 제외됨 / 전체 / **항로 대조** / **MEL/CDL** / **INIT** / **FUEL & LOAD** / **EDTO**(EDTO 비행일 때만) / **REFILE 연료**(REFILE 비행일 때만)
- **항로 대조**: OFP의 company route(`RKSI..NOPIK Y697 … DEBH2B EDDF`)와 ATS FPL 15항을 지점·항로 단위로 비교
  - 좌표 표기 통일(39N160E = N39E160), ARINC 6자 약식 절차명(DEBH2B = DEBHI2B)은 '일치(약식 표기)'
  - FPL에만 있는 지점이라도 앞뒤가 같은 항로(W28 KEVOB W28)이면 step climb·descent 지점으로 보고 일치 처리(navlog 순서로 확인)
  - 속도·고도 변경점 표: 미터 고도(S/M)는 METER/FEET CONVERSION TABLE(China/Mongolia) 기준으로 미터와 FL·ft를 함께 표시, navlog 순항 FL과 비교
  - OFP 안 ATS FPL 사본끼리 15항이 다르면 경고
- **MEL/CDL**: DISPATCH RELEASE INFORMATION의 "MEL / CDL ITEMS" 항목(구분·번호·원문·ATA 장)과 관련 디스패치 노트 표시. OFP가 약 40자에서 자른 설명은 "끝 잘림?" 표시
- **INIT**: 올린 OFP 머리에서 A350 FMS ACTIVE/INIT 페이지 값을 읽어 같은 배치로 표시
  - FLT NBR · FROM/TO/ALTN(FLIGHT RELEASE·ALTN/xxxx) · CPNY RTE(ROUTE 칸 노선코드) · CRZ FL(navlog 첫 순항 고도, 변경 지점 목록은 참고) · CI(SPEED SKD CRZ-) · TRIP WIND·CRZ TEMP(AVG WIND/TEMP, M=맞바람 HD / P=뒷바람 TL)
  - TROPO: OFP에 값이 없으면 ISA 기본값 36090 FT(점선 칸) · ALTN RTE는 빈칸, OFP 교체 경로(ROUTE TO ALTN)를 옆에 표시
- **FUEL & LOAD**: OFP 연료 요약(TRIP·RESERVE·ALTN·FINAL·CONT·DISC·TAXI·RAMP)과 무게(ZFW·TOW·LDW·제한값)를 읽어 A350 FMS ACTIVE/FUEL&LOAD 페이지 배치로 표시
  - 입력값(파란 사각형): ZFW · ZFWCG · BLOCK · TAXI · RTE RSV · ALTN · FINAL · PAX NBR · CI / 대조값(초록): TRIP · TOW · LW · DEST/ALTN UTC·EFOB · EXTRA
  - EFOB DEST = OFP FOD, EFOB ALTN = FOD − ALTN FUEL (BLOCK − TAXI − TRIP 계산값과 대조)
  - MIN FUEL AT DEST = ALTN + FINAL, EXTRA = BLOCK − TAXI − TRIP − RTE RSV − ALTN − FINAL (= DISC + TANKERING)
  - OFP 합계 검증(RESERVE·RQD·PLN TAKEOFF·RAMP·FOD·TOW·LDW·ZFW)과 MZFW·MTOW·PLAN AGTOW·MLDW 여유 표시
  - FMS 초기 셋업용: OFP 계획값만 표시(ZFWCG는 OFP에 없어 빈칸)
  - 참고: REFILE 결심점 필요 연료, CCF, DISC 사유, CI·속도, 예약 승객, 노선 연료 통계
- **EDTO** (OFP 머리에 EDTO/ETOPS 표시가 있을 때만 나타남)
  - EDTO 지점: navlog의 EEP·ETP·EXP 좌표(OFP 표기 + Airbus LAT/LONG 입력 형식), ETO(UTC·경과), FL, 누적/잔여 거리, EFOB(R/F), 관련 공항(EEP=Entry, EXP=Exit, ETP=공항 쌍)
  - 시간축: 비행·EEP–EXP 구간과 교체공항 SUITABLE FROM/TO 시간대, ETP별 회항 도착 예상 표시
  - ETP 임계연료: EDTO EQUAL TIME POINT DATA 요약·상세에서 CFR·FOB·EXC(여유)·G/C 거리·W/C·결정 시나리오, MOST CRITICAL 표시, 시나리오별(DECOMP 2/1 ENG·PRESS 1 ENG) 연료·시간
  - 회항 도착 예상 = ETP 통과 예정 + 결정 시나리오 회항시간 → 공항 적합 시간대 안인지 대조
  - EDTO 교체공항: 적합 시간대, 사용 ETP, 최장 활주로, 회사 무선(NOTAM 패키지), NOTAM 건수
  - OFP 내부 대조: navlog ↔ ETP LOCATION ↔ 요약 좌표, 통과 시간, FOB ↔ R/F, EXC 계산, ATS FPL RALT ↔ 교체공항 목록
- **REFILE 연료** (OFP에 REFILE FLT PLAN이 있을 때만 나타남)
  - 결심점 필요 연료: RQRD(목적지·교체 지정), NAR(교체공항 미지정), 계획 잔량(PLANNED R/F)과 여유 — ×1000 단위, 요구량은 0.1 올림
  - **VFR 수정**: OFP VFR(=TRIP+FINAL+CONT)은 15분 체공 연료가 빠진 값 → NAR 요구량 = VFR + ½ FINAL RES로 고쳐 주황색·'수정' 표시, 원래 값은 취소선 (FOM 제5장 (135) VFR)
  - 결심점 FOB 입력 → RQRD 충족 / NAR만 충족 / 미달 판정, 결심점 통과 예정 시각과 1시간 전(ACARS 교차 확인) 시각
  - OFP REFILE 요약 두 열(출발→재계획 공항 / 결심점→목적지), 재계획 공항 ELDW·MLDW·초과중량, 결심점 통과 무게
  - REFILE 경로(RIF) navlog, 재계획 교체공항 연료·시간, REFILE 공항 활주로·회사 무선·NOTAM 건수
  - 합계 대조: RQRD = TRIP+ALTN+FINAL+CONT, VFR = TRIP+FINAL+CONT, 본 navlog 결심점 R/F = PLANNED R/F AT REFILE POINT
- 보기: 해석+원문 / 해석 / 원문 (가로 화면에서는 좌우로 나란히 표시)
- **설정**: 경로 판정 폭(기본 25NM), 시간 여유(통과 전 30분 / 후 120분), 고도 여유(2000ft)
- **이륙 시간**: 메인 정보줄의 이륙 칸에 실제·예상 이륙시각(UTC HHMM)을 넣으면 navlog 누적시간을 그 시각부터 적용해 지점 통과시각·FIR 시간·ETA와 NOTAM 판정을 다시 계산. 비워두면 OFP 계획 ETD 사용. 같은 OFP를 다시 열면 입력값 유지
- **화면 모드**: 자동(기기 설정 따름) / 라이트 / 다크 / 야간(적색) — 선택은 기기에 저장됨
- **인쇄**: 현재 탭을 인쇄·PDF 저장
- **영문 디코딩**: 카드마다 원문 약어를 ICAO Doc 8400·FAA 약어 기준으로 풀어쓴 영어(풀린 단어는 파란색). 오프라인 동작
- **한국어 해석 방식** (설정): 번역 파일 우선(없으면 직역) / 번역 파일 + 직역 함께 / 직역만
  - **전문 직역**: 원문 전체를 기기에서 바로 한국어로 옮김(오프라인, 축약 없음, 어순은 영어식)
  - **번역 파일**: Claude 대화에서 만든 자연스러운 전문 번역(.json)을 불러와 저장. PDF와 함께 선택하거나 설정 → 번역 파일 불러오기

## 판정 기준
| 구분 | 기준 |
|---|---|
| 관련 | FPL 항로·navlog 지점·항행시설·SID/STAR·출발/도착/교체 공항이 본문에 있거나, 좌표 구역이 경로에서 판정 폭 이내이고, 통과 시각·고도에 겹침 |
| 검토 | 위치 특정이 없는 FIR 전반 공지, 같은 항로의 다른 구간, 방향(EB/WB) 불일치, D) 시간표 해석 불가 |
| 제외 | 좌표가 경로에서 멀리 떨어짐, 경로에 없는 항로·항행시설만 언급, 통과 시각에 비활성, 고도 범위 밖, 회사 COMMENT의 영향노선 목록에 본 노선코드가 없음 |

해석은 규칙 기반(유형별 요약 + 유효기간·운용시간·범위·고도 정리 + 약어 풀이)입니다.
공식 브리핑을 대신하지 않으므로, 최종 확인은 원문으로 하세요.

## 업데이트할 때
파일을 고쳐 다시 올린 뒤 `sw.js`의 `VERSION` 값을 바꾸면, 다음 온라인 실행 때 새 버전으로 바뀝니다.

## 파일
`index.html` 화면 · `app.js` 화면 동작 · `core.js` OFP/NOTAM 파싱과 경로 매칭 · `interp.js` 한국어 자동 요약 · `decode.js` 영문 디코딩 · `literal.js` 전문 직역 · `trfile.js` 번역 파일 · `route.js` 항로 대조 · `route-view.js` 항로 대조 화면 · `fuel.js` 연료·무게 파싱 · `fuel-view.js` FUEL & LOAD 화면 · `init.js` INIT 값 파싱 · `init-view.js` INIT 화면 · `mel.js` MEL/CDL 파싱 · `mel-view.js` MEL/CDL 화면 · `edto.js` EDTO 파싱 · `edto-view.js` EDTO 화면 · `refile.js` REFILE 파싱 · `refile-view.js` REFILE 화면 ·
`pdf.min.mjs`, `pdf.worker.min.mjs` PDF 텍스트 추출(Mozilla pdf.js, Apache-2.0, `PDFJS-LICENSE.txt`) ·
`sw.js` 오프라인 캐시 · `manifest.webmanifest`, 아이콘

## 번역 파일 만들기 (Claude 대화에서)
1. `node tools/export.mjs <OFP.pdf> to-translate.json` — 앱과 같은 판정으로 번역 대상(제외·ERA 빼고)을 loc/id/해시/원문으로 내보냄
2. 각 항목의 `ko`에 전문 번역을 채우고 `{"format":"notam-ko-v1", ..., "items":[{"loc","id","h","ko"}]}`로 저장
3. 아이패드 앱에서 불러오기 — 해시가 같으면 정확히 연결되고, 번호만 같으면 '원문이 바뀌었을 수 있음'으로 표시
