document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('activeModelStatus');
  const selWorkMode = document.getElementById('selWorkMode');
  const localSettings = document.getElementById('localSettings');
  const selLocalModel = document.getElementById('selLocalModel');
  const cloudSettings = document.getElementById('cloudSettings');
  const selProvider = document.getElementById('selProvider');
  const txtApiKey = document.getElementById('txtApiKey');
  const btnSave = document.getElementById('btnSave');
  const btnRescan = document.getElementById('btnRescan');

  const config = await chrome.storage.local.get([
    'workMode', 'localEngine', 'localModel', 'cloudProvider', 'cloudApiKey'
  ]);

  selWorkMode.value = config.workMode || 'local_only';
  selProvider.value = config.cloudProvider || 'gemini';
  txtApiKey.value = config.cloudApiKey || '';

  function togglePanels() {
    const mode = selWorkMode.value;
    if (mode === 'local_only') {
      localSettings.classList.remove('hidden');
      cloudSettings.classList.add('hidden');
    } else if (mode === 'hybrid') {
      localSettings.classList.remove('hidden');
      cloudSettings.classList.remove('hidden');
    } else {
      localSettings.classList.add('hidden');
      cloudSettings.classList.remove('hidden');
    }
  }

  selWorkMode.addEventListener('change', togglePanels);
  togglePanels();

  async function scanEngines() {
    statusEl.innerHTML = "Ollama ve LM Studio taranıyor...";
    selLocalModel.innerHTML = "";
    let foundModels = [];
    let detectedEngine = null;

    // Ollama Kontrolü
    try {
      const res = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        const data = await res.json();
        if (data.models && data.models.length > 0) {
          detectedEngine = 'ollama';
          foundModels = data.models
            .map(m => m.name)
            .filter(name => !name.includes('embed') && !name.includes('bge'));
        }
      }
    } catch (e) {}

    // LM Studio Kontrolü
    if (foundModels.length === 0) {
      try {
        const res = await fetch('http://localhost:1234/v1/models', { signal: AbortSignal.timeout(1500) });
        if (res.ok) {
          const data = await res.json();
          if (data.data && data.data.length > 0) {
            detectedEngine = 'lmstudio';
            foundModels = data.data.map(m => m.id);
          }
        }
      } catch (e) {}
    }

    if (foundModels.length > 0) {
      foundModels.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.innerText = m;
        selLocalModel.appendChild(opt);
      });

      const selected = (config.localModel && foundModels.includes(config.localModel)) 
        ? config.localModel 
        : foundModels[0];
      selLocalModel.value = selected;

      await chrome.storage.local.set({
        localEngine: detectedEngine,
        localModel: selected
      });

      const modeBadge = selWorkMode.value === 'local_only' 
        ? '<span class="badge badge-local">Sadece Yerel</span>' 
        : (selWorkMode.value === 'hybrid' ? '<span class="badge badge-hybrid">Hibrit</span>' : '<span class="badge badge-cloud">Bulut</span>');

      statusEl.innerHTML = `
        <div>Mod: ${modeBadge}</div>
        <div style="margin-top:4px;"><b>${detectedEngine.toUpperCase()}</b> devrede.</div>
        <div style="color:#a1a1aa; font-size:11px;">Aktif Model: ${selected}</div>
      `;
    } else {
      await chrome.storage.local.set({ localEngine: null, localModel: null });
      statusEl.innerHTML = `
        <div>Durum: <span class="badge badge-cloud">Yerel Yok</span></div>
        <div style="margin-top:4px; color:#f87171;">Ollama veya LM Studio çalışmıyor.</div>
      `;
    }
  }

  btnRescan.addEventListener('click', scanEngines);

  btnSave.addEventListener('click', async () => {
    await chrome.storage.local.set({
      workMode: selWorkMode.value,
      localModel: selLocalModel.value || null,
      cloudProvider: selProvider.value,
      cloudApiKey: txtApiKey.value.trim()
    });
    alert('Ayarlar kaydedildi.');
    window.close();
  });

  scanEngines();
});