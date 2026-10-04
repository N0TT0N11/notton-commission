(() => {
  const root = document.querySelector('#akane-concepts');
  if (!root) return;
  root.addEventListener('click', event => {
    const thumbnail = event.target.closest('.work-library-thumb');
    if (!thumbnail) return;
    thumbnail.closest('.offer-admin-bubble')?.querySelector('button')?.click();
    root.querySelector('.work-upload-panel')?.scrollIntoView({behavior:'smooth',block:'start'});
  });
})();
