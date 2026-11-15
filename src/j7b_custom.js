/* ================= Problems teachers make: one mission player for all of them ================= */
const TOPIC_LOOK={Finance:["dollar","#B4E9FE"],Physics:["atom","#DECFFD"],Chemistry:["flask","#C1FBE1"],Biology:["leaf","#C9F5D4"],Environment:["tree","#CFF6E6"],
  Sports:["target","#FDE7A6"],Health:["star","#FDD6DA"],Technology:["code","#DDEFFC"],"Everyday life":["home","#FEF0C7"]};
const lookFor=p=>TOPIC_LOOK[p.topic]||["sigma","#E9E2FD"];
const capFirst=s=>{s=String(s||""); return s.charAt(0).toUpperCase()+s.slice(1)};
function unitShow(u){return x=>!Number.isFinite(x)?"—":u==="$"?money(x):u==="%"?fmt(x,Math.abs(x-Math.round(x))<0.05?0:1)+"%":
  fmt(x,Math.abs(x-Math.round(x))<1e-9||Math.abs(x)>=1000?0:Math.abs(x)<1?3:2)+(u?" "+u:"")}
const showV=(v,x)=>unitShow(v.unit)(x);
function customVars(p,st){const V={};
  p.vars.forEach(v=>{const x={kind:v.kind,label:v.key,name:v.name||v.key,unit:v.unit,show:unitShow(v.unit)}; if(v.kind==="par"){x.val=v.val; x.src="the problem"} V[v.key]=x});
  ((st&&st.d.mine)||[]).forEach(k=>{if(!V[k]) V[k]={kind:"mine",label:k,name:"a variable you made",unit:""}}); return V}
function ptText(p,pt){return p.vars.filter(v=>v.kind==="in").map(v=>`${v.key} = ${showV(v,pt[v.key])}`).join(" and ")}
/* hints when the teacher wrote none: a worked case, the relationship, then numbered build steps made from the teacher's formula */
const OPS={"+":"+","-":"−","*":"×","/":"÷","^":"^"};
const FN_BLOCK={sqrt:"√ sqrt",abs:"abs",round:"round",floor:"floor",ceil:"ceiling",ln:"ln",log:"log₁₀",exp:"e ^"};
function astText(t,top){if(t.n!=null) return String(t.n); if(t.v) return t.v;
  if(t.f) return `${t.f}(${t.args.map(a=>astText(a,true)).join(", ")})`; if(t.o==="neg") return "−"+astText(t.a);
  const x=`${astText(t.a)} ${OPS[t.o]} ${astText(t.b)}`; return top?x:`(${x})`}
function astSteps(t,where,out,off){const leaf=x=>x.n!=null||!!x.v, lt=x=>`<b>${esc(x.v||String(x.n))}</b>`;
  if(t.n!=null){out.push(`Type <b>${esc(String(t.n))}</b> in ${where}.`); return true}
  if(t.v){out.push(`Drag <b>${esc(t.v)}</b> from Variables into ${where}.`); return true}
  if(t.f==="pow"&&t.args.length===2) t={o:"^",a:t.args[0],b:t.args[1]};
  if(t.f){const nm=FN_BLOCK[t.f]; if(!nm||t.args.length!==1) return false; const me=off+out.length;
    if(leaf(t.args[0])){out.push(`Drop a <b>function</b> block from Math into ${where}, choose <b>${esc(nm)}</b> in its menu, and put ${lt(t.args[0])} in its slot.`); return true}
    out.push(`Drop a <b>function</b> block from Math into ${where} and choose <b>${esc(nm)}</b> in its menu.`); return astSteps(t.args[0],`the slot of the ${esc(nm)} block from step ${me}`,out,off)}
  if(t.o==="neg"){const me=off+out.length; out.push(`Drop a <b>−</b> block from Math into ${where} and type <b>0</b> in its left slot.`); return astSteps(t.a,`the right slot of the − block from step ${me}`,out,off)}
  const sym=OPS[t.o], me=off+out.length;
  if(leaf(t.a)&&leaf(t.b)){out.push(`Drop a <b>${sym}</b> block from Math into ${where}. Put ${lt(t.a)} in its left slot and ${lt(t.b)} in its right slot.`); return true}
  if(leaf(t.a)){out.push(`Drop a <b>${sym}</b> block from Math into ${where}, and put ${lt(t.a)} in its left slot.`); return astSteps(t.b,`the right slot of the ${sym} block from step ${me}`,out,off)}
  if(leaf(t.b)){out.push(`Drop a <b>${sym}</b> block from Math into ${where}, and put ${lt(t.b)} in its right slot.`); return astSteps(t.a,`the left slot of the ${sym} block from step ${me}`,out,off)}
  out.push(`Drop a <b>${sym}</b> block from Math into ${where}.`);
  return astSteps(t.a,`the left slot of the ${sym} block from step ${me}`,out,off)&&astSteps(t.b,`the right slot of the ${sym} block from step ${me}`,out,off)}
