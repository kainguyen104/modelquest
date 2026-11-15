const ROOT=require('path').resolve(__dirname,'..');
// phone (touch, 390 wide): tap a card, tap its spot; tap one shape then another; questions sit in a dock under the diagram
module.exports=async(p,H)=>{
  const st=H.state({decay:{step:2,reached:2,d:{}},fire:{step:2,reached:2,d:{}},plans:{step:2,reached:2,d:{}}},{sv:3});
  await H.open('fire',st); await p.waitForTimeout(400);
  const ovf=async()=>p.evaluate(()=>{const w=document.documentElement.clientWidth, bad=[...document.querySelectorAll('#view *')].filter(e=>{const r=e.getBoundingClientRect(); return r.width&&(r.right>w+1||r.left<-1)&&!e.closest('svg')}).slice(0,5).map(e=>(e.id||e.className)+':'+Math.round(e.getBoundingClientRect().left)+'..'+Math.round(e.getBoundingClientRect().right)); return {docw:document.documentElement.scrollWidth-w,bad}});
  const dock=async()=>p.evaluate(()=>{const d=document.querySelector('#dgdock'); return d.hidden?'(no dock)':d.innerText.replace(/\s+/g,' ').trim().slice(0,170)});
  const tap=async s=>{await p.tap(s); await p.waitForTimeout(120)};
  console.log('fire overflow:',JSON.stringify(await ovf()),'| layout tall:',await p.evaluate(()=>document.querySelector('#dgsvg').classList.contains('tall')));
  console.log('task:',(await p.textContent('#dgtask')).replace(/\s+/g,' ').trim().slice(0,200));
  await p.evaluate(()=>document.querySelector('#dgb').scrollIntoView({block:'start'})); await H.shot('dg2p_fire_top');
  await tap('.dgcard[data-card="catch_fire"]'); console.log('picked:',await p.evaluate(()=>document.querySelector('.dgcard.picked')?.dataset.card),'| pick note:',await p.evaluate(()=>document.querySelector('.dgpick')?.innerText.trim()));
  await H.shot('dg2p_picked');
  await tap('[data-slot="trees"]'); console.log('wrong tap → dock:',await dock()); await H.shot('dg2p_wrong',true);
  await tap('.dgcard[data-card="trees"]'); await tap('[data-slot="trees"]'); console.log('right tap → dock:',await dock());
  console.log('overflow mid:',JSON.stringify(await ovf()));
  // the rest of the cards and the pipes with the solver, then a connector by taps
  const spec=await p.evaluate(()=>JSON.parse(JSON.stringify(MISSIONS.fire.dg)));
  for(const n of spec.nodes){if(await p.$(`.dgcard[data-card="${n.id}"]`)){await tap(`.dgcard[data-card="${n.id}"]`); await tap(`[data-slot="${n.id}"]`)}}
  for(const x of spec.extras||[]){if(await p.$(`.dgcard[data-card="${x.id}"]`)){await tap(`.dgcard[data-card="${x.id}"]`); await tap(x.to==='clock'?'#dgclock':`[data-start="${x.to}"]`)}}
  await p.waitForTimeout(300); console.log('after placing → task:',(await p.textContent('#dgtask h3')).trim(),'| dock:',await dock());
  await (await p.$('#dgb')).screenshot({path:ROOT+'/shots/dg2p_pipe.png'});
  for(const pp of spec.pipes){const j=pp.opts.findIndex(o=>o.ok); await tap(`[data-nq="${pp.f}"][data-nk="pipe"]`); await tap(`#dgdock [data-bq="${j}"]`)}
  await tap('#dgdock [data-bnext]'); console.log('links task:',(await p.textContent('#dgtask h3')).trim());
  await tap('[data-n="burning"]'); console.log('tap source → dock:',await dock());
  await tap('[data-n="burn_out"]'); console.log('tap target → dock:',await dock(),'| link drawn:',!!(await p.$('[data-l="burning>burn_out"]')));
  await tap('[data-n="burned"]'); await tap('[data-n="catch_fire"]'); console.log('burned→catch_fire → dock:',await dock());
  await (await p.$('#dgb')).screenshot({path:ROOT+'/shots/dg2p_links.png'});
  console.log('solver:',await require(ROOT+'/tests/dgsolve.js')(p,'MISSIONS.fire.dg'));
  console.log('overflow done:',JSON.stringify(await ovf()));
  await (await p.$('#dgb')).screenshot({path:ROOT+'/shots/dg2p_done.png'});
  // explore questions in the dock on plans
  await p.evaluate(()=>{location.hash='plans'}); await p.waitForTimeout(500);
  console.log('plans overflow:',JSON.stringify(await ovf()));
  await H.shot('dg2p_plans_top');
};
