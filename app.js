import * as pdfjs from './pdf.min.mjs';
import { extractLines, prepare, evaluate, fmtZ, DEFAULTS, CORE_VERSION, cleanLines } from './core.js';
import { compareRoutes } from './route.js';
import { renderRouteCheck } from './route-view.js';
import { parseFuel } from './fuel.js';
import { renderFuel } from './fuel-view.js';
import { parseInit } from './init.js';
import { renderInit } from './init-view.js';
import { interpret, CAT_KO, esc, sectKo } from './interp.js';
import { decodeEN } from './decode.js';
import { literalKO } from './literal.js';
import { trStore } from './trfile.js';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('./pdf.worker.min.mjs', import.meta.url).href;
const APP_VERSION = '1.7.0';
const $ = s => document.querySelector(s);

/* ---------- 저장소 (실패해도 동작) ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
};
let settings = { ...DEFAULTS, ...store.get('nf.settings', {}) };
let state = { decOpen: store.get('nf.decOpen', true), lines: null, prep: null, name: '', R: null, tab: 'route', view: store.get('nf.view', 'both'), q: '', open: new Set() };

/* ---------- 오프라인 / 서비스워커 ---------- */
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('./sw.js').then(() => { $('#offline').textContent = '오프라인 사용 가능'; }).catch(() => {});
}
const updOnline = () => { if (!navigator.onLine) $('#offline').textContent = '오프라인'; };
addEventListener('online', updOnline); addEventListener('offline', updOnline); updOnline();
// 화면 모드: 자동(기기 설정) / 라이트 / 다크 / 야간(적색)
const THEME_BG = { light: '#f4f5f7', dark: '#0f1720', night: '#000000' };
function applyTheme(t) {
  const h = document.documentElement;
  h.classList.remove('light', 'dark', 'night');
  if (t !== 'auto') h.classList.add(t);
  const dark = t === 'dark' || t === 'night' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelector('meta[name="theme-color"]').content = t === 'auto' ? (dark ? THEME_BG.dark : THEME_BG.light) : THEME_BG[t];
}
let theme = store.get('nf.theme', store.get('nf.night', false) ? 'night' : 'auto');
applyTheme(theme);
$('#selTheme').value = theme;
$('#selTheme').onchange = e => { theme = e.target.value; store.set('nf.theme', theme); applyTheme(theme); };
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (theme === 'auto') applyTheme('auto'); });

/* ---------- 파일 열기 ---------- */
$('#btnOpen').onclick = () => $('#file').click();
$('#file').onchange = async e => {
  const files = [...e.target.files]; e.target.value = '';
  const json = files.filter(f => /\.json$/i.test(f.name)), pdfs = files.filter(f => !/\.json$/i.test(f.name));
  if (json.length) await importTranslations(json);
  if (pdfs.length) await loadFiles(pdfs);
};
const drop = $('#drop');
drop.addEventListener('dragover', e => { e.preventDefault(); });
drop.addEventListener('drop', e => { e.preventDefault(); const f = [...e.dataTransfer.files].filter(x => /pdf$/i.test(x.name)); if (f.length) loadFiles(f); });

const last = store.get('nf.last', null);
if (last && last.lines) { const b = $('#btnLast'); b.hidden = false; b.textContent = `마지막 OFP 다시 열기 (${last.name})`; b.onclick = () => { state.lines = last.lines; state.prep = null; state.name = last.name; analyzeAndRender(); }; }

