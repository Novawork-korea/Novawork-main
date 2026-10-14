// Native engine checks for the approved subpage redesign. No live submissions.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium, webkit } = require('playwright');
const root = path.resolve(__dirname, '..');
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.svg':'image/svg+xml', '.png':'image/png', '.webp':'image/webp' };
const server = http.createServer((req,res)=>{
  const file=path.resolve(root, '.'+new URL(req.url,'http://localhost').pathname);
  if (!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()) {res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
const viewports=[[360,640],[390,844],[820,900],[1440,900],[1440,480],[820,360]];
const pages=['portfolio','services','about'];
const cases={
  'naver-rank':'네이버 순위 확인 사례처럼 반복 확인과 기록을 줄이고 싶어요.',
  'customer-portal':'고객 포털 사례처럼 계정별로 업무 도구를 제공하고 싶어요.',
  'order-demo':'도면·발주 시안처럼 파일 검토와 진행 현황을 정리하고 싶어요.',
  'inflow-demo':'유입 경로 시안처럼 채널별 이동과 결과를 확인하고 싶어요.',
};
let checks=0, origin, browser;
const reports=[];
async function isolatedContext(options={}) {
  const ctx=await browser.newContext(options);
  await ctx.route('**/*',route=>{
    const req=route.request();
    if(req.url().startsWith(origin+'/')&&['GET','HEAD'].includes(req.method())) return route.continue();
    // External analytics are stubbed; every external form/API request is blocked.
    if(req.resourceType()==='script')return route.fulfill({status:200,contentType:'application/javascript',body:''});
    return route.abort('blockedbyclient');
  });
  return ctx;
}
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  origin='http://127.0.0.1:'+server.address().port;
  try {
    for (const [engine,type] of [['chromium',chromium],['webkit',webkit]]) {
      browser=await type.launch();
      for (const [width,height] of viewports) {
        const context=await isolatedContext({viewport:{width,height},reducedMotion:width===390?'reduce':'no-preference'});
        const page=await context.newPage();
        const errors=[];page.on('pageerror',e=>errors.push(e.message));
        for(const name of pages) {
          await page.goto(origin+'/'+name+'.html');
          await page.locator('h1').waitFor({state:'visible'});
          assert.equal(await page.locator('h1').count(),1);
          const layout=await page.evaluate(()=>{
            const d=document,w=window;
            const outside=[...d.querySelectorAll('main *')].filter(el=>{
              const r=el.getBoundingClientRect(),s=getComputedStyle(el);
              return r.width>0&&s.display!=='none'&&(r.left< -1||r.right>d.documentElement.clientWidth+1);
            }).map(el=>el.tagName+'.'+el.className);
            const textClipped=[...d.querySelectorAll('main p,main h1,main h2,main h3,main dt,main dd,main a')].filter(el=>{
              const r=el.getBoundingClientRect();return r.width>0&&(el.scrollWidth>el.clientWidth+2||el.scrollHeight>el.clientHeight+2);
            }).map(el=>el.textContent.trim().slice(0,55));
            return {width:w.innerWidth,height:w.innerHeight,documentWidth:d.documentElement.scrollWidth,clientWidth:d.documentElement.clientWidth,outside,textClipped};
          });
          assert(layout.documentWidth<=layout.clientWidth,JSON.stringify(layout));
          assert.deepEqual(layout.outside,[],engine+' '+name+' '+width);
          assert.deepEqual(layout.textClipped,[],engine+' clipped text '+name+' '+width);
          // Quick down/up navigation must leave normal document scrolling usable.
          await page.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
          assert(await page.locator('#site-footer').isVisible());
          await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
          if(await page.locator('.menu-toggle').isVisible()) {
            await page.locator('.menu-toggle').click();
            assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');
            assert(await page.locator('#mobile-nav a[href="contact.html"]').isVisible());
            await page.keyboard.press('Escape');
            assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
          }
          if(name==='about')assert.equal(await page.locator('.sp-brand-logo path').count(),17);
          if(name==='services') {
            const summary=page.locator('.sp-faq-list summary').first();
            await summary.click();assert(await page.locator('.sp-faq-list details').first().evaluate(el=>el.open));
            await summary.click();
          }
          await page.reload();
          assert.equal(await page.locator('.sp-main h1').count(),1);
          assert.deepEqual(errors,[],engine+' runtime errors');
          reports.push({engine,page:name,...layout});checks++;
          console.log('PASS',engine,name,width+'x'+height);
        }
        await context.close();
      }
      const context=await isolatedContext({viewport:{width:390,height:844}}), page=await context.newPage();
      for(const [slug,expected] of Object.entries(cases)) {
        await page.goto(origin+'/portfolio.html#'+slug);
        await page.locator('#'+slug+' a[href*="?case="]').click();
        await page.waitForURL('**/contact.html?case='+slug);
        assert.equal(await page.locator('#contact-service').inputValue(),expected);
        assert.equal(await page.locator('#contact-message').inputValue(),'');
        assert.equal(await page.locator('script[src*="googletagmanager"]').count(),0);
        // Empty required inputs must be rejected locally, without sending a request.
        await page.locator('button[type="submit"]').click();
        assert.equal(await page.locator('#contact-name').getAttribute('aria-invalid'),'true');
        await page.goBack();assert(await page.locator('#'+slug).isVisible());
        checks++;console.log('PASS',engine,'case consultation',slug);
      }
      await page.goto(origin+'/contact.html?case=__proto__');
      assert.equal(await page.locator('#contact-service').inputValue(),'');checks++;
      // Browser-restored content must win over URL defaults at script startup.
      await page.addInitScript(()=>{
        document.addEventListener('DOMContentLoaded',()=>{}, {once:true});
        new MutationObserver((changes,observer)=>{
          const field=document.querySelector('#contact-service');
          if(field){field.value='Restored visitor text';observer.disconnect();}
        }).observe(document,{childList:true,subtree:true});
      });
      await page.goto(origin+'/contact.html?case=naver-rank');
      assert.equal(await page.locator('#contact-service').inputValue(),'Restored visitor text');checks++;
      await context.close();await browser.close();browser=null;
    }
    console.log(JSON.stringify({checks,engines:['chromium','webkit'],viewports,layoutReports:reports.length,liveSubmissions:0}));
  } finally {if(browser)await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
