// route-view.js — "항로 대조" 탭 화면
import { esc } from './interp.js';

const ST = { ok: ['일치', 'p-relevant'], abbr: ['일치(약식 표기)', 'p-relevant'], step: ['일치(항로 내 지점)', 'p-relevant'], chk: ['확인', 'p-review'], bad: ['불일치', 'p-bad'] };
const pill = k => `<span class="pill ${ST[k][1]}">${ST[k][0]}</span>`;

// 속도·고도 한 줄: "K0904S1100 → 904km/h (≈488kt) · 11,000m = FL361 (36,089ft)"
function slText(sl) {
  if (!sl) return '';
  return `<div class="rc-sl"><span class="rc-raw">${esc(sl.raw)}</span> ${esc(sl.spd.text)} · <b>${esc(sl.lvl?.text || '')}</b></div>`;
}
function pt(p, side) {
  if (!p) return '<span class="rc-none">—</span>';
  // 같은 항로 안 중간 지점은 비행 순서대로 위에 표시
  let h = '';
  for (const x of p.inners || []) h += `<div class="rc-inner"><span class="rc-via">${esc(x.via)}</span> <b class="rc-pt">${esc(x.id)}</b> <span class="note">항로 내 지점</span>${slText(x.sl)}</div>`;
  h += `<span class="rc-via">${esc(p.via)}</span> <b class="rc-pt">${esc(p.id)}</b>`;
  if (side === 'fpl') h += slText(p.sl);
  return h;
}

export function renderRouteCheck(rc) {
  if (!rc) return `<div class="empty">항로 대조 결과가 없습니다.</div>`;
  let h = '';
  for (const i of rc.issues) h += `<div class="warn">${esc(i.text)}</div>`;
  if (!rc.coStr || !rc.fplStr) return h;
  const nBad = rc.counts.bad, nChk = rc.counts.chk;
  h += `<div class="rc-sum ${nBad ? 'bad' : nChk ? 'chk' : 'ok'}">${nBad ? `불일치 ${nBad}곳` : nChk ? `일치 · 확인 필요 ${nChk}곳` : 'Company route와 ATS FPL 경로 일치'}
    <span class="note">지점 ${rc.rows.length}개 비교 · ATS FPL 사본 ${rc.fplCopies}개${rc.issues.some(i => i.kind === 'copies') ? ' (서로 다름)' : ' 동일'}</span></div>`;

  // 공항·절차
  h += `<div class="panel"><table class="rc-t rc-head"><thead><tr><th></th><th>Company route</th><th>ATS FPL</th><th>판정</th></tr></thead><tbody>`;
  for (const x of rc.head) h += `<tr class="st-${x.st}"><th>${x.label}</th><td>${esc(x.co || '—')}</td><td>${esc(x.fpl || '—')}</td><td>${pill(x.st)}</td></tr>`;
  if (rc.fpl.init) h += `<tr><th>초기 속도·고도</th><td class="rc-none">—</td><td colspan="2">${slText(rc.fpl.init)}</td></tr>`;
  h += `</tbody></table></div>`;

  // 경로
  h += `<div class="panel rc-wrap"><table class="rc-t rc-main"><thead><tr><th>#</th><th>Company route</th><th>ATS FPL</th><th>판정</th></tr></thead><tbody>`;
  rc.rows.forEach((r, i) => {
    const step = r.st === 'ok' && r.fpl && r.co && ((r.fpl.inners || []).length || (r.co.inners || []).length);
    const k = step ? 'step' : r.st;
    h += `<tr class="st-${r.st}"><td class="rc-n">${i + 1}</td><td>${pt(r.co, 'co')}</td><td>${pt(r.fpl, 'fpl')}</td><td>${pill(k)}${r.msg.length ? `<div class="rc-msg">${r.msg.map(esc).join('<br>')}</div>` : ''}</td></tr>`;
  });
  h += `</tbody></table></div>`;

  // 속도·고도 변경점
  if (rc.levels.length) {
    h += `<div class="grp">ATS FPL 속도·고도 변경 <span class="ln"></span></div>
    <div class="panel rc-wrap"><table class="rc-t"><thead><tr><th>지점</th><th>FPL 표기</th><th>속도</th><th>고도 (미터 → FL·ft)</th><th>navlog FL</th></tr></thead><tbody>`;
    for (const l of rc.levels) {
      const nv = l.noNav ? '<span class="rc-none">navlog에 지점 없음</span>'
        : l.nav == null ? '—'
        : `${l.navOk ? (l.exact ? '✓' : '≈') : '✗'} FL${String(l.nav).padStart(3, '0')}${l.direct ? '' : ` <span class="note">(${esc(l.navAt)}에서)</span>`}`;
      h += `<tr class="${l.navOk === false ? 'st-chk' : ''}"><td><b>${esc(l.at)}</b>${l.first ? ' <span class="note">초기</span>' : ''}</td><td class="rc-raw">${esc(l.sl.raw)}</td><td>${esc(l.sl.spd.text)}</td><td><b>${esc(l.sl.lvl?.text || '')}</b></td><td>${nv}</td></tr>`;
    }
    h += `</tbody></table>
    <p class="note" style="margin:8px 0 0">S/M 미터 고도는 METER/FEET CONVERSION TABLE(China/Mongolia) 값으로 표시합니다(표에 없는 값만 계산값). navlog FL은 그 지점 뒤 구간에서 처음 도달하는 순항 고도입니다(≈는 1 차이, 예: 한국 FL320 → 중국 9,800m).</p></div>`;
  }

  // 원문
  h += `<div class="grp">원문 <span class="ln"></span></div><div class="panel">
    <div class="orig-lbl">Company route</div><div class="rc-src">${esc(rc.coStr)}</div>
    <div class="orig-lbl" style="margin-top:10px">ATS FPL 15항</div><div class="rc-src">${esc(rc.fplStr)}</div></div>`;
  h += `<p class="note">판정 기준: 지점 이름(좌표는 39N160E·N39E160 등 표기 통일)과 각 지점으로 들어오는 항로를 비교합니다. FPL에만 있는 지점이라도 앞뒤가 같은 항로(예: W28 KEVOB W28)이면 step climb·descent 지점으로 보고 일치로 표시합니다. 항로 내부 경유 지점은 데이터베이스가 없어 navlog 순서로만 확인합니다.</p>`;
  return h;
}
