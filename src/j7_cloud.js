/* ================= classroom layer: shared progress, class problems, AI, file import =================
   On claude.ai the page gets a shared database (db), who is viewing (user), Claude (sample) and file
   storage (assets). Anywhere else everything still works on this device, with the same API. */
ICP.upload='<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5"/><path d="M4.5 14.5V18a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3.5"/>';
ICP.pencil='<path d="M4.2 19.8l1.1-4.5L15.7 4.9a2.1 2.1 0 0 1 3 0l.4.4a2.1 2.1 0 0 1 0 3L8.7 18.7z"/><path d="M13.9 6.7l3.4 3.4"/>';
ICP.arrowD='<path d="M12 4.5v15M5.5 13l6.5 6.5 6.5-6.5"/>';
ICP.wand='<path d="M4.5 19.5 14.5 9.5"/><path d="M13 8l3 3"/><path d="M17.5 3v3.4M15.8 4.7h3.4M20 10v2.4M18.8 11.2h2.4M9.8 3.2v2.4M8.6 4.4H11"/>';
const Cloud={ready:false,local:true,db:null,user:null,sample:null,assets:null,geminiImport:false,geminiLocked:false,hosted:false,directUploadLimit:0,largeUploads:false,uid:"local",me:null,canEdit:true,isOwner:false,
  problems:{},keys:{},progress:{},progressLoaded:false,config:{hints:true},subs:{},slow:{},err:{},writeOK:null,ev:new EventTarget()};
const cloudOn=(n,f)=>Cloud.ev.addEventListener(n,f);
const cloudEmit=n=>Cloud.ev.dispatchEvent(new Event(n));
const newId=()=>"p"+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const plain=h=>String(h??"").replace(/<[^>]+>/g,"").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&").replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g," ").trim();

/* ---------- a small stand-in for the shared database, kept in this browser ---------- */
function localDB(){
  const KEY="modelquest.local.db"; let data={};
  try{data=JSON.parse(localStorage.getItem(KEY)||"{}")||{}}catch(e){}
  const subs=new Set(), meta={fromCache:false,hasPendingWrites:false};
  const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){}};
  const notify=()=>subs.forEach(f=>{try{f()}catch(e){console.error(e)}});
  addEventListener("storage",e=>{if(e.key===KEY){try{data=JSON.parse(e.newValue||"{}")||{}}catch(x){} notify()}});
  const clone=x=>x==null?x:JSON.parse(JSON.stringify(x));
  const merge=(a,b)=>{const o=Object.assign({},a); for(const k in b){o[k]=b[k]&&typeof b[k]==="object"&&!Array.isArray(b[k])&&a&&typeof a[k]==="object"&&!Array.isArray(a[k])?merge(a[k],b[k]):b[k]} return o};
  const snapDoc=p=>({id:p.split("/").pop(),exists:p in data,data:()=>clone(data[p]),metadata:meta});
  const snapCol=c=>{const pre=c+"/"; const docs=Object.keys(data).filter(k=>k.startsWith(pre)&&!k.slice(pre.length).includes("/")).sort().map(snapDoc);
    return {docs,size:docs.length,empty:!docs.length,docChanges:()=>[],metadata:meta}};
  const docRef=p=>({id:p.split("/").pop(),path:p,
    get:async()=>snapDoc(p),
    set:async d=>{data[p]=clone(d); persist(); notify()},
    update:async d=>{if(!(p in data)) throw {code:"invalid_argument",message:"Document does not exist"}; data[p]=merge(data[p],clone(d)); persist(); notify()},
    delete:async()=>{delete data[p]; persist(); notify()},
    onSnapshot(next){const f=()=>next(snapDoc(p)); subs.add(f); setTimeout(f,0); return ()=>subs.delete(f)},
    collection:s=>col(p+"/"+s)});
  const col=c=>{const q={path:c,doc:id=>docRef(c+"/"+(id||newId())),add:async d=>{const r=q.doc(); await r.set(d); return r},
    get:async()=>snapCol(c),onSnapshot(next){const f=()=>next(snapCol(c)); subs.add(f); setTimeout(f,0); return ()=>subs.delete(f)},
    where:()=>q,orderBy:()=>q,limit:()=>q}; return q};
  return {doc:docRef,collection:col};
}

