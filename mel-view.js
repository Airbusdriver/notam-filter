// mel-view.js — "MEL/CDL" 탭 화면
import { esc } from './interp.js';

export function renderMel(m) {
  if (!m || !m.ok) return (m?.warnings || ['MEL / CDL ITEMS를 찾지 못했습니다.']).map(w => `<div class="warn">${esc(w)}</div>`).join('');
  const n = m.items.length, tr = m.items.filter(i => i.trunc).length;
  let h = m.warnings.map(w => `<div class="warn">${esc(w)}</div>`).join('');
  const sum = n ? [m.counts.MEL && `MEL ${m.counts.MEL}`, m.counts.CDL && `CDL ${m.counts.CDL}`, m.items.length - m.counts.MEL - m.counts.CDL && `기타 ${m.items.length - m.counts.MEL - m.counts.CDL}`].filter(Boolean).join(' · ') : 'MEL / CDL 항목 없음 (NIL)';
  h += `<div class="rc-sum ${n ? 'chk' : 'ok'}">${sum}
    <span class="note">${esc(m.reg || '')}${m.reg ? ' · ' : ''}DISPATCH RELEASE INFORMATION 기준</span></div>`;

  if (n) {
    h += `<div class="panel"><table class="rc-t mel-t"><thead><tr><th>구분</th><th>항목 번호</th><th>내용 (OFP 원문)</th><th>ATA</th></tr></thead><tbody>`;
    for (const it of m.items) {
      h += `<tr${it.trunc ? ' class="st-chk"' : ''}>
        <td><span class="mel-ty mel-${esc(it.type.toLowerCase())}">${esc(it.type)}</span></td>
        <td class="mel-ref">${esc(it.ref)}</td>
        <td class="mel-d">${esc(it.desc)}${it.trunc ? ' <span class="chip mel-cut">끝 잘림?</span>' : ''}</td>
        <td class="note">${it.ata ? `${esc(it.ata)}${it.ataName ? ' ' + esc(it.ataName) : ''}` : ''}</td></tr>`;
    }
    h += `</tbody></table></div>`;
    if (tr) h += `<p class="note">“끝 잘림?” — OFP는 설명을 일정 길이(약 40자)에서 잘라 출력합니다. 전체 문구·조건(O)(M) 절차는 테크로그·MEL(DDPG) 원문으로 확인하세요.</p>`;
  }
  if (m.notes.length) h += `<div class="grp">디스패치 노트 <span class="ln"></span></div><div class="panel">${m.notes.map(t => `<div class="mel-note">${esc(t)}</div>`).join('')}</div>`;
  h += `<details class="panel"><summary class="orig-lbl" style="cursor:pointer">OFP 원문</summary><pre class="rc-src" style="white-space:pre-wrap">${esc([m.release, m.releaseLine, '', ...m.raw].filter(x => x != null).join('\n'))}</pre></details>`;
  h += `<p class="note">OFP에 적힌 디스패치 시점의 MEL/CDL 목록입니다. 항공기 탑승 후 테크로그·ECAM 상태와 대조하세요. ATA 장 이름은 참고용입니다.</p>`;
  return h;
}
