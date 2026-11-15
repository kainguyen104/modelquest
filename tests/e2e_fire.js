const ROOT=require('path').resolve(__dirname,'..');
module.exports=async(p,H)=>{
  const st=H.state({fire:{step:1,reached:1,d:{}}});
  await H.open('fire',st);
  await p.fill('#d-q1','0.3'); console.log('q fb:',await p.textContent('#qfb'));
  await p.fill('#d-q1','0.7'); await p.fill('#d-q2','0.0007'); await p.check('[data-as="once"]');
  console.log('next disabled:',await p.evaluate(()=>document.querySelector('#dnext').disabled)); await p.click('#dnext'); await p.waitForTimeout(500);
  console.log('diagram step done:',await require(ROOT+'/tests/dgsolve.js')(p,'MISSIONS.fire.dg')); await H.shot('e2e_fire_dg',true); await p.click('#nextb'); await p.waitForTimeout(400);
  const fillEmpty=async t=>{await p.locator('#cv input.bin[value=""]').first().fill(t); await p.waitForTimeout(50)};
  const deselect=async()=>{const vh=p.viewportSize().height; let bb=await p.locator('#cv').boundingBox(); if(bb.y<0||bb.y+60>vh){await p.evaluate(y=>scrollBy(0,y),bb.y-200); bb=await p.locator('#cv').boundingBox()} await p.mouse.click(bb.x+6,bb.y+40)};
  const mouth=i=>p.locator('#cv .mouth[data-stack]').nth(i);
  const clickMouth=async i=>{const m=mouth(i); await m.evaluate(e=>{const cv=document.querySelector('#cv'), cr=cv.getBoundingClientRect(), r=e.getBoundingClientRect(); cv.scrollTop+=r.top-cr.top-cr.height/2+r.height/2}); await m.scrollIntoViewIfNeeded(); await p.waitForTimeout(30); const bb=await m.boundingBox(), cb=await p.locator('#cv').boundingBox(); const x=Math.min(bb.x+bb.width,cb.x+cb.width-20)-14, y=bb.y+Math.min(bb.height/2,20); if(process.env.DBG) console.log('click mouth',i,await p.evaluate(([x,y])=>{const e=document.elementFromPoint(x,y); return e?(e.tagName+'.'+e.className+' '+(e.dataset.stack||'')):'null'},[x,y]), await m.getAttribute('data-stack')); await p.mouse.click(x,y)};
  const setSel=async(loc,val)=>{await loc.selectOption(val); await p.waitForTimeout(50)};
  // Run before choosing the mode
  await p.click('#frun'); console.log('bubble:',await p.textContent('#lbub'));
  // rule 1: if state = burning then become empty
  await H.tap('l','Add if block'); await H.tap('l','Add = block'); await H.tap('f','Add state block'); await H.tap('f','Add state name block');
  await setSel(p.locator('#cv select[data-m]').last(),'2');
  await clickMouth(0); await H.tap('f','Add become block'); await setSel(p.locator('#cv .mouth select[data-m]').last(),'0');
  console.log('after burn rule:\n'+(await H.goals()).join('\n'));
  // rule 2: if state = tree then (if-else neighbours > 0 ...)
  await deselect(); await H.tap('l','Add if block'); await H.tap('l','Add = block'); await H.tap('f','Add state block'); await H.tap('f','Add state name block');
  await clickMouth(1); await H.tap('l','Add if-else block'); await H.tap('l','Add > block'); await H.tap('f','Add burning neighbours block'); await fillEmpty('0');
  // spread: try the classic mistake first (random < p_immune)
  await clickMouth(2); await H.tap('l','Add if block'); await H.tap('l','Add < block'); await H.tap('f','Add random block'); await H.tap('v','Add variable block p_immune');
  await clickMouth(3); await H.tap('f','Add become block');
  console.log('mistake:\n'+(await H.goals()).slice(1,2).join('\n'));
  // fix it: drag p_immune out to the library (remove), then 1 − p_immune
  await H.drag('#cv .b.vr[data-var="p_immune"]','#pal');
  await H.tap('m','Add − block'); await fillEmpty('1'); await H.tap('v','Add variable block p_immune');
  console.log('after spread:\n'+(await H.goals()).slice(0,3).join('\n'));
  // lightning in the else-mouth
  const elseIdx=await p.evaluate(()=>[...document.querySelectorAll('#cv .mouth[data-stack]')].findIndex(m=>m.dataset.stack.endsWith(':n')));
  await clickMouth(elseIdx); await H.tap('l','Add if block'); await H.tap('l','Add < block'); await H.tap('f','Add random block');
  await H.tap('m','Add × block'); await H.tap('v','Add variable block p_lightning'); await H.tap('m','Add − block'); await fillEmpty('1'); await H.tap('v','Add variable block p_immune');
  const lastMouth=await p.evaluate(()=>document.querySelectorAll('#cv .mouth[data-stack]').length-1);
  await clickMouth(lastMouth); console.log('lastMouth',lastMouth,'sel mouths:',await p.evaluate(()=>[...document.querySelectorAll('#cv .mouth')].map((m,i)=>m.classList.contains('sel')?i:-1).filter(i=>i>=0)));
  await H.tap('f','Add become block');
  await p.waitForTimeout(200);
  console.log('after light:\n'+(await H.goals()).join('\n'));
  console.log(await p.evaluate(()=>{const f=(n,ind)=>{if(!n||typeof n!=='object') return JSON.stringify(n); let s=n.type+(n.f.v?'['+n.f.v+']':'')+(n.f.k?'['+n.f.k+']':'')+'('+Object.values(n.a).map(x=>f(x)).join(', ')+')'; for(const k in n.b) s+='\n'+(ind||'')+'  '+k+': '+n.b[k].map(c=>f(c,(ind||'')+'    ')).join('\n'+(ind||'')+'    '); return s};
    return JSON.parse(localStorage.getItem('modelquest.v4')).missions.fire.d.prog.body.map(n=>f(n,'')).join('\n')}));
  await p.waitForSelector('#modal .modal',{timeout:4000}); await H.shot('fi_pop'); await p.click('#modal [data-close].btn'); await p.waitForTimeout(150);
  // counter
  await H.cat('v'); await p.fill('#mkv','caught'); await p.click('.mkvar button'); await p.waitForTimeout(200);
  const becomeMouths=await p.evaluate(()=>[...document.querySelectorAll('#cv .mouth[data-stack]')].map((m,i)=>[i,[...m.children].some(c=>c.matches('.b.st')&&c.textContent.trim().startsWith('become')&&c.querySelector('select').value==='2')]).filter(x=>x[1]).map(x=>x[0]));
  console.log('become mouths:',becomeMouths);
  for(const i of becomeMouths){await clickMouth(i); await H.tap('v','Add change block caught')}
  console.log('after count:\n'+(await H.goals()).join('\n'));
  // mode + run
  await setSel(p.locator('#fmode'),'next'); await p.waitForTimeout(100);
  await p.click('#fstep'); await p.waitForTimeout(100); console.log('stats after a step:',await p.textContent('#fstats'));
  await p.click('#frun'); await p.waitForFunction(()=>JSON.parse(localStorage.getItem('modelquest.v4')).missions.fire.d.ranOut===true,null,{timeout:90000}).catch(()=>console.log('no ranOut'));
  await p.waitForTimeout(300);
  console.log('final:\n'+(await H.goals()).join('\n')); console.log('eq:',await p.textContent('#eqbig'),'| next enabled:',await p.evaluate(()=>!document.querySelector('#nextb').disabled));
  await H.shot('fi_final'); await H.shot('fi_final_full',true);
  // Test
  await p.click('#nextb'); await p.waitForTimeout(400); console.log('equation step done:',await require(ROOT+'/tests/eqsolve.js')(p,'MISSIONS.fire.eq')); await H.shot('e2e_fire_eq',true); await p.click('#nextb'); await p.waitForTimeout(300); await p.click('#runall'); await p.waitForTimeout(200);
  console.log('checks pass:',await p.evaluate(()=>document.querySelectorAll('.status.pass').length));
  let t0=Date.now(); await p.click('#trun'); await p.waitForFunction(()=>!!JSON.parse(localStorage.getItem('modelquest.v4')).missions.fire.d.trial,null,{timeout:120000}); console.log('200 fires ms:',Date.now()-t0);
  t0=Date.now(); await p.click('#srun'); await p.waitForFunction(()=>!!JSON.parse(localStorage.getItem('modelquest.v4')).missions.fire.d.sweep,null,{timeout:180000}); console.log('sweep ms:',Date.now()-t0);
  await p.click('#crun'); await p.waitForFunction(()=>!!JSON.parse(localStorage.getItem('modelquest.v4')).missions.fire.d.challenged,null,{timeout:120000});
  console.log('sweep:',await p.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('modelquest.v4')).missions.fire.d.sweep.map(q=>[q[0],Math.round(q[1])]))));
  await H.shot('fi_test',true);
  await p.click('#nextb'); await p.waitForTimeout(300); await p.click('[data-ad="0.7-0.55"]'); await p.click('[data-sp="two"]'); await p.fill('#why','Below about 0.6, most fires die out early; above it they spread.'); await p.click('#sub'); await p.waitForTimeout(800);
  console.log('done:',await p.evaluate(()=>JSON.parse(localStorage.getItem('modelquest.v4')).missions.fire.done));
  await H.shot('fi_explain',true);
  require('fs').writeFileSync(ROOT+'/tests/fx_fire.json',await p.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('modelquest.v4')).missions.fire)));
};
