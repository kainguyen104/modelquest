// Answer key: on every step of every built-in mission, from a blank teacher state, press "Show answer" until all
// answers are in (closing the story pop-ups), check that the step's own checks pass, then Undo and check the page goes back.
module.exports=async(p,H)=>{const TAG=process.env.TAG||'f', ONLY=process.env.MID;
  const st0=H.state({plans:{step:0,reached:7,d:{}},decay:{step:0,reached:7,d:{}},fire:{step:0,reached:7,d:{}}},{teacher:true,sv:3}); st0.badges={};
  await H.open('plans',st0);
  const go=async(id,s)=>{await p.evaluate(([id,s])=>{location.hash=id; S.missions[id].step=s; route()},[id,s]); await p.waitForTimeout(300)};
  const idle=async()=>{await p.waitForFunction(()=>!document.querySelector('.akpanel.busy'),null,{timeout:70000}); await p.waitForTimeout(150)};
  const closeModal=async()=>{for(let k=0;k<3;k++){await p.waitForTimeout(850); const c=await p.$('#modal [data-close]'); if(!c) break; await c.click(); await p.waitForTimeout(120)}};
  const out=[], fails=[];
  for(const id of (ONLY?[ONLY]:['plans','decay','fire'])){
    for(let s=0;s<7;s++){await go(id,s);
      await p.click('.akfab'); await p.waitForTimeout(80);
      const n=await p.evaluate(()=>document.querySelectorAll('.akrow').length); let presses=0, shot=false;
      while(await p.$('[data-aknext]:not([disabled])')){const t=await p.$eval('[data-aknext]',b=>b.textContent); if(!/Show answer/.test(t)) break;
        await p.click('[data-aknext]'); presses++; await idle();
        if(!shot){await p.waitForTimeout(500); await H.shot(`ak/${TAG}_${id}_${s}_1`); shot=true}
        if(s!==6) await closeModal(); if(presses>20) break}
      await p.waitForTimeout(600); await H.shot(`ak/${TAG}_${id}_${s}_all`);
      const r=await p.evaluate(([id,s])=>{const st=S.missions[id], d=st.d, q=x=>document.querySelectorAll(x).length;
        if(s===1) return {bad:q('.dcard .bad'),asm:(document.querySelector('#asfb')||{}).className,okf:q('.dcard .ufield.ok')};
        if(s===2) return {dgDone:!!(d.dg&&d.dg.done)};
        if(s===3) return {goals:q('#goals .goal.ok')+q('#tips li.ok')+'/'+(q('#goals .goal')+q('#tips li')),ranOut:d.ranOut,mode:d.mode};
        if(s===4) return {eq:d.goalsDone+'/'+d.goalsTotal};
        if(s===5) return {passed:d.passed,bug:d.bugOK,bases:(d.bases||[]).length,trial:!!d.trial,sweep:!!d.sweep,cres:!!document.querySelector('#cres table')};
        if(s===6) return {a1:d.a1,a2:d.a2,ad:d.ad,sp:d.sp,why:(d.why||'').length,lim:(d.lim||'').length,ans:(d.ans||'').length,modal:!!document.querySelector('#modal .modal'),result:(document.querySelector('.ex .result')||{}).innerText};
        return {notes:q('.aknotes li')}},[id,s]);
      const filled=await p.evaluate(()=>(document.querySelector('.akprog')||{}).innerText||'');
      // close a modal left open by the last answer (decay's last check), then Undo and see the page go back
      await p.evaluate(()=>{const m=document.querySelector('#modal'); if(m) m.innerHTML=''});
      const und=await p.$('[data-akundo]'); let back='';
      if(und){await und.click(); await p.waitForTimeout(500);
        back=JSON.stringify(await p.evaluate(([id,s])=>{const d=S.missions[id].d; return s===1?d.def||null:s===2?(d.dg&&d.dg.done)||false:s===3?((d.prog&&d.prog.body)||[]).length:s===4?d.eq&&Object.keys(d.eq.ok||{}).length:s===5?[d.passed,d.trial?1:0]:s===6?[d.a1,d.why,d.ad]:document.querySelectorAll('.aknotes').length},[id,s]))}
      out.push(`${id} ${s}: ${n} tasks, ${presses} presses, ${filled} ${JSON.stringify(r)} | after undo: ${back}`);
      const want={plans:[4,4],decay:[5,5],fire:[5,5]}[id], frac=x=>{const [a,b]=String(x).split('/'); return a===b&&+b>0};
      const ok=s===0?r.notes>=n:s===1?r.bad===0&&/good/.test(r.asm):s===2?r.dgDone:s===3?frac(r.goals):s===4?frac(r.eq):s===5?r.passed===({plans:4,decay:5,fire:5}[id]):(r.why>15&&r.lim>15);
      const undone=s===0?back==="0":s===2?back==="false":s===3||s===4?back==="0"||back==="null"||back==="undefined":true;
      if(!ok||!undone||presses!==n) fails.push(`${id} ${s}`);
      await p.click('[data-akclose]').catch(()=>{});
    }}
  console.log(out.join('\n'));
  if(fails.length) throw new Error('answer key did not fill in or undo cleanly on: '+fails.join(', '));
};
