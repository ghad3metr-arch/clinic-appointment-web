window.TANARA_VAPID_PUBLIC_KEY='BKXQhpCFpL9q0Di4Wt1Oc7SyBSOosy4gRMt8_ebhuNgT7XtwZynesCUa7mS1-4J40XizYp3egvezseOLEJ10Jz8';

(function(){
  'use strict';

  function ready(fn){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true});
    else fn();
  }

  function pad(n){ return String(n).padStart(2,'0'); }

  function tomorrowIso(){
    const d = new Date();
    d.setHours(12,0,0,0);
    d.setDate(d.getDate()+1);
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  }

  function fa(iso, weekday){
    try{
      if(typeof window.faDate === 'function') return window.faDate(iso, weekday !== false);
      if(!iso) return '-';
      const [y,m,d] = iso.split('-').map(Number);
      const dt = new Date(y,m-1,d,12);
      const o = {calendar:'persian',year:'numeric',month:'long',day:'numeric'};
      if(weekday !== false) o.weekday='long';
      return new Intl.DateTimeFormat('fa-IR-u-ca-persian',o).format(dt);
    }catch(e){ return iso || '-'; }
  }

  function escHtml(x){
    if(typeof window.esc === 'function') return window.esc(x);
    return String(x ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  function clientName(id){
    try{
      if(typeof window.cname === 'function') return window.cname(id);
      const arr = window.d && Array.isArray(window.d.c) ? window.d.c : [];
      const c = arr.find(x=>String(x.id)===String(id));
      return c ? c.n : '-';
    }catch(e){ return '-'; }
  }

  function appointmentsFor(date){
    const arr = window.d && Array.isArray(window.d.a) ? window.d.a : [];
    return arr.filter(a => a && a.date === date && a.status !== 'cancelled')
      .sort((a,b)=>String(a.time||'').localeCompare(String(b.time||'')));
  }

  function renderDayBox(date, title){
    const arr = appointmentsFor(date);
    const rows = arr.length
      ? arr.map(a =>
          `<div class="tanara-day-row">
             <b>${escHtml(a.time || '--:--')}</b>
             <span>${escHtml(clientName(a.c))}</span>
             <small>${escHtml(a.s || '')}</small>
           </div>`
        ).join('')
      : '<div class="tanara-empty">نوبتی ثبت نشده است.</div>';

    return `<section class="tanara-day-box">
      <div class="tanara-day-head">
        <div>
          <b>${title}</b>
          <small>${fa(date,false)}</small>
        </div>
        <strong>${arr.length.toLocaleString('fa-IR')} نوبت</strong>
      </div>
      <div class="tanara-day-list">${rows}</div>
    </section>`;
  }

  function ensureAppointmentSummary(){
    if(!document.body) return;
    let box=document.getElementById('tanaraAppointmentSummary');
    if(!box){
      box=document.createElement('div');
      box.id='tanaraAppointmentSummary';
      box.className='tanara-summary-wrap';

      const cards=document.querySelector('.cards');
      const page=document.querySelector('.page.active') || document.querySelector('.page');
      if(cards && cards.parentNode){
        cards.parentNode.insertBefore(box, cards.nextSibling);
      }else if(page){
        page.insertBefore(box, page.firstChild);
      }else{
        document.body.appendChild(box);
      }
    }

    const t = typeof window.today === 'function' ? window.today() : new Date().toISOString().slice(0,10);
    const tm = tomorrowIso();
    box.innerHTML = renderDayBox(t,'امروز') + renderDayBox(tm,'فردا');
  }

  function syncPaymentDate(){
    const hidden=document.getElementById('pd');
    const out=document.getElementById('pdateFa');
    if(!out) return;
    const iso=hidden && hidden.value;
    if(iso) out.textContent=fa(iso,false);

    const wrap=out.parentElement;
    if(wrap) wrap.classList.add('tanara-payment-date-wrap');

    let visible=document.getElementById('tanaraPaymentDateVisible');
    if(!visible && wrap){
      visible=document.createElement('div');
      visible.id='tanaraPaymentDateVisible';
      visible.className='tanara-payment-date-visible';
      wrap.appendChild(visible);
    }
    if(visible) visible.textContent=iso ? `تاریخ انتخاب‌شده: ${fa(iso,false)}` : 'تاریخ انتخاب‌شده: —';
  }

  function installCss(){
    if(document.getElementById('tanara-v15-css')) return;
    const s=document.createElement('style');
    s.id='tanara-v15-css';
    s.textContent=`
      .tanara-summary-wrap{
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:12px;
        margin:12px 0 16px;
      }
      .tanara-day-box{
        background:#fff;
        border:1px solid #d8e8e4;
        border-radius:16px;
        padding:14px;
        box-shadow:0 3px 12px #0000000d;
      }
      .tanara-day-head{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        padding-bottom:10px;
        margin-bottom:8px;
        border-bottom:1px solid #e4efec;
      }
      .tanara-day-head b{display:block;font-size:18px;color:#087a73}
      .tanara-day-head small{display:block;color:#667c79;margin-top:2px}
      .tanara-day-head strong{
        white-space:nowrap;
        background:#e8f7f3;
        color:#087a73;
        padding:6px 9px;
        border-radius:999px;
        font-size:12px;
      }
      .tanara-day-row{
        display:grid;
        grid-template-columns:58px 1fr;
        gap:3px 8px;
        padding:9px 0;
        border-bottom:1px solid #edf3f1;
      }
      .tanara-day-row:last-child{border-bottom:0}
      .tanara-day-row b{grid-row:span 2}
      .tanara-day-row span{font-weight:700}
      .tanara-day-row small{color:#667c79}
      .tanara-empty{padding:10px;text-align:center;color:#667c79}
      .tanara-payment-date-visible{
        margin-top:7px;
        padding:9px 11px;
        border-radius:10px;
        background:#e8f7f3;
        color:#087a73;
        font-weight:700;
      }
      .logo-caption,.logo-caption *{
        color:#000 !important;
        text-shadow:none !important;
      }
      @media(max-width:800px){
        .tanara-summary-wrap{grid-template-columns:1fr}
      }
    `;
    document.head.appendChild(s);
  }

  function tick(){
    try{
      installCss();
      ensureAppointmentSummary();
      syncPaymentDate();
    }catch(e){
      console.warn('Tanara v15 enhancement:',e);
    }
  }

  ready(function(){
    installCss();

    // Give the original app time to create its DOM and data.
    setTimeout(tick,250);
    setTimeout(tick,1000);
    setTimeout(tick,2500);

    // Keep the dashboard/payment display synchronized with the existing app.
    setInterval(tick,1500);

    document.addEventListener('change',function(e){
      if(e.target && /^(pjy|pjm|pjd|pd)$/.test(e.target.id||'')){
        setTimeout(syncPaymentDate,50);
      }
    });

    document.addEventListener('click',function(){
      setTimeout(tick,80);
    },true);
  });
})();
