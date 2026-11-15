// completes the drag-and-drop Diagram step with the keyboard (pick a card, Enter on its spot; Enter on one shape, then another),
// using the spec the page itself holds (specExpr is evaluated in the page). Logs any feedback that says a move was wrong.
module.exports=async(p,specExpr,log=console.log)=>{
  const spec=await p.evaluate(e=>{const s=eval(e); return JSON.parse(JSON.stringify(s))},specExpr);
  const press=async sel=>{const e=await p.$(sel); if(!e){log('MISSING',sel); return false} await e.focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(40); return true};
  const fb=async what=>{const t=await p.evaluate(()=>{const b=document.querySelector('.dgbub.k-fb:not([hidden]) .dgbin,.dgdock.k-fb:not([hidden]) .dgbin'); return b?b.innerText.replace(/\s+/g,' ').trim():''}); if(t) log('NOT ACCEPTED',what+':',t)};
  const phase=()=>p.evaluate(()=>{const o=document.querySelector('.dgpp.on'); return o?o.textContent.trim():'done'});
  if(spec.sort!==false){
    for(const n of spec.nodes){if(!(await p.$(`.dgcard[data-card="${n.id}"]`))) continue; await press(`.dgcard[data-card="${n.id}"]`); await press(`[data-slot="${n.id}"]`); await fb('place '+n.id)}
    for(const x of spec.extras||[]){if(!(await p.$(`.dgcard[data-card="${x.id}"]`))) continue; await press(`.dgcard[data-card="${x.id}"]`); await press(x.to==='clock'?'#dgclock':`[data-start="${x.to}"]`); await fb('place '+x.id)}
    await p.waitForTimeout(150)}
  for(const pp of spec.pipes||[]){const j=pp.opts.findIndex(o=>o.ok); if(!(await p.$(`[data-nq="${pp.f}"][data-nk="pipe"]:not(.ok):not([disabled])`))) continue;
    await press(`[data-nq="${pp.f}"][data-nk="pipe"]`); await press(`[data-bq="${j}"]`)}
  if((spec.pipes||[]).length){const nx=await p.$('[data-bnext]'); if(nx){await nx.focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(150)}}
  for(const l of spec.links||[]){const done=await p.$(`[data-l="${l.a}>${l.b}"]`); if(done) continue; await press(`[data-n="${l.a}"]`); await press(`[data-n="${l.b}"]`); await fb(`link ${l.a}→${l.b}`)}
  await p.waitForTimeout(150);
  for(const q of spec.why||[]){const j=q.opts.findIndex(o=>o.ok); if(await p.$(`[data-nq="${q.id}"][data-nk="read"].ok`)) continue;
    await press(`[data-nq="${q.id}"][data-nk="read"]`); await press(`[data-bq="${j}"]`)}
  await p.waitForTimeout(120);
  const ok=await p.evaluate(()=>!document.querySelector('#nextb').disabled); if(!ok) log('diagram not finished; phase:',await phase()); return ok};
