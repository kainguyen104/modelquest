/* ================= state ================= */
const STORE="modelquest.v4";
const blankMission=()=>({step:0,reached:0,done:false,d:{},runs:0,hints:0});
let S;
function freshState(){return {sv:3,role:"student",roleSet:false,nick:"",teacher:false,hints:true,badges:{},missions:{plans:blankMission(),decay:blankMission(),fire:blankMission()}}}
// step numbers moved twice: sv 1 had no Equation step (Test 3, Explain 4), and sv 2 had no Diagram step (Build 2 … Explain 5).
// Now: Understand 0, Define 1, Diagram 2, Build 3, Equation 4, Test 5, Explain 6. Anyone already past Define skipped the new
// Diagram step, so it stays open to them but isn't ticked until they draw it (dgSkip).
function migrateSteps(ms,sv){for(const k in ms){const m=ms[k]; if(!m) continue;
  if(!(sv>=2)){if(m.step>=3) m.step++; if(m.reached>=3) m.reached++}
  if(!(sv>=3)){if(m.step>=2) m.step++; if(m.reached>=2){m.reached++; m.dgSkip=true}}
  if(m.done) m.reached=7} return ms}
function load(){try{const r=localStorage.getItem(STORE); if(r){const o=JSON.parse(r), f=freshState(); o.missions=o.missions||{};
  for(const k in f.missions) o.missions[k]=Object.assign(blankMission(),o.missions[k]); for(const k in o.missions) o.missions[k]=Object.assign(blankMission(),o.missions[k]);
  if(o.sv!==3){migrateSteps(o.missions,o.sv); o.sv=3}
  const x=Object.assign(f,o); if(!o.role) x.role=o.teacher?"teacher":"student"; x.teacher=x.role==="teacher"; return x}}catch(e){} return freshState()}
let saveT=0, savePending=false;
const writeSave=()=>{savePending=false; try{localStorage.setItem(STORE,JSON.stringify(S))}catch(e){}};
function save(){clearTimeout(saveT); savePending=true; saveT=setTimeout(writeSave,150); if(typeof syncProgress==="function") syncProgress()}
// a save still waiting when the tab closes or reloads is written straight away (and only then, so another tab's newer save isn't overwritten)
addEventListener("pagehide",()=>{if(savePending){clearTimeout(saveT); writeSave()}});
function applyRole(){document.body.classList.toggle("teacher",!!S.teacher)}
S=load();

/* ================= badges ================= */
const BADGES={
  detective:{name:"Variable Detective",g:"search",c:"#FDE14D",m:"plans",how:"Name every quantity with its unit"},
  crosser:{name:"Break-even Finder",g:"target",c:"#93E6CD",m:"plans",how:"Mark where two plans cost the same"},
  debugger:{name:"Model Debugger",g:"bug",c:"#FF9DA9",m:"plans",how:"Catch the flat-fee fumble"},
  programmer:{name:"Decay Programmer",g:"code",c:"#FDE14D",m:"decay",how:"Build a working exponential model"},
  errdet:{name:"Error Detective",g:"bug",c:"#FF9DA9",m:"decay",how:"Expose the disappearing-carbon bug"},
  pattern:{name:"Pattern Explorer",g:"trend",c:"#FF9DA9",m:"decay",how:"Try every log base and spot what stays the same"},
  rulemaker:{name:"Rule Maker",g:"grid",c:"#93E6CD",m:"fire",how:"Code the fire-spread rule"},
  lln:{name:"Law of Large Numbers",g:"dice",c:"#A9DAF3",m:"fire",how:"Run 200 trials in one go"},
  advisor:{name:"Model Advisor",g:"star",c:"#B79CFF",m:null,how:"Finish any mission with a justified decision"}
};
ICP.search='<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5.5 5.5"/>';
function hexBadge(id,locked=false,sm=false){const b=BADGES[id];
  return `<div class="hex ${sm?"sm":""} ${locked?"locked":""}" title="${esc(b.name)}${locked?" — "+esc(b.how):""}">
  <svg class="shape" viewBox="0 0 87 95"><path d="M38.5 4.2a10 10 0 0 1 10 0l28.4 16.4a10 10 0 0 1 5 8.7v36.4a10 10 0 0 1-5 8.7L48.5 90.8a10 10 0 0 1-10 0L10.1 74.4a10 10 0 0 1-5-8.7V29.3a10 10 0 0 1 5-8.7z" fill="${b.c}" stroke="#1A1F3D" stroke-width="3.6"/></svg>
  <svg class="glyph" viewBox="0 0 24 24" fill="none" stroke="#1A1F3D" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${ICP[b.g]}</svg></div>`}
function award(id){if(S.badges[id])return; S.badges[id]=Date.now(); save();
  toast(`${hexBadge(id,false,true)}<div><div style="font:800 1.4rem/1 var(--font);letter-spacing:.16em;text-transform:uppercase;color:var(--text2)">Badge earned</div><div style="font:800 2.4rem/1.2 var(--font)">${esc(BADGES[id].name)}</div></div>`);
  setTimeout(()=>{const t=$("#toast .hex"); if(t) celebrate(t,18)},380)}

/* ================= toast / modal / tooltip ================= */
let toastT;
function toast(html,ms=3600){const t=$("#toast"); t.innerHTML=html; t.classList.add("on"); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove("on"),ms)}
function modal(html,onClose){const m=$("#modal"); m.innerHTML=`<div class="modal" role="dialog" aria-modal="true"><div class="box">${html}</div></div>`;
  const close=()=>{m.innerHTML=""; onClose&&onClose()};
  m.querySelector(".modal").addEventListener("click",e=>{if(e.target.classList.contains("modal")||e.target.closest("[data-close]")) close()});
  const f=m.querySelector("button"); f&&f.focus(); return {el:m.querySelector(".box"),close}}
addEventListener("keydown",e=>{if(e.key==="Escape"){ if($("#modal").innerHTML) $("#modal").innerHTML=""; closeFlyouts(); }});
const TIP=()=>$("#tip");
function showTip(e,html){const t=TIP(); t.innerHTML=html; t.classList.add("on"); const w=t.offsetWidth,h=t.offsetHeight;
  let x=e.clientX+16,y=e.clientY-h-14; if(x+w>innerWidth-8)x=e.clientX-w-16; if(y<8)y=e.clientY+18; t.style.left=x+"px"; t.style.top=y+"px"}
function hideTip(){TIP().classList.remove("on")}

/* ================= missions registry ================= */
const MISSIONS={};
const STEPS=["Understand","Define","Diagram","Build","Equation","Test","Explain"];
const LOCKED=[
  {key:"coaster",title:"Roller Coaster",diff:"Medium",time:"~ 25 min",tags:["Physics"],bar:"#E1BFFD"},
  {key:"reaction",title:"Reaction Rate Lab",diff:"Hard",time:"~ 40 min",tags:["Chemistry"],bar:"#E1BFFD"},
  {key:"pop",title:"Population Growth",diff:"Medium",time:"~ 30 min",tags:["Biology","Math"],bar:"#E1BFFD"}
];
const diffCls=d=>d==="Easy"?"easy":d==="Hard"?"hard":"medium";
const mProgress=id=>{const m=S.missions[id]; return m.done?100:Math.round(m.reached/STEPS.length*100)};
const order=["plans","decay","fire"];
function nextMission(){return order.find(id=>!S.missions[id].done)||"plans"}

