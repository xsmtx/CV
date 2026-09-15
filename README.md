# Samet Kabakcı — Spatial Portfolio

[sametkabakci.com](https://sametkabakci.com) için geliştirilen, altı bağlantılı sahneden oluşan kişisel portfolyo. Next.js, React, TypeScript, Three.js ve React Three Fiber kullanır. Gezegenler, altyapı modelleri ve kozmik arka plan kod ile oluşturulur.

## Özellikler

- Home, Systems, Experience, Projects, Lab ve Contact sahneleri.
- Yumuşak kamera geçişleri ve sürüklenebilen üç boyutlu modeller.
- Gerçek kıyı çizgileri, okyanuslar, bulutlar ve atmosfer katmanıyla Dünya görünümü.
- Contact sahnesinde koyu Dünya ufku, gezegenin arkasından görünen güneş ve sıcak atmosfer ışığı.
- Home sahnesinde tıklamayla gelen meteor, yüzeyde çarpma dalgası ve kıvılcımlar.
- Yıldızlar, bulutsular, kayan yıldızlar, küçük kozmik patlamalar ve Gargantua görselleştirmesi.
- Sistem tercihini izleyen, kullanıcı seçimini saklayan açık/koyu tema.
- Dar ve kısa ekranlara uyarlanan yerleşim; uzun içeriklerde yerel kaydırma.
- Manrope ve Source Sans 3 fontlarının yerel sunumu.
- Uyarlanabilir grafik kalitesi, hareketi durdurma ve azaltılmış hareket desteği.
- WebGL olmadığında CSS/SVG görünümü; JavaScript olmadan okunabilen `/profile/` sayfası.

## Yerel geliştirme

Node.js 24 önerilir; proje bu sürümde doğrulanmıştır. API anahtarı, veritabanı veya özel ortam dosyası gerektirmez.

```sh
git clone https://github.com/xsmtx/CV.git
cd CV
npm ci
npm run dev
```

Geliştirme sunucusu: **http://localhost:3000**

## Derleme ve yayın

```sh
npm run build
npm start
```

Derleme, statik siteyi `out/` klasörüne üretir. `npm start` bu çıktıyı yerelde 3000 portunda önizler. Portu `PORT` ortam değişkeniyle değiştirebilirsiniz:

```powershell
$env:PORT = '4173'
npm start
```

Statik barındırma için `out/` klasörünün içeriğini yayınlayın. `/profile/` ayrı bir HTML dizinidir; `404.html` özel hata sayfasıdır. HTML dosyaları yeniden doğrulanmalı, hash içeren `/_next/static/` varlıkları uzun süre önbelleğe alınmalıdır. E-posta kopyalama için HTTPS kullanın.

Sunucuya özgü bağlantı bilgileri ve dağıtım yapılandırmaları bu depoda tutulmaz.

## Kontroller

- Yörünge haritası veya **1–6**: sahne seçimi.
- Kaydırma, **↑ / ↓**, **Page Up / Page Down**: sahneler arasında geçiş.
- **← / →**: Experience içinde yıl, Projects içinde proje seçimi.
- **Home / End**: başlangıç veya iletişim sahnesi.
- **Escape**: proje ayrıntısını veya yardım panelini kapatma.
- **G** basılı tutma: çekirdeğin yapısal çizgileri.
- **?** veya **H**: yardım.
- Arka planı sürükleme: modelin açısını değiştirme.
- Home sahnesinde dünyaya/boş alana sol tıklama, dokunma veya **M**: meteor gönderme. Sürükleme meteor başlatmaz; aynı anda tek çarpma oynatılır.
- Hareket durdurulduğunda veya azaltılmış hareket tercihinde meteor yerine kısa, sabit bir yüzey parıltısı gösterilir.
- Güneş/ay düğmesi: tema değiştirme.
- Durdurma düğmesi: hareketi durdurma/devam ettirme.
- **Text view**: tam metin profili.
- **T**, alt çubuktaki **Terminal** veya LAB içindeki **Open terminal**: etkileşimli terminal.

## Portfolio terminal

`help` komutları listeler. `pwd` şehir ve ülkeyi İngilizce gösterir. `whoami` adı ve rolü, `uptime` İstanbul takvimine göre yaşı İngilizce `years / months / days` olarak, `uptime --session` tarayıcı oturum süresini gösterir. `skills linux`, `projects scb`, `experience`, `neofetch` ve `contact` profil verilerini okur. `theme light`, `theme dark` ve `open projects` siteyi kontrol eder.

`curl CV` veya `wget CV`, Samet'in hazırladığı orijinal Word CV'yi indirir. ↑/↓ komut geçmişi, Tab tek eşleşmeyi tamamlama, Ctrl+L temizleme, Esc kapatma içindir. Bu komutlar tarayıcıdaki profil arayüzüne aittir; sunucuda kabuk komutları çalıştırılmaz.

CV, `public/downloads/Samet-Kabakci-CV.docx` konumundadır; metin görünümündeki **Download CV (Word)** bağlantısından da indirilebilir. Bu dosya, proje kökündeki özel hazırlanmış Word belgesinin birebir kopyasıdır. CV güncellendiğinde içeriğini ve biçimini koruyarak yayın kopyasını yenileyin:

```powershell
Copy-Item -LiteralPath Samet-Kabakci-CV.docx -Destination public/downloads/Samet-Kabakci-CV.docx
npm run build
```

`.gitignore` yalnızca bu indirilebilir Word dosyasına izin verir. Proje kökündeki kaynak belge ve diğer kişisel belgeler dışarıda kalır. CV, profil verilerinden otomatik olarak yeniden üretilmez.

## İçerik ve proje yapısı

| Konum                    | Görevi                                               |
| ------------------------ | ---------------------------------------------------- |
| `src/data/profile.ts`    | Profil, e-posta, sosyal bağlantılar ve eğitim        |
| `src/data/experience.ts` | İş geçmişi ve sorumluluklar                          |
| `src/data/systems.ts`    | Teknoloji alanları ve deneyim düzeyleri              |
| `src/data/projects.ts`   | Proje açıklamaları ve mimari ayrıntılar              |
| `src/app/`               | Statik sayfalar, metadata, robots ve sitemap         |
| `src/components/`        | Okunabilir içerik, navigasyon ve kontroller          |
| `src/experience/`        | Kamera, modeller, animasyonlar ve shader'lar         |
| `src/styles/`            | Tema, tipografi ve responsive düzenler               |
| `public/assets/`         | Paylaşım görseli, SVG gökyüzü ve font lisansları     |
| `scripts/`               | Yerel önizleme, görsel üretimi ve doğrulama araçları |
| `tests/`                 | Playwright etkileşim ve erişilebilirlik testleri     |

İçerik dosyalarını mevcut veri şemasını koruyarak düzenleyin. Alan adı değişirse profil, robots ve sitemap yapılandırmalarını da güncelleyin. Yeni sahne, proje veya kariyer durağı eklerken ilgili gezinme sınırlarını ve model eşlemelerini kontrol edin.

## Doğrulama

```sh
npm run build
npm run lint
npm run typecheck
npm test
```

Playwright yapılandırması kurulu Chrome/Edge kanallarını ve Playwright Firefox/WebKit motorlarını kullanır:

```sh
npx playwright install firefox webkit
npx playwright test --project=chrome --project=webkit
```

Chrome/Edge bulunmayan ortamlarda ilgili `channel` ayarını kaldırıp Playwright Chromium kurulabilir. Playwright testleri 4173 portundaki üretim önizlemesini otomatik başlatır veya mevcut önizlemeyi kullanır.

Yerel önizleme açıkken ek görsel ve performans kontrolleri:

```sh
npm run test:qa
node scripts/cosmos-qa.mjs
node scripts/earth-impact-qa.mjs
node scripts/contact-sunrise-qa.mjs
node scripts/check-sky-numerics.mjs
node scripts/performance-qa.mjs
```

`check-sky-numerics.mjs`, yıldız animasyonlarını gerçek GPU üzerinde farklı ekran oranları ve hassasiyetlerle ölçerek geçersiz renkleri kontrol eder. Raporlar ve ekran görüntüleri `qa/` altında yerelde tutulur.

## Varlıklar ve depo kapsamı

Görseller geometri, GLSL, CSS ve SVG ile oluşturulur. Dünya'nın kıyı çizgileri, [Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/) tarafından kamuya açık olarak sunulan 1:110m kara verisini kullanır. Bulutlar, yüzey renkleri, atmosfer ve çarpma efektleri kod ile üretilir. Veri kaynağı ve font lisansları `public/assets/licenses/` içindedir.

SVG varlıklarını yeniden üretmek için `scripts/generate-cosmos.mjs`, `scripts/generate-gargantua.mjs` ve `scripts/generate-earth.mjs` kullanılabilir. Dünya üreticisi, depoda bulunan `scripts/data/ne_110m_land.geojson` dosyasından iki yerel SVG üretir; site çalışırken dışarıdan görsel indirmez.

`.gitignore`; bağımlılıkları, derleme çıktılarını, test raporlarını, kişisel kaynak belgelerini, referans ekran görüntülerini, ortam dosyalarını, özel anahtarları, sunucu yapılandırmalarını ve yedek arşivlerini dışarıda tutar. Depoda uygulamanın çalışması için gereken kaynak kod, yapılandırmalar, kilit dosyası ve genel site varlıkları bulunur.
