// Native-engine regressions for the entry stall and page-specific motion.
// All external traffic is blocked. No real inquiry, login or customer write.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium, webkit } = require('playwright');
const root = path.resolve(__dirname, '..');
const types = {'.html':'text/html', '.css':'text/css', '.js':'application/javascript', '.svg':'image/svg+xml', '.png':'image/png'};
const server = http.createServer((req,res)=>{
  if(req.url==='/__restore-control.html') {res.setHeader('Content-Type','text/html');return res.end('<!doctype html><meta charset="utf-8"><title>Native restoration control</title><div style="height:6000px">Static document without scripts</div>');}
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
});
const viewports=[[360,640],[390,844],[820,900],[1440,900],[1440,480],[820,360]];
let browser,checks=0;
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin='http://127.0.0.1:'+server.address().port;
 try {
  for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
   browser=await type.launch();
   for(const [width,height] of viewports){
    const ctx=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
    await ctx.route('**/*',route=>route.request().url().startsWith(origin+'/')&&route.request().method()==='GET'?route.continue():route.abort());
    const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+'/index.html');
    await page.waitForFunction(()=>document.querySelector('[data-nw-sequence]').dataset.sequenceReady==='true');
    const mode=await page.locator('[data-nw-sequence]').getAttribute('data-layout');
    if(mode!=='flow'){
     // The pin entrance used to consume hundreds of pixels with no visible part.
     await page.evaluate(()=>{const s=document.querySelector('[data-nw-sequence]');scrollTo({top:scrollY+s.getBoundingClientRect().top-document.querySelector('.site-header').offsetHeight,behavior:'instant'});});
     await page.waitForFunction(()=>Number(document.querySelector('[data-sequence-part="nav"]').style.opacity)>.2);
     assert(await page.locator('[data-sequence-part="nav"]').evaluate(el=>{const r=el.getBoundingClientRect(),pin=el.closest('.nw-sequence-pin').getBoundingClientRect();return r.bottom>pin.top+20&&r.top<pin.bottom-20;}),'first part must actually intersect the stage');
     const before=await page.locator('[data-sequence-part="nav"]').getAttribute('style');
     const y=await page.evaluate(()=>scrollY);
     await page.mouse.wheel(0,40);
     await page.waitForFunction(y=>scrollY>y+30,y);
     await page.waitForFunction(before=>document.querySelector('[data-sequence-part="nav"]').getAttribute('style')!==before,before);
     assert.equal(await page.locator('.nw-sequence-intro').evaluate(el=>getComputedStyle(el).position),'relative');
     await page.evaluate(()=>{const s=document.querySelector('[data-nw-sequence]');scrollTo({top:scrollY+s.getBoundingClientRect().top+(s.offsetHeight-innerHeight)*.65,behavior:'instant'});});
     await page.waitForFunction(()=>Number(document.querySelector('[data-nw-sequence]').dataset.progress)>.5);
     const restoredY=await page.evaluate(()=>scrollY);
     const restoreBefore=await page.evaluate(()=>({y:scrollY,height:document.documentElement.scrollHeight,hero:document.querySelector('.unified-hero').getBoundingClientRect().height,intro:document.querySelector('.nw-sequence-intro').getBoundingClientRect().height,stage:document.querySelector('[data-nw-sequence]').getBoundingClientRect().height,fonts:document.fonts.status}));
     await page.reload();
     try { await page.waitForFunction(y=>Math.abs(scrollY-y)<4,restoredY,{timeout:5000}); }
     catch(error) {
      console.error('RESTORE_DIAGNOSTIC',engine,width,height,JSON.stringify({before:restoreBefore,after:await page.evaluate(()=>({y:scrollY,height:document.documentElement.scrollHeight,hero:document.querySelector('.unified-hero').getBoundingClientRect().height,intro:document.querySelector('.nw-sequence-intro').getBoundingClientRect().height,stage:document.querySelector('[data-nw-sequence]').getBoundingClientRect().height,fonts:document.fonts.status,progress:document.querySelector('[data-nw-sequence]').dataset.progress,restoration:history.scrollRestoration}))}));
      await page.goto(origin+'/__restore-control.html');
      await page.evaluate(()=>scrollTo({top:1500,behavior:'instant'}));
      await page.mouse.wheel(0,40);await page.waitForFunction(()=>scrollY>1530);
      const controlBefore=await page.evaluate(()=>scrollY);await page.reload();
      try {await page.waitForFunction(y=>Math.abs(scrollY-y)<4,controlBefore,{timeout:1500});}catch(_){}
      console.error('STATIC_RESTORE_CONTROL',JSON.stringify({before:controlBefore,after:await page.evaluate(()=>scrollY)}));
      throw error;
     }
     await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
     await page.waitForFunction(()=>Number(document.querySelector('[data-nw-sequence]').dataset.progress)===0);
    }else assert.equal(await page.locator('.nw-sequence-pin').evaluate(el=>getComputedStyle(el).position),'relative');
    assert.equal(await page.locator('.nw-intro-svg path').count(),17);
    checks++;console.log('PASS',engine,'responsive home entry / native wheel / reverse / restore',width,height,mode);

    await page.goto(origin+'/portfolio.html');
    for(const kind of ['rank','portal','order','inflow']){
     const scene=page.locator('[data-case-motion="'+kind+'"]');
     await scene.scrollIntoViewIfNeeded();
     await page.waitForFunction(kind=>document.querySelector('[data-case-motion="'+kind+'"]').dataset.motionState==='complete',kind);
     assert(await scene.locator('figcaption').isVisible());
     const visible=await scene.locator('[data-case-result]').evaluateAll(els=>els.every(el=>Number(getComputedStyle(el).opacity)===1));
     assert(visible,kind+' final results');
    }
    await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
    assert.equal(await page.locator('[data-case-motion="rank"]').getAttribute('data-motion-state'),'complete');
    checks++;console.log('PASS',engine,'four one-time illustrative flows',width,height);

    await page.goto(origin+'/services.html');
    for(const [id,index] of [['screen-review',3],['handover',5],['scope',2]]){
     await page.locator('#'+id).evaluate(el=>scrollTo({top:scrollY+el.getBoundingClientRect().top-100,behavior:'instant'}));
     await page.waitForFunction(index=>document.querySelector('.sp-process').dataset.currentStep===String(index),index);
    }
    await page.goto(origin+'/about.html');
    await page.locator('[data-principle]').first().scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>document.querySelector('[data-principle]').classList.contains('is-active'));
    assert.equal(await page.locator('.sp-brand-logo path').count(),17);
    assert.deepEqual(errors,[]);
    checks++;console.log('PASS',engine,'process reverse and studio emphasis, reduced motion enabled',width,height);
    await ctx.close();
   }
   await browser.close();browser=null;
  }
  console.log(JSON.stringify({motionChecks:checks,engines:['chromium','webkit'],viewports,liveSubmissions:0}));
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
