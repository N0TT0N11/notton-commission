(() => {
  const style = document.createElement('style');
  style.textContent = `
    .owner-gate { font-family: system-ui, sans-serif; background: #fff; }
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
  gate.innerHTML = `<h1>Admin access</h1><form>
    <label>ID<input name="username" autocomplete="username" required></label>
    <label>Password<input name="password" type="password" autocomplete="current-password" required></label>
    <button type="submit">Log in</button></form>
    <p role="status" aria-live="polite"></p><a href="index.html">กลับหน้า Commission</a>`;
  document.body.prepend(gate);
  const form = gate.querySelector('form'), status = gate.querySelector('[role=status]');
  form.onsubmit = async event => {
    event.preventDefault();
    try { await NottonData.signInPassword(form.elements.username.value, form.elements.password.value); }
    catch (error) { status.textContent = error.message; }
    finally { form.elements.password.value = ''; }
  };
  const account = document.createElement('aside');
  account.className = 'owner-account'; account.hidden = true;
  account.innerHTML = '<button type="button">Log out</button>';
  account.querySelector('button').onclick = () => NottonData.signOut();
  document.body.append(account);
  NottonData.authReady(user => {
    const authorized = !!user;
    document.body.classList.toggle('owner-authorized', authorized);
    gate.hidden = authorized; account.hidden = !authorized;
  });
})();
