/* ================= Problems teachers make: one mission player for all of them ================= */
const TOPIC_LOOK={Finance:["dollar","#B4E9FE"],Physics:["atom","#DECFFD"],Chemistry:["flask","#C1FBE1"],Biology:["leaf","#C9F5D4"],Environment:["tree","#CFF6E6"],
  Sports:["target","#FDE7A6"],Health:["star","#FDD6DA"],Technology:["code","#DDEFFC"],"Everyday life":["home","#FEF0C7"]};
const lookFor=p=>TOPIC_LOOK[p.topic]||["sigma","#E9E2FD"];
const capFirst=s=>{s=String(s||""); return s.charAt(0).toUpperCase()+s.slice(1)};
function unitShow(u){return x=>!Number.isFinite(x)?"—":u==="$"?money(x):u==="%"?fmt(x,Math.abs(x-Math.round(x))<0.05?0:1)+"%":
  x.toLocaleString("en-US",{maximumSignificantDigits:7})+(u?" "+u:"")}
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
  if(t.f==="pow"||t.f==="min"||t.f==="max") t={o:t.f==="pow"?"^":t.f,a:t.args[0],b:t.args[1]};
  if(t.f){const nm=FN_BLOCK[t.f]; if(!nm||t.args.length!==1) return false; const me=off+out.length;
    if(leaf(t.args[0])){out.push(`Drop a <b>function</b> block from Math into ${where}, choose <b>${esc(nm)}</b> in its menu, and put ${lt(t.args[0])} in its slot.`); return true}
    out.push(`Drop a <b>function</b> block from Math into ${where} and choose <b>${esc(nm)}</b> in its menu.`); return astSteps(t.args[0],`the slot of the ${esc(nm)} block from step ${me}`,out,off)}
  if(t.o==="neg"){const me=off+out.length; out.push(`Drop a <b>−</b> block from Math into ${where} and type <b>0</b> in its left slot.`); return astSteps(t.a,`the right slot of the − block from step ${me}`,out,off)}
  const sym=OPS[t.o]||t.o, me=off+out.length;
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
      if(!Number.isFinite(want)) continue;
      if(y===undefined){res={ok:false,fb:Object.keys(e.errs).length?redFix(e.errs):`<b>${esc(v.key)}</b> isn't set yet. Drag a <b>set</b> block from Variables into your program and choose <b>${esc(v.key)}</b> in its menu.`}; break}
      if(!(Number.isFinite(y)&&Math.abs(y-want)<=1e-6*Math.max(1,Math.abs(want)))){res={ok:false,fb:`When ${esc(ptText(p,pt))}, your ${esc(v.key)} = ${esc(showV(v,y))}, but the problem gives ${esc(showV(v,want))}. Set the sliders to those values and check each part of your blocks against the problem information.`}; break}}
    G.push({k:v.key,t:g.text?esc(g.text):`Build <b>${esc(v.key)}</b>: ${esc(v.name||"")}`,...res,hints:(()=>{const own=(g.hints||[]).filter(Boolean).slice(0,3).map(hintFmt), gen=genericHints(p,v,model); return own.concat(gen.slice(own.length))})()})});
  if(ins.length&&outs.length){const plots=R.at(pts[0]||{}).plots, done=G.every(g=>g.ok);
    const missing=outs.filter(o=>!plots.some(q=>q.y===o.key&&q.x===ins[0].key));
    G.push({k:"plot",t:`Plot ${outs.length>1?"your outputs":`<b>${esc(outs[0].key)}</b>`} against <b>${esc(ins[0].key)}</b>`,ok:done&&!missing.length,
      fb:done&&missing.length?`Add a <b>plot</b> block from Graph for ${missing.map(o=>esc(o.key)).join(", ")} against ${esc(ins[0].key)}.`:"",
      hints:[`Your set blocks give ${outs.map(o=>esc(o.key)).join(" and ")} for one value of ${esc(ins[0].key)}. How could you see ${outs.length>1?"them":"it"} for every ${esc(ins[0].key)} at once?`,
        `A <b>plot</b> block runs your model at every ${esc(ins[0].key)} and draws it: ${esc(outs[0].key)} goes up the side and ${esc(ins[0].key)} goes along the bottom.`,
        hsteps("Open <b>Graph</b> and drag a <b>plot</b> block to the end of your program.",`Choose <b>${esc(outs[0].key)}</b> in its first menu and <b>${esc(ins[0].key)}</b> in its second.`,...(outs.length>1?[`Add a separate plot block for each remaining output, with <b>${esc(ins[0].key)}</b> in the second menu.`]:[]),`Slide ${esc(ins[0].key)} and watch the point move along your graph.`)]})}
  return G}
