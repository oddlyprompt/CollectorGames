"""Shared stores: real clicks, mobile layout, purchases, selling and persistent inventory.
Build tcg, serve dist on 8770, then python tools/retail_ui_test.py [port].
"""
import asyncio,sys
from playwright.async_api import async_playwright
PORT=sys.argv[1] if len(sys.argv)>1 else '8770'
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch()
  page=await b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  await page.route('**/fonts.g*/**',lambda r:r.abort())
  await page.goto(f'http://localhost:{PORT}/tcg/')
  await page.click('[data-lact=new]');await page.click('[data-lact=start]')
  await page.wait_for_function("G&&G.player.start>0&&document.getElementById('boot').style.display==='none'",timeout=280000)
  await page.evaluate("while(G.day<brSetDef(1).rel+10)advanceDay();G.player.cash=10000;")
  await page.click('#bnav [data-a=stores]')
  assert await page.locator('.retail-card').count()==12
  assert await page.evaluate("new Set([...document.querySelectorAll('#bnav button')].map(e=>e.getBoundingClientRect().top)).size===1")
  await page.screenshot(path='/tmp/retail-directory-phone.png',full_page=True)
  await page.click('[data-act=rvisit][data-a=lantern]')
  for game in ['wk','xt','br']:
   await page.click(f'[data-act=rgame][data-a={game}]')
   before=await page.evaluate('G.player.cash')
   btn=page.locator('[data-act=rsealed]:not([disabled])').first
   assert await btn.count()
   await btn.click()
   assert await page.evaluate('G.player.cash')<before
   assert await page.evaluate(f"UI.cg==='{game}'")
  await page.click('[data-act=rgame][data-a=all]')
  await page.click('[data-act=rmode][data-a=singles]')
  await page.screenshot(path='/tmp/retail-singles-phone.png',full_page=True)
  assert await page.locator('[data-act=rsingle]').count()>0
  before=await page.evaluate('G.player.cash')
  await page.locator('[data-act=rsingle]').first.click()
  assert await page.evaluate('G.player.cash')<before
  search=page.locator('[data-retail-search]');await search.fill('zz-no-matching-card');await page.wait_for_timeout(400)
  assert 'Nothing matches' in await page.locator('.retail-inventory').inner_text()
  await search.fill('');await page.wait_for_timeout(400)
  await page.click('[data-act=rmode][data-a=sell]')
  seller=page.locator('[data-act=rsell]:not([disabled])').first
  assert await seller.count()
  before=await page.evaluate('G.player.cash')
  await seller.click();await seller.click()
  assert await page.evaluate('G.player.cash')>before
  await page.click('[data-act=rback]')
  await page.click('[data-act=rvisit][data-a=super-centre]')
  assert await page.locator('[data-act=rmode][data-a=singles]').count()==0
  assert await page.locator('[data-act=rmode][data-a=sell]').count()==0
  for width in [320,390,768,1024,1280]:
   await page.set_viewport_size({'width':width,'height':844})
   assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'overflow at {width}'
  await page.screenshot(path='/tmp/retail-bigbox-desktop.png',full_page=True)
  snap=await page.evaluate('JSON.stringify(G.retail,saveReplacer)')
  await page.evaluate('saveGame(true)');await page.wait_for_timeout(1800)
  await page.reload();await page.wait_for_selector('#launch');await page.click('[data-lact=open]')
  await page.wait_for_function("G&&G.player.start>0&&document.getElementById('boot').style.display==='none'",timeout=120000)
  after=await page.evaluate('JSON.stringify(G.retail,saveReplacer)')
  if snap!=after:
   import json
   open('/tmp/retail-save-before.json','w').write(snap);open('/tmp/retail-save-after.json','w').write(after)
  assert snap==after
  assert not errors,errors
  print('RESULT ALL PASS: directory, 3-game purchases, singles, selling, search, big-box restrictions, 320–1280px layout, save/reload')
  await b.close()
asyncio.run(main())
