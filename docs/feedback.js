/* 泓算网页版 - 问题反馈与建议（FormSubmit 免费通道，反馈直接发送到作者邮箱） */
(function () {
  'use strict';
  // 收件邮箱：首次提交后 FormSubmit 会发一封确认邮件到该邮箱，点击激活后正式生效
  var FEEDBACK_TO = '2014797056@qq.com';
  var endpoint = FEEDBACK_TO ? 'https://formsubmit.co/ajax/' + FEEDBACK_TO : '';

  var overlay, modal;

  var RATE_WINDOW_MS = 60 * 1000;      // 1 分钟内只允许提交一次
  var DAY_WINDOW_MS = 24 * 60 * 60 * 1000;
  var DAY_LIMIT = 5;
  var MIN_TEXT_LEN = 5;
  var MAX_TEXT_LEN = 2000;

  function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || fallback); }
    catch (e) { return fallback; }
  }

  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  function simpleHash(text) {
    var h = 5381;
    for (var i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
    return h.toString(16);
  }

  function checkFeedbackLimit(text) {
    var now = Date.now();
    var last = Number(localStorage.getItem('hs_feedback_last') || 0);
    if (now - last < RATE_WINDOW_MS) return '提交太频繁，请稍后再试';

    var day = readJson('hs_feedback_day', { start: now, count: 0, hashes: [] });
    if (now - Number(day.start || 0) >= DAY_WINDOW_MS) day = { start: now, count: 0, hashes: [] };
    if (Number(day.count || 0) >= DAY_LIMIT) return '今日反馈已达上限，请明天再试';

    var h = simpleHash(text);
    if ((day.hashes || []).indexOf(h) !== -1) return '请勿重复提交相同内容';
    return '';
  }

  function markFeedbackSent(text) {
    var now = Date.now();
    try { localStorage.setItem('hs_feedback_last', String(now)); } catch (e) {}
    var day = readJson('hs_feedback_day', { start: now, count: 0, hashes: [] });
    if (now - Number(day.start || 0) >= DAY_WINDOW_MS) day = { start: now, count: 0, hashes: [] };
    day.count = Number(day.count || 0) + 1;
    day.hashes = (day.hashes || []).slice(-19);
    day.hashes.push(simpleHash(text));
    writeJson('hs_feedback_day', day);
  }

  function ensureUI() {
    if (document.getElementById('fbOverlay')) return;
    var css = document.createElement('style');
    css.textContent = [
      '#fbFab{position:fixed;right:14px;bottom:16px;z-index:9999;padding:9px 16px;',
      'border:none;border-radius:22px;background:#1d1d1f;color:#fff;font-size:13px;',
      'font-family:inherit;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.22);opacity:.92}',
      '#fbFab:hover{opacity:1}#fbFab:active{transform:scale(.97)}',
      '#fbOverlay{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.45);',
      'display:flex;align-items:center;justify-content:center;padding:16px}',
      '#fbOverlay[hidden]{display:none}',
      '#fbModal{background:#fff;border-radius:16px;max-width:420px;width:100%;',
      'max-height:86vh;overflow-y:auto;padding:18px;box-sizing:border-box}',
      '#fbModal h3{margin:0 0 10px;font-size:15.5px;font-weight:600}',
      '#fbModal .fb-type{display:flex;gap:8px;margin-bottom:10px}',
      '#fbModal .fb-type button{flex:1;padding:7px 0;border:1px solid rgba(0,0,0,.15);',
      'border-radius:9px;background:#fff;font-size:13px;font-family:inherit;cursor:pointer}',
      '#fbModal .fb-type button.on{background:#1d1d1f;color:#fff;border-color:#1d1d1f}',
      '#fbModal textarea,#fbModal input{width:100%;box-sizing:border-box;border:1px solid rgba(0,0,0,.15);',
      'border-radius:9px;padding:9px 10px;font:13px/1.55 inherit;font-family:inherit;resize:vertical;',
      'margin-bottom:10px;background:#fafafa;outline:none}',
      '#fbModal textarea:focus,#fbModal input:focus{border-color:#1d1d1f;background:#fff}',
      '#fbModal .fb-actions{display:flex;gap:8px;justify-content:flex-end}',
      '#fbModal .fb-actions button{padding:7px 18px;border-radius:9px;border:1px solid rgba(0,0,0,.15);',
      'background:#fff;font-size:13px;font-family:inherit;cursor:pointer}',
      '#fbModal .fb-actions button#fbSend{background:#1d1d1f;color:#fff;border-color:#1d1d1f}',
      '#fbModal .fb-actions button:disabled{opacity:.5;cursor:default}',
      '#fbStatus{font-size:12px;margin-top:8px;min-height:16px;color:#6e6e73}',
      '#fbStatus.ok{color:#1a7f37}#fbStatus.err{color:#c62828}',
      '@media (max-width:760px){#fbFab{right:10px;bottom:12px}#fbModal{padding:15px}}'
    ].join('');
    document.head.appendChild(css);

    overlay = document.createElement('div');
    overlay.id = 'fbOverlay';
    overlay.hidden = true;
    overlay.innerHTML =
      '<div id="fbModal" role="dialog" aria-label="问题反馈与建议">' +
      '<h3>💬 问题反馈与建议</h3>' +
      '<div class="fb-type">' +
      '<button type="button" id="fbTypeBug" class="on">🐞 问题反馈</button>' +
      '<button type="button" id="fbTypeIdea">💡 功能建议</button>' +
      '</div>' +
      '<textarea id="fbText" rows="4" placeholder="请描述你遇到的问题或想提的建议…（使用哪个功能、发生了什么）"></textarea>' +
      '<input id="fbContact" type="text" placeholder="联系方式（选填：微信 / QQ / 邮箱）" maxlength="60">' +
      '<input id="fbHoney" type="text" autocomplete="off" tabindex="-1" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0" placeholder="请勿填写此字段">' +
      '<div class="fb-actions">' +
      '<button type="button" id="fbCancel">取消</button>' +
      '<button type="button" id="fbSend">提交反馈</button>' +
      '</div>' +
      '<div id="fbStatus"></div>' +
      '</div>';
    document.body.appendChild(overlay);

    var type = 'bug';
    document.getElementById('fbTypeBug').onclick = function () {
      type = 'bug';
      this.classList.add('on'); document.getElementById('fbTypeIdea').classList.remove('on');
      this.textContent = '🐞 问题反馈'; document.getElementById('fbTypeIdea').textContent = '💡 功能建议';
    };
    document.getElementById('fbTypeIdea').onclick = function () {
      type = 'idea';
      this.classList.add('on'); document.getElementById('fbTypeBug').classList.remove('on');
      this.textContent = '💡 功能建议'; document.getElementById('fbTypeBug').textContent = '🐞 问题反馈';
    };
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.getElementById('fbCancel').onclick = close;
    document.getElementById('fbSend').onclick = submit;
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !overlay.hidden) close(); });
  }

  function open() { ensureUI(); overlay.hidden = false; setStatus(''); document.getElementById('fbText').focus(); }
  function close() { if (overlay) overlay.hidden = true; }
  function setStatus(msg, cls) {
    var el = document.getElementById('fbStatus');
    if (el) { el.textContent = msg; el.className = cls || ''; }
  }

  function submit() {
    var text = (document.getElementById('fbText').value || '').trim();
    var contact = (document.getElementById('fbContact').value || '').trim();
    var honey = (document.getElementById('fbHoney').value || '').trim();
    var typeLabel = document.getElementById('fbTypeIdea').classList.contains('on') ? '功能建议' : '问题反馈';
    if (!text) { setStatus('请先填写反馈内容', 'err'); return; }
    if (text.length < MIN_TEXT_LEN) { setStatus('反馈内容太短，请补充具体问题', 'err'); return; }
    if (text.length > MAX_TEXT_LEN) { setStatus('反馈内容过长，请控制在 2000 字以内', 'err'); return; }
    if (honey) { setStatus('已提交'); return; }
    var limitError = checkFeedbackLimit(text);
    if (limitError) { setStatus(limitError, 'err'); return; }
    if (!endpoint) { setStatus('反馈通道暂未配置，请稍后再试或到 GitHub 仓库提交 Issue', 'err'); return; }
    var btn = document.getElementById('fbSend');
    btn.disabled = true; setStatus('正在提交…');
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        _subject: '【泓算网页版】' + typeLabel,
        _template: 'table',
        _captcha: 'false',
        '反馈类型': typeLabel,
        '反馈内容': text,
        '联系方式': contact || '（未填写）',
        '页面地址': location.href.slice(0, 200),
        '运行版本': (window.__HS_BUILD_INFO && window.__HS_BUILD_INFO.release) || 'unknown',
        '当前功能': (function () { try { var on = document.querySelector('.hs-tree-item.on'); return on ? on.textContent.trim() : '—'; } catch (e) { return '—'; } })(),
        '最近计算': (function () {
          try {
            var data = window.__hsReportData && window.__hsReportData();
            return ((data && data.logs) || []).slice(-3).map(function (e) {
              var r = e.results || {}, k = Object.keys(r)[0];
              return (e.module || '') + (k ? ' ' + k + '=' + r[k] : '');
            }).join(' | ') || '—';
          } catch (e) { return '—'; }
        })(),
        '构建信息': JSON.stringify(window.__HS_BUILD_INFO || {}).slice(0, 300)
      })
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json().then(function (d) {
        if (d && d.success === false) throw new Error(d.message || 'form error');
        return d;
      });
    }).then(function () {
      markFeedbackSent(text);
      try { if (window.umami && window.umami.track) window.umami.track('feedback-' + type); } catch (e) {}
      setStatus('✅ 提交成功，感谢你的反馈！', 'ok');
      document.getElementById('fbText').value = '';
      document.getElementById('fbContact').value = '';
      setTimeout(close, 1600);
    }).catch(function () {
      setStatus('❌ 提交失败，请检查网络后重试', 'err');
    }).finally(function () { btn.disabled = false; });
  }

  ensureUI(); // 页面加载时立即注入样式，确保按钮一开始就是 position:fixed 悬浮

  var fab = document.createElement('button');
  fab.id = 'fbFab';
  fab.type = 'button';
  fab.textContent = '💬 反馈';
  fab.title = '提交问题反馈或功能建议';
  fab.onclick = open;
  document.body.appendChild(fab);

  window.__hsFeedback = { open: open, close: close, submit: submit };
})();
