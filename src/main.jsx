import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SUBJECTS } from './content.js';
import './styles.css';

const STORAGE = 'nexo:v6.2.0';
const LEGACY_STORAGES = ['nexo:v6.1.4','nexo:v6.1.1','nexo:v4'];
const BOX_INTERVALS = [1,3,7,14,30];
const today = () => { const d=new Date(); const p=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`; };
const load = (k, fallback) => { try {
  const current = localStorage.getItem(`${STORAGE}:${k}`);
  if (current) return JSON.parse(current);
  for (const legacyStorage of LEGACY_STORAGES) {
    const legacy = localStorage.getItem(`${legacyStorage}:${k}`);
    if (legacy) return JSON.parse(legacy);
  }
  return fallback;
} catch { return fallback; } };
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
  const [sidebarCollapsed,setSidebarCollapsed] = useState(load('sidebarCollapsed',false));
  const [calendarEvents,setCalendarEvents] = useState(load('calendarEvents',[]));

  useEffect(()=>save('uiMode',uiMode),[uiMode]);
  useEffect(()=>save('theme',theme),[theme]);
  useEffect(()=>save('srs',srs),[srs]);
  useEffect(()=>save('sidebarCollapsed',sidebarCollapsed),[sidebarCollapsed]);
  useEffect(()=>save('calendarEvents',calendarEvents),[calendarEvents]);
  if(!session) return <Auth mode={authMode} setMode={setAuthMode} onLogin={u=>setSession(u)}/>;

  const subject = SUBJECTS.find(s=>s.id===page.subjectId) || null;
  const goHome = () => { setPage({name:'home',subjectId:null}); setSubjectTab('learn'); };
  const openDisciplines = () => { setPage({name:'disciplines',subjectId:null}); };
  const openSubject = (id) => { setPage({name:'subject',subjectId:id}); setSubjectTab('learn'); setTopicIdx(0); setQuestionIdx(0); setAnswers({}); };
  const openSettings = () => setPage({name:'settings',subjectId:null});
  const openFlashcards = () => setPage({name:'flashcards',subjectId:null});
  const openCalendar = () => setPage({name:'calendar',subjectId:null});
  const openPractice = () => { setSubjectTab('practice'); setQuestionIdx(0); setAnswers({}); };
  const openReview = () => { setSubjectTab('review'); setOpenTerms({}); };

  function rateFlashcard(subjectId,id,grade){
    setSrs(prev=>{const next=structuredClone(prev);next[subjectId] ??= {flashcards:{},keywords:{}};next[subjectId].flashcards ??= {};next[subjectId].flashcards[id]=nextReviewState(next[subjectId].flashcards[id],grade,SUBJECTS.find(s=>s.id===subjectId)?.flashcards.find(f=>f.id===id));return next;});
  }

  return <div className={`app theme-${theme} mode-${uiMode} ${sidebarCollapsed?'sidebar-collapsed':''}`}>
    <div className="shell">
      <aside className="sidebar">
        <div className="brand" onClick={goHome} aria-label="NEXO"><div className="brand-lockup"><span className="brand-n">N</span><span className="brand-exo">EXO</span></div><div className="brand-sub">estudos por conexões</div></div>
        <button className="sidebar-toggle" onClick={()=>setSidebarCollapsed(v=>!v)} aria-label={sidebarCollapsed?'Expandir barra lateral':'Recolher barra lateral'}><span className="sidebar-chevron">{sidebarCollapsed?'›':'‹'}</span></button>
        <nav className="side-nav">
          <NavButton active={page.name==='home'} icon="⌂" label="Início" onClick={goHome}/>
          <NavButton active={page.name==='disciplines'} icon="◫" label="Disciplinas" onClick={openDisciplines}/>
          <NavButton active={page.name==='flashcards'} icon="▣" label="Flashcards" onClick={openFlashcards}/>
          <NavButton active={page.name==='calendar'} icon="□" label="Calendário" onClick={openCalendar}/>
          <NavButton active={page.name==='settings'} icon="⚙" label="Configurações" onClick={openSettings}/>
        </nav>
        <div className="side-foot">v6.2.0 · universal</div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="topbar-mobile-brand"><span className="brand-word"><b>N</b><span>EXO</span></span></div>
          <div className="topbar-actions">
            {page.name==='subject' && <button className="ghost-btn" onClick={goHome}>← Início</button>}
            <button className="icon-btn" onClick={openSettings} title="Configurações">⚙</button>
          </div>
        </header>
        <div className="viewport">
          {page.name==='home' && <Home subjects={SUBJECTS} onOpen={openSubject} srs={srs}/>} 
          {page.name==='disciplines' && <Disciplines subjects={SUBJECTS} onOpen={openSubject}/>} 
          {page.name==='flashcards' && <FlashcardsHub subjects={SUBJECTS} srs={srs} rateFlashcard={rateFlashcard}/>}
          {page.name==='calendar' && <Calendar subjects={SUBJECTS} events={calendarEvents} setEvents={setCalendarEvents}/>} 
          {page.name==='settings' && <Settings uiMode={uiMode} setUiMode={setUiMode} theme={theme} setTheme={setTheme}/>} 
          {page.name==='subject' && subject && <SubjectView subject={subject} tab={subjectTab} setTab={setSubjectTab} topicIdx={topicIdx} setTopicIdx={setTopicIdx} questionIdx={questionIdx} setQuestionIdx={setQuestionIdx} answers={answers} setAnswers={setAnswers} srs={srs} rateFlashcard={rateFlashcard} openTerms={openTerms} setOpenTerms={setOpenTerms}/>} 
        </div>
        <MobileNav page={page} onHome={goHome} onDisciplines={openDisciplines} onFlashcards={openFlashcards} onCalendar={openCalendar} onSettings={openSettings}/>
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
function MobileNav({page,onHome,onDisciplines,onFlashcards,onCalendar,onSettings}){return <nav className="mobile-nav"><button className={page.name==='home'?'active':''} onClick={onHome}><span>⌂</span>Início</button><button className={page.name==='disciplines'?'active':''} onClick={onDisciplines}><span>◫</span>Disciplinas</button><button className={page.name==='flashcards'?'active':''} onClick={onFlashcards}><span>▣</span>Cards</button><button className={page.name==='calendar'?'active':''} onClick={onCalendar}><span>□</span>Agenda</button><button className={page.name==='settings'?'active':''} onClick={onSettings}><span>⚙</span>Config.</button></nav>}

function NavButton({active,icon,label,onClick}){ return <button className={`nav-item ${active?'active':''}`} onClick={onClick}><span className="nav-icon">{icon}</span><span>{label}</span></button> }

function Home({subjects,onOpen,srs}){
  const totals = useMemo(()=>subjects.reduce((a,s)=>{a.topics+=s.topics.length;a.questions+=s.questions.length;a.cards+=s.flashcards.length+s.keywords.length;return a},{topics:0,questions:0,cards:0}),[subjects]);
  const due = subjects.reduce((n,s)=>n+s.flashcards.filter(f=>isDue(s.id,'flashcards',f.id,srs)).length+s.keywords.filter(k=>isDue(s.id,'keywords',k.id,srs)).length,0);
  return <div className="page home-page">
    <section className="hero-grid home-hero-clean">
      <div><div className="eyebrow">NEXO</div><h1>Entender primeiro.<br/><em>Conectar depois.</em></h1><p>Um espaço para estudar por mecanismos, relações e recuperação ativa, sem transformar aprendizado em uma coleção de números.</p></div>
    </section>
    <section className="today-panel">
      <div className="today-panel-main"><span className="eyebrow">HOJE</span><div className="today-number">{due}</div><div><h3>{due===1?'item para revisar':due>1?'itens para revisar':'tudo em dia'}</h3><p>{due?'Comece pelo que já está pronto para recuperação. A fila se reorganiza conforme seu desempenho.':'Não há itens vencidos. Você pode seguir para o conteúdo novo ou praticar.'}</p></div></div>
      <div className="today-panel-side"><span>RECUPERAÇÃO</span><strong>{due ? 'Prioridade ativa' : 'Sem pendências'}</strong><small>O sistema ordena seus itens pelo histórico recente.</small></div>
    </section>
    <section className="metric-overview">
      <OverviewMetric value={subjects.length} label="disciplinas" />
      <OverviewMetric value={totals.topics} label="módulos" />
      <OverviewMetric value={totals.questions} label="questões" />
    </section>
    <section className="section-head home-section-head"><div><span className="eyebrow">DISCIPLINAS</span><h2>Seus estudos</h2></div><span className="section-count">{subjects.length} {subjects.length===1?'disciplina':'disciplinas'}</span></section>
    <div className={`subjects-grid count-${subjects.length} ${subjects.length%2?'odd':''}`}>
      {subjects.map(s=><SubjectTile key={s.id} subject={s} onClick={()=>onOpen(s.id)} srs={srs}/>)}
    </div>
  </div>
}
function OverviewMetric({value,label}){return <div className="overview-metric"><strong>{value}</strong><span>{label}</span></div>}

function Disciplines({subjects,onOpen}){
  const [query,setQuery]=useState('');
  const q=query.trim().toLowerCase();
  const filtered=subjects.filter(s=>!q || `${s.name} ${s.tag} ${s.topics.map(t=>t.title).join(' ')}`.toLowerCase().includes(q));
  return <div className="page disciplines-page">
    <div className="disciplines-intro"><div><span className="eyebrow">MAPA DE ESTUDOS</span><h1 className="page-h1">Disciplinas</h1><p className="page-lead">Cada disciplina reúne seus módulos. Pesquise pelo nome da disciplina ou por um módulo para encontrar onde estudar.</p></div></div>
    <label className="discipline-search"><span>Pesquisar</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Ex.: climatologia, atmosfera..." /></label>
    <div className="discipline-list">{filtered.map(subject=><button className="discipline-row" key={subject.id} onClick={()=>onOpen(subject.id)}><div><span className="tile-tag">{subject.tag.split(' · ')[0]}</span><h3>{subject.name}</h3><p>{subject.learningGoal}</p></div><div className="discipline-meta"><span>{subject.topics.length} módulos</span><span>{subject.questions.length} questões</span><b>↗</b></div></button>)}</div>
    {!filtered.length && <div className="empty-state"><strong>Nenhuma disciplina encontrada.</strong><span>Tente outro nome ou procure por um módulo.</span></div>}
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

function isoDay(d){ const p=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`; }
function parseDay(s){ const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d,12); }
function monthLabel(d){ return d.toLocaleDateString('pt-BR',{month:'long',year:'numeric'}).replace(/^./,c=>c.toUpperCase()); }
function Calendar({subjects,events,setEvents}){
  const now=new Date(); now.setHours(12,0,0,0);
  const [cursor,setCursor]=useState(new Date(now.getFullYear(),now.getMonth(),1,12));
  const [selected,setSelected]=useState(isoDay(now));
  const [showForm,setShowForm]=useState(false);
  const [notifications,setNotifications]=useState('idle');
  const [form,setForm]=useState({title:'',date:selected,start:'',duration:'60',type:'estudo',subjectId:subjects[0]?.id||'',topicId:subjects[0]?.topics[0]?.id||'',notes:'',reminder:'15',repeatWeekly:false});
  const first=new Date(cursor.getFullYear(),cursor.getMonth(),1,12), offset=(first.getDay()+6)%7;
  const daysIn=new Date(cursor.getFullYear(),cursor.getMonth()+1,0,12).getDate();
  const cells=[]; for(let i=0;i<offset;i++) cells.push(null); for(let d=1;d<=daysIn;d++) cells.push(new Date(cursor.getFullYear(),cursor.getMonth(),d,12)); while(cells.length%7) cells.push(null);
  const dayEvents=(day)=>events.filter(e=>e.date===isoDay(day)).sort((a,b)=>(a.start||'99:99').localeCompare(b.start||'99:99'));
  const selectedEvents=events.filter(e=>e.date===selected).sort((a,b)=>(a.start||'99:99').localeCompare(b.start||'99:99'));
  const subject=subjects.find(s=>s.id===form.subjectId)||subjects[0];
  const selectedTopic=subject?.topics.find(t=>t.id===form.topicId)||subject?.topics[0];
  const setField=(k,v)=>setForm(f=>{const next={...f,[k]:v}; if(k==='subjectId'){const s=subjects.find(x=>x.id===v);next.topicId=s?.topics[0]?.id||'';} return next;});
  const openNew=(date=selected)=>{setSelected(date);setForm({title:'',date,start:'',duration:'60',type:'estudo',subjectId:subjects[0]?.id||'',topicId:subjects[0]?.topics[0]?.id||'',notes:'',reminder:'15',repeatWeekly:false});setShowForm(true);};
  const saveEvent=(e)=>{e.preventDefault(); if(!form.title.trim()||!form.date)return; const base=Date.now(); const dates=form.repeatWeekly?Array.from({length:8},(_,i)=>{const d=parseDay(form.date);d.setDate(d.getDate()+i*7);return isoDay(d)}):[form.date]; const created=dates.map((date,i)=>({...form,id:`ev-${base}-${i}`,date,title:form.title.trim(),createdAt:base+i,repeatWeekly:!!form.repeatWeekly})); setEvents(prev=>[...prev,...created]); setSelected(form.date); setShowForm(false);};
  const removeEvent=(id)=>setEvents(prev=>prev.filter(e=>e.id!==id));
  const enableNotifications=async()=>{ if(!('Notification' in window)){setNotifications('unsupported');return;} const p=await Notification.requestPermission(); setNotifications(p); if(p==='granted') new Notification('NEXO · lembretes ativos',{body:'Os lembretes serão verificados enquanto o NEXO estiver aberto.'}); };
  useEffect(()=>{ if(!('Notification' in window)||Notification.permission!=='granted')return; const tick=()=>{const now=new Date(); events.forEach(ev=>{if(!ev.start||!ev.date)return; const start=new Date(`${ev.date}T${ev.start}:00`); start.setMinutes(start.getMinutes()-Number(ev.reminder||0)); const diff=Math.abs(now-start); if(isoDay(start)===isoDay(now)&&diff<45000&&!sessionStorage.getItem(`nexo:notice:${ev.id}:${ev.date}:${start.getHours()}:${start.getMinutes()}`)){new Notification(`NEXO · ${ev.title}`,{body:`Lembrete: ${ev.type==='prova'?'Prova':ev.type==='revisao'?'Revisão':ev.type==='questoes'?'Questões':'Estudo'}${ev.subjectId?' · '+(subjects.find(s=>s.id===ev.subjectId)?.name||''):''}`});sessionStorage.setItem(`nexo:notice:${ev.id}:${ev.date}:${start.getHours()}:${start.getMinutes()}`,'1');}})}; const timer=setInterval(tick,30000); tick(); return()=>clearInterval(timer); },[events,subjects]);
  return <div className="page calendar-page">
    <div className="page-head-row calendar-head"><div><span className="eyebrow">PLANEJAMENTO</span><h1 className="page-h1">Calendário</h1><p className="page-lead">Organize provas, módulos, questões, revisões e blocos de estudo em um único lugar.</p></div><div className="calendar-head-actions"><button className="primary-btn" onClick={()=>openNew(selected)}>+ Nova tarefa</button><button className={`secondary-btn ${notifications==='granted'?'is-active':''}`} onClick={enableNotifications}>{notifications==='granted'?'Lembretes ativos':'Ativar lembretes'}</button></div></div>
    <section className="calendar-layout">
      <div className="calendar-main"><div className="calendar-toolbar"><button className="icon-btn" onClick={()=>setCursor(new Date(cursor.getFullYear(),cursor.getMonth()-1,1,12))}>‹</button><strong>{monthLabel(cursor)}</strong><button className="icon-btn" onClick={()=>setCursor(new Date(cursor.getFullYear(),cursor.getMonth()+1,1,12))}>›</button><button className="today-link" onClick={()=>{setCursor(new Date(now.getFullYear(),now.getMonth(),1,12));setSelected(isoDay(now));}}>Hoje</button></div><div className="calendar-weekdays">{['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(x=><span key={x}>{x}</span>)}</div><div className="calendar-grid">{cells.map((d,i)=>{const key=d?isoDay(d):`empty-${i}`; const evs=d?dayEvents(d):[]; const isSel=d&&isoDay(d)===selected; const isToday=d&&isoDay(d)===isoDay(now); return <button key={key} className={`calendar-day ${!d?'empty':''} ${isSel?'selected':''} ${isToday?'today':''}`} onClick={()=>d&&setSelected(isoDay(d))} disabled={!d}><span className="day-number">{d?d.getDate():''}</span>{d&&evs.slice(0,3).map(ev=><span key={ev.id} className={`day-event type-${ev.type}`}>{ev.start&&<b>{ev.start}</b>} {ev.title}</span>)}{d&&evs.length>3&&<small>+{evs.length-3}</small>}</button>})}</div></div>
      <aside className="calendar-side"><div className="calendar-side-head"><div><span className="eyebrow">AGENDA DO DIA</span><h3>{parseDay(selected).toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}</h3></div><button className="icon-btn" onClick={()=>openNew(selected)}>+</button></div>{selectedEvents.length?<div className="agenda-list">{selectedEvents.map(ev=><article className="agenda-item" key={ev.id}><div className={`agenda-dot type-${ev.type}`}></div><div className="agenda-copy"><strong>{ev.title}</strong><span>{ev.start||'Sem horário'} · {ev.duration||60} min</span>{ev.subjectId&&<small>{subjects.find(s=>s.id===ev.subjectId)?.name}{ev.topicId?' · '+(subjects.find(s=>s.id===ev.subjectId)?.topics.find(t=>t.id===ev.topicId)?.title||''):''}</small>}{ev.notes&&<small>{ev.notes}</small>}</div><button className="icon-btn subtle" onClick={()=>removeEvent(ev.id)} aria-label="Excluir tarefa">×</button></article>)}</div>:<div className="calendar-empty"><strong>Sem tarefas neste dia.</strong><span>Use o calendário para reservar tempo para conteúdo, questões, revisão ou prova.</span><button className="secondary-btn" onClick={()=>openNew(selected)}>Adicionar tarefa</button></div>}</aside>
    </section>
    <section className="calendar-routines"><div><span className="eyebrow">ESTRUTURA DE ESTUDO</span><h3>O calendário conecta intenção e execução</h3><p>Registre o que vai estudar e a tarefa deixa de ser uma promessa solta. Ao abrir uma tarefa de estudo, o NEXO já associa disciplina e módulo.</p></div><div className="routine-points"><span><b>Estudo</b> reservar tempo para um módulo ou bloco</span><span><b>Questões</b> separar treino específico</span><span><b>Revisão</b> criar espaço para recuperação</span><span><b>Prova</b> marcar datas que mudam a prioridade</span></div></section>
    {showForm&&<div className="calendar-modal" role="dialog" aria-modal="true"><form className="calendar-form" onSubmit={saveEvent}><div className="calendar-form-head"><div><span className="eyebrow">NOVA TAREFA</span><h3>O que você vai fazer?</h3></div><button type="button" className="icon-btn" onClick={()=>setShowForm(false)}>×</button></div><label>Título<input autoFocus value={form.title} onChange={e=>setField('title',e.target.value)} placeholder="Ex.: Módulo 4 · Fatores Climáticos"/></label><div className="form-grid-2"><label>Data<input type="date" value={form.date} onChange={e=>setField('date',e.target.value)}/></label><label>Horário<input type="time" value={form.start} onChange={e=>setField('start',e.target.value)}/></label></div><div className="form-grid-2"><label>Tipo<select value={form.type} onChange={e=>setField('type',e.target.value)}><option value="estudo">Estudo</option><option value="questoes">Questões</option><option value="revisao">Revisão</option><option value="prova">Prova</option><option value="rotina">Rotina</option></select></label><label>Duração<input type="number" min="5" step="5" value={form.duration} onChange={e=>setField('duration',e.target.value)}/></label></div><div className="form-grid-2"><label>Disciplina<select value={form.subjectId} onChange={e=>setField('subjectId',e.target.value)}>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>Módulo<select value={form.topicId} onChange={e=>setField('topicId',e.target.value)}>{(subject?.topics||[]).map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</select></label></div><label>Observação<textarea value={form.notes} onChange={e=>setField('notes',e.target.value)} placeholder="O que exatamente você pretende fazer?"/></label><div className="form-grid-2"><label>Lembrete<select value={form.reminder} onChange={e=>setField('reminder',e.target.value)}><option value="0">No horário</option><option value="15">15 min antes</option><option value="30">30 min antes</option><option value="60">1 h antes</option></select></label><label className="calendar-check"><span>Repetição</span><span><input type="checkbox" checked={!!form.repeatWeekly} onChange={e=>setField('repeatWeekly',e.target.checked)}/> repetir toda semana por 8 semanas</span></label></div><div className="calendar-form-actions"><button type="button" className="secondary-btn" onClick={()=>setShowForm(false)}>Cancelar</button><button type="submit" className="primary-btn">Salvar tarefa</button></div><small className="calendar-disclaimer">Lembretes usam a API de notificações do navegador e são verificados enquanto o NEXO estiver aberto.</small></form></div>}
  </div>
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

function SubjectView({subject,tab,setTab,topicIdx,setTopicIdx,questionIdx,setQuestionIdx,answers,setAnswers,srs,rateFlashcard,openTerms,setOpenTerms}){
  return <div className="page subject-page">
    <div className="subject-head"><div><span className="eyebrow">{subject.tag}</span><h1 className="page-h1">{subject.name}</h1><p className="page-lead">{subject.learningGoal}</p></div><div className="subject-stat"><strong>{subject.topics.length}</strong><span>módulos</span></div></div>
    <div className="tabs"><button className={tab==='learn'?'active':''} onClick={()=>setTab('learn')}>Aprender</button><button className={tab==='practice'?'active':''} onClick={()=>setTab('practice')}>Praticar</button><button className={tab==='review'?'active':''} onClick={()=>setTab('review')}>Revisar</button></div>
    {tab==='learn' && <Learn subject={subject} topicIdx={topicIdx} setTopicIdx={setTopicIdx}/>} 
    {tab==='practice' && <Practice subject={subject} idx={questionIdx} setIdx={setQuestionIdx} answers={answers} setAnswers={setAnswers}/>} 
    {tab==='review' && <Review subject={subject} srs={srs} rateFlashcard={rateFlashcard} openTerms={openTerms} setOpenTerms={setOpenTerms}/>} 
  </div>
}

function Learn({subject,topicIdx,setTopicIdx}){
  const topic=subject.topics[topicIdx];
  const firstRender=useRef(true);
  const [quizAnswers,setQuizAnswers]=useState({});
  const [modulesCollapsed,setModulesCollapsed]=useState(false);
  useEffect(()=>{setQuizAnswers({});},[topicIdx]);
  useEffect(()=>{
    if(firstRender.current){ firstRender.current=false; return; }
    requestAnimationFrame(()=>{
      const title=document.querySelector('.study-pane h2');
      if(!title) return;
      const top=title.getBoundingClientRect().top + window.scrollY - (window.innerWidth<=900 ? 92 : 70);
      window.scrollTo({top:Math.max(0,top),behavior:'smooth'});
    });
  },[topicIdx]);
  const miniQuiz=(topic.quiz||[]).slice(0,4);
  const progress=((topicIdx+1)/subject.topics.length)*100;
  return <div className={`learn-layout ${modulesCollapsed?'modules-collapsed':''}`}>
    <aside className="module-index" aria-label="Módulos">
      <div className="module-index-head">
        <div><div className="module-index-title">Módulos</div><span>{topicIdx+1} de {subject.topics.length}</span></div>
        <button className="module-collapse-btn icon-only" onClick={()=>setModulesCollapsed(v=>!v)} aria-label={modulesCollapsed?'Mostrar nomes dos módulos':'Ocultar nomes dos módulos'} title={modulesCollapsed?'Expandir módulos':'Recolher módulos'}><span>{modulesCollapsed?'›':'‹'}</span></button>
      </div>
      <div className="module-index-progress"><i style={{width:`${progress}%`}}/></div>
      <div className="module-index-list">
        {subject.topics.map((t,i)=><button key={t.id} className={i===topicIdx?'active':''} onClick={()=>setTopicIdx(i)} title={t.title} aria-label={`Módulo ${i+1}: ${t.title}`}><span>{String(i+1).padStart(2,'0')}</span><em>{t.title}</em></button>)}
      </div>
    </aside>
    <div className="mobile-module-picker">
      <label htmlFor="module-picker">Módulo atual</label>
      <select id="module-picker" value={topicIdx} onChange={e=>setTopicIdx(Number(e.target.value))}>
        {subject.topics.map((t,i)=><option key={t.id} value={i}>{String(i+1).padStart(2,'0')} · {t.title}</option>)}
      </select>
    </div>
    <div className="study-pane">
      <div className="study-kicker-row"><div className="module-meta"><span>MÓDULO {String(topicIdx+1).padStart(2,'0')} / {subject.topics.length}</span><span>APRENDER</span></div><span className="study-progress-label">{Math.round(progress)}%</span></div>
      <div className="study-intro">
        <span className="study-intro-label">IDEIA-GUIA</span>
        <h2>{topic.title}</h2>
        <p className="topic-sub">{topic.sub}</p>
      </div>
      <div className="study-content new-study-surface" dangerouslySetInnerHTML={{__html:adaptThemeHtml(topic.html)}} />
      {miniQuiz.length>0 && <section className="module-check redesigned-check"><div className="module-check-head"><div><span className="eyebrow">RECUPERAÇÃO ATIVA</span><h3>Antes de seguir</h3><p>Recupere a ideia principal sem voltar ao texto. O objetivo é testar o entendimento, não reconhecer a frase.</p></div><span>{miniQuiz.length} questões</span></div><div className="module-check-list">{miniQuiz.map((q,i)=><ModuleQuestion key={`${topic.id}-${i}`} q={q} answer={quizAnswers[i]} onAnswer={(v)=>setQuizAnswers(prev=>({...prev,[i]:v}))}/>)}</div></section>}
      <div className="module-nav"><button disabled={topicIdx===0} onClick={()=>setTopicIdx(i=>Math.max(0,i-1))}>← Anterior</button><button disabled={topicIdx===subject.topics.length-1} onClick={()=>setTopicIdx(i=>Math.min(subject.topics.length-1,i+1))}>Próximo módulo →</button></div>
    </div>
  </div>
}
function stableOptionOrder(q){
  const items=q.options.map((text,index)=>({text,index}));
  let seed=[...q.q].reduce((a,c)=>((a*31+c.charCodeAt(0))>>>0),2166136261);
  for(let i=items.length-1;i>0;i--){ seed=(seed*1664525+1013904223)>>>0; const j=seed%(i+1); [items[i],items[j]]=[items[j],items[i]]; }
  return {options:items.map(x=>x.text),originalIndex:items.map(x=>x.index),correct:items.findIndex(x=>x.index===q.correct),feedbackOrder:items.map(x=>x.index)};
}
function getOptionFeedback(q, originalIndex, feedback){
  if(feedback && feedback[originalIndex]) return feedback[originalIndex];
  const selected=q.options[originalIndex]; const correct=q.options[q.correct];
  if(originalIndex===q.correct) return q.explain;
  return `Você escolheu “${selected}”. Essa opção não explica o mecanismo pedido. A questão está apontando para “${correct}”: ${q.explain}`;
}
function ModuleQuestion({q,answer,onAnswer}){
  if(q.type==='open') return <article className="module-question open-module-question"><div className="module-question-index">FIXAÇÃO</div><h4>{q.q}</h4><textarea value={answer?.value||''} onChange={e=>onAnswer({value:e.target.value,show:false})} placeholder="Responda com suas palavras..."/><button className="module-answer-link" onClick={()=>onAnswer({value:answer?.value||'',show:!answer?.show})}>{answer?.show?'Ocultar resposta-modelo':'Ver resposta-modelo'}</button>{answer?.show&&<div className="module-model"><strong>Uma boa resposta</strong><p>{q.model}</p></div>}</article>;
  const view=stableOptionOrder(q); const chosen=answer?.value; const revealed=chosen!==undefined; const feedback=OPTION_FEEDBACK[q.q]||[];
  return <article className="module-question"><div className="module-question-top"><div><div className="module-question-index">FIXAÇÃO</div><h4>{q.q}</h4></div>{revealed&&<span className={chosen===view.correct?'mini-status good':'mini-status bad'}>{chosen===view.correct?'Certo':'Reveja'}</span>}</div><div className="module-question-options">{view.options.map((o,i)=>{const original=view.originalIndex[i];return <button key={i} disabled={revealed} className={`mini-option ${revealed&&i===view.correct?'correct':''} ${revealed&&chosen===i&&i!==view.correct?'wrong':''}`} onClick={()=>onAnswer({value:i})}><span>{String.fromCharCode(65+i)}</span>{o}</button>})}</div>{revealed&&<div className={`module-feedback ${chosen===view.correct?'is-correct':'is-wrong'}`}><strong>{chosen===view.correct?'Correto · Por quê?':'Sua resposta · o que revisar'}</strong><p>{getOptionFeedback(q,view.originalIndex[chosen],feedback)}</p>{chosen!==view.correct&&<><strong className="feedback-answer-label">Resposta correta</strong><p>{getOptionFeedback(q,q.correct,feedback)}</p></>}</div>}</article>
}

function Practice({subject,idx,setIdx,answers,setAnswers}){
  const qs=subject.questions; const q=qs[idx]; const answered=answers[idx];
  return <div className="practice-pane"><div className="practice-head"><div><span className="eyebrow">PRÁTICA</span><h2>Teste de entendimento</h2><p>Questões desenhadas para separar reconhecimento de compreensão.</p></div><span>{idx+1} / {qs.length}</span></div>
    <div className="progress-track"><div style={{width:`${((idx+1)/qs.length)*100}%`}}/></div>
    <article className="question-card"><div className="q-kind">{q.challenge?'INTEGRAÇÃO':'FIXAÇÃO'} · {q.type==='open'?'RESPOSTA ABERTA':'MÚLTIPLA ESCOLHA'}</div><h3>{q.q}</h3>
      {q.type==='open' ? <OpenQuestion q={q} answered={answered} onAnswer={(v)=>setAnswers({...answers,[idx]:{value:v,show:answered?.show||false}})} /> : <MCQuestion q={q} answered={answered} onAnswer={(v)=>setAnswers({...answers,[idx]:v})}/>} 
    </article>
    <div className="question-nav"><button disabled={idx===0} onClick={()=>setIdx(i=>i-1)}>←</button><button disabled={idx===qs.length-1} onClick={()=>setIdx(i=>i+1)}>Próxima →</button></div>
  </div>
}
const OPTION_FEEDBACK={
  "Uma estação registra 34 °C e chuva intensa em uma tarde. Qual conclusão é mais defensável?": [
    "Essa observação descreve um estado momentâneo da atmosfera. Uma única tarde não define o clima de uma cidade.",
    "Correto. Tempo descreve as condições atmosféricas em uma escala curta; clima exige séries mais longas e padrões estatísticos.",
    "Uma chuva intensa isolada não prova uma mudança climática. Para atribuição climática, é preciso analisar probabilidades e contexto físico e estatístico.",
    "Temperatura é uma variável usada tanto na descrição do tempo quanto do clima. O que muda é a escala e a forma de análise."
  ],
  "Uma cidade teve três anos seguidos acima da média histórica. Qual análise seria mais adequada antes de afirmar uma mudança permanente?": [
    "Um único ano recente não fornece contexto suficiente para avaliar uma tendência. Comparar apenas com o último ano pode esconder a variabilidade.",
    "Correto. É necessário olhar séries mais longas, variabilidade, tendências e outros indicadores antes de concluir que houve uma mudança permanente.",
    "Anos extremos continuam sendo dados válidos. O ponto é contextualizá-los estatisticamente, não descartá-los.",
    "A maior temperatura registrada é apenas um extremo. Ela não substitui a análise de médias, variabilidade e séries temporais."
  ],
  "Duas cidades têm a mesma temperatura média anual, mas uma possui verões e invernos muito mais contrastantes. Qual medida ajuda diretamente a perceber essa diferença?": [
    "Correto. A amplitude térmica mostra a diferença entre valores de temperatura e pode revelar contrastes que uma média anual esconde.",
    "Pressão atmosférica pode variar com tempo e altitude, mas não mede diretamente o contraste sazonal de temperatura descrito.",
    "Latitude influencia a distribuição de energia, mas duas cidades podem ter latitudes semelhantes ou respostas térmicas diferentes. Não é a medida pedida.",
    "Precipitação anual isolada informa quantidade de chuva, não o contraste entre temperaturas de verão e inverno."
  ],
  "Depois que ar úmido sobe ao encontrar uma serra, ocorre resfriamento e formação de nuvens. Que mecanismo de precipitação está mais diretamente envolvido?": [
    "A convecção envolve aquecimento e ascensão do ar, mas aqui o gatilho destacado é a barreira do relevo.",
    "Correto. A chuva orográfica ocorre quando o relevo força a ascensão do ar, favorecendo resfriamento, condensação e precipitação.",
    "Chuva frontal depende do encontro entre massas de ar com características diferentes. A serra, neste caso, é o mecanismo principal.",
    "O sistema pode envolver baixa pressão, mas a descrição da subida forçada por uma serra identifica diretamente o mecanismo orográfico."
  ],
  "Em qual camada ocorrem a maior parte das nuvens, chuvas e outros fenômenos meteorológicos próximos à superfície?": [
    "A estratosfera fica acima da troposfera e concentra a maior parte do ozônio, não a maior parte do tempo meteorológico cotidiano.",
    "Correto. A troposfera é a camada inferior e concentra a maior parte do vapor d’água e da dinâmica associada ao tempo meteorológico.",
    "A mesosfera está muito acima da região onde se concentra a maior parte dos fenômenos meteorológicos próximos à superfície.",
    "A exosfera é a camada mais externa e extremamente rarefeita, muito distante das condições do tempo meteorológico cotidiano."
  ],
  "Qual sequência apresenta as camadas principais da atmosfera a partir da superfície?": [
    "Correto. A ordem é troposfera, estratosfera, mesosfera, termosfera e exosfera.",
    "A estratosfera vem depois da troposfera, portanto a sequência começa fora de ordem.",
    "Mesosfera e estratosfera estão invertidas e a ordem final também não corresponde à organização vertical convencional.",
    "Essa sequência está invertida: a exosfera é a mais externa, não a camada mais próxima da superfície."
  ],
  "Por que conhecer a estrutura vertical da atmosfera ajuda na climatologia?": [
    "As camadas não têm comportamento idêntico. Precisamente por isso, tratá-las como uniformes levaria a conclusões erradas.",
    "Correto. Temperatura, composição e processos variam com a altitude, então separar as camadas ajuda a relacionar cada processo ao contexto correto.",
    "A exosfera não é a única camada relevante. Processos de clima e tempo envolvem principalmente a atmosfera inferior e suas interações.",
    "A altitude pode alterar temperatura, pressão, composição e dinâmica. Portanto, dizer que ela não altera processos está incorreto."
  ],
  "Por que a proximidade do oceano tende a reduzir a amplitude térmica?": [
    "A água não troca energia de forma simplesmente rápida; sua grande capacidade térmica faz com que aqueça e esfrie mais lentamente.",
    "Correto. O oceano armazena e libera energia lentamente, amortecendo variações de temperatura próximas a ele.",
    "O litoral não recebe necessariamente menos radiação solar. A explicação principal está na resposta térmica da água.",
    "O oceano não impede a circulação. Ele influencia temperatura, umidade e circulação, mas o ponto central aqui é sua capacidade térmica."
  ],
  "Um deserto costeiro pode ser muito seco mesmo estando próximo do oceano. Qual combinação ajuda a explicar esse caso?": [
    "Correto. Correntes frias e condições atmosféricas estáveis podem reduzir convecção e favorecer aridez, mesmo perto de uma grande fonte de água.",
    "A maritimidade pode elevar a umidade disponível, mas não elimina circulação e estabilidade atmosférica; estar no litoral não garante chuva.",
    "Latitude participa do balanço energético, mas dizer que ela não tem qualquer relação é incorreto e também não explica sozinha o caso.",
    "Albedo altera a reflexão de radiação, mas não produz chuva diretamente. É outro mecanismo físico."
  ],
  "Em um sistema de baixa pressão, qual processo favorece a formação de nuvens e chuva?": [
    "Subsidência é movimento descendente e tende a dificultar nuvens profundas, não favorecê-las.",
    "Correto. Convergência próxima à superfície favorece ascensão; o ar que sobe esfria e pode atingir saturação, formando nuvens e chuva.",
    "O vapor d’água é justamente um componente importante para condensação e precipitação. Sua ausência não favorece chuva.",
    "A descida do ar tende a estabilizar a atmosfera e dificultar convecção profunda, portanto não é a cadeia mais adequada."
  ],
  "O que caracteriza uma frente fria?": [
    "Essa descrição corresponde a uma frente quente, não a uma frente fria.",
    "Correto. Na frente fria, uma massa de ar mais frio avança e força o ar quente a subir, podendo gerar nuvens e precipitação.",
    "Alta pressão parada sobre o oceano não define uma frente fria.",
    "Um ciclone tropical pode interagir com frentes em certos contextos, mas atravessar montanhas não é a definição de frente fria."
  ],
  "O que caracteriza o El Niño no Pacífico equatorial?": [
    "Esse quadro corresponde ao resfriamento associado à La Niña, não ao El Niño.",
    "Correto. El Niño envolve aquecimento anômalo do Pacífico equatorial central e leste, acompanhado de mudanças atmosféricas.",
    "O ENSO não aquece todos os oceanos de forma uniforme. O sinal característico está concentrado no Pacífico equatorial.",
    "El Niño pertence ao sistema do Pacífico; não é definido por uma alteração isolada no Atlântico."
  ],
  "Qual relação entre El Niño e La Niña está correta?": [
    "Eles não são o mesmo estado: representam fases diferentes do ENSO.",
    "Correto. El Niño e La Niña são fases quente e fria, respectivamente, de um sistema acoplado oceano-atmosfera do Pacífico.",
    "As duas fases podem ocorrer em diferentes épocas do ano; a distinção não é definida por uma estação fixa.",
    "Ambas fazem parte do ENSO no Pacífico, não uma em cada oceano."
  ],
  "Qual cadeia representa melhor uma parte importante da intensificação de um ciclone tropical?": [
    "Correto. Oceano quente favorece evaporação; a condensação libera calor latente e ajuda a sustentar convecção e circulação.",
    "Água fria tende a reduzir evaporação e não explica fortalecimento automático de um ciclone tropical.",
    "Solo seco não fornece a fonte oceânica de energia que sustenta a convecção de um ciclone tropical.",
    "Subsidência associada à alta pressão tende a inibir convecção, portanto não descreve a intensificação proposta."
  ],
  "Por que um ciclone tropical tende a não se organizar exatamente sobre o Equador?": [
    "Há oceanos atravessados pelo Equador. A existência ou ausência de oceano não explica o limite de organização ciclônica.",
    "Correto. O efeito de Coriolis é muito fraco perto do Equador para fornecer a organização rotacional necessária ao sistema.",
    "O ar pode subir no Equador; a questão é a organização da circulação em rotação, não a impossibilidade de movimento ascendente.",
    "As águas equatoriais podem ser quentes. O problema não é a temperatura do oceano ser sempre baixa, mas o ambiente dinâmico."
  ],
  "Qual cadeia explica melhor o aquecimento global antropogênico?": [
    "Correto. Atividades humanas elevam gases de efeito estufa; isso altera o balanço de energia e contribui para o aquecimento do sistema climático.",
    "Mais chuva não é a cadeia física fundamental apresentada, e reduzir CO₂ não produz aquecimento direto desse modo.",
    "Vento não é a causa central do aquecimento global antropogênico, e menos vapor não descreve o mecanismo de efeito estufa.",
    "Menor radiação recebida não aumenta retenção de energia. A mudança relevante envolve a interação da radiação infravermelha com gases de efeito estufa."
  ],
  "Por que um evento extremo isolado não deve ser atribuído automaticamente à mudança climática?": [
    "O clima influencia extremos. O ponto é que um evento isolado não permite atribuir sua ocorrência automaticamente a uma única causa.",
    "Correto. Cada extremo resulta de contexto local e circulação, enquanto a mudança climática pode alterar probabilidades e intensidades; isso exige atribuição adequada.",
    "Eventos extremos podem ser observados e estudados. A dificuldade está em separar variabilidade, causas e alterações de probabilidade.",
    "Temperatura média é importante, mas extremos dependem também de circulação, umidade, solo, oceano e outros fatores."
  ]
};
function MCQuestion({q,answered,onAnswer}){
  const view=stableOptionOrder(q);
  const feedback=OPTION_FEEDBACK[q.q] || [];
  const selectedOriginal = answered===undefined ? undefined : view.originalIndex[answered];
  return <div className="options"><div className="options-grid">{view.options.map((o,i)=>{const selected=i===answered; const revealed=answered!==undefined; const cls=`option ${revealed&&i===view.correct?'correct':''} ${revealed&&selected&&i!==view.correct?'wrong':''} ${selected?'selected':''} ${revealed&&!selected&&i!==view.correct?'muted-option':''}`; return <button key={i} className={cls} disabled={revealed} onClick={()=>onAnswer(i)}><span>{String.fromCharCode(65+i)}</span><em>{o}</em>{revealed&&i===view.correct&&<b className="option-result">✓</b>}{revealed&&selected&&i!==view.correct&&<b className="option-result">×</b>}</button>})}</div>
    {answered!==undefined && <div className={`feedback ${answered===view.correct?'is-correct':'is-wrong'}`}><strong>{answered===view.correct?'Correto.':'Vamos revisar esta escolha.'}</strong><span>{getOptionFeedback(q,selectedOriginal,feedback)}</span>{answered!==view.correct && <div className="feedback-correct"><b>Por que a correta funciona</b><span>{getOptionFeedback(q,q.correct,feedback)}</span></div>}</div>}
  </div>
}

function OpenQuestion({q,answered,onAnswer}){const [v,setV]=useState(answered?.value||'');const [show,setShow]=useState(false); return <div className="open-wrap"><textarea value={v} onChange={e=>{setV(e.target.value);onAnswer(e.target.value)}} placeholder="Escreva com suas próprias palavras..."/><button className="secondary-btn" onClick={()=>setShow(!show)}>{show?'Ocultar resposta-modelo':'Comparar com resposta-modelo'}</button>{show&&<div className="model-answer"><strong>Resposta-modelo</strong><p>{q.model}</p><div className="term-list">{q.terms?.map(t=><span key={t}>{t}</span>)}</div></div>}</div>}

function localDateFromToday(days){
  const d=new Date();
  d.setHours(12,0,0,0);
  d.setDate(d.getDate()+days);
  const p=n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
}
function daysLate(due){
  if(!due) return 0;
  const a=new Date(`${due}T12:00:00`), b=new Date(`${today()}T12:00:00`);
  return Math.round((b-a)/86400000);
}
function reviewRank(state,card){
  const box=state?.box??0;
  const lapses=state?.lapses??0;
  const stability=state?.stability??BOX_INTERVALS[Math.min(box,BOX_INTERVALS.length-1)]??1;
  const difficulty=state?.difficulty??({facil:0.25,medio:0.5,dificil:0.75}[card?.diff]??0.5);
  const dueToday=!state?.due || state.due<=today();
  const overdue=Math.max(0,daysLate(state?.due));
  if(!state) return {label:'nova',priority:5,score:160+difficulty*20};
  if(dueToday && (lapses>=2 || box===0)) return {label:'prioridade alta',priority:5,score:145+overdue*4+lapses*12+difficulty*8};
  if(dueToday) return {label:'prioridade',priority:4,score:108+overdue*5+(4-box)*9+difficulty*7};
  if(!dueToday && box>=4 && stability>=30 && difficulty<0.45) return {label:'descanso',priority:1,score:12};
  return {label:'consolidação',priority:3,score:58+(4-box)*7+difficulty*10};
}
function nextReviewState(prev,grade,card){
  const fallbackStability=prev?.stability ?? BOX_INTERVALS[Math.min(prev?.box??0,BOX_INTERVALS.length-1)] ?? 1;
  const fallbackDifficulty=prev?.difficulty ?? ({facil:0.25,medio:0.5,dificil:0.75}[card?.diff]??0.5);
  const cur=prev||{box:0,due:null,reviews:0,streak:0,lapses:0,ease:2.5,stability:1,difficulty:fallbackDifficulty};
  const n={...cur,reviews:(cur.reviews||0)+1,lastGrade:grade};
  if(grade==='again'){
    n.box=0;n.streak=0;n.lapses=(cur.lapses||0)+1;n.ease=clamp((cur.ease||2.5)-0.22,1.3,3.3);
    n.difficulty=clamp(fallbackDifficulty+0.09,0.1,0.95);n.stability=1;n.due=today();
  }else if(grade==='hard'){
    n.box=clamp(cur.box||0,0,4);n.streak=0;n.ease=clamp((cur.ease||2.5)-0.06,1.3,3.3);
    n.difficulty=clamp(fallbackDifficulty+0.03,0.1,0.95);n.stability=clamp(fallbackStability*1.18,1,365);
    n.due=localDateFromToday(Math.max(1,Math.round(n.stability*0.55)));
  }else if(grade==='good'){
    n.box=clamp((cur.box||0)+1,0,4);n.streak=(cur.streak||0)+1;n.ease=clamp((cur.ease||2.5)+0.05,1.3,3.3);
    n.difficulty=clamp(fallbackDifficulty-0.025,0.1,0.95);n.stability=clamp(fallbackStability*(2.0+(1-fallbackDifficulty)*0.55),1,365);
    n.due=localDateFromToday(Math.max(1,Math.round(n.stability)));
  }else{
    n.box=clamp((cur.box||0)+2,0,4);n.streak=(cur.streak||0)+1;n.ease=clamp((cur.ease||2.5)+0.10,1.3,3.3);
    n.difficulty=clamp(fallbackDifficulty-0.06,0.1,0.95);n.stability=clamp(fallbackStability*(3.0+(1-fallbackDifficulty)*0.8),1,365);
    n.due=localDateFromToday(Math.max(1,Math.round(n.stability)));
  }
  return n;
}
function FlashcardsHub({subjects,srs,rateFlashcard}){
  const [query,setQuery]=useState('');
  const [subjectFilter,setSubjectFilter]=useState('all');
  const [focus,setFocus]=useState(null);
  const [expanded,setExpanded]=useState(false);
  const filtered=useMemo(()=>{
    const pool=subjects.flatMap(subject=>subject.flashcards.map(card=>({subject,card}))).filter(({subject,card})=>{
      const okSubject=subjectFilter==='all'||subject.id===subjectFilter;
      const q=query.trim().toLowerCase();
      return okSubject && (!q||`${subject.name} ${card.front} ${card.back}`.toLowerCase().includes(q));
    });
    return pool.sort((a,b)=>reviewRank(srs?.[a.subject.id]?.flashcards?.[a.card.id],a.card).score < reviewRank(srs?.[b.subject.id]?.flashcards?.[b.card.id],b.card).score ? 1 : -1);
  },[subjects,srs,query,subjectFilter]);
  const visible=expanded?filtered:filtered.slice(0,8);
  return <div className="page flashcards-hub-page">
    <div className="page-head-row"><div><span className="eyebrow">MEMÓRIA ATIVA</span><h1 className="page-h1">Flashcards</h1><p className="page-lead">Uma coletânea única para revisar por disciplina ou trabalhar a fila geral de recuperação.</p></div><div className="hub-count"><b>{filtered.length}</b><span>cards encontrados</span></div></div>
    <div className="flash-hub-controls"><label>Pesquisar<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Termo, pergunta ou disciplina..." /></label><label>Disciplina<select value={subjectFilter} onChange={e=>setSubjectFilter(e.target.value)}><option value="all">Todas</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label></div>
    <section className="flash-hub-section"><div className="flash-hub-list">{visible.map(({subject,card})=>{const state=srs?.[subject.id]?.flashcards?.[card.id];const rank=reviewRank(state,card);return <article key={`${subject.id}:${card.id}`} className="flash-hub-row"><div><span className="tile-tag">{subject.name}</span><strong>{card.front}</strong><small>{rank.label} · caixa {(state?.box??0)+1}/5</small></div><button className="secondary-btn" onClick={()=>setFocus({subject,card})}>Abrir</button></article>})}{!filtered.length&&<div className="empty-state"><strong>Nenhum flashcard encontrado.</strong><span>Altere a pesquisa ou o filtro.</span></div>}</div>{filtered.length>visible.length&&<button className="review-more" onClick={()=>setExpanded(true)}>Mostrar mais {filtered.length-visible.length}</button>}</section>
    {focus&&<FlashModal card={focus.card} index={Math.max(0,visible.findIndex(x=>x.card.id===focus.card.id))} total={filtered.length} state={srs?.[focus.subject.id]?.flashcards?.[focus.card.id]} rank={reviewRank(srs?.[focus.subject.id]?.flashcards?.[focus.card.id],focus.card)} onClose={()=>setFocus(null)} onNext={()=>{}} onPrev={()=>{}} onRate={(grade)=>rateFlashcard(focus.subject.id,focus.card.id,grade)}/>} 
  </div>
}

function Review({subject,srs,rateFlashcard,openTerms,setOpenTerms}){
  const cards=subject.flashcards; const keywords=subject.keywords;
  const [focusId,setFocusId]=useState(null); const [cardsExpanded,setCardsExpanded]=useState(false); const [termFocus,setTermFocus]=useState(null);
  const rankedCards=useMemo(()=>[...cards].sort((a,b)=>{const ra=reviewRank(srs?.[subject.id]?.flashcards?.[a.id],a),rb=reviewRank(srs?.[subject.id]?.flashcards?.[b.id],b);return rb.score-ra.score}),[cards,srs,subject.id]);
  const visibleCards=cardsExpanded?rankedCards:rankedCards.slice(0,Math.min(4,rankedCards.length));
  const focusIndex=focusId===null ? -1 : rankedCards.findIndex(c=>c.id===focusId); const focusCard=focusIndex>=0?rankedCards[focusIndex]:null;
  const closeFocus=()=>setFocusId(null); const stepFocus=(dir)=>{if(!rankedCards.length)return;const next=(focusIndex+dir+rankedCards.length)%rankedCards.length;setFocusId(rankedCards[next].id)};
  useEffect(()=>{if(focusId===null)return;const onKey=e=>{if(e.key==='Escape')closeFocus();if(e.key==='ArrowRight')stepFocus(1);if(e.key==='ArrowLeft')stepFocus(-1)};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[focusId,focusIndex,rankedCards.length]);
  const dueCards=rankedCards.filter(c=>{const st=srs?.[subject.id]?.flashcards?.[c.id];return !st?.due||st.due<=today()}).length;
  const high=rankedCards.filter(c=>reviewRank(srs?.[subject.id]?.flashcards?.[c.id],c).priority>=4).length;
  const resting=rankedCards.filter(c=>reviewRank(srs?.[subject.id]?.flashcards?.[c.id],c).label==='descanso').length;
  const goPrevTerm=()=>{if(!termFocus)return;const i=keywords.findIndex(k=>k.id===termFocus.id);setTermFocus(keywords[(i-1+keywords.length)%keywords.length])};
  const goNextTerm=()=>{if(!termFocus)return;const i=keywords.findIndex(k=>k.id===termFocus.id);setTermFocus(keywords[(i+1)%keywords.length])};
  return <div className="review-pane">
    <div className="review-hero"><div><span className="eyebrow">REVISAR</span><h2>Recuperar, não reler.</h2><p>A ordem se adapta ao seu desempenho. O que você domina descansa; o que falha volta para perto.</p></div><div className="review-stats"><span><b>{dueCards}</b> hoje</span><span><b>{high}</b> prioridade</span><span><b>{resting}</b> em descanso</span></div></div>
    <section className="review-section"><div className="review-section-head"><div><span className="eyebrow">FLASHCARDS</span><h3>Memória ativa</h3><p>Comece pelos itens com maior necessidade de recuperação.</p></div><button className="collapse-btn" onClick={()=>setCardsExpanded(v=>!v)}>{cardsExpanded?'Ocultar lista':'Ver mais cards'} · {cards.length}</button></div>
      <div className={`flash-grid ${cardsExpanded?'expanded':''}`}>{visibleCards.map(c=>{const rank=reviewRank(srs?.[subject.id]?.flashcards?.[c.id],c);return <Flash key={c.id} card={c} state={srs?.[subject.id]?.flashcards?.[c.id]} rank={rank} onOpen={()=>setFocusId(c.id)}/>})}</div>
      {!cardsExpanded && cards.length>visibleCards.length && <button className="review-more" onClick={()=>setCardsExpanded(true)}>+ {cards.length-visibleCards.length} cards</button>}
    </section>
    <section className="review-section terms-section"><div className="review-section-head"><div><span className="eyebrow">CONCEITOS</span><h3>Termos essenciais</h3><p>Abra um termo e percorra a sequência sem fechar a janela.</p></div><span>{keywords.length} itens</span></div><div className="keyword-list">{keywords.map(k=><article className="keyword" key={k.id}><button onClick={()=>setTermFocus(k)}><span>{k.term}</span><span>↗</span></button></article>)}</div></section>
    {focusCard && <FlashModal card={focusCard} index={focusIndex} total={rankedCards.length} state={srs?.[subject.id]?.flashcards?.[focusCard.id]} rank={reviewRank(srs?.[subject.id]?.flashcards?.[focusCard.id],focusCard)} onClose={closeFocus} onNext={()=>stepFocus(1)} onPrev={()=>stepFocus(-1)} onRate={(grade)=>rateFlashcard(subject.id,focusCard.id,grade)}/>} 
    {termFocus && <TermModal term={termFocus} index={keywords.findIndex(k=>k.id===termFocus.id)} total={keywords.length} onClose={()=>setTermFocus(null)} onNext={goNextTerm} onPrev={goPrevTerm} />}
  </div>
}
function Flash({card,state,rank,onOpen}){return <article className={`flash-card priority-${rank?.priority||3}`}><div className="flash-card-head"><span className="flash-tag">CAIXA {(state?.box??0)+1}/5</span><span className="rank-pill">{rank?.label||'nova'}</span></div><button className="flash-face" onClick={onOpen}><span className="flash-label">TENTE LEMBRAR</span><strong>{card.front}</strong><span className="flash-open">Abrir em foco</span></button></article>}
function FlashModal({card,index,total,state,rank,onClose,onNext,onPrev,onRate}){const [flip,setFlip]=useState(false);const [rated,setRated]=useState(null);useEffect(()=>{setFlip(false);setRated(null)},[card.id]);const register=(grade)=>{onRate(grade);setRated(grade)};return <div className="flash-modal" role="dialog" aria-modal="true" aria-label="Flashcard em foco" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className="flash-modal-panel"><div className="flash-modal-top"><div><span className="flash-modal-count">FLASHCARD {index+1} / {total}</span><span className="modal-rank">{rank.label}</span></div><button className="icon-btn" onClick={onClose} aria-label="Fechar">×</button></div><div className="flash-modal-card"><div className="flash-tag">CAIXA {(state?.box??0)+1}/5 · {state?.reviews||0} revisões</div><button className={`flash-face flash-face-large ${flip?'flipped':''}`} onClick={()=>setFlip(v=>!v)}><span className="flash-label">{flip?'RESPOSTA':'TENTE LEMBRAR'}</span><strong>{flip?card.back:card.front}</strong><span className="flash-hint">{flip?'Clique para voltar à pergunta.':'Clique para revelar a resposta.'}</span></button>{flip&&<div className="flash-rating"><span>Avalie a dificuldade desta lembrança</span><div><button className="rate-again" onClick={()=>register('again')} disabled={!!rated}>Não lembrei</button><button className="rate-hard" onClick={()=>register('hard')} disabled={!!rated}>Difícil</button><button className="rate-good" onClick={()=>register('good')} disabled={!!rated}>Lembrei</button><button className="rate-easy" onClick={()=>register('easy')} disabled={!!rated}>Fácil</button></div>{rated&&<div className="rating-saved">✓ Registrado. A fila será reorganizada pela próxima revisão.</div>}</div>}</div><div className="flash-modal-nav"><button className="secondary-btn" onClick={onPrev}>Anterior</button><button className="secondary-btn" onClick={onNext}>Próximo</button></div></div></div>}
function TermModal({term,index,total,onClose,onNext,onPrev}){return <div className="term-modal" role="dialog" aria-modal="true" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className="term-modal-panel"><div className="flash-modal-top"><span className="flash-modal-count">CONCEITO {index+1} / {total}</span><button className="icon-btn" onClick={onClose}>×</button></div><span className="eyebrow">TERMO ESSENCIAL</span><h3>{term.term}</h3><p>{term.def}</p><div className="term-modal-nav"><button className="secondary-btn" onClick={onPrev}>← Anterior</button><button className="secondary-btn" onClick={onNext}>Próximo →</button></div></div></div>}

function isDue(sid,kind,id,srs){const x=srs?.[sid]?.[kind]?.[id]; return !x?.due || x.due<=today();}
function adaptThemeHtml(html){
  const map={'#F8F7F1':'var(--diagram-surface)','#374151':'var(--diagram-ink)','#5B6472':'var(--diagram-muted)','#D7DCE4':'var(--diagram-line)','#9AA4B3':'var(--diagram-line)','#6B7280':'var(--diagram-muted)','#475569':'var(--diagram-muted)','#3F5F9C':'var(--diagram-blue)','#5E87E8':'var(--diagram-blue)','#EAF0FF':'var(--diagram-blue-soft)','#EEF3FF':'var(--diagram-blue-soft)','#E3F3EB':'var(--diagram-green-soft)','#23835A':'var(--diagram-green)','#245E44':'var(--diagram-green-ink)','#E8F3DE':'var(--diagram-green-soft)','#346D45':'var(--diagram-green-ink)','#F9EED9':'var(--diagram-amber-soft)','#72551B':'var(--diagram-amber-ink)','#B77B19':'var(--diagram-amber)','#F8E1E1':'var(--diagram-red-soft)','#7B3434':'var(--diagram-red-ink)','#EEE9FA':'var(--diagram-purple-soft)','#4B3D74':'var(--diagram-purple-ink)','#CBD2DE':'var(--diagram-line)','#697384':'var(--diagram-muted)','#DDEBF4':'var(--diagram-blue-soft)','#315E78':'var(--diagram-blue-ink)'};
  return Object.entries(map).reduce((out,[a,b])=>out.replaceAll(a,b),html);
}

createRoot(document.getElementById('root')).render(<App/>);