function teacherNote(t){return t?`<div class="callout tnote"><span class="ci">${CIC.bulb}</span><span class="vsep"></span><div><h4>From your teacher</h4><p>${esc(t)}</p></div></div>`:""}
const storySentences=s=>s.split(/(?<=[.!?…])\s+(?=[\p{Lu}\p{Lo}])/u);

function customBrief(p){
  const sentences=storySentences((p.brief||p.story).trim().replace(/\s+/g," "));
  const selected=[];
  for(const sentence of sentences.slice(0,p.brief?3:1)){
    if(selected.join(" ").length+sentence.length>360) break;
    selected.push(sentence);
  }
  if(!selected.length&&sentences[0]) selected.push(strW(sentences[0],280)+"…");
  if(selected.length===1&&p.question&&selected[0]!==p.question&&selected[0].length+p.question.length<360) selected.push(p.question);
  return selected.join(" ")
}
function mathSymbol(key){
  const indexed=/^([A-Za-z]+)_?(\d+)$/.exec(key)||/^([A-Za-z]+)_([A-Za-z0-9]+)$/.exec(key);
  if(indexed) return indexed[1]+"_{"+indexed[2]+"}";
  return key.length===1?key:"\\mathrm{"+key.replace(/_/g,"\\_")+"}"
}
function problemMathHTML(tex,display=false){
  if(!window.katex) return '<span class="math-fallback">'+esc(tex)+'</span>';
  return window.katex.renderToString(tex,{displayMode:display,throwOnError:false,trust:false,strict:"ignore",maxExpand:200,maxSize:20,output:"htmlAndMathml"})
}
function mathText(text,vars=[],boldNumbers=false){
  const known=new Set(vars.map(v=>v.key));
  // Single dollar signs remain ordinary text so prices are never treated as delimiters.
  const tokens=/\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$/g;
  const plain=s=>s.split(/([A-Za-z][A-Za-z0-9_]*|(?<![\p{L}\p{N}_-])(?:[$€£]\s*)?[−-]?\d+(?:[.,]\d+)*(?:[eE][+-]?\d+)?%?(?![\p{L}\p{N}_]))/gu).map(part=>{
    if(known.has(part)||/^[A-Za-z]_(?:[A-Za-z]|\d+)$/.test(part)) return problemMathHTML(mathSymbol(part));
    if(boldNumbers&&/^(?:[$€£]\s*)?[−-]?\d/.test(part)) return "<strong>"+esc(part)+"</strong>";
    return esc(part)
  }).join("");
  let html="",at=0;
  for(const token of text.matchAll(tokens)){
    html+=plain(text.slice(at,token.index));
    const display=token[2]!==undefined||token[3]!==undefined;
    html+='<span class="'+(display?"problem-equation":"problem-math")+'">'+problemMathHTML(token[1]??token[2]??token[3],display)+"</span>";
    at=token.index+token[0].length
  }
  return html+plain(text.slice(at))
}
function problemCopy(story,vars){
  if(!story) return "";
  const math=[];
  const prose=story.replace(/\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$/g,token=>{
    math.push(token); return "\uE000"+(math.length-1)+"\uE001"
  });
  const sections=prose.split(/\n[ \t]*\n/).flatMap(block=>{
    const sentences=storySentences(block.trim());
    if(block.length<260||sentences.length<3) return [block];
    const paragraphs=[];
    for(let i=0;i<sentences.length;i+=2) paragraphs.push(sentences.slice(i,i+2).join(" "));
    return paragraphs
  });
  return '<div class="problem-copy">'+sections.filter(s=>s.trim()).map(s=>{
    const restored=s.replace(/\uE000(\d+)\uE001/g,(_,i)=>math[+i]);
    return '<p class="lead">'+mathText(restored.trim(),vars,true)+'</p>'
  }).join("")+"</div>"
}
function importedFacts(vars){
  const given=vars.filter(v=>v.kind==="par");
  if(!given.length) return "";
  const groups=new Map();
  for(const v of given){
    const key=v.group||v;
    if(!groups.has(key)) groups.set(key,[]);
    groups.get(key).push(v)
  }
  const quantity=v=>{
    const value=v.val.toLocaleString("en-US",{maximumSignificantDigits:21});
    return v.unit==="$"?(+v.val.toFixed(2)===v.val?money(v.val):`$${value}`):v.unit==="%"?`${value}%`:[value,v.unit].filter(Boolean).join(" ")
  };
  return `<dl class="pcards imported-facts">${[...groups].map(([group,items])=>{
    const grouped=typeof group==="string";
    return `<div class="pcard"><dt>${esc(grouped?group:capFirst(group.name||group.key))}</dt>
      ${items.map(v=>`<dd>${grouped?`<span>${esc(capFirst(v.name||v.key))}</span> `:""}${esc(quantity(v))}</dd>`).join("")}</div>`
  }).join("")}</dl>`
}
function scenarioResults(p,R){
  const cases=lessonCases(p), outs=p.vars.filter(v=>v.kind==="out");
  if(!cases.length) return "";
  const rows=cases.map(c=>({c,values:R.at(c.point).v})).filter(({values})=>outs.every(v=>Number.isFinite(values[v.key])));
  if(rows.length<2) return "";
  return `<div class="tw lesson-compare"><table class="tbl"><caption>Compare your results</caption>
    <thead><tr><th>Situation</th>${outs.map(v=>`<th>${esc(capFirst(v.name||v.key))}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(({c,values})=>`<tr><td><b>${esc(c.title||"Test situation")}</b><br><span class="muted">${esc(ptText(p,c.point))}</span></td>
      ${outs.map(v=>`<td>${esc(showV(v,values[v.key]))}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`
}
function customScene(p,interactive=true){const [icn,bg]=lookFor(p);
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
    </svg><img class="sbear${interactive?" talk":""}" src="${A(BEARS.clip)}" alt="${interactive?"ModelQuest bear":""}" data-sx=".6" data-sy=".08" style="right:5%;top:20%;width:24%">`}
function customMission(p){const id="p-"+p.id, [icn,bg]=lookFor(p);
  const m={id,custom:true,prob:p,title:p.title||"Untitled problem",icon:icn,chip:bg,introBg:bg,defBg:bg,bar:"#B9A6F5",
    brief:esc(customBrief(p)),introProblem:true,subj:[p.topic,p.area].filter(Boolean).join(", ")||"Math modeling",grade:p.grade,minutes:p.minutes,tags:[p.topic||"Math"],diff:p.difficulty,time:`~ ${p.minutes} min`,
    scene:()=>customScene(p),
    modeDesc:["Read the problem.","Name what you know and what you're solving for.","Draw what depends on what.","Build a model with code blocks.","Write your model as an equation, then use it.","Check your model against the problem's numbers.","Answer the question with your model."],
    doneLine:`You built a model for “${p.title}”, checked it, and used it to answer the question.`,
    talk:["Read the problem twice!","What changes, and what stays the same?","Try your model at an easy value first.","A failing check makes your model better."],
    evidence:st=>[["Checks passed",st.d.passed!=null?`${st.d.passed} / ${st.d.passedOf||"?"}`:"—"],["Answer",st.d.ans?"Written":"—"]],
    problem:st=>{const V=customVars(p,st), as=(st.d.def&&st.d.def.as)||p.assumptions.map((a,i)=>a.sug?"a"+i:null).filter(Boolean);
      const src=p.source&&p.source.asset?`<p class="ptext"><a class="srclink" href="/_blob/${esc(p.source.asset)}" target="_blank" rel="noopener">${ic("doc",2)} Open the original file${p.source.name?`: ${esc(p.source.name)}`:""}</a></p>`:"";
      const head=`${problemCopy(p.story,p.vars)}${importedFacts(p.vars)}${p.question?`<h3 class="ph">The question</h3><p class="ptext">${mathText(p.question,p.vars)}</p>`:""}${st.step===0?teacherNote(p.steps.understand):""}`;
      if(st.step<=1) return head+(p.vars.length?`<h3 class="ph">What you'll define</h3><ul class="plist">${p.vars.map(v=>`<li>${problemMathHTML(mathSymbol(v.key))} — ${mathText(v.name||v.key,p.vars)}${v.unit?` (${esc(v.unit)})`:""}${v.kind==="in"?". You'll slide this.":v.kind==="out"?". Your model finds this.":""}</li>`).join("")}</ul>`:"")+src;
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
    const model=probModel(p), pts=samplePoints(p).concat(lessonCases(p,model).map(c=>c.point)), SC=["var(--yellow-btn)","#7EF0D2","#CFA8FA"];
    let V=customVars(p,st), R=modelRunner(V,prog), last=R.at(view);
    const sl=$("#sliders",el); sl.classList.toggle("two",ins.length===2); sl.classList.toggle("three",ins.length>2);
    sl.innerHTML=ins.map((v,i)=>rangeHTML("s"+i,`${esc(v.key)} = ${esc(showV(v,view[v.key]))}`,v.min,v.max,v.step,view[v.key],SC[i])).join("")||`<span class="muted" style="font-size:1.9rem">No inputs to slide</span>`;
    $$(".rng",sl).forEach((r,i)=>{paintRange(r); r.oninput=()=>{paintRange(r); view[ins[i].key]=+r.value; $("#s"+i+"-lab",el).textContent=`${ins[i].key} = ${showV(ins[i],view[ins[i].key])}`; save(); update()}});
    const studio=blockStudio({pal:$("#pal",el),canvas:$("#cv",el),prog,cats:["v","m","l","o","g"],hat:HAT,vars:()=>V,
      lib:cat=>stdLib(cat,V,{fn:"sqrt",extrema:true,sayText:"",loopNote:"Your plot already runs the model at every input value. Loops are for questions like “how many times until…?”"}),
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
    const V=customVars(p,st), R=modelRunner(V,st.d.prog||{body:[]}), model=probModel(p);
    TIPV=k=>V[k]?varTipHTML(k,V[k]):null;
    const outs=p.vars.filter(v=>v.kind==="out"&&!model.errs[v.key]);
    const T=lessonCases(p,model).map(({title,prompt,point},i)=>{
      const expected=model.at(point);
      const describe=(v,value)=>`${v.key} = ${showV(v,value)}`;
      return {id:"t"+i,name:title||"Test situation "+(i+1),prompt,
        code:esc(`When ${ptText(p,point)}, expect ${outs.map(v=>describe(v,expected[v.key])).join(" · ")}`),
        f:()=>{
          const actual=R.at(point).v;
          const ok=outs.every(v=>Number.isFinite(actual[v.key])&&Math.abs(actual[v.key]-expected[v.key])<=1e-6*Math.max(1,Math.abs(expected[v.key])));
          return {ok,actual:outs.map(v=>describe(v,actual[v.key])).join(" · ")};
        }};
    });
    el.innerHTML=`<div class="card tsec reveal"><div class="tsec-h"><h2>Check your model</h2><button class="btn" id="runall">${ic("playf",2)}Run all checks</button></div>
        <p class="lead">Predict what should happen in each situation, then run the checks to compare with your blocks.</p>${teacherNote(p.steps.test)}
        <div class="tests" data-stagger>${T.map(testCard).join("")||`<p class="muted">This problem has no checks yet.</p>`}</div><div id="tfb" style="margin-top:2.2rem"></div></div>
      <div class="ex-btns" style="margin-left:0"><button class="btn back" id="back">${ic("arrowL",2.8)}Equation</button><button class="btn submit" id="nextb" disabled>Explain ${ic("arrowR",2.8)}</button></div>`;
    const gate=()=>{$("#nextb",el).disabled=!S.teacher&&!(T.length&&st.d.passed===T.length)};
    const runAll=fresh=>{let n=0; T.forEach(t=>{const {ok,actual}=t.f(); if(ok) n++; setTest(el,t.id,ok,`Your model says: <b>${esc(actual)}</b>`)}); st.d.passed=n; st.d.passedOf=T.length; save();
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
      ${scenarioResults(p,R)}
      ${teacherNote(p.steps.explain)}
      <div class="erow"><span class="etag adv">Answer</span><div><p class="q">${mathText(p.explain.prompt||p.question||"What does your model tell you?",p.vars)}</p><textarea class="etext" id="ans" rows="2" placeholder="Use numbers from your model.">${esc(st.d.ans||"")}</textarea></div></div>
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
  /* answer key (teacher mode): each task fills its answer into the step, worked out from the teacher's formulas,
     plus the teacher's own answer key when there is one */
  const base={}; p.vars.filter(v=>v.kind==="in").forEach(v=>base[v.key]=v.start);
  const KV=v=>`<b>${esc(v.key)}</b>${v.name?` <span class="akmeta">${esc(v.name)}</span>`:""}`, story=()=>ptText(p,base);
  const key=()=>(typeof Cloud!=="undefined"&&Cloud.keys&&Cloud.keys[p.id])||null;
  const outsOK=()=>{const model=probModel(p); return p.vars.filter(v=>v.kind==="out"&&!model.errs[v.key])};
  // the Build answers: a set block for each output (when its formula can be made of blocks), then the plot
  const REF=()=>{const outs=outsOK(), ins=p.vars.filter(v=>v.kind==="in"), T=outs.map(v=>{let ast=null; try{ast=parseFormula(v.formula)}catch(e){} const b=ast&&akAstBlock(ast); return {v,f:()=>b!=null?[BK.set(v.key,akAstBlock(ast))]:[],ok:b!=null}});
    if(ins.length&&outs.length) T.push({plot:true,f:()=>outs.map(o=>BK.plot(o.key,ins[0].key)),ok:true}); return T};
  const MODEL=["prog","mine","view"];
  const build=(st,upto)=>{const R=REF(); st.d.prog={body:[].concat(...R.slice(0,upto+1).map(x=>x.f()))}};
  const works=st=>{const d=st.d; if(!d.prog) return false; try{return customChecks(p,modelRunner(customVars(p,st),d.prog),probModel(p),samplePoints(p)).every(g=>g.ok)}catch(e){return false}};
  const ensure=st=>{if(!works(st)) build(st,REF().length-1)}, withModel=more=>st=>(works(st)?[]:MODEL).concat(more);
  const def=st=>st.d.def||(st.d.def={});
  // written answers in plain words, from the formulas and the story's numbers
  const sig=x=>+(+x).toPrecision(6);
  const numbers=()=>{const at=probModel(p).at(base); return outsOK().filter(v=>Number.isFinite(at[v.key])).map(v=>`${v.key} = ${showV(v,at[v.key])}`)};
  const worked=()=>{const model=probModel(p), at=model.at(base), env={}; p.vars.forEach(v=>{if(Number.isFinite(at[v.key])) env[v.key]=sig(at[v.key])});
    return outsOK().filter(v=>Number.isFinite(at[v.key])).map(v=>{try{const ast=parseFormula(v.formula), sub=astSub(ast,Object.fromEntries(Object.entries(env).filter(([k])=>k!==v.key)));
      const shown=showV(v,at[v.key]), exact=Math.abs(parseFloat(shown.replace(/[^\d.\-]/g,""))-at[v.key])<1e-9;
      return `${v.key} = ${astText(ast,true)} = ${astText(sub,true)} ${exact?"=":"≈"} ${shown}`}catch(e){return ""}}).filter(Boolean)};
  const listAnd=a=>a.length<2?a.join(""):a.slice(0,-1).join(", ")+" and "+a[a.length-1];
  m.answers={
    0:()=>{const model=probModel(p), at=model.at(base), pars=p.vars.filter(v=>v.kind==="par"), ins=p.vars.filter(v=>v.kind==="in"), outs=p.vars.filter(v=>v.kind==="out"), k=key();
      const res=outs.filter(v=>Number.isFinite(at[v.key])).map(v=>`<b>${esc(v.key)} = ${esc(showV(v,at[v.key]))}</b>`);
      return [
        {t:"What's the question?",html:akP(esc(p.question||p.explain.prompt||"No question written yet: add one in the Workspace."))},
        {t:"What do we know?",html:akKV(pars.map(v=>[KV(v),esc(showV(v,v.val))]).concat(ins.map(v=>[KV(v),`${esc(showV(v,v.start))} in the story <span class="akmeta">slides from ${esc(showV(v,v.min))} to ${esc(showV(v,v.max))}</span>`])))},
        {t:"What will the model work out?",html:akUL(outs.map(v=>`<b>${esc(v.key)}</b>${v.name?`: ${esc(v.name)}`:""}`))},
        {t:"Where the class should end up",html:((res.length?akP(res.join(" · ")+(ins.length?` when ${esc(story())}`:"")):"")+(k&&k.solution&&k.solution.answer?akLab("From your answer key")+akP(esc(k.solution.answer)):""))||akP("Finish the formulas in the Workspace to see the model's answer here.")}]},
    1:()=>{const pars=p.vars.filter(v=>v.kind==="par"), T=[];
      if(pars.length) T.push({t:"The given numbers",keys:["def"],target:"#w-0",apply:st=>{const d=def(st); pars.forEach(v=>d["v_"+v.key]=String(v.val))},note:"Inputs and outputs have nothing to type: students slide the inputs, and the model works out the outputs."});
      if(ASM.length) T.push({t:"Assumptions",keys:["def"],target:".dcard .callout.asm",apply:st=>{def(st).as=ASM.filter(a=>a.ok).map(a=>a.k)},note:"Ticked: every assumption the model makes. Left unticked: the ones it doesn't."});
      return T},
    3:()=>{const model=probModel(p), at=model.at(base), ins=p.vars.filter(v=>v.kind==="in");
      return REF().map((x,i)=>x.plot?{t:`Plot ${x.f().length>1?"your outputs":`<b>${esc(x.f()[0].f.y)}</b>`} against <b>${esc(ins[0].key)}</b>`,keys:MODEL,target:".studio .gpanel",apply:st=>build(st,i),note:"One plot block is enough to pass; plotting every output shows more."}:
        {t:(p.goals.find(g=>g.out===x.v.key)||{}).text?esc(p.goals.find(g=>g.out===x.v.key).text):`Build <b>${esc(x.v.key)}</b>${x.v.name?`: ${esc(x.v.name)}`:""}`,keys:MODEL,target:"#cv",apply:st=>build(st,i),
          note:x.ok?(Number.isFinite(at[x.v.key])?`Check: when ${esc(story())||"the model runs"}, the console says ${esc(x.v.key)} = ${esc(showV(x.v,at[x.v.key]))}.`:""):`This formula uses something the blocks can't do, so build it by hand: ${esc(x.v.key)} = ${esc(x.v.formula)}.`})},
    5:()=>[{t:"Run all checks",keys:withModel(["passed"]),target:".tests",apply:st=>{ensure(st); st.d.passed=0},note:"Every check compares the model with the problem's own numbers."}],
    6:()=>{const k=key(), nums=numbers(), work=worked(), okA=ASM.filter(a=>a.ok).map(a=>a.t.replace(/\.\s*$/,""));
      return [
        {t:"Answer the question",keys:withModel(["ans"]),target:"#ans",apply:st=>{ensure(st); st.d.ans=k&&k.explainAnswer?k.explainAnswer:`${p.vars.some(v=>v.kind==="in")?`When ${story()}, `:""}the model gives ${listAnd(nums)||"no numbers yet"}.`},
          note:k&&k.explainAnswer?"This is the model answer from your answer key.":"Made from the model's numbers. Add a model answer to the problem's answer key in the Workspace to use your own."},
        {t:"Why?",keys:["why"],target:"#why",apply:st=>{st.d.why=work.length?work.join(". ")+".":"The model works each output out from the problem's numbers."},note:"A sample answer: where each number comes from."},
        {t:"Limitations",keys:["lim"],target:"#lim",apply:st=>{st.d.lim=okA.length?`The model assumes: ${okA.join("; ")}. If one of these doesn't hold, the answer could change.`:"Every model leaves things out. Say one thing this one leaves out, and how it could change the answer."},note:"A sample answer, from the assumptions the model makes."}]}};
  return m}