async function loadFiles(files) {
  const st = $('#status'), pg = $('#prog'), bar = pg.querySelector('i');
  $('#result').hidden = true; drop.hidden = false; pg.hidden = false; bar.style.width = '0';
  const t0 = performance.now();
  try {
    let all = [];
    for (let k = 0; k < files.length; k++) {
      st.textContent = `${files[k].name} 읽는 중…`;
      const buf = new Uint8Array(await files[k].arrayBuffer());
      const lines = await extractLines(pdfjs, buf, (p, n) => { bar.style.width = `${Math.round(((k + p / n) / files.length) * 100)}%`; st.textContent = `${files[k].name} — ${p}/${n} 페이지`; });
      all = all.concat(lines.map(l => ({ t: l.t, p: l.p, f: k })));
    }
    // OFP가 먼저, NOTAM 패키지가 뒤에 오도록 파일 순서 정리
    const hasPkg = k => all.some(l => l.f === k && /^NOTAM PACKAGE \d/.test(l.t));
    if (files.length > 1) { const order = files.map((_, k) => k).sort((a, b) => hasPkg(a) - hasPkg(b)); all = order.flatMap(k => all.filter(l => l.f === k)); }
    state.lines = all.map(({ t, p }) => ({ t, p })); state.prep = null;
    state.name = files.map(f => f.name).join(' + ');
    if (!store.set('nf.last', { name: state.name, lines: state.lines, at: Date.now() })) console.warn('저장 공간 부족 — 마지막 OFP 저장 생략');
    state.readMs = Math.round(performance.now() - t0);
    analyzeAndRender();
  } catch (err) {
    console.error(err); st.textContent = `PDF를 읽지 못했습니다: ${err.message || err}`;
  } finally { pg.hidden = true; }
}

/* ---------- 분석 ---------- */
function parseEtd(ofp) {
  const v = (settings.etdHHMM || '').trim();
  if (!/^\d{4}$/.test(v) || ofp.date == null) return undefined;
  let t = ofp.date + (+v.slice(0, 2)) * 3600000 + (+v.slice(2)) * 60000;
  if (ofp.etd != null && t < ofp.etd - 12 * 3600000) t += 86400000;
  return t;
}
function analyzeAndRender() {
  const t0 = performance.now();
  if (!state.prep) { // PDF 파싱은 한 번만
    state.prep = prepare(state.lines);
    const T = cleanLines(state.lines).map(l => l.t);
    try { state.rc = compareRoutes(T, state.prep.ofp); } catch (e) { console.error(e); state.rc = null; }
    try { state.fu = parseFuel(T, state.prep.ofp); } catch (e) { console.error(e); state.fu = null; }
    try { state.it = parseInit(T, state.prep.ofp); } catch (e) { console.error(e); state.it = null; }
  }
  const etdOverride = parseEtd(state.prep.ofp);
  state.R = evaluate(state.prep, etdOverride != null ? { ...settings, etdOverride } : settings);
  state.ms = Math.round(performance.now() - t0);
  drop.hidden = true; $('#result').hidden = false;
  render();
}

/* ---------- 렌더링 ---------- */
const STATUS_KO = { relevant: '관련', review: '검토', excluded: '제외' };
const TABS = [
  ['route', '경로·FIR'], ['airport', '출발·도착·교체'], ['alt', 'REFILE·ERA'], ['excluded', '제외됨'], ['all', '전체'], ['rte', '항로 대조'], ['init', 'INIT'], ['fuel', 'FUEL & LOAD'],
];
function tabOfRaw(n) {
  if (n.sect === 'FIR' || n.sect === 'ENR') return 'route';
  if (n.sect === 'DEP' || n.sect === 'DEST' || n.sect === 'ALTN') return 'airport';
  return 'alt';
}
function tabOf(n) {
  if (n.a.status === 'excluded') return 'excluded';
  if (n.sect === 'FIR' || n.sect === 'ENR') return 'route';
  if (n.sect === 'DEP' || n.sect === 'DEST' || n.sect === 'ALTN') return 'airport';
  return 'alt';
}