/* ---------- start-up ---------- */
async function cloudInit(){
  const geminiStatus=getGeminiStatus();
  let db=null,user=null,sample=null,assets=null;
  try{if(window.claude&&typeof window.claude.use==="function")
    [db,user,sample,assets]=await Promise.all(["db","user","sample","assets"].map(n=>window.claude.use(n).catch(()=>null)))}catch(e){}
  Cloud.user=user; Cloud.sample=sample; Cloud.assets=assets;
  if(db){Cloud.db=db; Cloud.local=false;
    const me=user?await user.me():null; Cloud.me=me; Cloud.uid=me&&me.id; Cloud.canEdit=!!(me&&me.canEdit); Cloud.isOwner=!!(me&&me.isOwner);
    Cloud.canWrite=user?await user.can("data.write"):null}
  else{Cloud.db=localDB(); Cloud.local=true; Cloud.uid="local"; Cloud.canEdit=true}
  const capabilities=await geminiStatus;
  Cloud.hosted=!!capabilities;
  Cloud.geminiImport=capabilities?.available===true;
  Cloud.geminiLocked=capabilities?.requiresAccess===true;
  Cloud.directUploadLimit=capabilities?.directUploadLimit||0;
  Cloud.largeUploads=capabilities?.largeUploads===true;
  if(Cloud.geminiLocked&&!capabilities.authorized) setTeacherAiToken("");
  // first visit by someone who can edit the page: start them as a teacher
  if(!Cloud.local&&Cloud.canEdit&&!S.roleSet){S.role="teacher"; S.teacher=true; save(); applyRole()}
  Cloud.ready=true;
  cloudWatch("problems",Cloud.db.collection("problems"),snap=>{const o={}; snap.docs.forEach(d=>{const x=d.data(); if(x) o[d.id]=normProblem(Object.assign({},x,{id:d.id}))}); Cloud.problems=o; registerProblems(); cloudEmit("problems")});
  cloudWatch("config",Cloud.db.doc("config/class"),snap=>{Cloud.config=Object.assign({hints:true},snap.exists?snap.data():{}); cloudEmit("config")});
  if(S.teacher) teacherSubs();
  await restoreProgress();
  cloudEmit("ready");
  syncProgress();
}
function cloudWatch(name,ref,fn){if(Cloud.subs[name]) return;
  const t=setTimeout(()=>{Cloud.slow[name]=true; cloudEmit("slow")},10000);
  Cloud.subs[name]=ref.onSnapshot(s=>{if(!s.metadata||!s.metadata.fromCache){clearTimeout(t); Cloud.slow[name]=false} fn(s)},
    e=>{clearTimeout(t); Cloud.err[name]=e&&e.code||"unavailable"; Cloud.slow[name]=false; cloudEmit("err")})}
function teacherSubs(){if(!Cloud.ready) return;
  if(Cloud.local||Cloud.canEdit){
    cloudWatch("progress",Cloud.db.collection("progress"),snap=>{const o={}; snap.docs.forEach(d=>{const x=d.data(); if(x) o[d.id]=x}); Cloud.progress=o; Cloud.progressLoaded=true; cloudEmit("progress")});
    cloudWatch("keys",Cloud.db.collection("keys"),snap=>{const o={}; snap.docs.forEach(d=>{const x=d.data(); if(x) o[d.id]=x}); Cloud.keys=o; cloudEmit("keys")})}}

/* ---------- each student's progress, shared with the teacher ---------- */
const isFresh=()=>Object.values(S.missions).every(m=>!m.opened&&!m.reached&&!m.done);
async function restoreProgress(){
  if(Cloud.local||!Cloud.uid||!isFresh()) return;
  try{const s=await Cloud.db.doc("progress/"+Cloud.uid).get(); const x=s.exists&&s.data();
    if(x&&x.state&&typeof x.state==="object"){if(x.sv!==3) migrateSteps(x.state,x.sv); for(const k in x.state) S.missions[k]=Object.assign(blankMission(),x.state[k]); if(x.nick&&!S.nick) S.nick=x.nick; save(); route()}}catch(e){}}
function pickAnswers(d){const o={}; ["ans","why","lim","a1","a2","ad","sp","tw"].forEach(k=>{if(d[k]!=null&&d[k]!=="") o[k]=String(d[k]).slice(0,1200)}); return o}
function progressBody(){const ms={};
  for(const id in S.missions){const st=S.missions[id]; if(!st.opened&&!st.reached&&!st.done) continue; const d=st.d||{};
    ms[id]={step:st.step,reached:st.reached,done:!!st.done,opened:!!st.opened,runs:st.runs||0,hints:st.hints||0,passed:d.passed??null,
      goal:d.goalNow?d.goalNow.t:"",goalsDone:d.goalsDone||0,goalsTotal:d.goalsTotal||0,at:st.at||0,answers:pickAnswers(d)}}
  return {v:1,sv:3,nick:String(S.nick||"").slice(0,40),missions:ms,badges:Object.keys(S.badges),state:S.missions}}
let syncT=0,lastSync="";
function syncProgress(now){if(!Cloud.ready||Cloud.local||!Cloud.uid||S.teacher) return; clearTimeout(syncT); syncT=setTimeout(doSync,now?0:2500)}
async function doSync(){const body=progressBody(), j=JSON.stringify(body); if(j===lastSync) return;
  try{await Cloud.db.doc("progress/"+Cloud.uid).set(Object.assign(body,{at:Date.now()})); lastSync=j; if(Cloud.writeOK!==true){Cloud.writeOK=true; cloudEmit("sync")}}
  catch(e){Cloud.writeOK=false; Cloud.writeErr=e&&e.code; cloudEmit("sync")}}
function trackGoals(st,G){const first=G.find(g=>!g.ok), cur=first?{k:first.k,t:plain(first.t)}:null, done=G.filter(g=>g.ok).length;
  const was=JSON.stringify([st.d.goalNow||null,st.d.goalsDone||0,st.d.goalsTotal||0]);
  st.d.goalNow=cur; st.d.goalsDone=done; st.d.goalsTotal=G.length;
  if(was!==JSON.stringify([cur,done,G.length])) save()}
