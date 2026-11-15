/* ================= Answer key (teacher mode). Every step has a "Show answers" button. Each press of "Show answer"
   fills the next task's answer into the step itself (the fields, the diagram, the blocks, the equations), so the class sees it
   where they work and the teacher can run it: the graph redraws, the fire spreads, the checks go green. "Undo answers" puts the
   page back the way it was. Built-in missions list their tasks in their own files (MISSIONS.x.answers); the Diagram and
   Equation steps, and every teacher-made problem, build theirs from the same specs the steps run on. ================= */
ICP.key='<circle cx="7.6" cy="16.4" r="4.4"/><path d="M10.7 13.3 20.4 3.6"/><path d="m16.9 7.1 2.6 2.6M14.3 9.7l2.1 2.1"/>';

// missions are defined before this file runs, so they hand over their answers as a function that's called when first needed
function akLazy(m,make){let a=null; Object.defineProperty(m,"answers",{get:()=>a||(a=make()),configurable:true})}
/* ---------- pieces for the Understand notes, which have no fields to fill ---------- */
function akP(h){return `<p>${h}</p>`}
function akUL(a){return `<ul class="akul">${a.map(x=>`<li>${x}</li>`).join("")}</ul>`}
function akKV(rows){return `<dl class="akkv">${rows.map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>`}
function akLab(h){return `<p class="aklab">${h}</p>`}

/* ---------- reference programs, made of the same blocks students use ---------- */
const BK={v:k=>newNode("var",{f:{v:k}}), op:(t,a,b)=>Object.assign(newNode(t),{a:{a,b}}), n:(t,f)=>newNode(t,f?{f}:{}),
  set:(k,x)=>Object.assign(newNode("set",{f:{v:k}}),{a:{x}}), change:(k,x)=>Object.assign(newNode("change",{f:{v:k}}),{a:{x:String(x)}}),
  say:x=>Object.assign(newNode("say"),{a:{x}}), plot:(y,x)=>newNode("plot",{f:{y,x}}), fn:(f,a)=>Object.assign(newNode("fn",{f:{fn:f}}),{a:{a}}),
  iff:(c,y)=>Object.assign(newNode("if"),{a:{c},b:{y}}), ifelse:(c,y,n)=>Object.assign(newNode("ifelse"),{a:{c},b:{y,n}}), until:(c,y)=>Object.assign(newNode("until"),{a:{c},b:{y}})};
// a teacher's formula as blocks (null when it uses something the blocks can't do, like min or sin)
function akAstBlock(t){if(!t) return null; if(t.n!=null) return String(t.n); if(t.v) return BK.v(t.v);
  if(t.f==="pow"&&t.args&&t.args.length===2) return akAstBlock({o:"^",a:t.args[0],b:t.args[1]});
  if(t.f){if(!FNF[t.f]||!t.args||t.args.length!==1) return null; const a=akAstBlock(t.args[0]); return a==null?null:BK.fn(t.f,a)}
  if(t.o==="neg"){const a=akAstBlock(t.a); return a==null?null:BK.op("sub","0",a)}
  const ty={"+":"add","-":"sub","*":"mul","/":"div","^":"pow"}[t.o]; if(!ty) return null;
  const a=akAstBlock(t.a), b=akAstBlock(t.b); return a==null||b==null?null:BK.op(ty,a,b)}
// "cost_A = fixed_A + rate_A*g" as the tiles the Equation step builds equations from
function akToks(src){const s=String(src).replace(/\s+/g,""), out=[]; let i=0;
  while(i<s.length){const c=s[i];
    if(/[0-9.]/.test(c)){let j=i; while(j<s.length&&/[0-9.]/.test(s[j])) j++; out.push(s.slice(i,j)); i=j; continue}
    if(/[A-Za-z_]/.test(c)){let j=i; while(j<s.length&&/[A-Za-z0-9_]/.test(s[j])) j++; const w=s.slice(i,j); if(w==="ln"&&s[j]==="("){out.push("ln("); i=j+1; continue} out.push(w); i=j; continue}
    out.push(c); i++}
  return out}

