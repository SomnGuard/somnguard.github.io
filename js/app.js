// SomnGuard mockup-v2 — adaptado a somnguard-portal (sin consumo, offline)
// Pantalla principal + modales login/registro idénticos a portal/src (validación, estilos, interacción)

'use strict';

// ===== Toast (portal/src/shared/ui/Toast.tsx) =====
function showToast(title, msg, type) {
    type = type || 'info';
    var root = document.getElementById('toast-root');
    if (!root) {
        root = document.createElement('div');
        root.id = 'toast-root';
        root.className = 'toast-container';
        root.setAttribute('aria-live', 'polite');
        document.body.appendChild(root);
    }
    var item = document.createElement('div');
    item.className = 'toast ' + type;
    var inner = document.createElement('div');
    inner.style.flex = '1';
    var t = document.createElement('div');
    t.className = 'toast-title';
    t.textContent = title;
    var m = document.createElement('div');
    m.className = 'toast-msg';
    m.textContent = msg;
    inner.appendChild(t);
    inner.appendChild(m);
    var close = document.createElement('button');
    close.className = 'toast-close';
    close.setAttribute('aria-label', 'Cerrar');
    close.textContent = '×';
    close.onclick = function() { if (item.parentNode) item.parentNode.removeChild(item); };
    item.appendChild(inner);
    item.appendChild(close);
    root.appendChild(item);
    setTimeout(function() {
        item.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(function(){ if(item.parentNode) item.parentNode.removeChild(item); }, 300);
    }, 3200);
}

// ===== Password toggle (portal EyeIcon) =====
var eyeOpen = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"></path><circle cx="12" cy="12" r="3.5"></circle></svg>';
var eyeOff  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"></path><path d="M10.6 10.6A3 3 0 0012 15a3 3 0 002.4-1.2"></path><path d="M9.9 5.1A10.7 10.7 0 0112 4c5.5 0 9.4 4.5 10 8-.3 1.8-1.5 3.9-3.2 5.6"></path><path d="M14.8 14.8A3 3 0 019.2 9.2"></path><path d="M3.8 9.3C2.2 10.9 1 12 1 12c.6 3.5 4.5 8 11 8 1.7 0 3.2-.4 4.6-1"></path></svg>';
function togglePassword(inputId, btn) {
    var input = document.getElementById(inputId);
    if (!input) return;
    var isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    if (btn) {
        btn.setAttribute('aria-label', isPass ? 'Ocultar contraseña' : 'Mostrar contraseña');
        btn.innerHTML = isPass ? eyeOff : eyeOpen;
    }
}

