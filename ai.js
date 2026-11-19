// ai.js — 온라인일 때 Claude API로 NOTAM을 자연스러운 한국어로 번역하고 기기에 저장(이후 오프라인 열람)
// API 키는 이 기기의 브라우저 저장소에만 보관되며, 요청은 api.anthropic.com으로 직접 전송된다.

export const AI_MODELS = [
  ['claude-sonnet-5-5', 'Sonnet 5.5 (정확, 기본)'],
  ['claude-haiku-5-5', 'Haiku 5.5 (빠름·저렴)'],
];
const CACHE_KEY = 'nf.aiCache';
const MAX_CACHE = 3000;

const SYSTEM = `당신은 항공사 운항승무원(A350 기장)을 위해 NOTAM을 한국어로 번역하는 전문가입니다.
규칙:
- 자연스럽고 간결한 한국어로 번역하고, 약어는 모두 풀어서 뜻을 전달하세요.
- 지점·항로·항행시설 식별부호, 활주로·유도로 이름, 주파수, 좌표, 비행고도(FL), 고도 수치, 시각(UTC)은 원문 그대로 유지하세요.
- 원문에 없는 내용을 추측해 덧붙이지 마세요. 뜻이 모호하면 "(원문 확인)"이라고 적으세요.
- 형식: 첫 줄은 "요약: "으로 시작하는 한 문장. 그 다음 줄부터 필요한 만큼 "- "로 시작하는 짧은 항목(대상, 시간, 범위, 고도, 조치/요구사항 순).
- 회사 노선 목록(예: ICN/FRA(R02,...))은 "회사 영향 노선 목록"이라고만 요약하세요.
출력은 JSON 배열 하나만: [{"k":"<키>","ko":"<번역>"}] — 다른 글은 쓰지 마세요.`;

export function hashNotam(n) {
  const s = `${n.loc}|${n.id}|${n.raw}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0') + s.length.toString(16);
}

export const aiCache = {
  _c: null,
  load() { if (this._c) return this._c; try { this._c = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { this._c = {}; } return this._c; },
  get(n) { return this.load()[hashNotam(n)] || null; },
  put(n, ko, model) {
    const c = this.load(); c[hashNotam(n)] = { ko, model, at: Date.now() };
    const keys = Object.keys(c);
    if (keys.length > MAX_CACHE) keys.sort((a, b) => c[a].at - c[b].at).slice(0, keys.length - MAX_CACHE).forEach(k => delete c[k]);
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch { /* 저장 공간 부족 시 메모리에만 */ }
  },
  clear() { this._c = {}; try { localStorage.removeItem(CACHE_KEY); } catch { } },
  count() { return Object.keys(this.load()).length; },
};

async function callClaude(key, model, items, signal) {
  const user = '다음 NOTAM들을 번역하세요. 각 항목의 "k"를 그대로 돌려주세요.\n\n' + items.map(it =>
    `<notam k="${it.k}">\n${it.text}\n</notam>`).join('\n\n');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', signal,
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model, max_tokens: 8000, system: SYSTEM, messages: [{ role: 'user', content: user }] }),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const j = await res.json(); msg = j.error?.message || msg; } catch { }
    if (res.status === 401) msg = 'API 키가 올바르지 않습니다 (401)';
    else if (res.status === 429) msg = '요청 한도 초과 — 잠시 후 다시 시도하세요 (429)';
    else if (res.status === 400 && /credit|balance/i.test(msg)) msg = 'API 크레딧이 부족합니다';
    else if (res.status === 404) msg = `모델을 찾을 수 없습니다 (${model})`;
    throw new Error(msg);
  }
  const j = await res.json();
  const txt = (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('');
  const a = txt.indexOf('['), b = txt.lastIndexOf(']');
  if (a < 0 || b < a) throw new Error('응답 형식을 읽지 못했습니다');
  return JSON.parse(txt.slice(a, b + 1));
}

/** notams 중 캐시에 없는 것만 번역. onProgress(done,total), 반환: {done, failed, error} */
export async function translateAll(notams, { key, model, onProgress, signal, batch = 8, parallel = 2 }) {
  const todo = notams.filter(n => !aiCache.get(n));
  const total = todo.length; let done = 0, failed = 0, lastErr = null;
  onProgress && onProgress(0, total);
  const groups = []; for (let i = 0; i < todo.length; i += batch) groups.push(todo.slice(i, i + batch));
  let gi = 0;
  async function worker() {
    while (gi < groups.length && !signal?.aborted) {
      const g = groups[gi++];
      const items = g.map((n, i) => ({ k: String(i), n, text: `${n.startTxt} - ${n.endTxt}${n.est ? ' EST' : ''} ${n.loc} ${n.id} [${n.cat}]\n${n.raw}` }));
      try {
        const out = await callClaude(key, model, items, signal);
        for (const o of out) { const it = items[+o.k]; if (it && o.ko) { aiCache.put(it.n, String(o.ko).trim(), model); } }
        const got = new Set(out.map(o => +o.k));
        failed += items.filter((_, i) => !got.has(i)).length;
      } catch (e) {
        if (e.name === 'AbortError') return;
        lastErr = e; failed += g.length;
        if (/401|크레딧|모델/.test(e.message)) { gi = groups.length; } // 계속해도 실패할 오류는 중단
      }
      done += g.length; onProgress && onProgress(done, total);
    }
  }
  await Promise.all(Array.from({ length: Math.min(parallel, groups.length) }, worker));
  return { done, failed, total, error: lastErr };
}