function render() {
  const { ofp, notams, ctx, sections } = state.R;
  const el = $('#result');
  const counts = { relevant: 0, review: 0, excluded: 0 };
  const inTab = n => state.tab === 'all' || state.tab === 'excluded' || tabOf(n) === state.tab || (n.a.status === 'excluded' && tabOfRaw(n) === state.tab);
  notams.filter(inTab).forEach(n => counts[n.a.status]++);
  const tabN = {}; for (const [k] of TABS) tabN[k] = k === 'all' ? notams.length : notams.filter(n => tabOf(n) === k).length;
  const rc = state.rc, rcBad = rc && rc.counts ? rc.counts.bad : null;
  tabN.rte = !rc || !rc.coStr || !rc.fplStr ? '?' : rcBad ? `✗${rcBad}` : rc.counts.chk ? `확인${rc.counts.chk}` : '✓';
  const fu = state.fu, fuOk = fu && fu.ok;
  tabN.fuel = !fuOk ? '?' : fu.warnings.length ? '확인' : '✓';
  const it = state.it;
  tabN.init = !it || !it.ok ? '?' : it.warnings.length ? '확인' : '✓';
  const isFuel = state.tab === 'fuel', isInit = state.tab === 'init';
  const isRc = state.tab === 'rte' || isFuel || isInit;

  const fir = Object.entries(ctx.firWin).filter(([k]) => (ofp.eet || []).some(e => e.fir === k) || k === (ofp.pkgFirs || [])[0])
    .sort((a, b) => a[1][0][0] - b[1][0][0]);
  const etdLbl = settings.etdHHMM ? `<b>${fmtZ(ctx.etd, false)}</b> <span class="chip">변경됨</span>` : `<b>${fmtZ(ctx.etd, false)}</b>`;
  let h = '';
  for (const w of ofp.warnings || []) h += `<div class="warn">${esc(w)}</div>`;
  if (!notams.length) h += `<div class="warn">NOTAM 패키지를 찾지 못했습니다. NOTAM이 들어 있는 PDF도 함께 선택하세요.</div>`;
  h += `<div class="panel">
    <div class="flt">
      <span class="big">${esc(ofp.flight || '—')} ${esc(ofp.dep || '')} → ${esc(ofp.dest || '')}</span>
      <span class="kv">날짜 <b>${ofp.date != null ? fmtZ(ofp.date).slice(0, 5) + String(new Date(ofp.date).getUTCFullYear()).slice(2) : '—'}</b></span>
      <span class="kv">ETD ${etdLbl}</span>
      <span class="kv">ETA <b>${fmtZ(ctx.eta, false)}</b></span>
      <span class="kv">ALTN <b>${esc(ofp.altn || '—')}</b></span>
      <span class="kv">노선코드 <b>${esc(ofp.routeCode || '—')}</b></span>
      <span class="kv">비행시간 <b>${ofp.flightMin != null ? `${Math.floor(ofp.flightMin / 60)}:${String(ofp.flightMin % 60).padStart(2, '0')}` : '—'}</b></span>
    </div>
    <div class="firs">${fir.map(([k, w]) => `<span class="chip"><b>${k}</b> ${w.map(x => fmtZ(x[0], false)).join('/')}</span>`).join('')}</div>
    <div class="route">${esc(ofp.item15 || '')}</div>
    <div class="note" style="margin-top:6px">${esc(state.name)} ·${state.readMs ? ` PDF 읽기 ${(state.readMs / 1000).toFixed(1)}초 ·` : ''} 항법점 ${ofp.wpts.length}개 · 항로 ${ofp.airways.size}개 · NOTAM ${notams.length}건 · 판정 ${state.ms}ms · 판정 폭 ${settings.bufferNM}NM · 시간여유 −${settings.before}/+${settings.after}분</div>
  </div>`;
  h += `<div class="toolbar">
    <div class="seg" id="tabs">${TABS.map(([k, l]) => `<button data-t="${k}" class="${state.tab === k ? 'on' : ''}${k === 'rte' && rcBad ? ' rc-alert' : ''}">${l}<span class="n">${tabN[k]}</span></button>`).join('')}</div>
    ${isRc ? '' : `<div class="counts" title="현재 탭 기준">${state.tab === 'excluded' ? '' : `<span class="count c-rel">관련 ${counts.relevant}</span><span class="count c-rev">검토 ${counts.review}</span>`}<span class="count c-exc">제외 ${counts.excluded}</span></div>
    <span class="grow"></span>
    <input id="q" type="search" placeholder="검색 (ID·지점·단어)" value="${esc(state.q)}" style="width:190px">
    <div class="seg" id="view">${[['both', '해석+원문'], ['ko', '해석'], ['raw', '원문']].map(([k, l]) => `<button data-v="${k}" class="${state.view === k ? 'on' : ''}">${l}</button>`).join('')}</div>`}
  </div>`;
  h += isInit ? `<div id="init">${renderInit(it, ofp)}</div>` : isFuel ? `<div id="fuel">${renderFuel(fu, ofp, ctx)}</div>` : isRc ? `<div id="rc">${renderRouteCheck(rc)}</div>` : `<div id="list">${renderList()}</div>`;
  h += `<p class="note noprint" style="margin-top:20px">규칙 기반 자동 분류·해석입니다. 공식 브리핑을 대신하지 않으며, '검토'·'제외' 항목도 최종 확인은 원문으로 하세요. · v${APP_VERSION}/${CORE_VERSION}</p>`;
  el.innerHTML = h;

  el.querySelector('#tabs').onclick = e => { const b = e.target.closest('button'); if (!b) return; state.tab = b.dataset.t; render(); };
  if (isRc) return;
  el.querySelector('#view').onclick = e => { const b = e.target.closest('button'); if (!b) return; state.view = b.dataset.v; store.set('nf.view', state.view); render(); };
  const q = el.querySelector('#q');
  q.oninput = () => { state.q = q.value; refreshList(); };
  bindCards();
}

