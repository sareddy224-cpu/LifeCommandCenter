
const TODAY = isoDate(new Date());
const seedProjects = [
 {id:101,name:"Fall Home Reset",category:"Home",goal:"Get the house ready for fall and winter.",deadline:addDaysISO(34),status:"Active"},
 {id:102,name:"Daycare Planning",category:"Family",goal:"Choose and prepare for Rudy's next daycare setup.",deadline:addDaysISO(45),status:"Active"},
 {id:103,name:"Anniversary Planning",category:"Personal",goal:"Plan a simple anniversary getaway or celebration.",deadline:"2026-11-23",status:"Active"}
];
const seedTasks = [
 {id:1,title:"Buy fall clothes for Rudy",priority:"High",dueDate:TODAY,duration:30,category:"Family",projectId:102,status:"Open",notes:"",done:false},
 {id:2,title:"Organize garage",priority:"Medium",dueDate:addDaysISO(6),duration:60,category:"Home",projectId:101,status:"Open",notes:"",done:false},
 {id:3,title:"Ask mentor about task & priority tracking",priority:"Medium",dueDate:TODAY,duration:15,category:"Personal",projectId:null,status:"Open",notes:"",done:false},
 {id:4,title:"Research Duluth fall weekend hotel",priority:"Low",dueDate:addDaysISO(10),duration:30,category:"Travel",projectId:null,status:"Open",notes:"",done:false},
 {id:5,title:"Add donation items to fall reset",priority:"Low",dueDate:addDaysISO(4),duration:15,category:"Home",projectId:101,status:"Open",notes:"",done:false},
 {id:6,title:"Replace HVAC filter",priority:"Medium",dueDate:addDaysISO(-2),duration:15,category:"Home",projectId:null,status:"Open",notes:"",done:false},
 {id:7,title:"Wait for daycare response",priority:"Medium",dueDate:addDaysISO(3),duration:5,category:"Family",projectId:102,status:"Waiting",notes:"Follow up if no reply.",done:false}
];

let tasks = load("lcc4_tasks", seedTasks).map(t=>({...t,status:t.status||(t.done?"Completed":"Open"),notes:t.notes||""}));
let projects = load("lcc4_projects", seedProjects);
let inbox = load("lcc4_inbox", []);
let taskFilter = "open";
let searchTerm = "";

function load(key, fallback){ try{const v=JSON.parse(localStorage.getItem(key)); return Array.isArray(v)?v:fallback;}catch{return fallback;} }
let cloudSaveTimer=null;
let cloudUser=null;

function setSyncState(kind,text){
 const pill=document.getElementById("syncPill");
 if(pill){pill.className="syncpill "+kind; pill.textContent=text;}
 const float=document.getElementById("mobileCloudBtn");
 if(float){
   float.className="cloudfloat "+(kind==="cloud"?"synced":kind);
   float.textContent=cloudUser ? (kind==="syncing"?"☁️ Syncing…":kind==="error"?"☁️ Sync error":"☁️ Synced") : "☁️ Sign in";
 }
}
function updateAccountUI(){
 const email=document.getElementById("accountEmail");
 const btn=document.getElementById("accountBtn");
 const float=document.getElementById("mobileCloudBtn");
 const header=document.getElementById("headerAccountBtn");
 if(email) email.textContent=cloudUser?.email || "Not signed in";
 if(btn) btn.textContent=cloudUser ? "Sign out" : "Sign in";
 if(float) float.textContent=cloudUser ? "☁️ Synced" : "☁️ Sign in";
 if(header) header.textContent=cloudUser ? "☁️ Synced" : "☁️ Sign in";
}
async function cloudPushNow(){
 if(!window.LCCCloud?.configured || !cloudUser) return;
 try{
   setSyncState("syncing","Syncing…");
   await window.LCCCloud.upsertAll({tasks,projects,inbox});
   setSyncState("cloud","Synced");
 }catch(err){
   console.error(err); setSyncState("error","Sync error");
 }
}
function scheduleCloudPush(){
 if(!window.LCCCloud?.configured || !cloudUser)return;
 clearTimeout(cloudSaveTimer);
 cloudSaveTimer=setTimeout(cloudPushNow,450);
}
function persist(){
 localStorage.setItem("lcc4_tasks",JSON.stringify(tasks));
 localStorage.setItem("lcc4_projects",JSON.stringify(projects));
 localStorage.setItem("lcc4_inbox",JSON.stringify(inbox));
 renderAll();
 scheduleCloudPush();
}
async function loadCloudState(){
 if(!window.LCCCloud?.configured)return;
 try{
   setSyncState("syncing","Loading…");
   const remote=await window.LCCCloud.fetchAll();
   if(remote){
     // First sign-in on an empty cloud account: upload local data.
     const remoteEmpty=remote.tasks.length===0 && remote.projects.length===0 && remote.inbox.length===0;
     if(remoteEmpty && (tasks.length||projects.length||inbox.length)){
       await window.LCCCloud.upsertAll({tasks,projects,inbox});
     }else{
       tasks=remote.tasks; projects=remote.projects; inbox=remote.inbox;
       localStorage.setItem("lcc4_tasks",JSON.stringify(tasks));
       localStorage.setItem("lcc4_projects",JSON.stringify(projects));
       localStorage.setItem("lcc4_inbox",JSON.stringify(inbox));
     }
     renderAll();
     setSyncState("cloud","Synced");
   }
 }catch(err){console.error(err);setSyncState("error","Sync error");toast("Cloud sync could not load. Local data is still safe.");}
}

