const ROOT=require('path').resolve(__dirname,'..');
// block-studio test harness: node bt.js <script.js>  (script exports async (p,h)=>{})
const {chromium}=require('playwright');
const blank=()=>({step:0,reached:0,done:false,d:{},runs:0,hints:0});
const H={
  state(over,o={}){const S={teacher:!!o.teacher,role:o.teacher?"teacher":"student",roleSet:true,hints:true,badges:{},missions:{plans:blank(),decay:blank(),fire:blank()}}; if(o.sv) S.sv=o.sv; for(const k in over) Object.assign(S.missions[k],over[k]); return S},
};
module.exports=H;
if(require.main===module)(async()=>{
  const script=require(require('path').resolve(process.argv[2]));
  const b=await chromium.launch();
  const w=+(process.env.W||1448), hgt=+(process.env.HH||1086);
  const ctx=await b.newContext({viewport:{width:w,height:hgt},deviceScaleFactor:1,reducedMotion:'reduce',hasTouch:!!process.env.TOUCH,isMobile:!!process.env.TOUCH});
  const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' @ '+(e.stack||'').split('\n').slice(1,4).join(' | '))); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  H.open=async(hash,state)=>{await p.addInitScript(st=>{try{if(!localStorage.getItem('__mqinit')&&!sessionStorage.getItem('mqinit')&&window.name!=='mqinit'){localStorage.clear(); if(st) localStorage.setItem('modelquest.v4',JSON.stringify(st)); localStorage.setItem('__mqinit','1'); sessionStorage.setItem('mqinit','1'); window.name='mqinit'}}catch(e){}},state||null);
    await p.goto('file://'+ROOT+'/index.html#'+hash); await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(400)};
  H.shot=async(name,full)=>{await p.screenshot({path:`${ROOT}/shots/${name}.png`,fullPage:!!full})};
  H.errs=errs;
  H.cat=async c=>{const open=await p.evaluate(c=>!!document.querySelector('.flyout')&&document.querySelector(`.ptab[data-cat="${c}"]`).getAttribute('aria-expanded')==='true',c); if(!open) await p.click(`.ptab[data-cat="${c}"]`); await p.waitForSelector('.flyout')};
  H.tap=async(c,label)=>{await H.cat(c); await p.click(`.flyout [aria-label="${label}"]`); await p.waitForTimeout(60)};
  H.goals=async()=>p.evaluate(()=>[...document.querySelectorAll('#goals .goal, #tips li')].map(g=>(g.classList.contains('ok')?'✓ ':'✗ ')+g.innerText.replace(/\s+/g,' ').slice(0,150)));
  H.drag=async(from,to,opt={})=>{const a=await p.locator(from).first().boundingBox(); const t=typeof to==='string'?await p.locator(to).first().boundingBox():to;
    const sx=a.x+(opt.fx??12), sy=a.y+a.height/2; const tx=t.x+(opt.tx??t.width/2), ty=t.y+(opt.ty??t.height/2);
    await p.mouse.move(sx,sy); await p.mouse.down(); await p.mouse.move(sx+10,sy+6,{steps:2}); await p.mouse.move(tx,ty,{steps:8}); if(opt.shot) await H.shot(opt.shot); await p.mouse.up(); await p.waitForTimeout(80)};
  try{await script(p,H)}catch(e){console.log('SCRIPT ERROR',e.message)}
  console.log(errs.length?'ERRORS:\n'+errs.join('\n'):'no page errors');
  await b.close();
})();