function refreshList() { $('#list').innerHTML = renderList(); bindCards(); }
function bindCards() {
  document.querySelectorAll('.card.compact .ch, .card .ch[data-k]').forEach(ch => ch.onclick = () => {
    const k = ch.dataset.k; if (state.open.has(k)) state.open.delete(k); else state.open.add(k);
    const card = ch.closest('.card'); card.classList.toggle('compact', !state.open.has(k) && card.dataset.cmp === '1');
  });
}

function currentList() {
  const q = state.q.trim().toUpperCase();
  let list = state.R.notams.filter(n => state.tab === 'all' || tabOf(n) === state.tab);
  if (q) list = list.filter(n => (n.id + ' ' + n.loc + ' ' + n.raw + ' ' + n.a.reasons.join(' ')).toUpperCase().includes(q));
  return list;
}
function renderList() {
  const { ctx } = state.R;
  let list = currentList();
  if (!list.length) return `<div class="empty">해당 항목이 없습니다.</div>`;

  // 그룹: 경로 탭은 비행 순서(FIR), 공항 탭은 공항별
  const groups = new Map();
  const firOrder = k => { const w = ctx.firWin[k]; return w ? w[0][0] : Infinity; };
  const keyOf = n => n.sect === 'FIR' || n.sect === 'ENR' ? `FIR|${n.sectIcao}` : `${n.sect}|${n.sectIcao}`;
  const sectRank = state.tab === 'excluded' ? { FIR: 0, ENR: 0, DEP: 1, DEST: 2, ALTN: 3, REFILE: 4, ERA: 5 } : { DEP: 0, DEST: 1, ALTN: 2, REFILE: 3, ERA: 4, FIR: 5, ENR: 5 };
  list.sort((a, b) => {
    const ra = sectRank[a.sect] ?? 9, rb = sectRank[b.sect] ?? 9;
    if (ra !== rb) return ra - rb;
    if (a.sect === 'FIR' && b.sect === 'FIR') {
      const fa = firOrder(a.sectIcao), fb = firOrder(b.sectIcao); if (fa !== fb) return fa - fb;
      const sa = { relevant: 0, review: 1, excluded: 2 }[a.a.status], sb = { relevant: 0, review: 1, excluded: 2 }[b.a.status];
      if (sa !== sb) return sa - sb;
      return (a.a.when?.ws ?? 0) - (b.a.when?.ws ?? 0);
    }
    return ra - rb || 0;
  });
  for (const n of list) { const k = keyOf(n); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(n); }
  let h = '';
  for (const [k, arr] of groups) {
    const [sect, icao] = k.split('|');
    const n0 = arr[0];
    const win = sect === 'FIR' && ctx.firWin[icao] ? ` · ${ctx.firWin[icao].map(w => `${fmtZ(w[0], false)}–${fmtZ(w[1], false)}`).join(', ')}` : '';
    h += `<div class="grp">${sect === 'FIR' ? 'FIR' : sectKo(sect)} ${esc(icao)} <span style="font-weight:400">${esc(n0.sectName || '')}${win}</span><span class="ln"></span>${arr.length}</div>`;
    const compactDefault = state.tab === 'excluded' || (state.tab === 'alt' && n0.sect === 'ERA') || (state.tab === 'all' && n0.a.status === 'excluded');
    for (const n of arr) h += card(n, compactDefault);
  }
  return h;
}

