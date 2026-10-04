(() => {
  const gate = document.createElement('section');
  gate.className = 'owner-gate';
  gate.innerHTML = '<h1>Notton · Admin</h1><p>เข้าสู่ระบบด้วยบัญชี Google เจ้าของเว็บไซต์</p><button type="button">เข้าสู่ระบบด้วย Google</button><p role="status">กำลังตรวจสอบการเข้าสู่ระบบ…</p><a href="index.html">กลับหน้า Commission</a>';
  document.body.prepend(gate);
  const status = gate.querySelector('[role=status]');
  const login = gate.querySelector('button');
  login.disabled = true;
  login.onclick = async () => {
    login.disabled = true;
    status.textContent = 'กำลังเข้าสู่ระบบ…';
    try { await NottonData.signIn(); }
    catch (error) { status.textContent = NottonData.errorMessage(error); }
    finally { login.disabled = false; }
  };
  NottonData.authReady(user => {
    const authorized = !!user;
    document.body.classList.toggle('owner-authorized', authorized);
    gate.hidden = authorized;
    login.disabled = false;
    status.textContent = authorized ? '' : 'กรุณาเข้าสู่ระบบด้วยบัญชีเจ้าของ';
  }).catch(error => { status.textContent = NottonData.errorMessage(error); });
  const logout = document.createElement('button');
  logout.type = 'button';
  logout.textContent = 'ออกจากระบบ';
  logout.onclick = async () => {
    logout.disabled = true;
    try { await NottonData.signOut(); }
    catch (error) { status.textContent = NottonData.errorMessage(error); }
    finally { logout.disabled = false; }
  };
  document.querySelector('.prototype-banner')?.append(logout);
})();