function genericHints(p,v,model){const i=p.vars.find(x=>x.kind==="in"), base={}; p.vars.filter(x=>x.kind==="in").forEach(x=>base[x.key]=x.start);
  let ast=null; try{ast=parseFormula(v.formula)}catch(e){}
  const used=ast?[...formulaVars(ast)].map(k=>p.vars.find(x=>x.key===k)).filter(Boolean):[];
  const val=model?model.at(base)[v.key]:NaN, check=Number.isFinite(val)?`Check: when ${esc(ptText(p,base))||"you press Run"}, the console should say ${esc(v.key)} = ${esc(showV(v,val))}.`:"";
  const h1=`Find the numbers that <b>${esc(v.key)}</b>${v.name?` (${esc(v.name)})`:""} depends on in the problem information: tap <b>Problem info</b>. Then work out one case by hand${i?`: when ${esc(i.key)} = ${esc(showV(i,i.start))}, what is ${esc(v.key)}?`:"."} Write the calculation down.`;
  const h2=(used.length?`<b>${esc(v.key)}</b> is built from ${used.map(x=>`<b>${esc(x.key)}</b>${x.name?` (${esc(x.name)})`:""}`).join(", ")}. `:"")+
    "Turn your hand calculation into a rule: swap each number for the variable it came from, and keep the same operations in the same order. Variables are blocks you drag in from Variables. Typing their names won't work.";
  const steps=[`From <b>Variables</b>, drag a <b>set</b> block into your program and choose <b>${esc(v.key)}</b> in its menu.`];
  const ok=ast&&astSteps(ast,"the set block's empty slot",steps,1)&&steps.length<=9;
  const h3=ok?hsteps(...steps,`It should read: set ${esc(v.key)} to ${esc(astText(ast,true))}.`,...(check?[check]:[])):
    hsteps(`From <b>Variables</b>, drag a <b>set</b> block into your program and choose <b>${esc(v.key)}</b>.`,ast?`Build this from the outside in, one Math block at a time: set ${esc(v.key)} to ${esc(astText(ast,true))}.`:"Build its value from Math blocks and the variables in your library, following your hand calculation.",...(check?[check]:[]));
  return [h1,h2,h3]}
// hints a teacher (or the AI) wrote: numbered steps become a list students can follow
function hintFmt(t){const s=String(t||"").trim(); if(!s) return "";
  const marks=[...s.matchAll(/(?:^|\s)(\d{1,2})[.)]\s+/g)];
  if(marks.length>=2&&marks.every((m,j)=>+m[1]===j+1)){const lead=s.slice(0,marks[0].index).trim(), items=marks.map((m,j)=>s.slice(m.index+m[0].length,j+1<marks.length?marks[j+1].index:s.length).trim()).filter(Boolean);
    return (lead?`<p>${esc(lead)}</p>`:"")+hsteps(...items.map(esc))}
  return esc(s).replace(/\n/g,"<br>")}