function card(n, compactDefault) {
  const a = n.a;
  if (n._Ir !== state.R) { n._I = interpret(n, state.R.ctx); n._Ir = state.R; } // 검색 입력 때 재해석 생략
  const I = n._I;
  const open = state.open.has(n.key), compact = compactDefault && !open;
  const val = `${n.startTxt} – ${n.endTxt}${n.est ? ' EST' : ''}`;
  const why = [
    ...a.reasons.map(r => `<span class="chip">${esc(r)}</span>`),
    ...a.excl.map(r => `<span class="chip x">${esc(r)}</span>`),
    ...a.notes.map(r => `<span class="chip nt">${esc(r)}</span>`),
  ].join('');
  if (!n._D) n._D = decodeBlock(n);
  const mode = settings.koMode || 'auto';
  const tr = mode === 'literal' ? null : trStore.get(n);
  const showLit = !tr || mode === 'both';
  if (showLit && !n._L) n._L = literalBlock(n);
  const ko = `<div class="ko-pane">
    <div class="lbl">요약</div>
    <ul>${I.summary.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
    ${tr ? `<div class="lbl">전문 번역 · 번역 파일${tr.src ? ` (${esc(tr.src)})` : ''}${tr.exact ? '' : ' <span class="warnc">원문이 바뀌었을 수 있음</span>'}</div><div class="aitr">${esc(tr.ko)}</div>` : ''}
    ${showLit ? `<div class="lbl">전문 직역 (오프라인)</div><div class="lit">${esc(n._L)}</div>` : ''}
    <dl class="meta">${I.meta.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
    <details class="gl" ${state.decOpen ? 'open' : ''}><summary>영문 디코딩 (ICAO·FAA 약어 풀이)</summary><div class="gloss">${n._D}</div></details>
  </div>`;
  const raw = `<div class="orig"><div class="lbl">원문</div><pre>${esc(`${n.startTxt} - ${n.endTxt}${n.est ? ' EST' : ''}  ${n.loc} ${n.id}\n${n.raw}`)}</pre></div>`;
  const body = state.view === 'ko' ? ko : state.view === 'raw' ? raw : ko + raw;
  return `<article class="card ${a.status}${compact ? ' compact' : ''}" data-cmp="${compactDefault ? 1 : 0}">
    <div class="ch" data-k="${esc(n.key)}"><span class="pill p-${a.status}">${STATUS_KO[a.status]}</span>
      <span class="nid">${esc(n.loc)} ${esc(n.id)}</span><span class="cat">${esc(CAT_KO[n.cat] || n.cat)}</span><span class="val">${esc(val)}</span></div>
    <div class="why">${why}</div>
    <div class="body ${state.view === 'both' ? 'both' : ''}">${body}</div>
  </article>`;
}