/* ================= router ================= */
const ROUTES=["home","challenges","analytics","options","class","workspace","plans","decay","fire"];
function go(r){if(location.hash.slice(1)!==r){try{location.hash=r}catch(e){}} route()}
function route(){
  let r=(location.hash||"").slice(1); const dyn=/^(p|ws)-[A-Za-z0-9_-]+$/.test(r); if(!ROUTES.includes(r)&&!dyn) r="home";
  const top=MISSIONS[r]||r.startsWith("p-")?"challenges":r.startsWith("ws-")?"workspace":r;
  $$(".navlink").forEach(b=>b.setAttribute("aria-current",b.dataset.go===top?"page":"false"));
  const v=$("#view"); hideTip(); $("#modal").innerHTML=""; stopTimers(); closeFlyouts(); ACTIVE=null; TIPV=null;
  const m=MISSIONS[r], hidden=m&&m.custom&&m.prob.status!=="published"&&!S.teacher;
  if(m&&!hidden) renderMission(r,v);
  else if(r.startsWith("p-")){renderPending(v,hidden); enhance(v)}
  else if(r.startsWith("ws-")) renderEditor(r.slice(3),v);
  else{({home:renderHome,challenges:renderChallenges,analytics:renderAnalytics,options:renderSettings,class:renderClass,workspace:renderWorkspace})[r](v); if(r!=="class"&&r!=="workspace") enhance(v)}
  window.scrollTo({top:0,behavior:"auto"});
}
function renderPending(v,hidden){const wait=!hidden&&(!Cloud.ready||Cloud.slow.problems&&!Object.keys(Cloud.problems).length);
  v.innerHTML=`<section class="page plain view pending"><div class="card scard" style="margin-top:6rem"><h3>${wait?"Loading your teacher's problem…":"This problem isn't available"}</h3>
    ${wait?`<p class="muted" style="font-size:2rem;margin-top:1rem">One moment.</p>`:`<p class="muted" style="font-size:2rem;margin-top:1rem">Your teacher may have unpublished it or deleted it.</p><button class="btn" style="margin-top:2.4rem" data-go="challenges">All challenges ${ic("arrowR",2.6)}</button>`}</div></section>`}
const TIMERS=new Set(); function stopTimers(){TIMERS.forEach(f=>f()); TIMERS.clear()}
document.addEventListener("click",e=>{const b=e.target.closest("[data-go]"); if(b){e.preventDefault(); go(b.dataset.go)}});
addEventListener("hashchange",route);

/* ================= home (reference: Home) ================= */
function renderHome(v){
  const done=order.filter(id=>S.missions[id].done).length, total=order.length+LOCKED.length;
  const earned=Object.keys(BADGES).filter(b=>S.badges[b]);
  const nm=MISSIONS[nextMission()];
  const shown=(earned.length?earned:["programmer","pattern","advisor"]).slice(0,3);
  v.innerHTML=`<section class="page home view">
    <div class="hero">
      ${rays(-.4,4.1,9.1,0,false)}
      <h1><span class="w" style="--i:0">Model.</span> <span class="w" style="--i:1">Code.</span><br><span class="w" style="--i:2">Explore.</span> <span class="w u" style="--i:3">Solve.${squiggle()}</span></h1>
      <p class="sub">Build mathematical models with code to solve real-world problems.</p>
      <button class="btn cta" data-go="${nm.id}">${ic("playf",2)}${S.missions[nm.id].reached?"Continue a Challenge":"Start a Challenge"}</button>
      <div class="art talkart" data-flip="1" data-fx=".36" data-sy=".2" role="button" tabindex="0" aria-label="Say hi to the ModelQuest bear">${img("hero-home.webp","","","")}</div>
    </div>
    <div class="home-row">
      <div class="card stat">
        <div class="hd"><span style="width:5rem;height:4.4rem">${CIC.progressBars}</span><h3>Your Progress</h3><span class="n"><span data-count="${done}">${done}</span> / ${total} Challenges</span></div>
        <div class="hbar"><i data-fill="${Math.max(done/total*100,4)}%" style="width:${Math.max(done/total*100,4)}%"></i></div>
      </div>
      <div class="card stat">
        <div class="hd"><span style="width:5.2rem;height:6rem">${CIC.medal}</span><h3>Badges</h3><span class="n"><span data-count="${earned.length}">${earned.length}</span> Earned</span></div>
        <div class="badges" data-stagger>${sparkLines("l")}${shown.map(b=>hexBadge(b,!S.badges[b])).join("")}${sparkLines("r")}</div>
      </div>
    </div>
    <div class="card feat">
      <div class="art"><div class="shape"></div>${img(ARTS[nm.art],"","","")}</div>
      <div><span class="tag">Featured Challenge</span><h2>${esc(nm.title)}</h2><p>${esc(nm.short||nm.tagline)}</p></div>
      <button class="btn go" data-go="${nm.id}" aria-label="Open ${esc(nm.title)}">${ic("arrowR",2.4)}</button>
    </div>
  </section>`;
}

