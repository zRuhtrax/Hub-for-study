import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SUBJECTS } from './content.js';
import './styles.css';

const STORAGE = 'nexo:v4';
const BOX_INTERVALS = [1,2,4,8,16];
const today = () => { const d=new Date(); const p=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`; };
const load = (k, fallback) => { try { const v = localStorage.getItem(`${STORAGE}:${k}`); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };
const save = (k,v) => localStorage.setItem(`${STORAGE}:${k}`, JSON.stringify(v));
const clamp = (n,a,b) => Math.max(a,Math.min(b,n));

function App(){
  const [session,setSession] = useState(load('session',null));
  const [authMode,setAuthMode] = useState('login');
  const [uiMode,setUiMode] = useState(load('uiMode','desktop'));
  const [theme,setTheme] = useState(load('theme','dark'));
  const [page,setPage] = useState({name:'home',subjectId:null});
  const [subjectTab,setSubjectTab] = useState('learn');
  const [topicIdx,setTopicIdx] = useState(0);
  const [questionIdx,setQuestionIdx] = useState(0);
  const [answers,setAnswers] = useState({});
  const [srs,setSrs] = useState(load('srs',{}));
  const [openTerms,setOpenTerms] = useState({});

  useEffect(()=>save('uiMode',uiMode),[uiMode]);
  useEffect(()=>save('theme',theme),[theme]);
  useEffect(()=>save('srs',srs),[srs]);
  if(!session) return <Auth mode={authMode} setMode={setAuthMode} onLogin={u=>setSession(u)}/>;

  const subject = SUBJECTS.find(s=>s.id===page.subjectId) || null;
  const goHome = () => { setPage({name:'home',subjectId:null}); setSubjectTab('learn'); };
  const openSubject = (id) => { setPage({name:'subject',subjectId:id}); setSubjectTab('learn'); setTopicIdx(0); setQuestionIdx(0); setAnswers({}); };
  const openSettings = () => setPage({name:'settings',subjectId:null});
  const openPractice = () => { setSubjectTab('practice'); setQuestionIdx(0); setAnswers({}); };
  const openReview = () => { setSubjectTab('review'); setOpenTerms({}); };

  function rate(subjectId,kind,id,remembered){
    setSrs(prev=>{
      const next = structuredClone(prev);
      next[subjectId] ??= {flashcards:{},keywords:{}};
      next[subjectId][kind][id] ??= {box:0,due:null,reviews:0};
      const it = next[subjectId][kind][id];
      if(remembered) it.box = clamp(it.box+1,0,4); else it.box = 0;
      it.due = new Date(Date.now()+BOX_INTERVALS[it.box]*86400000).toISOString().slice(0,10);
      it.reviews += 1;
      return next;
    });
  }

  return <div className={`app theme-${theme} mode-${uiMode}`}>
    <div className="shell">
      <aside className="sidebar">
        <div className="brand" onClick={goHome}><div className="brand-mark">N</div><div><div className="brand-name">NEXO</div><div className="brand-sub">estudo por conexões</div></div></div>
        <nav className="side-nav">
          <NavButton active={page.name==='home'} icon="⌂" label="Início" onClick={goHome}/>
          <NavButton active={page.name==='settings'} icon="⚙" label="Configurações" onClick={openSettings}/>
        </nav>
        <div className="side-foot">v4 · universal</div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="topbar-mobile-brand"><span className="brand-mark sm">N</span><span>NEXO</span></div>
          <div className="topbar-actions">
            {page.name==='subject' && <button className="ghost-btn" onClick={goHome}>← Início</button>}
            <button className="icon-btn" onClick={openSettings} title="Configurações">⚙</button>
          </div>
        </header>
        <div className="viewport">
          {page.name==='home' && <Home subjects={SUBJECTS} onOpen={openSubject} srs={srs}/>} 
          {page.name==='settings' && <Settings uiMode={uiMode} setUiMode={setUiMode} theme={theme} setTheme={setTheme}/>} 
          {page.name==='subject' && subject && <SubjectView subject={subject} tab={subjectTab} setTab={setSubjectTab} topicIdx={topicIdx} setTopicIdx={setTopicIdx} questionIdx={questionIdx} setQuestionIdx={setQuestionIdx} answers={answers} setAnswers={setAnswers} srs={srs} rate={rate} openTerms={openTerms} setOpenTerms={setOpenTerms}/>} 
        </div>
        <MobileNav page={page} onHome={goHome} onSettings={openSettings}/>
      </main>
    </div>
  </div>
}

async function hashPassword(v){const data=new TextEncoder().encode(v);const hash=await crypto.subtle.digest('SHA-256',data);return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('')}
function Auth({mode,setMode,onLogin}){
  const [name,setName]=useState(''); const [username,setUsername]=useState(''); const [password,setPassword]=useState(''); const [confirm,setConfirm]=useState(''); const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
  const submit=async e=>{e.preventDefault();setError('');if(!username.trim()||!password){setError('Preencha usuário e senha.');return}const clean=username.trim().toLowerCase();if(!/^[a-z0-9_.-]{3,24}$/.test(clean)){setError('O usuário precisa ter 3–24 caracteres e usar letras, números, ponto, hífen ou _.');return}setBusy(true);try{const users=load('users',{});const pass=await hashPassword(password);if(mode==='register'){if(!name.trim()){setError('Informe seu nome.');return}if(users[clean]){setError('Esse usuário já existe.');return}if(password!==confirm){setError('As senhas não coincidem.');return}users[clean]={name:name.trim(),username:clean,passwordHash:pass,createdAt:Date.now()};save('users',users);}else{if(!users[clean]||users[clean].passwordHash!==pass){setError('Usuário ou senha inválidos.');return}}const user=users[clean]||{};save('session',{name:user.name||clean,username:clean});onLogin({name:user.name||clean,username:clean});}finally{setBusy(false)}};
  return <div className="auth-page"><div className="auth-wrap"><div className="auth-brand"><span className="brand-mark">N</span><div><strong>NEXO</strong><small>estudo por conexões</small></div></div><div className="auth-panel"><span className="eyebrow">{mode==='login'?'ENTRAR':'CRIAR CONTA'}</span><h1>{mode==='login'?'Volte ao seu estudo.':'Comece seu espaço de estudo.'}</h1><p>{mode==='login'?'Seu progresso fica associado ao usuário neste dispositivo.':'Sem email por enquanto. Apenas nome, usuário e senha.'}</p><form onSubmit={submit}>{mode==='register'&&<label>Nome<input value={name} onChange={e=>setName(e.target.value)} autoComplete="name" /></label>}<label>Usuário<input value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username" /></label><label>Senha<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode==='login'?'current-password':'new-password'} /></label>{mode==='register'&&<label>Confirmar senha<input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} autoComplete="new-password" /></label>}{error&&<div className="auth-error">{error}</div>}<button className="auth-submit" disabled={busy}>{busy?'Entrando…':mode==='login'?'Entrar':'Criar conta'}</button></form><button className="auth-switch" onClick={()=>{setMode(mode==='login'?'register':'login');setError('')}}>{mode==='login'?'Ainda não tenho conta':'Já tenho uma conta'}</button></div><div className="auth-foot">Autenticação local · preparada para backend futuro</div></div></div>
}
function MobileNav({page,onHome,onSettings}){return <nav className="mobile-nav"><button className={page.name==='home'?'active':''} onClick={onHome}><span>⌂</span>Início</button><button className={page.name==='settings'?'active':''} onClick={onSettings}><span>⚙</span>Config.</button></nav>}

function NavButton({active,icon,label,onClick}){ return <button className={`nav-item ${active?'active':''}`} onClick={onClick}><span className="nav-icon">{icon}</span><span>{label}</span></button> }

function Home({subjects,onOpen,srs}){
  const totals = useMemo(()=>subjects.reduce((a,s)=>{a.topics+=s.topics.length;a.questions+=s.questions.length;a.cards+=s.flashcards.length+s.keywords.length;return a},{topics:0,questions:0,cards:0}),[subjects]);
  const due = subjects.reduce((n,s)=>n+s.flashcards.filter(f=>isDue(s.id,'flashcards',f.id,srs)).length+s.keywords.filter(k=>isDue(s.id,'keywords',k.id,srs)).length,0);
  return <div className="page home-page">
    <section className="hero-grid">
      <div><div className="eyebrow">NEXO</div><h1>Entender primeiro.<br/><em>Conectar depois.</em></h1><p>Um espaço para estudar por mecanismos, relações e recuperação ativa, sem transformar aprendizado em uma coleção de números.</p></div>
      <div className="overview-panel"><span className="panel-kicker">HOJE</span><strong>{due || '—'}</strong><span>{due===1?'item para revisar':due>1?'itens para revisar':'nenhuma pendência'}</span></div>
    </section>
    <section className="section-head"><div><span className="eyebrow">MATÉRIAS</span><h2>Seus estudos</h2></div><span className="section-count">{subjects.length} {subjects.length===1?'matéria':'matérias'}</span></section>
    <div className={`subjects-grid count-${subjects.length} ${subjects.length%2?'odd':''}`}>
      {subjects.map(s=><SubjectTile key={s.id} subject={s} onClick={()=>onOpen(s.id)} srs={srs}/>)}
    </div>
    <section className="metrics-strip">
      <div><strong>{totals.topics}</strong><span>módulos</span></div><div><strong>{totals.questions}</strong><span>questões</span></div><div><strong>{totals.cards}</strong><span>itens de revisão</span></div>
    </section>
  </div>
}

function SubjectTile({subject,onClick,srs}){
  const completed = subject.topics.filter(t=>Object.values(srs?.[subject.id]?.keywords||{}).length).length;
  return <button className="subject-tile" onClick={onClick}>
    <div className="tile-top"><span className="tile-tag">{subject.tag}</span><span className="tile-arrow">↗</span></div>
    <div className="tile-title">{subject.name}</div>
    <p>{subject.learningGoal}</p>
    <div className="tile-meta"><span>{subject.topics.length} módulos</span><span>{subject.questions.length} questões</span></div>
  </button>
}

function Settings({uiMode,setUiMode,theme,setTheme}){
  return <div className="page settings-page">
    <div className="eyebrow">SISTEMA</div><h1 className="page-h1">Configurações</h1><p className="page-lead">A interface se adapta sem mudar o conteúdo. Suas preferências ficam salvas neste dispositivo.</p>
    <section className="settings-group"><div className="setting-title">Dispositivo</div><div className="setting-desc">Escolha qual experiência você quer priorizar, independentemente da largura da tela.</div><div className="choice-grid">
      <Choice active={uiMode==='desktop'} onClick={()=>setUiMode('desktop')} icon="▣" title="Computador" desc="Painel amplo, navegação lateral e leitura em coluna larga."/>
      <Choice active={uiMode==='mobile'} onClick={()=>setUiMode('mobile')} icon="▯" title="Celular" desc="Uma coluna, toque, navegação compacta e leitura focada."/>
    </div></section>
    <section className="settings-group"><div className="setting-title">Aparência</div><div className="setting-desc">O tema altera superfícies, textos, controles, diagramas e estados da interface.</div><div className="choice-grid">
      <Choice active={theme==='dark'} onClick={()=>setTheme('dark')} icon="◐" title="Escuro" desc="Contraste profundo para uso noturno."/>
      <Choice active={theme==='light'} onClick={()=>setTheme('light')} icon="○" title="Claro" desc="Superfícies claras para leitura durante o dia."/>
    </div></section>
    <div className="settings-note"><strong>Arquitetura atual</strong><span>React + Vite · estado local persistente · preparado para backend e sincronização futuros.</span></div>
  </div>
}
function Choice({active,onClick,icon,title,desc}){return <button className={`choice ${active?'active':''}`} onClick={onClick}><span className="choice-icon">{icon}</span><span><strong>{title}</strong><small>{desc}</small></span>{active && <b>✓</b>}</button>}

function SubjectView({subject,tab,setTab,topicIdx,setTopicIdx,questionIdx,setQuestionIdx,answers,setAnswers,srs,rate,openTerms,setOpenTerms}){
  return <div className="page subject-page">
    <div className="subject-head"><div><span className="eyebrow">{subject.tag}</span><h1 className="page-h1">{subject.name}</h1><p className="page-lead">{subject.learningGoal}</p></div><div className="subject-stat"><strong>{subject.topics.length}</strong><span>módulos</span></div></div>
    <div className="tabs"><button className={tab==='learn'?'active':''} onClick={()=>setTab('learn')}>Aprender</button><button className={tab==='practice'?'active':''} onClick={()=>setTab('practice')}>Praticar</button><button className={tab==='review'?'active':''} onClick={()=>setTab('review')}>Revisar</button></div>
    {tab==='learn' && <Learn subject={subject} topicIdx={topicIdx} setTopicIdx={setTopicIdx}/>} 
    {tab==='practice' && <Practice subject={subject} idx={questionIdx} setIdx={setQuestionIdx} answers={answers} setAnswers={setAnswers}/>} 
    {tab==='review' && <Review subject={subject} srs={srs} rate={rate} openTerms={openTerms} setOpenTerms={setOpenTerms}/>} 
  </div>
}

function Learn({subject,topicIdx,setTopicIdx}){
  const topic=subject.topics[topicIdx];
  return <div className="learn-layout">
    <aside className="module-index"><div className="module-index-title">Módulos</div>{subject.topics.map((t,i)=><button key={t.id} className={i===topicIdx?'active':''} onClick={()=>setTopicIdx(i)}><span>{String(i+1).padStart(2,'0')}</span><em>{t.title}</em></button>)}</aside>
    <div className="study-pane">
      <div className="module-meta"><span>MÓDULO {String(topicIdx+1).padStart(2,'0')} / {subject.topics.length}</span><span>Aprender</span></div>
      <h2>{topic.title}</h2><p className="topic-sub">{topic.sub}</p>
      <div className="study-content" dangerouslySetInnerHTML={{__html:adaptThemeHtml(topic.html)}} />
      <div className="module-nav"><button disabled={topicIdx===0} onClick={()=>{setTopicIdx(i=>Math.max(0,i-1));scrollPaneTop()}}>← Anterior</button><button disabled={topicIdx===subject.topics.length-1} onClick={()=>{setTopicIdx(i=>Math.min(subject.topics.length-1,i+1));scrollPaneTop()}}>Próximo módulo →</button></div>
    </div>
  </div>
}
function scrollPaneTop(){ requestAnimationFrame(()=>{document.querySelector('.viewport')?.scrollTo({top:0,behavior:'smooth'}); document.querySelector('.study-pane')?.scrollTo?.({top:0});}); }

function Practice({subject,idx,setIdx,answers,setAnswers}){
  const qs=subject.questions; const q=qs[idx]; const answered=answers[idx];
  return <div className="practice-pane"><div className="practice-head"><div><span className="eyebrow">PRÁTICA</span><h2>Teste de entendimento</h2></div><span>{idx+1} / {qs.length}</span></div>
    <div className="progress-track"><div style={{width:`${((idx+1)/qs.length)*100}%`}}/></div>
    <article className="question-card"><div className="q-kind">{q.challenge?'INTEGRAÇÃO':'FIXAÇÃO'} · {q.type==='open'?'RESPOSTA ABERTA':'MÚLTIPLA ESCOLHA'}</div><h3>{q.q}</h3>
      {q.type==='open' ? <OpenQuestion q={q} answered={answered} onAnswer={(v)=>setAnswers({...answers,[idx]:{value:v,show:answered?.show||false}})} /> : <MCQuestion q={q} answered={answered} onAnswer={(v)=>setAnswers({...answers,[idx]:v})}/>} 
    </article>
    <div className="question-nav"><button disabled={idx===0} onClick={()=>setIdx(i=>i-1)}>←</button><button disabled={idx===qs.length-1} onClick={()=>setIdx(i=>i+1)}>Próxima →</button></div>
  </div>
}
function MCQuestion({q,answered,onAnswer}){return <div className="options">{q.options.map((o,i)=><button key={i} className={`option ${answered!==undefined && i===q.correct?'correct':''} ${answered===i && i!==q.correct?'wrong':''}`} disabled={answered!==undefined} onClick={()=>onAnswer(i)}><span>{String.fromCharCode(65+i)}</span><em>{o}</em></button>)}{answered!==undefined && <div className="feedback"><strong>{answered===q.correct?'Correto.':'Revise este raciocínio.'}</strong><span>{q.explain}</span></div>}</div>}
function OpenQuestion({q,answered,onAnswer}){const [v,setV]=useState(answered?.value||'');const [show,setShow]=useState(false); return <div className="open-wrap"><textarea value={v} onChange={e=>{setV(e.target.value);onAnswer(e.target.value)}} placeholder="Escreva com suas próprias palavras..."/><button className="secondary-btn" onClick={()=>setShow(!show)}>{show?'Ocultar resposta-modelo':'Comparar com resposta-modelo'}</button>{show&&<div className="model-answer"><strong>Resposta-modelo</strong><p>{q.model}</p><div className="term-list">{q.terms?.map(t=><span key={t}>{t}</span>)}</div></div>}</div>}

function Review({subject,srs,rate,openTerms,setOpenTerms}){
  const cards=subject.flashcards; const keywords=subject.keywords;
  return <div className="review-pane"><div className="review-hero"><div><span className="eyebrow">REVISAR</span><h2>Recuperar, não reler.</h2><p>Use o esforço de lembrar antes de olhar a resposta.</p></div></div>
    <section className="review-section"><div className="review-section-head"><div><span className="eyebrow">FLASHCARDS</span><h3>Memória ativa</h3></div><span>{cards.length} itens</span></div><div className="flash-grid">{cards.map(c=><Flash key={c.id} card={c} state={srs?.[subject.id]?.flashcards?.[c.id]} onRate={r=>rate(subject.id,'flashcards',c.id,r)}/>)}</div></section>
    <section className="review-section"><div className="review-section-head"><div><span className="eyebrow">CONCEITOS</span><h3>Termos essenciais</h3></div><span>{keywords.length} itens</span></div><div className="keyword-list">{keywords.map(k=>{const key=subject.id+':'+k.id; const open=!!openTerms[key]; return <div className={`keyword ${open?'open':''}`} key={k.id}><button onClick={()=>setOpenTerms({...openTerms,[key]:!open})}><span>{k.term}</span><span>＋</span></button><div>{k.def}<div className="keyword-rate"><button onClick={()=>rate(subject.id,'keywords',k.id,false)}>Não lembrei</button><button onClick={()=>rate(subject.id,'keywords',k.id,true)}>Lembrei</button></div></div></div>})}</div></section>
  </div>
}
function Flash({card,state,onRate}){const [flip,setFlip]=useState(false);return <div className="flash-card"><div className="flash-tag">CAIXA {(state?.box??0)+1}/5</div><button className={`flash-face ${flip?'flipped':''}`} onClick={()=>setFlip(!flip)}><span className="flash-label">{flip?'RESPOSTA':'TENTE LEMBRAR'}</span><strong>{flip?card.back:card.front}</strong></button>{flip&&<div className="flash-actions"><button onClick={()=>onRate(false)}>Não lembrei</button><button onClick={()=>onRate(true)}>Lembrei</button></div>}</div>}

function isDue(sid,kind,id,srs){const x=srs?.[sid]?.[kind]?.[id]; return !x?.due || x.due<=today();}
function adaptThemeHtml(html){return html.replaceAll('#F8F7F1','var(--diagram-surface)').replaceAll('#374151','var(--diagram-ink)').replaceAll('#5B6472','var(--diagram-muted)').replaceAll('#D7DCE4','var(--diagram-line)').replaceAll('#9AA4B3','var(--diagram-line)').replaceAll('#6B7280','var(--diagram-muted)').replaceAll('#475569','var(--diagram-muted)');}

createRoot(document.getElementById('root')).render(<App/>);