function decodeBlock(n) {
  const parts = [];
  if (n.D) parts.push(`<span class="dl">SCHEDULE</span> ${decodeEN(n.D).html}`);
  parts.push(decodeEN(n.E || n.raw).html);
  if (n.F || n.G) parts.push(`<span class="dl">LIMITS</span> ${decodeEN(`${n.F || ''} - ${n.G || ''}`).html}`);
  if (n.comment) parts.push(`<span class="dl">COMMENT</span> ${decodeEN(n.comment).html}`);
  return parts.join('\n\n');
}

function literalBlock(n) {
  const parts = [];
  if (n.D) parts.push(`[운용시간] ${literalKO(n.D)}`);
  parts.push(literalKO(n.E || n.raw));
  if (n.F || n.G) parts.push(`[고도] ${literalKO(`${n.F || 'SFC'} ~ ${n.G || 'UNL'}`)}`);
  if (n.comment) parts.push(`[회사 COMMENT] ${literalKO(n.comment)}`);
  return parts.join('\n\n');
}
function refreshListKeepScroll() { const y = scrollY; refreshList(); scrollTo(0, y); }

/* ---------- 번역 파일 ---------- */
async function importTranslations(files) {
  const msgs = [];
  for (const f of files) {
    try { const r = trStore.importText(await f.text()); msgs.push(`${f.name}: ${r.added}건 불러옴${r.flight ? ` (${r.flight})` : ''}`); }
    catch (e) { msgs.push(`${f.name}: ${e.message}`); }
  }
  alert(msgs.join('\n'));
  if (state.R) refreshListKeepScroll();
  const c = $('#trCount'); if (c) c.textContent = `저장된 번역 ${trStore.count()}건`;
}

/* ---------- 설정 ---------- */
const dlg = $('#dlg');
function openSettings() {
  $('#sBuf').value = settings.bufferNM; $('#sBefore').value = settings.before; $('#sAfter').value = settings.after;
  $('#sAlt').value = settings.altMargin; $('#sEtd').value = settings.etdHHMM || '';
  $('#sKoMode').value = settings.koMode || 'auto';
  $('#sDec').checked = !!state.decOpen;
  $('#trCount').textContent = `저장된 번역 ${trStore.count()}건`;
  dlg.showModal();
}
$('#btnSettings').onclick = openSettings;
$('#sClearTr').onclick = () => { if (confirm('이 기기에 저장된 번역 파일 내용을 모두 지울까요?')) { trStore.clear(); $('#trCount').textContent = '저장된 번역 0건'; if (state.R) refreshList(); } };
$('#sImportTr').onclick = () => $('#trFile').click();
$('#trFile').onchange = e => { const f = [...e.target.files]; e.target.value = ''; if (f.length) importTranslations(f); };
$('#sReset').onclick = () => { settings = { ...DEFAULTS, koMode: settings.koMode }; store.set('nf.settings', settings); dlg.close(); if (state.lines) analyzeAndRender(); };
$('#sClose').onclick = () => {
  const num = (id, d) => { const v = parseFloat($(id).value); return isFinite(v) && v >= 0 ? v : d; };
  settings.bufferNM = num('#sBuf', DEFAULTS.bufferNM); settings.before = num('#sBefore', DEFAULTS.before);
  settings.after = num('#sAfter', DEFAULTS.after); settings.altMargin = num('#sAlt', DEFAULTS.altMargin);
  const e = $('#sEtd').value.replace(/[^0-9]/g, ''); settings.etdHHMM = /^\d{4}$/.test(e) ? e : '';
  settings.koMode = $('#sKoMode').value; delete settings.aiKey; delete settings.aiModel;
  for (const n of state.R?.notams || []) n._L = null;
  state.decOpen = $('#sDec').checked; store.set('nf.decOpen', state.decOpen);
  const { etdHHMM, ...persist } = settings; store.set('nf.settings', persist); // 출발시각 변경은 이번 비행에만
  dlg.close(); if (state.lines) analyzeAndRender();
};
$('#btnPrint').onclick = () => print();