/* ================= challenges (reference: Challenges) ================= */
let FILTER="All";
const FILTERS=[["All",null,"#FDE54B"],["Math","sigma","#DECFFD"],["Finance","trend","#B4E9FE"],["Physics","atom","#FDD6DA"],["Chemistry","flask","#C1FBE1"],["Biology","leaf","#C9AEFC"]];
function ccardHTML(m,locked,art){
  const pct=locked||!S.missions[m.id]?0:mProgress(m.id);
  const inner=`${art||img(ARTS[locked?m.key:m.art],"","","")}
    <h3 title="${esc(m.title)}">${esc(m.title)}</h3>
    <div class="row"><span class="pill ${diffCls(m.diff)}">${ic("diff",2.6)}${m.diff}</span><span class="pill time">${ic("clock",2.2)}${m.time}</span></div>
    <div class="prog"><div class="pbar"><i data-fill="${Math.max(pct,0)}%" style="width:${Math.max(pct,0)}%;background:${m.bar}"></i></div>${pct}%</div>`;
  return locked?`<div class="card ccard locked" aria-disabled="true"><span class="pill ink soon">${ic("lock",2.4)}Soon</span>${inner}</div>`
               :`<button class="card ccard${m.custom?" custom":""}" data-go="${esc(m.id)}">${inner}</button>`;
}
function customCardHTML(p){
  return ccardHTML({id:"p-"+p.id,custom:true,title:p.title||"Untitled problem",diff:p.difficulty,time:`~ ${p.minutes} min`,bar:"#B9A6F5"},false,
    `<div class="cart" aria-hidden="true">${customScene(p,false)}</div>`)
}
function renderChallenges(v){
  const feat=MISSIONS[nextMission()];
  let list;
  if(FILTER==="All") list=[...order.filter(id=>id!==feat.id).map(id=>[MISSIONS[id],false]),[LOCKED[0],true],[LOCKED[1],true]];
  else list=[...order.map(id=>[MISSIONS[id],false]),...LOCKED.map(m=>[m,true])].filter(([m])=>m.tags.includes(FILTER));
  v.innerHTML=`<section class="page ch view">
    <div class="ch-title">${rays(.1,4.4,6.25,0,true)}<h1>Challenges</h1></div>
    <div class="filters" role="group" aria-label="Filter by subject">${FILTERS.map(([n,i,c])=>`<button class="fpill" style="background:${c}" aria-pressed="${FILTER===n}" data-f="${n}">${i?ic(i,2):""}${n}</button>`).join("")}</div>
    ${FILTER==="All"?`<div class="ch-feat">
      <div class="card featured">
        <div class="art">${img(ARTS[feat.art],"","","")}</div>
        <div><h2>${esc(feat.title)}</h2><p>${esc(feat.blurb||feat.tagline)}</p>
          <div class="row"><span class="pill ${diffCls(feat.diff)}">${ic("diff",2.6)}${feat.diff}</span><span class="pill time">${ic("clock",2.2)}${feat.time}</span>
          <button class="btn" data-go="${feat.id}">${S.missions[feat.id].reached?"Continue":"Start Challenge"} ${ic("arrowR",2.6)}</button></div></div>
      </div>
      <div class="blob" style="left:97.9rem;top:8.2rem;width:34rem;height:15.6rem;background:var(--pink-blob);border-radius:17rem 17rem 0 0"></div>
      <img class="bear fbear talk" src="${A(BEARS.flask)}" alt="ModelQuest bear" style="left:102.7rem;top:-5.7rem;width:27.5rem">
      <div class="bubble" style="left:108.4rem;top:-17.1rem;transform:rotate(-2deg)">Pick a mission!<svg class="tail" viewBox="0 0 40 34"><path d="M2 0 12 32 30 0" fill="#FFFDFB" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M0 0h34" stroke="#FFFDFB" stroke-width="5"/></svg></div>
    </div>`:""}
    <div class="cards" data-stagger>${list.map(([m,l])=>ccardHTML(m,l)).join("")||`<p class="muted">No missions in ${esc(FILTER)} yet.</p>`}</div>
    ${(()=>{const ps=Object.values(Cloud.problems).filter(p=>p.status==="published"&&(FILTER==="All"||p.topic===FILTER||(FILTER==="Math"&&!TOPICS.includes(p.topic)))).sort((a,b)=>a.createdAt-b.createdAt);
      return ps.length?`<div class="ch-sub"><h2>From your teacher</h2><span class="muted">${ps.length} problem${ps.length>1?"s":""}</span></div><div class="cards" data-stagger>${ps.map(customCardHTML).join("")}</div>`:""})()}
    ${confetti(101,9.2,2.6,"#4BE5D9",20)}${confetti(2.4,48,3.2,"#FD9374",-20)}
    <div class="blob" style="left:-6rem;top:85.8rem;width:20rem;height:20rem;border-radius:50%;background:#FDE7A6;opacity:.9"></div>
    <div class="blob" style="left:132rem;top:88.6rem;width:26rem;height:26rem;border-radius:50%;background:#CFF6E6"></div>
  </section>`;
  $$(".fpill",v).forEach(b=>b.onclick=()=>{FILTER=b.dataset.f; renderChallenges(v); enhance(v)});
}

/* ================= analytics & settings ================= */
function renderAnalytics(v){
  const row=id=>{const m=MISSIONS[id], st=S.missions[id], ev=m.evidence?m.evidence(st):[];
    return `<div class="card acard">
      <div class="hd"><div class="chip" style="background:${m.chip}">${ic(m.icon,2.4)}</div><h3>${esc(m.title)}</h3>
        <span class="status ${st.done?"pass":""}">${st.done?"Complete":st.reached?"In progress":"Not started"}</span></div>
      <div class="pbar" style="height:2.4rem"><i style="width:${mProgress(id)}%;background:${m.bar}"></i></div>
      <dl class="kv"><dt>Furthest step</dt><dd>${STEPS[Math.min(st.reached,STEPS.length-1)]}</dd><dt>Model edits</dt><dd>${st.runs||0}</dd><dt>Hints used</dt><dd>${st.hints||0}</dd>
        ${ev.map(([k,val])=>`<dt>${esc(k)}</dt><dd>${esc(val)}</dd>`).join("")}</dl></div>`};
  v.innerHTML=`<section class="page plain view">
    <div class="ptitle">${rays(.1,4.4,6.25,0,true)}<h1>Analytics</h1><p>What your teacher sees: how far you got, how often you revised your model, how many hints you used, and which checks your model passed.</p></div>
    ${syncCard()}<div class="grid3">${order.map(row).join("")}${Object.keys(S.missions).filter(id=>id.startsWith("p-")&&MISSIONS[id]&&(S.missions[id].opened||S.missions[id].reached)).map(row).join("")}</div>
    <div class="card scard" style="max-width:none"><h3>Badge cabinet</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(34rem,1fr));gap:2rem;margin-top:1.6rem">${Object.keys(BADGES).map(b=>`<div style="display:flex;align-items:center;gap:1.6rem">${hexBadge(b,!S.badges[b],true)}<div><b style="font-size:2.1rem">${esc(BADGES[b].name)}</b><div class="muted" style="font-size:1.8rem">${esc(BADGES[b].how)}</div></div></div>`).join("")}</div></div>
    ${confetti(96.4,15.8,2.2,"#4BE5D9",22)}
  </section>`;
}
function syncCard(){if(S.teacher) return "";
  const t=Cloud.local?["This device only","Your progress is saved in this browser."]:
    !Cloud.ready?["Connecting…","Checking whether your teacher can see your progress."]:Cloud.writeOK===false?["Not shared yet","Your progress is saved in this browser, but your teacher can't see it. Ask your teacher to give you Contributor access to this page."]:
    ["Shared with your teacher","Your teacher can see how far you got, your answers and your block models."];
  return `<div class="card synccard ${Cloud.writeOK===false?"warn":Cloud.local?"":"ok"}"><span class="sdot"></span><div><b>${t[0]}</b><p>${t[1]}</p></div></div>`}