window.LCCAuthUI = {
  open(){
    if(typeof cloudUser!=="undefined" && cloudUser){
      if(typeof pullLatestCloud==="function") pullLatestCloud();
      if(typeof toast==="function") toast("Already signed in. Refreshing cloud sync.");
      return;
    }
    const modal=document.getElementById("authModal");
    if(modal) modal.classList.add("show");
  }
};

function isoDate(d){ return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10); }
function addDaysISO(days){ const d=new Date(); d.setDate(d.getDate()+days); return isoDate(d); }
function parseDate(s){ if(!s) return null; const [y,m,d]=s.split("-").map(Number); return new Date(y,m-1,d); }
function dayDiff(dateStr){ if(!dateStr) return 9999; const a=parseDate(TODAY), b=parseDate(dateStr); return Math.round((b-a)/86400000); }
function prettyDate(s){ if(!s) return "No date"; const diff=dayDiff(s); if(diff===0)return "Today"; if(diff===1)return "Tomorrow"; if(diff===-1)return "Yesterday"; return parseDate(s).toLocaleDateString(undefined,{month:"short",day:"numeric"}); }
function esc(s=""){ return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c])); }
function sameId(a,b){ return String(a)===String(b); }
function projectById(id){ return projects.find(p=>sameId(p.id,id)); }
function priorityRank(p){ return ({Critical:0,High:1,Medium:2,Low:3})[p] ?? 4; }
function taskSort(a,b){ return priorityRank(a.priority)-priorityRank(b.priority) || dayDiff(a.dueDate)-dayDiff(b.dueDate); }
function isDone(t){ return t.done || t.status==="Completed"; }
function isWaiting(t){ return t.status==="Waiting"; }

