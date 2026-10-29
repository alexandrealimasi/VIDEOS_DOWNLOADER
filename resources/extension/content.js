// Content script for VideoGrabber Companion extension

(function () {
  'use strict';

  const BUTTON_ID = 'videograbber-extension-btn';

  function triggerDownload() {
    window.location.href = 'videograbber://download?url=' + encodeURIComponent(window.location.href);
  }

  function createButton() {
    const btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.setAttribute('type', 'button');
    btn.innerHTML = `
      <span style="display:inline-flex;align-items:center;gap:6px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        <span>Télécharger</span>
      </span>
    `;

    Object.assign(btn.style, {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#7c3aed',
      color: '#ffffff',
      border: 'none',
      borderRadius: '18px',
      padding: '0 16px',
      height: '36px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      marginLeft: '8px',
      marginRight: '8px',
      boxShadow: '0 2px 8px rgba(124, 58, 237, 0.4)',
      transition: 'all 0.2s ease',
      zIndex: '9999',
      fontFamily: 'Roboto, Arial, sans-serif',
    });

    btn.onmouseover = () => {
      btn.style.backgroundColor = '#6d28d9';
      btn.style.transform = 'translateY(-1px)';
    };
    btn.onmouseout = () => {
      btn.style.backgroundColor = '#7c3aed';
      btn.style.transform = 'translateY(0)';
    };

    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerDownload();
    };

    return btn;
  }

  function inject() {
    if (document.getElementById(BUTTON_ID)) return;

    if (window.location.hostname.includes('youtube.com')) {
      const targets = [
        '#top-level-buttons-computed',
        'ytd-menu-renderer.ytd-watch-metadata',
        '#owner',
        '#actions-inner',
      ];
      for (const sel of targets) {
        const container = document.querySelector(sel);
        if (container) {
          container.appendChild(createButton());
          return;
        }
      }
    } else {
      const btn = createButton();
      Object.assign(btn.style, {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        height: '44px',
        padding: '0 20px',
        borderRadius: '22px',
        boxShadow: '0 4px 16px rgba(124, 58, 237, 0.6)',
      });
      document.body.appendChild(btn);
    }
  }

  const observer = new MutationObserver(inject);
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('load', inject);
  window.addEventListener('yt-navigate-finish', inject);
  setInterval(inject, 1500);
})();
