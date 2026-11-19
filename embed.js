/* 레버가치 · 원복 객장 입구 (embed.js v1)
   - 헤더 링크줄(텔레그램 봇 옆)에 「🎮 원복 객장」 버튼을 달고, 누르면 게임을 분할/전체화면으로 연다.
   - PC(>=900px): 오른쪽 분할 (1/3 · 1/2 선택) / 폰: 전체화면 기본
   - 최대화(⛶)·닫기(✕). 닫으면 게임 연결을 끊는다. 게임은 누를 때만 불러온다. */
(function () {
  'use strict';
  if (window.__wbEmbed) return; window.__wbEmbed = 1;
  var GAME = 'https://levergachi.github.io/min/room3d.html?embed=1';
  var KEY = 'wb_split', BP = 900;
  var panel, frame, openBtn, state = { open: false, full: false, ratio: 0.5, sheet: false, vr: 0.55 };
  var KEYV = 'wb_vr', dragging = false, raf = 0;
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; }
  function count(n) { try { if (window.goatcounter && goatcounter.count) goatcounter.count({ path: 'event/' + n, title: n, event: true }); } catch (e) {} }
  function isWide() { return window.innerWidth >= BP; }

  var css = [
    '.wbp{position:fixed;top:0;right:0;bottom:0;z-index:2147483000;display:none;flex-direction:column;background:#0b1020;box-shadow:-6px 0 24px rgba(0,0,0,.25);width:50vw}',
    '.wbp.on{display:flex}',
    '.wbp.full,.wbp.phone{left:0;width:100vw;box-shadow:none}',
    '.wbp.sheet{left:0;top:auto;width:100vw;box-shadow:0 -6px 24px rgba(0,0,0,.3)}',
    '.wbh{position:absolute;z-index:5;display:none;touch-action:none;-webkit-user-select:none;user-select:none}',
    '.wbh::after{content:"";position:absolute;border-radius:6px;background:#0f766e;box-shadow:0 0 0 2px #fff}',
    '.wbp.on:not(.full):not(.phone):not(.sheet) .wbh{display:block;left:-12px;top:0;bottom:0;width:24px;cursor:col-resize}',
    '.wbp.on:not(.full):not(.phone):not(.sheet) .wbh::after{left:8px;top:50%;width:8px;height:56px;margin-top:-28px}',
    '.wbp.sheet.on .wbh{display:block;left:0;right:0;top:-16px;height:32px;cursor:row-resize}',
    '.wbp.sheet.on .wbh::after{top:11px;left:50%;height:8px;width:64px;margin-left:-32px}',
    '.wbh:hover::after,.wbh:focus-visible::after,.wbh.d::after{background:#c2410c}',
    '.wbb .sp{display:none}',
    '@media (max-width:899px){.wbb .sp{display:inline-block}}',
    'body.wb-vsplit{padding-bottom:var(--wbh)}',
    '.wbb{flex:0 0 auto;display:flex;align-items:center;gap:6px;padding:6px 8px;background:#0f766e;color:#fff;font:700 14px -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;padding-top:max(6px,env(safe-area-inset-top))}',
    '.wbb .t{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.wbb button{appearance:none;border:1.5px solid rgba(255,255,255,.55);background:rgba(255,255,255,.12);color:#fff;border-radius:9px;min-width:38px;height:34px;padding:0 10px;font:700 14px inherit;cursor:pointer;touch-action:manipulation}',
    '.wbb button.on{background:#fff;color:#0f766e}',
    '.wbb .x{border-color:#fff;background:#b42318}',
    '.wbp iframe{flex:1 1 auto;width:100%;border:0;background:#0b1020}',
    'body.wb-split{padding-right:var(--wbw)}',
    'body.wb-lock{overflow:hidden}',
    '@media (max-width:899px){.wbp .rt{display:none}}'
  ].join('');

  function build() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    panel = document.createElement('div'); panel.className = 'wbp'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', '원복 객장');
    panel.innerHTML = '<div class="wbb"><span class="t">🎮 원복 객장</span>' +
      '<button type="button" class="rt" data-r="0.34" title="1/3 크기">⅓</button>' +
      '<button type="button" class="rt" data-r="0.5" title="1/2 크기">½</button>' +
      '<button type="button" class="sp" title="위아래로 나누기">⬍ 나누기</button>' +
      '<button type="button" class="mx" title="전체화면">⛶ 최대화</button>' +
      '<button type="button" class="x" title="닫기">✕ 닫기</button></div>';
    panel.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.classList.contains('x')) close();
      else if (b.classList.contains('sp')) {
        state.sheet = !state.sheet;
        if (state.sheet && document.fullscreenElement && document.exitFullscreen) { try { document.exitFullscreen(); } catch (x) {} }
        apply(); count(state.sheet ? 'wb-sheet' : 'wb-full');
      }
      else if (b.classList.contains('mx')) toggleFull();
      else if (b.dataset.r) { state.ratio = +b.dataset.r; state.full = false; ls(KEY, String(state.ratio)); apply(); }
    });
    var h = document.createElement('div'); h.className = 'wbh'; h.setAttribute('role', 'separator'); h.tabIndex = 0;
    h.setAttribute('aria-label', '화면 나누는 선 — 끌어서 크기 조절 (방향키도 가능)');
    panel.insertBefore(h, panel.firstChild);
    h.addEventListener('pointerdown', function (e) {
      if (!state.open) return; e.preventDefault(); dragging = true; h.classList.add('d');
      try { h.setPointerCapture(e.pointerId); } catch (x) {}
      if (frame) frame.style.pointerEvents = 'none'; document.body.style.userSelect = 'none';
    });
    h.addEventListener('pointermove', function (e) {
      if (!dragging) return; var x = e.clientX, y = e.clientY;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        raf = 0;
        if (panel.classList.contains('sheet')) state.vr = Math.max(.25, Math.min(.85, (window.innerHeight - y) / window.innerHeight));
        else state.ratio = Math.max(.25, Math.min(.75, (window.innerWidth - x) / window.innerWidth));
        apply();
      });
    });
    function endDrag() {
      if (!dragging) return; dragging = false; h.classList.remove('d');
      if (frame) frame.style.pointerEvents = ''; document.body.style.userSelect = '';
      ls(KEY, String(state.ratio)); ls(KEYV, String(state.vr)); count('wb-drag');
    }
    h.addEventListener('pointerup', endDrag); h.addEventListener('pointercancel', endDrag);
    h.addEventListener('keydown', function (e) {
      var sheet = panel.classList.contains('sheet'), d = 0;
      if (sheet) d = e.key === 'ArrowUp' ? .04 : e.key === 'ArrowDown' ? -.04 : 0;
      else d = e.key === 'ArrowLeft' ? .03 : e.key === 'ArrowRight' ? -.03 : 0;
      if (!d) return; e.preventDefault();
      if (sheet) state.vr = Math.max(.25, Math.min(.85, state.vr + d)); else state.ratio = Math.max(.25, Math.min(.75, state.ratio + d));
      ls(KEY, String(state.ratio)); ls(KEYV, String(state.vr)); apply();
    });
    document.body.appendChild(panel);
  }

  function apply() {
    var wide = isWide(), sheet = !wide && state.sheet, full = wide ? state.full : !sheet;
    panel.classList.toggle('on', state.open);
    panel.classList.toggle('full', state.full && wide);
    panel.classList.toggle('phone', !wide && !sheet);
    panel.classList.toggle('sheet', sheet);
    panel.style.width = (wide && !full && state.open) ? (state.ratio * 100).toFixed(1) + 'vw' : '';
    panel.style.height = (sheet && state.open) ? (state.vr * 100).toFixed(1) + 'vh' : '';
    document.documentElement.style.setProperty('--wbw', (state.ratio * 100).toFixed(1) + 'vw');
    document.documentElement.style.setProperty('--wbh', (state.vr * 100).toFixed(1) + 'vh');
    document.body.classList.toggle('wb-split', state.open && wide && !full);
    document.body.classList.toggle('wb-vsplit', state.open && sheet);
    document.body.classList.toggle('wb-lock', state.open && full);
    var mx = panel.querySelector('.mx'), sp = panel.querySelector('.sp'), fs = !!document.fullscreenElement;
    if (wide) { mx.textContent = state.full ? '⤡ 줄이기' : '⛶ 최대화'; mx.classList.toggle('on', state.full); mx.style.display = ''; }
    else { mx.textContent = fs ? '⤡ 끝내기' : '⛶ 전체화면'; mx.classList.toggle('on', fs); mx.style.display = (!sheet && panel.requestFullscreen) ? '' : 'none'; }
    sp.textContent = sheet ? '⤢ 크게' : '⬍ 나누기'; sp.classList.toggle('on', sheet);
    [].forEach.call(panel.querySelectorAll('.rt'), function (b) { b.classList.toggle('on', !state.full && Math.abs(+b.dataset.r - state.ratio) < .02); });
  }

  function open() {
    if (!panel) build();
    var r = parseFloat(ls(KEY)); if (r > 0.2 && r < 0.8) state.ratio = r;
    var rv = parseFloat(ls(KEYV)); if (rv > 0.2 && rv < 0.9) state.vr = rv; state.sheet = false;
    if (!frame) {
      frame = document.createElement('iframe'); frame.title = '원복 객장 3D';
      frame.setAttribute('allow', 'fullscreen; autoplay; clipboard-write');
      frame.setAttribute('loading', 'eager');
      panel.appendChild(frame);
    }
    if (!frame.getAttribute('src')) frame.src = GAME;
    state.open = true; state.full = !isWide(); apply(); count('wb-open');
  }
  function close() {
    state.open = false; state.full = false;
    if (document.fullscreenElement && document.exitFullscreen) { try { document.exitFullscreen(); } catch (e) {} }
    if (frame) { frame.removeAttribute('src'); frame.src = 'about:blank'; frame.parentNode.removeChild(frame); frame = null; }
    apply(); try { openBtn && openBtn.focus(); } catch (e) {}
  }
  function toggleFull() {
    var wide = isWide();
    if (wide) state.full = !state.full;
    var want = wide ? state.full : !document.fullscreenElement;
    apply(); count(want ? 'wb-max' : 'wb-min');
    try {
      if (want && panel.requestFullscreen) panel.requestFullscreen().catch(function () {});
      else if (!want && document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
    } catch (e) {}
  }
  document.addEventListener('fullscreenchange', function () {
    if (!state.open) return;
    if (isWide() && state.full && !document.fullscreenElement) state.full = false;
    apply();
  });
  window.addEventListener('resize', function () { if (panel && state.open) apply(); });

  function init() {
    var links = document.querySelector('.links'); if (!links) return;
    var a = document.createElement('a'); a.className = 'lk'; a.id = 'wbOpen'; a.textContent = '🎮 원복 객장';
    a.href = 'https://levergachi.github.io/min/room3d.html'; a.target = '_blank'; a.rel = 'noopener';
    a.addEventListener('click', function (e) { e.preventDefault(); open(); });
    var tg = [].filter.call(links.querySelectorAll('a'), function (x) { return /텔레그램/.test(x.textContent); })[0];
    if (tg && tg.nextSibling) links.insertBefore(a, tg.nextSibling); else links.appendChild(a);
    openBtn = a;
    if (/[?&]game=1\b/.test(location.search)) open();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  try { var ms = document.createElement('style'); ms.id = 'wbm'; ms.textContent = '@media (max-width:640px){header{padding-top:10px!important}header .who{font-size:12px}header .sub,header .gl{display:none!important}header h1{font-size:19px!important;margin:4px 0!important}header .links{flex-wrap:nowrap!important;overflow-x:auto;gap:6px!important;padding-bottom:4px;-webkit-overflow-scrolling:touch;scrollbar-width:none}header .links::-webkit-scrollbar{display:none}header .links a{flex:0 0 auto;padding:6px 10px!important;font-size:13px!important;white-space:nowrap}#today.on{display:flex;flex-direction:column}#today>#brief{order:-4}#today>#sigs{order:-3}#today>#wbChg{order:-2}}'; document.head.appendChild(ms); } catch (e) {}
  try { var hj = document.createElement('script'); hj.src = 'hub.js?v=1'; hj.defer = true; document.head.appendChild(hj); } catch (e) {}
  try { var ht = document.createElement('script'); ht.src = 'heat.js?v=1'; ht.defer = true; document.head.appendChild(ht); } catch (e) {}
  try { var nj = document.createElement('script'); nj.src = 'news.js?v=1'; nj.defer = true; document.head.appendChild(nj); } catch (e) {}
  try { var pj = document.createElement('script'); pj.src = 'plus.js?v=1'; pj.defer = true; document.head.appendChild(pj); } catch (e) {}
})();
