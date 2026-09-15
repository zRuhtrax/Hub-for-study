import { SUBJECTS } from '../src/content.js';

let errors = 0;
let warnings = 0;
const absoluteWords = /\b(sempre|nunca|todos|todas|apenas|somente|qualquer|automaticamente|exclusivamente)\b/i;
const totalModules = SUBJECTS.reduce((n,s)=>n+(s.topics?.length ?? 0),0);
const totalPractice = SUBJECTS.reduce((n,s)=>n+(s.questions?.length ?? 0),0);

for (const subject of SUBJECTS) {
  if (!subject.id || !subject.name) { console.error('[ERRO] disciplina sem id/nome'); errors++; }
  for (const [i, topic] of (subject.topics ?? []).entries()) {
    if (!topic.id || !topic.title || !topic.html) { console.error(`[ERRO] ${subject.name}: módulo ${i+1} incompleto`); errors++; }
    const quizzes = topic.quiz ?? [];
    if (quizzes.length < 3) { console.warn(`[AVISO] ${topic.title}: menos de 3 questões de fixação`); warnings++; }
    for (const [j, q] of quizzes.entries()) {
      if (!q.q || !q.type) { console.error(`[ERRO] ${topic.title}: fixação ${j+1} incompleta`); errors++; continue; }
      if (q.type === 'mc') {
        if (!Array.isArray(q.options) || q.options.length !== 4) { console.error(`[ERRO] ${topic.title}: fixação ${j+1} não possui exatamente 4 alternativas`); errors++; continue; }
        if (q.correct < 0 || q.correct >= q.options.length) { console.error(`[ERRO] ${topic.title}: fixação ${j+1} índice correto inválido`); errors++; }
        if (new Set(q.options.map(x => x.trim().toLowerCase())).size !== q.options.length) { console.error(`[ERRO] ${topic.title}: fixação ${j+1} possui alternativas duplicadas`); errors++; }
        q.options.forEach((opt,k)=>{ if (absoluteWords.test(opt)) { console.warn(`[AVISO] ${topic.title}: alternativa ${String.fromCharCode(65+k)} pode entregar a resposta: ${opt}`); warnings++; } });
      }
    }
  }
  for (const [i,q] of (subject.questions ?? []).entries()) {
    if (!q.q || !q.type) { console.error(`[ERRO] ${subject.name}: prática ${i+1} incompleta`); errors++; continue; }
    if (q.type === 'mc') {
      if (!Array.isArray(q.options) || q.options.length !== 4) { console.error(`[ERRO] ${subject.name}: prática ${i+1} não possui exatamente 4 alternativas`); errors++; continue; }
      if (q.correct < 0 || q.correct >= q.options.length) { console.error(`[ERRO] ${subject.name}: prática ${i+1} índice correto inválido`); errors++; }
      if (new Set(q.options.map(x => x.trim().toLowerCase())).size !== q.options.length) { console.error(`[ERRO] ${subject.name}: prática ${i+1} possui alternativas duplicadas`); errors++; }
    }
  }
}

const visualCount = SUBJECTS.reduce((n,s)=>n+(s.topics ?? []).reduce((m,t)=>m+(t.html.match(/visual-lesson/g)?.length ?? 0),0),0);
console.log(`Auditoria NEXO v5: ${SUBJECTS.length} disciplina(s), ${totalModules} módulo(s), ${totalPractice} questão(ões) de prática, ${visualCount} bloco(s) visual(is).`);
console.log(`Erros: ${errors} · Avisos: ${warnings}`);
if (errors) process.exit(1);