function renderSettings(v){
  const T=S.teacher, ro=!Cloud.local&&Cloud.ready&&!Cloud.canEdit;
  v.innerHTML=`<section class="page plain view">
    <div class="ptitle">${rays(.1,4.4,6.25,0,true)}<h1>Settings</h1></div>
    <div class="card scard rolecardbox" style="margin-top:4rem"><h3>How are you using ModelQuest?</h3>
      <div class="roles" role="radiogroup" aria-label="Mode">
        <button class="rolecard" role="radio" aria-checked="${!T}" data-role-set="student"><span class="chip" style="background:var(--mint-soft)">${ic("cap",2.4)}</span><span><b>Student</b><span>Play the missions. Your progress, answers and models are shared with your teacher.</span></span><i class="rdot"></i></button>
        <button class="rolecard" role="radio" aria-checked="${T}" data-role-set="teacher"><span class="chip" style="background:var(--lav)">${ic("users",2.4)}</span><span><b>Teacher</b><span>Unlock every step, follow your class's progress, and create problems with the AI assistant.</span></span><i class="rdot"></i></button>
      </div>
      ${T?`<div class="rolemore">
        <label class="check" style="font-size:2.2rem"><input type="checkbox" id="set-hints" ${Cloud.config.hints!==false?"checked":""} ${ro?"disabled":""}><span><b>Show the hint button to students</b><br><span class="muted" style="font-weight:500">Turn off for an unscaffolded transfer task. This applies to your whole class.</span></span></label>
        <div class="rolelinks"><button class="btn white sm" data-go="class">${ic("users",2.4)}Class progress</button><button class="btn white sm" data-go="workspace">${ic("pencil",2.4)}Workspace</button></div></div>`:
      `<div class="rolemore"><label class="edf" style="max-width:52rem"><span class="edl">Your name for your teacher<small>Only needed if your teacher sees “Student” instead of your name.</small></span><input class="field sm" id="set-nick" maxlength="40" value="${esc(S.nick||"")}" placeholder="First name and last initial"></label>${syncCard()}</div>`}
    </div>
    <div class="card scard"><h3>Start over</h3><p class="muted" style="font-size:2rem">Clears your models, answers and badges on this device.</p>
      <div id="resetzone" style="margin-top:2rem"><button class="btn pink sm" id="reset">${ic("refresh",2.4)}Reset all progress</button></div></div>
    <p class="muted" style="font-size:1.8rem;margin-top:2.4rem;max-width:96rem">All prices, lab readings and forests in the built-in missions are invented for the activities.</p>
  </section>`;
  $$("[data-role-set]",v).forEach(b=>b.onclick=()=>{const t=b.dataset.roleSet==="teacher"; if(t===S.teacher) return; S.role=t?"teacher":"student"; S.teacher=t; S.roleSet=true; save(); applyRole();
    if(t) teacherSubs(); else syncProgress(true); toast(t?"Teacher mode: every step is unlocked, and Class and Workspace are in the menu.":"Student mode."); renderSettings(v); enhance(v)});
  const hs=$("#set-hints",v); if(hs) hs.onchange=async e=>{const on=e.target.checked; try{await Cloud.db.doc("config/class").set(Object.assign({},Cloud.config,{hints:on})); toast(on?"Students can use hints.":"Hints are off for your class.")}catch(err){e.target.checked=!on; toast("Couldn't change that. You need Editor access.")}};
  const nk=$("#set-nick",v); if(nk) nk.oninput=()=>{S.nick=nk.value.trim().slice(0,40); save()};
  $("#reset").onclick=()=>{$("#resetzone").innerHTML=`<div class="callout pink"><div><h4>Reset everything?</h4><p>This cannot be undone.</p><div style="display:flex;gap:1.6rem;margin-top:1.6rem"><button class="btn sm pink" id="rs-yes">Yes, reset</button><button class="btn sm white" id="rs-no">Keep my work</button></div></div></div>`;
    $("#rs-yes").onclick=()=>{const keep={role:S.role,roleSet:S.roleSet,nick:S.nick,teacher:S.teacher}; S=Object.assign(freshState(),keep); save(); syncProgress(true); toast("Progress reset."); renderSettings(v)}; $("#rs-no").onclick=()=>renderSettings(v)};
}

/* ================= mission chrome ================= */
function stepState(st,i){return {done:(i<st.reached||st.done)&&!(i===2&&st.dgSkip&&!dgDone(st)), on:i===st.step, dis:!S.teacher&&i>st.reached}}
function circleSteps(st,lg){return `<div class="steps-c ${lg?"lg":""}" role="tablist" aria-label="Mission steps">${STEPS.map((s,i)=>{const k=stepState(st,i);
  return `<button class="st ${k.done&&!k.on?"done":""} ${k.on?"on":""}" role="tab" aria-selected="${k.on}" ${k.dis?"disabled":""} data-step="${i}">
   <span class="dot">${k.on?(i===STEPS.length-1?ic("star",2.6):""):(k.done?ic("check",3.2):"")}</span><span class="lab">${s}</span></button>`}).join("")}</div>`}
function pillSteps(st){return `<div class="steps-p" role="tablist" aria-label="Mission steps">${STEPS.map((s,i)=>{const k=stepState(st,i);
  return `${i?'<span class="ln" aria-hidden="true"></span>':""}<button class="st ${k.done&&!k.on?"done":""} ${k.on?"on":""}" role="tab" aria-selected="${k.on}" ${k.dis?"disabled":""} data-step="${i}">
   <span class="ic">${k.done&&!k.on?ic("check",3.4):""}</span>${s}</button>`}).join("")}</div>`}
function mhead(m,st){return `<div class="card mhead">
   <div class="chip" style="background:${m.chip}">${m.chipIcon||ic(m.icon,2.4)}</div>
   <div class="ttl ${m.title.length>34?"xlong":m.title.length>18?"long":""}"><div class="eyebrow">Mission</div><h2 title="${esc(m.title)}">${esc(m.title)}</h2></div>
   <span class="msep"></span><span class="mode">${STEPS[st.step]}</span>
   <div class="desc">${esc(m.modeDesc[st.step])}${m.problem&&st.step>=2&&st.step<=5?`<button class="btn sm white probbtn" id="probbtn">${ic("doc",2.4)}Problem info</button>`:""}</div>
   <div class="side"><i></i></div>
   <div class="bearbox"><img class="talk" src="${A(BEARS.hdr)}" alt="ModelQuest bear"></div>
   ${confetti(134.8,10.6,3,"#FD98A8",0,"dia")}
 </div>`}
function renderMission(id,v){
  const m=MISSIONS[id], st=S.missions[id]||(S.missions[id]=blankMission()); closeFlyouts(); ACTIVE=null; TIPV=null; hideTip();
  if(!st.opened||Date.now()-(st.at||0)>60000){st.opened=true; st.at=Date.now(); save()}
  const last=STEPS.length-1; st.step=clamp(st.step,0,last); if(!S.teacher&&st.step>st.reached) st.step=st.reached;
  const s=st.step, isLab=s===3&&m.lab;
  let chrome="";
  if(s===1) chrome=pillSteps(st);
  else if(s===2||(s===3&&!isLab)||s===4||s===5) chrome=`${mhead(m,st)}${circleSteps(st)}`;
  else if(s===last) chrome=`${circleSteps(st,true)}`;
  const cls=s===0?"intro":s===1?"def":isLab?"lab":s===last?"ex":s===2?"m-wrap dgpage":s===4?"m-wrap eqpage":"m-wrap";
  v.innerHTML=`<section class="page ${cls} view">${chrome}<div id="stepbody"></div></section>`;
  $$("[data-step]",v).forEach(b=>b.onclick=()=>{st.step=+b.dataset.step; save(); renderMission(id,v)});
  const ctx={next:()=>advance(id,v),back:()=>{st.step=Math.max(0,st.step-1); save(); renderMission(id,v)},rerender:()=>renderMission(id,v),stepsHTML:()=>circleSteps(st)};
  m.steps[s]($("#stepbody",v),st,ctx);
  $$("#stepbody [data-step]",v).forEach(b=>b.onclick=()=>{st.step=+b.dataset.step; save(); renderMission(id,v)});
  $$("#probbtn,[data-prob]",v).forEach(b=>b.onclick=()=>{problemModal(m,st); if(!st.d.probSeen){st.d.probSeen=true; save()} $$("[data-prob].nudge",v).forEach(x=>x.classList.remove("nudge"))});
  hydrateIcons(v); $$("textarea.etext",v).forEach(growTA); enhance(v);
}
function advance(id,v){const st=S.missions[id]; if(st.step<STEPS.length-1){st.step++; st.reached=Math.max(st.reached,st.step); st.at=Date.now(); save(); renderMission(id,v); window.scrollTo({top:0})}}
function completeMission(id){
  const st=S.missions[id]; st.done=true; st.reached=STEPS.length; st.at=Date.now(); save(); syncProgress(true); award("advisor"); setTimeout(()=>burst(innerWidth/2,innerHeight*.42,60,1.4),650);
  const m=MISSIONS[id], nm=nextMission();
  setTimeout(()=>modal(`<img class="peek" src="${A(BEARS.wave)}" alt="">
    <div class="eyebrow" style="color:#7C5CFF">Mission complete</div><h2 style="margin-top:1.2rem">${esc(m.title)}</h2>
    <p class="lead">${esc(m.doneLine)}</p>
    <div class="badges">${Object.keys(BADGES).filter(b=>BADGES[b].m===id||b==="advisor").map(b=>hexBadge(b,!S.badges[b],true)).join("")}</div>
    <div style="display:flex;justify-content:center;gap:2rem;margin-top:2.6rem;flex-wrap:wrap"><button class="btn white" data-close data-go="analytics">${ic("bars3",2.4)}See my evidence</button>
    ${S.missions[nm].done?`<button class="btn" data-close data-go="challenges">All challenges ${ic("arrowR",2.6)}</button>`:`<button class="btn" data-close data-go="${nm}">Next mission ${ic("arrowR",2.6)}</button>`}</div>`),700);
}

