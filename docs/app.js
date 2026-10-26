(() => {
  'use strict';
  const config = JSON.parse(document.getElementById('site-data').textContent);
  const storageKey = 'qiaohu-five-listening-v1';
  const state = {best:{'01':'','04':''}, note:'', active:'01'};
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (saved && saved.version === config.version) {
      for (const line of ['01','04']) {
        if (config.candidates.some(c => c.id === saved.best?.[line])) state.best[line] = saved.best[line];
      }
      state.note = typeof saved.note === 'string' ? saved.note : '';
      state.active = saved.active === '04' ? '04' : '01';
    }
  } catch (_) { /* 無法使用儲存時仍可試聽與匯出本次選擇。 */ }
  const pauseAll = () => document.querySelectorAll('audio,video').forEach(media => media.pause());
  const save = () => {
    try { localStorage.setItem(storageKey, JSON.stringify({...state, version:config.version})); } catch (_) {}
  };
  const status = message => { document.getElementById('result-status').textContent = message; };
  const updateChoices = () => {
    document.querySelectorAll('input[type=radio]').forEach(input => {
      const line = input.name.slice(-2);
      input.checked = state.best[line] === input.value;
      input.closest('.candidate').classList.toggle('chosen', input.checked);
    });
    document.getElementById('choices-status').textContent = ['01','04'].map(line =>
      '第' + Number(line) + '句：' + (state.best[line] ? '候選 ' + state.best[line] : '尚未選擇')).join('　／　');
  };
  const setTab = line => {
    pauseAll(); state.active = line;
    document.querySelectorAll('[data-tab]').forEach(button => {
      const chosen = button.dataset.tab === line;
      button.setAttribute('aria-selected', String(chosen));
      button.tabIndex = chosen ? 0 : -1;
    });
    document.querySelectorAll('[data-panel]').forEach(panel => { panel.hidden = panel.dataset.panel !== line; });
    save();
  };
  document.querySelectorAll('[data-tab]').forEach(button => {
    button.addEventListener('click', () => setTab(button.dataset.tab));
    button.addEventListener('keydown', event => {
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const line = event.key === 'Home' ? '01' : event.key === 'End' ? '04' : state.active === '01' ? '04' : '01';
      setTab(line); document.getElementById('tab-' + line).focus();
    });
  });
  document.querySelectorAll('input[type=radio]').forEach(input => input.addEventListener('change', () => {
    state.best[input.name.slice(-2)] = input.value; updateChoices(); save(); status('已保留這個瀏覽器的選擇。');
  }));
  const note = document.getElementById('listening-note'); note.value = state.note;
  note.addEventListener('input', () => { state.note = note.value; save(); });
  document.getElementById('pause-all').addEventListener('click', pauseAll);
  document.addEventListener('play', event => {
    if (!['AUDIO','VIDEO'].includes(event.target.tagName)) return;
    document.querySelectorAll('audio,video').forEach(media => { if (media !== event.target) media.pause(); });
  }, true);
  const resultText = () => '巧虎五候選試聽結果\n' + ['01','04'].map(line => {
    const candidate = config.candidates.find(c => c.id === state.best[line]);
    return '第' + Number(line) + '句：' + (candidate ? '候選 ' + candidate.id + '（' + candidate.name + '）' : '尚未選擇');
  }).join('\n') + '\n備註：' + (state.note.trim() || '無') + '\n';
  document.getElementById('copy-results').addEventListener('click', async () => {
    const text = resultText();
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text); status('結果已複製，可貼回對話。');
      document.getElementById('copy-fallback').hidden = true;
    } catch (_) {
      const fallback = document.getElementById('copy-fallback'); fallback.value = text; fallback.hidden = false;
      fallback.focus(); fallback.select(); status('結果已顯示在下方，可長按或選取複製。');
    }
  });
  document.getElementById('download-results').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob(['\uFEFF' + resultText()], {type:'text/plain;charset=utf-8'}));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = '巧虎五候選_試聽結果.txt';
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000); status('已準備結果文字下載。');
  });
  document.getElementById('clear-choices').addEventListener('click', () => {
    state.best = {'01':'','04':''}; state.note = ''; note.value = ''; updateChoices(); save();
    document.getElementById('copy-fallback').hidden = true; status('已清除這個瀏覽器的選擇。');
  });
  updateChoices(); setTab(state.active);
})();
