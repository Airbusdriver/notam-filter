// refile-view.js — "REFILE" 탭 화면: 결심점 연료 판단, NAR(VFR 수정값), 재계획 경로·공항
import { esc } from './interp.js';
import { pad } from './refile.js';

const MIN = 60000;
const Z = t => { if (t == null || !isFinite(t)) return '----'; const d = new Date(t); return `${String(d.getUTCHours()).padStart(2, '0')}${String(d.getUTCMinutes()).padStart(2, '0')}`; };
const HM = m => (m == null ? '' : `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
const N = v => (v == null || !isFinite(v) ? '' : Math.round(v).toLocaleString('en-US'));
const llOfp = (lat, lon) => { const f = (v, w, p, n) => { const a = Math.abs(v), d = Math.floor(a + 1e-9); return `${v < 0 ? n : p}${String(d).padStart(w, '0')} ${((a - d) * 60).toFixed(1).padStart(4, '0')}`; }; return `${f(lat, 2, 'N', 'S')} ${f(lon, 3, 'E', 'W')}`; };

export function renderRefile(r, ctx, notams = [], fobIn = '') {
  if (!r || !r.isRefile) return `<div class="warn">REFILE 비행이 아닙니다.</div>`;
  if (!r.ok) return (r.warnings.length ? r.warnings : ['REFILE 요약을 읽지 못했습니다.']).map(w => `<div class="warn">${esc(w)}</div>`).join('');
  const ub = r.unitBase, U = r.unit;
  const K = v => (v == null ? '' : (v * ub / 1000).toFixed(1));                    // ×1000 표시
  const Kup = v => (v == null ? '' : (Math.ceil(v * ub / 100 - 1e-9) / 10).toFixed(1)); // 요구량은 올림
  const real = v => (v == null ? null : v * ub);                                    // 실제 LBS/KG
  const P = r.point, D = r.dest, RD = r.refDest;
  const eto = r.pointMain ? ctx.eto(r.pointMain.cum) : null;
  const plan = r.rfPlan ?? r.pointMain?.rf ?? null;
  const rq = r.R.rqrd.f, nar = r.nar;

  let h = r.warnings.map(w => `<div class="warn">${esc(w)}</div>`).join('');
  const short = plan != null && plan < rq;
  h += `<div class="rc-sum ${short ? 'bad' : r.checks.some(c => c.st !== 'ok') ? 'chk' : 'ok'}">REFILE · 결심점 ${esc(P)}${eto ? ` ${Z(eto)}Z` : ''}
    <span>${esc(RD)} 계획 → ${esc(D)} 재계획</span>
    <span class="note">계획 잔량 ${K(plan)} ${short ? '<' : '≥'} RQRD ${K(rq)} · ×1000 ${U}</span></div>`;

  // ---------- 결심점 판단 ----------
  const fob = parseFloat(String(fobIn).replace(',', '.'));
  const fobOk = isFinite(fob) && fob > 0;
  const fobReal = fobOk ? fob * 1000 : null;
  const verdict = !fobOk ? '' : fobReal >= real(rq) ? `<div class="rf-v ok">RQRD 충족 — ${esc(D)} 계속 (교체 ${esc(r.R.altnApt || '')}) · 여유 ${(fob - real(rq) / 1000).toFixed(1)}</div>`
    : nar != null && fobReal >= real(nar) ? `<div class="rf-v chk">RQRD 미달 · NAR 요구량만 충족 (부족 ${(real(rq) / 1000 - fob).toFixed(1)}) — 교체공항 미지정 조건일 때만 ${esc(D)} 가능</div>`
    : `<div class="rf-v bad">RQRD·NAR 모두 미달 — ${esc(RD)} 착륙 계획 (부족 ${(real(nar ?? rq) / 1000 - fob).toFixed(1)})</div>`;
  h += `<div class="grp">결심점 ${esc(P)} — 필요 연료 <span class="ln"></span></div>
  <div class="panel rf-dec">
    <div class="rf-req">
      <div class="rf-c"><span>RQRD → ${esc(D)}</span><b>${K(rq)}</b><small>교체 ${esc(r.R.altnApt || '')} 지정 · ${N(real(rq))} ${U}</small></div>
      ${nar != null ? `<div class="rf-c rf-fix"><span>NAR → ${esc(D)} <i class="rf-chip">수정</i></span><b>${Kup(nar)}</b><small>VFR ${K(r.R.vfr.f)} + ½ FINAL ${(r.hold15 * ub / 1000).toFixed(2)} = ${(nar * ub / 1000).toFixed(2)} · ${N(real(nar))} ${U}</small></div>` : ''}
      <div class="rf-c rf-plan"><span>계획 잔량 (R/F)</span><b>${K(plan)}</b><small>RQRD ${plan >= rq ? '+' : '−'}${Math.abs((real(plan) - real(rq)) / 1000).toFixed(1)}${nar != null ? ` · NAR ${plan >= nar ? '+' : '−'}${Math.abs((real(plan) - real(nar)) / 1000).toFixed(1)}` : ''}</small></div>
    </div>
    <div class="rf-in"><label for="rfFob">${esc(P)} FOB 입력</label><input id="rfFob" type="number" inputmode="decimal" step="0.1" min="0" placeholder="예 ${K(plan)}" value="${esc(fobIn)}"><span class="note">×1000 ${U} (FMS FOB · ACARS 값)</span></div>
    <div id="rfVerdict">${verdict}</div>
    <p class="note" style="margin:8px 0 0">${eto ? `${esc(P)} 통과 예정 <b>${Z(eto)}Z</b> (+${HM(r.pointMain.cum)}) · 1시간 전 <b>${Z(eto - 60 * MIN)}Z</b>쯤 종합통제 ACARS(FOB 기준 REQD 충족 여부)와 교차 확인. ` : ''}값 단위 ×1000 ${U}, 요구량은 0.1 단위 올림.</p>
  </div>`;

  // ---------- OFP REFILE 요약 (두 열) ----------
  const row = (x, lbl, extra = '') => x ? `<tr${extra}><td>${esc(lbl ?? x.k)}</td><td class="mono">${pad(x.f)}</td><td class="mono"><b>${K(x.f)}</b></td><td class="mono">${HM(x.t)}</td><td class="mono">${x.d != null ? N(x.d) : ''}</td></tr>` : '';
  const head = `<thead><tr><th>항목</th><th>OFP</th><th>×1000</th><th>TIME</th><th>DIST</th></tr></thead>`;
  h += `<div class="grp">OFP REFILE 요약 <span class="ln"></span></div><div class="rf-cols">
  <div class="panel rc-wrap"><div class="rf-ch">${esc(r.dep)} → ${esc(RD)} <span class="note">재계획 공항까지 (원래 계획)</span></div>
    <table class="rc-t rf-t">${head}<tbody>
      ${r.left.map(x => row(x, null, x === r.L.rqrd ? ' class="rf-tot"' : '')).join('')}
    </tbody></table></div>
  <div class="panel rc-wrap"><div class="rf-ch">${esc(P)} → ${esc(D)} <span class="note">결심점에서 목적지까지</span></div>
    <table class="rc-t rf-t">${head}<tbody>
      ${r.right.filter(x => x !== r.R.vfr).map(x => row(x, null, x === r.R.rqrd ? ' class="rf-tot"' : '')).join('')}
      ${r.R.vfr ? `<tr class="rf-fixrow"><td>VFR <i class="rf-chip">수정</i><div class="note">NAR 요구량 ★</div></td>
        <td class="mono"><s>${pad(r.R.vfr.f)}</s><br><b>${pad(nar)}</b></td><td class="mono"><b>${Kup(nar)}</b></td>
        <td class="mono"><s>${HM(r.R.vfr.t)}</s><br>${HM(r.R.vfr.t + 15)}</td><td></td></tr>` : ''}
    </tbody></table>
    ${r.R.vfr ? `<div class="rf-rmk">★ <b>VFR 값 수정</b> — OFP의 VFR ${pad(r.R.vfr.f)}(=TRIP+FINAL+CONT)는 15분 체공 연료가 빠진 값입니다.
      NAR(교체공항 미지정) 요구량 = VFR ${pad(r.R.vfr.f)} + ½ FINAL RES (${pad(r.R.final.f)} × 50% = ${r.hold15}) = <b>${pad(nar)}</b> (${N(real(nar))} ${U}), 시간은 15분 더함.
      <span class="note">근거: FOM 제5장 (135) VFR · FLEET NOTICE "REFILE 비행계획상 연료계산 및 오독 가능성"</span></div>` : ''}
  </div></div>`;

  // ---------- 무게 ----------
  const wt = [];
  if (r.eldw != null) wt.push(`<div><span>${esc(RD)} 예상 착륙중량 ELDW</span><b>${K(r.eldw)}</b><small>MLDW ${K(r.mldw)} · 여유 ${K(r.mldw - r.eldw)}</small></div>`);
  if (r.overWt != null) wt.push(`<div><span>${esc(RD)} 착륙 시 초과중량</span><b class="${r.overWt ? 'ed-bad' : ''}">${K(r.overWt)}</b><small>${r.overWt ? '과중량 착륙' : '초과 없음'}</small></div>`);
  if (r.wtAtPoint != null) wt.push(`<div><span>${esc(P)} 통과 시 무게</span><b>${K(r.wtAtPoint)}</b><small>×1000 ${U}</small></div>`);
  if (wt.length) h += `<div class="panel ed-kv rf-wt">${wt.join('')}</div>`;

  // ---------- REFILE 경로 ----------
  if (r.wpts.length) {
    h += `<div class="grp">REFILE 경로 (${esc(P)} → ${esc(RD)}) <span class="ln"></span></div>
    <div class="panel rc-wrap"><div class="rc-src" style="margin-bottom:8px">RIF/${esc(r.rif.join(' '))}${r.altnRoute ? ` · 교체 경로 ${esc(r.altnRoute)}` : ''}</div>
    <table class="rc-t ed-t"><thead><tr><th>지점</th><th>좌표</th><th>FL</th><th>구간 NM</th><th>${esc(P)}부터</th><th>R/F</th></tr></thead><tbody>`;
    r.wpts.forEach((w, k) => {
      h += `<tr><td><b class="ed-nm">${esc(w.name)}</b>${w.full && w.full !== w.name ? `<div class="note">${esc(w.full)}</div>` : ''}</td>
        <td class="mono">${esc(llOfp(w.lat, w.lon))}</td><td class="mono">${esc(w.fl)}</td><td class="mono">${k ? N(w.leg) : ''}</td>
        <td class="mono">${k ? `+${HM(w.cum)}` : `${eto ? Z(eto) + 'Z' : ''}`}</td><td class="mono">${K(w.rf)}</td></tr>`;
    });
    h += `</tbody></table>`;
    if (r.refAltn) { const a = r.refAltn; h += `<p class="note" style="margin:8px 0 0">교체 ${esc(a.apt)}: ${N(a.dist)} NM · FL${esc(a.fl)} · W/C ${esc(a.wc)} · ${HM(a.t)} · ${N(a.fuel)} ${U}</p>`; }
    h += `</div>`;
  }

  // ---------- 재계획 공항 ----------
  const apts = Object.entries(r.airports);
  if (apts.length) {
    const cnt = icao => { const c = { relevant: 0, review: 0, excluded: 0 }; for (const n of notams) if (n.sect === 'REFILE' && n.sectIcao === icao) c[n.a.status]++; return c; };
    h += `<div class="grp">REFILE 공항 <span class="ln"></span></div><div class="panel rc-wrap"><table class="rc-t ed-t"><thead><tr><th>공항</th><th>역할</th><th>최장 활주로</th><th>회사 무선</th><th>NOTAM</th></tr></thead><tbody>`;
    for (const [icao, a] of apts) {
      const c = cnt(icao), rw = a.rwys[0];
      h += `<tr><td><b class="ed-nm">${esc(icao)}</b> <span class="note">${esc(a.iata || '')}</span><div class="note">${esc(a.name || '')}</div></td>
        <td>${icao === RD ? '재계획 목적지' : '재계획 교체'}</td>
        <td class="mono">${rw ? `${esc(rw.id)}<div class="note">${N(rw.len)} × ${rw.wid} FT</div>` : ''}</td>
        <td class="note">${esc(a.radio || '')}</td>
        <td>${c.relevant + c.review + c.excluded ? `<span class="count c-rel">관련 ${c.relevant}</span>${c.review ? ` <span class="count c-rev">검토 ${c.review}</span>` : ''}` : '<span class="note">없음</span>'}</td></tr>`;
    }
    h += `</tbody></table></div><p class="note">NOTAM 원문·해석은 <b>REFILE·ERA</b> 탭에 있습니다.</p>`;
  }

  if (r.checks.length) h += `<div class="grp">OFP 내부 대조 <span class="ln"></span></div><div class="panel">${r.checks.map(c => `<div class="ed-chk ck-${c.st}">${c.st === 'ok' ? '✓' : '!'} ${esc(c.msg)}</div>`).join('')}</div>`;
  h += `<details class="panel"><summary class="orig-lbl" style="cursor:pointer">OFP 원문 (REFILE FLT PLAN)</summary><pre class="rc-src" style="white-space:pre-wrap">${esc([r.raw, ...r.wpts.map(w => w.src)].join('\n'))}</pre></details>`;
  h += `<p class="note">OFP 디스패치 시점 계획값입니다. 결심점 판단은 실제 FOB, 기상·NOTAM, 종합통제 ACARS 전문과 함께 하세요.</p>`;
  return h;
}

