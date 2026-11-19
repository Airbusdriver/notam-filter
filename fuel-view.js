// fuel-view.js — "FUEL & LOAD" 탭 화면 (A350 FMS ACTIVE/FUEL&LOAD 배치)
import { esc } from './interp.js';
import { fmsPage, checkFuel } from './fuel.js';

const W = x => (x == null || Number.isNaN(x) ? '---.-' : (x / 10).toFixed(1));
const T = m => (m == null ? '--:--' : `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
const Z = t => { if (t == null) return '--:--'; const d = new Date(t); return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`; };
const sign = x => (x > 0 ? '+' : x < 0 ? '−' : '±') + W(Math.abs(x));

// 입력칸(파란 글씨·사각형) / 계산값(초록)
const box = (v, cls = '') => `<span class="fm-box ${cls}">${v}</span>`;
const grn = (v, cls = '') => `<span class="fm-g ${cls}">${v}</span>`;

export function renderFuel(fu, ofp, ctx) {
  if (!fu || !fu.ok) return `${(fu?.warnings || ['OFP 연료 요약을 찾지 못했습니다.']).map(w => `<div class="warn">${esc(w)}</div>`).join('')}`;
  const P = fmsPage(fu, ofp, {}, ctx), K = checkFuel(fu, P);
  const U = fu.unit === 'KG' ? 'T (×1000 KG)' : '×1000 LB';
  const bad = K.sums.filter(x => !x.ok).length, over = K.limits.filter(x => !x.ok).length;
  let h = fu.warnings.map(w => `<div class="warn">${esc(w)}</div>`).join('');
  h += `<div class="rc-sum ${bad || over ? 'bad' : 'ok'}">${over ? `무게 제한 초과 ${over}건` : bad ? `OFP 연료 합계 불일치 ${bad}건` : 'OFP 연료·무게 합계 일치'}
    <span class="note">단위 ${U} · OFP ${esc(fu.unitBase + fu.unit + 'S')} · FMS 초기 셋업용 OFP 계획값</span></div>`;

  // ---------- FMS 페이지 ----------
  const pct = P.rsvPct == null ? '--.-' : P.rsvPct.toFixed(1);
  h += `<div class="fm-wrap"><div class="fm">
    <div class="fm-title">ACTIVE/FUEL&amp;LOAD</div>
    <div class="fm-r3"><span>GW</span>${grn('---.-')}<span>CG</span>${grn('--.-%')}<span>FOB</span>${grn('---.-')}</div>
    <div class="fm-grid">
      <label>ZFW</label>${box(W(P.zfw), 'w')}<label>ZFWCG</label>${box('--.-<small>%</small>')}
      <label>BLOCK</label>${box(W(P.block), 'w')}<span></span><span></span>
    </div>
    <hr>
    <div class="fm-two">
      <div class="fm-grid2">
        <label>TAXI</label>${box(W(P.taxi))}<span></span>
        <label>TRIP</label>${grn(W(P.trip))}${grn(T(P.tripMin))}
        <label>RTE RSV</label>${box(W(P.rsv))}${box(pct + '<small>%</small>', 'sm')}
        <label>ALTN</label>${box(W(P.altn))}${grn(T(P.altnMin))}
        <label>FINAL</label>${box(W(P.fin))}${box(T(P.finMin), 'sm')}
      </div>
      <div class="fm-grid3">
        <label>PAX NBR</label>${box(P.pax ?? '---', 'n')}
        <label>MODE</label>${box('ECON', 'n')}
        <label>CI</label>${box(P.ci ?? '---', 'n')}
        <label>TOW</label>${grn(W(P.tow))}
        <label>LW</label>${grn(W(P.lw))}
      </div>
    </div>
    <hr>
    <div class="fm-two">
      <table class="fm-t"><tr><th></th><th></th><th>UTC</th><th>EFOB</th></tr>
        <tr><th>DEST</th><td>${esc(P.dest || '----')}</td><td>${Z(P.destUtc)}</td><td>${W(P.efobDest)}</td></tr>
        <tr><th>ALTN</th><td>${esc(P.altnIcao || '----')}</td><td>${Z(P.altnUtc)}</td><td>${W(P.efobAltn)}</td></tr></table>
      <div class="fm-min"><div>MIN FUEL AT DEST</div>${box(W(P.minDest), 'w')}<div>EXTRA</div><div>${grn(W(P.extra), P.extra < 0 ? 'neg' : '')} ${grn(P.extraMin != null ? T(P.extraMin) : '', 'sm')}</div></div>
    </div>
  </div>
  <div class="fm-legend note"><span class="fm-box mini">파란 사각형</span> FMS에 입력하는 값 · <b class="fm-lg">초록</b> FMS가 계산해 보여줄 값(대조용) · ZFWCG는 로드시트 값으로 입력</div>
  </div>`;

  // ---------- 무게 제한 ----------
  h += `<div class="grp">무게 제한 <span class="ln"></span></div><div class="panel rc-wrap"><table class="rc-t"><thead><tr><th>항목</th><th>값</th><th>제한</th><th>여유</th></tr></thead><tbody>`;
  for (const l of K.limits) h += `<tr class="${l.ok ? '' : 'st-bad'}"><th>${esc(l.label)}</th><td class="mono">${W(l.val)}</td><td class="mono">${W(l.max)}</td><td class="mono">${l.ok ? W(l.margin) : '초과 ' + W(-l.margin)}</td></tr>`;
  h += `</tbody></table></div>`;

  // ---------- OFP 합계 검증 ----------
  h += `<div class="grp">OFP 연료 합계 검증 <span class="ln"></span></div><div class="panel rc-wrap"><table class="rc-t"><thead><tr><th>항목</th><th>OFP</th><th>계산</th><th>식</th><th></th></tr></thead><tbody>`;
  for (const c of K.sums) h += `<tr class="${c.ok ? '' : 'st-bad'}"><th>${esc(c.label)}</th><td class="mono">${W(c.a)}</td><td class="mono">${W(c.b)}</td><td class="note">${esc(c.how)}</td><td>${c.ok ? '✓' : '✗ ' + sign(c.d)}</td></tr>`;
  h += `</tbody></table></div>`;

  // ---------- 참고 ----------
  const ref = [];
  ref.push(['연료 구성', `TRIP ${W(fu.trip?.f)} (${T(fu.trip?.t)}) · CONT ${fu.cont?.pct != null ? fu.cont.pct + '% ' : ''}${W(fu.cont?.f)} (${T(fu.cont?.t)}) · ALTN ${esc(fu.altn?.icao || '')} ${W(fu.altn?.f)} (${T(fu.altn?.t)}) · FINAL ${W(fu.final?.f)} (${T(fu.final?.t)}) · DISC ${W(fu.disc?.f)} (${T(fu.disc?.t)})${fu.tank?.f ? ` · TANKERING ${W(fu.tank.f)}` : ''} · TAXI ${W(fu.taxi?.f)}`]);
  if (P.rsvPct != null && fu.cont?.pct != null && Math.abs(P.rsvPct - fu.cont.pct) > 0.6) ref.push(['RTE RSV', `OFP 표기는 ${fu.cont.pct} PCT CONT지만 값 ${W(fu.cont.f)}는 TRIP의 ${P.rsvPct.toFixed(1)}%입니다${fu.refile ? ` (REFILE: 결심점 ${esc(fu.refile.point)} 이후 ${esc(fu.refile.point)}→${esc(fu.refile.dest)} 구간 기준 CONT)` : ''}. FMS에는 값 ${W(fu.cont.f)}을 입력하면 %는 자동 계산됩니다.`]);
  if (fu.refile) { const r = fu.refile; ref.push(['REFILE', `${esc(r.dep)}→${esc(r.refDest)} 계획, 결심점 <b>${esc(r.point)}</b>에서 ${esc(r.dest)}로 재계획. ${esc(r.point)} 통과 시 필요 연료 <b>${W(r.rqdAtPoint)}</b> · 계획 잔량 ${W(r.planAtPoint)}${r.planAtPoint != null && r.rqdAtPoint != null ? ` (여유 ${W(r.planAtPoint - r.rqdAtPoint)})` : ''} · ${esc(r.refDest)}까지 RQRD ${W(r.rqdToRef)} (CONT ${W(r.contRef)})`]); }
  if (fu.ccf) ref.push(['CCF', `${fu.ccf.v.toLocaleString()} LBS ${esc(fu.ccf.note.replace(/INCLUDED IN (\w+)/, '$1에 포함'))}`]);
  if (fu.discWhy.length) ref.push(['DISC 사유', fu.discWhy.map(esc).join(' · ')]);
  if (fu.ci != null || fu.speedSkd) ref.push(['CI·속도', `CI ${fu.ci ?? '—'} · ${esc(fu.speedSkd || '')}${fu.perfFactor ? ` · PERF FACTOR ${esc(fu.perfFactor)}%` : ''}`]);
  if (fu.pax) ref.push(['PAX NBR', `<b>${fu.pax.total}</b> = ${fu.pax.cls.map(c => `${c.c} ${c.n}`).join(' + ')} <span class="note">(${esc(fu.pax.line)})</span>`]);
  if (fu.payload) ref.push(['PAYLOAD', `PAX ${fu.payload.pax.toLocaleString()} · CARGO ${fu.payload.cargo.toLocaleString()} ${esc(fu.payload.u)} · PLD ${W(fu.w.pld)} · SOW ${W(fu.w.sow)}`]);
  if (fu.stat) ref.push(['노선 통계', `TRIP 실제−계획: 평균 ${fu.stat.mean.toLocaleString()} · 90% ${fu.stat.p90.toLocaleString()} · 99% ${fu.stat.p99.toLocaleString()} LBS`]);
  h += `<div class="grp">참고 <span class="ln"></span></div><div class="panel"><dl class="meta fu-ref">${ref.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl></div>`;

  h += `<details class="panel"><summary class="orig-lbl" style="cursor:pointer">OFP 연료 요약 원문</summary><pre class="rc-src" style="white-space:pre">${esc((fu.head || []).join('\n'))}</pre></details>`;
  h += `<p class="note">FMS 화면 배치를 흉내 낸 참고값입니다. 입력 전 OFP 원문과 대조하세요. DEST UTC는 OFP ETD(출발시각 변경 설정 반영) + 비행시간입니다.</p>`;
  return h;
}