/* ================= shared step layouts ================= */
// Understand (reference: mission intro) — Start goes straight into the model
function introStep(el,m,st,ctx){
  el.innerHTML=`<div class="scene">${m.scene()}</div>
   <div class="card icard">
     <div class="top"><div class="chip" ${m.introBg?`style="background:${m.introBg}"`:""}>${m.introChip||ic(m.introIcon||m.icon,2.3)}</div><span class="vsep"></span>
       <div><h1${m.title.length>34?' class="long"':""}>${esc(m.title)}</h1>${m.brief?`<p>${m.brief}</p>`:""}
         ${m.introProblem?`<button class="btn sm white intro-problem" data-prob aria-haspopup="dialog">${ic("doc",2.2)}Problem info</button>`:""}</div></div>
     <div class="meta"><span>${CIC.flaskPurple}${esc(m.subj)}</span><span class="vsep"></span><span>${CIC.capTeal}${esc(m.grade)}</span><span class="vsep"></span>
       <span>${CIC.clockRed}≈ ${esc(m.minutes)} minutes</span><span class="vsep"></span>
       <button class="btn" id="go1">Start ${ic("arrowR",2.8)}</button></div>
   </div>`;
  $("#go1",el).onclick=ctx.next;
}
function choiceList(name,opts,sel){return `<div class="choices" role="radiogroup">${opts.map((o,i)=>`<button class="choice" role="radio" aria-pressed="${sel===o.v}" aria-checked="${sel===o.v}" data-${name}="${esc(o.v)}"><span class="k">${String.fromCharCode(65+i)}</span><span>${esc(o.l)}${o.s?`<small>${esc(o.s)}</small>`:""}</span></button>`).join("")}</div>`}
function bindChoices(el,name,cb){$$(`[data-${name}]`,el).forEach(b=>b.onclick=()=>{$$(`[data-${name}]`,el).forEach(x=>{x.setAttribute("aria-pressed","false");x.setAttribute("aria-checked","false")}); b.setAttribute("aria-pressed","true"); b.setAttribute("aria-checked","true"); cb(b.dataset[name],b)})}
// Define (reference: Define Your Model)
function defineShell(el,m,inner){
  el.innerHTML=`<div class="blob" style="left:-2rem;bottom:0;width:58rem;height:41.8rem;background:var(--pink-blob);border-radius:0 100% 0 0 / 0 100% 0 0"></div>
   <div class="blob" style="right:-2rem;top:-1.8rem;width:18.5rem;height:18rem;background:#FEE983;border-radius:0 0 0 100%"></div>
   <div class="blob" style="right:-2rem;bottom:0;width:26rem;height:24rem;background:#73EDD6;border-radius:100% 0 0 0 / 100% 0 0 0"></div>
   ${confetti(9,39.1,3.8,"#FD9374",-15)}${confetti(134.7,23.6,4,"#4BE5D9",20)}
   <img class="bear dbear talk" src="${A(BEARS.clip)}" alt="ModelQuest bear" style="left:6.1rem;bottom:0;width:33.8rem">
   <div class="def-grid">
     <div class="def-left">
       <button class="lab problab ${S.missions[m.id].d.probSeen?"":"nudge"}" data-prob aria-haspopup="dialog" aria-label="Show the problem info for ${esc(m.title)}"><div class="chip" ${m.defBg?`style="background:${m.defBg}"`:""}>${m.defIcon||ic(m.icon,2.4)}</div><span class="lt"><b>${esc(m.title)}</b><span class="plink">${ic("doc",2)}Problem info</span></span></button>
     </div>
     <div class="card dcard"><h1>Define Your Model</h1>${inner}</div>
   </div>`;
}
// Explain (reference: Explain Your Result)
function explainShell(el,m,inner){
  el.innerHTML=`<div class="ex-title"><div class="mpill"><b>MISSION</b><span>${esc(m.title)}</span></div><h1>Explain Your Result</h1></div>
   ${confetti(133.2,30.6,3.8,"#FD98A8",20)}
   <div class="ex-grid">
     <div class="ex-left">
       ${confetti(6,3,3.4,"#4BE5D9",20)}
       <div class="blob" style="left:-2rem;top:38.4rem;width:60rem;height:40rem;background:var(--pink-blob);border-radius:50% 50% 0 0 / 46% 46% 0 0;opacity:.85"></div>
       <div class="blob" style="left:6rem;top:48.6rem;width:33.6rem;height:4.4rem;background:#C9C3C6;border-radius:50%;opacity:.8"></div>
       <img class="bear xbear talk" src="${A(BEARS.clip2)}" alt="ModelQuest bear" style="left:9.5rem;top:4.7rem;width:30.6rem">
     </div>
     <div><div class="card ecard">${inner}</div>
       <div class="ex-btns"><button class="btn back" id="back">${ic("arrowL",2.8)}Back</button><button class="btn submit" id="sub">Submit ${ic("arrowR",2.8)}</button></div></div>
   </div>`;
}
// Hints follow the first unfinished goal; each goal keeps its own ladder of three
const HINT_LABEL=["","Ask yourself","Look here","Step by step"];
const hsteps=(...a)=>`<ol class="hsteps">${a.map(x=>`<li>${x}</li>`).join("")}</ol>`;
function goalHints(host,st,goal){
  if(!host) return; if(!hintsOn()||!goal||!goal.hints||!goal.hints.length){host.innerHTML=""; host.dataset.k=""; return}
  const hl=st.d.hl||(st.d.hl={}), n=goal.hints.length, lvl=Math.min(hl[goal.k]||0,n), key=goal.k+":"+lvl; if(host.dataset.k===key) return; host.dataset.k=key;
  host.innerHTML=lvl?`<div class="hints" aria-live="polite">${goal.hints.slice(0,lvl).map((h,i)=>`<div class="hcard h${Math.min(i+1,3)} ${i===lvl-1?"now":""}"><span class="hn">${i+1}</span><div class="hb"><h4>${HINT_LABEL[i+1]||"Hint "+(i+1)}</h4><div class="ht">${h}</div></div></div>`).join("")}
      ${lvl<n?`<button class="btn sm white" id="morehint">${ic("bulb",2.4)}Show hint ${lvl+1} of ${n}</button>`:""}</div>`:
    `<button class="btn sm white" id="morehint">${ic("bulb",2.4)}Need a hint?</button>`;
  const b=$("#morehint",host); if(b) b.onclick=()=>{hl[goal.k]=Math.min(n,lvl+1); st.hints=(st.hints||0)+1; save(); goalHints(host,st,goal);
    const last=$(".hcard.now",host); if(last&&last.scrollIntoView&&!still()) last.scrollIntoView({block:"nearest",behavior:"smooth"})}}
