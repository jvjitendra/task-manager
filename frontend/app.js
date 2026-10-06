const API = (window.APP_CONFIG?.API_BASE_URL || "").replace(/\/$/, "");
let token = localStorage.getItem("taskflow_token") || "";
let allTasks = [];
let authMode = "login";
let activeView = "overview";
let focusMode = false;
let commandItems = [];

const $ = (id) => document.getElementById(id);
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));

const ICONS = {
  grid:`<svg viewBox="0 0 24 24"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg>`,
  check:`<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>`,
  clock:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/></svg>`,
  flag:`<svg viewBox="0 0 24 24"><path d="M6 20V4m1 1h9l-2 3 2 3H7"/></svg>`,
  pulse:`<svg viewBox="0 0 24 24"><path d="M3 12h4l2.2-6 4.2 12L16 12h5"/></svg>`,
  chart:`<svg viewBox="0 0 24 24"><path d="M5 19V9m7 10V5m7 14v-7"/></svg>`,
  focus:`<svg viewBox="0 0 24 24"><path d="M8 4H4v4m12-4h4v4M8 20H4v-4m12 4h4v-4"/><circle cx="12" cy="12" r="3"/></svg>`,
  plus:`<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>`,
  search:`<svg viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.2"/><path d="m16 16 4 4"/></svg>`,
  command:`<svg viewBox="0 0 24 24"><path d="M9 8a3 3 0 1 0-3 3h3V8Zm0 0h6V6a3 3 0 1 0-3 3m3 7a3 3 0 1 0 3-3h-3v3Zm0 0H9v2a3 3 0 1 0 3-3"/></svg>`,
  layers:`<svg viewBox="0 0 24 24"><path d="m12 4 8 4-8 4-8-4 8-4Z"/><path d="m4 12 8 4 8-4M4 16l8 4 8-4"/></svg>`,
  github:`<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2.7a9.3 9.3 0 0 0-2.94 18.12c.46.09.63-.2.63-.44v-1.7c-2.56.56-3.1-1.08-3.1-1.08-.42-1.06-1.03-1.34-1.03-1.34-.84-.58.06-.57.06-.57.93.07 1.42.96 1.42.96.82 1.41 2.16 1 2.69.77.08-.6.32-1 .58-1.23-2.05-.23-4.2-1.03-4.2-4.57 0-1.01.36-1.83.96-2.48-.1-.24-.42-1.17.09-2.44 0 0 .78-.25 2.56.95A8.9 8.9 0 0 1 12 8.84a9 9 0 0 1 2.33.31c1.77-1.2 2.55-.95 2.55-.95.51 1.27.19 2.2.09 2.44.6.65.96 1.47.96 2.48 0 3.55-2.16 4.34-4.22 4.57.33.28.62.83.62 1.67v2.47c0 .24.17.53.64.44A9.3 9.3 0 0 0 12 2.7Z"/></svg>`,
  linkedin:`<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M5 8.5A1.5 1.5 0 1 1 5 5.5a1.5 1.5 0 0 1 0 3ZM3.7 10h2.6v8.3H3.7V10Zm4.2 0h2.5v1.13h.04c.35-.66 1.2-1.35 2.47-1.35 2.64 0 3.13 1.74 3.13 4v4.52h-2.6v-4.01c0-.96-.02-2.2-1.34-2.2-1.34 0-1.55 1.05-1.55 2.13v4.08H7.9V10Z"/></svg>`,
  user:`<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.2"/><path d="M5 20c.7-3.1 2.8-5 7-5s6.3 1.9 7 5"/></svg>`,
  mail:`<svg viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="12" rx="2"/><path d="m5 8 7 5 7-5"/></svg>`,
  lock:`<svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>`,
  shield:`<svg viewBox="0 0 24 24"><path d="M12 3 19 6v5c0 4.7-2.7 8-7 10-4.3-2-7-5.3-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/></svg>`,
  bolt:`<svg viewBox="0 0 24 24"><path d="m13 2-8 12h6l-1 8 8-12h-6l1-8Z"/></svg>`,
  database:`<svg viewBox="0 0 24 24"><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></svg>`,
  arrow:`<svg viewBox="0 0 24 24"><path d="M5 12h13m-5-5 5 5-5 5"/></svg>`,
  logout:`<svg viewBox="0 0 24 24"><path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4"/><path d="M14 8l4 4-4 4m4-4H9"/></svg>`,
  x:`<svg viewBox="0 0 24 24"><path d="m7 7 10 10M17 7 7 17"/></svg>`,
  external:`<svg viewBox="0 0 24 24"><path d="M14 5h5v5M19 5l-8 8"/><path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>`,
  spark:`<svg viewBox="0 0 24 24"><path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Zm6 12 .7 2.3L21 18l-2.3.7L18 21l-.7-2.3L15 18l2.3-.7L18 15Z"/></svg>`,
  calendar:`<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4m8-4v4M4 10h16"/></svg>`,
  info:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 10v6m0-9h.01"/></svg>`
};

document.querySelectorAll("[data-icon]").forEach(el => {
  const name = el.dataset.icon;
  if (ICONS[name]) el.innerHTML = ICONS[name];
});