const hintsOn=()=>S.teacher||Cloud.config.hints!==false;

/* ---------- formulas (teacher solutions, used to check students' models) ---------- */
const FN1={sqrt:Math.sqrt,abs:Math.abs,ln:Math.log,log:Math.log10,exp:Math.exp,round:Math.round,floor:Math.floor,ceil:Math.ceil,sin:Math.sin,cos:Math.cos,tan:Math.tan};
const FN2={min:Math.min,max:Math.max,pow:Math.pow};
function parseFormula(src){
  const s=String(src??"").replace(/[×·]/g,"*").replace(/÷/g,"/").replace(/[−–]/g,"-").replace(/\*\*/g,"^"); let i=0;
  const toks=[]; while(i<s.length){const c=s[i];
    if(/\s/.test(c)){i++; continue}
    if(/[0-9.]/.test(c)){let j=i; while(j<s.length&&/[0-9.]/.test(s[j])) j++; if(s[j]==="e"||s[j]==="E"){let k=j+1; if(s[k]==="+"||s[k]==="-") k++; if(/[0-9]/.test(s[k]||"")){j=k; while(j<s.length&&/[0-9]/.test(s[j])) j++}}
      const t=s.slice(i,j); if(!/^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(t)) throw new Error(`“${t}” isn't a number.`); toks.push({n:+t}); i=j; continue}
    if(/[A-Za-z_]/.test(c)){let j=i; while(j<s.length&&/[A-Za-z0-9_]/.test(s[j])) j++; toks.push({id:s.slice(i,j)}); i=j; continue}
    if("+-*/^(),".includes(c)){toks.push({op:c}); i++; continue}
    throw new Error(`“${c}” can't be used in a formula.`)}
  if(!toks.length) throw new Error("The formula is empty.");
  let p=0; const peek=()=>toks[p], take=op=>{if(toks[p]&&toks[p].op===op){p++; return true} return false};
  const expr=()=>{let a=term(); for(;;){if(take("+")) a={o:"+",a,b:term()}; else if(take("-")) a={o:"-",a,b:term()}; else return a}};
  const startsFactor=t=>t&&(t.n!=null||t.id||t.op==="(");
  const term=()=>{let a=unary(); for(;;){if(take("*")) a={o:"*",a,b:unary()}; else if(take("/")) a={o:"/",a,b:unary()}; else if(startsFactor(peek())) a={o:"*",a,b:unary()}; else return a}};
  const unary=()=>{if(take("-")) return {o:"neg",a:unary()}; if(take("+")) return unary(); return power()};
  const power=()=>{const a=prim(); if(take("^")) return {o:"^",a,b:unary()}; return a};
  const prim=()=>{const t=toks[p++]; if(!t) throw new Error("The formula ends too early.");
    if(t.n!=null) return {n:t.n};
    if(t.id){if(take("(")){const args=[expr()]; while(take(",")) args.push(expr()); if(!take(")")) throw new Error(`Close the bracket after ${t.id}(…).`);
        const f=t.id.toLowerCase(); if(!FN1[f]&&!FN2[f]) throw new Error(`“${t.id}” isn't a function ModelQuest knows.`);
        if(FN1[f]&&args.length!==1||FN2[f]&&args.length!==2) throw new Error(`${f} takes ${FN1[f]?"one value":"two values"}.`); return {f,args}}
      if(/^(pi)$/i.test(t.id)) return {n:Math.PI}; return {v:t.id}}
    if(t.op==="("){const e=expr(); if(!take(")")) throw new Error("A bracket is never closed."); return e}
    throw new Error(`“${t.op}” is in the wrong place.`)};
  const ast=expr(); if(p<toks.length) throw new Error(`Unexpected “${toks[p].op||toks[p].id||toks[p].n}”.`); return ast}
function formulaVars(ast,set=new Set()){if(ast.v) set.add(ast.v); if(ast.a) formulaVars(ast.a,set); if(ast.b) formulaVars(ast.b,set); (ast.args||[]).forEach(x=>formulaVars(x,set)); return set}
function evalAst(t,env){
  if(t.n!=null) return t.n; if(t.v) {const x=env[t.v]; if(typeof x!=="number") throw new Error(`${t.v} has no value.`); return x}
  if(t.f){const xs=t.args.map(a=>evalAst(a,env)); return (FN1[t.f]||FN2[t.f])(...xs)}
  const a=evalAst(t.a,env); if(t.o==="neg") return -a; const b=evalAst(t.b,env);
  return t.o==="+"?a+b:t.o==="-"?a-b:t.o==="*"?a*b:t.o==="/"?a/b:Math.pow(a,b)}
