// sr-view.js — "SR" 탭 화면: SR(Shear Rate) 기준 이상 구간과 최대 SR 지점
import { esc } from './interp.js';
import { SR_LIMIT } from './sr.js';

const Z = t => { if (t == null || !isFinite(t)) return '----'; const d = new Date(t); return `${String(d.getUTCHours()).padStart(2, '0')}${String(d.getUTCMinutes()).padStart(2, '0')}`; };
const HM = m => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
const lvl = l => l.fl != null ? `FL${String(l.fl).padStart(3, '0')}` : esc(l.phase || '');
const srCls = v => v == null ? '' : v >= SR_LIMIT ? ' sr-hi' : '';

export function renderSr(S, ctx) {
  if (!S || !S.ok) return (S?.warnings?.length ? S.warnings : ['SR 값을 찾지 못했습니다.']).map(w => `<div class="warn">${esc(w)}</div>`).join('');
  const eto = cum => ctx?.eto ? Z(ctx.eto(cum)) : '----';
  let h = S.warnings.map(w => `<div class="warn">${esc(w)}</div>`).join('');
  const n = S.segs.length;
  h += `<div class="rc-sum ${n ? 'chk' : 'ok'}">${n ? `SR ${SR_LIMIT} 이상 ${n}구간` : `SR ${SR_LIMIT} 이상 구간 없음`} · 최대 SR ${S.max}
    <span class="note">ETO는 ${ctx?.etd != null ? `ETD ${Z(ctx.etd)}Z` : 'ETD'} 기준</span></div>`;

  // 최대 SR 지점
  h += `<div class="grp">최대 SR <span class="ln"></span></div><div class="panel"><table class="rc-t sr-t"><thead><tr>
    <th>구간 (이전 → 지점)</th><th>SR</th><th>고도</th><th>WIND/COMP</th><th>ETO</th></tr></thead><tbody>`;
  for (const l of S.maxLegs) h += `<tr><td><span class="note">${esc(l.from || '출발')} →</span> <b class="sr-pt">${esc(l.to)}</b></td>
    <td class="sr-v sr-hi">${l.sr}</td><td>${lvl(l)}</td><td class="sr-w">${esc(l.wind)}</td><td>${eto(l.cum)}Z</td></tr>`;
  h += `</tbody></table></div>`;

  // SR ≥ 기준 구간
  if (n) {
    h += `<div class="grp">SR ${SR_LIMIT} 이상 구간 <span class="ln"></span></div><div class="panel"><table class="rc-t sr-t"><thead><tr>
      <th>구간</th><th>SR (지점별)</th><th>고도</th><th>거리</th><th>ETO</th></tr></thead><tbody>`;
    for (const s of S.segs) {
      h += `<tr><td><b class="sr-pt">${esc(s.from || '출발')}</b> → <b class="sr-pt">${esc(s.to)}</b></td>
        <td>${s.legs.map(l => `<span class="sr-leg">${esc(l.to)} <b class="sr-v${srCls(l.sr)}">${l.sr}</b></span>`).join(' ')}</td>
        <td>${s.fls.map(x => typeof x === 'number' ? `FL${String(x).padStart(3, '0')}` : esc(x)).join(' → ')}</td>
        <td>${s.dist}NM</td><td>${eto(s.cumFrom)}–${eto(s.cumTo)}Z</td></tr>`;
    }
    h += `</tbody></table></div>`;
  }

  // 전체 SR 프로필
  h += `<details class="panel"><summary class="orig-lbl" style="cursor:pointer">전체 구간 SR (${S.legs.length}구간)</summary>
    <table class="rc-t sr-t"><thead><tr><th>구간</th><th>SR</th><th>고도</th><th>WIND/COMP</th><th>경과</th><th>ETO</th></tr></thead><tbody>`;
  for (const l of S.legs) h += `<tr${l.sr != null && l.sr >= SR_LIMIT ? ' class="st-chk"' : ''}><td><span class="note">${esc(l.from || '출발')} →</span> ${esc(l.to)}</td>
    <td class="sr-v${srCls(l.sr)}">${l.sr ?? '··'}</td><td>${lvl(l)}</td><td class="sr-w">${esc(l.wind)}</td><td>${HM(l.cum)}</td><td>${eto(l.cum)}Z</td></tr>`;
  h += `</tbody></table></details>`;
  h += `<p class="note">SR(Shear Rate)은 OFP navlog의 SR 열 값입니다. navlog 각 줄의 값은 '이전 지점 → 해당 지점' 구간 값이며, 상승·강하 구간(..)은 OFP에 값이 없습니다. 실제 난기류 판단은 SIGWX·TURB 차트와 기상 정보로 확인하세요.</p>`;
  return h;
}
