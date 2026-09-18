# LocalSolve AI: Hybrid Local & Cloud Study Assistant

Tarayıcı üzerindeki metinleri, testleri ve çalışma sorularını doğrudan yerel (çevrimdışı) veya bulut tabanlı yapay zeka modelleriyle analiz eden, gizlilik odaklı bir Chrome uzantısı (Manifest V3).

Verilerinizi üçüncü taraf sunuculara göndermeden kendi donanımınızda (Ollama / LM Studio) çalıştırabilir veya gerektiğinde bulut sağlayıcılarına (Google Gemini, OpenAI) yedekleme yapabilirsiniz.

---

## Özellikler

* **Otomatik Yerel Model Tespiti:** Arka planda çalışan Ollama (`11434`) veya LM Studio (`1234`) servislerini açılışta otomatik tarar ve uygun modelleri listeler.
* **3 Farklı Çalışma Modu:**
  * **Sadece Yerel (Air-Gapped):** Buluta hiçbir veri göndermez, API anahtarı istemez, tamamen çevrimdışı çalışır.
  * **Hibrit:** Yerel model yanıt vermediğinde veya donanım sınırına takıldığında otomatik olarak bulut yedeklerine geçer.
  * **Sadece Bulut:** Doğrudan Gemini veya OpenAI API uç noktalarını kullanır.
* **Akıllı Seçim ve HUD Arayüzü:** 
  * Metin seçildiğinde beliren minimal `🔍 Çöz` butonu.
  * Hızlı tetikleme için `Alt + Q` kısayolu, kapatmak için `ESC`.
  * Sayfa tasarımını bozmayan bağımsız, kaydırılabilir HUD katmanı.
* **Eğitim Platformu Uyumluluğu:** Moodle ve benzeri portallarda bulunan `user-select: none` (metin seçme engeli) kısıtlamalarını dinamik olarak kaldırır.
* **CORS & Origin Çözümü:** Manifest V3 `declarativeNetRequest` kuralları ile yerel Ollama bağlantılarında 403 Forbidden hatalarını engeller.

---

## Desteklenen Modeller

| Sağlayıcı | Model Türü | Bağlantı Noktası / Gereksinim |
| :--- | :--- | :--- |
| **Ollama** | Açık Kaynak (Llama 3.2, Qwen 2.5 vb.) | `http://localhost:11434` |
| **LM Studio** | Açık Kaynak (Yerel GGUF Modelleri) | `http://localhost:1234` |
| **Google Gemini** | Bulut API | API Anahtarı (`gemini-flash-latest`, `gemini-2.5-flash-lite`) |
| **OpenAI** | Bulut API | API Anahtarı (`gpt-4o-mini`) |

---

## Kurulum

1. Bu depoyu indirin (ZIP) veya klonlayın:
   ```bash
   git clone [https://github.com/KULLANICI_ADINIZ/LocalSolve-AI.git](https://github.com/KULLANICI_ADINIZ/LocalSolve-AI.git)
Google Chrome'u açın ve adres çubuğuna chrome://extensions/ yazın.

Sağ üst köşedeki Geliştirici Modu (Developer Mode) anahtarını etkinleştirin.

Sol üstte beliren Paketlenmemiş öge yükle (Load unpacked) butonuna tıklayın.

İndirdiğiniz veya klonladığınız proje klasörünü seçin.

Kullanım
Tarayıcı araç çubuğundaki LocalSolve AI simgesine tıklayın.

Bilgisayarınızda Ollama/LM Studio açıksa model otomatik seçilecektir; çalışma modunuzu belirleyip Ayarları Kaydet butonuna basın.

Herhangi bir web sayfasında çözülmesini veya açıklanmasını istediğiniz metni fare ile seçin:

Açılan 🔍 Çöz butonuna tıklayın ya da

Klavyeden Alt + Q kombinasyonuna basın.

Çözüm penceresini kapatmak için pencere dışına tıklayın veya ESC tuşunu kullanın.

Yapılandırma & Yerel Model Önerileri
Düşük gecikme ve hızlı analiz için yerel makinenizde şu modeller tavsiye edilir:

Bash


# Ultra hafif ve hızlı (Genel testler ve sözel sorular için)
ollama run llama3.2:3b

# Dengeli ve yetenekli (Mantık ve teknik sorular için)
ollama run qwen2.5:7b
Gizlilik ve Güvenlik
Bu eklenti hiçbir kullanıcı verisini, geçmişini veya seçim kaydını harici bir sunucuda toplamaz veya depolamaz.

Yerel mod seçildiğinde tüm çıkarım işlemleri tamamen kullanıcının kendi donanımında gerçekleşir.

Bulut modu kullanıldığında veriler yalnızca kullanıcının girdiği kişisel API anahtarları aracılığıyla doğrudan ilgili sağlayıcıya (Google/OpenAI) iletilir.

Lisans
Bu proje MIT Lisansı altında sunulmaktadır.