function customChecks(p,R,model,pts){const G=[], outs=p.vars.filter(v=>v.kind==="out"&&!model.errs[v.key]), ins=p.vars.filter(v=>v.kind==="in");
  outs.forEach(v=>{const g=p.goals.find(x=>x.out===v.key)||{}; let res={ok:true};
    for(const pt of pts){const e=R.at(pt), y=e.v[v.key], want=model.at(pt)[v.key];
      if(y===undefined){res={ok:false,fb:Object.keys(e.errs).length?redFix(e.errs):`<b>${esc(v.key)}</b> isn't set yet. Drag a <b>set</b> block from Variables into your program and choose <b>${esc(v.key)}</b> in its menu.`}; break}
      if(!Number.isFinite(want)) continue;
      if(!(Number.isFinite(y)&&Math.abs(y-want)<=1e-6*Math.max(1,Math.abs(want)))){res={ok:false,fb:`When ${esc(ptText(p,pt))}, your ${esc(v.key)} = ${esc(showV(v,y))}, but the problem gives ${esc(showV(v,want))}. Set the sliders to those values and check each part of your blocks against the problem information.`}; break}}
    G.push({k:v.key,t:g.text?esc(g.text):`Build <b>${esc(v.key)}</b>: ${esc(v.name||"")}`,...res,hints:(()=>{const own=(g.hints||[]).filter(Boolean).slice(0,3).map(hintFmt), gen=genericHints(p,v,model); return own.concat(gen.slice(own.length))})()})});
  if(ins.length&&outs.length){const plots=R.at(pts[0]||{}).plots, done=G.every(g=>g.ok);
    G.push({k:"plot",t:`Plot ${outs.length>1?"your outputs":`<b>${esc(outs[0].key)}</b>`} against <b>${esc(ins[0].key)}</b>`,ok:done&&plots.some(q=>outs.some(o=>o.key===q.y)),fb:done?"Add a <b>plot</b> block from Graph.":"",
      hints:[`Your set blocks give ${outs.map(o=>esc(o.key)).join(" and ")} for one value of ${esc(ins[0].key)}. How could you see ${outs.length>1?"them":"it"} for every ${esc(ins[0].key)} at once?`,
        `A <b>plot</b> block runs your model at every ${esc(ins[0].key)} and draws it: ${esc(outs[0].key)} goes up the side and ${esc(ins[0].key)} goes along the bottom.`,
        hsteps("Open <b>Graph</b> and drag a <b>plot</b> block to the end of your program.",`Choose <b>${esc(outs[0].key)}</b> in its first menu and <b>${esc(ins[0].key)}</b> in its second.`,...(outs.length>1?[`Add one more plot block for ${outs.slice(1).map(o=>`<b>${esc(o.key)}</b>`).join(" and ")}, also against ${esc(ins[0].key)}.`]:[]),`Slide ${esc(ins[0].key)} and watch the point move along your graph.`)]})}
  return G}
function teacherNote(t){return t?`<div class="callout tnote"><span class="ci">${CIC.bulb}</span><span class="vsep"></span><div><h4>From your teacher</h4><p>${esc(t)}</p></div></div>`:""}
function customScene(p){const [icn,bg]=lookFor(p);
  return `<svg viewBox="0 0 1364 555" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="1364" height="555" fill="${bg}"/>
    <g opacity=".55" fill="#fff">${Array.from({length:12},(_,i)=>`<circle cx="${60+i*115}" cy="${48+(i%3)*22}" r="5"/>`).join("")}</g>
    <rect x="0" y="430" width="1364" height="125" fill="#F6E2CF" stroke="${INK}" stroke-width="5"/>
    <rect x="300" y="88" width="520" height="300" rx="34" fill="#FFFDFB" stroke="${INK}" stroke-width="7"/>
    <rect x="330" y="118" width="460" height="240" rx="18" fill="#F3EEFE" stroke="${INK}" stroke-width="4"/>
    <path d="M372 330V150M372 330H760" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <path d="M380 318C470 300 560 250 640 196S730 150 752 146" fill="none" stroke="#7B4FF3" stroke-width="8" stroke-linecap="round"/>
    <path d="M380 262H752" fill="none" stroke="#FF7A59" stroke-width="7" stroke-dasharray="20 14" stroke-linecap="round"/>
    <circle cx="640" cy="196" r="15" fill="#FDE14D" stroke="${INK}" stroke-width="5"/>
    <rect x="540" y="388" width="40" height="44" fill="#E4DBFB" stroke="${INK}" stroke-width="5"/>
    <g transform="translate(110 150)"><rect width="150" height="150" rx="34" fill="#FFFDFB" stroke="${INK}" stroke-width="7"/><g transform="translate(27 27) scale(4)" fill="none" stroke="${INK}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">${ICP[icn]||ICP.sigma}</g></g>
    <g transform="translate(860 120)"><rect width="96" height="96" rx="24" fill="#FDE14D" stroke="${INK}" stroke-width="6"/><g transform="translate(18 18) scale(2.5)" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round">${ICP.code}</g></g>
    </svg><img class="sbear talk" src="${A(BEARS.clip)}" alt="ModelQuest bear" data-sx=".6" data-sy=".08" style="right:5%;top:20%;width:24%">`}
