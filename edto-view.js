// edto-view.js — "EDTO" 탭 화면: EEP / ETP / EXP 좌표, ETP 임계연료, EDTO 교체공항
import { esc } from './interp.js';
import { llOfp, llFms, fmtHM, fmtN } from './edto.js';

const MIN = 60000;
const Z = t => { if (t == null || !isFinite(t)) return '----'; const d = new Date(t); return `${String(d.getUTCHours()).padStart(2, '0')}${String(d.getUTCMinutes()).padStart(2, '0')}`; };
const ofpT = s => { const m = /^(\d{2})\.(\d{2})$/.exec(s || ''); return m ? +m[1] * 60 + +m[2] : null; };
const KIND = { EEP: 'EDTO 진입점', ETP: '등시간점', EXP: 'EDTO 이탈점' };

// "1423" → ETD 기준 절대시각 (자정 넘김 처리)
function absZ(hhmm, etd, after) {
  const d = new Date(etd); const base = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  let t = base + (+hhmm.slice(0, 2) * 60 + +hhmm.slice(2)) * MIN;
  const ref = after ?? etd - 6 * 60 * MIN;
  while (t < ref) t += 1440 * MIN;
  return t;
}

export function renderEdto(E, ctx, notams = []) {
  if (!E || !E.isEdto) return `<div class="warn">EDTO 비행이 아닙니다 (OFP 머리에 EDTO 표시 없음).</div>`;
  if (!E.ok) return (E.warnings.length ? E.warnings : ['EDTO 데이터를 찾지 못했습니다.']).map(w => `<div class="warn">${esc(w)}</div>`).join('');
  const U = E.unit, eto = cum => ctx.eto(cum);
  const win = {}; // 적합 시간대(절대시각)
  for (const s of E.suit) { const f = absZ(s.from, ctx.etd); win[s.icao] = [f, absZ(s.to, ctx.etd, f)]; }

  // ETP 회항 도착 예상 (결정 시나리오 열 기준) → 적합 시간대 안인지
  for (const e of E.etps) {
    e.arr = [];
    if (!e.pt) continue;
    const t0 = eto(e.pt.cum);
    for (const ap of [e.a1, e.a2]) {
      const sc = (e.scens || []).find(x => x.apt === ap && x.cond === e.scen) || null;
      const t = sc ? ofpT(sc.t) : ap === e.critApt ? e.tAlt : null;
      if (t == null) continue;
      const at = t0 + t * MIN, w = win[ap];
      e.arr.push({ ap, t, at, sc, w, ok: w ? at >= w[0] && at <= w[1] : null, margin: w ? Math.round((w[1] - at) / MIN) : null });
    }
  }
  const bad = E.checks.filter(c => c.st === 'bad').length + E.etps.flatMap(e => e.arr).filter(a => a.ok === false).length;
  const chk = E.checks.filter(c => c.st === 'chk').length + E.warnings.length;
  const crit = E.etps.find(e => e.n === E.critical);

  let h = E.warnings.map(w => `<div class="warn">${esc(w)}</div>`).join('');
  h += `<div class="rc-sum ${bad ? 'bad' : chk ? 'chk' : 'ok'}">EDTO${E.ruleMin ? ` ${E.ruleMin}분` : ''} · EEP/ETP/EXP ${E.points.length}개 · 교체공항 ${E.alts.length}곳
    ${crit ? `<span>최소 여유 ETP${crit.n} · EXC ${fmtN(crit.exc)} ${U}</span>` : ''}
    <span class="note">${bad ? `불일치 ${bad}건 · ` : chk ? `확인 ${chk}건 · ` : ''}ETD ${Z(ctx.etd)}Z 기준</span></div>`;

  // ---------- 지점 표 ----------
  h += `<div class="grp">EDTO 지점 — FMS 입력·대조용 <span class="ln"></span></div>
  <div class="panel rc-wrap"><table class="rc-t ed-t"><thead><tr>
    <th>지점</th><th>좌표 (OFP)</th><th>FMS LAT/LONG</th><th>ETO</th><th>FL</th><th>거리 누적 / 잔여</th><th>EFOB</th><th>관련 공항</th></tr></thead><tbody>`;
  for (const p of E.points) {
    const e = p.etp;
    const apt = p.kind === 'ETP' && e ? `${esc(e.a1)} / ${esc(e.a2)}` : p.apt ? `${esc(p.apt)} <span class="note">${p.kind === 'EEP' ? 'Entry' : 'Exit'}</span>` : '';
    h += `<tr class="ed-${p.kind.toLowerCase()}${e && e.n === E.critical ? ' st-chk' : ''}">
      <td><b class="ed-nm">${esc(p.name)}</b><div class="note">${KIND[p.kind]}${e && e.n === E.critical ? ' · <b>최소 여유</b>' : ''}</div></td>
      <td class="mono">${esc(llOfp(p.lat, p.lon))}</td>
      <td class="mono ed-ll">${esc(llFms(p.lat, p.lon))}</td>
      <td class="mono"><b>${Z(eto(p.cum))}Z</b><div class="note">+${fmtHM(p.cum)}</div></td>
      <td class="mono">${p.fl != null ? String(p.fl).padStart(3, '0') : ''}</td>
      <td class="mono">${fmtN(p.dist)}${E.totalDist ? ` / ${fmtN(E.totalDist - p.dist)}` : ''} NM${p.legNm ? `<div class="note">직전 지점부터 ${fmtN(p.legNm)} NM · ${fmtHM(p.legMin)}</div>` : ''}</td>
      <td class="mono">${(p.rf / 10).toFixed(1)}<div class="note">×${E.unitBase * 10} ${U}</div></td>
      <td>${apt}</td></tr>`;
  }
  h += `</tbody></table></div>
  <p class="note">FMS LAT/LONG은 Airbus 위경도 입력 형식(DDMM.MN/DDDMM.ME)으로 바꾼 값입니다. 입력 후 F-PLN의 거리·시각을 OFP와 대조하세요. EFOB는 OFP 계획 잔여연료(R/F)입니다.</p>`;

  // ---------- 시간축 ----------
  h += timeline(E, ctx, win);

  // ---------- ETP 상세 ----------
  h += `<div class="grp">ETP 임계연료 (CFR) <span class="ln"></span>${E.etps.length}</div>`;
  for (const e of E.etps) {
    const isC = e.n === E.critical, low = e.exc != null && e.exc < 0;
    h += `<div class="panel ed-etp${isC ? ' ed-crit' : ''}">
      <div class="ed-hd"><b class="ed-nm">ETP${e.n}</b> <span class="ed-pair">${esc(e.a1)} / ${esc(e.a2)}</span>
        ${isC ? '<span class="chip ed-cchip">MOST CRITICAL</span>' : ''}
        ${e.pt ? `<span class="note">${esc(llOfp(e.pt.lat, e.pt.lon))} · ${Z(eto(e.pt.cum))}Z (+${fmtHM(e.pt.cum)})</span>` : ''}</div>
      <div class="ed-kv">
        <div><span>결정 시나리오</span><b>${esc(e.scen || '—')}${e.critApt ? ` → ${esc(e.critApt)}` : ''}</b></div>
        <div><span>CFR</span><b>${fmtN(e.cfr)}</b> <small>${U}</small></div>
        <div><span>FOB (ETP)</span><b>${fmtN(e.fob)}</b> <small>${U}</small></div>
        <div><span>여유 EXC</span><b class="${low ? 'ed-bad' : 'ed-ok'}">${low ? '−' : '+'}${fmtN(Math.abs(e.exc))}</b> <small>${U}</small></div>
        <div><span>회항거리 G/C</span><b>${fmtN(e.d1)} / ${fmtN(e.d2)}</b> <small>NM</small></div>
        <div><span>평균 W/C</span><b>${esc(e.wc1 || '')} / ${esc(e.wc2 || '')}</b></div>
        <div><span>회항시간 (결정)</span><b>${fmtHM(e.tAlt)}</b></div>
        ${e.gwt ? `<div><span>회항 시 GW</span><b>${fmtN(e.gwt)}</b> <small>${U}</small></div>` : ''}
      </div>`;
    if (e.arr.length) {
      h += `<table class="rc-t ed-arr"><thead><tr><th>회항 공항</th><th>회항시간 (${esc(e.scen || '')})</th><th>도착 예상</th><th>적합 시간대</th><th></th></tr></thead><tbody>`;
      for (const a of e.arr) h += `<tr${a.ok === false ? ' class="st-bad"' : ''}><td><b>${esc(a.ap)}</b>${a.ap === e.critApt ? ' <span class="note">CFR 기준</span>' : ''}</td>
        <td class="mono">${fmtHM(a.t)}</td><td class="mono"><b>${Z(a.at)}Z</b></td>
        <td class="mono">${a.w ? `${Z(a.w[0])}–${Z(a.w[1])}Z` : '<span class="note">OFP에 없음</span>'}</td>
        <td>${a.ok == null ? '' : a.ok ? `<span class="ed-ok">✓</span> <span class="note">종료까지 ${fmtHM(a.margin)}</span>` : '<span class="ed-bad">✗ 시간대 밖</span>'}</td></tr>`;
      h += `</tbody></table>`;
    }
    if (e.scens) {
      h += `<details><summary class="orig-lbl" style="cursor:pointer">시나리오별 연료·시간 (CRITICAL FUEL REQUIRED CALCULATION)</summary>
      <div class="rc-wrap"><table class="rc-t ed-sc"><thead><tr><th>공항</th><th>조건</th><th>SPD</th><th>FL</th><th>W/C</th><th>시간</th><th>연료 (${U})</th></tr></thead><tbody>`;
      const mx = Math.max(...e.scens.map(s => s.tot || 0));
      for (const s of e.scens) h += `<tr${s.tot === mx ? ' class="st-chk"' : ''}><td>${esc(s.apt)}</td><td>${esc(s.cond)}</td><td class="mono">${esc(s.spd || '')}</td><td class="mono">${esc(s.fl || '')}</td><td class="mono">${esc(s.wc || '')}</td><td class="mono">${esc((s.t || '').replace('.', ':'))}</td><td class="mono">${fmtN(s.tot)}</td></tr>`;
      h += `</tbody></table></div></details>`;
    }
    h += `</div>`;
  }

  // ---------- 교체공항 ----------
  const cnt = icao => { const c = { relevant: 0, review: 0, excluded: 0 }; for (const n of notams) if ((n.sect === 'EDTO' || n.sect === 'ETOPS') && n.sectIcao === icao) c[n.a.status]++; return c; };
  h += `<div class="grp">EDTO 교체공항 <span class="ln"></span>${E.alts.length}</div>
  <div class="panel rc-wrap"><table class="rc-t ed-t"><thead><tr><th>공항</th><th>적합 시간대 (UTC)</th><th>사용 ETP</th><th>최장 활주로</th><th>회사 무선</th><th>NOTAM</th></tr></thead><tbody>`;
  for (const a of E.alts) {
    const c = cnt(a.icao), w = win[a.icao], rw = a.rwys[0];
    h += `<tr><td><b class="ed-nm">${esc(a.icao)}</b>${a.iata ? ` <span class="note">${esc(a.iata)}</span>` : ''}<div class="note">${esc(a.name || '')}</div></td>
      <td class="mono">${w ? `<b>${Z(w[0])}–${Z(w[1])}</b>` : '<span class="note">—</span>'}</td>
      <td>${a.etps.map(n => `ETP${n}`).join(', ') || '<span class="note">—</span>'}</td>
      <td class="mono">${rw ? `${esc(rw.id)}<div class="note">${fmtN(rw.len)} × ${rw.wid} FT${a.rwys.length > 1 ? ` · 외 ${a.rwys.length - 1}개` : ''}</div>` : '<span class="note">—</span>'}</td>
      <td class="note">${esc(a.radio || '')}</td>
      <td>${c.relevant + c.review + c.excluded ? `<span class="count c-rel">관련 ${c.relevant}</span>${c.review ? ` <span class="count c-rev">검토 ${c.review}</span>` : ''}${c.excluded ? ` <span class="count c-exc">제외 ${c.excluded}</span>` : ''}` : '<span class="note">없음</span>'}</td></tr>`;
  }
  h += `</tbody></table></div>
  <p class="note">교체공항 NOTAM 원문·해석은 <b>REFILE·ERA</b> 탭의 EDTO 공항 묶음에서 볼 수 있습니다.${E.era.length ? ` · ERA: ${esc(E.era.join(' '))}` : ''}${E.ralt.length ? ` · ATS FPL RALT/${esc(E.ralt.join(' '))}` : ''}</p>`;

  // ---------- 대조 / 노트 ----------
  if (E.checks.length) h += `<div class="grp">OFP 내부 대조 <span class="ln"></span></div><div class="panel">${E.checks.map(c => `<div class="ed-chk ck-${c.st}">${c.st === 'ok' ? '✓' : c.st === 'bad' ? '✗' : '!'} ${esc(c.msg)}</div>`).join('')}</div>`;
  if (E.notes.length) h += `<div class="grp">디스패치 노트 <span class="ln"></span></div><div class="panel">${E.notes.map(t => `<div class="mel-note">${esc(t)}</div>`).join('')}</div>`;
  const raw = [E.raw.summary, ...E.etps.map(e => e.det), ...E.points.map(p => p.src)].filter(Boolean).join('\n\n');
  h += `<details class="panel"><summary class="orig-lbl" style="cursor:pointer">OFP 원문 (EDTO EQUAL TIME POINT DATA · ETP 상세 · navlog)</summary><pre class="rc-src" style="white-space:pre-wrap">${esc(raw)}</pre></details>`;
  h += `<p class="note">OFP 디스패치 시점의 계획값입니다. 교체공항 기상·NOTAM과 EDTO 차트(Aviator)는 따로 확인하세요. 회항 도착 예상 = ETP 통과 예정 + 결정 시나리오 회항시간(대기 제외).</p>`;
  return h;
}