// ===== Logo Animation — solo hero (portal/src/shared/hooks/useSoloLogoAnimation.ts) =====
(function soloLogoAnimation(){
    var CX=50,CY=50,ALTO=24,RADIO=12,LX=16,LY=4;
    function lerp(a,b,t){return a+(b-a)*t;}
    function easeInOutQuad(t){return t<0.5?2*t*t:1-Math.pow(-2*t+2,2)/2;}
    function rand(a,b){return Math.random()*(b-a)+a;}
    function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}
    var running=true;
    function getSet(svg){
        var pupil=null,pill=null,pillClip=null,mouth=null;
        var all=svg.querySelectorAll('[id]');
        for(var i=0;i<all.length;i++){
            var low=all[i].id.toLowerCase();
            if(low.endsWith('pupil')) pupil=all[i];
            else if(low.endsWith('pillclip')) pillClip=all[i];
            else if(low.endsWith('pill')) pill=all[i];
            else if(low.endsWith('mouth')) mouth=all[i];
        }
        if(!pupil) pupil=svg.querySelector('circle');
        if(!pill) pill=svg.querySelector(':scope > rect')||svg.querySelector('rect');
        if(!pillClip) pillClip=svg.querySelector('clipPath rect');
        if(!mouth){
            var paths=svg.querySelectorAll('path');
            mouth=paths.length>1?paths[1]:paths[0];
        }
        if(!pupil||!pill||!pillClip||!mouth) return null;
        return{svg:svg,pupil:pupil,pill:pill,pillClip:pillClip,mouth:mouth};
    }
    function start(){
        var heroSvg=document.getElementById('heroLogo');
        if(!heroSvg){
            setTimeout(start,80);
            return;
        }
        var set=getSet(heroSvg);
        if(!set) return;
        var animateValue=function(cb,from,to,duration){
            var start=Date.now();
            return new Promise(function(resolve){
                var tick=function(){
                    if(!running){resolve();return;}
                    var elapsed=Date.now()-start;
                    var progress=Math.min(elapsed/duration,1);
                    var eased=easeInOutQuad(progress);
                    var value=lerp(from,to,eased);
                    cb(value);
                    if(progress<1) requestAnimationFrame(tick); else resolve();
                };
                tick();
            });
        };
        var movePupil=function(tx,ty,duration){
            var sx=parseFloat(set.pupil.getAttribute('cx')||String(CX));
            var sy=parseFloat(set.pupil.getAttribute('cy')||String(CY));
            return Promise.all([
                animateValue(function(v){set.pupil.setAttribute('cx',String(v));},sx,tx,duration),
                animateValue(function(v){set.pupil.setAttribute('cy',String(v));},sy,ty,duration)
            ]);
        };
        var animatePill=function(newHeight,duration){
            var sh=parseFloat(set.pill.getAttribute('height')||String(ALTO));
            var sy=parseFloat(set.pill.getAttribute('y')||String(CY-ALTO/2));
            var sr=parseFloat(set.pill.getAttribute('rx')||String(RADIO));
            var newY=CY-newHeight/2;
            var newRx=Math.min(RADIO,newHeight/2);
            return Promise.all([
                animateValue(function(v){set.pill.setAttribute('height',String(v));set.pillClip.setAttribute('height',String(v));},sh,newHeight,duration),
                animateValue(function(v){set.pill.setAttribute('y',String(v));set.pillClip.setAttribute('y',String(v));},sy,newY,duration),
                animateValue(function(v){set.pill.setAttribute('rx',String(v));set.pill.setAttribute('ry',String(v));set.pillClip.setAttribute('rx',String(v));set.pillClip.setAttribute('ry',String(v));},sr,newRx,duration)
            ]);
        };
        var animateMouth=function(targetCY,duration){
            var startCY=78;
            return animateValue(function(v){var d='M41 73 Q50 '+v+' 59 73'; set.mouth.setAttribute('d',d);},startCY,targetCY,duration);
        };
        var randPos=function(){return{x:CX+rand(-LX,LX),y:CY+rand(-LY,LY)};};
        var vigilar=function(){
            animateMouth(78,500);
            var n=Math.floor(rand(2,5));
            var p=Promise.resolve();
            for(var i=0;i<n;i++){
                (function(){
                    var d=randPos();
                    p=p.then(function(){ if(!running) return; return movePupil(d.x,d.y,rand(400,800));}).then(function(){return sleep(rand(300,900));});
                })();
            }
            return p;
        };
        var parpadear=function(){animateMouth(81,200); return animatePill(3,120).then(function(){return sleep(80);}).then(function(){return animatePill(ALTO,160);});};
        var sospechar=function(){
            animateMouth(65,300);
            return animatePill(10,200).then(function(){return sleep(100);}).then(function(){
                var lx=Math.random()>0.5?CX+13:CX-13;
                return movePupil(lx,CY,rand(600,1000));
            }).then(function(){return sleep(rand(400,900));}).then(function(){return movePupil(CX,CY,400);}).then(function(){return sleep(150);}).then(function(){return Promise.all([animatePill(ALTO,250),animateMouth(78,350)]);});
        };
        var alerta=function(){
            animateMouth(86,150);
            var n=Math.floor(rand(3,6));
            var p=Promise.resolve();
            for(var i=0;i<n;i++){
                (function(){
                    var d=randPos();
                    p=p.then(function(){ if(!running) return; return movePupil(d.x,d.y,rand(80,200));}).then(function(){return sleep(rand(50,150));});
                })();
            }
            return p.then(function(){return movePupil(CX,CY,300);}).then(function(){animateMouth(78,400);});
        };
        var centrar=function(){animateMouth(73,400); return movePupil(CX,CY,400).then(function(){return sleep(rand(200,600));}).then(function(){animateMouth(78,500);});};
        var pickBehavior=function(){
            var behaviors=[{fn:vigilar,w:40},{fn:parpadear,w:25},{fn:sospechar,w:20},{fn:alerta,w:10},{fn:centrar,w:5}];
            var total=behaviors.reduce(function(s,b){return s+b.w;},0);
            var pt=rand(0,total);
            for(var i=0;i<behaviors.length;i++){pt-=behaviors[i].w; if(pt<=0) return behaviors[i].fn;}
            return behaviors[0].fn;
        };
        (async function loop(){
            while(running){ await pickBehavior()(); await sleep(rand(200,800)); }
        })();
    }
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', start); else start();
    window.addEventListener('beforeunload', function(){running=false;});
})();

// ===== Sanitizers & Validation (portal/src/shared/lib/validation.ts) =====
var nameRegex = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]{3,30}$/;
var firstNameRegex = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]{3,30}$/;
var lastNameRegex = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]{3,30}$/;
var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
var phoneRegex = /^\+?[0-9]{7,30}$/;