function renderAll(){
 renderProjectOptions();
 renderToday();
 renderInbox();
 renderTasks();
 renderProjects();
 renderCategoryViews();
 document.getElementById("inboxBadge").textContent=inbox.length?String(inbox.length):"";
}
function renderProjectOptions(){
 const options = `<option value="">No project</option>` + projects.filter(p=>p.status!=="Archived").map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("");
 ["quickProject","editTaskProject"].forEach(id=>{const el=document.getElementById(id); if(el)el.innerHTML=options;});
}
function renderToday(){
 const open=tasks.filter(t=>!isDone(t)&&!isWaiting(t));
 const today=open.filter(t=>t.dueDate===TODAY).sort(taskSort);
 const overdue=open.filter(t=>t.dueDate && t.dueDate<TODAY).sort(taskSort);
 const upcoming=open.filter(t=>t.dueDate && t.dueDate>TODAY && dayDiff(t.dueDate)<=14).sort((a,b)=>dayDiff(a.dueDate)-dayDiff(b.dueDate));
 const waiting=tasks.filter(t=>!isDone(t)&&isWaiting(t));
 document.getElementById("todayCount").textContent=today.length;
 document.getElementById("overdueCount").textContent=overdue.length;
 document.getElementById("projectCount").textContent=projects.filter(p=>p.status==="Active").length;
 document.getElementById("waitingCount").textContent=waiting.length;
 document.getElementById("attention").innerHTML=listHTML(overdue.concat(open.filter(t=>t.priority==="Critical"&&!overdue.some(x=>x.id===t.id))).slice(0,5),"Nothing urgent. Nice.");
 document.getElementById("todayTasks").innerHTML=listHTML(today.slice(0,6),"Your today list is clear.");
 document.getElementById("upcomingTasks").innerHTML=listHTML(upcoming.slice(0,6),"Nothing due in the next two weeks.");
 const radar = projects.filter(p=>p.status==="Active").sort((a,b)=>dayDiff(a.deadline)-dayDiff(b.deadline)).slice(0,4);
 document.getElementById("radar").innerHTML=radar.map(p=>{
   const openCount=tasks.filter(t=>sameId(t.projectId,p.id)&&!isDone(t)).length;
   return `<button class="radaritem" data-open-project="${p.id}"><b>${esc(p.name)}</b><span>${openCount} open · ${p.deadline?prettyDate(p.deadline):"No deadline"}</span></button>`;
 }).join("") || '<div class="empty">No active projects.</div>';
}
function taskHTML(t){
 const p=projectById(t.projectId);
 return `<div class="task ${isDone(t)?"done":""}">
   <input type="checkbox" data-toggle-task="${t.id}" ${isDone(t)?"checked":""}>
   <div class="tasktext">
     <div class="tasktitle" data-edit-task="${t.id}">${esc(t.title)}</div>
     <div class="meta">${esc(t.category)}${p?` · ${esc(p.name)}`:""}${t.notes?` · note`:""}</div>
   </div>
   ${isWaiting(t)?'<span class="pill waiting">Waiting</span>':`<span class="pill ${["High","Critical"].includes(t.priority)?"high":""}">${esc(t.priority)}</span>`}
   <span class="date">${prettyDate(t.dueDate)}</span>
 </div>`;
}
function listHTML(arr,emptyText){ return arr.length?arr.map(taskHTML).join(""):`<div class="empty">${emptyText}</div>`; }

