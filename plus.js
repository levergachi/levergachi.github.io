/* 레버가치 · 지난 방문 대비 변화 (plus.js v1)
   - stocks.json의 등급·점수를 이 브라우저(localStorage "lgsnap1")에 날짜별로 저장하고, 이전 날짜 기록과 비교한다.
   - 「오늘의 한 줄」 아래에 변화 카드, 종목 목록에는 ▲▼ 배지를 붙인다. 서버로 보내는 값은 없다.
   - 기존 키(lgp1)와 게임 키(lv3d_*)는 읽기만 하거나 건드리지 않는다. */
(function () {
  'use strict';
  if (window.__wbPlus) return; window.__wbPlus = 1;
  var KEY = 'lgsnap1', MIN = 0.5;
  var cur = null, prev = null, prevSg = null, curSg = {}, prevDay = '', curDay = '', diff = {};
  var ORD = ['D', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+', 'S-', 'S', 'S+'];
  function rank(g) { var i = ORD.indexOf(String(g || '')); return i >= 0 ? i : ORD.indexOf(String(g || 'D').charAt(0)); }

  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function f1(n) { return (Math.round(n * 10) / 10).toFixed(1); }
  function md(d) { return d ? d.slice(5).replace('-', '/') : ''; }

  var css = '#wbChg h2{margin-bottom:6px}#wbChg .wbs{margin:10px 0 0}#wbChg .wbs b{display:block;font-size:13px;color:var(--mute,#667085);margin-bottom:4px}' +
    '#wbChg .wbc{display:flex;flex-wrap:wrap;gap:6px}' +
    '#wbChg button.wbi{appearance:none;border:1px solid var(--line,#e4e7ec);background:var(--chip,#eef2f6);border-radius:999px;padding:6px 10px;font:600 13px inherit;color:var(--ink,#17202a);cursor:pointer;touch-action:manipulation}' +
    '#wbChg .wbu{color:var(--up,#c2410c);font-weight:800}#wbChg .wbd2{color:var(--dn,#1d4ed8);font-weight:800}' +
    '#wbChg .wbn{font-size:12px;color:var(--mute,#667085);margin-top:10px}' +
    '.wbdl{display:block;font-size:11px;font-weight:800;line-height:1.2}.wbdl.u{color:var(--up,#c2410c)}.wbdl.d{color:var(--dn,#1d4ed8)}';

  function snapOf(items) {
    var m = {};
    items.forEach(function (x) { if (x && x.t && typeof x.s === 'number') m[x.t] = [x.g, x.s, x.c, x.n]; });
    return m;
  }

  function compute(items) {
    var out = { newOn: [], up: [], down: [], gradeUp: [], gradeDown: [], all: {} };
    if (!prev) return out;
    items.forEach(function (x) {
      var p = prev[x.t]; if (!p || typeof x.s !== 'number') return;
      var d = Math.round((x.s - p[1]) * 10) / 10, gc = x.g !== p[0];
      var rec = { t: x.t, n: x.n, g: x.g, pg: p[0], s: x.s, d: d, gc: gc };
      out.all[x.t] = rec;
      if (curSg[x.t] && !(prevSg && prevSg[x.t])) out.newOn.push(rec);
      else if (gc && rank(x.g) > rank(p[0])) out.gradeUp.push(rec);
      else if (gc && rank(x.g) < rank(p[0])) out.gradeDown.push(rec);
      if (d >= MIN) out.up.push(rec); else if (d <= -MIN) out.down.push(rec);
    });
    out.up.sort(function (a, b) { return b.d - a.d; }); out.down.sort(function (a, b) { return a.d - b.d; });
    return out;
  }

  function chip(r, withG) {
    var cls = r.d >= 0 ? 'wbu' : 'wbd2', sign = r.d >= 0 ? '▲' : '▼';
    return '<button type="button" class="wbi" data-t="' + esc(r.t) + '" data-n="' + esc(r.n) + '">' + esc(r.n) + ' ' +
      (withG && r.gc ? esc(r.pg) + '→' + esc(r.g) + ' ' : '') + (Math.abs(r.d) >= 0.1 ? '<span class="' + cls + '">' + sign + f1(Math.abs(r.d)) + '</span>' : '') + '</button>';
  }
  function sec(title, arr, withG, max) {
    if (!arr.length) return '';
    return '<div class="wbs"><b>' + title + ' (' + arr.length + ')</b><div class="wbc">' + arr.slice(0, max || 6).map(function (r) { return chip(r, withG); }).join('') + '</div></div>';
  }

  function myList() { try { var m = JSON.parse(ls('lgp1') || '{}'); return Array.isArray(m.my) ? m.my : []; } catch (e) { return []; } }

  function render() {
    var anchor = document.getElementById('brief'); if (!anchor) return false;
    var box = document.getElementById('wbChg');
    if (!box) { box = document.createElement('div'); box.className = 'card'; box.id = 'wbChg'; anchor.parentNode.insertBefore(box, anchor.nextSibling); }
    var h;
    if (!prev) {
      h = '<h2>📈 지난 방문과 달라진 점</h2><p class="mute" style="margin:0">오늘부터 이 브라우저에 방문 기록을 남기기 시작했어요. 다음 날 다시 오시면 신호·등급·점수가 어떻게 바뀌었는지 보여드려요.</p>';
    } else {
      var my = myList().map(function (t) { return diff.all[t]; }).filter(function (r) { return r && (r.gc || Math.abs(r.d) >= 0.1); })
        .sort(function (a, b) { return Math.abs(b.d) - Math.abs(a.d); });
      h = '<h2>📈 ' + md(prevDay) + ' 대비 달라진 점</h2>';
      var seen = {}; [diff.newOn, diff.gradeUp, diff.gradeDown].forEach(function (a) { a.forEach(function (r) { seen[r.t] = 1; }); });
      function shown(r) { return !seen[r.t]; }
      var body = sec('⭐ 내 종목 변화', my, true, 8) + sec('🟢 새로 신호가 켜졌어요', diff.newOn, true, 6) +
        sec('⬆ 등급이 올랐어요', diff.gradeUp, true, 6) + sec('⬇ 등급이 내려갔어요', diff.gradeDown, true, 6) +
        sec('점수가 많이 오른 종목', diff.up.filter(shown).slice(0, 5), false, 5) + sec('점수가 많이 내린 종목', diff.down.filter(shown).slice(0, 5), false, 5);
      h += body || '<p class="mute" style="margin:0">큰 변화가 없어요. (점수 ±' + MIN + '점 이상, 등급 변경, 새 신호 기준)</p>';
    }
    h += '<div class="wbn">이 브라우저에 저장된 지난 방문 기록과 비교한 값이에요. 서버로 보내지 않아요. 재미·참고용이며 매수·매도 권유가 아니에요.</div>';
    box.innerHTML = h;
    return true;
  }

  function openT(t, name) {
    var li = document.querySelector('li[data-t="' + t.replace(/"/g, '') + '"]');
    if (li) { li.click(); return; }
    var q = document.getElementById('q');
    if (q) { q.value = name || t; q.dispatchEvent(new Event('input', { bubbles: true })); setTimeout(function () { var r = document.querySelector('#res li[data-t="' + t.replace(/"/g, '') + '"]') || document.querySelector('#res li[data-t]'); if (r) r.click(); }, 250); }
  }

  var tm = 0;
  function badge() {
    clearTimeout(tm);
    tm = setTimeout(function () {
      if (!prev) return;
      [].forEach.call(document.querySelectorAll('li[data-t]'), function (li) {
        if (li.getAttribute('data-wbd') === '1') return;
        var r = diff.all[li.getAttribute('data-t')]; li.setAttribute('data-wbd', '1');
        if (!r || (Math.abs(r.d) < 0.1 && !r.gc)) return;
        var cell = li.lastElementChild; if (!cell) return;
        var s = document.createElement('small'); s.className = 'wbdl ' + (r.d >= 0 ? 'u' : 'd');
        s.textContent = (r.d >= 0 ? '▲' : '▼') + f1(Math.abs(r.d)) + (r.gc ? ' ' + r.pg + '→' + r.g : '');
        cell.appendChild(s);
      });
    }, 120);
  }

  function start(items, day, sigs) {
    curDay = day; cur = snapOf(items); curSg = {}; (sigs || []).forEach(function (s) { if (s && s.t) curSg[s.t] = 1; });
    var snap = null; try { snap = JSON.parse(ls(KEY) || 'null'); } catch (e) {}
    if (snap && snap.v === 1) {
      if (snap.d < day) { prev = snap.m; prevSg = snap.sg || {}; prevDay = snap.d; }   // 새 날짜: 마지막 기록이 비교 기준
      else { prev = snap.p || null; prevSg = snap.ps || null; prevDay = snap.pd || ''; } // 같은 날 재방문(또는 자료 역행): 이전 날짜 기록 유지
    }
    ls(KEY, JSON.stringify({ v: 1, d: (snap && snap.v === 1 && snap.d > day) ? snap.d : day, m: cur, sg: curSg, p: prev, ps: prevSg, pd: prevDay }));
    diff = compute(items);
    var tries = 0, iv = setInterval(function () { if (render() || ++tries > 40) clearInterval(iv); }, 250);
    document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('#wbChg button.wbi'); if (b) openT(b.dataset.t, b.dataset.n); });
    new MutationObserver(badge).observe(document.body, { childList: true, subtree: true });
    badge();
  }

  function init() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var T = Math.floor(Date.now() / 120000);
    function J(u) { return fetch(u + '?t=' + T, { cache: 'default' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }); }
    Promise.all([J('stocks.json'), J('data.json').catch(function () { return {}; })]).then(function (a) {
      var j = a[0], d = a[1] || {}, items = j && j.items; if (!items || !items.length) return;
      var day = String(j.updated || '').slice(0, 10); if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
      start(items, day, d.signals);
    }).catch(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
