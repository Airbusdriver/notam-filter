// 번역 파일 만들기 1단계 (Claude 대화에서 실행):
//   node tools/export.mjs <OFP.pdf> [out.json] [--all]
// 앱과 같은 파서로 NOTAM을 판정하고, 번역할 항목(기본: 제외·ERA 빼고)을 loc/id/해시/원문으로 내보낸다.
// 2단계: 각 항목의 ko(전문 번역)를 채워 format "notam-ko-v1" 파일로 저장 → 아이패드 앱에서 불러오기.
import fs from 'fs';
import { extractLines, runAll } from '../core.js';
import { hashNotam } from '../trfile.js';
import { existsSync } from 'fs';
// Node에서는 node_modules가 있는 pdfjs-dist를 우선 사용 (저장소의 pdf.min.mjs는 브라우저용)
const NODE_PDFJS = process.env.PDFJS || '/opt/npm-tools/node_modules/pdfjs-dist/legacy/build/pdf.min.mjs';
const pdfjs = await import(existsSync(NODE_PDFJS) ? NODE_PDFJS : 'pdfjs-dist/legacy/build/pdf.min.mjs');

const [pdf, out = 'to-translate.json'] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const all = process.argv.includes('--all');
if (!pdf) { console.error('사용법: node tools/export.mjs <OFP.pdf> [out.json] [--all]'); process.exit(1); }
const lines = await extractLines(pdfjs, new Uint8Array(fs.readFileSync(pdf)));
const R = runAll(lines, {});
const o = R.ofp;
const pick = R.notams.filter(n => all || (n.a.status !== 'excluded' && n.sect !== 'ERA'));
const date = o.date != null ? new Date(o.date).toISOString().slice(0, 10) : '';
const items = pick.map(n => ({ loc: n.loc, id: n.id, h: hashNotam(n), sect: n.sect, status: n.a.status, cat: n.cat,
  valid: `${n.startTxt} - ${n.endTxt}${n.est ? ' EST' : ''}`, raw: n.raw, ko: '' }));
fs.writeFileSync(out, JSON.stringify({ format: 'notam-ko-v1', flight: o.flight, dep: o.dep, dest: o.dest, date, items }, null, 1));
console.log(`${o.flight} ${o.dep}-${o.dest} ${date}: ${items.length}건 → ${out}`);
const by = {}; for (const it of items) by[it.sect] = (by[it.sect] || 0) + 1; console.log(by);