function renderInbox(){
 document.getElementById("inboxList").innerHTML = inbox.length ? inbox.map((x,i)=>`
 <div class="task">
   <div class="tasktext"><b>${esc(x.text)}</b><div class="meta">Suggested: ${esc(x.type)} · ${esc(x.category)} · ${esc(x.priority)} · ${x.duration} min</div></div>
   <button class="secondary" data-process-inbox="${i}">${x.type==="Project"?"Create project":"Create task"}</button>
   <button class="iconbtn" title="Delete" data-delete-inbox="${i}">×</button>
 </div>`).join("") : `<div class="empty"><strong>Inbox zero.</strong> Anything you capture here will stay visible until you process it.</div>`;
}
function renderTasks(){
 let arr=[...tasks];
 if(taskFilter==="open") arr=arr.filter(t=>!isDone(t)&&!isWaiting(t));
 if(taskFilter==="today") arr=arr.filter(t=>!isDone(t)&&!isWaiting(t)&&t.dueDate===TODAY);
 if(taskFilter==="upcoming") arr=arr.filter(t=>!isDone(t)&&!isWaiting(t)&&t.dueDate>TODAY);
 if(taskFilter==="overdue") arr=arr.filter(t=>!isDone(t)&&!isWaiting(t)&&t.dueDate<TODAY);
 if(taskFilter==="waiting") arr=arr.filter(t=>!isDone(t)&&isWaiting(t));
 if(taskFilter==="done") arr=arr.filter(t=>isDone(t));
 if(searchTerm) arr=arr.filter(t=>taskMatches(t,searchTerm));
 arr.sort(taskSort);
 document.getElementById("allTasks").innerHTML=listHTML(arr,"No tasks in this filter.");
 document.querySelectorAll("[data-filter]").forEach(b=>b.classList.toggle("active",b.dataset.filter===taskFilter));
}
function projectProgress(id){
 const pts=tasks.filter(t=>sameId(t.projectId,id));
 if(!pts.length)return 0;
 return Math.round(pts.filter(t=>isDone(t)).length/pts.length*100);
}
function renderProjects(){
 let ps=[...projects];
 if(searchTerm) ps=ps.filter(p=>(p.name+" "+(p.goal||"")+" "+p.category).toLowerCase().includes(searchTerm));
 document.getElementById("projectList").innerHTML=ps.length?ps.map(p=>{
  const pct=projectProgress(p.id), open=tasks.filter(t=>sameId(t.projectId,p.id)&&!isDone(t)).length;
  return `<button class="project clickable" data-open-project="${p.id}">
   <div class="projecttop"><div><b>${esc(p.name)}</b><div class="meta">${esc(p.goal||"")}</div></div><span class="pill">${esc(p.status)}</span></div>
   <div class="bar"><i style="width:${pct}%"></i></div>
   <div class="projectfooter"><span class="meta">${pct}% complete · ${open} open</span><span class="date">${p.deadline?prettyDate(p.deadline):"No deadline"}</span></div>
  </button>`;
 }).join(""):'<div class="empty">No projects found.</div>';
}
function renderCategoryViews(){
 document.querySelectorAll(".category-view").forEach(sec=>{
  const cat=sec.dataset.category;
  const catTasks=tasks.filter(t=>t.category===cat&&!isDone(t)).sort(taskSort);
  const catProjects=projects.filter(p=>p.category===cat&&p.status!=="Archived");
  sec.innerHTML=`<div class="top"><div><div class="eyebrow">Life area</div><h1>${cat}</h1></div><button class="primary" data-action="quick-add">+ Add</button></div>
  <div class="categorysummary">
    <div class="panel"><h2>Open tasks</h2><div class="stack">${listHTML(catTasks.slice(0,12),"Nothing open here.")}</div></div>
    <div class="panel"><h2>Projects</h2><div class="stack">${catProjects.length?catProjects.map(p=>`<button class="project clickable" data-open-project="${p.id}"><div class="projecttop"><b>${esc(p.name)}</b><span class="date">${p.deadline?prettyDate(p.deadline):"No deadline"}</span></div><div class="bar"><i style="width:${projectProgress(p.id)}%"></i></div></button>`).join(""):'<div class="empty">No active projects.</div>'}</div></div>
  </div>`;
 });
}