function probModel(p){
  const errs={}, comp={}, keys=new Set(p.vars.map(v=>v.key));
  p.vars.forEach(v=>{if(v.kind!=="out") return; try{if(!String(v.formula||"").trim()) throw new Error("Write a formula for this output.");
      const ast=parseFormula(v.formula), used=formulaVars(ast); for(const u of used){if(!keys.has(u)) throw new Error(`“${u}” isn't one of your variables.`); if(u===v.key) throw new Error("The formula uses the output itself.")}
      comp[v.key]={ast,used}}catch(e){errs[v.key]=e.message}});
  const order=[], seen={};
  const visit=(k,stack)=>{if(seen[k]===2||!comp[k]) return; if(seen[k]===1){errs[k]=errs[k]||"These outputs depend on each other in a loop."; return} seen[k]=1;
    for(const u of comp[k].used) if(comp[u]) visit(u,stack); seen[k]=2; order.push(k)};
  Object.keys(comp).forEach(k=>visit(k));
  const at=inputs=>{const env={}; p.vars.forEach(v=>{if(v.kind==="par") env[v.key]=v.val; if(v.kind==="in") env[v.key]=inputs&&Number.isFinite(inputs[v.key])?inputs[v.key]:v.start});
    order.forEach(k=>{if(errs[k]) return; try{const y=evalAst(comp[k].ast,env); env[k]=Number.isFinite(y)?y:NaN}catch(e){env[k]=NaN}}); return env};
  return {errs,at,order};
}
const niceNum=x=>Math.round(x*1e6)/1e6;
function samplePoints(p){const ins=p.vars.filter(v=>v.kind==="in"); if(!ins.length) return [{}];
  const base={}; ins.forEach(v=>base[v.key]=v.start);
  const vals=v=>{const s=v.step||1, pick=[0,.25,.5,.8,1].map(f=>niceNum(Math.round((v.min+(v.max-v.min)*f)/s)*s)); return [...new Set(pick)].filter(x=>x>=v.min-1e-9&&x<=v.max+1e-9)};
  const pts=[]; vals(ins[0]).forEach(x=>pts.push(Object.assign({},base,{[ins[0].key]:x})));
  ins.slice(1).forEach(v=>vals(v).filter((_,i)=>i%2===0).forEach(x=>pts.push(Object.assign({},base,{[v.key]:x}))));
  const seen=new Set(); return pts.filter(o=>{const k=JSON.stringify(o); if(seen.has(k)) return false; seen.add(k); return true}).slice(0,10)}

