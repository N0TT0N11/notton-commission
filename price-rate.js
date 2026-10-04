(async () => {
  const core = await import('./rate-core.js?v=embed-20261005');
  core.styles();
  const target = document.getElementById('rate-page');
  const pages = {};
  let lastSignature = '';
  function apply(site) {
    const model = core.normalize(site);
    const signature = JSON.stringify(model);
    if (signature === lastSignature) return;
    lastSignature = signature;
    core.render(target, model, pages);
  }
  apply({});
  apply(await window.NottonData.load());
  window.NottonData.subscribe(apply);
})().catch(error => {
  const status = document.getElementById('rate-load-status');
  if (status) status.textContent = 'ยังโหลดข้อมูลล่าสุดไม่ได้ กรุณาลองใหม่';
  console.error(error);
});