function interpret(text){
 const s=text.toLowerCase(); let category="Personal",type="Task",duration=15,priority="Medium";
 if(/rudy|daycare|family|birthday|toddler|child/.test(s))category="Family";
 else if(/garage|house|home|clean|closet|kitchen|storage|cleaner|hvac/.test(s))category="Home";
 else if(/hotel|trip|travel|flight|airbnb|duluth|maui|hawaii|vacation/.test(s))category="Travel";
 if(/reset|plan(ning)?|prepare.*house/.test(s))type="Project";
 if(/urgent|asap|today|must/.test(s))priority="High";
 if(/book|schedule|call|ask|email/.test(s))duration=5;
 else if(/research|buy|shop|hotel/.test(s))duration=30;
 else if(/clean|organize|reset/.test(s))duration=60;
 return {type,category,duration,priority};
}
function taskMatches(t,term){
 const p=projectById(t.projectId);
 return [t.title,t.notes,t.category,t.priority,t.status,p?.name].filter(Boolean).join(" ").toLowerCase().includes(term);
}
function addTask(text,dueDate,priority,projectId=null,category=null,status="Open"){
 const suggestion=interpret(text);
 const linked=projectById(projectId);
 const task={id:Date.now()+Math.floor(Math.random()*1000),title:text,priority:priority||suggestion.priority,dueDate:dueDate||null,duration:suggestion.duration,category:category||linked?.category||suggestion.category,projectId:projectId?Number(projectId):null,status,notes:"",done:status==="Completed"};
 tasks.unshift(task); persist(); return task;
}
function capture(){
 const el=document.getElementById("inboxInput"), text=el.value.trim(); if(!text)return;
 inbox.unshift({text,...interpret(text)}); el.value=""; persist(); toast("Captured. It will stay in Inbox until you process it.");
}
function processInbox(i){
 const x=inbox[i]; if(!x)return;
 if(x.type==="Project"){
   projects.unshift({id:Date.now(),name:x.text,category:x.category,goal:"",deadline:null,status:"Active"});
   inbox.splice(i,1); persist(); toast("Created project.");
 }else{
   addTask(x.text,null,x.priority,null,x.category); inbox.splice(i,1); persist(); toast("Created task.");
 }
}
function openTask(id){
 const t=tasks.find(x=>sameId(x.id,id)); if(!t)return;
 document.getElementById("editTaskId").value=t.id;
 document.getElementById("editTaskTitle").value=t.title;
 document.getElementById("editTaskDate").value=t.dueDate||"";
 document.getElementById("editTaskPriority").value=t.priority;
 document.getElementById("editTaskProject").value=t.projectId||"";
 document.getElementById("editTaskStatus").value=isDone(t)?"Completed":t.status||"Open";
 document.getElementById("editTaskCategory").value=t.category;
 document.getElementById("editTaskDuration").value=String(t.duration||15);
 document.getElementById("editTaskNotes").value=t.notes||"";
 showModal("taskModal");
}
function saveTaskChanges(){
 const id=Number(document.getElementById("editTaskId").value), t=tasks.find(x=>sameId(x.id,id)); if(!t)return;
 const title=document.getElementById("editTaskTitle").value.trim(); if(!title){toast("Task needs a title.");return;}
 t.title=title;
 t.dueDate=document.getElementById("editTaskDate").value||null;
 t.priority=document.getElementById("editTaskPriority").value;
 t.projectId=document.getElementById("editTaskProject").value||null;
 t.status=document.getElementById("editTaskStatus").value;
 t.done=t.status==="Completed";
 t.category=document.getElementById("editTaskCategory").value;
 t.duration=Number(document.getElementById("editTaskDuration").value);
 t.notes=document.getElementById("editTaskNotes").value.trim();
 hideModal("taskModal"); persist(); toast("Task updated.");
}
async function deleteTask(){
 const id=document.getElementById("editTaskId").value;
 tasks=tasks.filter(t=>!sameId(t.id,id)); hideModal("taskModal"); persist();
 if(cloudUser && window.LCCCloud?.configured){
   try{await window.LCCCloud.deleteRow("tasks",id); setSyncState("cloud","Synced");}
   catch(err){console.error(err);setSyncState("error","Sync error");}
 }
 toast("Task deleted.");
}

