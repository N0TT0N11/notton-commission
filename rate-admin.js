(() => {
  const root = document.querySelector('.admin-preview');
  if (!root) return;
  const panel = document.createElement('section');
  panel.className = 'admin-panel rate-admin-panel';
  panel.innerHTML = '<h3>Price rate</h3><p>ปรับแต่งข้อความ ภาพ วิดีโอ และตารางบนหน้าเว็บโดยตรง</p><a class="primary" href="price-rate-admin.html" target="_blank" rel="noopener noreferrer">Customize Price rate ↗</a>';
  root.append(panel);
})();