// a red block's own message, so the goal says what to fix instead of only "fix it"
function redFix(errs){const m=Object.values(errs||{})[0]; return m?`Fix the block marked in red first. ${esc(m)}`:"Fix the block marked in red first."}
// Assumptions: suggested ones start ticked, and students pick any others from the list
function assumptionsHTML(list,d){const chosen=d.as??list.filter(a=>a.sug).map(a=>a.k);
  return `<div class="callout asm" style="margin-top:3.4rem"><span class="ci">${ic("info",2.2)}</span><span class="vsep"></span>
   <div style="flex:1;min-width:0"><h4>Assumptions</h4><p>Every model leaves things out. Keep the suggested ones you agree with, and tick any others your model makes.</p>
   <div class="checks">${list.map(a=>`<label class="check"><input type="checkbox" data-as="${a.k}" ${chosen.includes(a.k)?"checked":""}><span>${esc(a.t)}${a.sug?'<em class="sugtag">suggested</em>':""}</span></label>`).join("")}</div>
   <p class="fb" id="asfb"></p></div></div>`}
function assumptionsCheck(el,list,d,min=2){d.as=$$("[data-as]",el).filter(c=>c.checked).map(c=>c.dataset.as);
  const bad=list.filter(a=>!a.ok&&d.as.includes(a.k)), good=list.filter(a=>a.ok&&d.as.includes(a.k)).length, fb=$("#asfb",el);
  fb.textContent=bad.length?bad[0].why:good<min?`Tick at least ${min} assumptions your model makes.`:"Good. These become your limitations when you explain your result.";
  fb.className="fb "+(bad.length?"warn":good>=min?"good":""); return !bad.length&&good>=min}
// The problem, available again while building
function varTable(V){return `<div class="tw"><table class="tbl vt"><thead><tr><th>Variable</th><th>What it means</th><th>Value</th></tr></thead><tbody>${Object.keys(V).map(k=>{const x=V[k];
  return `<tr><td><span class="vchip" data-var="${esc(k)}">${esc(x.label||k)}</span></td><td>${esc(x.name)}${x.unit?` <span class="muted">(${esc(x.unit)})</span>`:""}</td><td>${x.kind==="in"?"you slide it":x.kind==="out"?"your model finds it":x.kind==="mine"?"your variable":esc(x.show?x.show(x.val):fmt(x.val,4).replace(/\.?0+$/,""))}</td></tr>`}).join("")}</tbody></table></div>`}
function problemModal(m,st){const sp=dgSpecOf(m), dg=sp&&dgDone(st)?`<h3 class="ph">Your diagram</h3>${dgStatic(sp,innerWidth<640)}`:"";
  const md=modal(`<div class="probhd"><div class="chip" style="background:${m.chip}">${m.chipIcon||ic(m.icon,2.4)}</div>
    <div><div class="eyebrow">Problem info</div><h2>${esc(m.title)}</h2></div><button class="xbtn" data-close aria-label="Close">${ic("x",3)}</button></div>
    <div class="probbody">${m.problem(st)}${dg}</div>
    <div style="display:flex;justify-content:flex-end;margin-top:2.6rem"><button class="btn" data-close>${st.step===0?"Back to Understand":st.step===1?"Back to Define":st.step===2?"Back to my diagram":"Back to my model"} ${ic("arrowR",2.6)}</button></div>`); md.el.classList.add("wide"); if(dg&&typeof tipBind==="function") tipBind(md.el); return md}
// Pop-up tasks that arrive while students build
function taskPopup(o){const md=modal(`<img class="peek" src="${A(BEARS.wave)}" alt=""><div class="eyebrow" style="color:#D9466B">${esc(o.eyebrow||"Mission update")}</div><h2 style="margin-top:1.2rem">${o.title}</h2><div class="taskbody">${o.html}</div>
    <div style="display:flex;justify-content:flex-end;margin-top:2.6rem"><button class="btn" data-close>${o.btn||"Let's do it"} ${ic("arrowR",2.6)}</button></div>`,o.onClose);
  setTimeout(()=>{const b=$("#modal .box"); if(b) celebrate(b,24)},120); return md}
