const { chromium } = require('playwright-core');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const mock = `
(() => {
  const on = (fn) => { if (typeof fn === 'function') fn(); return () => {}; };
  window.electronAPI = {
    records: {
      list: async () => [{ id: 1, status: 'success', tile_count: 12, created_at: '2026-08-01 10:00:00' }],
      listByBatch: async () => [],
      add: async () => ({ success: true }),
      update: async () => true,
      delete: async () => true,
    },
    batches: { list: async () => [], add: async () => ({ success: true }), delete: async () => true },
    selectOsgbDir: async () => 'D:/x', selectOutputDir: async () => 'D:/y',
    validateOsgbStructure: async () => ({ valid: true }), readMetadata: async () => ({ success: true }),
    openOutputDir: async () => true, openPath: async () => true,
    startPreview: async () => ({ success: true }), stopPreview: async () => true,
    checkTool: async () => ({ exists: true, path: 'x' }), checkMergeUpdateTool: async () => ({ exists: true, path: 'x' }),
    startConversion: async () => ({ success: true }), cancelConversion: async () => true,
    startMergeUpdateConversion: async () => ({ success: true }), cancelMergeUpdateConversion: async () => true,
    onConversionStdout: on, onConversionStderr: on, onConversionStatus: on, onPreviewLog: on,
    login: async () => ({ success: true, user: { username: 'admin', role: 'admin' } }),
  };
  sessionStorage.setItem('bs-user', JSON.stringify({ username: 'admin', role: 'admin' }));
})();
`;
(async () => {
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', e => console.log('[pageerror]', String(e).slice(0, 300)));
  await page.addInitScript(mock);
  await page.goto('http://127.0.0.1:5199/#/front', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('#scaleDiv', { timeout: 30000 });
  await page.waitForTimeout(1500);

  const result = await page.evaluate(() => {
    const scaleDiv = document.getElementById('scaleDiv');
    const container = document.getElementById('mars3dContainer');
    return {
      scaleDivZoom: scaleDiv ? scaleDiv.style.zoom : null,
      containerParent: container ? container.parentElement?.id || container.parentElement?.className : null,
      containerInScaleDiv: container ? scaleDiv?.contains(container) : null,
      clientWidth: document.documentElement.clientWidth,
      expected: document.documentElement.clientWidth / 1920,
    };
  });
  console.log('RESULT1440', JSON.stringify(result, null, 2));

  // resize to 2560 width
  await page.setViewportSize({ width: 2560, height: 1200 });
  await page.waitForTimeout(600);
  const result2 = await page.evaluate(() => {
    const scaleDiv = document.getElementById('scaleDiv');
    return {
      scaleDivZoom: scaleDiv ? scaleDiv.style.zoom : null,
      clientWidth: document.documentElement.clientWidth,
      expected: document.documentElement.clientWidth / 1920,
    };
  });
  console.log('RESULT2560', JSON.stringify(result2, null, 2));
  await page.screenshot({ path: 'scripts/front-scale.png' });
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