function customMission(p){const id="p-"+p.id, [icn,bg]=lookFor(p);
  const m={id,custom:true,prob:p,title:p.title||"Untitled problem",icon:icn,chip:bg,introBg:bg,defBg:bg,bar:"#B9A6F5",
    brief:esc(p.story||""),subj:[p.topic,p.area].filter(Boolean).join(", ")||"Math modeling",grade:p.grade,minutes:p.minutes,tags:[p.topic||"Math"],diff:p.difficulty,time:`~ ${p.minutes} min`,
    scene:()=>customScene(p),
    modeDesc:["Read the problem.","Name what you know and what you're solving for.","Draw what depends on what.","Build a model with code blocks.","Write your model as an equation, then use it.","Check your model against the problem's numbers.","Answer the question with your model."],
    doneLine:`You built a model for “${p.title}”, checked it, and used it to answer the question.`,
    talk:["Read the problem twice!","What changes, and what stays the same?","Try your model at an easy value first.","A failing check makes your model better."],
    evidence:st=>[["Checks passed",st.d.passed!=null?`${st.d.passed} / ${st.d.passedOf||"?"}`:"—"],["Answer",st.d.ans?"Written":"—"]],
    problem:st=>{const V=customVars(p,st), as=(st.d.def&&st.d.def.as)||p.assumptions.map((a,i)=>a.sug?"a"+i:null).filter(Boolean);
      const src=p.source&&p.source.asset?`<p class="ptext"><a class="srclink" href="/_blob/${esc(p.source.asset)}" target="_blank" rel="noopener">${ic("doc",2)} Open the original file${p.source.name?`: ${esc(p.source.name)}`:""}</a></p>`:"";
      const head=`<p class="lead" style="margin-top:0">${esc(p.story)}</p>${p.question?`<h3 class="ph">The question</h3><p class="ptext">${esc(p.question)}</p>`:""}`;
      if(st.step<=1) return head+`<h3 class="ph">What you'll define</h3><ul class="plist">${p.vars.map(v=>`<li><b>${esc(v.key)}</b>: ${esc(v.name||"")}${v.unit?` (${esc(v.unit)})`:""}${v.kind==="in"?". You'll slide this.":v.kind==="out"?". Your model finds this.":". Find its value in the problem."}</li>`).join("")}</ul>${src}`;
      return head+`<h3 class="ph">Variables</h3>${varTable(V)}<h3 class="ph">Your assumptions</h3><ul class="plist">${p.assumptions.filter((a,i)=>as.includes("a"+i)).map(a=>`<li>${esc(a.t)}</li>`).join("")||"<li class=muted>None picked yet.</li>"}</ul>${src}`}};
  const ASM=p.assumptions.map((a,i)=>({k:"a"+i,t:a.t,ok:a.ok,sug:a.sug,why:a.why||"That isn't something this model assumes."}));
  const asMin=Math.min(2,ASM.filter(a=>a.ok).length||0);
  m.steps=[
  (el,st,ctx)=>introStep(el,m,st,ctx),
  (el,st,ctx)=>{const d=st.d.def||(st.d.def={});
    const pars=p.vars.filter(v=>v.kind==="par"), ins=p.vars.filter(v=>v.kind==="in"), outs=p.vars.filter(v=>v.kind==="out"), CH=["var(--pink-chip)","var(--purple-chip)","#7EF0D2","var(--yellow-soft)"];
    defineShell(el,m,`${teacherNote(p.steps.define)}
      ${pars.map((v,i)=>`<div class="frow"><div class="chip" style="background:${CH[i%4]}">${ic(v.unit==="$"?"dollar":v.unit==="%"?"percent":"sigma",2.4)}</div><div class="nm">${esc(capFirst(v.name||v.key))} <span class="vk">${esc(v.key)}</span><small>A given number: find it in the problem</small></div>
        <label class="ufield inl" id="w-${i}"><input id="d-${i}" inputmode="decimal" placeholder="?" value="${esc(d["v_"+v.key]??"")}" aria-label="${esc(v.name||v.key)}${v.unit?", in "+esc(v.unit):""}">${v.unit?`<span>${esc(v.unit)}</span>`:""}</label></div>`).join("")}
      ${ins.map(v=>`<div class="frow"><div class="chip" style="background:var(--yellow-soft)">${ic("arrowRt",2.4)}</div><div class="nm">${esc(capFirst(v.name||v.key))} <span class="vk">${esc(v.key)}</span><small>An input: you'll slide it from ${esc(showV(v,v.min))} to ${esc(showV(v,v.max))}</small></div><span class="pill ink given">input</span></div>`).join("")}
      ${outs.map(v=>`<div class="frow"><div class="chip" style="background:var(--teal2)">${ic("target",2.4)}</div><div class="nm">${esc(capFirst(v.name||v.key))} <span class="vk">${esc(v.key)}</span><small>Your model will work this out</small></div><div class="ufield inl ask" title="This is what your model will find"><input value="?" readonly tabindex="-1" aria-label="Unknown">${v.unit?`<span>${esc(v.unit)}</span>`:""}</div></div>`).join("")}
      <p class="fb" id="dfb" hidden></p>
      ${ASM.length?assumptionsHTML(ASM,d):""}
      <div class="nextrow"><button class="btn next" id="dnext" disabled>Next ${ic("arrowR",2.8)}</button></div>`);
    const check=()=>{let all=true, msg="";
      pars.forEach((v,i)=>{const raw=$("#d-"+i,el).value.trim(), x=parseFloat(raw.replace(/[,$%\s]/g,"")); d["v_"+v.key]=raw; const ok=raw!==""&&Number.isFinite(x)&&Math.abs(x-v.val)<=1e-9*Math.max(1,Math.abs(v.val));
        $("#w-"+i,el).classList.toggle("ok",ok); $("#w-"+i,el).classList.toggle("bad",raw!==""&&!ok); if(!ok) all=false; if(raw!==""&&!ok&&!msg) msg=`Check ${v.key}: look for ${v.name||"it"} in the problem. Tap the problem's name on the left to read it again.`});
      const fb=$("#dfb",el); fb.textContent=msg; fb.hidden=!msg;
      if(ASM.length&&!assumptionsCheck(el,ASM,d,asMin)) all=false;
      $("#dnext",el).disabled=!S.teacher&&!all; save()};
    $$("input",el).forEach(x=>x.addEventListener("input",check)); $$("[data-as]",el).forEach(x=>x.addEventListener("change",check)); check(); $("#dnext",el).onclick=ctx.next},
  (el,st,ctx)=>diagramStep(el,m,st,ctx,dgSpecOf(m)),
  (el,st,ctx)=>{
    el.innerHTML=studioHTML({vizTitle:p.title||"Your model",vizIc:"trend",vizChip:bg});
    const d=st.d; d.mine=d.mine||[]; const prog=d.prog||(d.prog={body:[]}), ins=p.vars.filter(v=>v.kind==="in").slice(0,3);
    const view=d.view||(d.view={}); ins.forEach(v=>{if(!Number.isFinite(view[v.key])) view[v.key]=v.start});
    const model=probModel(p), pts=samplePoints(p), SC=["var(--yellow-btn)","#7EF0D2","#CFA8FA"];
    let V=customVars(p,st), R=modelRunner(V,prog), last=R.at(view);
    const sl=$("#sliders",el); sl.classList.toggle("two",ins.length===2); sl.classList.toggle("three",ins.length>2);
    sl.innerHTML=ins.map((v,i)=>rangeHTML("s"+i,`${esc(v.key)} = ${esc(showV(v,view[v.key]))}`,v.min,v.max,v.step,view[v.key],SC[i])).join("")||`<span class="muted" style="font-size:1.9rem">No inputs to slide</span>`;
    $$(".rng",sl).forEach((r,i)=>{paintRange(r); r.oninput=()=>{paintRange(r); view[ins[i].key]=+r.value; $("#s"+i+"-lab",el).textContent=`${ins[i].key} = ${showV(ins[i],view[ins[i].key])}`; save(); update()}});
    const studio=blockStudio({pal:$("#pal",el),canvas:$("#cv",el),prog,cats:["v","m","l","o","g"],hat:HAT,vars:()=>V,
      lib:cat=>stdLib(cat,V,{fn:"sqrt",sayText:"",loopNote:"Your plot already runs the model at every input value. Loops are for questions like “how many times until…?”"}),
      makeVar:makeVarFn(st,()=>V),varTip:(k,x)=>varTipHTML(k,x,last&&last.v[k]),onChange:()=>{st.runs=(st.runs||0)+1; save(); update()}});
    const MC=["#7C5CFF","#FF7A59","#10B5A0","#D9466B"];
    const nice=(lo,hi)=>{const raw=(hi-lo||1)/4, pw=Math.pow(10,Math.floor(Math.log10(raw))), q=raw/pw, s=(q<=1?1:q<=2?2:q<=2.5?2.5:q<=5?5:10)*pw, a=Math.floor(lo/s)*s, b=Math.ceil(hi/s)*s, t=[]; for(let x=a;x<=b+s*1e-9;x+=s) t.push(+x.toFixed(9)); return {lo:a,hi:b,t}};
    const update=()=>{
      V=customVars(p,st); R=modelRunner(V,prog); last=R.at(view); studio.mark(last.errs);
      const G=customChecks(p,R,model,pts), first=G.find(g=>!g.ok);
      $("#goals",el).innerHTML=teacherNote(p.steps.build)+goalsHTML(G.map(g=>g===first?g:Object.assign({},g,{fb:""}))); goalHints($("#hintzone",el),st,first); trackGoals(st,G);
      const ps=last.plots, X=ps[0]&&ps[0].x, xv=p.vars.find(v=>v.key===X&&v.kind==="in"), used=xv?ps.filter(q=>q.x===X):[];
      let html="";
      if(used.length){const n=60, xs=[]; for(let i=0;i<=n;i++) xs.push(niceNum(xv.min+(xv.max-xv.min)*i/n));
        const runs=xs.map(x=>[x,R.at(Object.assign({},view,{[X]:x}))]); let lo=0,hi=0; const series=[];
        used.forEach((q,i)=>{const pts2=runs.map(([x,e])=>[x,e.v[q.y]]).filter(r=>Number.isFinite(r[1])); pts2.forEach(r=>{lo=Math.min(lo,r[1]); hi=Math.max(hi,r[1])});
          const cur=last.v[q.y]; series.push({key:q.y,label:q.y,pts:pts2,color:MC[i%4],sw:4,dots:Number.isFinite(cur)?[[view[X],cur]]:[],marker:["circle","square","diamond","circle"][i%4]})});
        const Y=nice(lo,hi===lo?lo+1:hi), XT=nice(xv.min,xv.max);
        html=(series.length>1?`<div class="legend">${series.map(s=>`<span><i style="--k:${s.color}"></i>${esc(s.label)}</span>`).join("")}</div>`:"")+
          lineChart({w:740,h:series.length>1?372:400,x:[xv.min,xv.max],y:[Y.lo,Y.hi],xt:XT.t.filter(t=>t>=xv.min-1e-9&&t<=xv.max+1e-9),yt:Y.t,xl:esc(X+(xv.unit?` (${xv.unit})`:"")),yl:esc(used.length===1?used[0].y+(V[used[0].y]&&V[used[0].y].unit?` (${V[used[0].y].unit})`:""):"value"),
            series,zero:true,aria:"Your model's plot",hover:x=>{const xx=niceNum(Math.round(clamp(x,xv.min,xv.max)/xv.step)*xv.step), e=R.at(Object.assign({},view,{[X]:xx}));
              return {x:xx,html:`<b>${esc(X)} = ${esc(showV(xv,xx))}</b><br>`+used.map(q=>`${esc(q.y)}: ${esc(V[q.y]&&V[q.y].show?V[q.y].show(e.v[q.y]):sayText(e.v[q.y]))}`).join("<br>")}}})}
      else html=lineChart({w:740,h:400,x:[0,10],y:[0,10],xt:[0,5,10],yt:[0,5,10],series:[],aria:"Empty plot"})+`<p class="chart-empty">Add a <b>plot</b> block from <b>Graph</b> to draw your model.</p>`;
      $("#viz",el).innerHTML=html; wireHover(el);
      const errs=Object.values(last.errs), out=$("#out",el);
      const vals=Object.keys(V).filter(k=>{const x=V[k]; return (x.kind==="out"||x.kind==="mine")&&last.set.has(k)&&Number.isFinite(last.v[k])}).map(k=>{const x=V[k]; return [k,x.show?x.show(last.v[k]):sayText(last.v[k])]});
      const info={errs,said:last.out.map(sayText),vals,ins:p.vars.filter(x=>x.kind==="in").map(x=>`${x.key} = ${showV(x,view[x.key])}`)};
      if(errs.length) setOut(out,errs[0],true,info);
      else{const bits=[]; if(last.out.length) bits.push(`says “${sayText(last.out[last.out.length-1])}”`);
        vals.forEach(([k,x])=>bits.push(`${k} = ${x}`));
        setOut(out,"> "+(bits.length?bits.join("  ·  "):"build an output to see it here"),false,info)}
      $("#nextb",el).disabled=!S.teacher&&!G.every(g=>g.ok)};
    studio.draw(); update();
    $("#back",el).onclick=ctx.back; $("#nextb",el).onclick=ctx.next},
  (el,st,ctx)=>equationStep(el,m,st,ctx,autoEqSpec(p)),
  (el,st,ctx)=>{
    const V=customVars(p,st), R=modelRunner(V,st.d.prog||{body:[]}), model=probModel(p), pts=samplePoints(p);
    TIPV=k=>V[k]?varTipHTML(k,V[k]):null;
    const T=[]; p.vars.filter(v=>v.kind==="out"&&!model.errs[v.key]).forEach(v=>{const pick=[...new Set([0,Math.floor((pts.length-1)/2),pts.length-1])].map(i=>pts[i]).filter(Boolean);
      pick.forEach(pt=>{const want=model.at(pt)[v.key]; if(!Number.isFinite(want)) return; T.push({id:"t"+T.length,name:`${v.key} when ${ptText(p,pt)||"the model runs"}`,code:esc(`check ${v.key} = ${showV(v,want)}${ptText(p,pt)?` when ${ptText(p,pt)}`:""}`),
        f:()=>{const y=R.at(pt).v[v.key]; return [Number.isFinite(y)&&Math.abs(y-want)<=1e-6*Math.max(1,Math.abs(want)),y,v]}})})});
    el.innerHTML=`<div class="card tsec reveal"><div class="tsec-h"><h2>Check your model</h2><button class="btn" id="runall">${ic("playf",2)}Run all checks</button></div>
        <p class="lead">Each check asks your model a question the problem already answers.</p>${teacherNote(p.steps.test)}
        <div class="tests" data-stagger>${T.map(testCard).join("")||`<p class="muted">This problem has no checks yet.</p>`}</div><div id="tfb" style="margin-top:2.2rem"></div></div>
      <div class="ex-btns" style="margin-left:0"><button class="btn back" id="back">${ic("arrowL",2.8)}Equation</button><button class="btn submit" id="nextb" disabled>Explain ${ic("arrowR",2.8)}</button></div>`;
    const gate=()=>{$("#nextb",el).disabled=!S.teacher&&!(T.length&&st.d.passed===T.length)};
    const runAll=fresh=>{let n=0; T.forEach(t=>{const [ok,y,v]=t.f(); if(ok) n++; setTest(el,t.id,ok,`Your model says: <b>${Number.isFinite(y)?esc(showV(v,y)):"nothing yet"}</b>`)}); st.d.passed=n; st.d.passedOf=T.length; save();
      $("#tfb",el).innerHTML=n===T.length?`<div class="callout mint"><div><h4>All ${T.length} checks pass.</h4><p>Your model agrees with every value the problem gives.</p></div></div>`:
        `<div class="callout pink"><div><h4>${T.length-n} check${T.length-n>1?"s":""} failed.</h4><p>Go back to Build, fix the block that feeds that number, and run the checks again.</p></div></div>`;
      if(fresh&&n===T.length) celebrate($("#runall",el)); gate()};
    $("#runall",el).onclick=()=>runAll(true); if(st.d.passed!=null) runAll(false);
    $("#back",el).onclick=ctx.back; $("#nextb",el).onclick=ctx.next; gate()},
  (el,st,ctx)=>{
    const V=customVars(p,st), R=modelRunner(V,st.d.prog||{body:[]}), view=st.d.view||{}, e=R.at(view), outs=p.vars.filter(v=>v.kind==="out");
    const res=outs.map(v=>Number.isFinite(e.v[v.key])?`${v.key} = ${showV(v,e.v[v.key])}`:"").filter(Boolean).join(" · ")||"build your model first";
    const okAs=ASM.filter(a=>a.ok&&((st.d.def&&st.d.def.as)||[]).includes(a.k));
    explainShell(el,m,`
      <div class="result"><span class="k">Your model</span><span class="vsep"></span><span class="v ${res.length>14?"sm":""}">${esc(res)}</span></div>
      ${teacherNote(p.steps.explain)}
      <div class="erow"><span class="etag adv">Answer</span><div><p class="q">${esc(p.explain.prompt||p.question||"What does your model tell you?")}</p><textarea class="etext" id="ans" rows="2" placeholder="Use numbers from your model.">${esc(st.d.ans||"")}</textarea></div></div>
      <div class="erow"><span class="etag why">Why?</span><textarea class="etext" id="why" rows="2" placeholder="How does your model support your answer?">${esc(st.d.why||"")}</textarea></div>
      <div class="erow"><span class="etag lim">Limitations</span><div>${okAs.length?`<div style="display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:1.2rem">${okAs.map(a=>`<span class="pill easy aspill">${esc(a.t)}</span>`).join("")}</div>`:""}
        <textarea class="etext" id="lim" rows="2" placeholder="What does your model leave out? When might it be wrong?">${esc(st.d.lim||"")}</textarea></div></div>
      <p class="fb" id="xfb"></p>`);
    ["ans","why","lim"].forEach(k=>$("#"+k,el).addEventListener("input",ev=>{st.d[k]=ev.target.value; save()}));
    $("#back",el).onclick=ctx.back;
    $("#sub",el).onclick=()=>{const fb=$("#xfb",el);
      if($("#ans",el).value.trim().length<8){fb.textContent="Write your answer to the question, using a number from your model."; $("#ans",el).focus(); return}
      if($("#why",el).value.trim().length<15){fb.textContent="Add a sentence to Why? that says how your model supports your answer."; $("#why",el).focus(); return}
      fb.textContent=""; completeMission(m.id)}}];
  return m}
