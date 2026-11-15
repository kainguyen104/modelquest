// completes the Equation step in the page, using the spec the page itself holds (specExpr is evaluated in the page)
module.exports=async(p,specExpr,log=console.log)=>{
  const spec=await p.evaluate(e=>{const s=eval(e); return JSON.parse(JSON.stringify(s))},specExpr);
  for(const k of spec.syms){const sel=await p.$(`[data-sym="${k}"]`); if(sel&&!(await sel.isDisabled())){await sel.selectOption(k); await p.waitForTimeout(40)}}
  const tok=f=>f.match(/[A-Za-z_][A-Za-z0-9_]*\(?|\d+\.?\d*|[-+*/^()=]/g).map(t=>t==="ln("?"ln(":t);
  for(let i=0;i<spec.eqs.length;i++){const e=spec.eqs[i]; if(await p.$(`#eqb${i}.ok`)) continue;
    const clr=await p.$(`#eqb${i} [data-clr]`); if(clr) await clr.click();
    for(const t of [e.out,"="].concat(tok(e.f))){await p.click(`#eqb${i} .etile[data-t="${t}"]`); await p.waitForTimeout(15)}
    await p.click(`#eqb${i} [data-chk]`); await p.waitForTimeout(150);
    if(!(await p.$(`#eqb${i}.ok`))) log('EQ NOT ACCEPTED',e.out,await p.textContent(`#eqb${i} .eqfb`))}
  for(let qi=0;qi<spec.why.length;qi++){const q=(await p.$$('#es3 .qq'))[qi]; if(await q.evaluate(x=>x.classList.contains('ok'))) continue;
    const j=spec.why[qi].opts.findIndex(o=>o.ok); await (await q.$$('[data-qo]'))[j].click(); await p.waitForTimeout(80)}
  for(const s of spec.solve.steps){const mv=await p.$$('[data-mv]'); if(!mv.length) break; await mv[s.opts.findIndex(o=>o.ok)].click(); await p.waitForTimeout(80)}
  if(await p.$('#fincheck')){for(let j=0;j<spec.solve.final.inputs.length;j++) await p.fill(`[data-fi="${j}"]`,String(spec.solve.final.inputs[j].ans)); await p.click('#fincheck'); await p.waitForTimeout(120)}
  if(spec.solve.interp){const ip=await p.$$('[data-ip]:not([disabled])'); if(ip.length){await ip[spec.solve.interp.opts.findIndex(o=>o.ok)].click(); await p.waitForTimeout(120)}}
  return p.evaluate(()=>!document.querySelector('#nextb').disabled)};
