const ROOT=require('path').resolve(__dirname,'..');
// hovering an entry in "Your diagram" shows that part's card on the diagram and rings it
module.exports=async(p,H)=>{
  const st=H.state({decay:{step:2,reached:2,d:{}}},{sv:3,teacher:true});
  await H.open('decay',st); await p.waitForTimeout(300);
  await p.click('[data-ph="read"]'); await p.waitForTimeout(300);
  await p.hover('.dgnl[data-hk="H>k"]'); await p.waitForTimeout(150);
  console.log('hover H→k entry:',await p.evaluate(()=>{const i=document.querySelector('#dginfo'); return (i.hidden?'(hidden)':i.innerText.replace(/\s+/g,' '))+' | ringed: '+!!document.querySelector('[data-l="H>k"].focus')}));
  await (await p.$('.dgbody')).screenshot({path:ROOT+'/shots/dg2_record.png'});
  await p.hover('.dgpart[data-hk="k"]'); await p.waitForTimeout(150);
  console.log('hover k part:',await p.evaluate(()=>{const i=document.querySelector('#dginfo'); return (i.hidden?'(hidden)':i.innerText.replace(/\s+/g,' ').slice(0,80))+' | ringed: '+!!document.querySelector('[data-n="k"].focus')}));
  await p.mouse.move(5,5); await p.waitForTimeout(150);
  console.log('after leaving:',await p.evaluate(()=>document.querySelector('#dginfo').hidden),'| rings left:',await p.evaluate(()=>[...document.querySelectorAll('.dgn.focus,.dglink.focus')].map(e=>e.dataset.n||e.dataset.l).join(',')));
};