function openProject(id){
 const p=projectById(id); if(!p)return;
 document.getElementById("projectModalTitle").textContent=p.name;
 const pts=tasks.filter(t=>sameId(t.projectId,id)).sort(taskSort);
 const waiting=pts.filter(t=>isWaiting(t)&&!isDone(t)).length;
 document.getElementById("projectDetail").innerHTML=`
  <div class="project-toolbar">
    <div><p>${esc(p.goal||"No goal added yet.")}</p><div class="meta">${esc(p.category)} · ${esc(p.status)} · ${p.deadline?prettyDate(p.deadline):"No deadline"} · ${projectProgress(id)}% complete${waiting?` · ${waiting} waiting`:""}</div></div>
    <button class="secondary" data-edit-project="${id}">Edit project</button>
  </div>
  <div class="bar"><i style="width:${projectProgress(id)}%"></i></div>
  <h3>Tasks</h3>
  <div class="stack">${listHTML(pts,"No tasks in this project yet.")}</div>
  <h3>Add task directly to this project</h3>
  <div class="mutedbox">This task will automatically inherit the project’s category: <b>${esc(p.category)}</b>.</div>
  <div class="row" style="margin-top:8px">
    <input id="projectTaskInput" placeholder="Task name">
    <input id="projectTaskDate" type="date">
  </div>
  <div class="row">
    <select id="projectTaskPriority"><option>Medium</option><option>High</option><option>Low</option><option>Critical</option></select>
    <select id="projectTaskStatus"><option>Open</option><option>Waiting</option></select>
    <button class="primary" data-add-project-task="${id}">Add task</button>
  </div>`;
 showModal("projectModal");
}
function openProjectEditor(id){
 const p=projectById(id); if(!p)return;
 document.getElementById("editProjectId").value=p.id;
 document.getElementById("editProjectName").value=p.name;
 document.getElementById("editProjectGoal").value=p.goal||"";
 document.getElementById("editProjectCategory").value=p.category;
 document.getElementById("editProjectDeadline").value=p.deadline||"";
 document.getElementById("editProjectStatus").value=p.status||"Active";
 hideModal("projectModal"); showModal("editProjectModal");
}
function saveProjectChanges(){
 const id=document.getElementById("editProjectId").value, p=projectById(id); if(!p)return;
 const oldCategory=p.category;
 p.name=document.getElementById("editProjectName").value.trim()||p.name;
 p.goal=document.getElementById("editProjectGoal").value.trim();
 p.category=document.getElementById("editProjectCategory").value;
 p.deadline=document.getElementById("editProjectDeadline").value||null;
 p.status=document.getElementById("editProjectStatus").value;
 if(oldCategory!==p.category){
   tasks.filter(t=>sameId(t.projectId,id)).forEach(t=>t.category=p.category);
 }
 hideModal("editProjectModal"); persist(); openProject(id); toast("Project updated.");
}
async function deleteProject(){
 const id=document.getElementById("editProjectId").value;
 tasks.forEach(t=>{if(sameId(t.projectId,id))t.projectId=null;});
 projects=projects.filter(p=>!sameId(p.id,id));
 hideModal("editProjectModal"); persist(); switchView("projects");
 if(cloudUser && window.LCCCloud?.configured){
   try{await window.LCCCloud.deleteRow("projects",id); setSyncState("cloud","Synced");}
   catch(err){console.error(err);setSyncState("error","Sync error");}
 }
 toast("Project deleted. Its tasks were kept in All Tasks.");
}
function saveNewProject(){
 const name=document.getElementById("projectName").value.trim(); if(!name){toast("Give the project a name first.");return;}
 const p={id:Date.now(),name,category:document.getElementById("projectCategory").value,goal:document.getElementById("projectGoal").value.trim(),deadline:document.getElementById("projectDeadline").value||null,status:"Active"};
 projects.unshift(p);
 ["projectName","projectGoal","projectDeadline"].forEach(id=>document.getElementById(id).value="");
 hideModal("newProjectModal"); persist(); switchView("projects"); toast("Project created.");
}
function quickSave(){
 const text=document.getElementById("quickText").value.trim(); if(!text){toast("Add a task first.");return;}
 const due=document.getElementById("quickDate").value||null;
 const priority=document.getElementById("quickPriority").value;
 const projectId=document.getElementById("quickProject").value||null;
 const status=document.getElementById("quickStatus").value;
 const t=addTask(text,due,priority,projectId,null,status);
 document.getElementById("quickText").value=""; document.getElementById("quickDate").value=""; document.getElementById("quickProject").value=""; document.getElementById("quickStatus").value="Open";
 hideModal("quickModal"); switchView("tasks"); taskFilter="open"; renderTasks();
 toast(`${t.title} added${projectId?` to ${projectById(projectId)?.name}`:""}.`);
}
function recommend(minutes){
 const choices=tasks.filter(t=>!isDone(t)&&!isWaiting(t)&&t.duration<=minutes)
 .sort((a,b)=>{const ad=a.dueDate&&a.dueDate<=TODAY?-10:0, bd=b.dueDate&&b.dueDate<=TODAY?-10:0; return ad-bd || priorityRank(a.priority)-priorityRank(b.priority) || a.duration-b.duration;}).slice(0,3);
 document.getElementById("recommendation").innerHTML=choices.length?choices.map(taskHTML).join(""):'<div class="empty">Nothing fits that window. That is allowed. ✨</div>';
}
function showModal(id){const el=document.getElementById(id); if(el)el.classList.add("show");}
function hideModal(id){const el=document.getElementById(id); if(el)el.classList.remove("show");}
function switchView(id){
 document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===id));
 document.querySelectorAll(".nav button").forEach(b=>b.classList.toggle("active",b.dataset.view===id));
 window.scrollTo({top:0,behavior:"smooth"});
}
function toast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2500);}