/* ================= charts ================= */
let CHID=0; const HOVER=new Map();
function lineChart(o){
  const W=o.w||740,H=o.h||400,L=o.L??92,R=o.R??118,T=o.T??18,B=o.B??66,id="ch"+(++CHID);
  const [x0,x1]=o.x,[y0,y1]=o.y;
  const X=x=>L+(x-x0)/(x1-x0)*(W-L-R), Y=y=>H-B-(y-y0)/(y1-y0)*(H-T-B), yc=y=>Y(clamp(y,y0,y1));
  let g=`<svg class="chart" id="${id}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria||"chart")}">`;
  (o.bands||[]).forEach(b=>g+=`<rect x="${X(b[0])}" y="${T}" width="${X(b[1])-X(b[0])}" height="${H-T-B}" fill="${b[2]}"/>`);
  g+=o.yt.map(t=>`<line x1="${L}" x2="${W-R}" y1="${Y(t)}" y2="${Y(t)}" stroke="#ECE2FD" stroke-width="1.6"/>`).join("");
  g+=o.xt.map(t=>`<line y1="${T}" y2="${H-B}" x1="${X(t)}" x2="${X(t)}" stroke="#ECE2FD" stroke-width="1.6"/>`).join("");
  if(o.frame!==false) g+=`<path d="M${W-R} ${T}V${H-B}M${L} ${T}H${W-R}" stroke="#ECE2FD" stroke-width="1.6"/>`;
  (o.series||[]).forEach(s=>{if(!s.pts.length)return;
    const d=s.pts.map((p,i)=>`${i?"L":"M"}${X(p[0]).toFixed(1)} ${yc(p[1]).toFixed(1)}`).join("");
    if(s.fill) g+=`<path d="${d}L${X(s.pts[s.pts.length-1][0])} ${Y(Math.max(y0,0))}L${X(s.pts[0][0])} ${Y(Math.max(y0,0))}Z" fill="${s.fill}"/>`;
    g+=`<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.sw||4}" stroke-linecap="round" stroke-linejoin="round" ${s.dash?`stroke-dasharray="${s.dash}"`:""}/>`;
    (s.dots||[]).forEach(p=>g+=marker(s.marker||"circle",X(p[0]),yc(p[1]),s.color));
  });
  if(o.zero&&y0<0) g+=`<line x1="${L}" x2="${W-R}" y1="${Y(0)}" y2="${Y(0)}" stroke="${INK}" stroke-width="2" stroke-dasharray="7 6"/>`;
  g+=`<path d="M${L} ${T-2}V${H-B}H${W-R+4}" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
  const tf=o.tf||20.5;
  g+=o.yt.map(t=>`<path d="M${L-8} ${Y(t)}h8" stroke="${INK}" stroke-width="3"/><text x="${L-14}" y="${Y(t)+7}" text-anchor="end" font-size="${tf}" font-weight="700" fill="${INK}">${o.yf?o.yf(t):t}</text>`).join("");
  g+=o.xt.map(t=>`<path d="M${X(t)} ${H-B}v8" stroke="${INK}" stroke-width="3"/><text x="${X(t)}" y="${H-B+33}" text-anchor="middle" font-size="${tf}" font-weight="700" fill="${INK}">${o.xf?o.xf(t):t}</text>`).join("");
  if(o.xl) g+=`<text x="${(L+W-R)/2}" y="${o.xly??H-2}" text-anchor="middle" font-size="21.5" font-weight="600" font-style="italic" fill="${INK}">${o.xl}</text>`;
  if(o.yl) g+=`<text transform="translate(${o.ylx||22} ${(T+H-B)/2}) rotate(-90)" text-anchor="middle" font-size="21" font-weight="600" font-style="italic" fill="${INK}">${o.yl}</text>`;
  (o.guides||[]).forEach(q=>{const px=X(q.x),py=yc(q.y); g+=`<path d="M${px} ${H-B}V${py}H${L}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-dasharray="9 7"/>`});
  const labs=(o.series||[]).filter(s=>s.label&&s.pts.length).map(s=>({s,y:yc(s.pts[s.pts.length-1][1])})).sort((a,b)=>a.y-b.y);
  for(let i=1;i<labs.length;i++) if(labs[i].y-labs[i-1].y<28) labs[i].y=labs[i-1].y+28;
  for(let i=labs.length-1;i>=0;i--){const lim=H-B-6-(labs.length-1-i)*28; if(labs[i].y>lim) labs[i].y=lim}
  labs.forEach(({s,y})=>{const real=yc(s.pts[s.pts.length-1][1]);
    if(Math.abs(real-y)>3) g+=`<path d="M${W-R+3} ${real}L${W-R+10} ${y}" stroke="${s.color}" stroke-width="2.6"/>`;
    g+=`<text x="${W-R+12}" y="${y+6}" font-size="18.5" font-weight="800" fill="${INK}">${s.label}</text>`;
    g+=`<rect x="${W-R+12}" y="${y+11}" width="${Math.min(R-16,s.label.length*9.4)}" height="4.5" rx="2.2" fill="${s.color}"/>`});
  (o.marks||[]).forEach(mk=>{const px=X(mk.x),py=yc(mk.y);
    g+=`<circle cx="${px}" cy="${py}" r="9.5" fill="${mk.fill||"#FDE14D"}" stroke="${INK}" stroke-width="3"/>`;
    if(mk.text) g+=`<text x="${px+(mk.dx||0)}" y="${py+(mk.dy??-18)}" text-anchor="${mk.anchor||"middle"}" font-size="18" font-weight="800" fill="${INK}" paint-order="stroke" stroke="#fff" stroke-width="6">${mk.text}</text>`});
  if(o.callout){const c=o.callout,px=X(c.x),py=yc(c.y); const bw=c.w||200,bh=78; let bx=px+58,by=py-bh-38; if(bx+bw>W-6) bx=px-bw-58; if(by<T+2) by=py+34;
    const right=bx>px, sx=right?bx+18:bx+bw-18, sy=by+bh+(by<py?0:-bh);
    g+=`<path d="M${sx} ${by<py?by+bh:by}Q${right?px+8:px-8} ${by<py?py-34:py+34} ${px+(right?10:-10)} ${py+(by<py?-11:11)}" fill="none" stroke="${INK}" stroke-width="2.6"/>`;
    g+=`<path d="M${px+(right?10:-10)} ${py+(by<py?-11:11)}l${right?2:-2} ${by<py?-11:11}M${px+(right?10:-10)} ${py+(by<py?-11:11)}l${right?11:-11} ${by<py?-3:3}" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`;
    g+=`<rect x="${bx+3}" y="${by+4}" width="${bw}" height="${bh}" rx="13" fill="${INK}"/><rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="13" fill="#FDF09F" stroke="${INK}" stroke-width="3"/>`;
    g+=`<text x="${bx+20}" y="${by+34}" font-size="29" font-weight="800" font-style="italic" fill="${INK}">${c.t1}</text><text x="${bx+20}" y="${by+62}" font-size="20.5" font-weight="700" font-style="italic" fill="${INK}">${c.t2}</text>`;
    g+=`<circle cx="${px}" cy="${py}" r="10" fill="#FDE14D" stroke="${INK}" stroke-width="3"/>`}
  g+=`<rect class="hitarea" x="${L}" y="${T}" width="${W-L-R}" height="${H-T-B}" fill="transparent"/>`;
  g+=`<line class="xhair" x1="0" x2="0" y1="${T}" y2="${H-B}" stroke="${INK}" stroke-width="1.6" opacity="0"/></svg>`;
  if(o.hover) HOVER.set(id,{fn:o.hover,X,x0,x1,L,R,W});
  return g;
}
function marker(kind,x,y,c){const st=`fill="${c}" stroke="${INK}" stroke-width="2.8"`;
  if(kind==="square") return `<rect x="${x-7.5}" y="${y-7.5}" width="15" height="15" rx="2.5" ${st}/>`;
  if(kind==="diamond") return `<path d="M${x} ${y-10}l10 10-10 10-10-10z" ${st}/>`;
  return `<circle cx="${x}" cy="${y}" r="7.5" ${st}/>`}
function wireHover(root){$$("svg.chart",root).forEach(svg=>{const h=HOVER.get(svg.id); if(!h)return;
  const hit=$(".hitarea",svg), xh=$(".xhair",svg);
  const mv=e=>{const r=svg.getBoundingClientRect(), sx=(e.clientX-r.left)/r.width*h.W; if(sx<h.L||sx>h.W-h.R){leave();return}
    const x=h.x0+(sx-h.L)/(h.W-h.L-h.R)*(h.x1-h.x0); const out=h.fn(x); if(!out){leave();return}
    xh.setAttribute("x1",h.X(out.x));xh.setAttribute("x2",h.X(out.x));xh.setAttribute("opacity",".45"); showTip(e,out.html)};
  const leave=()=>{xh.setAttribute("opacity","0"); hideTip()};
  hit.addEventListener("pointermove",mv); hit.addEventListener("pointerleave",leave)})}
