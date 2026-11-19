// init-view.js — "INIT" 탭 화면 (A350 FMS ACTIVE/INIT 배치)
import { esc } from './interp.js';

const box = (v, cls = '') => `<span class="fm-box ${cls}">${v}</span>`;
const FL = n => (n == null ? '---' : String(n).padStart(3, '0'));
const T = m => (m == null ? '' : `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
const temp = c => (c == null ? '---' : `${c < 0 ? '−' : c > 0 ? '+' : ''}${Math.abs(c)}`);

export function renderInit(it, ofp) {
  if (!it || !it.ok) return (it?.warnings || ['OFP 머리를 찾지 못했습니다.']).map(w => `<div class="warn">${esc(w)}</div>`).join('');
  let h = it.warnings.map(w => `<div class="warn">${esc(w)}</div>`).join('');
  h += `<div class="rc-sum ${it.warnings.length ? 'bad' : 'ok'}">${it.warnings.length ? `확인 필요 ${it.warnings.length}건` : 'OFP에서 INIT 값 추출 완료'}
    <span class="note">FMS 초기 셋업용 OFP 계획값</span></div>`;

  h += `<div class="fm-wrap"><div class="fm fm-init">
    <div class="fm-title">ACTIVE/INIT</div>
    <div class="in-row"><label>FLT NBR</label>${box(esc(it.flt || '-------'), 'w')}</div>
    <div class="in-row"><label>FROM</label>${box(esc(it.from || '----'))}<label>TO</label>${box(esc(it.to || '----'))}<label>ALTN</label>${box(esc(it.altn || '----'))}</div>
    <div class="in-row"><label>CPNY RTE</label>${box(esc(it.routeCode || '-------'), 'w')}<span class="note in-n">${esc(it.cityPair || '')} 노선코드(ROUTE 칸)</span></div>
    <div class="in-row"><label>ALTN RTE</label>${box('-------', 'w')}<span class="note in-n">${it.altnRoute ? 'OFP 교체 경로 ' + esc(it.altnRoute) : ''}</span></div>
    <hr>
    <div class="in-cols">
      <div class="in-g">
        <label>CRZ FL</label>${box(`<small>FL</small> ${FL(it.crzFl)}`)}
        <label>MODE</label>${box('ECON')}
        <label>CI</label>${box(it.ci ?? '---', 'n')}
        <label>TRIP WIND</label>${box(esc(it.tripWind || '-----'))}
      </div>
      <div class="in-g">
        <label>CRZ TEMP</label>${box(`${temp(it.crzTemp)} <small>°C</small>`)}
        <label>TROPO</label>${box(`${it.tropo} <small>FT</small>`, it.tropoSrc === 'ISA' ? 'dflt' : '')}
      </div>
    </div>
  </div>
  <div class="fm-legend note"><span class="fm-box mini">파란 사각형</span> FMS에 입력하는 값 · TROPO ${it.tropoSrc === 'ISA' ? `<b>${it.tropo} FT는 OFP에 값이 없어 ISA 기본값</b>(흐린 글씨)` : 'OFP 값'}</div>
  </div>`;

  // 참고
  const ref = [];
  if (it.steps.length) ref.push(['순항 고도', `첫 순항 <b>FL${FL(it.crzFl)}</b> · 최고 FL${FL(it.maxFl)}<br>${it.steps.map(s => `FL${FL(s.fl)} <span class="note">${esc(s.at)} ${T(s.cum)}</span>`).join(' → ')}`]);
  if (it.fplInit) ref.push(['FPL 15항', `첫 속도·고도 ${esc(it.fplInit.spd)} ${esc(it.fplInit.lvl)}${/^[SM]/.test(it.fplInit.lvl) ? ' (미터 고도)' : ''}`]);
  if (it.src.wind) ref.push(['AVG WIND/TEMP', `${esc(it.src.wind)} → TRIP WIND ${esc(it.tripWind)} (M=맞바람 HD, P=뒷바람 TL) · CRZ TEMP ${temp(it.crzTemp)}°C (OFP 평균 온도)`]);
  if (it.src.speed) ref.push(['SPEED SKD', esc(it.src.speed)]);
  if (it.altnRoute) ref.push(['ALTN 경로', `${esc(it.altnRoute)} <span class="note">— FMS 회사 교체 항로가 없으면 ALTN RTE SEL 또는 수동 입력</span>`]);
  h += `<div class="grp">참고 <span class="ln"></span></div><div class="panel"><dl class="meta fu-ref">${ref.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl></div>`;
  if (it.src.head) h += `<details class="panel"><summary class="orig-lbl" style="cursor:pointer">OFP 머리 원문</summary><pre class="rc-src" style="white-space:pre">${esc([it.src.release, it.src.head, it.src.speed].filter(Boolean).join('\n'))}</pre></details>`;
  h += `<p class="note">FMS 화면 배치를 흉내 낸 참고값입니다. 입력 전 OFP 원문과 대조하세요. CPNY RTE는 OFP 노선코드이며, FMS에 저장된 회사 항로 이름과 같은지 확인하세요.</p>`;
  return h;
}