/* ---------- the Diagram step: the answers go into the diagram itself, one task at a time ---------- */
function akDiagramTasks(spec){const N=spec.nodes, X=spec.extras||[], P=spec.pipes||[], T=[];
  const D=st=>{st.d.dg=dgNorm(spec,st.d.dg); const g=st.d.dg; ["pl","ex","pipe","ln","q","err"].forEach(k=>g[k]=g[k]||{}); return g};
  const ok=q=>q.opts.findIndex(o=>o.ok), open=sel=>()=>{const b=$(sel); if(b&&!b.disabled) b.click()};
  if(spec.sort!==false) T.push({t:"Build the diagram: every card in its place",keys:["dg"],target:"#dgcv",apply:st=>{const g=D(st); N.forEach(n=>g.pl[n.id]=1); X.forEach(x=>g.ex[x.id]=1)}});
  if(P.length) T.push({t:`Point the pipe${P.length>1?"s":""}`,keys:["dg"],target:"#dgcv",apply:st=>{const g=D(st); P.forEach(p=>g.pipe[p.f]=ok(p))},after:open(`#dgside [data-nq="${P[P.length-1].f}"][data-nk="pipe"]`)});
  if(spec.links.length) T.push({t:`Draw the ${spec.links.length} connector${spec.links.length>1?"s":""}`,keys:["dg"],target:"#dgcv",apply:st=>{const g=D(st); spec.links.forEach(l=>{const a=g.ln[l.b]||(g.ln[l.b]=[]); if(!a.includes(l.a)) a.push(l.a)})}});
  (spec.why||[]).forEach((q,i)=>T.push({t:`Question ${i+1}: ${q.q}`,keys:["dg"],target:"#dgcv",apply:st=>{D(st).q[q.id]=ok(q)},after:open(`#dgside [data-nq="${q.id}"][data-nk="read"]`)}));
  return T}

/* ---------- the Equation step: the same four sections, filled in ---------- */
function akEquationTasks(spec){const SY=spec.SY, R=s=>rich(s,SY), T=[], sv=spec.solve;
  const E=st=>{const e=st.d.eq||(st.d.eq={}); e.sym=e.sym||{}; e.ok=e.ok||{}; e.tok=e.tok||{}; e.draft=e.draft||{}; e.q=e.q||{}; e.sv=e.sv||{at:0,fin:false,ans:{},ip:null}; e.sv.ans=e.sv.ans||{}; return e};
  const ok=q=>q.opts.findIndex(o=>o.ok), qq=id=>()=>{const b=$(`#es3 [data-qid="${CSS.escape(id)}"]`); return b&&b.closest(".qq")};
  T.push({t:"Know your symbols",keys:["eq"],target:"#es1",apply:st=>{const e=E(st); spec.syms.forEach(k=>e.sym[k]=k)}});
  spec.eqs.forEach((q,i)=>T.push({t:`Write the equation for ${symHTML(q.out,SY)}`,keys:["eq"],target:`#eqb${i}`,apply:st=>{const e=E(st); e.ok[q.out]=true; e.tok[q.out]=akToks(q.out+"="+q.f); delete e.draft[q.out]}}));
  (spec.why||[]).forEach(q=>T.push({t:R(q.q),keys:["eq"],target:qq(q.id),apply:st=>{E(st).q[q.id]=ok(q)}}));
  if(sv&&sv.steps.length) sv.steps.forEach((s,i)=>T.push({t:`Move ${i+1} of ${sv.steps.length}: ${R(s.q)}`,keys:["eq"],target:"#es4",apply:st=>{const e=E(st); e.sv.at=Math.max(e.sv.at||0,i+1); if(e.sv.pick) delete e.sv.pick[i]}}));
  if(sv&&sv.final&&sv.final.inputs.length) T.push({t:R(sv.final.q),keys:["eq"],target:"#es4 .lfinal",apply:st=>{const e=E(st); e.sv.at=sv.steps.length; e.sv.fin=true; sv.final.inputs.forEach((x,j)=>e.sv.ans[j]=String(fmtM(x.ans)).replace(/\s/g,""))}});
  if(sv&&sv.interp) T.push({t:R(sv.interp.q),keys:["eq"],target:"#es4 .lfinal",apply:st=>{E(st).sv.ip=ok(sv.interp)}});
  return T}

