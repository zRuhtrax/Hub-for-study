import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const main=fs.readFileSync(path.join(root,"src/main.jsx"),"utf8");
const css=fs.readFileSync(path.join(root,"src/styles.css"),"utf8");
const content=fs.readFileSync(path.join(root,"src/content.js"),"utf8");
let errors=0;
const must=[
  ["scroll reset", /window\.scrollTo\(\{top:0/],
  ["sidebar x overflow", /overflow-x:hidden!important/],
  ["discipline registry", /const DISCIPLINES\s*=\s*\[/],
  ["topic map helper", /function topicMap\(/],
  ["topic summary per module", /summaryHtml:topicMap\('/],
  ["global flashcards", /function FlashcardsHub/],
  ["calendar", /function Calendar/]
];
for(const [name,re] of must){
  if(!re.test(main+css+content)){
    console.error(`[ERRO] QA: ${name} ausente`);
    errors++;
  }
}
if(!/v6\.3\.0/.test(main+css)){console.error('[ERRO] QA: versão 6.3.0 ausente');errors++;}

if(!/VÉSPERA/.test(main)){console.error('[ERRO] QA: branding VÉSPERA ausente');errors++;}
if(!/function QuestionsHub/.test(main)){console.error('[ERRO] QA: hub de questões ausente');errors++;}
if(!/Europa Medieval/.test(content)){console.error('[ERRO] QA: matéria Europa Medieval ausente');errors++;}
if(!/Climatologia/.test(content)){console.error('[ERRO] QA: matéria Climatologia ausente');errors++;}
const badOutsideHtml=content.includes('</html>');
if(badOutsideHtml){console.error('[ERRO] QA: content.js contém fechamento de HTML');errors++;}
console.log(`QA estrutural VÉSPERA v6.3.0: ${errors ? errors+' erro(s)' : 'OK'}`);
if(errors)process.exit(1);