function barChart(o){
  const W=740,H=380,L=66,R=20,T=52,B=72,n=o.bins.length,ymax=o.ymax;
  const slot=(W-L-R)/n,bw=slot-26,Y=v=>H-B-v/ymax*(H-T-B);
  let g=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria)}">`;
  const step=ymax<=20?5:ymax<=60?10:ymax<=120?25:50;
  for(let t=0;t<=ymax;t+=step) g+=`<line x1="${L}" x2="${W-R}" y1="${Y(t)}" y2="${Y(t)}" stroke="#F1E6E0" stroke-width="1.6"/><text x="${L-12}" y="${Y(t)+6}" text-anchor="end" font-size="18" font-weight="700">${t}</text>`;
  o.bins.forEach((b,i)=>{const x=L+i*slot+13,h=Math.max(0,H-B-Y(b.n)),y=Y(b.n),r=Math.min(7,h/2);
    g+=`<path d="M${x} ${H-B}V${y+r}Q${x} ${y} ${x+r} ${y}H${x+bw-r}Q${x+bw} ${y} ${x+bw} ${y+r}V${H-B}Z" fill="${o.color}" stroke="${INK}" stroke-width="2.8"><title>${esc(b.label)}: ${b.n}</title></path>`;
    g+=`<text x="${x+bw/2}" y="${y-10}" text-anchor="middle" font-size="19" font-weight="800">${b.n}</text>`;
    g+=`<text x="${x+bw/2}" y="${H-B+28}" text-anchor="middle" font-size="17" font-weight="700">${esc(b.label)}</text>`});
  if(o.mark!=null){const x=L+o.mark*slot+slot/2; g+=`<path d="M${x} ${T-16}V${Y(o.bins[o.mark].n)-32}" stroke="${INK}" stroke-width="2.6" stroke-dasharray="7 6"/><text x="${x}" y="${T-24}" text-anchor="middle" font-size="18" font-weight="800" paint-order="stroke" stroke="#fff" stroke-width="6">${esc(o.markText)}</text>`}
  g+=`<path d="M${L} ${T-6}V${H-B}H${W-R}" fill="none" stroke="${INK}" stroke-width="3"/>`;
  g+=`<text x="${(L+W-R)/2}" y="${H-8}" text-anchor="middle" font-size="19" font-weight="600" font-style="italic">${esc(o.xl)}</text></svg>`;
  return g;
}

function studioHTML(o){
  return `<div class="studio view wide">
    <div class="card palette" id="pal"></div>
    <div class="card canvasbox" id="cv"></div>
    <div class="card gpanel"><div class="gh"><div class="chip" style="background:${o.vizChip||"var(--pink)"}">${ic(o.vizIc||"trend",2.6)}</div><h3>${esc(o.vizTitle)}</h3><div class="eqs" id="eq"></div></div>
      <div class="chartbox" id="viz"></div></div>
  </div>
  <div class="card console">
    <div class="chip">${ic("term",2.4)}</div><span class="lab">Console</span><span class="vsep"></span>
    <div class="outbox"><div class="out" id="out" aria-live="polite">&gt; ready</div><button class="oexp" id="outx" type="button" aria-label="Open the whole console" title="Open the whole console">${ic("expand",2.2)}</button></div><span class="vsep"></span>
    <div class="sliders" id="sliders"></div>
  </div>
  <div class="belowbuild">
    <div class="card goals"><h4>Mission goals</h4><div id="goals"></div><div class="hintzone" id="hintzone"></div></div>
    <div class="navbtns"><button class="btn white" id="back">${ic("arrowL",2.6)}Diagram</button><button class="btn" id="nextb">Write the equations ${ic("arrowR",2.6)}</button></div>
  </div>`;
}
ICP.expand='<path d="M14.5 4.5h5v5M9.5 19.5h-5v-5M19.5 4.5l-6 6M4.5 19.5l6-6"/>';
function setOut(out,text,err,info){const was=out.dataset.t||""; out.dataset.t=text; out._info=Object.assign({text,err:!!err},info||{});
  out.className="out"+(err?" err":"")+(!err&&text.length>26?" long":""); out.innerHTML=`<span class="ot">${esc(text)}</span>`; out.title="Click to open the whole console";
  if(!err&&was!==text&&!still()){out.classList.remove("typed"); void out.offsetWidth; out.classList.add("typed")}}
function consoleModal(o){const said=o.said||[], vals=o.vals||[], ins=o.ins||[], errs=o.errs&&o.errs.length?o.errs:o.err?[o.text]:[];
  modal(`<div class="probhd"><div class="chip" style="background:var(--purple-chip)">${ic("term",2.6)}</div><div><div class="eyebrow">Console</div><h2>${errs.length?"Something to fix":"What your model says"}</h2></div><button class="xbtn" data-close aria-label="Close">${ic("x",3)}</button></div>
    <div class="cfull">
      ${errs.length?`<div class="callout pink"><div><h4>${errs.length>1?`${errs.length} blocks need fixing`:"A block needs fixing"}</h4>${errs.map(t=>`<p>${esc(t)}</p>`).join("")}<p class="muted" style="margin-top:.8rem">The block with the problem is outlined in red in your program.</p></div></div>`:""}
      ${ins.length?`<div class="csec"><h3>Slider settings</h3><p>${ins.map(esc).join("&ensp;·&ensp;")}</p></div>`:""}
      <div class="csec"><h3>What your program said</h3>${said.length?`<ol class="clog">${said.slice(0,200).map(x=>`<li>${esc(x)}</li>`).join("")}</ol>${said.length>200?`<p class="muted">…and ${fmt(said.length-200)} more lines.</p>`:""}`:`<p class="muted">Nothing yet. A <b>say</b> block from Graph prints a line here.</p>`}</div>
      <div class="csec"><h3>Values right now</h3>${vals.length?`<table class="tbl ctab"><tbody>${vals.map(([k,x])=>`<tr><th>${esc(k)}</th><td>${esc(x)}</td></tr>`).join("")}</tbody></table>`:`<p class="muted">No values yet. Use a <b>set</b> block from Variables to give an output a value.</p>`}</div>
    </div>`)}
document.addEventListener("click",e=>{if(!e.target.closest||!e.target.closest(".console #out, .console #outx")) return; const out=$("#out"); if(out&&out._info) consoleModal(out._info)});
function rangeHTML(id,label,min,max,step,val,color){
  return `<label class="sbox"><b id="${id}-lab">${label}</b><input class="rng" type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}" style="--c:${color}" aria-label="${esc(label.replace(/<[^>]+>/g,""))}"></label>`;
}
function paintRange(r){r.style.setProperty("--p",((r.value-r.min)/(r.max-r.min)*100)+"%")}
function goalsHTML(list){return list.map(g=>`<div class="goal ${g.ok?"ok":""} ${g.isNew&&!g.ok?"new":""}"><i></i><span>${g.t}${g.tag?`<em class="gtag">${g.tag}</em>`:""}${!g.ok&&g.fb?`<small class="gfb">${g.fb}</small>`:""}</span></div>`).join("")}
function testCard(t){return `<div class="card tcard" data-t="${t.id}"><div class="top"><div class="chip" style="background:${t.chip||"var(--mint-pill)"}">${ic(t.ic||"check",2.6)}</div><b>${esc(t.name)}</b><span class="st status">Not run</span></div>
  ${t.prompt?`<p class="test-prompt">${esc(t.prompt)}</p>`:""}
  <code>${t.code}</code><div class="said">Your model says: —</div></div>`}
function setTest(el,id,pass,said){const c=$(`[data-t="${id}"]`,el); if(!c)return; const s=$(".st",c); s.className="st status "+(pass?"pass":"fail"); s.textContent=pass?"Pass":"Fail"; $(".said",c).innerHTML=said}