/* ---------- the engine ---------- */
const AKS={open:false,cur:null,busy:false,run:0,msg:"",pos:null};
// only teachers, and on claude.ai only people who can edit the page (a student who picks Teacher in Settings doesn't get it)
function akAllowed(){return !!S.teacher&&(Cloud.local||!!Cloud.canEdit)}
// while answers go in, badges and their pop-ups stay quiet
function akQuiet(){return AKS.busy}
function akTasks(m,st,s){
  try{if(s===2){const sp=dgSpecOf(m); return sp?akDiagramTasks(sp):[]}
    if(s===4){const sp=m.custom?autoEqSpec(m.prob):m.eq; return sp?akEquationTasks(sp):[]}
    return (m.answers&&m.answers[s]&&m.answers[s](st))||[]}
  catch(e){console.error("answer key",e); return []}}
// what has been filled in on a step, and what was there before, live in the mission's saved state, so Undo survives a reload
const akSt=(st,s)=>(st.ak&&st.ak[s])||{done:[],snap:null};
function akKeyOf(){return AKS.cur?AKS.cur.m.id+":"+AKS.cur.step:""}
// renderMission calls this with the step on screen; route() calls it with nothing when the page isn't a mission
function akSync(m,st){const k=m&&st?m.id+":"+st.step:"";
  if(AKS.busy&&k!==akKeyOf()){AKS.busy=false; AKS.run++; AKS.msg=""}
  AKS.cur=m&&st&&akAllowed()?{m,st,step:st.step}:null; akPaint()}
function akRender(){const c=AKS.cur; if(!c) return; stopTimers(); renderMission(c.m.id,$("#view"))}
const akWait=(cond,ms=20000)=>new Promise(res=>{const t0=Date.now(), f=()=>{let ok=false; try{ok=cond()}catch(e){} if(ok||Date.now()-t0>ms) res(ok); else setTimeout(f,120)}; f()});
// a click on the page, then wait for what it starts to finish (trials, the sweep, a fire burning out)
function akClick(sel,done,ms){return async()=>{const b=$(sel); if(!b) return; b.click(); if(done) await akWait(done,ms)}}
// bring what was just filled in into view, and make it glow for a moment
function akGo(t){const el=typeof t==="function"?t():t?$(t):null; if(!el) return;
  const inModal=!!el.closest(".modal"), r=el.getBoundingClientRect();
  if(!inModal&&(r.top<90||r.top>innerHeight*.45)) window.scrollTo({top:Math.max(0,scrollY+r.top-Math.max(96,innerHeight*.16)),behavior:still()?"auto":"smooth"});
  el.classList.remove("akflash"); void el.offsetWidth; el.classList.add("akflash"); setTimeout(()=>el.classList.remove("akflash"),2000); setTimeout(()=>akDodge(el),still()?30:480)}