// 시간축: 비행(ETD→ETA)과 EEP/ETP/EXP, 교체공항 적합 시간대
function timeline(E, ctx, win) {
  const ws = Object.values(win);
  if (!E.points.length) return '';
  const t0 = Math.min(ctx.etd, ...ws.map(w => w[0])), t1 = Math.max(ctx.eta, ...ws.map(w => w[1]));
  const span = t1 - t0 || 1, X = t => `${(((t - t0) / span) * 100).toFixed(2)}%`;
  const W = (a, b) => `left:${X(a)};width:${(((b - a) / span) * 100).toFixed(2)}%`;
  const eep = E.points.find(p => p.kind === 'EEP'), exp = [...E.points].reverse().find(p => p.kind === 'EXP');
  let h = `<div class="grp">시간축 <span class="ln"></span></div><div class="panel ed-tl">`;
  // 시각 눈금 (매 정시 2시간)
  const ticks = []; { const d = new Date(t0); let t = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours() + 1); for (; t < t1; t += 2 * 3600000) ticks.push(t); }
  h += `<div class="ed-row ed-ax"><span class="ed-lb"></span><div class="ed-tr">${ticks.map(t => `<i style="left:${X(t)}">${Z(t)}</i>`).join('')}</div></div>`;
  h += `<div class="ed-row"><span class="ed-lb">${esc((ctx.ofp?.dep || '') + '→' + (ctx.ofp?.dest || ''))}</span><div class="ed-tr">
    <div class="ed-fl" style="${W(ctx.etd, ctx.eta)}"></div>
    ${eep && exp ? `<div class="ed-seg" style="${W(ctx.eto(eep.cum), ctx.eto(exp.cum))}"></div>` : ''}
    ${E.points.map(p => `<b class="ed-mk ed-mk-${p.kind.toLowerCase()}" style="left:${X(ctx.eto(p.cum))}"><em>${esc(p.name)}</em></b>`).join('')}
  </div></div>`;
  for (const a of E.alts) {
    const w = win[a.icao];
    const arr = E.etps.flatMap(e => (e.arr || []).filter(x => x.ap === a.icao).map(x => ({ ...x, n: e.n })));
    h += `<div class="ed-row"><span class="ed-lb">${esc(a.icao)}</span><div class="ed-tr">
      ${w ? `<div class="ed-win" style="${W(w[0], w[1])}"><span>${Z(w[0])}–${Z(w[1])}</span></div>` : ''}
      ${arr.map(x => `<b class="ed-arrmk${x.ok === false ? ' bad' : ''}" style="left:${X(x.at)}" title="ETP${x.n} 회항 도착 ${Z(x.at)}Z"><em>E${x.n}</em></b>`).join('')}
    </div></div>`;
  }
  h += `<p class="note" style="margin:8px 0 0">굵은 막대: 비행 · 진한 구간: EEP–EXP · 초록 막대: 공항 적합 시간대 · ◆E1: ETP1에서 회항 시 도착 예상</p></div>`;
  return h;
}