function toast(message, type="info", title="TaskFlow") {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${type==="success"?"✓":type==="error"?"!":"i"}</span><div><b>${esc(title)}</b><p>${esc(message)}</p></div><button aria-label="Close">×</button>`;
  $("toastRoot").appendChild(el);
  requestAnimationFrame(()=>el.classList.add("show"));
  el.querySelector("button").onclick=()=>dismissToast(el);
  setTimeout(()=>dismissToast(el), 4200);
}
function dismissToast(el){el.classList.remove("show");setTimeout(()=>el.remove(),220)}

async function api(path, options={}, retries=2) {
  if (!API) throw new Error("API URL is not configured in config.js.");
  const headers={"Content-Type":"application/json",...(options.headers||{})};
  if(token) headers.Authorization=`Bearer ${token}`;
  let lastError;
  for(let attempt=0;attempt<=retries;attempt++){
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),25000);
    try{
      const response=await fetch(`${API}${path}`,{...options,headers,signal:controller.signal});
      clearTimeout(timeout);
      let body={}; try{body=await response.json()}catch{}
      if(!response.ok) throw new Error(body.message||`Request failed (${response.status})`);
      return body;
    }catch(err){
      clearTimeout(timeout); lastError=err;
      const retryable=err.name==="AbortError"||err.name==="TypeError"||/Failed to fetch/i.test(err.message||"");
      if(!retryable||attempt===retries) break;
      setApiStatus(path==="/"?"WAKING API":"RETRYING",false);
      await new Promise(r=>setTimeout(r,1000*(attempt+1)));
    }
  }
  if(lastError?.name==="AbortError") throw new Error("The API took too long to respond.");
  throw lastError||new Error("Request failed.");
}

function setApiStatus(label, online=false){
  $("apiStatus").textContent=label;
  $("apiPill").classList.toggle("online",online);
}

function friendlyName(fullName,email){
  if(fullName?.trim()) return fullName.trim();
  return (email||"there").split("@")[0].replace(/[._-]+/g," ").trim()||"there";
}
function initials(name){return friendlyName(name,"Jitendra Kumar Verma").split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase()||"JV"}

function setProfile(user){
  const name=friendlyName(user.full_name,user.email);
  $("sidebarName").textContent=name;$("sidebarEmail").textContent=user.email||"";
  $("sidebarAvatar").textContent=initials(name);
  $("profileTop").dataset.initials=initials(name);
}

function getGreeting(){
  const h=new Date().getHours();
  if(h<12) return "Good morning";
  if(h<17) return "Good afternoon";
  if(h<22) return "Good evening";
  return "Good night";
}
function getSessionNudge(name){
  const active=allTasks.filter(t=>t.status==="in_progress").length;
  const pending=allTasks.filter(t=>t.status==="pending").length;
  const high=allTasks.filter(t=>t.priority==="high"&&t.status!=="done").length;
  if(high) return {title:"Worth a look",message:`${high} high-priority ${high===1?"task":"tasks"} ${high===1?"needs":"need"} attention.`};
  if(active) return {title:"Keep the momentum",message:`You have ${active} active ${active===1?"task":"tasks"}. Finish the current one before adding noise.`};
  if(pending) return {title:"One clear next step",message:`${pending} pending ${pending===1?"task":"tasks"} in the queue. Pick the smallest useful move.`};
  return {title:getGreeting(),message:`Good to see you, ${name.split(" ")[0]}. Your workspace is clear.`};
}
function showSessionNudge(){
  const name=friendlyName($("sidebarName").textContent,"Jitendra");
  const n=getSessionNudge(name);
  setTimeout(()=>toast(n.message,"info",n.title),700);
}

function animateNumber(el,target){
  const end=Number(target)||0, start=Number(el.dataset.value||0);
  const duration=700, t0=performance.now();
  function frame(now){
    const p=Math.min(1,(now-t0)/duration), eased=1-Math.pow(1-p,3);
    el.textContent=Math.round(start+(end-start)*eased);
    if(p<1) requestAnimationFrame(frame); else el.dataset.value=end;
  }
  requestAnimationFrame(frame);
}

function updateStats(){
  const total=allTasks.length;
  const active=allTasks.filter(t=>t.status==="in_progress").length;
  const done=allTasks.filter(t=>t.status==="done").length;
  const high=allTasks.filter(t=>t.priority==="high"&&t.status!=="done").length;
  const today=allTasks.filter(t=>deadlineState(t)==="today").length;
  const overdue=allTasks.filter(t=>deadlineState(t)==="overdue").length;
  [["statTotal",total],["statActive",active],["statDone",done],["statHigh",high],["statToday",today],["statOverdue",overdue]].forEach(([id,v])=>{const el=$(id);if(el)animateNumber(el,v)});
}

function formatDate(date){
  const d=new Date(date); return Number.isNaN(d.getTime())?"—":d.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"});
}
function formatDateTime(date){
  const d=new Date(date); if(Number.isNaN(d.getTime())) return "—"; const format=localStorage.getItem("taskflow_time_format")||"12"; return d.toLocaleString(undefined,{month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:format==="12"});
}
function statusLabel(s){return s==="in_progress"?"In progress":s==="done"?"Completed":"Pending"}
function priorityLabel(p){return p.charAt(0).toUpperCase()+p.slice(1)}

function navTitle(view){
  return ({overview:"Overview",tasks:"My Tasks",today:"Today",priority:"Priority",activity:"Activity",analytics:"Analytics",focus:"Focus Mode",vaani:"Ask Vaani",profile:"Developer Profile",projects:"Project Ecosystem",settings:"Settings"})[view]||"Overview";
}

function setActiveNav(view){
  activeView=view;
  document.querySelectorAll(".nav-item[data-view]").forEach(btn=>btn.classList.toggle("active",btn.dataset.view===view));
  $("breadcrumbs").innerHTML=`<span>Workspace</span><b>/</b><strong>${esc(navTitle(view))}</strong>`;
}

function setView(view){
  if(!token) return;
  setActiveNav(view);
  renderView();
  closeSidebarMobile();
  window.scrollTo({top:0,behavior:"smooth"});
}
window.__tfSetView=setView;

function taskMatches(task, mode){
  if(mode==="today"){
    const source=task.due_at||task.created_at;
    const d=new Date(source), now=new Date();
    return !Number.isNaN(d.getTime()) && d.toDateString()===now.toDateString();
  }
  if(mode==="priority") return task.priority==="high"&&task.status!=="done";
  return true;
}

function filteredTasks(mode="all"){
  const q=($("globalTaskSearch")?.value||"").trim().toLowerCase();
  return allTasks.filter(t=>{
    const base=taskMatches(t,mode);
    const text=`${t.title} ${t.description}`.toLowerCase();
    return base && (!q||text.includes(q));
  });
}

function deadlineDate(task){ return task.due_at ? new Date(task.due_at) : null; }
function deadlineState(task){
  const d=deadlineDate(task); if(!d || Number.isNaN(d.getTime()) || task.status==="done") return "";
  const now=new Date(), diff=d-now;
  if(diff<0) return "overdue";
  if(d.toDateString()===now.toDateString()) return "today";
  return "upcoming";
}
function deadlineLabel(task){
  const d=deadlineDate(task); if(!d || Number.isNaN(d.getTime())) return "";
  const state=deadlineState(task);
  const date=d.toLocaleDateString(undefined,{month:"short",day:"numeric"});
  const time=d.toLocaleTimeString(undefined,{hour:"2-digit",minute:"2-digit",hour12:(localStorage.getItem("taskflow_time_format")||"12")==="12"});
  if(state==="overdue") return `Overdue · ${date} · ${time}`;
  if(state==="today") return `Today · ${time}`;
  return `${date} · ${time}`;
}
function deadlineCountdown(task){
  const d=deadlineDate(task); if(!d || Number.isNaN(d.getTime()) || task.status==="done") return "";
  const diff=d-new Date(); if(diff<0) return "Overdue";
  const m=Math.floor(diff/60000), h=Math.floor(m/60), days=Math.floor(h/24);
  if(days>0) return `${days}d ${h%24}h left`;
  if(h>0) return `${h}h ${m%60}m left`;
  return `${Math.max(1,m)}m left`;
}

function taskProgressState(status){
  if(status==="done") return {width:100,label:"Completed",className:"done"};
  if(status==="in_progress") return {width:62,label:"In progress",className:"in-progress"};
  return {width:24,label:"Pending",className:"pending"};
}
function taskCard(task, compact=false){
  const done=task.status==="done"; const ds=deadlineState(task);
  const desc=(task.description||"No description added yet.").trim();
  const progress=taskProgressState(task.status);
  return `<article class="task-row ${done?"is-done":""} deadline-${ds}" data-task-id="${task.id}">
    <button class="task-check ${done?"checked":""}" data-complete="${task.id}" aria-label="${done?"Reopen":"Complete"}">${done?`<span>✓</span>`:""}</button>
    <div class="task-body">
      <div class="task-title-line"><h3>${esc(task.title)}</h3><span class="priority-badge ${esc(task.priority)}">${esc(priorityLabel(task.priority))}</span></div>
      <p class="task-description">${esc(desc)}</p>
      <div class="task-meta"><span class="status-badge ${esc(task.status)}"><i></i>${esc(statusLabel(task.status))}</span>${task.due_at?`<span class="deadline-badge ${ds}">${ICONS.calendar}${esc(deadlineLabel(task))}</span><span class="countdown">${esc(deadlineCountdown(task))}</span>`:`<span>${formatDate(task.created_at)}</span>`}</div>
      <div class="task-progress ${progress.className}" aria-label="${progress.label}"><div class="task-progress-track"><span style="width:${progress.width}%"></span></div></div>
    </div>
    <div class="task-actions">
      <button class="icon-action" data-edit="${task.id}" title="Edit task" aria-label="Edit task">${ICONS.spark}</button>
      <button class="text-action" data-edit="${task.id}">Open</button>
    </div>
    <div class="row-sheen"></div>
  </article>`;
}

function emptyState(title,copy,action=true){
  return `<div class="empty-state"><div class="empty-orb"><span>${ICONS.spark}</span></div><h3>${title}</h3><p>${copy}</p>${action?`<button class="primary-btn" id="emptyCreate"><i>${ICONS.plus}</i> Create a task ${ICONS.arrow}</button>`:""}</div>`;
}

function dashboardView(){
  const name=friendlyName($("sidebarName").textContent,"Jitendra");
  const visible=filteredTasks();
  return `<div class="page page-enter dashboard-page">
    <div class="page-hero">
      <div><span class="section-kicker"><i></i> YOUR WORKSPACE · LIVE</span><h1>${getGreeting()}, <span>${esc(name.split(" ")[0])}.</span></h1><p>Keep the important things moving. TaskFlow is watching the work, not judging the pace.</p></div>
      <div class="hero-actions"><button class="secondary-btn" id="focusQuick"><i>${ICONS.focus}</i> Focus</button><button class="primary-btn" id="newTaskBtn"><i>${ICONS.plus}</i> New task</button></div>
    </div>

    <div class="stats-grid">
      ${statCard("statTotal","Total tasks","Across your workspace","grid")}
      ${statCard("statActive","In progress","Currently moving","pulse")}
      ${statCard("statDone","Completed","Momentum built","check")}
      ${statCard("statHigh","High priority","Needs attention","flag","hot")}
      ${statCard("statToday","Due today","Deadline focus","calendar")}
      ${statCard("statOverdue","Overdue","Needs action","bolt","hot")}
    </div>

    <div class="dashboard-grid">
      <section class="surface tasks-surface">
        <div class="surface-head">
          <div><span class="section-kicker">TASK QUEUE</span><h2>What needs your attention?</h2><p id="taskMeta">${visible.length} visible · ${allTasks.length} total</p></div>
          <div class="task-tools"><label class="search-box"><span>${ICONS.search}</span><input id="globalTaskSearch" placeholder="Search tasks…" value=""></label><select id="statusFilter"><option value="all">All status</option><option value="pending">Pending</option><option value="in_progress">In progress</option><option value="done">Completed</option></select></div>
        </div>
        <div class="filter-pills" id="filterPills">
          ${["all","in_progress","pending","done","high"].map((x,i)=>`<button class="${i===0?"active":""}" data-filter="${x}">${x==="in_progress"?"Active":x==="done"?"Completed":x==="high"?"High priority":"All"}</button>`).join("")}
        </div>
        <div class="task-list" id="taskList">${visible.length?visible.map(t=>taskCard(t)).join(""):emptyState("Your queue is clear.","Create a small next step and give your workspace something to move.")}</div>
      </section>

      <aside class="side-stack">
        <section class="surface live-workflow">
          <div class="surface-head mini"><span class="section-kicker">WORKFLOW SIGNAL</span><span class="live-dot">LIVE</span></div>
          <div class="flow-rail"><div class="flow-progress" style="width:${workflowProgress()}%"></div></div>
          <div class="flow-steps"><div class="${workflowStep("pending")}"><i>01</i><b>Plan</b><small>capture</small></div><div class="${workflowStep("in_progress")}"><i>02</i><b>Build</b><small>execute</small></div><div class="${workflowStep("done")}"><i>03</i><b>Ship</b><small>finish</small></div></div>
          <p class="workflow-copy">${workflowCopy()}</p>
        </section>

        <section class="surface signal-card">
          <div class="signal-visual"><div class="signal-core">TF</div><span class="signal-ring r1"></span><span class="signal-ring r2"></span><span class="signal-ring r3"></span></div>
          <div><span class="section-kicker">TASKFLOW PRINCIPLE</span><h3>Less noise.<br><span>More motion.</span></h3><p>Every surface should answer one question: <b>what should happen next?</b></p></div>
          <button class="ghost-link" id="aboutQuick">Explore the system <i>${ICONS.arrow}</i></button>
        </section>
      </aside>
    </div>
  </div>`;
}
function statCard(id,title,sub,icon,cls=""){
  return `<article class="stat-card ${cls}"><div class="stat-icon">${ICONS[icon]}</div><span>${title}</span><strong id="${id}" data-value="0">0</strong><small>${sub}</small><div class="stat-spark"></div></article>`;
}
function workflowProgress(){
  if(allTasks.some(t=>t.status==="in_progress")) return 55;
  if(allTasks.some(t=>t.status==="pending")) return 27;
  if(allTasks.length&&allTasks.every(t=>t.status==="done")) return 100;
  return 8;
}
function workflowStep(s){
  const active=allTasks.some(t=>t.status===s); return active?"active":"";
}
function workflowCopy(){
  if(allTasks.some(t=>t.status==="in_progress")) return "Work is moving. Keep the active task small enough to finish.";
  if(allTasks.some(t=>t.status==="pending")) return "You have work queued. Pick one clear next step and start.";
  if(allTasks.length&&allTasks.every(t=>t.status==="done")) return "Everything is shipped. Create the next useful thing.";
  return "Your workspace is ready. Add the first task and create momentum.";
}

function tasksView(){
  const tasks=filteredTasks();
  return `<div class="page page-enter"><div class="page-hero compact"><div><span class="section-kicker"><i></i> TASK MANAGEMENT</span><h1>My <span>tasks.</span></h1><p>Everything you have asked TaskFlow to remember.</p></div><button class="primary-btn" id="newTaskBtn"><i>${ICONS.plus}</i> New task</button></div><section class="surface full-surface"><div class="surface-head"><div><span class="section-kicker">ALL WORK</span><h2>${allTasks.length} task${allTasks.length===1?"":"s"}</h2></div><div class="task-tools"><label class="search-box"><span>${ICONS.search}</span><input id="globalTaskSearch" placeholder="Search tasks…"></label><select id="statusFilter"><option value="all">All status</option><option value="pending">Pending</option><option value="in_progress">In progress</option><option value="done">Completed</option></select></div></div><div class="task-list" id="taskList">${tasks.length?tasks.map(t=>taskCard(t)).join(""):emptyState("Nothing matches that view.","Try a different search or create a new task.")}</div></section></div>`;
}

function todayView(){
  const tasks=filteredTasks("today");
  return simpleTaskPage("TODAY","Your day, in one place.","Tasks created today, kept intentionally simple.",tasks,"No tasks for today.","You have a clean slate. Add one meaningful next step.");
}
function priorityView(){
  const tasks=filteredTasks("priority");
  return simpleTaskPage("PRIORITY","What deserves attention?","High-priority work that is not finished yet.",tasks,"No urgent work.","That is a good sign. Keep the queue deliberate.");
}
function simpleTaskPage(kicker,title,copy,tasks,emptyTitle,emptyCopy){
  return `<div class="page page-enter"><div class="page-hero compact"><div><span class="section-kicker"><i></i> ${kicker}</span><h1>${title}</h1><p>${copy}</p></div><button class="primary-btn" id="newTaskBtn"><i>${ICONS.plus}</i> New task</button></div><section class="surface full-surface"><div class="task-list" id="taskList">${tasks.length?tasks.map(t=>taskCard(t)).join(""):emptyState(emptyTitle,emptyCopy)}</div></section></div>`;
}

function activityView(){
  const events=[...allTasks].sort((a,b)=>new Date(b.updated_at||b.created_at)-new Date(a.updated_at||a.created_at));
  return `<div class="page page-enter"><div class="page-hero compact"><div><span class="section-kicker"><i></i> ACTIVITY STREAM</span><h1>See the <span>motion.</span></h1><p>Recent task changes, ordered by the latest update.</p></div></div><section class="surface full-surface"><div class="timeline">${events.length?events.map((t,i)=>`<div class="timeline-item"><span class="timeline-dot ${t.status}"></span><div><b>${t.status==="done"?"Completed":t.status==="in_progress"?"Moved into progress":"Task created"}</b><p>${esc(t.title)}</p><small>${formatDate(t.updated_at||t.created_at)} · ${statusLabel(t.status)}</small></div></div>`).join(""):`<div class="empty-state compact-empty"><div class="empty-orb"><span>${ICONS.pulse}</span></div><h3>No activity yet.</h3><p>Task changes will appear here as your workspace comes alive.</p></div>`}</div></section></div>`;
}

function analyticsView(){
  const total=allTasks.length;
  const done=allTasks.filter(t=>t.status==="done").length;
  const active=allTasks.filter(t=>t.status==="in_progress").length;
  const pending=allTasks.filter(t=>t.status==="pending").length;
  const high=allTasks.filter(t=>t.priority==="high"&&t.status!=="done").length;
  const today=allTasks.filter(t=>deadlineState(t)==="today").length;
  const overdue=allTasks.filter(t=>deadlineState(t)==="overdue").length;
  const rate=total?Math.round(done/total*100):0;
  const pct=v=>total?Math.round(v/total*100):0;
  return `<div class="page page-enter analytics-page">
    <div class="page-hero compact"><div><span class="section-kicker"><i></i> WORKSPACE SIGNALS</span><h1>Analytics, without <span>noise.</span></h1><p>A clear view of where your work sits, what is moving and what needs attention.</p></div></div>
    <div class="analytics-grid">
      <section class="surface chart-card">
        <div class="surface-head mini"><div><span class="section-kicker">STATUS MIX</span><h2>Where the work sits</h2><p>${total?`${total} task${total===1?"":"s"} across your workspace.`:"No tasks yet — create one to start seeing signals."}</p></div></div>
        <div class="analytics-bars">
          ${[["Pending",pending,"pending"],["In progress",active,"progress"],["Completed",done,"done"]].map(([label,value,kind])=>`<div class="analytics-bar-row"><div class="analytics-bar-label"><span>${label}</span><b>${value}</b></div><div class="analytics-track"><i class="${kind}" style="width:${pct(value)}%"></i></div><small>${pct(value)}%</small></div>`).join("")}
        </div>
      </section>
      <section class="surface completion-card">
        <div class="completion-head"><div><span class="section-kicker">COMPLETION RATE</span><h2>${rate}%</h2></div><div class="completion-ring" style="--p:${rate}%"><span>${done}/${total||0}</span></div></div>
        <p>${total?`${done} of ${total} current task${total===1?"":"s"} ${done===1?"is":"are"} complete.`:"Your completion rate will appear here once you add a task."}</p>
        <div class="completion-track"><i style="width:${rate}%"></i></div>
      </section>
    </div>
    <div class="analytics-kpis">
      <article class="surface analytics-kpi"><span>ACTIVE</span><strong>${active}</strong><small>Currently moving</small></article>
      <article class="surface analytics-kpi"><span>PENDING</span><strong>${pending}</strong><small>Waiting to start</small></article>
      <article class="surface analytics-kpi"><span>HIGH PRIORITY</span><strong>${high}</strong><small>Needs attention</small></article>
      <article class="surface analytics-kpi"><span>DUE TODAY</span><strong>${today}</strong><small>Deadline focus</small></article>
      <article class="surface analytics-kpi ${overdue?"is-danger":""}"><span>OVERDUE</span><strong>${overdue}</strong><small>${overdue?"Needs action":"Nothing overdue"}</small></article>
    </div>
  </div>`;
}
function focusView(){
  const active=allTasks.find(t=>t.status==="in_progress")||allTasks.find(t=>t.status==="pending");
  return `<div class="page page-enter focus-page"><div class="focus-hero"><span class="section-kicker"><i></i> FOCUS MODE</span><h1>One thing.<br><span>Then the next.</span></h1><p>Reduce the workspace to the task that deserves your attention right now.</p>${active?`<div class="focus-card"><div class="focus-pulse"></div><span class="status-badge ${active.status}"><i></i>${statusLabel(active.status)}</span><h2>${esc(active.title)}</h2><p>${esc(active.description||"No description added yet.")}</p><div class="focus-actions"><button class="primary-btn" data-focus-complete="${active.id}"><i>${ICONS.check}</i> Mark complete</button><button class="secondary-btn" data-focus-edit="${active.id}">Open task</button></div></div>`:emptyState("Nothing needs focus.","Create a task and TaskFlow will surface the next useful step.")}</div></div>`;
}

const PROFILE = {
  name:"Jitendra Kumar Verma",
  role:"Software Engineer · Computer Science",
  location:"Ranchi, Jharkhand · India",
  intro:"Computer Science developer focused on building practical software, backend systems, data-driven applications and AI-enabled solutions. I enjoy turning complex requirements into reliable, useful products with clean architecture and thoughtful user experiences.",
  story:"My work spans software engineering, REST APIs, databases, analytics, automation and applied AI, with a strong focus on learning through real-world projects and continuous experimentation. I approach each build with ownership, problem solving and an emphasis on maintainable implementation.",
  education:{
    title:"B.E. Computer Science & Engineering",
    meta:"Chandigarh University · 2023–2026 · CGPA 7.32",
    detail:"LEET student with a practical engineering focus across backend development, databases, REST APIs, data analytics and applied software projects.",
    extras:["Diploma · 71.81% · SCTVT Odisha","Class X · 8.20 CGPA · 77.9% equivalent · CBSE"]
  },
  leadership:{
    title:"Class Representative — LEET Student",
    meta:"Chandigarh University · 3rd–6th Semester · 2023–2025",
    detail:"Coordinated students, faculty, schedules and requirements across four consecutive semesters, handling time-sensitive academic communication and execution.",
    tag:"4 Consecutive Semesters"
  },
  builds:[
    ["AI & Intelligent Systems","AI applications · Vaani · AI workflows"],
    ["Backend Engineering","REST APIs · JWT · SQLAlchemy · server-side development"],
    ["Data & Analytics","SQL · Python · Power BI · Pandas · dashboards"],
    ["Product Development","TaskFlow · E-commerce workflows · practical software builds"]
  ],
  strengths:["Problem solving","Backend & APIs","SQL & databases","Data analysis","Product thinking","Communication"],
  careerFocus:["Software Engineering","Backend Development","Data Analytics","AI-enabled Products"],
  skills:["Python","Java","C++","JavaScript","SQL","REST APIs","MySQL","SQLite","PostgreSQL","Git","GitHub","Power BI","Power Query","DAX","Pandas","Excel","HTML","CSS","Basic MERN","Flask","JWT","SQLAlchemy","Docker","Postman"],
  projects:[
    {name:"TaskFlow",type:"Full-stack productivity platform",links:{live:"https://task-manager-frontend-tau-lemon.vercel.app",github:"https://github.com/jvjitendra/task-manager"},desc:"Designed and shipped a full-stack productivity workspace that authenticates users, persists tasks, surfaces priorities and turns work data into actionable productivity views.",image:"taskflow.svg",action:"Design · Build · Integrate",tech:["Flask","JWT","SQLAlchemy","REST"],detail:"TaskFlow is the current full-stack product build. It connects a responsive frontend to a real Flask REST API with JWT authentication, relational persistence, task CRUD, priorities, analytics and a productivity-oriented workspace.",status:"CURRENT BUILD"},
    {name:"Vaani",type:"AI Workspace",links:{live:"https://vaani-ai-workspace-frontend.vercel.app/"},desc:"Built an AI workspace that orchestrates conversational workflows, practical assistant actions, multimodal interactions and a focused product experience.",image:"vaani.svg",action:"Build · Orchestrate · Integrate",tech:["AI","Flask","NVIDIA NIM","Product UI"],detail:"Vaani is positioned as an AI workspace rather than a static chatbot, combining conversational flows, practical actions, file-aware workflows and a polished product surface.",status:"AI PRODUCT"},
    {name:"Flipkart Sales Dashboard",type:"Power BI · Excel · Data Analytics",desc:"Analyzed e-commerce data, transformed it into decision-ready metrics and visualized KPIs, trends, categories and state-level performance.",image:"analytics.svg",action:"Analyze · Transform · Visualize",tech:["Power BI","DAX","Excel","Power Query"],detail:"A learning project focused on cleaning sample e-commerce data, building KPIs and surfacing monthly, category, state, customer and payment-mode insights through an interactive Power BI dashboard.",status:"DATA ANALYTICS"},
    {name:"E-commerce Backend",type:"Products · Cart · Orders",desc:"Engineered a commerce backend that models products, cart flows and order-oriented data through structured REST endpoints and database logic.",image:"backend.svg",action:"Model · Engineer · Expose",tech:["Python","REST","SQL"],detail:"A backend-oriented experiment focused on modelling product workflows, API endpoints and the data relationships behind commerce features.",status:"BACKEND"},
    {name:"Student Attendance Management",type:"Python + MySQL",desc:"Developed a database-backed attendance workflow that records, queries and reports student attendance through Python and MySQL.",image:"attendance.svg",action:"Develop · Query · Report",tech:["Python","MySQL","SQL"],detail:"A practical academic application combining Python logic with MySQL persistence, CRUD operations and structured attendance reporting.",status:"ACADEMIC"},
    {name:"Movie Ticket Booking System",type:"Java · OOP",desc:"Implemented a Java booking workflow that models movie discovery, seat selection and ticket-booking logic with object-oriented design.",image:"movie.svg",action:"Model · Implement · Validate",tech:["Java","OOP"],detail:"A Java project built around the core booking flow, applying object-oriented programming to a familiar real-world system.",status:"ACADEMIC"},
    {name:"Sudoku Solver",type:"C++ · Backtracking",desc:"Implemented a recursive C++ solver that explores constraints, backtracks efficiently and resolves Sudoku boards systematically.",image:"sudoku.svg",action:"Implement · Optimize · Solve",tech:["C++","Algorithms"],detail:"A focused algorithms project demonstrating recursive backtracking, state exploration and constraint handling.",status:"ALGORITHMS"}
  ],
  certs:[
    ["Foundation of Cloud IoT & Edge Machine Learning","IIT Kanpur · NPTEL–SWAYAM","Elite · 2025 · IoT systems, edge computing & ML fundamentals."],
    ["Cloud Computing","IIT Kharagpur · NPTEL–SWAYAM","Elite · 2024 · Cloud computing models, storage & processing architectures · 23,872+ learners."],
    ["Databases & SQL for Data Science with Python","Coursera","Honours · SQL queries, Python and data-oriented database workflows."],
    ["Introduction to Databases","Meta · Coursera","Relational database concepts, SQL querying and database fundamentals."],
    ["Programming for Everybody (Python)","University of Michigan · Coursera","Python fundamentals, data structures and practical data handling."],
    ["Internet of Things: Design Concepts & Use Cases","NITTTR Chandigarh · SWAYAM","75% · IoT concepts, design thinking and real-world use cases."],
    ["Solidity Smart Contracts","Infosys Springboard","Ethereum, blockchain concepts and smart-contract fundamentals."],
    ["AWS Certified Database – Specialty","AWS","Database architecture, workloads and AWS database technologies."]
  ],
  languages:[["Hindi","Native"],["English","Fluent"],["Punjabi","Conversational"],["Odia","Conversational"],["Bengali","Understands"]],
  exploring:"AI applications · Backend architecture · Developer tools · Cloud technologies · Data products",
  beyond:"Travel · Exploring new places · Music · Adventure · Cooking · Bikes"
};

function profileView(){
  return `<div class="page page-enter profile-page">
    <section class="profile-hero surface">
      <div class="profile-identity"><div class="profile-big-avatar">JV<div class="avatar-pulse"></div></div><div><span class="section-kicker"><i></i> THE MIND BEHIND TASKFLOW</span><h1>${PROFILE.name}</h1><p>${PROFILE.role}<br>${PROFILE.location}</p><div class="profile-links"><a href="https://github.com/jvjitendra" target="_blank" rel="noreferrer">GitHub ${ICONS.external}</a><a href="https://www.linkedin.com/" target="_blank" rel="noreferrer">LinkedIn ${ICONS.external}</a><button id="profileProjects">View projects ${ICONS.arrow}</button></div></div></div>
      <div class="profile-intro"><p>${PROFILE.intro}</p><p>${PROFILE.story}</p></div>
      <div class="profile-metrics"><div><strong>7.32</strong><span>Graduation CGPA</span></div><div><strong>71.81%</strong><span>Diploma</span></div><div><strong>8.20</strong><span>Class X CGPA</span></div><div><strong>${PROFILE.projects.length}</strong><span>Featured builds</span><small>Many more projects</small></div></div>
    </section>

    <div class="profile-grid">
      <section class="surface detail-section"><div class="section-title"><span class="section-kicker">EDUCATION</span><h2>Engineering foundation.</h2></div><div class="detail-card featured"><div class="detail-icon">${ICONS.calendar}</div><div><h3>${PROFILE.education.title}</h3><span>${PROFILE.education.meta}</span><p>${PROFILE.education.detail}</p><div class="education-extra">${PROFILE.education.extras.map(x=>`<span>${x}</span>`).join("")}</div></div></div></section>
      <section class="surface detail-section"><div class="section-title"><span class="section-kicker">LEADERSHIP & CAMPUS</span><h2>Ownership beyond code.</h2></div><div class="detail-card"><div class="detail-icon">${ICONS.pulse}</div><div><h3>${PROFILE.leadership.title}</h3><span>${PROFILE.leadership.meta}</span><p>${PROFILE.leadership.detail}</p><em>${PROFILE.leadership.tag}</em></div></div></section>
    </div>

    <div class="profile-grid">
      <section class="surface detail-section"><div class="section-title"><span class="section-kicker">CAREER FOCUS</span><h2>Roles that fit the build.</h2></div><div class="focus-tags">${PROFILE.careerFocus.map(x=>`<span>${x}</span>`).join("")}</div><div class="strength-grid">${PROFILE.strengths.map((x,i)=>`<div><span>0${i+1}</span><b>${x}</b></div>`).join("")}</div></section>
      <section class="surface detail-section"><div class="section-title"><span class="section-kicker">WHAT I BUILD</span><h2>Four lanes, one mindset.</h2></div><div class="build-grid compact-build">${PROFILE.builds.map((b,i)=>`<article class="build-card" style="--delay:${i*70}ms"><span>0${i+1}</span><h3>${b[0]}</h3><p>${b[1]}</p></article>`).join("")}</div></section>
    </div>

    <section class="surface detail-section"><div class="section-title"><span class="section-kicker">TECHNICAL SKILLS</span><h2>Tools I actually work with.</h2></div><div class="skill-cloud">${PROFILE.skills.map((s,i)=>`<span style="--delay:${i*15}ms">${s}</span>`).join("")}</div></section>

    <section class="surface detail-section"><div class="section-title"><span class="section-kicker">FLAGSHIP PROJECTS</span><h2>Projects with a reason to exist.</h2></div><div class="project-grid">${PROFILE.projects.slice(0,4).map((p,i)=>projectCard(p,i)).join("")}</div><button class="secondary-btn center-btn" id="allProjectsBtn">Explore the full ecosystem ${ICONS.arrow}</button></section>

    <section class="surface detail-section"><div class="section-title"><span class="section-kicker">CERTIFICATIONS & ACHIEVEMENTS</span><h2>Structured learning, not badge collecting.</h2></div><div class="cert-list">${PROFILE.certs.map((c,i)=>`<button class="cert-card" data-cert="${i}"><span class="cert-num">${String(i+1).padStart(2,"0")}</span><div><h3>${c[0]}</h3><span>${c[1]}</span><p>${c[2]}</p></div><i>${ICONS.arrow}</i></button>`).join("")}</div></section>

    <div class="profile-grid">
      <section class="surface detail-section"><div class="section-title"><span class="section-kicker">CURRENTLY EXPLORING</span><h2>Where the curiosity is going next.</h2></div><p class="large-copy">${PROFILE.exploring}</p></section>
      <section class="surface detail-section"><div class="section-title"><span class="section-kicker">LANGUAGES</span><h2>Communication across contexts.</h2></div><div class="language-grid">${PROFILE.languages.map(l=>`<div><b>${l[0]}</b><span>${l[1]}</span></div>`).join("")}</div></section>
    </div>

    <section class="surface detail-section beyond"><div class="section-title"><span class="section-kicker">BEYOND CODE</span><h2>${PROFILE.beyond}</h2></div><p>Curiosity outside software keeps the work grounded: new places, new experiences, music, food, movement and the occasional long ride.</p></section>
  </div>`;
}

function projectCard(p,i){
  const links=p.links||{};
  const linkLabel=links.live?"Live project":links.github?"Source code":"View project";
  return `<button class="project-card" data-project="${PROFILE.projects.indexOf(p)}" type="button">
    <div class="project-art"><img src="assets/projects/${p.image||"taskflow.svg"}" alt="${esc(p.name)} project visual" loading="lazy"></div>
    <div class="project-card-body">
      <div class="project-card-top"><span class="project-status">${esc(p.status)}</span><span class="project-number">${String(i+1).padStart(2,"0")}</span></div>
      <h3>${esc(p.name)}</h3><span class="project-type">${esc(p.type)}</span>
      <p>${esc(p.desc)}</p><div class="project-action">${esc(p.action||"Design · Build · Iterate")}</div>
      <div class="tech-mini">${p.tech.map(t=>`<i>${esc(t)}</i>`).join("")}</div>
      <span class="project-open">${linkLabel} ${ICONS.arrow}</span>
    </div>
  </button>`;
}
function projectsView(){
  return `<div class="page page-enter projects-page"><div class="page-hero"><div><span class="section-kicker"><i></i> PROJECT ECOSYSTEM</span><h1>Things built to <span>work.</span></h1><p>From AI experiences to backend systems and academic builds — each project exists to solve a specific problem.</p></div><div class="hero-counter"><strong>${String(PROFILE.projects.length).padStart(2,"0")}</strong><span>featured<br>projects</span></div></div><div class="project-ecosystem">${PROFILE.projects.map((p,i)=>projectCard(p,i)).join("")}</div></div>`;
}
function vaaniView(){
  return `<div class="page page-enter vaani-page">
    <div class="page-hero compact vaani-hero">
      <div><span class="section-kicker"><i></i> AI WORKSPACE</span><h1>Ask Vaani.</h1><p>Vaani is embedded directly inside TaskFlow — no redirect, no second dashboard.</p></div>
      <a class="secondary-btn" href="https://vaani-ai-workspace-frontend.vercel.app/" target="_blank" rel="noopener">Open separately ${ICONS.external}</a>
    </div>
    <section class="vaani-embed surface">
      <div class="vaani-embed-bar"><span><i class="live-dot"></i> Vaani AI Workspace</span><small>TaskFlow local time · <b id="vaaniEmbedClock">--:--:--</b> · <span id="vaaniEmbedDate">Loading date</span></small></div>
      <div class="vaani-frame-shell"><iframe class="vaani-frame" src="https://vaani-ai-workspace-frontend.vercel.app/" title="Vaani AI Workspace" loading="eager" allow="microphone; camera; clipboard-read; clipboard-write; fullscreen"></iframe></div>
    </section>
  </div>`;
}

function settingsView(){
  const enabled=localStorage.getItem("taskflow_notifications")==="1";
  const format=localStorage.getItem("taskflow_time_format")||"12";
  return `<div class="page page-enter settings-page"><div class="page-hero compact"><div><span class="section-kicker"><i></i> PREFERENCES</span><h1>Settings.</h1><p>Manage notifications, time display and your current session.</p></div></div><div class="settings-grid"><section class="surface settings-card"><div class="settings-icon">${ICONS.spark}</div><div><span class="section-kicker">NOTIFICATIONS</span><h2>Browser notifications</h2><p>Get useful reminders for deadlines and important task events. TaskFlow will not spam you.</p></div><button id="notificationToggle" class="toggle ${enabled?"on":""}" aria-pressed="${enabled}"><span></span><b>${enabled?"Enabled":"Enable"}</b></button></section><section class="surface settings-card"><div class="settings-icon">${ICONS.clock}</div><div><span class="section-kicker">TIME FORMAT</span><h2>Clock display</h2><p>Choose how times appear across the workspace, task deadlines and countdowns.</p></div><div class="segmented-setting"><button class="time-format ${format==="12"?"active":""}" data-time-format="12">12-hour</button><button class="time-format ${format==="24"?"active":""}" data-time-format="24">24-hour</button></div></section><section class="surface settings-card"><div class="settings-icon">${ICONS.info}</div><div><span class="section-kicker">LANGUAGE</span><h2>English</h2><p>The TaskFlow interface is currently available in English.</p></div><span class="setting-value">English</span></section><section class="surface settings-card"><div class="settings-icon">${ICONS.shield}</div><div><span class="section-kicker">SESSION</span><h2>Secure session</h2><p>Your workspace uses a JWT session. Sign out from this device when you are finished.</p></div><button id="settingsLogout" class="danger-btn">${ICONS.logout} Sign out</button></section></div></div>`;
}

function renderView(){
  const root=$("viewRoot");
  const views={overview:dashboardView,tasks:tasksView,today:todayView,priority:priorityView,activity:activityView,analytics:analyticsView,focus:focusView,vaani:vaaniView,profile:profileView,projects:projectsView,settings:settingsView};
  root.innerHTML=(views[activeView]||dashboardView)();
  wireView();
  updateStats();
  if(activeView==="focus") focusMode=true;
}

function wireView(){
  const newBtns=document.querySelectorAll("#newTaskBtn,#emptyCreate");
  newBtns.forEach(b=>b?.addEventListener("click",()=>openTaskModal()));
  $("globalTaskSearch")?.addEventListener("input",()=>{renderTaskArea();});
  $("statusFilter")?.addEventListener("change",()=>renderTaskArea());
  document.querySelectorAll("[data-filter]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("[data-filter]").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderTaskArea(b.dataset.filter)}));
  document.querySelectorAll("[data-complete]").forEach(b=>b.addEventListener("click",()=>quickComplete(Number(b.dataset.complete))));
  document.querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>{const t=allTasks.find(x=>x.id===Number(b.dataset.edit));if(t)openTaskModal(t)}));
  document.querySelectorAll("[data-focus-complete]").forEach(b=>b.addEventListener("click",()=>quickComplete(Number(b.dataset.focusComplete))));
  document.querySelectorAll("[data-focus-edit]").forEach(b=>b.addEventListener("click",()=>{const t=allTasks.find(x=>x.id===Number(b.dataset.focusEdit));if(t)openTaskModal(t)}));
  document.querySelectorAll("[data-project]").forEach(b=>b.addEventListener("click",()=>openProject(Number(b.dataset.project))));
  document.querySelectorAll("[data-cert]").forEach(b=>b.addEventListener("click",()=>openCertificate(Number(b.dataset.cert))));
  $("profileProjects")?.addEventListener("click",()=>setView("projects"));
  $("allProjectsBtn")?.addEventListener("click",()=>setView("projects"));
  $("settingsLogout")?.addEventListener("click",logout);
  document.querySelectorAll("[data-time-format]").forEach(b=>b.addEventListener("click",()=>{localStorage.setItem("taskflow_time_format",b.dataset.timeFormat);updateClock();renderView();}));
  $("notificationToggle")?.addEventListener("click",async()=>{ try{ if(Notification && Notification.permission!=="granted"){const p=await Notification.requestPermission(); if(p!=="granted"){toast("Browser notification permission was not granted.","error");return}} localStorage.setItem("taskflow_notifications","1");renderView();toast("Browser notifications enabled.","success"); }catch{toast("Notifications are not available in this browser.","error")} });
  $("aboutQuick")?.addEventListener("click",()=>setView("profile"));
  $("focusQuick")?.addEventListener("click",()=>setView("focus"));
  animateIn();
}
function renderTaskArea(filter="all"){
  const list=$("taskList"); if(!list)return;
  const q=($("globalTaskSearch")?.value||"").trim().toLowerCase(), status=$("statusFilter")?.value||"all";
  let tasks=allTasks.filter(t=>(!q||`${t.title} ${t.description}`.toLowerCase().includes(q))&&(status==="all"||t.status===status));
  if(filter==="high") tasks=tasks.filter(t=>t.priority==="high"&&t.status!=="done");
  if(filter==="in_progress") tasks=tasks.filter(t=>t.status==="in_progress");
  if(filter==="pending") tasks=tasks.filter(t=>t.status==="pending");
  if(filter==="done") tasks=tasks.filter(t=>t.status==="done");
  $("taskMeta")&&( $("taskMeta").textContent=`${tasks.length} visible · ${allTasks.length} total`);
  list.innerHTML=tasks.length?tasks.map(t=>taskCard(t)).join(""):emptyState("Nothing matches that view.","Try another filter or create a new task.");
  wireView();
}
function animateIn(){document.querySelectorAll(".page-enter > *, .surface, .build-card, .project-card, .cert-card").forEach((el,i)=>{el.style.setProperty("--i",i);el.classList.add("reveal")})}

function openTaskModal(task=null){
  const edit=!!task;
  const due=task?.due_at?new Date(task.due_at):null;
  const validDue=due&&!Number.isNaN(due.getTime());
  const dateValue=validDue?`${due.getFullYear()}-${String(due.getMonth()+1).padStart(2,"0")}-${String(due.getDate()).padStart(2,"0")}`:"";
  const timeValue=validDue?`${String(due.getHours()).padStart(2,"0")}:${String(due.getMinutes()).padStart(2,"0")}`:"";
  const created=task?.created_at?formatDateTime(task.created_at):"Created after save";
  const updated=task?.updated_at?formatDateTime(task.updated_at):"Not updated yet";
  const deadlineText=validDue?deadlineLabel(task):"No deadline set";
  const modalAction=edit?`<button type="button" class="danger-btn" id="deleteTask">${ICONS.x} Delete</button>`:`<span class="modal-hint">You can add a deadline later.</span>`;
  document.body.classList.add("modal-open");
  $("modalRoot").innerHTML=`<div class="overlay-root task-overlay"><div class="overlay-backdrop" data-close-task></div><div class="task-modal" role="dialog" aria-modal="true" aria-labelledby="taskModalTitle"><div class="modal-head"><div><span class="section-kicker">${edit?"EDIT TASK":"NEW TASK"}</span><h2 id="taskModalTitle">${edit?"Shape the next step.":"Create a clear next step."}</h2><p>${edit?"Update the task, deadline and context.":"Give the task enough context to make the next action obvious."}</p></div><button class="icon-btn close-modal" data-close-task aria-label="Close task dialog">${ICONS.x}</button></div><form id="taskForm">
    <label>Title<input id="taskTitle" maxlength="200" required value="${esc(task?.title||"")}" placeholder="e.g. Finish API deployment"></label>
    <label>Description<textarea id="taskDescription" maxlength="1000" rows="3" placeholder="Why does this matter? What does done look like?">${esc(task?.description||"")}</textarea></label>
    <div class="form-grid"><label>Status<select id="taskStatus"><option value="pending" ${task?.status==="pending"?"selected":""}>Pending</option><option value="in_progress" ${task?.status==="in_progress"?"selected":""}>In progress</option><option value="done" ${task?.status==="done"?"selected":""}>Completed</option></select></label><label>Priority<select id="taskPriority"><option value="low" ${task?.priority==="low"?"selected":""}>Low</option><option value="medium" ${!task||task?.priority==="medium"?"selected":""}>Medium</option><option value="high" ${task?.priority==="high"?"selected":""}>High</option></select></label></div>
    <div class="form-grid"><label>Due date<input id="taskDueDate" type="date" value="${dateValue}"></label><label>Due time<input id="taskDueTime" type="time" value="${timeValue}"></label></div>
    <div class="task-modal-summary"><div><span>DEADLINE</span><b id="taskDeadlinePreview">${esc(deadlineText)}</b></div><div><span>CREATED</span><b>${esc(created)}</b></div><div><span>UPDATED</span><b>${esc(updated)}</b></div></div>
    <div class="modal-actions">${modalAction}<button class="primary-btn" id="taskSubmit" type="submit"><span>${edit?"Save changes":"Create task"}</span>${ICONS.arrow}</button></div>
  </form></div></div>`;
  document.querySelectorAll("[data-close-task]").forEach(x=>x.addEventListener("click",closeTaskModal));
  const refreshDeadlinePreview=()=>{const d=$("taskDueDate").value,t=$("taskDueTime").value;let text="No deadline set";if(d){const local=new Date(`${d}T${t||"23:59"}:00`);if(!Number.isNaN(local.getTime())){const temp={due_at:local.toISOString(),status:$('taskStatus').value};text=deadlineLabel(temp)||"No deadline set"}}$("taskDeadlinePreview").textContent=text};
  $("taskDueDate").addEventListener("input",refreshDeadlinePreview);$("taskDueTime").addEventListener("input",refreshDeadlinePreview);$("taskStatus").addEventListener("change",refreshDeadlinePreview);
  $("taskForm").addEventListener("submit",async e=>{
    e.preventDefault();
    const title=$("taskTitle").value.trim(); if(!title){toast("Add a title before saving the task.","error");$("taskTitle").focus();return}
    const date=$("taskDueDate").value,time=$("taskDueTime").value;
    let due_at=null; if(date){ const local=new Date(`${date}T${time||"23:59"}:00`); if(Number.isNaN(local.getTime())){toast("Choose a valid due date/time.","error");return} due_at=local.toISOString(); }
    const payload={title,description:$("taskDescription").value.trim(),status:$("taskStatus").value,priority:$("taskPriority").value,due_at};
     const submit=$("taskSubmit"); submit.disabled=true; submit.classList.add("is-loading");
    try{
      if(edit) await api(`/api/tasks/${task.id}`,{method:"PUT",body:JSON.stringify(payload)}); else await api("/api/tasks",{method:"POST",body:JSON.stringify(payload)});
       submit.querySelector("span").textContent=edit?"Saved":"Created"; submit.classList.remove("is-loading");closeTaskModal();await loadTasks();toast(edit?"Task updated.":"Task created. Nice start.","success");
     }catch(err){submit.disabled=false;submit.classList.remove("is-loading");toast(err.message,"error")}
  });
  $("deleteTask")?.addEventListener("click",async()=>{ if(!task)return; if(!confirm(`Delete “${task.title}”?`))return; try{await api(`/api/tasks/${task.id}`,{method:"DELETE"});closeTaskModal();await loadTasks();toast("Task deleted.","success")}catch(err){toast(err.message,"error")} });
  setTimeout(()=>$('taskTitle')?.focus(),80);
}
function closeTaskModal(){ $("modalRoot").innerHTML=""; document.body.classList.remove("modal-open"); }

function openProject(index){
  const p=PROFILE.projects[index];
  const links=p.links||{};
  const linksHtml=`<div class="project-detail-links">${links.live?`<a class="primary-btn" href="${esc(links.live)}" target="_blank" rel="noopener noreferrer">Live project ${ICONS.external}</a>`:""}${links.github?`<a class="secondary-btn" href="${esc(links.github)}" target="_blank" rel="noopener noreferrer">Source code ${ICONS.github}</a>`:""}${!links.live&&!links.github?`<span class="project-link-unavailable">No public project link is currently available.</span>`:""}</div>`;
  $("detailModal").innerHTML=`<div class="overlay-backdrop" data-close-detail></div><div class="detail-modal project-detail"><div class="detail-modal-head"><div><span class="section-kicker">${esc(p.status)}</span><h2>${esc(p.name)}</h2><p>${esc(p.type)}</p></div><button class="icon-btn" data-close-detail>${ICONS.x}</button></div><div class="detail-project-body"><div class="detail-project-hero"><div class="project-detail-orb">TF</div><div><span class="detail-label">WHY IT EXISTS</span><p>${esc(p.detail)}</p></div></div><div class="detail-columns"><div><span class="detail-label">WHAT IT DOES</span><ul><li>Turns a concrete problem into a usable software workflow.</li><li>Uses clear interfaces and persistent data where the project needs it.</li><li>Designed around maintainability, clear UX and practical execution.</li></ul></div><div><span class="detail-label">STACK</span><div class="detail-stack">${p.tech.map(t=>`<span>${esc(t)}</span>`).join("")}</div></div></div><div class="project-detail-notes"><div><span class="detail-label">ROLE</span><b>Design · Development · Integration</b></div><div><span class="detail-label">FOCUS</span><b>Practical product engineering</b></div><div><span class="detail-label">STATUS</span><b>${esc(p.status)}</b></div></div>${linksHtml}<div class="project-detail-footer"><span>Project ecosystem · TaskFlow portfolio</span><button class="secondary-btn" data-close-detail>Close ${ICONS.x}</button></div></div></div>`;
  $("detailModal").classList.remove("hidden");
  document.querySelectorAll("[data-close-detail]").forEach(x=>x.addEventListener("click",closeDetail));
}
function openCertificate(index){
  const c=PROFILE.certs[index];
  $("detailModal").innerHTML=`<div class="overlay-backdrop" data-close-detail></div><div class="detail-modal cert-detail"><div class="detail-modal-head"><div><span class="section-kicker">CERTIFICATION ${String(index+1).padStart(2,"0")}</span><h2>${c[0]}</h2><p>${c[1]}</p></div><button class="icon-btn" data-close-detail>${ICONS.x}</button></div><div class="cert-detail-copy"><span class="detail-label">WHY IT MATTERS</span><p>${c[2]}</p><div class="cert-signal"><i></i><span>Structured learning signal · verified course entry</span></div></div></div>`;
  $("detailModal").classList.remove("hidden"); document.querySelectorAll("[data-close-detail]").forEach(x=>x.addEventListener("click",closeDetail));
}
function closeDetail(){$("detailModal").classList.add("hidden");$("detailModal").innerHTML=""}

function openCommand(){
  const modal=$("commandModal"); modal.classList.remove("hidden"); const input=$("commandInput"); input.value=""; input.focus(); buildCommands();
}
function buildCommands(){
  commandItems=[
    ["Overview","Open your productivity dashboard","overview","grid"],
    ["My Tasks","See every task","tasks","check"],
    ["Today","Show today's work","today","clock"],
    ["Priority","Show high-priority unfinished work","priority","flag"],
    ["Activity","See recent movement","activity","pulse"],
    ["Analytics","See workspace signals","analytics","chart"],
    ["Focus Mode","Reduce the workspace to one task","focus","focus"],
    ["Ask Vaani","Open the AI workspace inside TaskFlow","vaani","spark"],
    ["Developer Profile","Explore education, leadership, skills and story","profile","user"],
    ["Project Ecosystem","Open detailed projects","projects","layers"],
    ["Create New Task","Capture the next useful step","__new","plus"]
  ];
  renderCommands("");
}
function renderCommands(q){
  const query=q.trim().toLowerCase();
  const items=commandItems.filter(x=>`${x[0]} ${x[1]}`.toLowerCase().includes(query));
  $("commandList").innerHTML=items.map((x,i)=>`<button class="command-item" data-cmd="${x[2]}"><span class="command-icon">${ICONS[x[3]]}</span><span class="command-copy"><b>${x[0]}</b><small>${x[1]}</small></span><kbd>${i<9?i+1:"↵"}</kbd></button>`).join("")||`<div class="command-empty">No command matches “${esc(q)}”.</div>`;
  document.querySelectorAll("[data-cmd]").forEach(b=>b.addEventListener("click",()=>runCommand(b.dataset.cmd)));
}
function runCommand(cmd){$("commandModal").classList.add("hidden");if(cmd==="__new")openTaskModal();else setView(cmd)}
$("commandTop").addEventListener("click",openCommand);$("commandSide").addEventListener("click",openCommand);$("searchSide").addEventListener("click",openCommand);
$("commandInput").addEventListener("input",e=>renderCommands(e.target.value));
$("commandModal").addEventListener("click",e=>{if(e.target.hasAttribute("data-close-command"))$("commandModal").classList.add("hidden")});

function toggleSidebar(){
  if(window.innerWidth>820){ $("sidebar").classList.toggle("collapsed"); }
  else { $("sidebar").classList.toggle("mobile-open"); }
  $("mobileShade").classList.toggle("hidden",window.innerWidth>820||!$("sidebar").classList.contains("mobile-open"));
}
function closeSidebarMobile(){$("sidebar").classList.remove("mobile-open");$("mobileShade").classList.add("hidden")}
$("sidebarToggle").addEventListener("click",toggleSidebar);$("mobileShade").addEventListener("click",closeSidebarMobile);
$("brandBtn").addEventListener("click",()=>setView("overview"));$("profileTop").addEventListener("click",()=>setView("profile"));$("newTaskSide").addEventListener("click",openTaskModal);
document.querySelectorAll(".nav-item[data-view]").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
$("workspaceSwitcher").addEventListener("click",()=>toast("Personal workspace is the active TaskFlow space.","info"));

$("revealPass").addEventListener("click",()=>{const p=$("password");p.type=p.type==="password"?"text":"password";$("revealPass").classList.toggle("visible")});
$("toggleAuth").addEventListener("click",()=>{
  authMode=authMode==="login"?"register":"login"; const r=authMode==="register";
  $("nameField").classList.toggle("hidden",!r);$("fullName").required=r;
  $("authModeLabel").textContent=r?"FIRST TIME HERE":"WELCOME BACK";
  $("authTitle").textContent=r?"Create account":"Sign in";
  $("authSubtitle").textContent=r?"Build a workspace that is yours.":"Pick up where you left off.";
  $("authSubmitText").textContent=r?"Create workspace":"Enter workspace";
  $("toggleAuth").textContent=r?"Already have an account? Sign in":"New here? Create an account";
});
$("authForm").addEventListener("submit",async e=>{
  e.preventDefault(); const fullName=$("fullName").value.trim(),email=$("email").value.trim().toLowerCase(),password=$("password").value;
  if(!email||!password||(authMode==="register"&&!fullName)){toast("Complete the required fields first.","error");return}
  $("authSubmit").disabled=true;$("authSubmitText").textContent="Connecting…";setApiStatus("CONNECTING");
  try{
    if(authMode==="register"){
      await api("/api/register",{method:"POST",body:JSON.stringify({full_name:fullName,email,password})});
      toast("Workspace created. Sign in to continue.","success");$("password").value="";$("toggleAuth").click();$("email").value=email;
    }else{
      const data=await api("/api/login",{method:"POST",body:JSON.stringify({email,password})});
      token=data.token;localStorage.setItem("taskflow_token",token);setProfile(data.user);showWorkspace();await loadTasks();toast(`Welcome back, ${friendlyName(data.user.full_name,data.user.email).split(" ")[0]}.`,"success","Workspace ready");showSessionNudge();
    }
  }catch(err){toast(err.message,"error");await checkApi()}finally{$("authSubmit").disabled=false;$("authSubmitText").textContent=authMode==="register"?"Create workspace":"Enter workspace"}
});
$("logoutBtn").addEventListener("click",logout);
function logout(){token="";localStorage.removeItem("taskflow_token");allTasks=[];document.body.classList.remove("workspace-active");$("authView").classList.remove("hidden");$("workspaceView").classList.add("hidden");$("logoutBtn").classList.add("hidden");$("apiPill").classList.remove("online");setApiStatus("CHECKING API");}
function showWorkspace(){document.body.classList.add("workspace-active");$("authView").classList.add("hidden");$("workspaceView").classList.remove("hidden");$("logoutBtn").classList.remove("hidden");setView("overview")}
async function loadTasks(){
  try{allTasks=await api("/api/tasks");updateStats();renderView();setApiStatus("REST API ONLINE",true)}
  catch(err){if(/Session expired|Invalid authentication/i.test(err.message)){logout();toast("Your session expired. Please sign in again.","error")}else toast(err.message,"error")}
}
async function quickComplete(id){
  const t=allTasks.find(x=>x.id===id); if(!t)return;
  try{await api(`/api/tasks/${id}`,{method:"PUT",body:JSON.stringify({status:t.status==="done"?"pending":"done"})});await loadTasks();toast(t.status==="done"?"Task reopened.":"Task completed. Nice.","success")}catch(err){toast(err.message,"error")}
}
async function checkApi(){try{const d=await api("/",{},1);setApiStatus(d.status==="ok"?"REST API ONLINE":"API CHECKED",d.status==="ok")}catch{setApiStatus("API OFFLINE",false)}}

document.addEventListener("keydown",e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openCommand()}
  if(e.key==="Escape"){ $("commandModal").classList.add("hidden");closeDetail();closeTaskModal();closeSidebarMobile(); }
  const n=Number(e.key); if(n>=1&&n<=7&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&document.activeElement.tagName!=="INPUT"&&document.activeElement.tagName!=="TEXTAREA"){const v=["overview","tasks","today","priority","activity","analytics","focus"][n-1];setView(v)}
});

const authMicroMessages=[
  "Your workspace is ready when you are.",
  "Pick up where you left off.",
  "One clear step at a time.",
  "Plan less. Move with purpose.",
  "Your next useful thing starts here."
];
let authMicroIndex=0;
function rotateAuthMessage(){
  const el=$("authMicroMessage");
  if(!el || $("authView")?.classList.contains("hidden")) return;
  el.classList.remove("is-changing");
  void el.offsetWidth;
  el.textContent=authMicroMessages[authMicroIndex=(authMicroIndex+1)%authMicroMessages.length];
  el.classList.add("is-changing");
}
setInterval(rotateAuthMessage,4200);

function updateClock(){ const now=new Date(); const format=localStorage.getItem("taskflow_time_format")||"12"; const options={hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:format==="12"}; const dateOptions={weekday:"short",month:"short",day:"numeric",year:"numeric"}; const tz=Intl.DateTimeFormat().resolvedOptions().timeZone||"Local time"; const off=new Intl.DateTimeFormat("en",{timeZoneName:"longOffset"}).formatToParts(now).find(p=>p.type==="timeZoneName")?.value||"GMT"; const time=now.toLocaleTimeString([],options); const date=now.toLocaleDateString([],dateOptions); const set=(id,value)=>{const el=$(id);if(el)el.textContent=value}; set("liveClock",time); set("liveDate",date); set("liveZone",`${tz} · ${off}`); set("authLiveClock",time); set("authLiveDate",date); set("authLiveZone",`${tz} · ${off}`); document.querySelectorAll("#vaaniEmbedClock").forEach(e=>e.textContent=time); document.querySelectorAll("#vaaniEmbedDate").forEach(e=>e.textContent=date); }
function resizeVaaniFrame(){
  const shell=document.querySelector(".vaani-frame-shell");
  const frame=document.querySelector(".vaani-frame");
  if(!shell||!frame)return;
  const scale=Math.min(1,Math.max(.72,shell.clientWidth/1280));
  frame.style.setProperty("--vaani-scale",scale.toFixed(4));
  const renderedHeight=Math.round(820*scale);
  const available=Math.max(620,Math.min(820,window.innerHeight-188));
  const desired=Math.min(available,Math.max(660,renderedHeight+18));
  const embed=shell.closest(".vaani-embed");
  if(embed&&window.innerWidth>820) embed.style.height=`${desired}px`;
}
window.addEventListener("resize",resizeVaaniFrame,{passive:true});
if(window.ResizeObserver){ const ro=new ResizeObserver(resizeVaaniFrame); ro.observe(document.body); }
setInterval(updateClock,1000); updateClock();
setTimeout(resizeVaaniFrame,120);

function makeStars(){
  const root=$("stars"); if(!root)return;
  for(let i=0;i<34;i++){const s=document.createElement("i");s.style.left=`${Math.random()*100}%`;s.style.top=`${Math.random()*100}%`;s.style.setProperty("--d",`${2+Math.random()*5}s`);s.style.setProperty("--s",`${1+Math.random()*2}px`);root.appendChild(s)}
}

async function bootstrap(){
  makeStars();checkApi();
  if(!token)return;
  try{const user=await api("/api/me");setProfile(user);showWorkspace();await loadTasks();showSessionNudge()}catch{token="";localStorage.removeItem("taskflow_token")}
}
bootstrap();