function isValidEmail(email){
    var v=String(email).trim().toLowerCase();
    if(v.length>50) return false;
    return emailRegex.test(v);
}
function isValidFirstName(v){ return firstNameRegex.test(String(v).trim()); }
function isValidLastName(v){ return lastNameRegex.test(String(v).trim()); }
function isValidPhone(phone){
    var n=String(phone).replace(/[\s\-()]/g,'');
    return phoneRegex.test(n);
}
function isStrongPassword(password){
    var v=String(password);
    return v.length>=8 && /[a-z]/.test(v) && /[A-Z]/.test(v) && /\d/.test(v) && /[^A-Za-z0-9]/.test(v) && !/\s/.test(v);
}
function getPasswordStrength(password){
    if(!password) return{label:'',percent:0,color:'transparent',level:''};
    var score=0;
    if(password.length>=8) score++;
    if(password.length>=12) score++;
    if(/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if(/\d/.test(password)) score++;
    if(/[^A-Za-z0-9]/.test(password)) score++;
    if(score<=2) return{label:'Débil',percent:33,color:'#ff5555',level:'weak'};
    if(score===3) return{label:'Media',percent:60,color:'#ffb020',level:'fair'};
    if(score===4) return{label:'Buena',percent:80,color:'#00C8C8',level:'good'};
    return{label:'Fuerte',percent:100,color:'#00e5a0',level:'strong'};
}
function sanitizeFirstName(v){ return v.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s\-']/g,'').slice(0,30); }
function sanitizeLastName(v){ return v.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s\-']/g,'').slice(0,30); }
function sanitizeEmail(v){ return v.replace(/\s/g,'').toLowerCase().slice(0,50); }
function sanitizePhone(v){ return v.replace(/[^0-9+\s\-()]/g,'').slice(0,30); }
function sanitizePasswordNoSpaces(v){ return v.replace(/\s/g,'').slice(0,72); }

function validateLogin(email,password){
    var errors={};
    var e=String(email).trim().toLowerCase();
    if(!e) errors.email='El correo es obligatorio.';
    else if(e.length>50) errors.email='Máximo 50 caracteres.';
    else if(!isValidEmail(e)) errors.email='Ingresa un correo válido (ej: usuario@dominio.com).';
    if(!password) errors.password='La contraseña es obligatoria.';
    else if(/\s/.test(password)) errors.password='No se permiten espacios en la contraseña.';
    else if(password.length<4) errors.password='Contraseña demasiado corta.';
    return{valid:Object.keys(errors).length===0, errors:errors};
}
function validateRegister(firstName,lastName,email,phone,password,confirm){
    var errors={};
    var fn=String(firstName).trim();
    var ln=String(lastName).trim();
    var e=String(email).trim().toLowerCase();
    var ph=String(phone).trim();
    if(!fn) errors.firstName='El nombre es obligatorio.';
    else if(fn.length<3) errors.firstName='Mínimo 3 caracteres.';
    else if(fn.length>30) errors.firstName='Máximo 30 caracteres.';
    else if(!isValidFirstName(fn)) errors.firstName='Solo letras y espacios. 3-30 caracteres.';
    if(!ln) errors.lastName='El apellido es obligatorio.';
    else if(ln.length<3) errors.lastName='Mínimo 3 caracteres.';
    else if(ln.length>30) errors.lastName='Máximo 30 caracteres.';
    else if(!isValidLastName(ln)) errors.lastName='Solo letras y espacios. 3-30 caracteres.';
    if(!e) errors.email='El correo es obligatorio.';
    else if(e.length>50) errors.email='Máximo 50 caracteres.';
    else if(!isValidEmail(e)) errors.email='Ingresa un correo válido.';
    if(!ph) errors.phone='El teléfono es obligatorio.';
    else if(ph.length>30) errors.phone='Máximo 30 caracteres.';
    else if(!isValidPhone(ph)) errors.phone='Teléfono inválido. Usa 7-30 dígitos, opcional + al inicio.';
    if(!password) errors.password='La contraseña es obligatoria.';
    else if(!isStrongPassword(password)) errors.password='Debe tener mínimo 8 caracteres, mayúscula, minúscula, número y símbolo, sin espacios.';
    if(!confirm) errors.confirm='Confirma la contraseña.';
    else if(password!==confirm) errors.confirm='Las contraseñas no coinciden.';
    return{valid:Object.keys(errors).length===0, errors:errors};
}
function validateForgot(email){
    var errors={};
    var e=String(email).trim().toLowerCase();
    if(!e) errors.email='El correo es obligatorio.';
    else if(e.length>50) errors.email='Máximo 50 caracteres.';
    else if(!isValidEmail(e)) errors.email='Ingresa un correo válido.';
    return{valid:Object.keys(errors).length===0, errors:errors};
}

// ===== Field helpers (portal classes input-invalid/input-valid) =====
function setFieldError(inputId, errorId, message){
    var input=document.getElementById(inputId);
    var error=document.getElementById(errorId);
    if(input){ input.classList.add('input-invalid'); input.classList.remove('input-valid'); }
    if(error) error.textContent=message||'';
}
function clearFieldError(inputId, errorId){
    var input=document.getElementById(inputId);
    var error=document.getElementById(errorId);
    if(input){ input.classList.remove('input-invalid'); input.classList.remove('input-valid'); if(input.value) input.classList.add('input-valid'); }
    if(error) error.textContent='';
}
function markInvalid(inputId, errorId, msg){ setFieldError(inputId,errorId,msg); }
function markValid(inputId, errorId){ clearFieldError(inputId,errorId); }

// ===== Modal Functions (portal AuthModals ModalShell) =====
var DEMO_EMAIL='admin@somnguard.com';
var DEMO_PASS='1234';

function fillDemoCredentials(){
    var e=document.getElementById('loginEmail');
    var p=document.getElementById('loginPassword');
    if(e){ e.value=DEMO_EMAIL; clearFieldError('loginEmail','loginEmailError'); e.classList.add('input-valid'); e.classList.remove('input-invalid'); }
    if(p){ p.value=DEMO_PASS; clearFieldError('loginPassword','loginPasswordError'); p.classList.add('input-valid'); p.classList.remove('input-invalid'); }
    var err=document.getElementById('loginError');
    if(err){ err.style.display='none'; err.textContent=''; }
}

function openModal(modalName){
    var modal=document.getElementById(modalName+'Modal');
    if(modal){
        if(modalName==='login') fillDemoCredentials();
        modal.classList.add('active');
        document.body.style.overflow='hidden';
        // focus first input after animation
        setTimeout(function(){
            var focusMap={login:'loginEmail',register:'registerFirstName',forgot:'forgotEmail'};
            var id=focusMap[modalName];
            var inp=id&&document.getElementById(id);
            if(inp) inp.focus();
        }, 80);
    }
}
function closeModal(modalName){
    var modal=document.getElementById(modalName+'Modal');
    if(modal){
        modal.classList.remove('active');
        document.body.style.overflow='';
    }
}
function switchModal(fromModal,toModal){
    closeModal(fromModal);
    setTimeout(function(){ openModal(toModal); }, 180);
}
// click outside + ESC
document.querySelectorAll('.modal').forEach(function(modal){
    modal.addEventListener('click', function(e){
        if(e.target===modal){
            var modalId=modal.id.replace('Modal','');
            closeModal(modalId);
        }
    });
});
document.addEventListener('keydown', function(e){
    if(e.key==='Escape'){
        document.querySelectorAll('.modal.active').forEach(function(modal){
            var modalId=modal.id.replace('Modal','');
            closeModal(modalId);
        });
    }
});

// ===== Real-Time Restrictions (portal sanitize) =====
document.getElementById('registerFirstName')?.addEventListener('input', function(e){ e.target.value=sanitizeFirstName(e.target.value); updateRegisterStrength(); liveValidateRegister(); });
document.getElementById('registerLastName')?.addEventListener('input', function(e){ e.target.value=sanitizeLastName(e.target.value); liveValidateRegister(); });
document.getElementById('registerEmail')?.addEventListener('input', function(e){ e.target.value=sanitizeEmail(e.target.value); liveValidateRegister(); });
document.getElementById('registerPhone')?.addEventListener('input', function(e){ e.target.value=sanitizePhone(e.target.value); liveValidateRegister(); });
document.getElementById('registerPassword')?.addEventListener('input', function(e){ e.target.value=sanitizePasswordNoSpaces(e.target.value); updateRegisterStrength(); liveValidateRegister(); });
document.getElementById('registerPasswordConfirm')?.addEventListener('input', function(e){ e.target.value=sanitizePasswordNoSpaces(e.target.value); liveValidateRegister(); });
document.getElementById('loginEmail')?.addEventListener('input', function(e){ e.target.value=sanitizeEmail(e.target.value); });
document.getElementById('forgotEmail')?.addEventListener('input', function(e){ e.target.value=sanitizeEmail(e.target.value); });
document.querySelectorAll('input[type="password"]').forEach(function(input){
    input.addEventListener('input', function(e){ e.target.value=sanitizePasswordNoSpaces(e.target.value); });
});

// strength meter update
function updateRegisterStrength(){
    var passEl=document.getElementById('registerPassword');
    var bar=document.getElementById('registerStrength');
    var fill=document.getElementById('registerStrengthFill');
    var label=document.getElementById('registerStrengthLabel');
    if(!passEl||!bar||!fill||!label) return;
    var v=passEl.value;
    if(!v){ bar.style.display='none'; return; }
    var s=getPasswordStrength(v);
    bar.style.display='flex';
    fill.style.width=s.percent+'%';
    fill.style.background=s.color;
    label.textContent=s.label;
    label.style.color=s.color;
}

// live validation helpers (portal touched concept simplified)
var registerTouched={};
['registerFirstName','registerLastName','registerEmail','registerPhone','registerPassword','registerPasswordConfirm'].forEach(function(id){
    var el=document.getElementById(id);
    if(el){
        el.addEventListener('blur', function(){ registerTouched[id]=true; liveValidateRegister(); });
        el.addEventListener('input', function(){ if(registerTouched[id]) liveValidateRegister(); });
    }
});
function liveValidateRegister(){
    var fn=document.getElementById('registerFirstName')?.value||'';
    var ln=document.getElementById('registerLastName')?.value||'';
    var em=document.getElementById('registerEmail')?.value||'';
    var ph=document.getElementById('registerPhone')?.value||'';
    var pw=document.getElementById('registerPassword')?.value||'';
    var cf=document.getElementById('registerPasswordConfirm')?.value||'';
    var res=validateRegister(fn,ln,em,ph,pw,cf);
    var map={firstName:['registerFirstName','registerFirstNameError'],lastName:['registerLastName','registerLastNameError'],email:['registerEmail','registerEmailError'],phone:['registerPhone','registerPhoneError'],password:['registerPassword','registerPasswordError'],confirm:['registerPasswordConfirm','registerPasswordConfirmError']};
    Object.keys(map).forEach(function(k){
        var ids=map[k];
        var shouldShow=registerTouched[ids[0]];
        if(shouldShow){
            if(res.errors[k]) setFieldError(ids[0],ids[1],res.errors[k]);
            else clearFieldError(ids[0],ids[1]);
        }
    });
}

var loginTouched={};
['loginEmail','loginPassword'].forEach(function(id){
    var el=document.getElementById(id);
    if(el){
        el.addEventListener('blur', function(){ loginTouched[id]=true; liveValidateLogin(); });
        el.addEventListener('input', function(){ if(loginTouched[id]) liveValidateLogin(); });
    }
});
function liveValidateLogin(){
    var em=document.getElementById('loginEmail')?.value||'';
    var pw=document.getElementById('loginPassword')?.value||'';
    var res=validateLogin(em,pw);
    if(loginTouched['loginEmail']){
        if(res.errors.email) setFieldError('loginEmail','loginEmailError',res.errors.email);
        else clearFieldError('loginEmail','loginEmailError');
    }
    if(loginTouched['loginPassword']){
        if(res.errors.password) setFieldError('loginPassword','loginPasswordError',res.errors.password);
        else clearFieldError('loginPassword','loginPasswordError');
    }
}

// ===== Session (mockup-v2 sin consumo, localStorage) =====
var SESSION_KEY='somnguard_user';
function saveSession(user){ try{ localStorage.setItem(SESSION_KEY, JSON.stringify(user)); }catch(e){} }
function getSession(){ try{ var raw=localStorage.getItem(SESSION_KEY); return raw?JSON.parse(raw):null; }catch(e){return null;} }
function clearSession(){ try{ localStorage.removeItem(SESSION_KEY); }catch(e){} }
function setHeaderLogged(isLogged){
    var authButtons=document.getElementById('authButtons');
    var loggedButtons=document.getElementById('loggedButtons');
    if(authButtons) authButtons.classList.toggle('hidden', isLogged);
    if(loggedButtons) loggedButtons.classList.toggle('hidden', !isLogged);
    var logoutBtn=document.getElementById('logoutBtn');
    if(logoutBtn) logoutBtn.classList.toggle('hidden', !isLogged);
}
function showDashboard(user){
    setHeaderLogged(true);
    document.getElementById('dashboardSection')?.classList.add('hidden');
    document.querySelector('.hero')?.classList.remove('hidden');
    if(user && user.name && document.getElementById('dashboardUserName')){
        document.getElementById('dashboardUserName').textContent='Bienvenido, '+user.name;
        document.getElementById('dashboardUserEmail').textContent=user.email;
    }
}
function logout(){
    clearSession();
    setHeaderLogged(false);
    document.getElementById('dashboardSection')?.classList.add('hidden');
    document.querySelector('.hero')?.classList.remove('hidden');
    document.getElementById('loginForm')?.reset();
    document.getElementById('registerForm')?.reset();
    document.getElementById('forgotForm')?.reset();
    fillDemoCredentials();
    // clear validations
    ['loginEmail','loginPassword','registerFirstName','registerLastName','registerEmail','registerPhone','registerPassword','registerPasswordConfirm','forgotEmail'].forEach(function(id){
        var input=document.getElementById(id);
        if(input) input.classList.remove('input-invalid','input-valid');
    });
    ['loginEmailError','loginPasswordError','registerFirstNameError','registerLastNameError','registerEmailError','registerPhoneError','registerPasswordError','registerPasswordConfirmError','forgotEmailError'].forEach(function(id){
        var el=document.getElementById(id);
        if(el) el.textContent='';
    });
    var strength=document.getElementById('registerStrength');
    if(strength) strength.style.display='none';
    ['loginError','registerError','forgotError','forgotSuccess'].forEach(function(id){
        var el=document.getElementById(id);
        if(el){ el.style.display='none'; el.textContent=''; }
    });
    registerTouched={};
    loginTouched={};
    // reset submit buttons text
    var lb=document.getElementById('loginBtn'); if(lb){ lb.disabled=false; lb.innerHTML='Iniciar sesión'; }
    var rb=document.getElementById('registerBtn'); if(rb){ rb.disabled=false; rb.innerHTML='Registrarse'; }
    var fb=document.getElementById('forgotBtn'); if(fb){ fb.disabled=false; fb.innerHTML='Enviar enlace'; }
    showToast('Sesión cerrada','Has cerrado sesión correctamente.','info');
    window.scrollTo({top:0,behavior:'smooth'});
}

// ===== Form Handlers (portal sin fetch: simulación offline) =====
async function handleLogin(e){
    e.preventDefault();
    var btn=document.getElementById('loginBtn');
    var error=document.getElementById('loginError');
    error.style.display='none'; error.textContent='';
    // touched all
    loginTouched={loginEmail:true,loginPassword:true};
    var email=document.getElementById('loginEmail').value.trim().toLowerCase();
    var password=document.getElementById('loginPassword').value;
    // sanitiza
    email=sanitizeEmail(email);
    document.getElementById('loginEmail').value=email;
    var res=validateLogin(email,password);
    if(!res.valid){
        if(res.errors.email) setFieldError('loginEmail','loginEmailError',res.errors.email); else clearFieldError('loginEmail','loginEmailError');
        if(res.errors.password) setFieldError('loginPassword','loginPasswordError',res.errors.password); else clearFieldError('loginPassword','loginPasswordError');
        return;
    }
    clearFieldError('loginEmail','loginEmailError');
    clearFieldError('loginPassword','loginPasswordError');
    // mock credential check (portal consumiría POST /auth/login)
    if(email!=='admin@somnguard.com' || password!=='1234'){
        error.textContent='Credenciales incorrectas. Usa admin@somnguard.com y 1234.';
        error.style.display='block';
        setFieldError('loginEmail','loginEmailError','');
        setFieldError('loginPassword','loginPasswordError','');
        // keep message in general error for demo
        return;
    }
    // spinner like portal
    var orig=btn.innerHTML;
    btn.disabled=true;
    btn.innerHTML='<span class="spinner" aria-hidden="true"></span> Validando...';
    await new Promise(function(r){setTimeout(r,700);});
    var name=email.split('@')[0].replace(/[._-]/g,' ');
    var normalizedName=name.split(' ').filter(Boolean).map(function(w){return w.charAt(0).toUpperCase()+w.slice(1);}).join(' ');
    closeModal('login');
    document.getElementById('loginForm').reset();
    fillDemoCredentials();
    var sessionUser={name:normalizedName||'Usuario', email:email};
    saveSession(sessionUser);
    btn.disabled=false; btn.innerHTML=orig;
    loginTouched={};
    showToast('¡Bienvenido!','Sesión iniciada correctamente.','success');
    // mockup v2 fluye directo a admin.html (no mantiene dashboard inline)
    window.location.href='./admin.html';
}
async function handleRegister(e){
    e.preventDefault();
    var btn=document.getElementById('registerBtn');
    var error=document.getElementById('registerError');
    error.style.display='none'; error.textContent='';
    registerTouched={registerFirstName:true,registerLastName:true,registerEmail:true,registerPhone:true,registerPassword:true,registerPasswordConfirm:true};
    var firstName=document.getElementById('registerFirstName').value;
    var lastName=document.getElementById('registerLastName').value;
    var email=document.getElementById('registerEmail').value.trim();
    var phone=document.getElementById('registerPhone').value.trim();
    var password=document.getElementById('registerPassword').value;
    var confirm=document.getElementById('registerPasswordConfirm').value;
    // sanitize like portal
    firstName=sanitizeFirstName(firstName).trim();
    lastName=sanitizeLastName(lastName).trim();
    email=sanitizeEmail(email);
    phone=sanitizePhone(phone).trim();
    // do not sanitize password beyond spaces
    password=sanitizePasswordNoSpaces(password);
    confirm=sanitizePasswordNoSpaces(confirm);
    document.getElementById('registerFirstName').value=firstName;
    document.getElementById('registerLastName').value=lastName;
    document.getElementById('registerEmail').value=email;
    document.getElementById('registerPhone').value=phone;
    document.getElementById('registerPassword').value=password;
    document.getElementById('registerPasswordConfirm').value=confirm;
    var res=validateRegister(firstName,lastName,email,phone,password,confirm);
    if(!res.valid){
        if(res.errors.firstName) setFieldError('registerFirstName','registerFirstNameError',res.errors.firstName); else clearFieldError('registerFirstName','registerFirstNameError');
        if(res.errors.lastName) setFieldError('registerLastName','registerLastNameError',res.errors.lastName); else clearFieldError('registerLastName','registerLastNameError');
        if(res.errors.email) setFieldError('registerEmail','registerEmailError',res.errors.email); else clearFieldError('registerEmail','registerEmailError');
        if(res.errors.phone) setFieldError('registerPhone','registerPhoneError',res.errors.phone); else clearFieldError('registerPhone','registerPhoneError');
        if(res.errors.password) setFieldError('registerPassword','registerPasswordError',res.errors.password); else clearFieldError('registerPassword','registerPasswordError');
        if(res.errors.confirm) setFieldError('registerPasswordConfirm','registerPasswordConfirmError',res.errors.confirm); else clearFieldError('registerPasswordConfirm','registerPasswordConfirmError');
        updateRegisterStrength();
        return;
    }
    // clear errors
    ['registerFirstName','registerLastName','registerEmail','registerPhone','registerPassword','registerPasswordConfirm'].forEach(function(id){
        var errId=id+'Error';
        if(id==='registerPasswordConfirm') errId='registerPasswordConfirmError';
        clearFieldError(id,errId);
    });
    var orig=btn.innerHTML;
    btn.disabled=true;
    btn.innerHTML='<span class="spinner" aria-hidden="true"></span> Creando cuenta...';
    await new Promise(function(r){setTimeout(r,900);});
    showToast('Cuenta creada','Cuenta creada. Ahora puedes iniciar sesión. (mock offline)','success');
    closeModal('register');
    document.getElementById('registerForm').reset();
    var strength=document.getElementById('registerStrength');
    if(strength) strength.style.display='none';
    ['registerFirstName','registerLastName','registerEmail','registerPhone','registerPassword','registerPasswordConfirm'].forEach(function(id){
        var input=document.getElementById(id);
        if(input) input.classList.remove('input-valid','input-invalid');
    });
    ['registerFirstNameError','registerLastNameError','registerEmailError','registerPhoneError','registerPasswordError','registerPasswordConfirmError'].forEach(function(id){
        var el=document.getElementById(id);
        if(el) el.textContent='';
    });
    registerTouched={};
    btn.disabled=false; btn.innerHTML=orig;
    // optional: offer to open login
    setTimeout(function(){ openModal('login'); }, 400);
}
async function handleForgotPassword(e){
    e.preventDefault();
    var btn=document.getElementById('forgotBtn');
    var error=document.getElementById('forgotError');
    var success=document.getElementById('forgotSuccess');
    error.style.display='none'; error.textContent='';
    success.style.display='none'; success.textContent='';
    var email=document.getElementById('forgotEmail').value.trim().toLowerCase();
    email=sanitizeEmail(email);
    document.getElementById('forgotEmail').value=email;
    var res=validateForgot(email);
    if(!res.valid){
        if(res.errors.email) setFieldError('forgotEmail','forgotEmailError',res.errors.email); else clearFieldError('forgotEmail','forgotEmailError');
        return;
    }
    clearFieldError('forgotEmail','forgotEmailError');
    var orig=btn.innerHTML;
    btn.disabled=true;
    btn.innerHTML='<span class="spinner" aria-hidden="true"></span> Enviando...';
    await new Promise(function(r){setTimeout(r,900);});
    var msg='Si existe una cuenta asociada a este correo, se envió un enlace para restablecer la contraseña.';
    success.textContent=msg;
    success.style.display='block';
    showToast('Correo enviado',msg,'success');
    setTimeout(function(){
        closeModal('forgot');
        document.getElementById('forgotForm').reset();
        success.style.display='none';
        success.textContent='';
        var inp=document.getElementById('forgotEmail');
        if(inp) inp.classList.remove('input-valid','input-invalid');
        var errEl=document.getElementById('forgotEmailError');
        if(errEl) errEl.textContent='';
    }, 1800);
    btn.disabled=false; btn.innerHTML=orig;
}

// ===== Dashboard Stats (sin fetch, datos mock como portal/dashboard) =====
var dashboardStats={
    somnolenceWeek:[32,38,29,45,41,36,34], // portal default: [32,38,29,45,41,36,34] (dashboard ui)
    alertsMonth:[4,7,3,5],
    history:[
        {text:'Nivel de somnolencia moderado', date:'Hoy, 10:30', level:'Medio'},
        {text:'Monitoreo iniciado correctamente', date:'Ayer, 08:15', level:'Info'},
        {text:'Nivel de somnolencia bajo', date:'Lun, 16:45', level:'Bajo'}
    ]
};
// preserve original mockup values if needed: [18,24,20,33,28,16,11] -> unified to portal 32...
function getVar(name){ return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
function resizeCanvas(canvas){
    if(!canvas) return null;
    var rect=canvas.getBoundingClientRect();
    var dpr=window.devicePixelRatio||1;
    canvas.width=Math.max(1, Math.floor(rect.width*dpr));
    canvas.height=Math.max(1, Math.floor(rect.height*dpr));
    var ctx=canvas.getContext('2d');
    if(!ctx) return null;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    return{ctx:ctx,width:rect.width,height:rect.height};
}
function drawGrid(ctx,width,height,margin){
    ctx.strokeStyle=getVar('--border');
    ctx.lineWidth=1;
    ctx.globalAlpha=0.7;
    var rows=4;
    for(var i=0;i<=rows;i++){
        var y=margin+((height-margin*2)/rows)*i;
        ctx.beginPath(); ctx.moveTo(margin,y); ctx.lineTo(width-margin,y); ctx.stroke();
    }
    ctx.globalAlpha=1;
}
function drawLineChart(canvas,labels,values){
    var resized=resizeCanvas(canvas);
    if(!resized) return;
    var ctx=resized.ctx,width=resized.width,height=resized.height;
    var margin=34, accent=getVar('--accent'), accentLight=getVar('--accent-light'), textMuted=getVar('--text-muted'), bg=getVar('--bg-surface');
    ctx.clearRect(0,0,width,height); ctx.fillStyle=bg; ctx.fillRect(0,0,width,height); drawGrid(ctx,width,height,margin);
    var max=Math.max.apply(null,values.concat([1]));
    var stepX=(width-margin*2)/(values.length-1);
    var points=values.map(function(value,index){return{x:margin+stepX*index,y:height-margin-((height-margin*2)*value)/max,value:value};});
    ctx.beginPath(); ctx.moveTo(points[0].x,height-margin); points.forEach(function(p){ctx.lineTo(p.x,p.y);}); ctx.lineTo(points[points.length-1].x,height-margin); ctx.closePath(); ctx.fillStyle=accentLight; ctx.fill();
    ctx.beginPath(); points.forEach(function(p,i){i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y);}); ctx.strokeStyle=accent; ctx.lineWidth=3; ctx.stroke();
    points.forEach(function(p){ctx.beginPath(); ctx.arc(p.x,p.y,4.5,0,Math.PI*2); ctx.fillStyle=accent; ctx.fill(); ctx.fillStyle=accent; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(p.value+'%',p.x,p.y-10);});
    ctx.fillStyle=textMuted; ctx.font='12px sans-serif'; ctx.textAlign='center'; labels.forEach(function(label,index){ var x=margin+stepX*index; ctx.fillText(label,x,height-10);});
}
function drawBarChart(canvas,labels,values){
    var resized=resizeCanvas(canvas);
    if(!resized) return;
    var ctx=resized.ctx,width=resized.width,height=resized.height;
    var margin=34, accent=getVar('--accent'), accentLight=getVar('--accent-light'), textMuted=getVar('--text-muted'), bg=getVar('--bg-surface');
    ctx.clearRect(0,0,width,height); ctx.fillStyle=bg; ctx.fillRect(0,0,width,height); drawGrid(ctx,width,height,margin);
    var max=Math.max.apply(null,values.concat([1]));
    var innerW=width-margin*2, innerH=height-margin*2, gap=14, barWidth=(innerW-gap*(values.length-1))/values.length;
    values.forEach(function(value,index){
        var barH=(innerH*value)/max; var x=margin+index*(barWidth+gap); var y=height-margin-barH;
        ctx.fillStyle=accentLight; ctx.fillRect(x,y,barWidth,barH); ctx.strokeStyle=accent; ctx.lineWidth=2; ctx.strokeRect(x,y,barWidth,barH);
        ctx.fillStyle=accent; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(String(value),x+barWidth/2,y-8); ctx.fillStyle=textMuted; ctx.fillText(labels[index],x+barWidth/2,height-10);
    });
}
function renderDashboardStats(){
    var avgSleep=document.getElementById('avgSleep');
    var monthAlerts=document.getElementById('monthAlerts');
    var sessionCount=document.getElementById('sessionCount');
    var historyList=document.getElementById('historyList');
    var sleepCanvas=document.getElementById('somnolenceChart');
    var alertsCanvas=document.getElementById('alertsChart');
    if(avgSleep){ var avg=dashboardStats.somnolenceWeek.reduce(function(a,b){return a+b;},0)/dashboardStats.somnolenceWeek.length; avgSleep.textContent=Math.round(avg)+'%'; }
    if(monthAlerts){ var total=dashboardStats.alertsMonth.reduce(function(a,b){return a+b;},0); monthAlerts.textContent=total; }
    if(sessionCount) sessionCount.textContent='12';
    if(historyList){ historyList.innerHTML=dashboardStats.history.map(function(item){return '<div class="history-item"><div class="history-meta"><strong>'+item.text+'</strong><span>'+item.date+'</span></div><div class="badge">'+item.level+'</div></div>';}).join(''); }
    drawLineChart(sleepCanvas,['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'],dashboardStats.somnolenceWeek);
    drawBarChart(alertsCanvas,['S1','S2','S3','S4'],dashboardStats.alertsMonth);
}
window.addEventListener('resize', function(){
    var dashboardSection=document.getElementById('dashboardSection');
    if(dashboardSection && !dashboardSection.classList.contains('hidden')) renderDashboardStats();
});

// ===== Download (portal: /SOMNGUARD_APK_EN_PROCESO.pdf) =====
function downloadApp(){
    var pdfPath='./SOMNGUARD_APK_EN_PROCESO.pdf';
    var link=document.createElement('a');
    link.href=pdfPath;
    link.download='SOMNGUARD_APK_EN_PROCESO.pdf';
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('Descarga','SOMNGUARD APK en proceso — se descargó el PDF informativo.','info');
}

// ===== Restore session (mockup-v2 persistencia) =====
(function restoreSession(){
    fillDemoCredentials();
    var saved=getSession();
    if(saved && saved.email){
        setHeaderLogged(true);
        // no auto-redirect para no atrapar "Salir al sitio"
    }
    // ensure dashboard stats ready if shown manually
    try{ renderDashboardStats(); }catch(e){}
})();

// expose globals for inline handlers
window.openModal=openModal;
window.closeModal=closeModal;
window.switchModal=switchModal;
window.fillDemoCredentials=fillDemoCredentials;
window.logout=logout;
window.handleLogin=handleLogin;
window.handleRegister=handleRegister;
window.handleForgotPassword=handleForgotPassword;
window.togglePassword=togglePassword;
window.downloadApp=downloadApp;
