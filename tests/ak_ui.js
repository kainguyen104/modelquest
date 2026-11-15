// answer key UI: the closed button never covers a page control at the bottom of a step; the panel can be dragged and
// put back; Escape closes it; it steps aside from what was just filled in; it is a bottom sheet on phones (W=390 TOUCH=1)
const assert = require('node:assert/strict');

module.exports=async(p,H)=>{const TAG=process.env.TAG||'u', W=+(process.env.W||1448);
  const st0=H.state({plans:{step:0,reached:7,d:{}},decay:{step:0,reached:7,d:{}},fire:{step:0,reached:7,d:{}}},{teacher:true,sv:3});
  await H.open('plans',st0);
  const go=async(id,s)=>{await p.evaluate(([id,s])=>{location.hash=id; S.missions[id].step=s; route()},[id,s]); await p.waitForTimeout(350)};
  const hits=[];
  for(const id of ['plans','decay','fire']) for(let s=0;s<7;s++){await go(id,s);
    await p.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight)); await p.waitForTimeout(120);
    const r=await p.evaluate(()=>{const f=document.querySelector('.akfab').getBoundingClientRect(); const o=[];
      document.querySelectorAll('#view button, #view a, #view input, #view select, #view textarea').forEach(b=>{const q=b.getBoundingClientRect(); if(!q.width||!q.height) return;
        const ov=Math.max(0,Math.min(f.right,q.right)-Math.max(f.left,q.left))*Math.max(0,Math.min(f.bottom,q.bottom)-Math.max(f.top,q.top)); if(ov>4) o.push((b.innerText||b.id||b.className).toString().replace(/\s+/g,' ').slice(0,24))});
      return o});
    if(r.length) hits.push(`${id} ${s}: ${r.join(', ')}`)}
  console.log('button over page controls at the bottom of a step:',hits.length?hits:'none');
  await go('plans',1); await H.shot(`ak/${TAG}_fab`);
  await p.click('.akfab'); await p.click('[data-aknext]'); await p.waitForTimeout(700);
  const where=await p.evaluate(()=>{const a=document.querySelector('.akpanel').getBoundingClientRect(), t=document.querySelector('#d-ug').getBoundingClientRect();
    return {panelLeft:Math.round(a.left),covers:!(a.right<t.left||a.left>t.right||a.bottom<t.top||a.top>t.bottom),inView:a.left>=0&&a.top>=0&&a.right<=innerWidth&&a.bottom<=innerHeight}});
  console.log('after filling units:',JSON.stringify(where));
  if(W>560){const h=await p.locator('.akht').boundingBox(); await p.mouse.move(h.x+20,h.y+10); await p.mouse.down(); await p.mouse.move(h.x+300,h.y-60,{steps:6}); await p.mouse.move(h.x+700,h.y-120,{steps:6}); await p.mouse.up();
    const a=await p.evaluate(()=>{const r=document.querySelector('.akpanel').getBoundingClientRect(); return {l:Math.round(r.left),t:Math.round(r.top),ok:r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight}});
    // a dragged panel stays put when the next answer goes in
    await p.click('[data-aknext]'); await p.waitForTimeout(700); const b=await p.evaluate(()=>Math.round(document.querySelector('.akpanel').getBoundingClientRect().left));
    console.log('dragged to',JSON.stringify(a),'| stays after next answer:',b===a.l);
    await p.dblclick('.akht'); console.log('right gap after double-click:',await p.evaluate(()=>Math.round(innerWidth-document.querySelector('.akpanel').getBoundingClientRect().right)))}
  else {
    const sheet = await p.locator('.akpanel').evaluate(panel => {
      const { left, right, bottom } = panel.getBoundingClientRect();
      return { left, right, bottom, width: innerWidth, height: innerHeight };
    });
    assert.equal(sheet.width, W);
    assert.ok(sheet.left <= 16 && sheet.width - sheet.right <= 16 && sheet.height - sheet.bottom <= 16);
    console.log('phone sheet:', sheet);
    await H.shot(`ak/${TAG}_sheet`);
  }
  await p.focus('[data-aknext]'); await p.keyboard.press('Escape'); await p.waitForTimeout(80);
  console.log('Escape closed:',!(await p.$('.akpanel')),'| focus on button:',await p.evaluate(()=>!!document.activeElement&&document.activeElement.classList.contains('akfab')),'| button:',await p.evaluate(()=>document.querySelector('.akfab').innerText.replace(/\s+/g,' ')));
  // a student never gets it
  await p.evaluate(()=>{S.teacher=false; S.role="student"; applyRole(); route()}); await p.waitForTimeout(300);
  const sees=!!(await p.$('.akfab')); console.log('student sees the button:',sees); if(sees) throw new Error('a student can see the answer key');
};
