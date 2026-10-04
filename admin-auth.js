(() => {
  const style = document.createElement('style');
  style.textContent = `
    .owner-gate button, .owner-account button {
      background: #fff; color: #80572e; border: 1px solid #e6c779;
      border-radius: 999px; padding: 12px 20px; cursor: pointer;
      font: inherit;
    }
    .owner-gate button:disabled { opacity: .5; cursor: wait; }
    .owner-gate form { display: grid; gap: 14px; margin: 22px 0; }
    .owner-gate label { display: grid; gap: 6px; text-align: left; }
    .owner-gate input, .owner-account input {
      box-sizing: border-box; width: 100%; padding: 12px 14px;
      border: 1px solid #e6d6b6; border-radius: 14px; font: inherit;
    }
    .owner-gate [hidden], .owner-account[hidden] { display: none; }
    .owner-account { position: fixed; right: 18px; bottom: 18px; z-index: 10001;
      max-width: min(360px, calc(100vw - 36px)); background: white;
      border: 1px solid #e6d6b6; border-radius: 20px; padding: 14px;
      box-shadow: 0 8px 32px #523b2118; }
    .owner-account form { display: grid; gap: 10px; margin-top: 12px; }
    .owner-account summary { cursor: pointer; }
  `;
  document.head.append(style);
  const gate = document.createElement('section');
  gate.className = 'owner-gate';
  gate.innerHTML = `
    <h1>Notton · Admin</h1>
    <p>เลือกวิธีเข้าสู่ระบบเพื่อแก้ไขและบันทึกข้อมูล</p>
    <button type="button" data-google disabled>Continue with Google</button>
    <button type="button" data-password disabled>Password</button>
    <form hidden>
      <label>Owner email<input name="email" type="email" autocomplete="username" required></label>
      <label>Password<input name="password" type="password" autocomplete="current-password" required></label>
      <button type="submit">Log in</button>
    </form>
    <p role="status" aria-live="polite">กำลังตรวจสอบการเข้าสู่ระบบ…</p>
    <a href="index.html">กลับหน้า Commission</a>
  `;
  document.body.prepend(gate);
  const status = gate.querySelector('[role=status]');
  const google = gate.querySelector('[data-google]');
  const password = gate.querySelector('[data-password]');
  const form = gate.querySelector('form');
  let busy = false;
  const message = error => {
    const messages = {
      'auth/invalid-credential': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
      'auth/wrong-password': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
      'auth/user-not-found': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
      'auth/operation-not-allowed': 'ยังไม่ได้เปิด Email/Password ใน Firebase Authentication',
      'auth/too-many-requests': 'ลองเข้าสู่ระบบหลายครั้งเกินไป กรุณารอสักครู่',
      'auth/network-request-failed': 'เชื่อมต่อไม่ได้ กรุณาตรวจอินเทอร์เน็ต',
      'auth/requires-recent-login': 'กรุณาออกจากระบบแล้วเข้า Google ใหม่ก่อนตั้ง Password',
      'auth/popup-closed-by-user': 'ยกเลิกการเข้าสู่ระบบแล้ว'
    };
    return messages[error.code] || NottonData.errorMessage(error);
  };
  const runLogin = async action => {
    if (busy) return;
    busy = true;
    gate.querySelectorAll('button').forEach(button => button.disabled = true);
    status.textContent = 'กำลังเข้าสู่ระบบ…';
    try { await action(); }
    catch (error) { status.textContent = message(error); }
    finally {
      busy = false;
      form.elements.password.value = '';
      gate.querySelectorAll('button').forEach(button => button.disabled = false);
    }
  };
  google.onclick = () => runLogin(() => NottonData.signIn());
  password.onclick = () => {
    form.hidden = !form.hidden;
    if (!form.hidden) form.elements.email.focus();
  };
  form.onsubmit = event => {
    event.preventDefault();
    runLogin(() => NottonData.signInPassword(form.elements.email.value, form.elements.password.value));
  };
  const account = document.createElement('aside');
  account.className = 'owner-account';
  account.hidden = true;
  account.innerHTML = `
    <details><summary>Account</summary>
      <p data-account-status role="status" aria-live="polite"></p>
      <form data-setup hidden>
        <p>เปิดใช้ Password กับบัญชี Google นี้เพียงครั้งเดียว</p>
        <label>Password<input name="password" type="password" autocomplete="new-password" required></label>
        <label>Confirm password<input name="confirm" type="password" autocomplete="new-password" required></label>
        <button type="submit">Enable Password</button>
      </form>
      <button type="button" data-logout>Log out</button>
    </details>
  `;
  document.body.append(account);
  const setup = account.querySelector('form');
  const accountStatus = account.querySelector('[data-account-status]');
  setup.onsubmit = async event => {
    event.preventDefault();
    if (setup.elements.password.value !== setup.elements.confirm.value) {
      accountStatus.textContent = 'รหัสผ่านทั้งสองช่องไม่ตรงกัน';
      return;
    }
    const submit = setup.querySelector('button');
    submit.disabled = true;
    try {
      await NottonData.enablePassword(setup.elements.password.value);
      setup.hidden = true;
      accountStatus.textContent = 'Google และ Password พร้อมใช้กับบัญชีเดียวกันแล้ว';
    } catch (error) { accountStatus.textContent = message(error); }
    finally { setup.reset(); submit.disabled = false; }
  };
  account.querySelector('[data-logout]').onclick = async event => {
    event.target.disabled = true;
    try { await NottonData.signOut(); }
    catch (error) { accountStatus.textContent = message(error); }
    finally { event.target.disabled = false; }
  };
  NottonData.authReady(user => {
    const authorized = !!user;
    document.body.classList.toggle('owner-authorized', authorized);
    gate.hidden = authorized;
    account.hidden = !authorized;
    google.disabled = password.disabled = false;
    status.textContent = authorized ? '' : 'Google หรือ Password ใช้เข้าหน้า Admin ได้';
    if (user) {
      const linked = user.providerData.some(provider => provider.providerId === 'password');
      setup.hidden = linked;
      accountStatus.textContent = linked ? 'Google + Password enabled' : 'Google enabled · Password ยังไม่ได้ตั้งค่า';
      form.elements.email.value = user.email;
    }
  }).catch(error => { status.textContent = message(error); });
})();
