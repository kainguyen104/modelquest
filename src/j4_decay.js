/* ================= Mission 2 · The Decay Mystery ================= */
(()=>{
const TN=t=>100*Math.pow(0.5,t/5730);
const TAGE=f=>5730*Math.log(f/100)/Math.log(0.5);
const LOGB={e:Math.log,"10":Math.log10,"2":Math.log2};
const TS=[0,5730,11460,17190,2000], FS=[41,25,60,10];
const fmtP=x=>fmt(x,Math.abs(x-Math.round(x))<0.05?0:1)+"%";
const MINE_COL=["#D9466B","#2E86DE","#B07C00","#10B5A0"];
function VARS(st){const t=st.d.tasks||{}, V={};
  V.t={kind:"in",label:"t",name:"years since the tree died",unit:"years",show:x=>fmt(x)+" years"};
  if(t.lab) V.f={kind:"in",label:"f",name:"percent of its carbon-14 a sample still has",unit:"%",show:x=>fmt(x,x%1?1:0)+"%"};
  V.N0={kind:"par",label:"N₀",name:"carbon-14 in the living tree, as a percent",unit:"%",val:100,show:x=>fmt(x)+"%",src:"the lab notes"};
  V.H={kind:"par",label:"H",name:"half-life of carbon-14",unit:"years",val:5730,show:x=>fmt(x)+" years",src:"the lab notes"};
  V.N={kind:"out",label:"N",name:"percent of carbon-14 left after t years",unit:"%",show:fmtP};
  if(t.lab) V.age={kind:"out",label:"age",name:"years since the tree died, worked out from f",unit:"years",show:x=>fmt(x)+" years"};
  (st.d.mine||[]).forEach(k=>V[k]={kind:"mine",label:k,name:"a variable you made",unit:""});
  return V}
const hasLoop=prog=>{let y=false; eachNode(prog.body,n=>{if(n.type==="repeat"||n.type==="until") y=true}); return y};
function checks(st,R,prog){const t=st.d.tasks||{}, G=[];
  const lin=x=>100-50*x/5730; let N={ok:true};
  for(const tt of TS){const e=R.at({t:tt,f:50}), y=e.v.N;
    if(y===undefined){N={ok:false,fb:Object.keys(e.errs).length?redFix(e.errs):"<b>N</b> isn't set yet. Drag a <b>set</b> block from Variables into your program and choose <b>N</b> in its menu."}; break}
    if(!near(y,TN(tt),0.01)){const isLin=TS.every(x=>near(R.at({t:x,f:50}).v.N,lin(x),0.01));
      N={ok:false,fb:isLin?"Your N goes down by the same amount every half-life, so it's a straight line. Carbon-14 loses half of <i>what's left</i> each half-life.":
        tt===0?`At t = 0 nothing has decayed yet, so N should be 100%. Your N = ${fmtP(y)}.`:
        `At t = ${fmt(tt)} years your N = ${fmtP(y)}. That's ${fmt(tt/5730,tt%5730?2:0)} half-lives, so about ${fmtP(TN(tt))} should be left.`}; break}}
  G.push({k:"N",t:"Build <b>N</b>: the percent of carbon-14 left after <b>t</b> years",...N,hints:[
    "Start from what you know. At t = 0 nothing has decayed, so N = 100%. After one half-life (t = 5,730 years) half is left: 50%. After two (t = 11,460): 25%. Does N drop by the same <i>amount</i> each half-life, or by the same <i>fraction</i>?",
    "Each half-life multiplies what's left by 0.5. In t years, t ÷ H half-lives pass, so you multiply by 0.5 that many times. Multiplying again and again is a power: N = N₀ × 0.5 ^ (t ÷ H).",
    hsteps("From <b>Variables</b>, drag a <b>set</b> block into your program and choose <b>N</b>.","From <b>Math</b>, drop a <b>×</b> block into its slot, and drag <b>N₀</b> into the left slot of the ×.","Drop a <b>^</b> block into the right slot of the ×, and type <b>0.5</b> in its left slot.","Drop a <b>÷</b> block into the right slot of the ^, and fill it with <b>t</b> and <b>H</b>. It should read: set N to N₀ × 0.5 ^ (t ÷ H).","Check: slide t to 5,730. The console should say N = 50%.")]});
  const plots=R.at({t:5730,f:50}).plots;
  G.push({k:"plot",t:"Plot <b>N</b> against <b>t</b>",ok:N.ok&&plots.some(p=>p.y==="N"&&p.x==="t"),fb:N.ok?"Add a <b>plot</b> block from Graph and choose N against t.":"",hints:[
    "Your set block gives N for one value of t. How could you see N for every t from 0 to 22,920 years at once?",
    "A <b>plot</b> block runs your model at every t and draws the curve: N goes up the side, t goes along the bottom.",
    hsteps("Open <b>Graph</b> and drag a <b>plot</b> block under your set block.","Choose <b>N</b> in its first menu and <b>t</b> in its second.","Slide t and watch the point move along your curve.")]});
  if(t.lab){let A={ok:true};
    for(const f of FS){const e=R.at({t:0,f}), a=e.v.age;
      if(a===undefined){A={ok:false,fb:Object.keys(e.errs).length?redFix(e.errs):"<b>age</b> isn't set yet. Drag a <b>set</b> block from Variables into your program and choose <b>age</b> in its menu."}; break}
      if(!(Math.abs(a-TAGE(f))<=10)){const back=R.at({t:a,f}).v.N;
        A={ok:false,fb:`When f = ${f}%, your age = ${fmt(a)} years. Check it: your N model says ${Number.isFinite(back)?fmtP(back):"?"} is left after ${fmt(a)} years, not ${f}%.`}; break}}
    G.push({k:"age",t:"Build <b>age</b>: how many years ago the tree died, when <b>f</b>% is left",tag:"new task",isNew:true,...A,hints:[
      "25% left is exactly two half-lives, so that tree died 2 × 5,730 = 11,460 years ago. But 41% is between one half-life (50%) and two (25%). How could you find the exact number of half-lives for any percent f?",
      "Your N model says f = N₀ × 0.5 ^ (number of half-lives). A logarithm brings the number of half-lives down out of the power: half-lives = ln(f ÷ N₀) ÷ ln(0.5). Then age = H × half-lives.",
      hsteps("Drag a <b>set</b> block from Variables and choose <b>age</b>.","Drop a <b>×</b> block into it, and drag <b>H</b> into the left slot of the ×.","Drop a <b>÷</b> block into the right slot of the ×.","In the ÷ block's left slot, drop a <b>function</b> block from Math (it shows ln), and put <b>f ÷ N₀</b> inside it.","In the ÷ block's right slot, drop another ln function block and type <b>0.5</b> in it. It should read: set age to H × (ln(f ÷ N₀) ÷ ln(0.5)).","Check: slide f to 25%. The console should say age = 11,460 years.")]})}
  if(t.museum){const e=R.at({t:0,f:50}); let ok=false, fb="";
    const says=[]; eachNode(prog.body,n=>{if(n.type==="say") says.push(n)});
    if(!hasLoop(prog)) fb="Use a loop from <b>Loops</b>: keep halving and counting until less than 1% is left.";
    else if(Object.keys(e.errs).length) fb=redFix(e.errs);
    else if(!e.out.length) fb=says.length?"Your say block never ran. Is it stuck inside a loop or an if that doesn't happen?":"Nothing is said yet. Add a <b>say</b> block from Graph after your loop.";
    else{const x=e.out[e.out.length-1], k=typeof x==="number"?x:Number(String(x).replace(/[^\d.-]/g,""));
      if(!says.some(n=>isNode(n.a.x))) fb="Let your model work it out: put a variable in the say block, not a typed number.";
      else if(!Number.isFinite(k)) fb=`Your program says “${esc(sayText(x))}”. Say the number of half-lives.`;
      else if(Math.abs(k-Math.round(k))>1e-9) fb=`Your program says ${sayText(k)}. The museum wants whole half-lives: after how many complete half-lives is less than 1% left?`;
      else if(k===7) ok=true;
      else fb=`Your program says ${k}. After ${k} half-li${k===1?"fe":"ves"}, ${fmt(100*Math.pow(.5,k),k>5?3:2)}% is left. Is that under 1%? Was the half-life before it still at 1% or more?`}
    G.push({k:"loop",t:"Use a <b>loop</b> to find how many half-lives until less than 1% is left, and <b>say</b> it",tag:"new task",isNew:true,ok,fb,hints:[
      "Halve again and again: 100% → 50% → 25% → 12.5% → … How many halvings until less than 1% is left? A loop can do the halving and the counting for you.",
      "You need two variables of your own: <b>left</b> (how much is left) and <b>k</b> (how many halvings so far). Start left at N₀ and k at 0. Each time round the loop, halve left and add 1 to k. Stop as soon as left &lt; 1.",
      hsteps("In <b>Variables</b>, type <b>left</b> in the “new variable” box and press <b>Make</b>. Do the same for <b>k</b>.","Add <b>set left to N₀</b>, then <b>set k to 0</b>.","From <b>Loops</b>, add <b>repeat until</b>. From <b>Logic</b>, drop a <b>&lt;</b> block into its pointy slot.","Drag the <b>left</b> block from Variables into the left slot of the &lt;, and type <b>1</b> in the right slot. Typing the word “left” won't work: it has to be the block.","Inside the loop, add <b>set left to left × 0.5</b>, then <b>change k by 1</b>.","Below the loop (not inside it), add a <b>say</b> block from Graph and drag the <b>k</b> block into it.","Check: the console should say “7”.")]})}
  return G}

const CHIP_FLASK=`<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M17 7h14M19.5 7v12.5L9.6 36.8a4.6 4.6 0 0 0 4 6.9h20.8a4.6 4.6 0 0 0 4-6.9L28.5 19.5V7" fill="#fff" stroke="${INK}" stroke-width="3.3" stroke-linejoin="round" stroke-linecap="round"/><path d="M14.3 30.5h19.4l3.1 5.8a3.6 3.6 0 0 1-3.2 5.3H14.4a3.6 3.6 0 0 1-3.2-5.3z" fill="#9FD8FA"/><path d="M19.5 7v12.5L9.6 36.8a4.6 4.6 0 0 0 4 6.9h20.8a4.6 4.6 0 0 0 4-6.9L28.5 19.5V7" fill="none" stroke="${INK}" stroke-width="3.3" stroke-linejoin="round"/><circle cx="22" cy="36" r="1.9" fill="#fff"/><circle cx="27" cy="33.5" r="1.3" fill="#fff"/></svg>`;
const CHIP_PILLAR=`<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M9 14c-3.6 0-6 2.4-6 5.4S5.4 25 9 25h46c3.6 0 6-2.6 6-5.6S58.6 14 55 14z" fill="#FDDB5E" stroke="${INK}" stroke-width="3.6" stroke-linejoin="round"/><circle cx="10" cy="19.6" r="2.6" fill="none" stroke="${INK}" stroke-width="2.6"/><circle cx="54" cy="19.6" r="2.6" fill="none" stroke="${INK}" stroke-width="2.6"/><path d="M14 25h36v26H14z" fill="#FDDB5E" stroke="${INK}" stroke-width="3.6" stroke-linejoin="round"/><path d="M23 29v18M32 29v18M41 29v18" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/><path d="M9 51h46v6H9z" fill="#FDDB5E" stroke="${INK}" stroke-width="3.6" stroke-linejoin="round"/></svg>`;
const ASM=[{k:"half",t:"Carbon-14 halves every 5,730 years, no matter how much is left",ok:true,sug:true},
  {k:"start",t:"The living tree had the same share of carbon-14 as living things today",ok:true},
  {k:"clean",t:"Nothing added carbon to the wood or took it away after the tree died",ok:true},
  {k:"lin",t:"The wood loses the same amount of carbon-14 every year",ok:false,why:"That would make a straight line. Decay takes away half of what is left each half-life, so the amount lost keeps shrinking."},
  {k:"temp",t:"Warm weather makes carbon-14 decay faster",ok:false,why:"Radioactive decay doesn't depend on temperature. Your model uses one half-life for everything."}];

/* ---- Equation step: the decay law as an equation, why it's a power, then solve it with logs ---- */
const EQ={
  intro:"Your blocks model the decay. Now write the same model as an equation, the way it appears in a chemistry or math book, and use it to date the second sample by hand.",
  SY:{N:{name:"Percent of carbon-14 left after t years",unit:"%",role:"out"},
    N0:{b:"N",s:"0",lab:"N₀",name:"Carbon-14 in the living tree, where it starts",unit:"%",role:"par",val:100,show:"100%"},
    t:{name:"Years since the tree died",unit:"years",role:"in",range:[0,22920],story:11460},
    H:{name:"Half-life of carbon-14",unit:"years",role:"par",val:5730,show:"5,730 years"}},
  syms:["N","N0","t","H"],
  tiles:["N","N0","t","H","0.5","2","=","+","-","*","/","^","(",")"],
  eqs:[{out:"N",f:"N0*0.5^(t/H)",
    mistakes:[{f:"N0*0.5^t/H",fb:"Only {{t}} made it into the exponent, and then everything is divided by {{H}}. Put brackets around {{t/H}} so the whole number of half-lives is the exponent."},
      {f:"N0*0.5*(t/H)",fb:"That multiplies by 0.5 once, then by the number of half-lives. Halving again and again is a power: use ^."},
      {f:"N0*(t/H)^0.5",fb:"The base and the exponent swapped places: it's 0.5 that is raised to the number of half-lives."},
      {f:"N0*0.5^(H/t)",fb:"The exponent should count half-lives: years ÷ years per half-life, so {{t/H}}, not {{H/t}}."},
      {f:"N0*0.5^t",fb:"That halves every single year. It should halve once per half-life, so the exponent is {{t/H}}."},
      {f:"N0 - N0*0.5*t/H",fb:"That's the straight-line model from the bug hunt: it reaches 0% at two half-lives. Carbon-14 loses half of what's left each time, which is a power."},
      {f:"0.5^(t/H)",fb:"That's the fraction left. Multiply by {{N0}} to make it a percent of what the tree started with."}],
    hints:["Start with {{N}} and =. Then ask: how much carbon-14 was there at the start, and what happens to it every half-life?","After {{t/H}} half-lives, what's left has been multiplied by 0.5 that many times: {{N0}} times 0.5 to the power {{t/H}}."],
    after:"Books also write it {{N = N0*(1/2)^(t/H)}}. It's the same equation."}],
  why:[
    {id:"count",q:"What does {{t/H}} count?",opts:[
      {h:"How many years have passed",fb:"That's {{t}} on its own."},
      {h:"How many half-lives have passed",ok:true,why:"{{t}} is in years and {{H}} is years per half-life, so {{t/H}} is a number of half-lives. At {{t = 11460}} it's 2."},
      {h:"How much carbon-14 is left",fb:"That's {{N}}, the left side of the equation."}]},
    {id:"power",q:"Why is {{t/H}} an exponent instead of a number you multiply by?",opts:[
      {h:"Each half-life multiplies what's left by 0.5 again, and multiplying again and again is a power",ok:true,why:"Two half-lives: {{100*0.5*0.5 = 100*0.5^2 = 25}}. Three: {{100*0.5^3 = 12.5}}."},
      {h:"Because the same amount of carbon-14 is lost every half-life",fb:"That's the straight-line idea that gave −50% in the bug hunt. Half of what's left is lost each time, so the amount lost keeps shrinking."},
      {h:"Because time always goes in the exponent",fb:"It doesn't always. Here it does because every half-life multiplies by 0.5."}]},
    {id:"half",q:"What does the equation give when {{t = H}}?",opts:[
      {h:"{{N = 0}}",fb:"{{0.5^1}} is 0.5, not 0."},
      {h:"{{N = N0 - 0.5}}",fb:"The 0.5 multiplies {{N0}}. It isn't subtracted."},
      {h:"{{N = N0/2}}: half is left",ok:true,why:"{{t/H = 1}}, so {{N = N0*0.5^1}}, which is 50%. That's exactly what half-life means."}]}],
  solve:{title:"how old is the second sample?",intro:"The second sample still has 41% of its carbon-14. Solve your equation for {{t}}: pick each move, and the next line appears when it's right.",
    start:"N = N0*0.5^(t/H)",startNote:"your equation",
    steps:[
      {q:"Put in what you know: 41% left, starting from 100%, half-life 5,730 years.",opts:[
        {h:"{{41 = 100*0.5^(t/5730)}}",ok:true,to:"41 = 100*0.5^(t/5730)",note:"N = 41, N₀ = 100, H = 5730"},
        {h:"{{100 = 41*0.5^(t/5730)}}",fb:"{{N}} is what's left now, 41%. {{N0}} is the start, 100%."},
        {h:"{{41 = 100*0.5^(5730/t)}}",fb:"The exponent is {{t/H}}: the years divided by the half-life."}]},
      {q:"What's the next move?",opts:[
        {h:"Subtract 100 from both sides",fb:"100 multiplies the power, so undo it by dividing."},
        {h:"Divide both sides by 100",ok:true,to:"0.41 = 0.5^(t/5730)",note:"÷100 on both sides"},
        {h:"Take the square root of both sides",fb:"The exponent is {{t/5730}}, not 2, so a square root won't free {{t}}."}]},
      {q:"{{t}} is stuck in an exponent. What gets it out?",opts:[
        {h:"Divide both sides by 0.5",fb:"0.5 is raised to a power, not multiplied, so dividing by 0.5 won't free the exponent."},
        {h:"Multiply both sides by 5730",fb:"{{t/5730}} is up in the exponent. Bring it down first."},
        {h:"Take the natural log (ln) of both sides",ok:true,to:"ln(0.41) = ln(0.5^(t/5730))",note:"ln of both sides"}]},
      {q:"Use a log rule. Which line comes next?",opts:[
        {h:"{{ln(0.41) = (t/5730)*ln(0.5)}}",ok:true,to:"ln(0.41) = (t/5730)*ln(0.5)",note:"power rule: ln(aᵇ) = b · ln a"},
        {h:"{{ln(0.41) = ln(0.5) + t/5730}}",fb:"Adding logs is the rule for {{ln(a*b)}}. For a power, the exponent comes down and multiplies."},
        {h:"{{ln(0.41) = ln(t/5730)}}",fb:"The 0.5 can't just disappear. The power rule brings the exponent down: {{ln(a^b) = b*ln(a)}}."}]},
      {q:"Next move?",opts:[
        {h:"Subtract {{ln(0.5)}} from both sides",fb:"{{ln(0.5)}} multiplies {{t/5730}}. Undo multiplying by dividing."},
        {h:"Divide both sides by {{ln(0.5)}}",ok:true,to:"ln(0.41)/ln(0.5) = t/5730",note:"÷ ln 0.5 on both sides"},
        {h:"Divide both sides by {{ln(0.41)}}",fb:"That doesn't get {{t}} alone. Divide by what multiplies the {{t}} part: {{ln(0.5)}}."}]},
      {q:"Last move?",opts:[
        {h:"Divide both sides by 5730",fb:"{{t}} is divided by 5730, so multiply to undo it."},
        {h:"Add 5730 to both sides",fb:"{{t}} is divided by 5730, not added to it."},
        {h:"Multiply both sides by 5730",ok:true,to:"t = 5730*ln(0.41)/ln(0.5)",note:"×5730 on both sides"}]}],
    final:{q:"Work it out. A calculator gives {{ln(0.41)/ln(0.5)}} ≈ 1.2863. So:",inputs:[{pre:"{{t}} ≈",ans:7370.5,tol:15,post:"years"}],
      ok:"That's 1.29 half-lives: between one (50% left) and two (25% left), just as 41% is between 50% and 25%.",fb:"Not yet. Multiply 5,730 by about 1.2863."},
    interp:{id:"interp",q:"Your age block in Build does this for any sample. Which equation is it?",opts:[
      {h:"{{age = H*0.5^(f/N0)}}",fb:"That's the shape of the forward model. To get the time out of the exponent, you need logs."},
      {h:"{{age = (f/N0)*H}}",fb:"That's a straight-line guess. With 25% left it gives 1,432 years, but the answer is 11,460."},
      {h:"{{age = H*ln(f/N0)/ln(0.5)}}",ok:true,why:"It's this solution with 41 replaced by {{f}}, 100 by {{N0}} and 5,730 by {{H}}, so it works for any sample."}]}}};
/* ---- Diagram step: carbon-14 is a stock that drains through one flow, like the book's radioactive-decay and aspirin models ---- */
const DG={
  intro:"Before you code, draw your model the way modelers do: as a <b>stock-and-flow diagram</b>. It shows what builds up or drains away, what makes it change, and what depends on what. Get the diagram right and the code almost writes itself.",
  clock:{k:"t",name:"years since the tree died"},
  SY:EQ.SY,
  nodes:[
    {id:"N",t:"stock",lab:"N",name:"carbon-14 left",desc:"Carbon-14 left in the wood, as a percent of what the living tree had",unit:"%",start:"N₀ = 100%",startBy:"N0"},
    {id:"decay",t:"flow",lab:"decay",name:"lost each year",desc:"Carbon-14 that decays in one year",unit:"% per year"},
    {id:"k",t:"conv",lab:"k",name:"decay constant",desc:"The fraction of what's left that decays each year, about 0.000121",unit:"per year"},
    {id:"H",t:"conv",lab:"H",name:"half-life",desc:"Half-life of carbon-14: 5,730 years",unit:""}],
  sortFb:{
    N:{flow:"N is an amount, measured in %, not a rate in % per year. It's how much carbon-14 is in the wood at one moment.",conv:"N doesn't stay the same, and it isn't worked out fresh each year: next year's N is this year's N minus what decayed. Something that carries over and drains like that is a stock."},
    decay:{stock:"Look at the unit: % per year is a rate. decay is how fast N drains, so it's a flow.",conv:"decay is worked out from other quantities, but it's also what carries carbon-14 out of N. A rate that drains a stock is a flow."},
    k:{stock:"k never builds up or drains: it's the same every year. A constant is a converter.",flow:"k is a fraction, not carbon-14 moving anywhere. It's used to work out the flow, so it's a converter."},
    H:{stock:"The half-life never builds up or drains: carbon-14's is always 5,730 years. A constant is a converter.",flow:"H is a length of time, not a rate that moves carbon-14. It's a converter."}},
  sortWhy:{N:"Stock: it drains as carbon-14 decays.",decay:"Flow: the rate N drains at.",k:"Converter: a constant fraction.",H:"Converter: a constant length of time."},
  extras:[{id:"t",lab:"t",desc:"Years since the tree died",unit:"years",to:"clock",why:"<b>t</b> is the clock. It isn't drawn as a shape: each tick of t, every flow moves its stuff once.",fb:"<b>t</b> is the clock that runs the diagram, so it doesn't get a shape. Drop it on the clock above the diagram."},
    {id:"N0",lab:"N₀",desc:"Carbon-14 in the living tree, where the wood starts",unit:"%",to:"N",why:"<b>N₀ = 100%</b> is where the stock N starts, so it's written inside N's box.",fb:"<b>N₀</b> is a single starting number, not a quantity that changes. Drop it in the “starts at” space inside the box it starts."}],
  notDrawn:"Two quantities aren't shapes. <b>t</b> is the clock that runs the diagram. <b>N₀ = 100%</b> is written inside the <b>N</b> box: it's where the stock starts.",
  pipes:[{f:"decay",a:"N",b:"cloud",q:"Where does <b>decay</b> take carbon-14 from, and where does it go?",opts:[
    {h:"Into N, from outside the model",fb:"That would add carbon-14 to the wood every year. After the tree dies, nothing adds carbon-14: decay only takes it away."},
    {h:"Out of N, to outside the model",ok:true,why:"Carbon-14 that decays turns into nitrogen, which this model doesn't track. So it drains into the spiral: outside the model."},
    {h:"Out of N, and back into N",fb:"Then N would never change. Carbon-14 that decays is gone for good."}]}],
  links:[{a:"N",b:"decay"},{a:"k",b:"decay"},{a:"H",b:"k"}],
  linkFb:{"H>decay":"decay uses the half-life only through k. Point H at k, and k at decay.",
    "!N>decay":"The more carbon-14 is left, the more of it decays each year. Which quantity tells decay how much is left?",
    "!k>decay":"decay is a fixed fraction of what's left. Which converter is that fraction?",
    "!H>k":"k comes from the half-life: k = ln 2 ÷ H, about 0.000121. Which quantity is k worked out from?",
    "N>k":"k is the same every year, however much is left, so it doesn't use N.",
    "decay>k":"k is worked out from the half-life alone. decay uses k, not the other way round."},
  linkWhy:{decay:"decay = k × N: a fixed fraction of what's left.",k:"k = ln 2 ÷ H, about 0.000121 per year."},
  why:[
    {id:"loop",at:"N>decay",q:"The connector from N to decay says decay depends on how much is left. As N shrinks, what happens to decay?",opts:[
      {h:"It stays the same every year",fb:"That would be true with no connector from N. Then N would drop by the same amount every year: a straight line."},
      {h:"It shrinks too, so N drains more and more slowly",ok:true,why:"That's why the curve flattens out instead of hitting 0. When a stock feeds its own outflow like this, it decays exponentially."},
      {h:"It grows",fb:"decay = k × N, so a smaller N gives a smaller decay."}]},
    {id:"start",at:"start:N",q:"Where is N₀ = 100% in the diagram?",opts:[
      {h:"It's a flow into N",fb:"Nothing flows into the wood after the tree dies. N₀ is only where N starts."},
      {h:"It's a converter that points at decay",fb:"decay uses what's left now, N, not what there was at the start."},
      {h:"Written in the N box: it's the value the stock starts at",ok:true,why:"Every stock needs a starting value. Modeling software asks for it as soon as you draw the box."}]},
    {id:"clock",at:"clock",q:"Why isn't t drawn as a shape in the diagram?",opts:[
      {h:"t is the clock: the diagram says what happens in one tick, and the model repeats it tick after tick",ok:true,why:"Modeling software moves the clock forward and updates every stock each tick. Here a tick could be one year."},
      {h:"t doesn't change N",fb:"t matters a lot: the more time passes, the less carbon-14 is left. It's the clock that runs the whole diagram."},
      {h:"t is a stock that fills up",fb:"t isn't part of the wood or the carbon-14. It's the clock everything is measured against."}]},
    {id:"code",at:"N>decay",q:"Suppose you deleted the connector from N to decay, so the same amount decays every year. What would the model say?",opts:[
      {h:"Nothing changes",fb:"Without that connector, decay doesn't know how much is left, so it can't shrink as N shrinks."},
      {h:"N stops decaying",fb:"decay still has k, so carbon-14 still drains. It just drains by the same amount every year."},
      {h:"N drops by the same amount every year: a straight line that hits 0",ok:true,why:"That's the assumption you turned down in Define. The N → decay connector is what makes N halve every 5,730 years."}]}],
  toCode:"In Build you'll skip the year-by-year ticking and use what this diagram adds up to: {{N = N0*0.5^(t/H)}}. N starts at N₀, and because decay depends on N, the stock halves every H years.",
  hints:{sort:["Ask about each quantity: does it build up or drain over time? Is it a rate, an amount per year? Or is it a constant?","Units help. N is in %: an amount. decay is in % per year: a rate. k and H never change.",hsteps("N goes in the box: it's a stock that drains as carbon-14 decays.","decay goes in the valve: it's the rate N drains at.","k and H go in the circles: they're constants.","t goes on the clock, and N₀ goes in the “starts at” space inside N's box.")],
    pipes:["Follow the carbon-14. Where is it before it decays, and where does it go after?","Decayed carbon-14 becomes nitrogen, which the model doesn't track. Leaving the model means draining into the spiral.","Pick “Out of N, to outside the model”."],
    links:["Pick a flow or converter and ask: what would I need to know to work it out? Each answer is a connector into it.","decay is a fixed fraction, k, of what's left, N. And k comes from the half-life: k = ln 2 ÷ H.",hsteps("Drag from N to decay.","Drag from k to decay.","Drag from H to k.")]},
  L:{wide:{vb:[1000,470],pos:{N:[235,195],decay:[565,195],k:[600,365],H:[835,365]},cl:{decay:[862,195]},bend:{"N>decay":.38,"k>decay":.15,"H>k":.2}},
    tall:{tall:true,vb:[520,860],pos:{N:[175,160],decay:[175,430],k:[395,560],H:[395,760]},cl:{decay:[175,690]},lp:{decay:"l"},bend:{"N>decay":-.35,"k>decay":.15,"H>k":.2}}}};
MISSIONS.decay={
  id:"decay",title:"The Decay Mystery",art:"decay",icon:"flask",chip:"var(--pink)",bar:"#FDDF4D",
  chipIcon:CHIP_FLASK, introChip:CHIP_PILLAR, defIcon:CIC.flaskGreen,
  tagline:"A wooden artifact has lost most of its carbon-14. Build an exponential model, then run it backwards to date the wood.",
  blurb:"Date a wooden artifact by modeling how carbon-14 decays over time.", short:"Date an artifact with carbon-14.",
  brief:"A wooden artifact contains 25% of its original carbon-14, and you will build a model to estimate its age.",
  tags:["Chemistry","Math"],diff:"Medium",time:"~ 45 min",minutes:45,subj:"Chemistry, Math",grade:"High School",
  scene:()=>img("scene-decay.webp"),
  modeDesc:["Meet the artifact.","Decide what you know and what you're solving for.","Draw carbon-14 as a stock that drains away.","Build a model to simulate Carbon-14 decay over time.","Write the decay as an equation, then solve it with logs.","Check the model at values you can work out by hand.","Date the artifact and say how far to trust it."],
  doneLine:"You built an exponential model, caught a model that was right only once, and ran your model backwards with logarithms to date the wood.",
  talk:["Half of what's left, not half of what you started with!","Every 5,730 years, half the carbon-14 is gone.","Logs turn a power back into a plain number.","25% left? That's two halvings."],
  problem:st=>{const V=VARS(st), t=st.d.tasks||{}, as=(st.d.def&&st.d.def.as)||ASM.filter(a=>a.sug).map(a=>a.k);
    if(st.step<=1) return `<p class="lead" style="margin-top:0">Archaeologists found a carved wooden artifact. While a tree is alive it keeps taking in carbon-14. When it dies, the carbon-14 in its wood slowly decays. A lab tested the artifact's wood: it has <b>25%</b> of the carbon-14 it had when the tree died.</p>
      <div class="pcards"><div class="pcard" style="--k:#C1FBE1"><b>When the tree died</b><span>all of its carbon-14</span></div><div class="pcard" style="--k:#DECFFD"><b>Half-life</b><span>5,730 years: half of what's</span><span>left decays every 5,730 years</span></div><div class="pcard" style="--k:#FDE7A6"><b>The artifact today</b><span>25% of its carbon-14 left</span></div></div>
      <h3 class="ph">The question</h3><p class="ptext">How many years ago did the tree die?</p>
      <h3 class="ph">What you'll define</h3><ul class="plist"><li><b>N₀</b>: how much carbon-14 there was at the start. Measure every amount as a percent of what the tree had when it died.</li><li><b>H</b>: the half-life, in years.</li><li><b>t</b>: the years since the tree died. This is what your model will find.</li></ul>`;
    return `<p class="lead" style="margin-top:0">A wooden artifact still has <b>25%</b> of the carbon-14 that a living tree has. Carbon-14 has a half-life of <b>5,730 years</b>: every 5,730 years, half of whatever is left decays.${t.lab?" A second sample from the same site has <b>41%</b> left.":""}</p>
      <div class="pcards"><div class="pcard" style="--k:#C1FBE1"><b>Living tree</b><span>100% of its carbon-14</span></div><div class="pcard" style="--k:#DECFFD"><b>Half-life</b><span>5,730 years</span></div><div class="pcard" style="--k:#FDE7A6"><b>The artifact</b><span>25% left</span></div>${t.lab?`<div class="pcard" style="--k:#FDC3CD"><b>Second sample</b><span>41% left</span></div>`:""}</div>
      <h3 class="ph">Variables</h3>${varTable(V)}
      <h3 class="ph">Your assumptions</h3><ul class="plist">${ASM.filter(a=>as.includes(a.k)).map(a=>`<li>${esc(a.t)}</li>`).join("")||"<li class=muted>None picked yet.</li>"}</ul>`},
  evidence:st=>[["Checks passed",st.d.passed!=null?`${st.d.passed} / 5`:"—"],["Bug found",st.d.bugOK?"Yes":"Not yet"],["Log bases tried",(st.d.bases||[]).length?st.d.bases.join(", "):"—"]],
  steps:[
  (el,st,ctx)=>introStep(el,MISSIONS.decay,st,ctx),
  (el,st,ctx)=>{
    const d=st.d.def||(st.d.def={});
    defineShell(el,MISSIONS.decay,`
      <div class="frow"><div class="chip" style="background:var(--pink-chip)">${ic("percent",2.4)}</div><div class="nm">Initial amount N<sub>0</sub></div>
        <label class="ufield inl" id="w-n0"><input id="d-n0" inputmode="decimal" placeholder="?" value="${esc(d.n0??"")}" aria-label="Initial amount, in percent"><span class="u0">%</span></label></div>
      <div class="frow"><div class="chip" style="background:var(--purple-chip)">${ic("cal",2.4)}</div><div class="nm">Half-life H</div>
        <label class="ufield inl" id="w-h"><input id="d-h" inputmode="decimal" placeholder="?" value="${esc(d.h??"")}" aria-label="Half-life, in years"><span>years</span></label></div>
      <div class="frow"><div class="chip" style="background:var(--teal2)">${ic("clock",2.4)}</div><div class="nm">Elapsed time t</div>
        <div class="ufield inl ask" title="This is what your model will find"><input value="?" readonly tabindex="-1" aria-label="Elapsed time, unknown"><span>years</span></div></div>
      <p class="fb" id="dfb" hidden></p>
      ${assumptionsHTML(ASM,d)}
      <div class="nextrow"><button class="btn next" id="dnext" disabled>Next ${ic("arrowR",2.8)}</button></div>`);
    const check=()=>{const n0=$("#d-n0",el).value.trim(),h=$("#d-h",el).value.trim().replace(/,/g,""); d.n0=n0; d.h=h;
      const a=n0!==""&&+n0===100,b=h!==""&&+h===5730;
      $("#w-n0",el).classList.toggle("ok",a); $("#w-n0",el).classList.toggle("bad",n0!==""&&!a);
      $("#w-h",el).classList.toggle("ok",b); $("#w-h",el).classList.toggle("bad",h!==""&&!b);
      const msg=n0!==""&&!a?"Measure everything as a percentage of what the living tree had. What percentage is that at the start?":h!==""&&!b?"The half-life is in the suggested assumption below.":"";
      const fb=$("#dfb",el); fb.textContent=msg; fb.hidden=!msg;
      const asOK=assumptionsCheck(el,ASM,d);
      $("#dnext",el).disabled=!S.teacher&&!(a&&b&&asOK); save()};
    $$("input",el).forEach(x=>x.addEventListener("input",check)); check(); $("#dnext",el).onclick=ctx.next;
  },
  (el,st,ctx)=>diagramStep(el,MISSIONS.decay,st,ctx,DG),
  (el,st,ctx)=>{
    el.innerHTML=studioHTML({vizTitle:"Carbon-14 Remaining",vizIc:"trend",vizChip:"var(--pink)"});
    const d=st.d; d.tasks=d.tasks||{}; d.mine=d.mine||[]; const prog=d.prog||(d.prog={body:[]}); const view=d.view||(d.view={t:11460,f:41});
    let V=VARS(st), R=modelRunner(V,prog), last=R.at(view);
    const sliders=()=>{const sl=$("#sliders",el); sl.classList.toggle("two",!!V.f);
      sl.innerHTML=rangeHTML("st",`t = ${fmt(view.t)} years`,0,22920,10,view.t,"var(--yellow-btn)")+(V.f?rangeHTML("sf",`f = ${view.f}%`,1,100,1,view.f,"#7EF0D2"):"");
      $$(".rng",sl).forEach(r=>{paintRange(r); r.oninput=()=>{paintRange(r); view[r.id==="st"?"t":"f"]=+r.value; save(); update()}})};
    const studio=blockStudio({pal:$("#pal",el),canvas:$("#cv",el),prog,cats:["v","m","l","o","g"],hat:HAT,
      vars:()=>V, lib:cat=>stdLib(cat,V,{fn:"ln",loopNote:"Your plot already runs the model at every t. Loops are for questions like “how many halvings until…?”",sayText:""}),
      makeVar:makeVarFn(st,()=>V), varTip:(k,x)=>varTipHTML(k,x,last&&last.v[k]), onChange:()=>{st.runs=(st.runs||0)+1; save(); update()}});
    const nice=(lo,hi)=>{const raw=(hi-lo||1)/4, p=Math.pow(10,Math.floor(Math.log10(raw))), m=raw/p, s=(m<=1?1:m<=2?2:m<=2.5?2.5:m<=5?5:10)*p, a=Math.floor(lo/s)*s, b=Math.ceil(hi/s)*s, t=[]; for(let x=a;x<=b+s*1e-9;x+=s) t.push(+x.toFixed(9)); return {lo:a,hi:b,t}};
    const update=()=>{
      V=VARS(st); R=modelRunner(V,prog); last=R.at(view); studio.mark(last.errs);
      const G=checks(st,R,prog), first=G.find(g=>!g.ok);
      $("#goals",el).innerHTML=goalsHTML(G.map(g=>g===first?g:Object.assign({},g,{fb:""}))); goalHints($("#hintzone",el),st,first); trackGoals(st,G);
      // chart: every plot block, swept across its input
      const ps=last.plots, X=(ps[0]&&ps[0].x)||"t", used=ps.filter(p=>p.x===X), isT=X!=="f";
      const xr=isT?[0,22920]:[0,100], xs=[]; if(isT) for(let x=0;x<=22920;x+=191) xs.push(x); else for(let x=1;x<=100;x++) xs.push(x);
      const runs=used.length?xs.map(x=>[x,R.at(Object.assign({},view,{[X]:x}))]):[];
      let lo=0,hi=isT?100:0; const series=[];
      used.forEach((p,i)=>{const pts=runs.map(([x,e])=>[x,e.v[p.y]]).filter(q=>Number.isFinite(q[1])); pts.forEach(q=>{lo=Math.min(lo,q[1]); hi=Math.max(hi,q[1])});
        const main=isT&&p.y==="N"; series.push({key:p.y,label:used.length>1?(V[p.y]&&V[p.y].label)||p.y:"",pts,color:main?"var(--curve)":MINE_COL[i%4],fill:main?"rgba(205,190,255,.42)":"",sw:4})});
      lo=Math.max(lo,-1e6); hi=Math.min(hi,1e6); const Y=nice(lo,hi===lo?lo+1:hi);
      const nv=last.v.N, cur=isT&&used.some(p=>p.y==="N")&&Number.isFinite(nv);
      $("#viz",el).innerHTML=lineChart({w:740,h:420,L:104,R:used.length>1?118:14,T:22,B:84,tf:22,xly:404,x:xr,y:[Y.lo,Y.hi],xt:isT?[0,5730,11460,17190,22920]:[0,25,50,75,100],yt:Y.t,
        xf:x=>fmt(x),yf:y=>isT&&used.every(p=>p.y==="N")?fmt(y)+"%":fmt(y),xl:isT?"t (years)":"f (% left)",yl:used.length===1?(used[0].y==="N"?"N (remaining)":(V[used[0].y]&&V[used[0].y].label)||used[0].y):used.length?"value":"N (remaining)",ylx:20,zero:true,frame:true,
        series,guides:cur?[{x:view.t,y:nv}]:[],callout:cur?{x:view.t,y:nv,t1:`N = ${fmtP(nv).replace("%","")}%`,t2:`t = ${fmt(view.t)} years`,w:210}:null,
        aria:"Your model's plot",hover:x=>{if(!used.length) return null; const xv=isT?Math.round(clamp(x,0,22920)/10)*10:Math.round(clamp(x,1,100)), e=R.at(Object.assign({},view,{[X]:xv}));
          return {x:xv,html:`${X} = ${isT?fmt(xv)+" years":xv+"%"}<br>`+used.map(p=>`<b>${esc((V[p.y]&&V[p.y].label)||p.y)} = ${Number.isFinite(e.v[p.y])?(V[p.y]&&V[p.y].show?V[p.y].show(e.v[p.y]):sayText(e.v[p.y])):"?"}</b>`).join("<br>")}}})+
        (used.length?"":`<p class="chart-empty">Add a <b>plot</b> block from <b>Graph</b> to draw your curve.</p>`);
      wireHover(el);
      const errs=Object.values(last.errs), out=$("#out",el);
      const vals=Object.keys(V).filter(k=>{const x=V[k]; return (x.kind==="out"||x.kind==="mine")&&last.set.has(k)&&Number.isFinite(last.v[k])}).map(k=>{const x=V[k]; return [x.label||k,x.show?x.show(last.v[k]):sayText(last.v[k])]});
      const info={errs,said:last.out.map(sayText),vals,ins:[`t = ${fmt(view.t)} years`].concat(V.f?[`f = ${view.f}%`]:[])};
      if(errs.length) setOut(out,errs[0],true,info);
      else{const bits=[]; if(last.out.length) bits.push(`says “${sayText(last.out[last.out.length-1])}”`);
        vals.forEach(([k,x])=>bits.push(`${k} = ${x}`));
        setOut(out,"> "+(bits.length?bits.join("  ·  "):"set N to see a value"),false,info)}
      $("#st-lab",el)&&($("#st-lab",el).textContent=`t = ${fmt(view.t)} years`); $("#sf-lab",el)&&($("#sf-lab",el).textContent=`f = ${view.f}%`);
      $("#nextb",el).disabled=!S.teacher&&!(G.every(g=>g.ok)&&d.tasks.museum);
      if(G[0].ok&&G[1].ok) award("programmer");
      // pop-up tasks
      if(!d.tasks.lab&&G[0].ok&&G[1].ok){d.tasks.lab=true; save(); V=VARS(st); sliders();
        setTimeout(()=>taskPopup({eyebrow:"Lab update",title:"A second sample just came in",html:`<p>The lab tested another piece of wood from the same site. It still has <b>41%</b> of its carbon-14.</p><p>Halving alone won't land on 41%. Build <b>age</b>: how many years ago the tree died, for any percentage <b>f</b>. A new <b>f</b> slider is in the console, and <b>f</b> and <b>age</b> are in your library.</p><div class="tasknote">${ic("bulb",2.4)}<span>Logarithms undo powers. The <b>Math</b> library's function block has <b>ln</b> and <b>log₁₀</b>.</span></div>`,onClose:update}),700); return update()}
      const ag=G.find(g=>g.k==="age");
      if(d.tasks.lab&&!d.tasks.museum&&ag&&ag.ok){d.tasks.museum=true; save();
        setTimeout(()=>taskPopup({eyebrow:"A question from the museum",title:"When does the carbon-14 clock stop?",html:`<p>“Our exhibit label says carbon-14 dating stops working once less than <b>1%</b> is left. After how many half-lives does that happen?”</p><p>Use a <b>loop</b> that halves and counts, then <b>say</b> the number of half-lives.</p><div class="tasknote">${ic("loop",2.4)}<span>You'll need two variables of your own. Make them in <b>Variables</b>, then use <b>repeat until</b> from <b>Loops</b>.</span></div>`,onClose:update}),700); return update()}
    };
    sliders(); studio.draw(); update();
    $("#back",el).onclick=ctx.back; $("#nextb",el).onclick=ctx.next;
  },
  (el,st,ctx)=>equationStep(el,MISSIONS.decay,st,ctx,EQ),
  (el,st,ctx)=>{
    const V=VARS(st), R=modelRunner(V,st.d.prog||{body:[]});
    TIPV=k=>V[k]?varTipHTML(k,V[k]):null;
    const N=t=>R.at({t,f:50}).v.N, Ag=f=>R.at({t:0,f}).v.age;
    const T=[
      {id:"t1",name:"Nothing has decayed yet",code:"check N = 100% when t = 0",f:()=>[near(N(0),100,0.01),N(0),"%"]},
      {id:"t2",name:"One half-life",code:"check N = 50% when t = 5,730",f:()=>[near(N(5730),50,0.01),N(5730),"%"]},
      {id:"t3",name:"Two half-lives",code:"check N = 25% when t = 11,460",f:()=>[near(N(11460),25,0.01),N(11460),"%"]},
      {id:"t4",name:"Date the second sample",code:"check age ≈ 7,370 years when 41% remains",ic:"pillar",chip:"var(--yellow-soft)",f:()=>[near(Ag(41),TAGE(41),10),Ag(41)," years"]},
      {id:"t5",name:"Running the model backwards",code:"check age = 11,460 years when 25% remains",ic:"refresh",chip:"var(--lav)",f:()=>[near(Ag(25),11460,10),Ag(25)," years"]}];
    const bases=st.d.bases||(st.d.bases=[]);
    const vr=k=>newNode("var",{f:{v:k}}), op=(ty,a,b)=>Object.assign(newNode(ty),{a:{a,b}});
    const bug=Object.assign(newNode("set",{f:{v:"N"}}),{a:{x:op("sub",vr("N0"),op("mul","50",op("div",vr("t"),vr("H"))))}});
    el.innerHTML=`<div class="card tsec reveal"><div class="tsec-h"><h2>Check your model</h2><button class="btn" id="runall">${ic("playf",2)}Run all checks</button></div>
        <p class="lead">Three checks you can do by halving in your head, and two that test whether your age block really runs the model backwards.</p>
        <div class="tests" data-stagger>${T.map(testCard).join("")}</div><div id="tfb" style="margin-top:2.2rem"></div></div>
      <div class="split">
       <div class="card tsec reveal">
        <div class="tsec-h"><div class="chip" style="width:5.4rem;height:5.4rem;background:var(--pink-soft)">${ic("bug",2.4)}</div><h2>Bug hunt: the disappearing carbon</h2></div>
        <p class="lead">A scientist built N like this. It passes the one-half-life check. Fill in what it predicts next.</p>
        <div class="canvasbox card ro" style="box-shadow:none;margin-bottom:2rem;padding:2.4rem 1.6rem;overflow-x:auto"><div class="script">${HAT}<div class="stack root">${rNode(bug,{pal:true,vars:V,menus:()=>[["N","N"]]})}</div></div></div>
        <div class="tw"><table class="tbl"><thead><tr><th>t (years)</th><th>This model says</th><th>Should be</th></tr></thead><tbody>
          <tr class="hl"><td>5,730</td><td>50%</td><td>50%</td></tr>
          <tr><td>11,460</td><td><label class="ufield inl sm" id="bw1"><input id="b1" inputmode="decimal" placeholder="?" value="${esc(st.d.b1??"")}" aria-label="The scientist's model at 11,460 years"><span class="u0">%</span></label></td><td>25%</td></tr>
          <tr><td>17,190</td><td><label class="ufield inl sm" id="bw2"><input id="b2" inputmode="decimal" placeholder="?" value="${esc(st.d.b2??"")}" aria-label="The scientist's model at 17,190 years"><span class="u0">%</span></label></td><td>12.5%</td></tr></tbody></table></div>
        <div style="margin-top:2rem;display:flex;gap:1.6rem;align-items:center;flex-wrap:wrap"><button class="btn sm lav" id="bcheck">${ic("check",2.6)}Check my answers</button></div>
        <p class="fb" id="bfb"></p>
       </div>
       <div class="card tsec reveal">
        <div class="tsec-h"><div class="chip" style="width:5.4rem;height:5.4rem;background:var(--sky)">${ic("sparkle",2.4)}</div><h2>Does the log base matter?</h2></div>
        <p class="lead">Dating with logs means dividing one logarithm by another. Switch the base and watch the pieces.</p>
        <div class="seg" id="bases">${["e","10","2"].map(b=>`<button class="fpill" aria-pressed="false" data-b="${b}">log base ${b}</button>`).join("")}</div>
        <div id="bout" style="margin-top:2rem"></div>
       </div>
      </div>
      <div class="ex-btns" style="margin-left:0"><button class="btn back" id="back">${ic("arrowL",2.8)}Equation</button><button class="btn submit" id="nextb" disabled>Explain ${ic("arrowR",2.8)}</button></div>`;
    const gate=()=>{$("#nextb",el).disabled=!S.teacher&&!(st.d.passed===5&&st.d.bugOK)};
    const runAll=fresh=>{let n=0; T.forEach(t=>{const [p,v,u]=t.f(); if(p)n++; setTest(el,t.id,p,`Your model says: <b>${Number.isFinite(v)?fmt(v,u==="%"?(Math.abs(v-Math.round(v))<0.05?0:1):0)+u:"nothing yet"}</b>`)}); st.d.passed=n; save();
      $("#tfb",el).innerHTML=n===5?`<div class="callout mint"><div><h4>All five checks pass.</h4><p>Your forward model and your age block agree with each other and with the half-life table.</p></div></div>`:`<div class="callout pink"><div><h4>${5-n} check${5-n>1?"s":""} failed.</h4><p>${n>=3?"Checks 4 and 5 use your age block. Go back to Build and test it with the f slider.":"Go back to Build and look at the block that sets N. Failing a check is how models get better."}</p></div></div>`;
      if(fresh&&n===5) celebrate($("#runall",el)); gate()};
    $("#runall",el).onclick=()=>runAll(true); if(st.d.passed!=null) runAll(false);
    const bc=()=>{const a=$("#b1",el).value.trim(),b=$("#b2",el).value.trim(); st.d.b1=a; st.d.b2=b; const okA=a!==""&&+a===0,okB=b!==""&&+b===-50;
      $("#bw1",el).className="ufield inl sm "+(a===""?"":okA?"ok":"bad"); $("#bw2",el).className="ufield inl sm "+(b===""?"":okB?"ok":"bad"); fitInl(el);
      $("#bfb",el).textContent=okA&&okB?"Right: 0%, then −50%. Negative carbon is impossible, and this model passed the first check anyway. One passing test proves almost nothing.":okA?"Now try 17,190: that's three half-lives, so 100 − 50 × 3.":a!==""?"11,460 ÷ 5,730 = 2, so the model says 100 − 50 × 2.":"";
      if(okA&&okB){st.d.bugOK=true; award("errdet")} save(); gate()};
    $("#bcheck",el).onclick=bc; if(st.d.b1) bc();
    const showBase=b=>{const L=LOGB[b],top=L(0.41),bot=L(0.5); if(!bases.includes(b)) bases.push(b); save();
      $$("[data-b]",el).forEach(x=>x.setAttribute("aria-pressed",x.dataset.b===b));
      $("#bout",el).innerHTML=`<table class="tbl"><tbody><tr><td>log<sub>${b}</sub>(0.41)</td><td>${fmt(top,4)}</td></tr><tr><td>log<sub>${b}</sub>(0.5)</td><td>${fmt(bot,4)}</td></tr><tr class="hl"><td><b>ratio = half-lives</b></td><td><b>${fmt(top/bot,4)}</b></td></tr></tbody></table>
        <p class="fb">${bases.length<3?`Tried ${bases.length} of 3 bases.`:"Both logs change with the base, and the ratio never does. Changing base multiplies top and bottom by the same number, so it cancels."}</p>`;
      if(bases.length===3) award("pattern")};
    $$("[data-b]",el).forEach(x=>x.onclick=()=>showBase(x.dataset.b)); if(bases.length) showBase(bases[bases.length-1]);
    $("#back",el).onclick=ctx.back; $("#nextb",el).onclick=ctx.next; gate();
  },
  (el,st,ctx)=>{
    const V=VARS(st), R=modelRunner(V,st.d.prog||{body:[]});
    const ageFor=f=>{const a=R.at({t:0,f}).v.age; if(Number.isFinite(a)) return a;
      const N=t=>R.at({t,f}).v.N; if(!Number.isFinite(N(0))) return NaN; let lo=0,hi=60000; if(!(N(lo)>=f&&N(hi)<=f)) return NaN;
      for(let i=0;i<60;i++){const mid=(lo+hi)/2; if(N(mid)>f) lo=mid; else hi=mid} return (lo+hi)/2};
    const age=ageFor(25), age41=ageFor(41);
    const asl={start:"Same carbon-14 as living things today",clean:"No contamination"};
    const chosen=((st.d.def&&st.d.def.as)||[]).filter(k=>asl[k]);
    explainShell(el,MISSIONS.decay,`
      <div class="result"><span class="k">Estimated Age</span><span class="vsep"></span><span class="v">≈ ${Number.isFinite(age)?`<span data-count="${Math.round(age)}">${fmt(age)}</span>`:"?"} years</span></div>
      <div class="erow"><span class="etag why">Why?</span><textarea class="etext" id="why" rows="2" placeholder="25% remaining means two half-lives have passed: 2 × 5,730 years.">${esc(st.d.why||"")}</textarea></div>
      <div class="erow"><span class="etag lim">Limitations</span><div>${chosen.length?`<div style="display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:1.2rem">${chosen.map(k=>`<span class="pill easy aspill">${asl[k]}</span>`).join("")}</div>`:""}
        <textarea class="etext" id="lim" rows="2" placeholder="The model assumes a constant half-life and no contamination.">${esc(st.d.lim||"")}</textarea></div></div>
      <p class="fb" id="xfb" hidden></p>`);
    ["why","lim"].forEach(k=>$("#"+k,el).addEventListener("input",e=>{st.d[k]=e.target.value; save()}));
    $("#back",el).onclick=ctx.back;
    $("#sub",el).onclick=()=>{const why=$("#why",el).value.trim(), fb=$("#xfb",el);
      if(why.length<15){fb.hidden=false; fb.textContent="Add a sentence to Why? that uses your model: how many half-lives, and how many years?"; $("#why",el).focus(); return}
      fb.hidden=true;
      const md=modal(`<img class="peek" src="${A(BEARS.wave)}" alt="">
        <div class="eyebrow" style="color:#7C5CFF">One last check</div>
        <h2 style="margin-top:1.2rem">Does your answer prove someone carved this bowl ${Number.isFinite(age)?fmt(age):"that many"} years ago?</h2>
        <p class="lead">${Number.isFinite(age41)?`Your model also dates the second sample (41%) at ${fmt(age41)} years.`:"Think about what your model actually measures."}</p>
        ${choiceList("tw",[{v:"yes",l:"Yes, the model gives the carving date"},{v:"no",l:"No, it dates when the wood stopped taking in carbon"}],st.d.tw)}
        <p class="fb" id="twfb"></p>
        <div style="display:flex;justify-content:flex-end;margin-top:2.6rem"><button class="btn" id="twgo" ${st.d.tw==="no"?"":"disabled"}>Finish mission ${ic("arrowR",2.6)}</button></div>`);
      bindChoices(md.el,"tw",v=>{st.d.tw=v; save(); $("#twfb",md.el).textContent=v==="no"?"Right. A tree can be cut long before it's carved, and old wood gets reused.":"Think about what carbon-14 actually measures: the wood, or the person holding the knife?"; $("#twgo",md.el).disabled=v!=="no"});
      $("#twgo",md.el).onclick=()=>{md.close(); completeMission("decay")}};
  }]
};
MISSIONS.decay.eq=EQ; MISSIONS.decay.dg=DG;
/* ---- answer key (teacher mode): each task fills its answer into the step. Diagram and Equation answers come from DG and EQ. ---- */
akLazy(MISSIONS.decay,()=>{const v=BK.v, op=BK.op;
  const REF=[()=>[BK.set("N",op("mul",v("N0"),op("pow","0.5",op("div",v("t"),v("H")))))],
    ()=>[BK.plot("N","t")],
    ()=>[BK.set("age",op("mul",v("H"),op("div",BK.fn("ln",op("div",v("f"),v("N0"))),BK.fn("ln","0.5"))))],
    ()=>[BK.set("left",v("N0")),BK.set("k","0"),BK.until(op("lt",v("left"),"1"),[BK.set("left",op("mul",v("left"),"0.5")),BK.change("k",1)]),BK.say(v("k"))]];
  const MODEL=["prog","tasks","mine","view"];
  const build=(st,upto)=>{const d=st.d; d.prog={body:[].concat(...REF.slice(0,upto+1).map(f=>f()))}; d.tasks=d.tasks||{};
    if(upto>=2) d.tasks.lab=true; if(upto>=3){d.tasks.museum=true; d.mine=d.mine||[]; ["left","k"].forEach(k=>{if(!d.mine.includes(k)) d.mine.push(k)})} d.view=d.view||{t:11460,f:41}};
  const works=st=>{const d=st.d; if(!d.prog||!d.tasks||!d.tasks.museum) return false; try{return checks(st,modelRunner(VARS(st),d.prog),d.prog).every(g=>g.ok)}catch(e){return false}};
  const ensure=st=>{if(!works(st)) build(st,REF.length-1)}, withModel=more=>st=>(works(st)?[]:MODEL).concat(more);
  const def=st=>st.d.def||(st.d.def={});
  return {
  0:()=>[
    {t:"What's the question?",html:akP("How many years ago did the tree die? The artifact's wood still has <b>25%</b> of the carbon-14 it had when the tree died.")},
    {t:"What do we know?",html:akKV([["When the tree died","100% of its carbon-14"],["Half-life","5,730 years: half of what's left decays every 5,730 years"],["The artifact today","25% left"],["Second sample <span class='akmeta'>arrives in Build</span>","41% left"]])},
    {t:"What will the model work out?",html:akP("<b>N</b>, the percent of carbon-14 left after <b>t</b> years. Then the model runs backwards: <b>age</b>, the years since the tree died, from <b>f</b>, the percent that's left.")},
    {t:"Where the class should end up",html:akP("25% left is two half-lives, so the tree died about <b>11,460 years</b> ago. The second sample, with 41% left, is about <b>7,370 years</b> old. Carbon-14 dates when the tree died, not when someone carved the wood.")}],
  1:()=>[
    {t:"Initial amount N₀",keys:["def"],target:"#w-n0",apply:st=>{def(st).n0="100"},note:"Every amount is a percent of what the living tree had."},
    {t:"Half-life H",keys:["def"],target:"#w-h",apply:st=>{def(st).h="5730"},note:"Elapsed time t has nothing to type: it's what the model finds."},
    {t:"Assumptions",keys:["def"],target:".dcard .callout.asm",apply:st=>{def(st).as=ASM.filter(a=>a.ok).map(a=>a.k)},note:"Ticked: every assumption the model makes. Left unticked: the two it doesn't."}],
  3:()=>["Build <b>N</b>: the percent of carbon-14 left after <b>t</b> years","Plot <b>N</b> against <b>t</b>","Build <b>age</b>: how many years ago the tree died, when <b>f</b>% is left",
      "Use a <b>loop</b> to find how many half-lives until less than 1% is left, and <b>say</b> it"].map((t,i)=>({t,tag:i>=2?"new task":"",keys:MODEL,target:i===1?".studio .gpanel":"#cv",
      apply:st=>build(st,i),note:["Check: slide t to 5,730 and the console says N = 50%.","The curve halves every 5,730 years and never reaches 0. Close the pop-up to see the next task.",
        "Check: slide f to 25% and the console says age = 11,460 years; at 41% it's about 7,370.","It says 7: after 6 half-lives 1.56% is left, and after 7 only 0.78%. The variables left and k are made in Variables first."][i]})),
  5:()=>[
    {t:"Run all checks",keys:withModel(["passed"]),target:".tests",apply:st=>{ensure(st); st.d.passed=0},note:"All five pass: 100%, 50% and 25% at 0, 1 and 2 half-lives, then the age block dates 41% and 25%."},
    {t:"Bug hunt: the disappearing carbon",keys:["b1","b2","bugOK"],target:"#bw1",apply:st=>{st.d.b1="0"; st.d.b2="-50"},note:"0% at 11,460 years and −50% at 17,190: the model loses the same amount every half-life."},
    {t:"Does the log base matter?",keys:["bases"],target:"#bout",apply:st=>{st.d.bases=["e","10","2"]},note:"No: the ratio is 1.2863 half-lives in every base."}],
  6:()=>[
    {t:"Estimated age",keys:withModel([]),target:".ex .result",apply:ensure,note:"≈ 11,460 years: 25% left is two half-lives, 2 × 5,730."},
    {t:"Why?",keys:["why"],target:"#why",apply:st=>{st.d.why="25% left means two half-lives have passed: 100% → 50% → 25%. So t = 2 × 5,730 = 11,460 years. My age block gives the same: 5,730 × ln(0.25) ÷ ln(0.5) = 11,460."},note:"A sample answer. Look for the number of half-lives and a number from the model."},
    {t:"Limitations",keys:["lim"],target:"#lim",apply:st=>{st.d.lim="The model assumes the living tree had the same share of carbon-14 as living things today, and that nothing added or removed carbon after the tree died. The half-life is a measurement, so the age is an estimate, not an exact year."},note:"A sample answer."},
    {t:"One last check: does the answer prove someone carved the bowl that long ago?",keys:withModel(["tw","why"]),target:".modal .box",
      apply:st=>{ensure(st); if(String(st.d.why||"").trim().length<15) st.d.why="25% left means two half-lives have passed, so about 2 × 5,730 = 11,460 years."; st.d.tw="no"},after:akClick(".ex #sub"),note:"No: it dates when the wood stopped taking in carbon. A tree can be cut long before it's carved."}]}});
})();
