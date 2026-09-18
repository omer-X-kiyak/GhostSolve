chrome.runtime.onInstalled.addListener(() => {
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [1],
    addRules: [{
      id: 1,
      priority: 1,
      action: {
        type: "modifyHeaders",
        requestHeaders: [{ header: "Origin", operation: "remove" }]
      },
      condition: {
        urlFilter: "http://localhost:*",
        resourceTypes: ["xmlhttprequest"]
      }
    }]
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getActiveConfig") {
    chrome.storage.local.get(['workMode', 'localEngine', 'localModel']).then(cfg => {
      const mode = cfg.workMode || 'local_only';
      let label = "";
      if (mode === 'local_only') {
        label = `🔒 Sadece Yerel [${cfg.localModel || 'Model Yok'}]`;
      } else if (mode === 'hybrid') {
        label = `⚡ Hibrit [${cfg.localModel || 'Bulut'}]`;
      } else {
        label = `☁️ Bulut Modu`;
      }
      sendResponse({ modelName: label });
    });
    return true;
  }

  if (request.action === "solve") {
    handleQuery(request.text).then(sendResponse);
    return true;
  }
});

async function handleQuery(questionText) {
  const config = await chrome.storage.local.get([
    'workMode', 'localEngine', 'localModel', 'cloudProvider', 'cloudApiKey'
  ]);

  const mode = config.workMode || 'local_only';
  const prompt = `Aşağıdaki soruyu doğrudan, kısa ve net çöz. Doğru seçeneği ve kısa gerekçesini belirt:\n\n${questionText}`;

  // 1. SADECE YEREL VEYA HİBRİT MODDA YERELİ ÇALIŞTIR
  if (mode === 'local_only' || mode === 'hybrid') {
    if (!config.localEngine || !config.localModel) {
      return { 
        success: false, 
        error: "Yerel AI motoru (Ollama/LM Studio) algılanamadı. Arka planda çalıştığından emin olun." 
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000); // Ağır modeller için 45 sn tolerans

    try {
      if (config.localEngine === 'ollama') {
        const res = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: config.localModel,
            prompt: prompt,
            stream: false
          }),
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (!res.ok) throw new Error(`Ollama HTTP ${res.status}: ${res.statusText}`);
        const data = await res.json();
        return { success: true, answer: data.response, source: `Yerel Ollama [${config.localModel}]` };
      }

      if (config.localEngine === 'lmstudio') {
        const res = await fetch('http://localhost:1234/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: config.localModel,
            messages: [{ role: 'user', content: prompt }]
          }),
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (!res.ok) throw new Error(`LM Studio HTTP ${res.status}`);
        const data = await res.json();
        return { success: true, answer: data.choices[0].message.content, source: `Yerel LM Studio [${config.localModel}]` };
      }
    } catch (err) {
      clearTimeout(timeout);
      
      // SADECE YEREL MODUNDAYSA BULUTA ASLA GEÇME
      if (mode === 'local_only') {
        const isTimeout = err.name === 'AbortError';
        return { 
          success: false, 
          error: isTimeout 
            ? `Yerel model (${config.localModel}) 45 saniyede yanıt vermedi. Model RAM/VRAM kapasitesini aşıyor olabilir.` 
            : `Yerel Hata: ${err.message}. Modelin çalıştığını kontrol edin.`
        };
      }
      console.warn("Yerel yanıt vermedi, Hibrit mod devrede -> Buluta geçiliyor...");
    }
  }

  // 2. SADECE BULUT VEYA HİBRİT MODDA YEDEK
  const apiKey = config.cloudApiKey;
  if (!apiKey) {
    return { success: false, error: "Bulut için API anahtarı girilmemiş. Popup panelinden anahtar ekleyin." };
  }

  // Fallback modelleri
  const geminiModels = ["gemini-flash-lite-latest", "gemini-2.5-flash-lite", "gemini-flash-latest"];
  for (const m of geminiModels) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await res.json();
      if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return { success: true, answer: data.candidates[0].content.parts[0].text, source: `Bulut [${m}]` };
      }
    } catch (e) {}
  }

  return { success: false, error: "Bulut modellerine de ulaşılamadı." };
}