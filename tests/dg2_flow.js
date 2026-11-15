// a student builds the decay diagram by dragging, with one mistake of each kind
module.exports=async(p,H)=>{
  const st=H.state({decay:{step:2,reached:2,d:{def:{n0:"100",h:"5730",as:["half","clean"]}}}},{sv:3});
  await H.open('decay',st); await p.waitForTimeout(300);
  await p.evaluate(()=>document.querySelector('#dgb').scrollIntoView({block:'start'})); await p.waitForTimeout(150);
  const txt=async s=>(await p.$(s))?(await p.textContent(s)).replace(/\s+/g,' ').trim():'(none)';
  const bubble=async()=>p.evaluate(()=>{const b=document.querySelector('#dgbub:not([hidden]) .dgbin,#dgdock:not([hidden]) .dgbin'); return b?b.innerText.replace(/\s+/g,' ').trim():'(no bubble)'});
  const drag=async(src,tgt,shot)=>{const a=await p.locator(src).first().boundingBox(), b=await p.locator(tgt).first().boundingBox();
    if(!a||!b){console.log('MISSING',src,tgt,!!a,!!b); return}
    await p.mouse.move(a.x+a.width/2,a.y+a.height/2); await p.mouse.down(); await p.mouse.move(a.x+a.width/2+12,a.y+a.height/2+8,{steps:3});
    await p.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:10}); if(shot) await H.shot(shot); await p.mouse.up(); await p.waitForTimeout(160)};
  console.log('task:',await txt('#dgtask'));
  console.log('cards:',await p.$$eval('.dgcard',c=>c.map(x=>x.dataset.card).join(',')),'| slots:',await p.$$eval('[data-slot]',s=>s.map(x=>x.dataset.slot+':'+[...x.classList].join('.')).join(' ')));
  await H.shot('dg2_start');
  await drag('[data-card="decay"]','[data-slot="N"]','dg2_dragging');
  console.log('decay→box:',await bubble());
  await H.shot('dg2_wrong');
  await drag('[data-card="N"]','[data-slot="N"]'); console.log('N→box:',await bubble());
  await drag('[data-card="N0"]','#dgclock'); console.log('N0→clock:',await bubble());
  await drag('[data-card="N0"]','[data-start="N"]'); console.log('N0→start:',await bubble());
  await drag('[data-card="t"]','[data-slot="k"]'); console.log('t→circle:',await bubble());
  await drag('[data-card="t"]','#dgclock'); console.log('t→clock:',await bubble(),'| clock:',await txt('#dgclock'));
  await drag('[data-card="decay"]','[data-slot="decay"]');
  await drag('[data-card="k"]','[data-slot="H"]'); console.log('k→H slot:',await bubble(),'| k placed at its own spot:',await p.evaluate(()=>!!document.querySelector('[data-n="k"]')&&!!document.querySelector('[data-slot="H"]')));
  await drag('[data-card="H"]','[data-slot="H"]'); await p.waitForTimeout(1400);
  console.log('after place → task:',await txt('#dgtask h3'),'| bubble:',(await bubble()).slice(0,120));
  await H.shot('dg2_pipeq');
  let ch=await p.$$('[data-bq]'); await ch[0].click(); await p.waitForTimeout(120); console.log('pipe wrong:',(await bubble()).slice(-140));
  ch=await p.$$('[data-bq]'); await ch[1].click(); await p.waitForTimeout(150); console.log('pipe right:',(await bubble()).slice(-120),'| pipe drawn:',await p.evaluate(()=>!!document.querySelector('.dgpipe')));
  await p.click('[data-bnext]'); await p.waitForTimeout(300); console.log('links task:',await txt('#dgtask h3'));
  await drag('[data-n="H"]','[data-n="decay"]','dg2_rubber'); console.log('H→decay:',await bubble(),'| flash:',await p.evaluate(()=>!!document.querySelector('#dgfx .dglink.bad')));
  await H.shot('dg2_linkwrong');
  await drag('[data-n="decay"]','[data-n="N"]'); console.log('decay→N:',await bubble());
  await drag('[data-n="N"]','[data-n="decay"]'); console.log('N→decay:',await bubble());
  await drag('[data-n="k"]','[data-n="decay"]'); await drag('[data-n="H"]','[data-n="k"]'); console.log('H→k:',await bubble()); await p.waitForTimeout(1500);
  console.log('read task:',await txt('#dgtask h3'),'| bubble:',(await bubble()).slice(0,150));
  await H.shot('dg2_read');
  // hover info
  const hb=await p.locator('[data-n="N"]').boundingBox(); await p.mouse.move(hb.x+hb.width/2,hb.y+hb.height/2,{steps:4}); await p.waitForTimeout(150);
  console.log('hover N:',await p.evaluate(()=>{const i=document.querySelector('#dginfo'); return i.hidden?'(hidden)':i.innerText.replace(/\s+/g,' ')}));
  await H.shot('dg2_hover');
  ch=await p.$$('[data-bq]'); await ch[0].click(); await p.waitForTimeout(120); console.log('read wrong:',(await bubble()).slice(-120));
  for(let i=0;i<4;i++){const spec=await p.evaluate(()=>{const q=document.querySelector('.dgbin .dgbq'); return q?q.textContent:''}); const j=await p.evaluate(()=>{const qs=MISSIONS.decay.dg.why, t=document.querySelector('.dgbin .dgbq').textContent; const q=qs.find(x=>t.startsWith(x.q.replace(/<[^>]+>/g,'').slice(0,20))); return q?q.opts.findIndex(o=>o.ok):-1});
    ch=await p.$$('[data-bq]'); if(j<0||!ch[j]) {console.log('no q',spec); break} await ch[j].click(); await p.waitForTimeout(120); const nb=await p.$('[data-bnext]'); if(nb){await nb.click(); await p.waitForTimeout(250)}}
  console.log('done task:',(await txt('#dgtask')).slice(0,160),'| next enabled:',await p.evaluate(()=>!document.querySelector('#nextb').disabled));
  await p.waitForTimeout(300); console.log('state:',await p.evaluate(()=>{const d=JSON.parse(localStorage.getItem('modelquest.v4')).missions.decay.d.dg; return JSON.stringify({v:d.v,done:d.done,err:d.err})}));
  await H.shot('dg2_done');
};
