/* ================= Mission 1 · The Plan Puzzle ================= */
(()=>{
const TA=g=>20+8*g, TB=g=>45+3*g, TF=(g,n)=>(40+10*n+4*n*g)/n;
const PRICE={fixed_A:20,rate_A:8,fixed_B:45,rate_B:3,base_F:40,line_F:10,gb_F:4};
const STY={cost_A:{color:"#7C5CFF",dash:"",marker:"circle",name:"Plan A"},cost_B:{color:"#FF7A59",dash:"14 8",marker:"square",name:"Plan B"},family_each:{color:"#10B5A0",dash:"3 9",marker:"diamond",name:"Family"}};
const MINE_COL=["#D9466B","#2E86DE","#B07C00","#5A3FD8"];
const SAMPLES=[[0,1],[3,2],[7,4],[12,3],[20,1],[5,6]];
function VARS(st){const d=st.d, t=d.tasks||{}, V={};
  V.g={kind:"in",label:"g",name:"data each person uses in a month",unit:"GB",min:0,max:30,step:.5,show:x=>fmt(x,x%1?1:0)+" GB"};
  if(t.family) V.n={kind:"in",label:"n",name:"people sharing the family plan",unit:"people",min:1,max:6,step:1,show:x=>fmt(x)};
  const par=(k,name,unit,src)=>V[k]={kind:"par",label:k,name,unit,val:PRICE[k],show:money,src};
  par("fixed_A","Plan A's monthly fee","per month","Plan A's price list"); par("rate_A","Plan A's price for each GB","per GB","Plan A's price list");
  par("fixed_B","Plan B's monthly fee","per month","Plan B's price list"); par("rate_B","Plan B's price for each GB","per GB","Plan B's price list");
  if(t.family){par("base_F","family plan's fee for the account","per month","the family plan card"); par("line_F","family plan's charge for each line","per person","the family plan card"); par("gb_F","family plan's price for each GB anyone uses","per GB","the family plan card")}
  V.cost_A={kind:"out",label:"cost_A",name:"Plan A's bill for the month",unit:"$",show:money};
  V.cost_B={kind:"out",label:"cost_B",name:"Plan B's bill for the month",unit:"$",show:money};
  if(t.family) V.family_each={kind:"out",label:"family_each",name:"what each person pays on the family plan",unit:"$",show:money};
  (d.mine||[]).forEach(k=>V[k]={kind:"mine",label:k,name:"a variable you made",unit:""});
  return V}
const which=x=>{const s=String(x).toLowerCase().trim(); const a=/\bplan\s*a\b|^a$|cost_a/.test(s), b=/\bplan\s*b\b|^b$|cost_b/.test(s); return a&&!b?"A":b&&!a?"B":null};
function checks(st,R){const t=st.d.tasks||{};
  const cmp=(key,truth,both)=>{for(const [g,n] of SAMPLES){const e=R.at({g,n}); const y=e.v[key];
      if(y===undefined) return {ok:false,fb:Object.keys(e.errs).length?redFix(e.errs):`<b>${key}</b> isn't set yet. Drag a <b>set</b> block from Variables into your program and choose <b>${key}</b> in its menu.`};
      const want=truth(g,n); if(!near(y,want,0.005)) return {ok:false,fb:`At g = ${fmt(g)} GB${both?`, n = ${n}`:""}, your ${key} = ${money(y)}, but the price list gives ${money(want)}. Slide g to ${fmt(g)} and check each part of your formula against the price list.`}}
    return {ok:true}};
  const A=cmp("cost_A",g=>TA(g)), B=cmp("cost_B",g=>TB(g)), plots=R.at({g:5,n:4}).plots, pl=k=>plots.some(p=>p.y===k&&p.x==="g");
  const G=[{k:"A",t:"Build <b>cost_A</b>: Plan A's bill when someone uses g GB",...A,hints:["Work out a few bills by hand. With Plan A, 0 GB costs $20, 1 GB costs $20 + $8 = $28, and 2 GB costs $20 + $8 + $8 = $36. Which part stays the same every month, and which part grows with every GB?",
      "The bill has two parts. The monthly fee, <b>fixed_A</b> ($20), is paid no matter what. The data charge is <b>rate_A</b> ($8) for every GB, so for g GB it's rate_A × g. Add the two parts: cost_A = fixed_A + rate_A × g.",
      hsteps("From <b>Variables</b>, drag a <b>set</b> block into your program and choose <b>cost_A</b> in its menu.","From <b>Math</b>, drop a <b>+</b> block into the set block's empty slot.","From <b>Variables</b>, drag <b>fixed_A</b> into the left slot of the +.","From <b>Math</b>, drop a <b>×</b> block into the right slot of the +.","Fill the × with <b>rate_A</b> and <b>g</b> from Variables. It should read: set cost_A to fixed_A + (rate_A × g).","Check: slide g to 0. The console should say cost_A = $20.")]},
    {k:"B",t:"Build <b>cost_B</b> the same way for Plan B",...B,hints:["Plan B has the same two parts as Plan A: a monthly fee and a price for each GB. What does Plan B cost at 0 GB? At 1 GB? (It's $45, then $48.)",
      "Plan B's monthly fee is <b>fixed_B</b> ($45) and its price for each GB is <b>rate_B</b> ($3). So cost_B = fixed_B + rate_B × g, the same shape as your cost_A.",
      hsteps("Drag another <b>set</b> block under your first one and choose <b>cost_B</b>.","Drop a <b>+</b> block from Math into its slot, and put <b>fixed_B</b> in the left slot.","Drop a <b>×</b> block into the right slot of the +, and fill it with <b>rate_B</b> and <b>g</b>.","Check: slide g to 5. The console should say cost_B = $60.")]},
    {k:"plot",t:"Plot <b>cost_A</b> and <b>cost_B</b> against <b>g</b>",ok:A.ok&&B.ok&&pl("cost_A")&&pl("cost_B"),fb:A.ok&&B.ok?"Add a plot block from Graph for each cost.":"",hints:["A graph shows both plans at every amount of data at once. Which variable do you change (it goes along the bottom), and which ones does your model calculate (they go up the side)?",
      "Data used, <b>g</b>, goes along the bottom. Each cost goes up the side, so you need one <b>plot</b> block for cost_A and another for cost_B.",
      hsteps("Open <b>Graph</b> and drag a <b>plot</b> block to the bottom of your program.","In its first menu choose <b>cost_A</b>, and in its second menu choose <b>g</b>.","Add a second plot block and choose <b>cost_B</b> against <b>g</b>.","Hover over the chart where the two lines cross. That's where the plans cost the same.")]}];
  if(t.cheaper){let ok=true,fb=""; for(const g of [1,2,9,20]){const e=R.at({g,n:4}), said=e.out.length?which(e.out[e.out.length-1]):null, want=TA(g)<=TB(g)?"A":"B";
      if(!e.out.length){ok=false; fb="Nothing is said yet. Use a <b>say</b> block from Graph."; break}
      if(said!==want){ok=false; fb=`At g = ${g} GB your program says “${esc(sayText(e.out[e.out.length-1]))}”, but Plan ${want} is cheaper there (${money(TA(g))} vs ${money(TB(g))}).`; break}}
    G.push({k:"say",t:"Say <b>Plan A</b> or <b>Plan B</b>, whichever is cheaper at any g",tag:"new task",isNew:true,ok,fb,hints:["Slide g to 2 GB, then to 9 GB. Which plan is cheaper each time? To decide, which two numbers do you compare?",
      "Compare cost_A with cost_B. The pointy block (cost_A) &lt; (cost_B) is true exactly when Plan A costs less. An <b>if … else</b> block runs its top part when that's true and its else part when it's false.",
      hsteps("From <b>Logic</b>, drag an <b>if … else</b> block to the end of your program.","From <b>Logic</b>, drop a <b>&lt;</b> block into its pointy slot.","Drag <b>cost_A</b> into the left slot of the &lt; and <b>cost_B</b> into the right slot.","From <b>Graph</b>, put a <b>say</b> block in the top part and type <b>Plan A</b>.","Put another say block in the else part and type <b>Plan B</b>.","Check: slide g to 9 GB. The console should say “Plan B”.")]})}
  if(t.family){const F=cmp("family_each",TF,true), Fp=plots.some(p=>p.y==="family_each");
    G.push({k:"F",t:"Build <b>family_each</b>: what each person pays on the family plan",tag:"new task",isNew:true,...F,hints:["Work out the whole family's bill first. Two people who use 0 GB pay $40 for the account + $10 × 2 lines = $60. If each of them uses 1 GB, the family uses 2 GB, which adds $4 × 2 = $8. How would they split the bill?",
      "Whole bill = <b>base_F</b> + <b>line_F</b> × n + <b>gb_F</b> × n × g, because n people each use g GB. Each person pays the whole bill ÷ n. A variable of your own, like <b>total</b>, keeps it tidy.",
      hsteps("In <b>Variables</b>, type <b>total</b> in the “new variable” box and press <b>Make</b>.","Add <b>set total to</b> base_F + (line_F × n) + (gb_F × (n × g)). Use two + blocks for the three parts, and × blocks for each product.","Add <b>set family_each to</b> total ÷ n, with a ÷ block from Math.","Check: slide n to 4 and g to 5. The console should say family_each = $40.")]},
      {k:"Fplot",t:"Plot <b>family_each</b> against <b>g</b>",ok:F.ok&&Fp,isNew:true,fb:F.ok?"Add a plot block for family_each.":"",hints:["How could you compare the family plan with the two solo plans on the same chart?",
      "Plot <b>family_each</b> against <b>g</b>, just like the other two costs. Then move the n slider and watch the family line move.",
      hsteps("Drag a <b>plot</b> block from Graph to the end of your program.","Choose <b>family_each</b> in its first menu and <b>g</b> in its second.","Set n = 4 and g = 8, then compare the three lines. Which one is lowest?")]})}
  return G}

/* ---- Equation step: the two bills as equations, why they look that way, then solve for the break-even ---- */
const EQ={
  intro:"Your blocks already work out both bills. Mathematicians write the same model as <b>equations</b>: a symbol for each quantity, joined by operations. Writing it this way lets you solve for the answer exactly.",
  SY:{g:{name:"How much data she uses in a month",unit:"GB",role:"in",range:[0,30],story:8},
    fixed_A:{name:"Plan A's monthly fee",unit:"$",role:"par",val:20,show:"$20 a month"},
    rate_A:{name:"Plan A's price for each GB",unit:"$ per GB",role:"par",val:8,show:"$8 per GB"},
    cost_A:{name:"Plan A's bill for the month",unit:"$",role:"out"},
    fixed_B:{name:"Plan B's monthly fee",unit:"$",role:"par",val:45,show:"$45 a month"},
    rate_B:{name:"Plan B's price for each GB",unit:"$ per GB",role:"par",val:3,show:"$3 per GB"},
    cost_B:{name:"Plan B's bill for the month",unit:"$",role:"out"}},
  syms:["g","fixed_A","rate_A","cost_A","fixed_B","rate_B","cost_B"],
  tiles:["cost_A","cost_B","g","fixed_A","rate_A","fixed_B","rate_B","=","+","-","*","/","(",")"],
  eqs:[
    {out:"cost_A",f:"fixed_A + rate_A*g",
      mistakes:[{f:"fixed_A*g + rate_A",fb:"That's the flat-fee fumble: the monthly fee got multiplied by {{g}}, and the price per GB is paid only once. Which part should grow with every GB?"},
        {f:"fixed_A + rate_A",fb:"This bill never changes when {{g}} changes. Where does the data she uses come in?"},
        {f:"(fixed_A + rate_A)*g",fb:"Now the monthly fee is paid once for every GB. Only the data charge grows with {{g}}: check your brackets."},
        {f:"rate_A*g",fb:"That's only the data charge. She also pays the monthly fee, however much data she uses."},
        {f:"fixed_A*rate_A*g",fb:"The fee and the data charge are two separate parts of the bill, so they're added, not multiplied."}],
      hints:["Start with {{cost_A}} and =. Then ask: what two parts make up Plan A's bill?","The bill is the monthly fee, {{fixed_A}}, plus the price for each GB, {{rate_A}}, times the GB she uses, {{g}}."]},
    {out:"cost_B",f:"fixed_B + rate_B*g",
      mistakes:[{f:"fixed_B*g + rate_B",fb:"The monthly fee got multiplied by {{g}}. Which part of Plan B's bill grows with every GB?"},
        {f:"fixed_B + rate_B",fb:"This bill never changes when {{g}} changes. Where does the data she uses come in?"},
        {f:"(fixed_B + rate_B)*g",fb:"Now the monthly fee is paid once for every GB. Only the data charge grows with {{g}}: check your brackets."},
        {f:"rate_B*g",fb:"That's only the data charge. Plan B also has a monthly fee."}],
      hints:["Plan B's bill has the same two parts as Plan A's. Use Plan B's symbols.","{{cost_B}} is the monthly fee {{fixed_B}} plus {{rate_B}} for each of the {{g}} GB."]}],
  why:[
    {id:"part",q:"In {{cost_A = fixed_A + rate_A*g}}, what does {{rate_A*g}} stand for?",opts:[
      {h:"The charge for all the data she uses in a month",ok:true,why:"{{rate_A}} is the price of one GB and {{g}} is how many GB she uses, so {{rate_A*g}} is the whole data charge. At 8 GB it's {{8*8 = 64}} dollars."},
      {h:"The price of one GB",fb:"That's {{rate_A}} on its own. Multiplying by {{g}} gives the price of all {{g}} GB."},
      {h:"Her whole bill for the month",fb:"The whole bill is {{cost_A}}. {{rate_A*g}} is only the data part: the monthly fee is the other part."}]},
    {id:"slope",q:"She uses 1 more GB a month. What happens to {{cost_A}}?",opts:[
      {h:"It goes up by {{fixed_A}}, which is 20 dollars",fb:"{{fixed_A}} is paid once a month, whatever {{g}} is, so it doesn't change when {{g}} does."},
      {h:"It goes up by {{rate_A}}, which is 8 dollars",ok:true,why:"{{g}} goes up by 1, so {{rate_A*g}} goes up by {{rate_A}}. That's why the graph is a straight line that rises 8 dollars for every GB: its slope."},
      {h:"It doubles",fb:"Try it: at 4 GB the bill is 52 dollars, and at 5 GB it's 60. That's 8 dollars more, not double."}]},
    {id:"fee",q:"Why is {{fixed_A}} added on its own instead of multiplied by {{g}}?",opts:[
      {h:"Because it's the bigger number",fb:"Size doesn't decide the operation. Ask: does this cost change when she uses more data?"},
      {h:"Because adding always comes first",fb:"Order of operations tells you how to read an expression, not why the model adds here. Think about what the fee means."},
      {h:"She pays it once a month, however much data she uses",ok:true,why:"A fixed fee doesn't depend on {{g}}, so it's added on its own. On the graph it's where the line starts, at {{g = 0}}."}]},
    {id:"family",q:"Her mom's family plan is {{family_each = (base_F + line_F*n + gb_F*n*g)/n}}. Why divide by {{n}}?",opts:[
      {h:"The whole family's bill is shared by the {{n}} people",ok:true,why:"The top is the whole household's bill. Dividing by {{n}} gives each person's share, so the account fee gets split more ways as the family grows."},
      {h:"To turn GB into dollars",fb:"{{gb_F}} already turns GB into dollars. Dividing by {{n}} is about people."},
      {h:"Because there are {{n}} lines to pay for",fb:"The lines are paid for in {{line_F*n}}. Dividing by {{n}} splits the total between the {{n}} people."}]}],
  solve:{title:"when do the two plans cost the same?",intro:"Set the two bills equal and solve for {{g}}. Pick each move: the next line appears when it's right.",
    start:"cost_A = cost_B",startNote:"the two bills are equal",
    steps:[
      {q:"Put each plan's equation in, with its numbers. Which line is right?",opts:[
        {h:"{{20*g + 8 = 45*g + 3}}",fb:"The fee and the price per GB swapped places. The fee is added on its own; the price per GB multiplies {{g}}."},
        {h:"{{20 + 8*g = 45 + 3*g}}",ok:true,to:"20 + 8*g = 45 + 3*g",note:"each symbol replaced by its value"},
        {h:"{{20 + 8*g + 45 + 3*g = 0}}",fb:"That adds the two bills together. We want the {{g}} where they're equal."}]},
      {q:"What's the next move?",opts:[
        {h:"Subtract {{3*g}} from both sides",ok:true,to:"20 + 5*g = 45",note:"−3g on both sides"},
        {h:"Divide both sides by {{g}}",fb:"{{g}} is in only one part of each side, so dividing by {{g}} doesn't free it. First gather the {{g}} terms on one side."},
        {h:"Add {{3*g}} to both sides",fb:"That gives {{20 + 11*g = 45 + 6*g}}: still {{g}} on both sides. Take {{3*g}} away instead."}]},
      {q:"Next move?",opts:[
        {h:"Divide both sides by 20",fb:"20 is added to {{5*g}}, not multiplied. Undo adding by subtracting."},
        {h:"Add 20 to both sides",fb:"That gives {{40 + 5*g = 65}}, and the 20 is still in the way. Undo adding with subtracting."},
        {h:"Subtract 20 from both sides",ok:true,to:"5*g = 25",note:"−20 on both sides"}]},
      {q:"Last move?",opts:[
        {h:"Divide both sides by 5",ok:true,to:"g = 5",note:"÷5 on both sides"},
        {h:"Subtract 5 from both sides",fb:"{{5*g}} means 5 times {{g}}. Undo multiplying by dividing."},
        {h:"Multiply both sides by 5",fb:"That gives {{25*g = 125}}. Undo the 5 by dividing instead."}]}],
    final:{q:"So the two plans cost the same at:",inputs:[{pre:"{{g}} =",ans:5,tol:.001,post:"GB"},{pre:"and each bill is $",ans:60,tol:.01,post:""}],
      ok:"Check: {{20 + 8*5 = 60}} and {{45 + 3*5 = 60}}. Both bills are 60 dollars at 5 GB.",fb:"Not yet. The last line gives {{g}}. For the bill, put that {{g}} into either plan's equation."},
    interp:{id:"interp",q:"Your cousin uses 8 GB a month. What does your solution tell her?",opts:[
      {h:"Plan A, because its monthly fee is smaller",fb:"Plan A starts cheaper, but it costs 5 dollars more for every GB. Past 5 GB, Plan A is the dearer plan."},
      {h:"Plan B: above 5 GB, Plan B's lower price per GB wins",ok:true,why:"At 8 GB, Plan A is {{20 + 8*8 = 84}} dollars and Plan B is {{45 + 3*8 = 69}} dollars."},
      {h:"Either one: they cost the same for her",fb:"They only cost the same at exactly 5 GB. She uses 8."}]}}};
/* ---- Diagram step: each bill is a stock that fills as she uses data; the clock is g, not time ---- */
const DG={
  intro:"Before you code, draw your model the way modelers do: as a <b>stock-and-flow diagram</b>. It shows what builds up, what makes it grow, and what depends on what. Here the clock isn't time: it's <b>g</b>, the GB she uses. Picture each bill as a tank that fills up as she uses data.",
  clock:{k:"g",name:"the GB she uses"},
  SY:EQ.SY,
  nodes:[
    {id:"cost_A",t:"stock",lab:"cost_A",name:"Plan A's bill",desc:"Plan A's bill so far",unit:"$",start:"fixed_A = $20",startBy:"fixed_A"},
    {id:"charge_A",t:"flow",lab:"charge_A",name:"added per GB",desc:"Dollars that pour into Plan A's bill for each GB she uses",unit:"$ per GB"},
    {id:"rate_A",t:"conv",lab:"rate_A",name:"price per GB",desc:"Plan A's price for each GB, printed on its price list: $8",unit:""},
    {id:"cost_B",t:"stock",lab:"cost_B",name:"Plan B's bill",desc:"Plan B's bill so far",unit:"$",start:"fixed_B = $45",startBy:"fixed_B"},
    {id:"charge_B",t:"flow",lab:"charge_B",name:"added per GB",desc:"Dollars that pour into Plan B's bill for each GB she uses",unit:"$ per GB"},
    {id:"rate_B",t:"conv",lab:"rate_B",name:"price per GB",desc:"Plan B's price for each GB, printed on its price list: $3",unit:""}],
  sortFb:{
    cost_A:{flow:"cost_A is an amount of money, in $, not a rate in $ per GB. It's the bill so far.",conv:"cost_A carries over and grows: each GB adds to the bill she already has. Something that builds up like that is a stock."},
    cost_B:{flow:"cost_B is an amount of money, in $, not a rate in $ per GB. It's the bill so far.",conv:"cost_B carries over and grows: each GB adds to the bill she already has. Something that builds up like that is a stock."},
    charge_A:{stock:"Look at the unit: $ per GB is a rate. charge_A is how fast the bill fills, so it's a flow.",conv:"charge_A is set by the price, but it's also what pours dollars into the bill. A rate that fills a stock is a flow."},
    charge_B:{stock:"Look at the unit: $ per GB is a rate. charge_B is how fast the bill fills, so it's a flow.",conv:"charge_B is set by the price, but it's also what pours dollars into the bill. A rate that fills a stock is a flow."},
    rate_A:{stock:"The price never builds up: it's $8 for every GB. A constant is a converter.",flow:"rate_A is a number printed on the price list. Nothing pours through it: it's used to set how fast charge_A fills the bill, so it's a converter."},
    rate_B:{stock:"The price never builds up: it's $3 for every GB. A constant is a converter.",flow:"rate_B is a number printed on the price list. Nothing pours through it: it's used to set how fast charge_B fills the bill, so it's a converter."}},
  extras:[{id:"g",lab:"g",desc:"The GB she uses in the month",unit:"GB",to:"clock",why:"<b>g</b> is the clock here: each tick is one more GB, and every flow moves its stuff once.",fb:"<b>g</b> is what ticks in this model: each GB she uses. Drop it on the clock above the diagram."},
    {id:"fixed_A",lab:"fixed_A",desc:"Plan A's monthly fee: $20, paid once a month",unit:"",to:"cost_A",why:"Plan A's bill starts at the <b>$20</b> fee, at 0 GB.",fb:"<b>fixed_A</b> is paid once, so it's where Plan A's bill starts. Drop it in the “starts at” space inside Plan A's bill."},
    {id:"fixed_B",lab:"fixed_B",desc:"Plan B's monthly fee: $45, paid once a month",unit:"",to:"cost_B",why:"Plan B's bill starts at the <b>$45</b> fee, at 0 GB.",fb:"<b>fixed_B</b> is paid once, so it's where Plan B's bill starts. Drop it in the “starts at” space inside Plan B's bill."}],
  sortWhy:{cost_A:"Stock: the bill builds up as she uses data.",cost_B:"Stock: the bill builds up as she uses data.",charge_A:"Flow: the rate the bill fills at.",charge_B:"Flow: the rate the bill fills at.",rate_A:"Converter: a number from the price list.",rate_B:"Converter: a number from the price list."},
  notDrawn:"<b>g</b> isn't a shape: it's the clock that runs the diagram. The monthly fees, <b>fixed_A</b> and <b>fixed_B</b>, are written inside the bill boxes: each bill starts there, at 0 GB.",
  pipes:[{f:"charge_A",a:"cloud",b:"cost_A",q:"Where does <b>charge_A</b> move money from, and where to?",opts:[
      {h:"Out of cost_A, to outside the model",fb:"Then the bill would shrink as she uses more data. Each GB adds to the bill."},
      {h:"From outside the model into cost_A",ok:true,why:"The money comes from her wallet, which the model doesn't track: the spiral. It pours into Plan A's bill."},
      {h:"From cost_A into cost_B",fb:"The two plans are separate bills. She pays one or the other, so money never moves between them."}]},
    {f:"charge_B",a:"cloud",b:"cost_B",q:"And where does <b>charge_B</b> move money?",opts:[
      {h:"From outside the model into cost_B",ok:true,why:"The same shape as Plan A: money from outside pours into Plan B's bill."},
      {h:"From cost_B into cost_A",fb:"The two plans are separate bills, so money never moves between them."},
      {h:"Out of cost_B, to outside the model",fb:"Then Plan B's bill would shrink as she uses more data."}]}],
  links:[{a:"rate_A",b:"charge_A"},{a:"rate_B",b:"charge_B"}],
  linkFb:{"cost_A>charge_A":"Does each GB cost more when the bill is already big? No: every GB adds the same $8, so charge_A doesn't use cost_A.",
    "cost_B>charge_A":"Plan B's bill has nothing to do with Plan A's charges.","rate_B>charge_A":"That's Plan B's price. charge_A uses Plan A's price.","charge_B>charge_A":"The two plans' charges don't affect each other.",
    "!rate_A>charge_A":"How many dollars does each GB add on Plan A? That number is on Plan A's price list.",
    "cost_B>charge_B":"Does each GB cost more when the bill is already big? No: every GB adds the same $3, so charge_B doesn't use cost_B.",
    "cost_A>charge_B":"Plan A's bill has nothing to do with Plan B's charges.","rate_A>charge_B":"That's Plan A's price. charge_B uses Plan B's price.","charge_A>charge_B":"The two plans' charges don't affect each other.",
    "!rate_B>charge_B":"How many dollars does each GB add on Plan B? That number is on Plan B's price list."},
  linkWhy:{charge_A:"charge_A = rate_A: $8 for every GB.",charge_B:"charge_B = rate_B: $3 for every GB."},
  why:[
    {id:"nofb",at:"charge_A",q:"No connector runs from cost_A to charge_A. What does that tell you?",opts:[
      {h:"The bill never changes",fb:"charge_A still pours $8 in for every GB. It just doesn't depend on how big the bill already is."},
      {h:"Every GB adds the same $8, however big the bill already is",ok:true,why:"So the bill climbs by the same amount for every GB: a straight line whose slope is rate_A."},
      {h:"cost_A doesn't depend on rate_A",fb:"It does: rate_A sets charge_A, and charge_A fills cost_A."}]},
    {id:"fee",at:"start:cost_A",q:"Where is Plan A's monthly fee, fixed_A = $20, in the diagram?",opts:[
      {h:"Written in the cost_A box: the bill starts at $20, at 0 GB",ok:true,why:"It's the stock's starting value. On the graph, it's where Plan A's line starts."},
      {h:"It's a flow into cost_A",fb:"A flow is a rate: dollars for each GB. The $20 is paid once, so it's where the bill starts."},
      {h:"It's a converter that points at charge_A",fb:"Then the fee would change how much each GB costs. It doesn't: each GB costs $8 whatever the fee is."}]},
    {id:"comp",at:"cost_B",q:"Compare the two halves of the diagram. Which bill starts higher, and which fills faster?",opts:[
      {h:"Plan A starts higher, and Plan B fills faster",fb:"Check the starting values in the boxes: $20 for A, $45 for B."},
      {h:"Plan B starts higher and fills faster",fb:"Plan B adds $3 for each GB and Plan A adds $8. Which pours in faster?"},
      {h:"Plan B starts higher, but Plan A fills faster",ok:true,why:"cost_B starts at $45 and cost_A at $20, but Plan A pours in $8 a GB and Plan B only $3. So Plan A's bill catches up: that's the crossing point you'll find."}]},
    {id:"code",at:"cost_A",q:"So after g GB, how much is in cost_A?",opts:[
      {h:"rate_A × g",fb:"That's only what flowed in. The stock didn't start empty."},
      {h:"fixed_A + rate_A × g",ok:true,why:"Where it starts, plus the flow for each GB times the GB she used. That's the set block you'll build for cost_A."},
      {h:"fixed_A × g + rate_A",fb:"That's the flat-fee fumble: the fee is paid once, and the price per GB is paid for every GB."}]}],
  toCode:"In Build, each bill is a set block: where the stock starts, plus what flowed in over g GB. {{cost_A = fixed_A + rate_A*g}} and {{cost_B = fixed_B + rate_B*g}}.",
  hints:{sort:["Ask about each quantity: is it an amount that builds up? A rate it fills at? Or a number from the price list?","Units help. cost_A is in $: an amount. charge_A is in $ per GB: a rate. rate_A is a price that never changes.",hsteps("cost_A and cost_B go in the boxes: the bills build up.","charge_A and charge_B go in the valves: the rates the bills fill at.","rate_A and rate_B go in the circles: prices from the price lists.","g goes on the clock. fixed_A and fixed_B go in the “starts at” spaces inside their bills.")],
    pipes:["Follow the money. Where is it before she pays it, and where does it end up?","Her wallet isn't part of the model, so the money comes from the spiral. Each GB adds to her bill.",hsteps("charge_A: from outside the model into cost_A.","charge_B: from outside the model into cost_B.")],
    links:["For each flow, ask: what would I need to know to work out how many dollars each GB adds?","Each GB adds exactly the plan's price per GB, however big the bill already is. So each charge needs only one quantity.",hsteps("Drag from rate_A to charge_A.","Drag from rate_B to charge_B.")]},
  L:{wide:{vb:[1000,640],pos:{charge_A:[370,150],cost_A:[665,150],rate_A:[470,285],charge_B:[370,455],cost_B:[665,455],rate_B:[470,590]},cl:{charge_A:[115,150],charge_B:[115,455]},lp:{rate_A:"r",rate_B:"r"},bend:{"rate_A>charge_A":-.18,"rate_B>charge_B":-.18}},
    tall:{tall:true,vb:[520,625],pos:{charge_A:[175,150],cost_A:[400,150],rate_A:[270,280],charge_B:[175,445],cost_B:[400,445],rate_B:[270,575]},cl:{charge_A:[45,150],charge_B:[45,445]},lp:{rate_A:"r",rate_B:"r"},bend:{"rate_A>charge_A":-.18,"rate_B>charge_B":-.18}}}};
MISSIONS.plans={
  id:"plans",title:"The Plan Puzzle",art:"plans",icon:"phone",chip:"var(--purple-chip)",bar:"#4EE5DB",
  tagline:"Three phone plans, one family. Build the cost models and find out which plan wins, and when.",
  blurb:"Three phone plans, one family. Find out which plan wins, and when.", short:"Which phone plan wins, and when?",
  introChip:`<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="13" y="4" width="22" height="40" rx="5" fill="#C4B0FB" stroke="${INK}" stroke-width="3.2"/><rect x="16.5" y="9" width="15" height="25" rx="2.5" fill="#FFFDFB" stroke="${INK}" stroke-width="2.2"/><path d="M19 29l4-6 3.5 3 3.5-7" fill="none" stroke="#FF7A59" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M21.5 39h5" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/></svg>`,
  brief:"Your cousin says Plan B is cheaper because its data costs less per GB. Build a model to check, and to see if her family of four should share a plan.",
  tags:["Math","Finance"],diff:"Easy",time:"~ 30 min",minutes:30,subj:"Finance, Algebra",grade:"Middle School",
  scene:()=>`${img("scene-plans.svg")}<img class="sbear talk" src="${A(BEARS.clip)}" alt="ModelQuest bear" data-sx=".6" data-sy=".08" style="right:4%;top:22%;width:24%">`,
  modeDesc:["Read the brief.","Name what you're measuring, and in what units.","Draw each bill as a stock that fills as she uses data.","Turn the price lists into code you can graph.","Write your model as equations, then solve them.","Check your model against values you already know.","Give your cousin advice you can back up."],
  doneLine:"You turned price lists into functions, coded a decision, and backed up a recommendation with your own model.",
  talk:["What changes when you use one more GB?","A plan is a fixed fee plus a rate.","Try your model at 0 GB first.","Where the lines cross, the plans cost the same."],
  problem:st=>{const V=VARS(st), t=st.d.tasks||{}, as=(st.d.def&&st.d.def.as)||ASM.filter(a=>a.sug).map(a=>a.k);
    if(st.step<=1) return `<p class="lead" style="margin-top:0">Your cousin is choosing between two phone plans. She says Plan B is cheaper because its data costs less per GB. She uses about <b>8 GB</b> of data a month.</p>
      <div class="pcards"><div class="pcard" style="--k:#DECFFD"><b>Plan A</b><span>$20 a month</span><span>+ $8 per GB</span></div><div class="pcard" style="--k:#FDC3CD"><b>Plan B</b><span>$45 a month</span><span>+ $3 per GB</span></div></div>
      <h3 class="ph">The question</h3><p class="ptext">Is she right? Which plan costs less, and does the answer change with how much data she uses?</p>
      <h3 class="ph">What you'll define</h3><ul class="plist"><li><b>g</b>: how much data she uses in a month. What unit is it measured in?</li><li><b>C</b>: what she pays each month. What unit?</li><li>For each plan, the <b>monthly fee</b> she pays no matter what, and the <b>price for each GB</b> she uses.</li></ul>`;
    return `<p class="lead" style="margin-top:0">Your cousin says Plan B is cheaper because its data costs less per GB. She uses about 8 GB a month. Build a model that settles it.</p>
      <div class="pcards"><div class="pcard" style="--k:#DECFFD"><b>Plan A</b><span>$20 a month</span><span>+ $8 per GB</span></div><div class="pcard" style="--k:#FDC3CD"><b>Plan B</b><span>$45 a month</span><span>+ $3 per GB</span></div>
      ${t.family?`<div class="pcard" style="--k:#C1FBE1"><b>Family plan</b><span>$40 a month</span><span>+ $10 per line</span><span>+ $4 per GB anyone uses</span></div>`:""}</div>
      <h3 class="ph">Variables</h3>${varTable(V)}
      <h3 class="ph">Your assumptions</h3><ul class="plist">${ASM.filter(a=>as.includes(a.k)).map(a=>`<li>${esc(a.t)}</li>`).join("")||"<li class=muted>None picked yet.</li>"}</ul>`},
  evidence:st=>[["Checks passed",st.d.passed!=null?`${st.d.passed} / 4`:"—"],["Bug found",st.d.bugOK?"Yes":"Not yet"],["Blocks in model",st.d.prog?String((()=>{let c=0; eachNode(st.d.prog.body,()=>c++); return c})()):"—"]],
  steps:[
  (el,st,ctx)=>introStep(el,MISSIONS.plans,st,ctx),
  (el,st,ctx)=>{
    const U=["— choose a unit —","GB per month","people","$ per month"];
    const rows=[{k:"ug",ic:"phone",c:"var(--pink-chip)",n:"Data each person uses, <i>g</i>",s:"Goes along the bottom of your graph",ans:"GB per month"},
      {k:"uc",ic:"dollar",c:"#7EF0D2",n:"Monthly cost, <i>C</i>",s:"What your model calculates",ans:"$ per month"}];
    const plans=[{k:"A",c:"#DECFFD",n:"Plan A",s:"$20 a month + $8 per GB",f:[["fA","fixed_A","$/mo",20],["rA","rate_A","$/GB",8]]},{k:"B",c:"#FDC3CD",n:"Plan B",s:"$45 a month + $3 per GB",f:[["fB","fixed_B","$/mo",45],["rB","rate_B","$/GB",3]]}];
    const d=st.d.def||(st.d.def={});
    defineShell(el,MISSIONS.plans,`
      ${rows.map(r=>`<div class="frow"><div class="chip" style="background:${r.c}">${ic(r.ic,2.4)}</div><div class="nm">${r.n}<small>${r.s}</small></div>
        <select class="field" id="d-${r.k}" aria-label="Unit">${U.map(u=>`<option ${d[r.k]===u?"selected":""}>${u}</option>`).join("")}</select></div>`).join("")}
      ${plans.map(p=>`<div class="frow"><div class="chip" style="background:${p.c};font:900 2.8rem/1 var(--font)">${p.k}</div><div class="nm">${p.n}<small>${p.s}</small></div>
        <div class="pair">${p.f.map(([k,name,u])=>`<label class="ufield inl sm2" id="w-${k}" title="${name}"><span class="vn">${name}</span><input id="d-${k}" inputmode="decimal" placeholder="?" value="${esc(d[k]??"")}" aria-label="${name} in ${u}"><span>${u}</span></label>`).join("")}</div></div>`).join("")}
      ${assumptionsHTML(ASM,d)}
      <div class="nextrow"><button class="btn next" id="dnext" disabled>Next ${ic("arrowR",2.8)}</button></div>`);
    const check=()=>{let all=true;
      rows.forEach(r=>{const s=$("#d-"+r.k,el); d[r.k]=s.value; const ok=s.value===r.ans; s.classList.toggle("bad",s.selectedIndex>0&&!ok); if(!ok)all=false});
      plans.forEach(p=>p.f.forEach(([k,,,ans])=>{const i=$("#d-"+k,el),w=$("#w-"+k,el); d[k]=i.value.trim(); const ok=d[k]!==""&&+d[k]===ans; w.classList.toggle("bad",d[k]!==""&&!ok); if(!ok)all=false}));
      if(!assumptionsCheck(el,ASM,d)) all=false;
      if(rows.every(r=>d[r.k]===r.ans)&&plans.every(p=>p.f.every(([k,,,a])=>+d[k]===a))) award("detective");
      $("#dnext",el).disabled=!all&&!S.teacher; save()};
    $$("select,input",el).forEach(x=>x.addEventListener("input",check)); $$("[data-as]",el).forEach(x=>x.addEventListener("change",check));
    check(); $("#dnext",el).onclick=ctx.next;
  },
  (el,st,ctx)=>diagramStep(el,MISSIONS.plans,st,ctx,DG),
  (el,st,ctx)=>{
    el.innerHTML=studioHTML({vizTitle:"Monthly Cost per Person",vizIc:"trend",vizChip:"var(--pink)"});
    const d=st.d; d.tasks=d.tasks||{}; d.mine=d.mine||[]; const prog=d.prog||(d.prog={body:[]}); const view=d.view||(d.view={g:8,n:4});
    let V=VARS(st), R=modelRunner(V,prog), last=R.at(view);
    const sliders=()=>{const sl=$("#sliders",el); sl.classList.toggle("two",!!V.n);
      sl.innerHTML=rangeHTML("sg",`g = ${view.g} GB`,0,30,0.5,view.g,"var(--yellow-btn)")+(V.n?rangeHTML("sn",`n = ${view.n} people`,1,6,1,view.n,"#7EF0D2"):"");
      $$(".rng",sl).forEach(r=>{paintRange(r); r.oninput=()=>{paintRange(r); view[r.id==="sg"?"g":"n"]=+r.value; save(); update()}})};
    const studio=blockStudio({pal:$("#pal",el),canvas:$("#cv",el),prog,cats:["v","m","l","o","g"],hat:HAT,
      vars:()=>V, lib:cat=>stdLib(cat,V,{loopNote:"Your plot runs the model at every g from 0 to 30 for you, so you may not need a loop here.",sayText:"Plan A"}),
      makeVar:makeVarFn(st,()=>V), varTip:(k,x)=>varTipHTML(k,x,last&&last.v[k]), onChange:()=>{st.runs=(st.runs||0)+1; save(); update()}});
    const update=()=>{
      V=VARS(st); R=modelRunner(V,prog); last=R.at(view); studio.mark(last.errs);
      const G=checks(st,R), first=G.find(g=>!g.ok);
      $("#goals",el).innerHTML=goalsHTML(G.map(g=>g===first?g:Object.assign({},g,{fb:""}))); goalHints($("#hintzone",el),st,first); trackGoals(st,G);
      // chart: every plot block, swept across its input
      const ps=last.plots, X=(ps[0]&&ps[0].x)||"g", xr=X==="n"?[1,6,1]:[0,30,.5], series=[]; let ymax=150;
      const used=ps.filter(p=>p.x===X);
      if(used.length){const runs=[]; for(let x=xr[0];x<=xr[1]+1e-9;x+=xr[2]) runs.push([x,R.at(Object.assign({},view,{[X]:x}))]);
        used.forEach((p,i)=>{const pts=runs.map(([x,e])=>[x,e.v[p.y]]).filter(q=>Number.isFinite(q[1])); pts.forEach(q=>ymax=Math.max(ymax,q[1]));
          const sty=STY[p.y]||{color:MINE_COL[i%4],dash:"",marker:"circle",name:p.y};
          series.push(Object.assign({key:p.y,label:sty.name,pts,dots:Number.isFinite(last.v[p.y])?[[view[X],last.v[p.y]]]:[]},sty))})}
      ymax=clamp(Math.ceil(ymax/50)*50,150,600); const yt=[]; for(let t=0;t<=ymax;t+=ymax>300?100:50) yt.push(t);
      $("#viz",el).innerHTML=(series.length?`<div class="legend">${series.map(s=>`<span><i style="--k:${s.color}"></i>${esc(s.label)}</span>`).join("")}</div>`:"")+
        lineChart({w:740,h:series.length?372:400,x:[xr[0],xr[1]],y:[0,ymax],xt:X==="n"?[1,2,3,4,5,6]:[0,5,10,15,20,25,30],yt,yf:t=>"$"+t,xl:X==="n"?"n (people sharing)":"g (GB per person)",yl:"cost ($ per month)",series,aria:"Cost against data used",
          hover:x=>{if(!series.length) return null; const xv=X==="n"?Math.round(clamp(x,1,6)):Math.round(clamp(x,0,30)*2)/2, e=R.at(Object.assign({},view,{[X]:xv})); return {x:xv,html:`<b>${X} = ${fmt(xv,xv%1?1:0)}</b><br>`+used.map(p=>`${esc(p.y)}: ${money(e.v[p.y])}`).join("<br>")}}})+
        (series.length?"":`<p class="chart-empty">Add a <b>plot</b> block from <b>Graph</b> to draw your costs.</p>`);
      wireHover(el);
      const errs=Object.values(last.errs), out=$("#out",el);
      const vals=Object.keys(V).filter(k=>(V[k].kind==="out"||V[k].kind==="mine")&&last.set.has(k)).map(k=>[k,V[k].kind==="out"?money(last.v[k]):sayText(last.v[k])]);
      const info={errs,said:last.out.map(sayText),vals,ins:[`g = ${view.g} GB`].concat(V.n?[`n = ${view.n} ${view.n>1?"people":"person"}`]:[])};
      if(errs.length) setOut(out,errs[0],true,info);
      else{const bits=vals.map(([k,x])=>`${k} = ${x}`);
        if(last.out.length) bits.unshift(`says “${sayText(last.out[last.out.length-1])}”`);
        setOut(out,"> "+(bits.length?bits.join("  ·  "):"build a cost to see it here"),false,info)}
      $("#sg-lab",el)&&($("#sg-lab",el).textContent=`g = ${view.g} GB`); $("#sn-lab",el)&&($("#sn-lab",el).textContent=`n = ${view.n} ${view.n>1?"people":"person"}`);
      $("#nextb",el).disabled=!S.teacher&&!(G.every(g=>g.ok)&&d.tasks.family);
      if(G[0].ok&&G[1].ok) award("crosser");
      // pop-up tasks
      if(!d.tasks.cheaper&&G.slice(0,3).every(g=>g.ok)){d.tasks.cheaper=true; save(); setTimeout(()=>taskPopup({title:"Your cousin wants a straight answer",html:`<p>“I don't want to read a graph. Just tell me which plan to get.”</p><p>Add code that <b>says</b> which plan is cheaper for whatever data use the g slider is set to. It has to work for any g, not just 8 GB.</p><div class="tasknote">${ic("logic",2.4)}<span>You'll need a comparison and an <b>if … else</b> block from <b>Logic</b>, and a <b>say</b> block from <b>Graph</b>.</span></div>`,onClose:update}),700); return update()}
      else if(d.tasks.cheaper&&!d.tasks.family&&G.find(g=>g.k==="say")&&G.find(g=>g.k==="say").ok){d.tasks.family=true; save(); V=VARS(st); sliders();
        setTimeout(()=>taskPopup({title:"Her mom has another idea",html:`<p>“There are four of us. What if we all shared a family plan?”</p><div class="pcards"><div class="pcard" style="--k:#C1FBE1"><b>Family plan</b><span>$40 a month for the account</span><span>+ $10 for each line</span><span>+ $4 for every GB anyone uses</span></div></div><p>Build <b>family_each</b>: what each person pays when <b>n</b> people share the plan and each uses <b>g</b> GB. New variables are in your library, and a new <b>n</b> slider is in the console.</p>`,onClose:update}),700); return update()}
    };
    sliders(); studio.draw(); update();
    $("#back",el).onclick=ctx.back; $("#nextb",el).onclick=ctx.next;
  },
  (el,st,ctx)=>equationStep(el,MISSIONS.plans,st,ctx,EQ),
  (el,st,ctx)=>{
    const V=VARS(st), R=modelRunner(V,st.d.prog||{body:[]}), v=(k,g,n=1)=>R.at({g,n}).v[k];
    TIPV=k=>V[k]?varTipHTML(k,V[k]):null;
    const T=[
      {id:"t1",name:"No data costs the fixed fee",code:"check cost_A = $20 when g = 0",f:()=>{const x=v("cost_A",0); return [near(x,20),x]}},
      {id:"t2",name:"Plan B at 5 GB",code:"check cost_B = $60 when g = 5",f:()=>{const x=v("cost_B",5); return [near(x,60),x]}},
      {id:"t3",name:"The two plans meet",code:"check cost_A = cost_B when g = 5",f:()=>{const a=v("cost_A",5),b=v("cost_B",5); return [Number.isFinite(a)&&near(a,b),a,b]}},
      {id:"t4",name:"Sharing gets cheaper",code:"expect family_each to drop as n goes 1 → 4",ic:"users",chip:"var(--lav)",f:()=>{const a=v("family_each",5,1),b=v("family_each",5,4); return [Number.isFinite(a)&&Number.isFinite(b)&&b<a&&near(b,40),a,b]}}];
    const bug={body:[Object.assign(newNode("set",{f:{v:"cost_A"}}),{a:{x:Object.assign(newNode("add"),{a:{a:Object.assign(newNode("mul"),{a:{a:"20",b:newNode("var",{f:{v:"g"}})}}),b:"8"}})}})]};
    el.innerHTML=`<div class="card tsec reveal"><div class="tsec-h"><h2>Check your model</h2><button class="btn" id="runall">${ic("playf",2)}Run all checks</button></div>
        <p class="lead">A green run is not enough. Each check asks your model a question you already know the answer to.</p>
        <div class="tests" data-stagger>${T.map(testCard).join("")}</div><div id="tfb" style="margin-top:2.2rem"></div></div>
      <div class="card tsec reveal">
        <div class="tsec-h"><div class="chip" style="width:5.4rem;height:5.4rem;background:var(--pink-soft)">${ic("bug",2.4)}</div><h2>Bug hunt: the flat-fee fumble</h2></div>
        <p class="lead">A classmate built Plan A like this. Both numbers come from the price list. Something is still wrong.</p>
        <div class="canvasbox card ro" style="box-shadow:none;margin-bottom:2.4rem;padding:2.6rem 2rem"><div class="script">${HAT}<div class="stack root">${bug.body.map(n=>rNode(n,{pal:true,vars:V,menus:()=>[["cost_A","cost_A"]]})).join("")}</div></div></div>
        <div class="split"><div><b style="font-size:2.2rem">At 0 GB, this model says the bill is</b><div class="ufield" id="bw1" style="margin-top:1rem"><input id="b1" inputmode="decimal" placeholder="?" value="${esc(st.d.b1??"")}" aria-label="Classmate's model at 0 GB"><span>$/mo</span></div></div>
          <div><b style="font-size:2.2rem">At 0 GB, the real bill should be</b><div class="ufield" id="bw2" style="margin-top:1rem"><input id="b2" inputmode="decimal" placeholder="?" value="${esc(st.d.b2??"")}" aria-label="Correct bill at 0 GB"><span>$/mo</span></div></div></div>
        <div style="margin-top:2rem;display:flex;gap:1.6rem;align-items:center;flex-wrap:wrap"><button class="btn sm lav" id="bcheck">${ic("check",2.6)}Check my answers</button><span id="bfb" class="fb" style="margin:0"></span></div>
      </div>
      <div class="ex-btns" style="margin-left:0"><button class="btn back" id="back">${ic("arrowL",2.8)}Equation</button><button class="btn submit" id="nextb" disabled>Explain ${ic("arrowR",2.8)}</button></div>`;
    const gate=()=>{$("#nextb",el).disabled=!S.teacher&&!(st.d.passed===4&&st.d.bugOK)};
    const runAll=fresh=>{let n=0; T.forEach(t=>{const [p,...vals]=t.f(); if(p)n++; setTest(el,t.id,p,`Your model says: <b>${vals.map(x=>money(x)).join(" → ")}</b>`)}); st.d.passed=n; save();
      $("#tfb",el).innerHTML=n===4?`<div class="callout mint"><div><h4>All four checks pass.</h4><p>Your model agrees with every value you could work out by hand.</p></div></div>`:`<div class="callout pink"><div><h4>${4-n} check${4-n>1?"s":""} failed.</h4><p>Go back to Build, fix the block that feeds that number, and run the checks again. Failing a check is how models get better.</p></div></div>`;
      if(fresh&&n===4) celebrate($("#runall",el)); gate()};
    $("#runall",el).onclick=()=>runAll(true); if(st.d.passed!=null) runAll(false);
    const bc=()=>{const a=$("#b1",el).value,b=$("#b2",el).value; st.d.b1=a; st.d.b2=b; const okA=a!==""&&+a===8, okB=b!==""&&+b===20;
      $("#bw1",el).className="ufield "+(a===""?"":okA?"":"bad"); $("#bw2",el).className="ufield "+(b===""?"":okB?"":"bad");
      $("#bfb",el).textContent=okA&&okB?"Exactly. 20 and 8 swapped roles: the fixed fee got multiplied by data, and the rate became the starting price.":okA?"Right about the bug. What does Plan A charge before any data is used?":a!==""?"Put g = 0 into 20 × g + 8. What's left?":"";
      if(okA&&okB){st.d.bugOK=true; award("debugger")} save(); gate()};
    $("#bcheck",el).onclick=bc; if(st.d.b1) bc();
    $("#back",el).onclick=ctx.back; $("#nextb",el).onclick=ctx.next; gate();
  },
  (el,st,ctx)=>{
    const V=VARS(st), R=modelRunner(V,st.d.prog||{body:[]}), v=(k,g,n=1)=>R.at({g,n}).v[k];
    let cross=null; for(let g=0;g<=30.0001;g+=0.01){const a=v("cost_A",g),b=v("cost_B",g); if(!Number.isFinite(a)||!Number.isFinite(b)) break; if(a>=b){cross=[Math.round(g*100)/100,a]; break}}
    const asl={tax:"Taxes and fees",cap:"Same data every month",dev:"Phone payments"};
    const PL=[["","— choose a plan —"],["A","Plan A"],["B","Plan B"],["F","Family plan"]];
    explainShell(el,MISSIONS.plans,`
      <div class="result"><span class="k">Break-even</span><span class="vsep"></span><span class="v">${cross?`${fmt(cross[0],cross[0]%1?1:0)} GB · ${money(cross[1])}`:"not found"}</span></div>
      <div class="erow"><span class="etag adv">Advice</span><div style="display:grid;gap:1.6rem">
        <label style="font:700 2.2rem/1.3 var(--font)">Your cousin, on her own, 8 GB a month <span class="muted" style="font-weight:500">(A: ${money(v("cost_A",8))}, B: ${money(v("cost_B",8))})</span><select class="field" id="a1" style="margin-top:.8rem">${PL.map(o=>`<option value="${o[0]}" ${st.d.a1===o[0]?"selected":""}>${o[1]}</option>`).join("")}</select></label>
        <label style="font:700 2.2rem/1.3 var(--font)">The family of four, 8 GB each <span class="muted" style="font-weight:500">(family plan: ${money(v("family_each",8,4))} each)</span><select class="field" id="a2" style="margin-top:.8rem">${PL.map(o=>`<option value="${o[0]}" ${st.d.a2===o[0]?"selected":""}>${o[1]}</option>`).join("")}</select></label>
        <p class="fb" id="afb" style="margin:0"></p></div></div>
      <div class="erow"><span class="etag why">Why?</span><textarea class="etext" id="why" rows="2" placeholder="Plan B costs more to start, but each GB is cheaper, so once you use more than … GB …">${esc(st.d.why||"")}</textarea></div>
      <div class="erow"><span class="etag lim">Limitations</span><div>${(st.d.def&&st.d.def.as||[]).filter(k=>asl[k]).length?`<div style="display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:1.2rem">${st.d.def.as.filter(k=>asl[k]).map(k=>`<span class="pill easy aspill">${asl[k]}</span>`).join("")}</div>`:""}
        <textarea class="etext" id="lim" rows="2" placeholder="What would change your advice? What if her data use isn't the same every month?">${esc(st.d.lim||"")}</textarea></div></div>`);
    ["why","lim","a1","a2"].forEach(k=>$("#"+k,el).addEventListener("input",e=>{st.d[k]=e.target.value; save()}));
    $("#back",el).onclick=ctx.back;
    $("#sub",el).onclick=()=>{const a1=$("#a1",el).value,a2=$("#a2",el).value,why=$("#why",el).value.trim(); const fb=$("#afb",el);
      $("#a1",el).className="field "+(a1&&a1!=="B"?"bad":""); $("#a2",el).className="field "+(a2&&a2!=="F"?"bad":"");
      if(a1!=="B"){fb.textContent=a1?"Check your model at g = 8, n = 1: which cost is smallest?":"Choose a plan for your cousin.";return}
      if(a2!=="F"){fb.textContent=a2?"Slide n to 4 and g to 8. Compare the family line with the two solo plans.":"Choose a plan for the family.";return}
      if(why.length<15){fb.textContent="Add a sentence to Why? that uses a number from your model.";$("#why",el).focus();return}
      fb.textContent=""; completeMission("plans")};
  }]
};
const ASM=[{k:"fee",t:"Each plan charges a monthly fee plus a price for each GB",ok:true,sug:true},
  {k:"tax",t:"Taxes and fees are left out",ok:true},{k:"cap",t:"She uses about the same amount of data every month",ok:true},{k:"dev",t:"Paying off the phone itself is left out",ok:true},
  {k:"use",t:"How much data she uses doesn't matter",ok:false,why:"Data use is the input g. The whole model is about how the cost changes with it."},
  {k:"rise",t:"Prices will go up next year",ok:false,why:"Nothing in the brief says prices change. Leave that out of this model."}];
MISSIONS.plans.eq=EQ; MISSIONS.plans.dg=DG;
})();