// the panel steps aside (bottom right or bottom left) when it would cover what was just filled in, unless the teacher has moved it
function akDodge(el){if(AKS.dragged||akSheet()||!AKS.open||!el||!document.body.contains(el)) return; const pn=$("#akroot .akpanel"); if(!pn) return;
  const t=el.getBoundingClientRect(), p=pn.getBoundingClientRect(), w=p.width, h=p.height, W=innerWidth, H=innerHeight, cur={r:W-p.right,b:H-p.bottom}, g=Math.max(16,cur.b);
  const cover=c=>{const L=W-c.r-w, T=H-c.b-h; return Math.max(0,Math.min(L+w,t.right)-Math.max(L,t.left))*Math.max(0,Math.min(T+h,Math.min(t.bottom,H))-Math.max(T,Math.max(t.top,0)))};
  const best=[{r:g,b:g},{r:W-w-g,b:g}].reduce((a,c)=>cover(c)<cover(a)-1?c:a,cur);
  if(best!==cur){AKS.pos=best; akPlace()}}
async function akFill(upto){const c=AKS.cur; if(!c||AKS.busy) return; const {m,st}=c, s=st.step, T=akTasks(m,st,s); if(!T.length) return;
  upto=Math.min(upto,T.length-1); const was=akSt(st,s), todo=[]; for(let i=0;i<=upto;i++) if(!was.done.includes(i)) todo.push(i);
  if(!todo.length){akGo(T[upto].target); return}
  st.ak=st.ak||{}; const run=++AKS.run, A=st.ak[s]=st.ak[s]||{done:[],snap:null};
  AKS.busy=true; AKS.msg=todo.some(i=>T[i].after)?"Filling in and running…":"Filling in…"; akPaint();
  try{
    if(s===0) todo.forEach(i=>A.done.push(i));
    else{
      // keep whatever these answers replace, so Undo can put it back
      A.snap=A.snap||{}; todo.forEach(i=>{const ks=typeof T[i].keys==="function"?T[i].keys(st):(T[i].keys||[]); ks.forEach(k=>{if(!(k in A.snap)) A.snap[k]=k in st.d?{v:JSON.parse(JSON.stringify(st.d[k]))}:{none:1}})});
      todo.forEach(i=>{if(T[i].apply) T[i].apply(st); A.done.push(i)});
      save(); akRender();
      for(const i of todo){if(run!==AKS.run) return; const f=T[i].after; if(!f) continue;
        const again=await Promise.race([Promise.resolve().then(()=>f(st)),new Promise(r=>setTimeout(r,60000))]);
        if(run!==AKS.run) return; if(again===true){save(); akRender()}}}
    save();
  }finally{if(run===AKS.run){AKS.busy=false; AKS.msg=""}}
  if(run!==AKS.run) return;
  akPaint("[data-aknext]"); setTimeout(()=>akGo(s===0?`.aknotes [data-n="${upto}"]`:T[upto].target),60)}
function akUndo(){const c=AKS.cur; if(!c||AKS.busy) return; const {st}=c, s=st.step, A=st.ak&&st.ak[s]; if(!A) return;
  if(A.snap) for(const k in A.snap){if(A.snap[k].none) delete st.d[k]; else st.d[k]=A.snap[k].v}
  delete st.ak[s]; save(); if(s!==0) akRender(); akPaint("[data-aknext]"); const l=$("#aklive"); if(l) l.textContent="Answers taken out."}
function akRoot(){let r=document.getElementById("akroot");
  if(!r){r=document.createElement("div"); r.id="akroot"; r.innerHTML=`<div id="akbody"></div><p class="aklive" id="aklive" aria-live="polite"></p>`; document.body.appendChild(r);
    r.addEventListener("click",akClick2); r.addEventListener("pointerdown",akDrag);
    r.addEventListener("dblclick",e=>{if(e.target.closest(".akhd")&&!e.target.closest("button")){AKS.pos=null; AKS.dragged=false; akPlace()}});
    r.addEventListener("keydown",e=>{if(e.key==="Escape"&&AKS.open){e.stopPropagation(); AKS.open=false; akPaint("[data-akopen]")}})}
  return r}