document.addEventListener("click",e=>{
 const nav=e.target.closest("[data-view]"); if(nav){switchView(nav.dataset.view);return;}
 const viewTarget=e.target.closest("[data-view-target]"); if(viewTarget){switchView(viewTarget.dataset.viewTarget);return;}
 if(e.target.closest("[data-action='quick-add']")){renderProjectOptions();showModal("quickModal");setTimeout(()=>document.getElementById("quickText").focus(),30);return;}
 const close=e.target.closest("[data-close]"); if(close){hideModal(close.dataset.close);return;}
 const toggle=e.target.closest("[data-toggle-task]"); if(toggle){const t=tasks.find(x=>sameId(x.id,toggle.dataset.toggleTask)); if(t){t.done=toggle.checked;t.status=t.done?"Completed":"Open";persist();} return;}
 const editTask=e.target.closest("[data-edit-task]"); if(editTask){openTask(editTask.dataset.editTask);return;}
 const proc=e.target.closest("[data-process-inbox]"); if(proc){processInbox(Number(proc.dataset.processInbox));return;}
 const del=e.target.closest("[data-delete-inbox]"); if(del){
   const idx=Number(del.dataset.deleteInbox), item=inbox[idx];
   inbox.splice(idx,1);persist();
   if(item?.id && cloudUser && window.LCCCloud?.configured){window.LCCCloud.deleteRow("inbox_items",item.id).catch(console.error);}
   return;
 }
 const proj=e.target.closest("[data-open-project]"); if(proj){openProject(proj.dataset.openProject);return;}
 const editProj=e.target.closest("[data-edit-project]"); if(editProj){openProjectEditor(editProj.dataset.editProject);return;}
 const addPT=e.target.closest("[data-add-project-task]"); if(addPT){
   const id=addPT.dataset.addProjectTask, p=projectById(id);
   const text=document.getElementById("projectTaskInput").value.trim();
   if(!text){toast("Add a task name first.");return;}
   addTask(text,document.getElementById("projectTaskDate").value||null,document.getElementById("projectTaskPriority").value,id,p.category,document.getElementById("projectTaskStatus").value);
   openProject(id); toast("Task added directly to project."); return;
 }
 const rec=e.target.closest("[data-recommend]"); if(rec){recommend(Number(rec.dataset.recommend));return;}
 const filter=e.target.closest("[data-filter]"); if(filter){taskFilter=filter.dataset.filter;renderTasks();return;}
 if(e.target.closest("[data-action='show-today']")){taskFilter="today";switchView("tasks");renderTasks();return;}
 if(e.target.closest("[data-action='show-overdue']")){taskFilter="overdue";switchView("tasks");renderTasks();return;}
 if(e.target.closest("[data-action='show-waiting']")){taskFilter="waiting";switchView("tasks");renderTasks();return;}
});

document.getElementById("captureBtn").addEventListener("click",capture);
document.getElementById("inboxInput").addEventListener("keydown",e=>{if(e.key==="Enter")capture();});
document.getElementById("quickSaveBtn").addEventListener("click",quickSave);
document.getElementById("quickText").addEventListener("keydown",e=>{if(e.key==="Enter")quickSave();});
document.getElementById("newProjectBtn").addEventListener("click",()=>showModal("newProjectModal"));
document.getElementById("saveProjectBtn").addEventListener("click",saveNewProject);
document.getElementById("saveTaskBtn").addEventListener("click",saveTaskChanges);
document.getElementById("deleteTaskBtn").addEventListener("click",deleteTask);
document.getElementById("saveProjectChangesBtn").addEventListener("click",saveProjectChanges);
document.getElementById("deleteProjectBtn").addEventListener("click",deleteProject);
document.getElementById("globalSearch").addEventListener("input",e=>{
 searchTerm=e.target.value.trim().toLowerCase();
 if(searchTerm){taskFilter="all";switchView("tasks");}
 renderTasks(); renderProjects();
});

