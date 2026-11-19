// trfile.js — 번역 파일(JSON) 불러오기·저장. 번역 파일은 Claude 대화(구독)에서 만들어 아이패드로 가져온다.
// 형식: {"format":"notam-ko-v1","flight":"AAR541","dep":"RKSI","dest":"EDDF","date":"2026-11-02",
//        "items":[{"loc":"RKRR","id":"D3430/26","h":"<hashNotam>","ko":"<전문 번역>"}]}
const KEY = 'nf.trFile';
const MAX = 4000;

export function hashNotam(n) {
  const s = `${n.loc}|${n.id}|${n.raw}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0') + s.length.toString(16);
}

export const trStore = {
  _c: null,
  load() { if (this._c) return this._c; try { this._c = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { this._c = {}; } return this._c; },
  save() { try { localStorage.setItem(KEY, JSON.stringify(this._c)); return true; } catch { return false; } },
  /** NOTAM에 맞는 번역: 원문 해시가 같으면 그대로, 번호만 같으면 '원문 변경 가능' 표시 */
  get(n) {
    const c = this.load();
    const h = hashNotam(n);
    if (c[h]) return { ...c[h], exact: true };
    const alt = c[`id:${n.loc}|${n.id}`];
    if (alt && c[alt]) return { ...c[alt], exact: false };
    return null;
  },
  count() { return Object.keys(this.load()).filter(k => !k.startsWith('id:')).length; },
  clear() { this._c = {}; try { localStorage.removeItem(KEY); } catch { } },
  /** JSON 텍스트를 읽어 저장. 반환 {added, flight} */
  importText(text) {
    let j;
    try { j = JSON.parse(text); } catch { throw new Error('JSON 형식이 아닙니다'); }
    if (!j || j.format !== 'notam-ko-v1' || !Array.isArray(j.items)) throw new Error('NOTAM 번역 파일(notam-ko-v1)이 아닙니다');
    const c = this.load(); let added = 0;
    const src = [j.flight, j.dep && j.dest ? `${j.dep}-${j.dest}` : '', j.date].filter(Boolean).join(' ');
    for (const it of j.items) {
      if (!it || !it.loc || !it.id || !it.ko) continue;
      const h = it.h || `nohash:${it.loc}|${it.id}`;
      c[h] = { ko: String(it.ko).trim(), src, at: Date.now() };
      c[`id:${it.loc}|${it.id}`] = h;
      added++;
    }
    const keys = Object.keys(c).filter(k => !k.startsWith('id:'));
    if (keys.length > MAX) keys.sort((a, b) => c[a].at - c[b].at).slice(0, keys.length - MAX).forEach(k => delete c[k]);
    this._c = c;
    if (!this.save()) throw new Error('기기 저장 공간이 부족합니다');
    return { added, flight: src };
  },
};
