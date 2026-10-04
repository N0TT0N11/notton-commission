(()=>{
const gate=document.createElement('section');gate.className='owner-gate';gate.innerHTML='<h1>Notton · Admin</h1><p>เข้าสู่ระบบด้วยบัญชีเจ้าของเพื่อจัดการเว็บไซต์</p><button type="button">เข้าสู่ระบบด้วย Google</button><p role="status">กำลังตรวจสอบการเข้าสู่ระบบ…</p><a href="index.html">กลับหน้า Commission</a>';document.body.prepend(gate);
const status=gate.querySelector('[role=status]'),login=gate.querySelector('button');
login.onclick=async()=>{login.disabled=true;try{await NottonData.signIn();}catch(e){status.textContent=NottonData.errorMessage(e);}finally{login.disabled=false;}};
NottonData.authReady(user=>{document.body.classList.toggle('owner-authorized',!!user);gate.hidden=!!user;status.textContent=user?'':'กรุณาเข้าสู่ระบบด้วยบัญชีเจ้าของ';}).catch(e=>{status.textContent=NottonData.errorMessage(e);});
const logout=document.createElement('button');logout.type='button';logout.textContent='ออกจากระบบ';logout.onclick=()=>NottonData.signOut();document.querySelector('.prototype-banner')?.append(logout);
})();