const now=new Date(), hour=now.getHours();
document.getElementById("greeting").textContent=`Good ${hour<12?"morning":hour<17?"afternoon":"evening"} 👋`;
document.getElementById("dateLabel").textContent=now.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"});
renderAll();



let cloudPollTimer=null;
let cloudPullBusy=false;

async function pullLatestCloud(){
 if(!cloudUser || !window.LCCCloud?.configured || cloudPullBusy) return;
 cloudPullBusy=true;
 try{
   const remote=await window.LCCCloud.fetchAll();
   if(remote){
     tasks=remote.tasks; projects=remote.projects; inbox=remote.inbox;
     localStorage.setItem("lcc4_tasks",JSON.stringify(tasks));
     localStorage.setItem("lcc4_projects",JSON.stringify(projects));
     localStorage.setItem("lcc4_inbox",JSON.stringify(inbox));
     renderAll();
     setSyncState("cloud","Synced");
   }
 }catch(err){
   console.error(err); setSyncState("error","Sync error");
 }finally{cloudPullBusy=false;}
}
function startCloudPolling(){
 clearInterval(cloudPollTimer);
 if(cloudUser && window.LCCCloud?.configured){
   cloudPollTimer=setInterval(()=>{ if(document.visibilityState==="visible") pullLatestCloud(); },4000);
 }
}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")pullLatestCloud();});

async function initCloud(){
 if(!window.LCCCloud?.configured){
   setSyncState("local","Local mode");
   updateAccountUI();
   return;
 }
 try{
   cloudUser=await window.LCCCloud.currentUser();
   updateAccountUI();
   if(cloudUser){ await loadCloudState(); startCloudPolling(); }
   else setSyncState("local","Sign in to sync");
   window.LCCCloud.onAuthChange(async user=>{
     cloudUser=user; updateAccountUI();
     if(user){ await loadCloudState(); startCloudPolling(); }
     else {clearInterval(cloudPollTimer); setSyncState("local","Sign in to sync");}
   });
 }catch(err){console.error(err);setSyncState("error","Cloud error");}
}



async function handleAccountAction(){
 if(cloudUser){
   try{
     await window.LCCCloud.signOut();
     cloudUser=null; updateAccountUI(); clearInterval(cloudPollTimer);
     setSyncState("local","Signed out");
     toast("Signed out. Local data stays on this device.");
   }catch(err){toast(err.message||"Could not sign out.");}
 }else{
   showModal("authModal");
 }
}
window.LCCAuthUI.open = handleAccountAction;

document.getElementById("headerAccountBtn")?.addEventListener("click",(e)=>{e.preventDefault(); handleAccountAction();});
document.getElementById("signUpBtn").addEventListener("click",async()=>{
 const email=document.getElementById("authEmail").value.trim(), password=document.getElementById("authPassword").value;
 try{
   const data=await window.LCCCloud.signUp(email,password);
   toast("Account created. Check your email if confirmation is required.");
   if(data.user){cloudUser=data.user; updateAccountUI(); await loadCloudState(); startCloudPolling(); hideModal("authModal");}
 }catch(err){toast(err.message||"Could not create account.");}
});
document.getElementById("signInBtn").addEventListener("click",async()=>{
 const email=document.getElementById("authEmail").value.trim(), password=document.getElementById("authPassword").value;
 try{
   const data=await window.LCCCloud.signIn(email,password);
   cloudUser=data.user; updateAccountUI(); await loadCloudState(); startCloudPolling(); hideModal("authModal"); toast("Signed in. Cloud sync is on.");
 }catch(err){toast(err.message||"Could not sign in.");}
});

initCloud();


function updateAuthHelp(){
 const help=document.getElementById("authHelp");
 if(!help)return;
 if(!window.LCCCloud?.configured){
   help.innerHTML="Cloud connection did not initialize. Refresh the page. If this remains, the deployed files are incomplete or the Supabase browser library was blocked.";
 }else{
   help.textContent="Use the same Life Command Center email and password on every device.";
 }
}
updateAuthHelp();