/* ---------- problems: one shape for files, AI drafts and the editor ---------- */
const PRACTICES=[["MP1","Make sense of problems and persevere"],["MP2","Reason abstractly and quantitatively"],["MP3","Construct arguments and critique reasoning"],["MP4","Model with mathematics"],["MP5","Use tools strategically"],["MP6","Attend to precision"],["MP7","Look for and use structure"],["MP8","Use regularity in repeated reasoning"]];
const AREAS=["Ratios & proportions","Percent & finance","Linear functions","Systems of equations","Quadratic functions","Exponential growth & decay","Logarithms","Rates of change","Geometry & measurement","Probability","Statistics & data","Sequences & series"];
const TOPICS=["Finance","Physics","Chemistry","Biology","Environment","Sports","Health","Technology","Everyday life"];
const GRADES=["Middle School","High School","College"];
const DIFFS=["Easy","Medium","Hard"];
const KINDS=[["in","Input (slider)"],["par","Given number"],["out","Output (formula)"]];
const str=(x,n=4000)=>x==null?"":String(x).replace(/\r/g,"").slice(0,n).trim();
// a short label that's too long is cut at a word boundary, not mid-word
const strW=(x,n)=>{const s=str(x); if(s.length<=n) return s; const c=s.slice(0,n+1), i=c.lastIndexOf(" "); return (i>n*.5?c.slice(0,i):s.slice(0,n)).replace(/[\s,;:.\-–—(]+$/,"")};
const numOr=(x,d)=>{const n=typeof x==="number"?x:parseFloat(String(x??"").replace(/[,$%\s]/g,"")); return Number.isFinite(n)?n:d};
function normKey(k){return String(k||"").trim().replace(/[^A-Za-z0-9_]/g,"_").replace(/^[^A-Za-z]+/,"").replace(/_+/g,"_").slice(0,14)}
function normProblem(x){x=x&&typeof x==="object"?x:{};
  const o={id:str(x.id,40)||newId(),title:strW(x.title,90),topic:strW(x.topic,60),area:str(x.area,40),grade:GRADES.includes(x.grade)?x.grade:"High School",
    difficulty:DIFFS.includes(x.difficulty)?x.difficulty:"Medium",minutes:clamp(Math.round(numOr(x.minutes,30)),5,120),
    practices:[...new Set((Array.isArray(x.practices)?x.practices:[]).map(s=>String(s).toUpperCase().replace(/[^A-Z0-9]/g,"")).filter(s=>/^MP[1-8]$/.test(s)))],
    brief:str(x.brief,360),story:str(x.story,3000),question:str(x.question,600),status:x.status==="published"?"published":"draft",
    createdAt:numOr(x.createdAt,Date.now()),updatedAt:numOr(x.updatedAt,Date.now()),author:str(x.author,80),
    source:x.source&&typeof x.source==="object"?{name:str(x.source.name,120),type:str(x.source.type,20),asset:str(x.source.asset,40)}:null,
    vars:[],assumptions:[],goals:[],steps:{},explain:{prompt:str(x.explain&&x.explain.prompt,600)}};
  const seen=new Set();
  (Array.isArray(x.vars)?x.vars:[]).slice(0,14).forEach(v=>{if(!v||typeof v!=="object") return; let k=normKey(v.key||v.name); if(!k) return; while(seen.has(k)) k=(k+"_2").slice(-14); seen.add(k);
    const kind=["in","par","out"].includes(v.kind)?v.kind:v.formula?"out":v.val!=null?"par":"in";
    const r={key:k,name:str(v.name,120),unit:str(v.unit,20),kind};
    if(kind==="par") r.val=numOr(v.val,0);
    if(kind==="in"){let a=numOr(v.min,0), b=numOr(v.max,a+10); if(b<=a) b=a+10; const step=numOr(v.step,0)>0?numOr(v.step,1):niceNum(Math.pow(10,Math.floor(Math.log10((b-a)/50))));
      r.min=a; r.max=b; r.step=step; r.start=clamp(numOr(v.start,(a+b)/2),a,b)}
    if(kind==="out") r.formula=str(v.formula,300);
    o.vars.push(r)});
  (Array.isArray(x.assumptions)?x.assumptions:[]).slice(0,10).forEach(a=>{if(!a) return; const t=str(a.t||a.text,200); if(!t) return;
    o.assumptions.push({t,ok:a.ok!==false,sug:!!a.sug&&a.ok!==false,why:str(a.why,240)})});
  const outs=o.vars.filter(v=>v.kind==="out").map(v=>v.key), gx=Array.isArray(x.goals)?x.goals:[];
  o.goals=outs.map(k=>{const g=gx.find(q=>q&&normKey(q.out)===k)||{}; const hs=(Array.isArray(g.hints)?g.hints:[]).map(h=>str(h,700)).filter(Boolean).slice(0,3); return {out:k,text:str(g.text,200),hints:hs}});
  const sx=x.steps&&typeof x.steps==="object"?x.steps:{}; ["understand","define","diagram","build","equation","test","explain"].forEach(k=>o.steps[k]=str(sx[k],600));
  return o}
function problemIssues(p){const out=[], m=probModel(p), V=p.vars;
  if(!p.title) out.push("Give the problem a title.");
  if(!p.story) out.push("Write the problem information students read.");
  if(!V.some(v=>v.kind==="out")) out.push("Add at least one output for students to build.");
  if(!V.some(v=>v.kind==="in")) out.push("Add an input students can slide (it lets the model draw a graph).");
  V.forEach(v=>{if(!v.key) out.push("Every variable needs a name."); if(v.kind==="out"&&m.errs[v.key]) out.push(`${v.key}: ${m.errs[v.key]}`)});
  if(!p.assumptions.some(a=>a.ok)) out.push("Add at least one assumption the model makes.");
  if(!p.explain.prompt) out.push("Write the question students answer in Explain.");
  return out}
const PROB_FIELDS=["title","topic","area","grade","difficulty","minutes","practices","brief","story","question","status","createdAt","updatedAt","author","source","vars","assumptions","goals","steps","explain"];
function registerProblems(){for(const id in Cloud.problems){const p=Cloud.problems[id]; MISSIONS["p-"+id]=customMission(p)}}
async function saveProblem(p,key){p=normProblem(p); p.updatedAt=Date.now(); if(!p.author&&Cloud.uid) p.author=Cloud.uid;
  const pub={}; PROB_FIELDS.forEach(k=>pub[k]=p[k]);
  await Cloud.db.doc("problems/"+p.id).set(pub);
  if(key) await Cloud.db.doc("keys/"+p.id).set({solution:{steps:str(key.solution&&key.solution.steps,4000),answer:str(key.solution&&key.solution.answer,1200)},explainAnswer:str(key.explainAnswer,1200),notes:str(key.notes,2000),sourceText:str(key.sourceText,30000)});
  return p}
async function deleteProblem(id){await Cloud.db.doc("problems/"+id).delete(); try{await Cloud.db.doc("keys/"+id).delete()}catch(e){}}

/* ---------- reading files teachers upload ---------- */
const VENDOR={mammoth:"https://cdn.jsdelivr.net/npm/mammoth@1.11.0/mammoth.browser.min.js",pdfw:"https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js",
  pdf:"https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js",xlsx:"https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js"};
const HOSTED_VENDOR={mammoth:"/node_modules/mammoth/mammoth.browser.min.js",xlsx:"/node_modules/xlsx/dist/xlsx.full.min.js"};
const LOADED={};
function loadLib(k){const url=window.MQ_VENDOR?.[k]||(Cloud.hosted&&HOSTED_VENDOR[k])||VENDOR[k];
  return LOADED[k]||(LOADED[k]=new Promise((res,rej)=>{const s=document.createElement("script"); s.src=url; s.async=true; s.onload=()=>res(); s.onerror=()=>{delete LOADED[k]; rej(new Error("The file reader couldn't load. Check your connection and try again."))}; (document.head||document.body).appendChild(s)}))}
const FILE_TYPES=".docx,.pdf,.xlsx,.xls,.ods,.csv,.txt,.md,.png,.jpg,.jpeg,.webp,.gif";
const GEMINI_MEDIA={pdf:"application/pdf",png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",webp:"image/webp",gif:"image/gif"};
async function readProblemFile(file,onStep,nativeMedia=false){
  const ext=(file.name.split(".").pop()||"").toLowerCase(); let text="", images=[];
  if(file.size>25*1024*1024) throw new Error("That file is over 25 MB. Try a smaller file.");
  if(nativeMedia&&Object.hasOwn(GEMINI_MEDIA,ext)) return {text,images,ext,mediaType:GEMINI_MEDIA[ext]};
  if(ext==="doc") throw new Error("Old .doc files can't be read here. Save it as .docx or PDF and upload that.");
  if(ext==="docx"){onStep&&onStep("Reading the Word file…"); await loadLib("mammoth"); text=(await window.mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()})).value}
  else if(ext==="pdf"){onStep&&onStep("Reading the PDF…"); let lib;
    if(Cloud.hosted&&!window.MQ_VENDOR?.pdf){
      lib=await import("/node_modules/pdfjs-dist/build/pdf.min.mjs");
      lib.GlobalWorkerOptions.workerSrc="/node_modules/pdfjs-dist/build/pdf.worker.min.mjs";
    }else{
      await loadLib("pdfw"); await loadLib("pdf"); lib=window.pdfjsLib;
    }
    const doc=await lib.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false}).promise; const n=Math.min(doc.numPages,20), parts=[];
    for(let i=1;i<=n;i++){const pg=await doc.getPage(i), tc=await pg.getTextContent(); let line="", lastY=null, out=[];
      tc.items.forEach(it=>{const y=it.transform?Math.round(it.transform[5]):0; if(lastY!=null&&Math.abs(y-lastY)>2){out.push(line); line=""} line+=(line&&!line.endsWith(" ")&&!/^\s/.test(it.str)?" ":"")+it.str; lastY=y});
      out.push(line); parts.push(out.join("\n"))}
    text=parts.join("\n\n").replace(/[ \t]+\n/g,"\n").replace(/\n{3,}/g,"\n\n");
    if(text.replace(/\s/g,"").length<120){onStep&&onStep("This PDF looks scanned. Turning pages into pictures for the AI…");
      for(let i=1;i<=Math.min(doc.numPages,3);i++){const pg=await doc.getPage(i), vp=pg.getViewport({scale:1.6}), c=document.createElement("canvas"); c.width=vp.width; c.height=vp.height;
        await pg.render({canvasContext:c.getContext("2d"),viewport:vp}).promise; images.push(await new Promise(r=>c.toBlob(r,"image/png")))}}}
  else if(["xlsx","xls","ods"].includes(ext)){onStep&&onStep("Reading the spreadsheet…"); await loadLib("xlsx"); const wb=window.XLSX.read(new Uint8Array(await file.arrayBuffer()),{type:"array"});
    text=wb.SheetNames.slice(0,8).map(n=>`# Sheet: ${n}\n`+window.XLSX.utils.sheet_to_csv(wb.Sheets[n]).replace(/(,\s*)+$/gm,"")).join("\n\n")}
  else if(["csv","txt","md"].includes(ext)) text=await file.text();
  else if(["png","jpg","jpeg","webp","gif"].includes(ext)) images=[file];
  else throw new Error("ModelQuest reads Word (.docx), PDF, Excel, CSV, text and image files.");
  return {text:text.trim(),images,ext}}

