/* Tan Ara browser push configuration. Keep this public VAPID key in sync with Supabase secrets. */
window.TANARA_VAPID_PUBLIC_KEY = 'BKXQhpCFpL9q0Di4Wt1Oc7SyBSOosy4gRMt8_ebhuNgT7XtwZynesCUa7mS1-4J40XizYp3egvezseOLEJ10Jz8';

/* Styling only: today's/tomorrow's dashboard cards and Persian date controls are already
   implemented in index.html. Do not inject a second copy of those cards. */
(function () {
  'use strict';
  function installStyle() {
    if (!document.head || document.getElementById('tanara-header-text-style')) return;
    const style = document.createElement('style');
    style.id = 'tanara-header-text-style';
    style.textContent = `
      .logo-caption, .logo-caption *, .tanara-contact, .tanara-contact *,
      .welcome-mini, .welcome-copy { color:#000 !important; text-shadow:none !important; }
      .logo-caption strong, .tanara-contact strong, .welcome-mini { font-weight:800 !important; }
      .client-job { font-weight:400; opacity:.7; }
      .client-list-simple .client-name { font-weight:700; }
    `;
    document.head.appendChild(style);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installStyle, { once: true });
  } else {
    installStyle();
  }
})();