function akPaint(focus){const root=akRoot(), body=$("#akbody",root), c=AKS.cur; document.body.classList.toggle("akon",!!c);
  $$(".aknotes").forEach(x=>x.remove());
  if(!c){root.hidden=true; body.innerHTML=""; return}
  const {m,st}=c, s=st.step, T=akTasks(m,st,s), N=T.length, A=akSt(st,s), done=new Set(A.done.filter(i=>i<N)), next=T.findIndex((_,i)=>!done.has(i)), last=A.done.length?A.done[A.done.length-1]:-1;
  // Understand has nothing to fill in, so its answers become a card on the page itself
  if(s===0&&done.size){const card=$("#stepbody .icard"); if(card) card.insertAdjacentHTML("afterend",`<section class="card aknotes" aria-label="Answer key"><div class="aknh"><span class="akchip">${ic("key",2.4)}</span><b>Answer key</b><small>only teachers see this</small></div>
    <ol class="aknl">${T.map((t,i)=>done.has(i)?`<li data-n="${i}"><b>${t.t}</b><div class="aknb">${t.html||""}</div></li>`:"").join("")}</ol></section>`)}
  root.hidden=false;
  if(!AKS.open){root.style.right=root.style.bottom=""; body.innerHTML=`<button type="button" class="akfab" data-akopen aria-expanded="false">${ic("key",2.4)}<span>Show answers</span>${done.size?`<span class="akc">${done.size}/${N}</span>`:""}</button>`; akFocus(root,focus); return}
  const old=$("#aklist",root), keep=old?old.scrollTop:0, busy=AKS.busy;
  const rows=T.map((t,i)=>{const on=done.has(i), nx=i===next;
    return `<li class="akrow ${on?"done":""} ${nx?"next":""}"><button type="button" class="akto" data-akto="${i}" ${busy?"disabled":""} aria-label="${on?"Show where answer":"Fill in answer"} ${i+1}"><span class="akn">${on?ic("check",3):i+1}</span><span class="akt">${t.t}${t.tag?` <em class="aktag">${esc(t.tag)}</em>`:""}</span></button></li>`}).join("");
  const lt=last>=0&&T[last]?T[last]:null;
  body.innerHTML=`<section class="akpanel ${busy?"busy":""}" role="region" aria-label="Answer key for ${esc(STEPS[s])}">
    <header class="akhd" title="Drag to move it out of the way. Double-click to put it back."><span class="akchip">${ic("key",2.4)}</span><div class="akht"><b>Answer key · ${esc(STEPS[s])}</b><small>${s===0?"Answers appear on the page":"Fills each answer in on the page"} · teachers only</small></div>
      <button type="button" class="akib" data-akclose aria-label="Close the answer key" title="Close">${ic("x",2.6)}</button></header>
    ${N?`<div class="akprog"><span class="akbar" aria-hidden="true"><i style="width:${done.size/N*100}%"></i></span><span>${done.size} of ${N} filled in</span></div>
    <ol class="aktasks" id="aklist">${rows}</ol>
    ${busy?`<p class="aklast busy"><span class="akspin" aria-hidden="true"></span>${esc(AKS.msg||"Filling in…")}</p>`:lt?`<p class="aklast">${ic("check",2.6)}<span><b>Filled in:</b> ${lt.t}${lt.note?`<span class="aklnote">${lt.note}</span>`:""}</span></p>`:""}
    <footer class="akft"><button type="button" class="btn sm" data-aknext ${next<0||busy?"disabled":""}>${next<0?`${ic("check",2.6)}All answers in`:`${ic("playf",2)}Show answer ${next+1}`}</button>${next>=0&&N>1?`<button type="button" class="btn sm white" data-akall ${busy?"disabled":""}>Show all</button>`:""}${done.size?`<button type="button" class="btn sm white" data-akundo ${busy?"disabled":""} title="Put back what was on this page before">${ic("refresh",2.4)}Undo</button>`:""}</footer>`:
    `<p class="akempty">This step has no answers to fill in.</p>`}
  </section>`;
  const ls=$("#aklist",root); if(ls){ls.scrollTop=keep; const nx=$(".akrow.next",ls)||$(".akrow.done:last-of-type",ls); if(nx){const a=ls.getBoundingClientRect(), b=nx.getBoundingClientRect(); if(b.top<a.top||b.bottom>a.bottom) ls.scrollTop+=b.top-a.top-8}}
  akPlace(); akFocus(root,focus)}
