
(function(){
  const CFG = window.LCC_CONFIG || {};
  const hasConfig = Boolean(CFG.supabaseUrl && CFG.supabaseAnonKey && window.supabase);
  const client = hasConfig ? window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey) : null;

  async function currentUser(){
    if(!client) return null;
    const {data:{user}} = await client.auth.getUser();
    return user || null;
  }

  async function signUp(email,password){
    if(!client) throw new Error("Cloud sync is not configured yet.");
    const {data,error} = await client.auth.signUp({email,password});
    if(error) throw error;
    return data;
  }

  async function signIn(email,password){
    if(!client) throw new Error("Cloud sync is not configured yet.");
    const {data,error} = await client.auth.signInWithPassword({email,password});
    if(error) throw error;
    return data;
  }

  async function signOut(){
    if(!client) return;
    const {error} = await client.auth.signOut();
    if(error) throw error;
  }

  async function fetchAll(){
    const user = await currentUser();
    if(!client || !user) return null;
    const [tasksR, projectsR, inboxR] = await Promise.all([
      client.from("tasks").select("*").order("created_at",{ascending:false}),
      client.from("projects").select("*").order("created_at",{ascending:false}),
      client.from("inbox_items").select("*").order("created_at",{ascending:false})
    ]);
    for(const r of [tasksR,projectsR,inboxR]) if(r.error) throw r.error;
    return {
      tasks: tasksR.data.map(rowToTask),
      projects: projectsR.data.map(rowToProject),
      inbox: inboxR.data.map(rowToInbox)
    };
  }

  function rowToTask(r){
    return {
      id:r.id,title:r.title,priority:r.priority,dueDate:r.due_date,duration:r.duration,
      category:r.category,projectId:r.project_id,status:r.status,notes:r.notes||"",
      done:r.status==="Completed"
    };
  }
  function rowToProject(r){
    return {id:r.id,name:r.name,category:r.category,goal:r.goal||"",deadline:r.deadline,status:r.status};
  }
  function rowToInbox(r){
    return {id:r.id,text:r.text,type:r.item_type,category:r.category,priority:r.priority,duration:r.duration};
  }

  async function upsertAll(state){
    const user = await currentUser();
    if(!client || !user) return false;

    const taskRows = state.tasks.map(t=>({
      id:String(t.id),user_id:user.id,title:t.title,priority:t.priority,due_date:t.dueDate||null,
      duration:t.duration||15,category:t.category,project_id:t.projectId?String(t.projectId):null,
      status:t.done?"Completed":(t.status||"Open"),notes:t.notes||""
    }));
    const projectRows = state.projects.map(p=>({
      id:String(p.id),user_id:user.id,name:p.name,category:p.category,goal:p.goal||"",
      deadline:p.deadline||null,status:p.status||"Active"
    }));
    const inboxRows = state.inbox.map((x,i)=>({
      id:String(x.id || ("inbox-"+Date.now()+"-"+i)),user_id:user.id,text:x.text,item_type:x.type||"Task",
      category:x.category||"Personal",priority:x.priority||"Medium",duration:x.duration||15
    }));

    const ops=[];
    if(projectRows.length) ops.push(client.from("projects").upsert(projectRows));
    if(taskRows.length) ops.push(client.from("tasks").upsert(taskRows));
    if(inboxRows.length) ops.push(client.from("inbox_items").upsert(inboxRows));

    const results = await Promise.all(ops);
    const bad=results.find(r=>r.error);
    if(bad) throw bad.error;
    return true;
  }

  async function deleteMissing(state){
    const user=await currentUser();
    if(!client || !user) return;
    const specs=[
      ["tasks", state.tasks.map(x=>String(x.id))],
      ["projects", state.projects.map(x=>String(x.id))],
      ["inbox_items", state.inbox.map((x,i)=>String(x.id || "" )).filter(Boolean)]
    ];
    for(const [table,ids] of specs){
      const {data,error}=await client.from(table).select("id");
      if(error) throw error;
      const remoteIds=data.map(x=>String(x.id));
      const missing=remoteIds.filter(id=>!ids.includes(id));
      if(missing.length){
        const {error:delErr}=await client.from(table).delete().in("id",missing);
        if(delErr) throw delErr;
      }
    }
  }

  function onAuthChange(cb){
    if(!client) return ()=>{};
    const {data:{subscription}}=client.auth.onAuthStateChange((_event,session)=>cb(session?.user||null));
    return ()=>subscription.unsubscribe();
  }

  window.LCCCloud = {
    configured: hasConfig,
    client,
    currentUser,
    signUp,
    signIn,
    signOut,
    fetchAll,
    upsertAll,
    deleteMissing,
    onAuthChange
  };
})();
