const ROOT=require('path').resolve(__dirname,'..');
module.exports=async(p,H)=>{
  await p.addInitScript({path:ROOT+'/tests/mockclaude.js'});
  // read uploads with the copies npm installed (falls back to the CDN when they're missing)
  await p.addInitScript(()=>{window.MQ_VENDOR={mammoth:"node_modules/mammoth/mammoth.browser.min.js",pdfw:"node_modules/pdfjs-dist/build/pdf.worker.min.js",pdf:"node_modules/pdfjs-dist/build/pdf.min.js",xlsx:"node_modules/xlsx/dist/xlsx.full.min.js"}});
  const db=()=>p.evaluate(()=>JSON.parse(localStorage.getItem("mock.db")||"{}"));
  const goals=async()=>p.evaluate(()=>[...document.querySelectorAll('#goals .goal')].map(g=>(g.classList.contains('ok')?'✓ ':'✗ ')+g.innerText.replace(/\s+/g,' ').slice(0,110)));
  await H.open('workspace',null); await p.waitForTimeout(700);
  console.log('teacher nav:',await p.evaluate(()=>[...document.querySelectorAll('.navlink')].filter(b=>getComputedStyle(b).display!=="none").map(b=>b.textContent.trim()).join(' | ')));
  await p.click('[data-topic="Finance"]'); await p.click('[data-diff="Easy"]'); await p.click('[data-mp="MP2"]');
  await p.click('#ai-ideas'); await p.waitForSelector('.idea',{timeout:8000}); console.log('ideas:',await p.$$eval('.idea b',b=>b.map(x=>x.textContent).join(' / ')));
  await H.shot('tm_ws_ideas',true);
  await p.click('[data-idea="3"]'); await p.waitForFunction(()=>location.hash.startsWith('#ws-'),null,{timeout:8000}); await p.waitForTimeout(500);
  const pid=await p.evaluate(()=>location.hash.slice(4));
  console.log('editor title:',await p.inputValue('[data-f="p.title"]'),'| ready:',(await p.textContent('#ed-ready')).replace(/\s+/g,' ').slice(0,80));
  console.log('checks table rows:',await p.$$eval('#ed-checks tbody tr',r=>r.length),'| first:',await p.$eval('#ed-checks tbody tr',r=>r.innerText.replace(/\s+/g,' ')));
  console.log('formula status:',await p.$$eval('.fstat',s=>s.map(x=>x.textContent).join(' | ')));
  await H.shot('tm_editor',true);
  await p.click('[data-ai="check"]'); await p.waitForSelector('#edstat.ok',{timeout:8000}); console.log('check:',(await p.textContent('#edstat')).slice(0,120));
  await p.click('[data-ai="harder"]'); await p.waitForSelector('#ai-undo',{timeout:8000}); console.log('after harder: difficulty',await p.inputValue('[data-f="p.difficulty"]'),'| note:',(await p.textContent('.ednote')).replace(/\s+/g,' ').slice(0,90));
  await p.click('#ai-undo'); await p.waitForTimeout(200); console.log('after undo: difficulty',await p.inputValue('[data-f="p.difficulty"]'));
  // a broken formula shows up as an issue, then fix it
  const fA=p.locator('[data-f$=".formula"]').first(); await fA.fill('fee_A * mm'); await p.waitForTimeout(450);
  console.log('broken formula →',(await p.textContent('#ed-ready')).replace(/\s+/g,' ').slice(0,120)); await fA.fill('fee_A * m'); await p.waitForTimeout(450);
  await p.click('#ed-save'); await p.waitForTimeout(300);
  await p.click('#ed-pub'); await p.waitForTimeout(400);
  let d=await db(); console.log('db after publish:',Object.keys(d).join(', '),'| status:',d['problems/'+pid].status,'| key has solution:',!!(d['keys/'+pid]&&d['keys/'+pid].solution.steps));
  // upload a Word file through the AI
  await p.goto('file://'+ROOT+'/index.html#workspace'); await p.waitForTimeout(500);
  await p.setInputFiles('#upfile',ROOT+'/tests/fx/lemonade.docx'); await p.waitForFunction(()=>location.hash.startsWith('#ws-'),null,{timeout:15000}); await p.waitForTimeout(400);
  console.log('from file:',await p.inputValue('[data-f="p.title"]'),'| src:',(await p.textContent('.edsrc')).replace(/\s+/g,' ').trim());
  console.log('AI saw file text:',await p.evaluate(()=>(window.__aiCalls||[]).slice(-1)[0]));
  await p.click('#ed-save'); await p.waitForTimeout(300);
  await p.goto('file://'+ROOT+'/index.html#workspace'); await p.waitForTimeout(500); console.log('workspace list:',await p.$$eval('.prow b',b=>b.map(x=>x.textContent).join(' / ')));
  await H.shot('tm_ws_list',true);
  // ---- a student arrives
  await p.evaluate(()=>{localStorage.setItem("mock.user",JSON.stringify({id:"u_s1",name:"Sam Lee",canEdit:false})); localStorage.removeItem("modelquest.v4"); localStorage.removeItem("modelquest.ws.unsaved")}); await p.waitForTimeout(1500);
  await p.goto('file://'+ROOT+'/index.html#challenges'); await p.reload(); await p.waitForTimeout(800);
  console.log('student nav:',await p.evaluate(()=>[...document.querySelectorAll('.navlink')].filter(b=>getComputedStyle(b).display!=="none").map(b=>b.textContent.trim()).join(' | ')));
  console.log('teacher problems shown:',await p.$$eval('.ccard.custom h3',h=>h.map(x=>x.textContent).join(' / ')));
  await H.shot('tm_student_challenges',true);
  await p.click('.ccard.custom'); await p.waitForTimeout(400); await H.shot('tm_custom_intro'); await p.click('#go1'); await p.waitForTimeout(300);
  await p.click('.def-left [data-prob]'); await p.waitForTimeout(200); await H.shot('tm_custom_prob'); await p.click('#modal .btn[data-close]');
  await p.fill('#d-0','15'); await p.fill('#d-1','50'); await p.fill('#d-2','9'); await p.waitForTimeout(100);
  console.log('wrong value fb:',await p.textContent('#dfb')); await p.fill('#d-2','10'); await p.check('[data-as="a1"]'); await p.check('[data-as="a3"]');
  console.log('wrong assumption fb:',await p.textContent('#asfb')); await p.uncheck('[data-as="a3"]');
  await H.shot('tm_custom_define',true);
  await p.click('#dnext'); await p.waitForTimeout(400);
  // the auto diagram: a wrong connector first (backwards), then the solver
  console.log('custom diagram tasks:',await p.$$eval('#dgph .dgpp',b=>b.map(x=>x.textContent.trim()).join(' / ')),'| cards:',await p.$$eval('.dgcard',c=>c.length),'| task:',(await p.textContent('#dgtask h3')).trim());
  {const l=await p.evaluate(()=>dgSpecOf(MISSIONS[location.hash.slice(1)]).links[0]);
   for(const k of [l.b,l.a]){const e=await p.$(`[data-n="${k}"]`); await e.focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(80)}
   console.log('custom backwards link fb:',await p.evaluate(()=>{const b=document.querySelector('.dgbub:not([hidden]) .dgbin,.dgdock:not([hidden]) .dgbin'); return b?b.innerText.replace(/\s+/g,' ').trim():'(none)'}))}
  await H.shot('tm_custom_dg',true);
  console.log('diagram step done:',await require(ROOT+'/tests/dgsolve.js')(p,'dgSpecOf(MISSIONS[location.hash.slice(1)])'));
  console.log('custom fin:',(await p.textContent('#dgtask')).replace(/\s+/g,' ').trim().slice(0,240));
  await H.shot('tm_custom_dg_done',true); await (await p.$('#dgb')).screenshot({path:ROOT+'/shots/tm_custom_board.png'}); await p.click('#nextb'); await p.waitForTimeout(400);
  await H.tap('v','Add set block cost_A'); await H.tap('m','Add × block'); await H.tap('v','Add variable block fee_A'); await H.tap('v','Add variable block m');
  console.log('goals:\n'+(await goals()).join('\n'));
  await H.tap('v','Add set block cost_A'); await p.locator('#cv .stack.root > .b:last-child select.bsel').first().selectOption('cost_B');
  await H.tap('m','Add + block'); await H.tap('v','Add variable block join_B'); await H.tap('m','Add × block'); await H.tap('v','Add variable block fee_B'); await H.tap('v','Add variable block m');
  await H.tap('g','Add plot block'); await H.tap('g','Add plot block'); await p.locator('#cv .stack.root > .b:last-child select.bsel').first().selectOption('cost_B');
  console.log('goals:\n'+(await goals()).join('\n'));
  await H.shot('tm_custom_build');
  await p.click('#nextb'); await p.waitForTimeout(400); console.log('equation step done:',await require(ROOT+'/tests/eqsolve.js')(p,'autoEqSpec(MISSIONS[location.hash.slice(1)].prob)')); await H.shot('t_mock_eq',true); await p.click('#nextb'); await p.waitForTimeout(300); await p.click('#runall'); await p.waitForTimeout(200);
  console.log('checks:',await p.$$eval('.status',s=>s.map(x=>x.textContent).join(' ')));
  await H.shot('tm_custom_test',true);
  await p.click('#nextb'); await p.waitForTimeout(300);
  await p.fill('#ans','StreamB, because after 12 months it costs $170 and StreamA costs $180.'); await p.fill('#why','The lines cross at 10 months; after that StreamB is cheaper.');
  await H.shot('tm_custom_explain',true);
  await p.click('#sub'); await p.waitForTimeout(3500);
  d=await db(); const pr=d['progress/u_s1']; console.log('student progress doc:',!!pr,'| done:',pr&&pr.missions['p-'+pid]&&pr.missions['p-'+pid].done,'| answers:',pr&&JSON.stringify(pr.missions['p-'+pid].answers).slice(0,80));
  console.log('student could read keys?',await p.evaluate(async()=>{const db=await window.claude.use("db"); const s=await db.doc("keys/"+location.hash.slice(3)).get(); return s.exists}));
  await p.goto('file://'+ROOT+'/index.html#options'); await p.waitForTimeout(400); console.log('sync card:',(await p.textContent('.synccard')).replace(/\s+/g,' '));
  // ---- back to the teacher
  await p.evaluate(()=>{localStorage.setItem("mock.user",JSON.stringify({id:"u_teacher",name:"Ms. Rivera",canEdit:true,isOwner:true})); localStorage.removeItem("modelquest.v4")}); await p.waitForTimeout(1500);
  await p.goto('file://'+ROOT+'/index.html#class'); await p.reload(); await p.waitForTimeout(1200);
  console.log('class names:',await p.$$eval('.sname',b=>b.map(x=>x.textContent).join(', ')),'| columns:',await p.$$eval('.hm thead th',t=>t.map(x=>x.textContent).join(' | ')));
  await H.shot('tm_class',true);
  await p.click('.sname'); await p.waitForTimeout(300); const sm=p.locator('[data-sm]').last(); await sm.click(); await p.waitForTimeout(200); await H.shot('tm_class_student');
  console.log('model blocks shown:',await p.$$eval('.smodel .b',b=>b.length));
};
