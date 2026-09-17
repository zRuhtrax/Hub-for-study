import { SUBJECTS, DISCIPLINES } from '../src/content.js';

let errors = 0;
let warnings = 0;
const absoluteWords = /\b(sempre|nunca|todos|todas|apenas|somente|qualquer|automaticamente|exclusivamente)\b/i;
const totalModules = SUBJECTS.reduce((n,s)=>n+(s.topics?.length ?? 0),0);
const totalPractice = SUBJECTS.reduce((n,s)=>n+(s.questions?.length ?? 0),0);
const registryIds = new Set(DISCIPLINES.flatMap(d=>d.subjectIds||[]));

function checkMC(label, q) {
  if (!Array.isArray(q.options) || q.options.length !== 4) {
    console.error(`[ERRO] ${label} não possui exatamente 4 alternativas`);
    errors++;
    return;
  }
  if (q.correct < 0 || q.correct >= q.options.length) {
    console.error(`[ERRO] ${label} índice correto inválido`);
    errors++;
  }
  if (new Set(q.options.map(x => x.trim().toLowerCase())).size !== q.options.length) {
    console.error(`[ERRO] ${label} possui alternativas duplicadas`);
    errors++;
  }
  q.options.forEach((opt, k) => {
    if (absoluteWords.test(opt)) {
      console.warn(`[AVISO] ${label} alternativa ${String.fromCharCode(65+k)} pode entregar a resposta: ${opt}`);
      warnings++;
    }
  });
}

for (const subject of SUBJECTS) {
  if (subject.discipline && !DISCIPLINES.some(d=>d.name===subject.discipline)) {
    console.error(`[ERRO] ${subject.name}: disciplina não registrada em DISCIPLINES`);
    errors++;
  }
  if (!subject.id || !subject.name) { console.error('[ERRO] disciplina sem id/nome'); errors++; }
  for (const [i, topic] of (subject.topics ?? []).entries()) {
    if (!topic.id || !topic.title || !topic.html) {
      console.error(`[ERRO] ${subject.name}: módulo ${i+1} incompleto`);
      errors++;
    }
    const quizzes = topic.quiz ?? [];
    if (quizzes.length < 3) {
      console.warn(`[AVISO] ${topic.title}: menos de 3 questões de fixação`);
      warnings++;
    }
    for (const [j, q] of quizzes.entries()) {
      if (!q.q || !q.type) {
        console.error(`[ERRO] ${topic.title}: fixação ${j+1} incompleta`);
        errors++;
        continue;
      }
      if (q.type === 'mc') checkMC(`${topic.title}: fixação ${j+1}`, q);
    }
  }
  for (const [i,q] of (subject.questions ?? []).entries()) {
    if (!q.q || !q.type) {
      console.error(`[ERRO] ${subject.name}: prática ${i+1} incompleta`);
      errors++;
      continue;
    }
    if (q.type === 'mc') checkMC(`${subject.name}: prática ${i+1}`, q);
  }
}

for (const d of DISCIPLINES) {
  if (!d.id || !d.name || !Array.isArray(d.subjectIds)) {
    console.error(`[ERRO] registro de disciplina inválido: ${d?.name||d?.id||'sem nome'}`);
    errors++;
  }
}
for (const id of registryIds) {
  if (!SUBJECTS.some(s=>s.id===id)) {
    console.error(`[ERRO] DISCIPLINES referencia matéria inexistente: ${id}`);
    errors++;
  }
}

const visualCount = SUBJECTS.reduce((n,s)=>n+(s.topics ?? []).reduce((m,t)=>m+(t.html.match(/visual-lesson/g)?.length ?? 0),0),0);
console.log(`Auditoria NEXO v6.2.5: ${DISCIPLINES.length} disciplina(s), ${totalModules} módulo(s), ${totalPractice} questão(ões) de prática, ${visualCount} bloco(s) visual(is).`);
console.log(`Erros: ${errors} · Avisos: ${warnings}`);
if (errors) process.exit(1);