/* ---------- the AI assistant ---------- */
const aiReady=()=>Cloud.geminiImport||!!Cloud.sample;
const IMPORT_API="/api/import-problem";
const AI_TOKEN_KEY="modelquest.aiToken";
function teacherAiToken(){try{return sessionStorage.getItem(AI_TOKEN_KEY)||""}catch{return ""}}
function setTeacherAiToken(token){
  try{if(token) sessionStorage.setItem(AI_TOKEN_KEY,token); else sessionStorage.removeItem(AI_TOKEN_KEY)}catch{}
}
function aiHeaders(token=teacherAiToken()){return token?{Authorization:"Bearer "+token}:{}}
async function getGeminiStatus(token=teacherAiToken()){
  if(!/^https?:$/.test(location.protocol)) return null;
  try{
    const r=await fetch(IMPORT_API,{headers:aiHeaders(token),signal:AbortSignal.timeout(5000)});
    if(!r.ok) return null;
    const status=await r.json();
    return typeof status?.available==="boolean"?status:null;
  }catch{return null}
}
async function aiRequest(url,options){
  const r=await fetch(url,options);
  const data=await r.json().catch(()=>null);
  if(!r.ok){
    if(r.status===401) setTeacherAiToken("");
    throw {code:data?.code||(r.status===413?"file_too_large":"unavailable")}
  }
  if(!data) throw {code:"invalid_json"};
  return data
}
async function geminiImportFile(file,got,signal){
  const options={method:"POST",signal,headers:aiHeaders()};
  if(got.mediaType&&Cloud.directUploadLimit&&file.size>Cloud.directUploadLimit){
    if(!Cloud.largeUploads) throw {code:"large_upload_unavailable"};
    options.headers["Content-Type"]="application/json";
    const ticket=await aiRequest("/api/upload-ticket",{
      ...options,body:JSON.stringify({size:file.size,mimeType:got.mediaType})
    });
    const upload=await fetch(ticket.uploadUrl,{method:"PUT",headers:{"Content-Type":got.mediaType},body:file,signal});
    if(!upload.ok) throw {code:upload.status===413?"file_too_large":"upload_failed"};
    options.body=JSON.stringify({name:file.name.slice(0,120),blobPath:ticket.pathname});
  }else if(got.mediaType){
    options.headers["Content-Type"]=got.mediaType;
    options.headers["X-File-Name"]=encodeURIComponent(file.name.slice(0,120));
    options.body=file;
  }else{
    options.headers["Content-Type"]="application/json";
    options.body=JSON.stringify({name:file.name.slice(0,120),text:got.text.slice(0,40000)});
  }
  const data=await aiRequest(IMPORT_API,options);
  if(!data||!data.title||!Array.isArray(data.vars)) throw {code:"invalid_json"};
  return data;
}
function aiErrText(e){const c=e&&e.code;
  return c==="ai_access_required"?"Choose AI access and enter your teacher code to continue.":c==="not_granted"?"The AI assistant needs your OK. Allow it when claude.ai asks, then try again.":c==="rate_limited"?"The AI is busy, or you've reached a usage limit. Wait a little and try again.":
    c==="invalid_json"?"The AI's answer came back in the wrong shape. Try again.":c==="refused"?"The AI declined that request. Try rewording it.":c==="cancelled"?"Stopped.":
    c==="sampling_disabled"?"Claude isn't available for this account.":c==="prompt_too_large"?"That's too much text for one request. Try a shorter file.":c==="images_unavailable"?"Pictures can't be sent to the AI here. Try a PDF or Word file.":
    c==="session_expired"?"Your claude.ai session ended. Sign in again, then try again.":
    c==="invalid_file"?"Gemini couldn't read that file. Check that it opens and try uploading it again.":
    c==="file_too_large"?"That file is too large for AI import. Try a smaller file.":
    c==="large_upload_unavailable"?"Large PDFs and images need storage configured on this site. For now, use a PDF or image up to 4 MB.":
    c==="upload_failed"?"The file couldn't be uploaded. Try again.":
    c==="gemini_config"?"Gemini isn't available. Check the server's API key and model settings.":
    c==="timeout"?"Gemini took too long to read the file. Try again.":"Something went wrong reaching the AI. Try again."}
