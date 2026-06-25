# Onamlarım / Klinikonam — Product-Grade Roadmap (Enterprise Blueprint)

> **Durum:** Bugün proje, **backend'siz, tamamen istemci-taraflı bir SPA demosudur** (Vue 3 + Vite,
> Pinia mock store'ları, Axios mock interceptor'ları, Vercel static deploy). Bu doküman, demoyu
> **production-grade, KVKK-uyumlu, çok-kiracılı bir klinik ERP SaaS'ına** dönüştürecek hedef
> mimariyi ve fazlı yol haritasını tanımlar.
>
> Mevcut frontend stack ayrıntıları için bkz. [`tech_explain.md`](./tech_explain.md).

**Hedef stack:** Cloudflare (CDN/WAF/DNS/TLS) · AWS (ECS Fargate + destekleyici servisler) ·
Türkiye'de KVKK-yerleşimli yönetilen PostgreSQL (birincil hassas veri) · Node.js API.

---

## 0. Mimari Karar Kaydı (ADR — özet)

| # | Karar | Gerekçe |
|---|-------|---------|
| ADR-1 | **Hibrit veri yerleşimi** | Özel nitelikli kişisel veri (hasta kimliği, T.C. no, onam içeriği, imza — KVKK m.6) **yalnızca Türkiye'de** tutulur. AWS yalnızca stateless/kimliksiz iş görür. |
| ADR-2 | **Birincil DB: PostgreSQL, Türk bulutta yönetilen** | ERP ilişkisel veri modeli (hasta↔onam↔randevu↔envanter) için ilişkisel DB; KVKK yerleşimi için TR sağlayıcı. |
| ADR-3 | **AWS compute: ECS Fargate (konteyner)** | Kalıcı DB bağlantıları (TR'ye VPN/PrivateLink), uzun işler (PDF onam üretimi), öngörülür maliyet. Lambda cold-start + cross-region kalıcı bağlantı sancısından kaçınır. |
| ADR-4 | **Edge: Cloudflare** | CDN, WAF, DDoS, bot yönetimi, DNS, TLS, statik SPA dağıtımı (Pages/R2) tek katmanda. |
| ADR-5 | **AWS bölgesi: eu-central-1 (Frankfurt)** | TR'ye en düşük gecikmeli AB bölgesi; yalnızca PII'siz yükler. |
| ADR-6 | **IaC: Terraform** | Tüm AWS + Cloudflare kaynakları kod olarak; tekrarlanabilir, denetlenebilir. |

> **Pazarlama uyarısı:** Platform/Fiyatlandırma sayfalarındaki "Türkiye'de barındırma" iddiası bu
> mimariyle **doğrulanır** (hassas veri TR'de). Metinde "hasta verisi Türkiye'de barınır, işleme
> AB'de KVKK-uyumlu yapılır" netliği korunmalı.

---

## 1. Hedef Mimari

### 1.1 Üst düzey topoloji

```
                          ┌───────────────────────────────────────────┐
   Kullanıcı (tarayıcı)   │              CLOUDFLARE (edge)              │
        │                 │  DNS · TLS · CDN · WAF · DDoS · Bot · Rate │
        └────────────────▶│  Cache: statik SPA (Pages/R2)             │
                          └───────────────┬──────────────┬────────────┘
                                          │ statik       │ /api/* (proxy)
                                          ▼              ▼
                              Vue SPA (immutable        api.klinikonam.com
                              cache, edge'den)                │
                                                              ▼
                                                  ┌────────────────────────┐
                                                  │   AWS  (eu-central-1)   │
                                                  │  ALB → ECS Fargate      │
                                                  │  (Node.js API, n×task)  │
                                                  └───┬──────────┬─────────┘
                                                      │          │
                          ┌───────────────────────────┘          └──────────────┐
                          ▼ (Site-to-Site VPN / PrivateLink, şifreli)            ▼
          ┌──────────────────────────────────────┐           ┌──────────────────────────┐
          │   TÜRKİYE (KVKK yerleşimli)           │           │   AWS destek servisleri  │
          │   Yönetilen PostgreSQL (birincil)     │           │   (PII İÇERMEZ)          │
          │   • hasta, onam, imza, T.C. no        │           │   • ElastiCache Redis     │
          │   • randevu, envanter, audit log      │           │     (oturum/kuyruk/cache) │
          │   Nesne deposu (onam PDF'leri)        │           │   • SQS (iş kuyruğu)      │
          │   Şifreli yedek (TR içi)              │           │   • S3 (türev/log, PII'siz)│
          └──────────────────────────────────────┘           │   • SES (e-posta)         │
                                                              │   • CloudWatch/OTel       │
                                                              └──────────────────────────┘
```

### 1.2 Bileşen sorumlulukları

| Katman | Sorumluluk | Teknoloji |
|--------|------------|-----------|
| **Edge** | TLS sonlandırma, CDN cache, WAF kuralları, DDoS/bot, DNS, statik SPA servis | Cloudflare (Pages/R2, WAF, Rules) |
| **Frontend** | SPA — mevcut Vue 3 uygulaması, mock yerine gerçek API'ye bağlı | Vue 3 + Vite (mevcut) |
| **API Gateway / LB** | Yük dengeleme, sağlık kontrolü, TLS (iç) | AWS ALB |
| **Uygulama** | İş mantığı, auth, RBAC, modül API'leri, PDF onam üretimi | Node.js (NestJS önerilir) · ECS Fargate |
| **Birincil veri** | Tüm PII/sağlık verisi, ilişkisel ERP modeli, audit | PostgreSQL (TR yönetilen) |
| **Onam belgeleri** | İmzalı onam PDF arşivi (özel nitelikli) | TR nesne deposu |
| **Cache/kuyruk** | Oturum, rate-limit sayaç, async iş kuyruğu (PII'siz) | ElastiCache Redis + SQS |
| **Türev/log** | PII içermeyen artefakt, gözlemlenebilirlik logları | S3 + CloudWatch/OpenTelemetry |
| **E-posta/bildirim** | İşlemsel e-posta, randevu hatırlatma | AWS SES |

### 1.3 KVKK veri sınıflandırması (PII nerede durur)

| Veri | Sınıf | Yer |
|------|-------|-----|
| Hasta kimliği, T.C. no, iletişim, kan grubu | Özel nitelikli / kişisel | **Sadece TR PostgreSQL** |
| Onam içeriği + imza (signature_pad çıktısı) | Özel nitelikli | **Sadece TR PostgreSQL + TR nesne deposu** |
| Randevu, envanter, klinik kayıt | Kişisel/operasyonel | **TR PostgreSQL** |
| Oturum tokenı, rate-limit sayaç | Kimliksiz | AWS Redis |
| PDF render iş mesajı (referans ID, içerik değil) | Kimliksiz | AWS SQS |
| Uygulama logları, metrikler | Kimliksiz (PII maskeli) | AWS CloudWatch/S3 |

**Altın kural:** Hiçbir PII alanı AWS'te kalıcı olarak yazılmaz. Loglarda T.C. no / isim / imza maskelenir.

---

## 2. Faz Planı (Enterprise Blueprint)

Her faz **çalışan, sevk edilebilir** bir ürün çıkarır. Süreler bir tam-zamanlı küçük ekip (1-3 kişi)
varsayımıyla kaba tahmindir; takvim değil, sıralama önemlidir.

---

### Faz 0 — Temel & Altyapı (IaC + ilk uçtan-uca dilim)

> **Amaç:** Tek bir modül (Onam) gerçek backend + gerçek DB üzerinden uçtan uca çalışsın; tüm
> altyapı kod olarak kurulmuş ve dağıtım otomatik olsun.

**Altyapı**
- [ ] Terraform repo + remote state (S3 + DynamoDB lock) + ortam ayrımı (dev/staging/prod).
- [ ] AWS landing zone: VPC (özel/genel subnet), NAT, IAM rol/politikaları (en az ayrıcalık), KMS anahtarları.
- [ ] ECS Fargate cluster + ALB + ECR; servis tanımı, sağlık kontrolü, autoscaling temel kuralı.
- [ ] Cloudflare: DNS, TLS (tam-strict), CDN, temel WAF kural seti, `klinikonam.com` + `api.klinikonam.com`.
- [ ] Türk bulutta yönetilen PostgreSQL provizyonu; AWS VPC ⇄ TR Site-to-Site VPN (veya PrivateLink), şifreli tünel doğrulaması.
- [ ] Gizli yönetimi: AWS Secrets Manager (DB kimlikleri, API anahtarları).

**Backend iskeleti**
- [ ] Node.js servis iskeleti (NestJS önerilir): config, sağlık endpoint'i, yapılandırılmış log (PII maskeleme), hata zarfı.
- [ ] Veritabanı erişim katmanı (Prisma/TypeORM) + ilk şema migrasyonu (hasta, onam, kullanıcı tabloları).
- [ ] **Gerçek kimlik doğrulama:** JWT + refresh, parola hash (argon2), oturum Redis'te. `localStorage` mock token kaldırılır.
- [ ] Onam modülü API'si: oluştur / listele / imzala / PDF üret (PDF işi SQS → worker → TR nesne deposu).

**Frontend entegrasyonu**
- [ ] `src/api/axios.js` mock interceptor'ı **kaldır**; gerçek `baseURL` (ortam değişkeni) + token yenileme akışı.
- [ ] `useConsentStore` mock seed yerine API'den beslenir; yükleme/hata durumları gerçek.
- [ ] SPA build → Cloudflare Pages/R2 dağıtımı (Vercel'den geçiş veya paralel).

**DevOps**
- [ ] CI/CD: GitHub Actions → lint/test/build → Docker image → ECR → Fargate rolling deploy.
- [ ] Gözlemlenebilirlik temeli: CloudWatch logs + temel alarm (5xx, gecikme, görev sağlığı).
- [ ] Staging ortamı + smoke test.

**Definition of Done:** Bir kullanıcı gerçek hesapla giriş yapar, gerçek onam oluşturur, imzalar,
PDF Türkiye'de üretilir ve arşivlenir; hiçbir PII AWS'te kalıcı değildir; deploy tek `git push` ile akar.

**Faz 0 riskleri:** TR-AWS VPN gecikmesi/kararlılığı (erken yük testi yap); TR sağlayıcı yönetilen
Postgres olgunluğu (yedek/HA özelliklerini doğrula); Cloudflare ⇄ AWS kaynak doğrulama (mTLS/Authenticated Origin Pulls).

---

### Faz 1 — Ürün Çekirdeği (tüm modüller + uyum temeli)

> **Amaç:** Demodaki tüm modüller gerçek veriyle production'da; KVKK veri-konusu hakları ve denetim altyapısı hazır.

**Modüller (gerçek API + DB)**
- [ ] CRM / Hasta (`usePatientStore` → API): hasta CRUD, arama, T.C. doğrulama.
- [ ] Envanter (`useInventoryStore` → API): stok, kritik-stok uyarısı, hareket kaydı.
- [ ] MHRS senkronizasyonu: mock yerine **gerçek MHRS/e-Nabız entegrasyonu** (randevu çekme/eşleme); `useMhrsSync` gerçek uca bağlanır.
- [ ] Dashboard metrikleri gerçek veriden (Sparkline vb.).

**Yetki & denetim**
- [ ] **RBAC:** roller (klinik yöneticisi, hekim, sekreter, vb.) + kaynak-bazlı izin.
- [ ] **Audit log:** her PII erişimi/değişikliği değişmez kayıt (kim, ne, ne zaman) — KVKK denetim gereği.
- [ ] **KVKK veri-konusu hakları:** veri dışa aktarma (taşınabilirlik), silme/anonimleştirme akışı, aydınlatma metni & açık rıza kaydı.
- [ ] Veri saklama/imha politikası (otomatik süreli imha işleri).

**Kalite**
- [ ] Backend birim + entegrasyon testleri; kritik akışlar için E2E (Playwright).
- [ ] Sözleşme testleri (frontend ↔ API).
- [ ] Hata izleme (Sentry vb., PII maskeli).

**Definition of Done:** Tüm modüller gerçek veriyle çalışır; bir veri-konusu silme talebi uçtan uca
yerine getirilebilir; her hassas işlem audit'lenir.

---

### Faz 2 — SaaS & Çok-kiracılılık

> **Amaç:** Tek klinik kurulumundan **çok-kiracılı SaaS**'a; self-servis onboarding ve faturalama.

**Çok-kiracılılık**
- [ ] Kiracı (tenant) izolasyon modeli seç & uygula: **şema-başına-kiracı** (önerilen, KVKK izolasyonu güçlü) veya satır-düzeyi (RLS). Karar ADR olarak yazılır.
- [ ] Kiracı bağlamı her istekte zorunlu (middleware); çapraz-kiracı sızıntı testleri.
- [ ] Kiracı provizyon/onboarding akışı (yeni klinik → izole şema + seed).

**Kimlik & erişim**
- [ ] **SSO / OIDC** (kurumsal klinikler için), opsiyonel SAML.
- [ ] MFA (TOTP), oturum/cihaz yönetimi.

**Faturalama**
- [ ] Abonelik & faturalama (Fiyatlandırma sayfasındaki 3 planla uyumlu: aylık/yıllık). TR için **iyzico/PayTR** veya uluslararası için Stripe — KVKK/ödeme mevzuatına göre seç.
- [ ] Kullanım ölçümü (seat/modül), plan limitleri, deneme süresi, fatura/makbuz (e-Arşiv entegrasyonu opsiyonel).
- [ ] Müşteri portalı: plan yükselt/düşür, ödeme yöntemi, fatura geçmişi.

**Definition of Done:** İki bağımsız klinik aynı platformda tam izole çalışır; yeni klinik self-servis
kaydolup plan seçip ödeme yapabilir.

---

### Faz 3 — Ölçek, Güvenlik Sertleştirme & Uyum Sertifikasyonu

> **Amaç:** Yüksek erişilebilirlik, denetlenebilir güvenlik, resmi uyum hazırlığı.

**Dayanıklılık & ölçek**
- [ ] Çoklu-AZ Fargate + Postgres HA (TR sağlayıcıda replica/failover); okuma replikası.
- [ ] **Felaket kurtarma:** RPO/RTO hedefleri, TR-içi şifreli yedek + düzenli geri-yükleme tatbikatı, runbook'lar.
- [ ] Otomatik ölçekleme ayarı + yük/performans testi (k6); maliyet optimizasyonu (right-sizing, Savings Plans).
- [ ] Cache/CDN stratejisi olgunlaştırma; DB sorgu/indeks optimizasyonu.

**Güvenlik**
- [ ] Bağımsız **sızma testi** + bulgu kapatma; bağımlılık/SCA + SAST/DAST CI'a entegre.
- [ ] Sır rotasyonu, en-az-ayrıcalık IAM denetimi, WAF kural sertleştirme, rate-limit ince ayar.
- [ ] Olay müdahale planı + güvenlik runbook'ları; (gerekirse) ihlal bildirim süreci (KVKK 72 saat).

**Uyum**
- [ ] **KVKK** tam uyum dosyası: VERBİS kaydı, işleme envanteri, aydınlatma/açık rıza, veri işleyen sözleşmeleri (AWS/Cloudflare/TR sağlayıcı için).
- [ ] **ISO 27001** (ve sağlık için uygunsa ISO 27799) sertifikasyon hazırlığı; politika/prosedür seti.
- [ ] Yıllık denetim & sürekli uyum izleme.

**Definition of Done:** Planlı/plansız bölge kaybında veri kaybı hedef RPO içinde; sızma testi
bulguları kapalı; KVKK dosyası ve ISO 27001 hazırlığı tamamlanmış.

---

## 3. Süreklilik (tüm fazlar boyunca)

- **Gözlemlenebilirlik:** metrik + log + iz (OpenTelemetry), SLO/SLI tanımları, on-call/alarm.
- **Maliyet yönetimi:** ortam başına bütçe alarmı, aylık maliyet gözden geçirme.
- **Dokümantasyon:** ADR'ler, runbook'lar, API şeması (OpenAPI), onboarding rehberi.
- **Branş-bağımsızlık:** ürün çok-branşlı klinik ERP'sidir; demo verisi ve modeller tek uzmanlığa sabitlenmez.

---

## 4. İlk Adımlar (Faz 0 — hemen başlanabilir sıra)

1. Terraform repo + AWS landing zone iskeleti (VPC/ECS/ALB) + remote state.
2. Türk-bulut yönetilen PostgreSQL provizyonu + AWS VPN köprüsü ve gecikme testi.
3. Node.js (NestJS) servis iskeleti + gerçek auth + ilk migrasyon (kullanıcı/hasta/onam).
4. Cloudflare DNS/TLS/WAF + SPA'yı Pages/R2'ye taşı.
5. `axios.js` mock'unu kaldır → Onam modülünü uçtan uca gerçek API'ye bağla.
6. GitHub Actions CI/CD → ECR → Fargate.

---

## 5. Açık Kararlar / İleride Netleşecek

- Türk bulut sağlayıcısının kesin seçimi (yönetilen Postgres HA/yedek olgunluğu kriter).
- Backend framework kesinleştirme (NestJS öneri; sade Express alternatif).
- Çok-kiracılık izolasyon modeli (şema-başına vs RLS) — Faz 2 başında ADR ile.
- Ödeme sağlayıcı (iyzico/PayTR vs Stripe) — KVKK/ödeme mevzuatı ve hedef pazara göre.
- Marka adı / wordmark kararı (domain `klinikonam.com`) — UI tek yerden güncellenecek.
