// Moodle ve diğer sistemlerdeki metin engellerini aş
const style = document.createElement('style');
style.innerHTML = `* { -webkit-user-select: text !important; -moz-user-select: text !important; user-select: text !important; }`;
document.documentElement.appendChild(style);

let lastSelectedText = "";

// Yüzen Buton
const floatingBtn = document.createElement('button');
floatingBtn.innerText = '🔍 Çöz';
floatingBtn.style.cssText = `
  position: absolute !important;
  display: none;
  background: #2563eb !important;
  color: #ffffff !important;
  border: none !important;
  border-radius: 6px !important;
  padding: 6px 14px !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  cursor: pointer !important;
  z-index: 2147483647 !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.35) !important;
  font-family: sans-serif !important;
`;
document.documentElement.appendChild(floatingBtn);

// Yanıt Arayüzü (HUD)
const box = document.createElement('div');
box.style.cssText = `
  position: fixed !important;
  bottom: 20px !important;
  right: 20px !important;
  width: 380px !important;
  max-height: 450px !important;
  background: #18181b !important;
  color: #f4f4f5 !important;
  border: 1px solid #3f3f46 !important;
  border-radius: 10px !important;
  padding: 14px !important;
  box-shadow: 0 8px 24px rgba(0,0,0,0.7) !important;
  z-index: 2147483647 !important;
  overflow-y: auto !important;
  font-size: 13px !important;
  line-height: 1.5 !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
  display: none;
`;
document.documentElement.appendChild(box);

function renderHUD(title, content, color = '#38bdf8') {
  box.style.display = 'block';
  box.innerHTML = `
    <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid #27272a; padding-bottom:4px;">
      <span style="font-weight:600; color:${color};">${title}</span>
      <span style="font-size:11px; color:#a1a1aa; cursor:pointer;" id="hud-close">[Kapat (ESC)]</span>
    </div>
    <div style="word-break:break-word;">${content}</div>
  `;
  document.getElementById('hud-close')?.addEventListener('click', () => box.style.display = 'none');
}

function processSelection(text) {
  if (!text) return;
  floatingBtn.style.display = 'none';

  renderHUD("Çözülüyor...", "Soru modele iletildi, yanıt bekleniyor...", "#a855f7");

  try {
    chrome.runtime.sendMessage({ action: "solve", text: text }, (res) => {
      if (chrome.runtime.lastError) {
        renderHUD("Bağlantı Hatası", "Eklenti yenilendiği için sayfa bağlantısı koptu. Lütfen sayfayı <b>F5</b> ile yenileyin.<br><br><small>" + chrome.runtime.lastError.message + "</small>", "#ef4444");
        return;
      }
      if (!res) {
        renderHUD("Hata", "Arka plan servisinden yanıt alınamadı.", "#ef4444");
        return;
      }
      if (res.success) {
        const formatted = res.answer.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
        renderHUD(`Çözüm [${res.source}]`, formatted, "#10b981");
      } else {
        renderHUD("Hata", res.error, "#ef4444");
      }
    });
  } catch (err) {
    renderHUD("Hata", "Sayfayı F5 ile yenileyin: " + err.message, "#ef4444");
  }
}

// Metin seçildiğinde metni hafızaya al ve butonu konumlandır
document.addEventListener('mouseup', (e) => {
  // Tıklanan yer butonun kendisiyse seçimi sıfırlama
  if (e.target === floatingBtn) return;

  setTimeout(() => {
    const sel = window.getSelection();
    const text = sel ? sel.toString().trim() : "";
    
    if (text.length > 2) {
      lastSelectedText = text;
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      floatingBtn.style.top = `${window.scrollY + rect.bottom + 8}px`;
      floatingBtn.style.left = `${window.scrollX + rect.left}px`;
      floatingBtn.style.display = 'block';
    } else {
      floatingBtn.style.display = 'none';
    }
  }, 30);
});

// Butona tıklandığında seçimin silinmesini engelle ve hafızadaki metni gönder
floatingBtn.addEventListener('mousedown', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

floatingBtn.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (lastSelectedText) {
    processSelection(lastSelectedText);
  }
});

// Kısayol Tuşu: Alt + Q
window.addEventListener('keydown', (e) => {
  if (e.altKey && (e.code === 'KeyQ' || e.key === 'q' || e.key === 'Q')) {
    e.preventDefault();
    const currentText = window.getSelection().toString().trim() || lastSelectedText;
    if (currentText) {
      processSelection(currentText);
    }
  }
  if (e.key === 'Escape') {
    box.style.display = 'none';
    floatingBtn.style.display = 'none';
  }
});