const PRACTICE_TEXT=k=>{const p=PRACTICES.find(x=>x[0]===k); return p?`${k} (${p[1]})`:k};
const SCHEMA_TEXT=`Reply with only one JSON object of this shape (no other text):
{"title": "a short title, at most 8 words", "topic": "2-4 words",  "area": string, "practices": ["MP4", ...], "grade": "Middle School"|"High School"|"College", "difficulty": "Easy"|"Medium"|"Hard", "minutes": number,
 "brief": "a student-facing introduction in two or three short sentences, at most 360 characters",
 "story": "the full problem in short paragraphs, with all the information and numbers the model needs",
 "question": "the decision or question the finished model answers",
 "vars": [ {"key": "g", "name": "data used in a month", "unit": "GB", "kind": "in", "min": 0, "max": 30, "step": 0.5, "start": 8},
           {"key": "fee_A", "name": "Plan A's monthly fee", "unit": "$", "kind": "par", "val": 20},
           {"key": "cost_A", "name": "Plan A's bill for the month", "unit": "$", "kind": "out", "formula": "fee_A + rate_A * g"} ],
 "assumptions": [ {"t": "...", "ok": true, "sug": true}, {"t": "...", "ok": true, "sug": false}, {"t": "a tempting assumption the model does NOT make", "ok": false, "why": "one sentence on why not"} ],
 "goals": [ {"out": "cost_A", "text": "Build cost_A: Plan A's bill for g GB", "hints": ["Hint 1: a question that works one small case with the story's numbers", "Hint 2: the relationship in words and as a formula with the variable keys", "Hint 3: numbered build steps, like 1. From Variables, drag a set block and choose cost_A. 2. From Math, drop a + block into its slot. 3. ... ending with a value to check in the console"]} ],
 "steps": {"understand": "", "define": "", "diagram": "", "build": "", "equation": "", "test": "", "explain": ""},
 "explain": {"prompt": "the question students answer in writing at the end, using their model"},
 "explainAnswer": "a model answer for the teacher",
 "solution": {"steps": "the worked solution in 3-8 short lines", "answer": "the final answer"},
 "notes": "anything the teacher should double-check"}
Rules:
- The model must be a formula model: "in" variables are inputs students slide, "par" variables are given numbers from the story, "out" variables are what students build. Use 1-2 inputs, 2-6 given numbers and 1-3 outputs.
- Every given number in "vars" must appear in the story. Units go in "unit", not in names.
- Keys: letters, digits and _ only, start with a letter, at most 14 characters (like cost_A, N0, rate).
- Formulas use only keys, numbers, + - * / ^, brackets, and the functions sqrt abs ln log exp round floor ceil min max. An output may use an earlier output.
- Input ranges must make sense for the story; "start" is the value the story is about.
- Write 4-6 assumptions: 1-2 suggested ("sug": true), the rest for students to judge, including 1-2 that are wrong ("ok": false).
- Hints: exactly three per output, each more specific than the last, written so a student can follow them without help. Hint 1 asks a question and works one small case using the story's numbers. Hint 2 states the relationship in words and as a formula using the variable keys. Hint 3 is numbered steps ("1. ... 2. ...") that name each block and where it goes: the set block and variables come from Variables (variables must be dragged in, not typed), + − × ÷ ^ and the function block (ln, sqrt, ...) come from Math, plot and say come from Graph. End hint 3 with a value to check in the console for the story's input value.
- Steps hold one short tip for each step of the mission (Understand, Define, Diagram, Build, Equation, Test, Explain) in plain words for students. In the Diagram step students draw which quantities each output is worked out from, as a diagram of converters and connectors. In the Equation step students write each output's formula as a symbolic equation from tiles, answer questions about it, then use it with the story's numbers.
- Plain, friendly language for the grade level. No markdown.`;
function aiDraftPrompt(o){return `You are helping a teacher write a math-modeling problem for ModelQuest, a web game where students read a problem, define its quantities, build a model with Scratch-style code blocks, test it, and explain a decision.
Write ONE new problem.
Topic: ${o.topic||"any interesting real-world context"}
Math area: ${o.area||"your choice"}
Mathematical practices to address: ${(o.practices&&o.practices.length?o.practices:["MP4"]).map(PRACTICE_TEXT).join("; ")}
Grade level: ${o.grade||"High School"}
Difficulty: ${o.difficulty||"Medium"} (Easy: one input and one or two linear outputs. Medium: a percent, rate or exponential pattern, or two outputs to compare. Hard: several steps, logarithms, or comparing options to make a decision.)
Time: about ${o.minutes||30} minutes.
${o.idea?`The teacher's idea: ${o.idea}\n`:""}
${SCHEMA_TEXT}`}
function aiIdeasPrompt(o){return `Suggest 4 different math-modeling problem ideas for ModelQuest, where students build a formula model with code blocks and use it to make a decision.
Topic: ${o.topic||"varied real-world contexts"}. Math area: ${o.area||"varied"}. Practices: ${(o.practices||[]).map(PRACTICE_TEXT).join("; ")||"MP4 (Model with mathematics)"}. Grade: ${o.grade||"High School"}. Difficulty: ${o.difficulty||"Medium"}.
${o.idea?`The teacher says: ${o.idea}\n`:""}Reply with only a JSON array of 4 objects: [{"title": "short title", "hook": "one sentence a student would find interesting", "model": "what students model, in a few words"}]`}
function aiFilePrompt(name,text){return `A teacher uploaded a problem from a file called "${name}". Turn it into a ModelQuest problem: students read the problem, define its quantities, build a model with code blocks, test it, and explain a decision.
Keep the teacher's story, numbers, questions and solution wherever the file gives them. Where the file doesn't say something the format needs (keys, kinds, ranges, formulas, assumptions, hints, step tips, explain question), add it, and list what you added in "notes".
${text?`File text:\n"""\n${text.slice(0,40000)}\n"""\n`:"The file is attached as pictures of its pages.\n"}
${SCHEMA_TEXT}`}
function aiRevisePrompt(p,key,instr){const cur=Object.assign({},p,{explainAnswer:key&&key.explainAnswer||"",solution:key&&key.solution||{steps:"",answer:""}});
  ["id","status","createdAt","updatedAt","author","source"].forEach(k=>delete cur[k]);
  return `Here is a ModelQuest math-modeling problem as JSON:\n${JSON.stringify(cur)}\n\nThe teacher asks: ${instr}\nReturn the whole updated problem. Keep everything the teacher didn't ask to change. In "notes", say in one or two sentences what you changed.\n${SCHEMA_TEXT}`}
function aiCheckPrompt(p,key){const cur=Object.assign({},p,{solution:key&&key.solution||{}}); ["id","status","createdAt","updatedAt","author","source"].forEach(k=>delete cur[k]);
  return `Check this ModelQuest math-modeling problem for mistakes a teacher would want to fix before students see it: numbers in the vars that don't match the story, formulas that don't match the story or the solution, wrong units, input ranges that don't make sense, assumptions marked right or wrong incorrectly, hints that give away the whole answer, and language that's wrong for the grade.\n${JSON.stringify(cur)}\nReply with only a JSON object: {"ok": true|false, "issues": ["one short sentence per problem, most important first"], "praise": "one sentence on what works"}`}
function splitAI(x){x=x&&typeof x==="object"?x:{};
  return {p:normProblem(x),key:{solution:{steps:str(x.solution&&x.solution.steps,4000),answer:str(x.solution&&x.solution.answer,1200)},explainAnswer:str(x.explainAnswer,1200),notes:str(x.notes,2000)}}}
async function aiJSON(prompt,o={}){
  if(Cloud.geminiImport) return aiRequest("/api/teacher-ai",{
    method:"POST",signal:o.signal,headers:{"Content-Type":"application/json",...aiHeaders()},
    body:JSON.stringify({action:o.action||"draft",prompt})
  });
  if(!Cloud.sample) throw {code:"unavailable"};
  const opts={signal:o.signal,cache:false}; if(o.onProgress) opts.onText=({text})=>o.onProgress(text.length); if(o.images&&o.images.length) opts.images=o.images; if(o.tier) opts.modelTier=o.tier;
  return Cloud.sample.json(prompt,opts)}