function akFocus(root,sel){if(!sel) return; const b=$(sel,root); if(b&&!b.disabled){b.focus({preventScroll:true}); return}
  const f=$("[data-aknext]:not([disabled]),[data-akclose],[data-akopen]",root); if(f) f.focus({preventScroll:true})}
function akClick2(e){const t=e.target.closest("button"); if(!t||!AKS.cur) return; const {m,st}=AKS.cur, s=st.step, say=x=>{const l=$("#aklive"); if(l) l.textContent=x};
  if(t.hasAttribute("data-akopen")){AKS.open=true; akPaint("[data-aknext]"); return}
  if(t.hasAttribute("data-akclose")){AKS.open=false; akPaint("[data-akopen]"); return}
  if(t.hasAttribute("data-akundo")){akUndo(); return}
  const T=akTasks(m,st,s), N=T.length, A=akSt(st,s);
  if(t.hasAttribute("data-aknext")){const i=T.findIndex((_,j)=>!A.done.includes(j)); if(i>=0){akFill(i); say(`Answer ${i+1} of ${N} filled in.`)} return}
  if(t.hasAttribute("data-akall")){akFill(N-1); say(`All ${N} answers filled in.`); return}
  if(t.dataset.akto!=null){const i=+t.dataset.akto; if(A.done.includes(i)) akGo(s===0?`.aknotes [data-n="${i}"]`:T[i].target); else{akFill(i); say(`Answers up to ${i+1} filled in.`)}}}
// the panel can be dragged by its header, out of the way of whatever the class is looking at
const akSheet=()=>matchMedia("(max-width:560px)").matches;
function akDrag(e){const hd=e.target.closest(".akhd"); if(!hd||e.target.closest("button")||e.button>0||akSheet()) return;
  const pn=hd.closest(".akpanel"), r=pn.getBoundingClientRect(), sx=e.clientX, sy=e.clientY, r0=innerWidth-r.right, b0=innerHeight-r.bottom;
  e.preventDefault(); try{hd.setPointerCapture(e.pointerId)}catch(err){} hd.classList.add("drag");
  const mv=ev=>{AKS.dragged=true; AKS.pos={r:r0-(ev.clientX-sx),b:b0-(ev.clientY-sy)}; akPlace()};
  const up=()=>{hd.classList.remove("drag"); hd.removeEventListener("pointermove",mv); hd.removeEventListener("pointerup",up); hd.removeEventListener("pointercancel",up)};
  hd.addEventListener("pointermove",mv); hd.addEventListener("pointerup",up); hd.addEventListener("pointercancel",up)}
function akPlace(){const root=akRoot(), pn=$(".akpanel",root);
  if(!pn||!AKS.pos||akSheet()){root.style.right=root.style.bottom=""; return}
  const w=pn.offsetWidth, h=pn.offsetHeight, r=clamp(AKS.pos.r,8,Math.max(8,innerWidth-w-8)), b=clamp(AKS.pos.b,8,Math.max(8,innerHeight-h-8));
  AKS.pos={r,b}; root.style.right=r+"px"; root.style.bottom=b+"px"}
// editing rights on claude.ai are only known once the page connects, and a teacher's own answer key can arrive later
cloudOn("ready",()=>{if(AKS.cur&&!akAllowed()) AKS.cur=null; akPaint()});
cloudOn("keys",()=>{if(AKS.cur&&AKS.cur.m.custom&&!AKS.busy) akPaint()});
addEventListener("resize",()=>{if(AKS.cur&&AKS.open) akPlace()});
