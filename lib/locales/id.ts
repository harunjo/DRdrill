import type { Dictionary } from "./en";

// Indonesian dictionary — mirrors lib/locales/en.ts exactly (typed against it).

export const id: Dictionary = {
  appName: "DR Drill",
  currency: { code: "IDR", rate: 1 },
  masthead: "Asesmen ketahanan & keamanan IT",
  tagline: "Silakan gambarkan lingkungan IT Anda untuk memperoleh gambaran nyata RPO/RTO",
  privacyLine:
    "Detail lingkungan dan nama workload Anda tidak pernah meninggalkan browser ini. Cerita simulasi ditulis hanya dari temuan yang dianonimkan (W1, W2, …), dan tidak ada input atau data Anda yang disimpan di server ini.",
  trustIndicator:
    "Asesmen berjalan sepenuhnya di perangkat Anda — data Anda tidak pernah dikirim keluar; proses simulasi di langkah berikutnya hanya mengirim data anonim",

  intake: {
    steps: {
      model: "Lingkungan",
      workloads: "Workload",
      protection: "Proteksi",
      security: "Keamanan",
    },
    empty: {
      title: "Belum ada workload",
      body: "Tambahkan sistem yang ingin Anda periksa kesiapannya — mulai dari 5–10 yang paling tidak boleh hilang bagi bisnis.",
    },
    stepModel: "1. Di mana infrastruktur Anda berjalan?",
    models: {
      onprem: "On-premise",
      cloud: "Full cloud",
      hybrid: "Hybrid",
      private: "Private cloud",
    },
    stepWorkloads: "2. Workload paling kritikal Anda",
    workloadsHint: "Cukup 5–10 sistem paling kritikal — bukan inventaris lengkap.",
    workloadName: "Nama (mis. database ERP)",
    nameCounter: "{n}/60",
    types: {
      database: "Database",
      vm: "Virtual machine",
      files: "File server / NAS",
      saas: "SaaS",
    },
    sizeLabel: "Ukuran data",
    sizeUnit: "Satuan ukuran",
    cost: {
      label: "Biaya downtime (opsional)",
      unit: "Rp / jam",
      placeholder: "mis. 5000000",
      quickFill: "Isi cepat biaya downtime",
      sameForAll: "Sama untuk semua",
      byTier: "Per tier",
      apply: "Terapkan",
      tierShort: "T{n}",
      estimateCta: "Belum tahu biayanya? Estimasi di sini",
      estimateHow: "Angka kasar lebih baik daripada kosong. Isi berapa staf yang tidak bisa bekerja dan rata-rata gaji bulanan mereka — kami hitung biaya per jamnya. Tambah revenue yang hilang hanya jika sistem ini menghasilkan uang langsung; jika tidak, biarkan 0.",
      estStaff: "Staf yang tidak bisa bekerja",
      estStaffPh: "mis. 20",
      estStaffCost: "Rata-rata gaji bulanan / staf",
      estSalaryPh: "mis. 8000000",
      estRevenue: "Revenue hilang / jam (0 jika tidak ada)",
      estRevenuePh: "mis. 0",
      estResult: "≈ {v} / jam",
      estUse: "Pakai untuk semua workload",
    },
    tiers: {
      1: "Tier 1 — sangat kritikal",
      2: "Tier 2 — penting bagi bisnis",
      3: "Tier 3 — normal",
    } as Record<1 | 2 | 3, string>,
    placement: {
      onprem: "Berjalan on-premise",
      cloud: "Berjalan di cloud",
    },
    addWorkload: "+ tambah workload",
    remove: "hapus",
    errors: {
      nameRequired: "Beri nama workload ini.",
      sizeInvalid: "Ukuran harus berupa angka di atas 0.",
      maxWorkloads: "Maksimal 10 workload — fokus pada sistem paling kritikal.",
    },
    stepProtection: "3. Proteksi saat ini",
    protectionGroups: {
      onprem: "Proteksi on-premise",
      cloud: "Proteksi cloud",
    },
    freqLabel: {
      onprem: "Backup berjalan setiap … jam (0 = tidak ada)",
      cloud: "Snapshot diambil setiap … jam (0 = tidak ada)",
    },
    replication: "Replikasi ke sistem kedua",
    replicationLag: "Jeda replikasi (menit)",
    offsite: {
      onprem: "Ada salinan offsite / cloud",
      cloud: "Ada salinan lintas region",
    },
    immutable: "Ada salinan immutable (WORM)",
    secondSite: {
      onprem: "Tersedia lokasi kedua",
      cloud: "Region kedua siap untuk failover",
    },
    stepSecurity: "4. Postur deteksi & respons",
    security: {
      intro:
        "Dinilai sekali untuk seluruh organisasi — SIEM atau rencana respons insiden bukan per-workload. Nyalakan yang Anda miliki; sisanya biarkan. Lewati langkah ini untuk membiarkan keamanan tidak dinilai.",
      advancedToggle: "Lanjutan (istilah NIST CSF)",
      allPresent: "Semua ada",
      clearGroup: "Kosongkan",
      groups: {
        govern: "Govern — menjalankan keamanan sebagai program",
        identify: "Identify — mengetahui aset & risiko",
        protect: "Protect — mengunci pintu",
        detect: "Detect — mengenali serangan",
        respond: "Respond — menangani insiden",
      },
      controls: {
        securityPolicy: "Kebijakan keamanan informasi tertulis",
        rolesResponsibilities: "Peran & tanggung jawab keamanan yang jelas",
        thirdPartyRisk: "Risiko vendor / pihak ketiga dikelola",
        riskStrategy: "Strategi manajemen risiko / selera risiko",
        assetInventory: "Inventaris sistem dan aset",
        riskAssessment: "Penilaian risiko keamanan berkala",
        dataClassification: "Data diklasifikasikan berdasarkan sensitivitas",
        dataFlowMapping: "Alur data sensitif dipetakan",
        mfa: "Autentikasi multi-faktor (MFA)",
        patching: "Patching sistem tepat waktu",
        leastPrivilege: "Kontrol akses hak paling minimal (least privilege)",
        encryption: "Data dienkripsi saat disimpan dan dikirim",
        securityTraining: "Pelatihan kesadaran keamanan untuk staf",
        networkSegmentation: "Segmentasi jaringan",
        siem: "Monitoring keamanan (SIEM) yang mengorelasikan log",
        centralLogging: "Pengumpulan log terpusat",
        endpointMonitoring: "Proteksi endpoint / EDR di server dan laptop",
        alerting: "Peringatan yang memberi tahu petugas saat ada aktivitas mencurigakan",
        vulnScanning: "Pemindaian kerentanan berkala",
        networkMonitoring: "Pemantauan lalu lintas jaringan",
        irPlan: "Rencana respons insiden tertulis",
        isolation: "Kemampuan mengisolasi bagian jaringan yang terkompromi",
        irOwnership: "Ada orang atau tim yang jelas bertugas menangani insiden",
        breachNotification: "Proses memberi tahu regulator/pelanggan saat terjadi pembobolan",
        playbooks: "Playbook respons untuk insiden umum",
        tabletop: "Latihan insiden / tabletop secara berkala",
      },
      controlsCsf: {
        securityPolicy: "Kebijakan (GV.PO)",
        rolesResponsibilities: "Peran & tanggung jawab (GV.RR)",
        thirdPartyRisk: "Manajemen risiko rantai pasok (GV.SC)",
        riskStrategy: "Strategi manajemen risiko (GV.RM)",
        assetInventory: "Manajemen aset (ID.AM)",
        riskAssessment: "Penilaian risiko (ID.RA)",
        dataClassification: "Klasifikasi data (ID.AM)",
        dataFlowMapping: "Pemetaan alur data (ID.AM)",
        mfa: "Autentikasi multi-faktor (PR.AA)",
        patching: "Manajemen patch / kerentanan (PR.PS)",
        leastPrivilege: "Least privilege (PR.AA)",
        encryption: "Enkripsi saat disimpan / dikirim (PR.DS)",
        securityTraining: "Kesadaran & pelatihan (PR.AT)",
        networkSegmentation: "Segmentasi jaringan (PR.IR)",
        siem: "SIEM / korelasi event (DE.AE)",
        centralLogging: "Logging terpusat (DE.CM)",
        endpointMonitoring: "Endpoint detection & response — EDR (DE.CM)",
        alerting: "Alerting kejadian merugikan (DE.AE)",
        vulnScanning: "Pemindaian kerentanan (DE.CM / ID.RA)",
        networkMonitoring: "Monitoring jaringan (DE.CM)",
        irPlan: "Rencana respons insiden (RS.MA)",
        isolation: "Kontainmen / segmentasi insiden (RS.MI)",
        irOwnership: "Koordinasi & kepemilikan respons (RS.MA)",
        breachNotification: "Notifikasi/pelaporan pembobolan (RS.CO)",
        playbooks: "Playbook respons (RS.MA)",
        tabletop: "Latihan respons / tabletop (RS.MA)",
      },
    },
    run: "Jalankan asesmen",
    zeroWorkloads: "Tambahkan minimal satu workload bernama untuk menjalankan asesmen.",
    back: "Kembali",
    next: "Lanjut",
    stepCounter: "Langkah {n} dari {total}",
    saveConfig: "Simpan konfigurasi",
    loadConfig: "Muat konfigurasi",
    loadConfigError: "File ini bukan konfigurasi DR Drill yang valid.",
  },

  report: {
    newAssessment: "Asesmen baru",
    csf: {
      title: "Postur keamanan (NIST CSF)",
      subtitle:
        "Kematangan per fungsi. Recover adalah kesiapan pemulihan Anda; fungsi lain dinilai saat Anda mengisinya.",
      notAssessed: "belum dinilai",
      functions: {
        govern: "Govern",
        identify: "Identify",
        protect: "Protect",
        detect: "Detect",
        respond: "Respond",
        recover: "Recover",
      },
    },
    coverageShort: "Berdasarkan {n} workload yang Anda gambarkan",
    lensesLabel: "Tampilan laporan",
    lensesHint: "Temuan sama — ketuk untuk ganti tampilan:",
    lenses: {
      business: "Dampak bisnis",
      drill: "Simulasi bencana",
      technical: "Teknis",
      investment: "Usulan investasi",
    },
    tiles: { readiness: "Kesiapan", workloads: "Workload", flags: "Tanda risiko", rule: "3-2-1" },
    scoreTitle: "Kesiapan recovery",
    scoreOutOf: "/100",
    coverage:
      "Berdasarkan {n} workload yang Anda gambarkan — kesiapan sesuai deskripsi, dihitung dari jawaban Anda, bukan hasil audit.",
    gapsTitle: "Kesenjangan recovery",
    gapSummary: "{met}/{total} target tercapai",
    gapPill: { meets: "SESUAI", gap: "SELISIH", noPath: "BUNTU" },
    tierTag: "Tier {n}",
    gapTitle: "Tabel kesenjangan RPO / RTO",
    workload: "Workload",
    target: "Target RPO / RTO",
    achievableRpo: "RPO tercapai",
    achievableRto: "RTO tercapai",
    unrecoverable: "tidak dapat dipulihkan jika terjadi bencana",
    units: { min: "mnt", h: "jam", d: "hari" },
    timeline: {
      dataYouLose: "◄ Data hilang · RPO",
      timeDown: "Downtime · RTO ►",
      incident: "Insiden · t=0",
      rpoTarget: "Target RPO",
      rtoTarget: "Target RTO",
      noPath: "tak terpulihkan",
    },
    investTitle: "Prioritas investasi",
    investLabel: "prioritas",
    investOne: "prioritas",
    investEmpty: "Tidak ada celah terbuka — hal-hal esensial sudah tertutup.",
    posture: { strong: "Tangguh", developing: "Berkembang", exposed: "Rentan" },
    business: {
      title: "Dampak bisnis",
      exposureHeadline: "Eksposur jika tidak ada perubahan",
      perWorkload: "Per workload",
      downtimeLabel: "downtime",
      addCost: "Isi biaya downtime di intake untuk melihat eksposur dalam Rupiah. Postur dan kesenjangan tetap berlaku.",
      annualized: "Perkiraan kerugian tahunan (ALE)",
      aleNote:
        "Eksposur per insiden × seberapa mungkin gangguan terjadi tiap tahun — angkanya naik tiap ada celah kritis yang belum ditutup.",
      unrecoverableNote: "Workload tidak dapat dipulihkan jika terjadi bencana",
    },
    invest: {
      fundingCase: "Business continuity — usulan pendanaan",
      exposureAtRisk: "Eksposur berisiko",
      plusUnrecoverable: "plus {names} tidak dapat dipulihkan",
      allUnrecoverable: "{names} tidak dapat dipulihkan",
      noCost: "Isi biaya downtime di intake untuk mengukur eksposur.",
      posture: "Postur",
      bia: "BIA · asesmen mandiri selaras dengan ISO 22301 / NIST CSF",
      closes: "Menutup ~{amount} eksposur",
      closesQual: "Menutup eksposur yang dilindungi kontrol ini",
      makesRecoverable: "Membuat {n} workload yang recoverable",
      strengthens: "Memperkuat ketahanan",
      closesSecurityGap: "Menutup celah keamanan ini",
      preparedBy: "Disiapkan oleh harunjonatan.com · Data Anda aman — kami tidak menyimpan detail lingkungan Anda, dan nama workload Anda tidak pernah meninggalkan browser. Simulasi hanya mengirim temuan yang dianonimkan (W1, W2, …).",
      copy: "Salin ringkasan",
      copied: "Tersalin",
      copyFailed: "Salin tidak tersedia — pilih teks di bawah untuk menyalin manual:",
      scope: { onprem: "on-premise", cloud: "cloud" },
      brand: {
        companyName: "Nama perusahaan (opsional)",
        addLogo: "Tambah logo",
        changeLogo: "Ganti logo",
        clear: "Hapus",
      },
      pdf: {
        download: "Unduh: draf usulan investasi Business Continuity (BC)",
        docTitle: "Business Continuity — Justifikasi Investasi",
        forC: "Disiapkan untuk tinjauan manajemen (C-level)",
        intro:
          "Dokumen ini mengukur potensi kerugian bisnis yang dihadapi organisasi jika bencana terjadi hari ini, beserta investasi yang menguranginya. Setiap angka dihitung dari asesmen; bagian yang ditandai sebagai panduan perlu dilengkapi oleh tim pengusul sebelum diedarkan.",
        lossHeading: "Kerugian bisnis yang berisiko (per insiden)",
        asksHeading: "Rekomendasi investasi, berdasarkan prioritas",
        whatItBuys: "Yang dilindungi",
        guideTag: "Panduan — lengkapi bagian ini",
        crit: { 1: "Kritis", 2: "Penting", 3: "Normal" },
        execSummary: "Ringkasan Eksekutif",
        currentSituation: "Situasi Saat Ini",
        riskAssessment: "Penilaian Risiko",
        bia: "Analisis Dampak Bisnis (BIA)",
        currentGap: "Kesenjangan Saat Ini",
        options: "Opsi yang Dipertimbangkan",
        solution: "Solusi yang Diusulkan",
        financial: "Analisis Finansial",
        doingNothing: "Biaya Jika Tidak Bertindak",
        benefits: "Manfaat",
        roadmap: "Peta Jalan (Roadmap)",
        governance: "Tata Kelola (Governance)",
        kpis: "Metrik Keberhasilan (KPI)",
        recommendation: "Rekomendasi",
        execBody:
          "Berdasarkan {n} workload yang digambarkan, berjalan di {model}, gangguan hari ini membuat bisnis menghadapi eksposur sekitar {exposure}. Postur business continuity dinilai {posture}. Investasi berprioritas dalam dokumen ini mengurangi eksposur tersebut; anggaran, jadwal, dan kepemilikan yang diperlukan perlu dilengkapi tim pengusul pada bagian berpanduan.",
        situationLead: "Model deployment: {model}. Kesenjangan berikut teridentifikasi dari lingkungan sesuai deskripsi:",
        noGaps: "Tidak ada celah terbuka — hal-hal esensial sudah tertutup.",
        thRisk: "Risiko",
        thSeverity: "Tingkat",
        thFinancial: "Eksposur finansial",
        unbounded: "Kerugian permanen",
        thWorkload: "Workload",
        thCriticality: "Kritikalitas",
        thTolerance: "Toleransi downtime",
        thImpact: "Dampak bisnis",
        biaImpact: { 1: "Operasi inti berhenti", 2: "Gangguan signifikan", 3: "Dampak terbatas" },
        gapLead: "Posisi pemulihan saat ini dibandingkan target untuk tiap kapabilitas.",
        thCapability: "Kapabilitas",
        thCurrent: "Saat ini",
        thTarget: "Target",
        capabilityRto: "Waktu pemulihan (RTO)",
        capabilityRpo: "Titik pemulihan (RPO)",
        capabilitySite: "Lokasi kedua",
        capabilityCyber: "Cyber recovery",
        none: "Tidak ada",
        active: "Aktif",
        yes: "Ya",
        optionsGuide: [
          "Sebutkan alternatif yang Anda evaluasi agar dewan melihat keputusan diambil, bukan diasumsikan.",
          "A. Tidak bertindak — Kelebihan: tanpa biaya. Kekurangan: risiko tidak berubah; eksposur di atas tetap ada.",
          "B. Perbaiki backup saja — Kelebihan: investasi lebih rendah. Kekurangan: downtime lama tetap ada.",
          "C (direkomendasikan). Solusi business continuity lengkap — pemulihan cepat, risiko turun, kepatuhan terpenuhi.",
        ],
        solutionGuide: [
          "Jelaskan solusi terpilih sebagai kapabilitas bisnis, bukan nama produk vendor.",
          "Kapabilitas umum: lokasi pemulihan kedua, failover otomatis, replikasi berkelanjutan, uji DR triwulanan, cyber-recovery vault, orkestrasi pemulihan, monitoring dan pelaporan.",
          "Kaitkan tiap kapabilitas dengan risiko pada Penilaian Risiko di atas.",
        ],
        financialGuide:
          "Isi biaya dari penawaran vendor Anda, lalu bandingkan totalnya dengan kerugian bisnis yang berisiko di atas — investasi terjustifikasi bila kerugian yang dihindari melebihi biayanya.",
        thItem: "Item",
        thCost: "Biaya",
        finItems: ["Perangkat keras", "Perangkat lunak", "Implementasi", "Pelatihan", "Dukungan tahunan", "Total"],
        doingNothingLead:
          "Jika tidak ada tindakan, satu gangguan saja membuat bisnis menghadapi kerugian di bawah ini. Workload yang tak terpulihkan berarti kehilangan data permanen, bukan sekadar penundaan.",
        doingNothingList: [
          "Pemulihan berkepanjangan — dibatasi waktu pengadaan/pembangunan ulang, bukan kecepatan restore",
          "Penalti SLA dan paparan regulasi",
          "Kehilangan pelanggan dan kerusakan reputasi",
          "Risiko ransomware dan siber yang meningkat",
        ],
        tangibleH: "Berwujud",
        intangibleH: "Tak berwujud",
        intangible: [
          "Kepercayaan pelanggan",
          "Kepercayaan manajemen dan dewan",
          "Perlindungan merek",
          "Produktivitas karyawan",
          "Ketahanan bisnis",
        ],
        kpiLead: "Target sasaran pemulihan (dari asesmen) dan metrik operasional yang membuktikan kapabilitas berjalan:",
        kpiStatic: [
          "Uji DR berhasil 100%",
          "Latihan pemulihan triwulanan",
          "Ketersediaan replikasi ≥ 99,9%",
          "Audit kepatuhan lolos",
        ],
        roadmapGuide: [
          "Uraikan fase pelaksanaan beserta durasinya agar dewan melihat jadwal yang realistis.",
          "Fase umum: 1. Asesmen (~4 minggu) · 2. Deploy infrastruktur (~6 minggu) · 3. Replikasi aplikasi (~8 minggu) · 4. Pengujian (~2 minggu) · 5. Go-live.",
        ],
        governanceGuide: [
          "Sebutkan pemiliknya agar akuntabilitas jelas.",
          "Umumnya: Sponsor Eksekutif (CIO) · Pemilik Proyek (Manajer Infrastruktur) · Pemilik Bisnis (Keuangan, Operasi, Penjualan, Keamanan).",
        ],
        recBody:
          "Kami memohon persetujuan untuk berinvestasi sebesar {fill} pada kapabilitas business continuity yang tangguh guna mengurangi paparan organisasi terhadap gangguan operasional, insiden siber, dan kegagalan infrastruktur — melindungi pendapatan, kepercayaan pelanggan, dan kepatuhan regulasi. Prioritasnya tercantum di bawah.",
        fillHint: "________ (isi nilai investasi)",
      },
    },
    flagsTitle: "Tanda risiko",
    flags: {
      "no-immutable": {
        title: "Ransomware bisa menjangkau backup",
        technical:
          "Repositori backup dapat ditulis oleh kredensial admin yang sama dengan yang mengelola produksi. Tanpa retensi immutable (WORM) yang diberlakukan di lapisan storage, ransomware dengan akses domain admin atau konsol backup dapat mengenkripsi atau menghapus snapshot sebelum retention lock sempat memblokirnya.",
        business:
          "Dengan kredensial admin, penyerang dapat mengenkripsi atau menghapus backup bersama produksi. Salinan immutable (WORM) adalah investasi yang menutup celah ini — inilah yang menahan wabah sekelas 2017 di lapisan backup.",
      },
      "no-offsite": {
        title: "Semua berada di satu lokasi",
        technical:
          "Salinan produksi dan backup berada di lokasi fisik yang sama tanpa air gap. Insiden di satu lokasi — kebakaran, banjir, kegagalan struktural, pencurian fisik — menghilangkan salinan utama sekaligus satu-satunya salinan pemulihan dalam domain kegagalan yang sama.",
        business:
          "Kebakaran, banjir, atau insiden di tingkat lokasi mengambil produksi dan backup sekaligus. Salinan offsite adalah yang melindungi bisnis dari kehilangan keduanya.",
      },
      "no-cross-region": {
        title: "Gangguan satu region menghentikan bisnis",
        technical:
          "Backup hanya bereplikasi di region cloud yang sama dengan produksi. Gangguan control-plane atau infrastruktur regional di sisi penyedia layanan menghilangkan akses ke produksi dan backup sekaligus, karena keduanya tidak melintasi batas availability.",
        business:
          "Untuk bertahan dari insiden region cloud, bisnis memerlukan salinan data lintas region. Tanpanya, pemulihan menunggu penyedia layanan.",
      },
      "single-site": {
        title: "Tidak ada lokasi kedua untuk failover",
        technical:
          "Tidak ada compute, jaringan, atau storage cadangan yang disiapkan di lokasi kedua. Pemulihan setelah kegagalan di tingkat lokasi dibatasi oleh waktu pengadaan dan pembangunan ulang perangkat keras — bukan kecepatan restore — karena tidak ada target failover.",
        business:
          "Gangguan di tingkat lokasi atau region berarti pemulihan dibatasi oleh waktu pengadaan dan pembangunan ulang, bukan kecepatan restore. Target failover adalah investasi yang mengubah hitungan hari menjadi jam.",
      },
      "saas-shared-responsibility": {
        title: "Data SaaS bergantung pada vendor",
        technical:
          "Dalam model tanggung jawab berbagi SaaS, SLA vendor mencakup uptime layanan, bukan kemampuan pemulihan data — penghapusan, error sinkronisasi, atau akun admin yang terkompromi menjadi tanggung jawab tenant. Tanpa data SaaS ditarik secara eksplisit ke pipeline backup milik sendiri, tidak ada recovery point yang independen dari jendela retensi vendor.",
        business:
          "Tanggung jawab berbagi: vendor menjaga layanan tetap berjalan; menjaga data tetap dapat dipulihkan memerlukan salinan milik bisnis sendiri. Pastikan data SaaS benar-benar masuk cakupan backup.",
      },
      "unprotected-workloads": {
        title: "Sebagian workload tidak dapat dipulihkan jika terjadi bencana",
        technical:
          "Satu atau lebih workload tidak memiliki job backup, jadwal snapshot, atau replikasi sama sekali — achievable RPO/RTO menjadi null karena tidak ada recovery point untuk dipulihkan. Kegagalan apa pun di sistem ini berarti kehilangan data permanen, bukan sekadar downtime.",
        business:
          "Workload tanpa proteksi apa pun akan beresiko kehilangan data secara permanen. Melindunginya adalah investasi pertama yang perlu dilakukan.",
      },
      "no-security-policy": {
        title: "Tidak ada kebijakan keamanan sebagai acuan",
        technical:
          "Tidak ada kebijakan tertulis dan disetujui yang mendefinisikan baseline kontrol, pengecualian, atau pemilik yang bertanggung jawab. Kontrol yang ada diadopsi seadanya, sehingga tidak ada dokumen acuan audit dan tidak ada yang bertanggung jawab saat sebuah kontrol diam-diam berhenti berjalan.",
        business:
          "Tanpa kebijakan keamanan tertulis dan pemiliknya, kontrol berjalan seadanya dan tidak ada yang bertanggung jawab. Kebijakan mengubah upaya yang tersebar menjadi sebuah program.",
      },
      "no-security-roles": {
        title: "Tidak ada yang jelas memiliki keamanan",
        technical:
          "Tugas keamanan tidak ditetapkan ke peran bernama — patching, tinjauan akses, dan respons insiden default ke siapa pun yang kebetulan menyadarinya. Operasi kontrol rutin seperti rotasi kunci dan tinjauan log tidak memiliki jadwal yang ditegakkan.",
        business:
          "Bila tanggung jawab keamanan tidak ditetapkan, celah jatuh di antara peran. Kepemilikan yang jelas membuat program berjalan sehari-hari.",
      },
      "no-third-party-risk": {
        title: "Risiko vendor tidak dikelola",
        technical:
          "Vendor dan integrasi yang memiliki akses ke lingkungan Anda tidak dinilai postur keamanannya sendiri. Kompromi di sisi mereka — kredensial bocor, injeksi rantai pasok, akses API yang terlalu luas — mencapai lingkungan Anda lewat jalur terpercaya yang sama tanpa kontrol penyeimbang.",
        business:
          "Kelemahan pemasok Anda menjadi kelemahan Anda. Mengelola risiko pihak ketiga mencegah pembobolan di vendor menjadi pembobolan di Anda.",
      },
      "no-asset-inventory": {
        title: "Tak bisa melindungi yang tak terlihat",
        technical:
          "Tidak ada inventaris sistem, endpoint, dan penyimpanan data yang otoritatif dan terkini. Aset yang tidak terdaftar tidak menerima patch, pemantauan, atau cakupan backup — tidak terlihat oleh kontrol lain mana pun, termasuk cakupan workload asesmen ini sendiri.",
        business:
          "Tanpa inventaris aset, sistem yang tak diketahui tidak di-patch dan tidak dipantau. Mengetahui apa yang Anda miliki adalah langkah pertama semua kontrol lain.",
      },
      "no-risk-assessment": {
        title: "Risiko tidak terukur",
        technical:
          "Risiko tidak dinilai dan diperingkat secara berkala, sehingga belanja keamanan dan DR mengikuti suara paling keras, bukan likelihood × impact yang terukur. Tidak ada baseline untuk menunjukkan apakah postur membaik atau memburuk dari waktu ke waktu.",
        business:
          "Tanpa penilaian risiko berkala, investasi mengalir ke suara paling keras, bukan risiko terbesar. Penilaian mengarahkan anggaran ke yang penting.",
      },
      "no-data-classification": {
        title: "Data sensitif tidak dikenali",
        technical:
          "Data tidak ditandai berdasarkan sensitivitas saat disimpan. Tanpa klasifikasi, enkripsi, kontrol akses, dan retensi diterapkan secara seragam atau tidak sama sekali — data sensitif berakhir dengan perlindungan yang sama dengan data publik.",
        business:
          "Bila Anda tidak tahu data mana yang sensitif, Anda tidak bisa melindunginya secara proporsional. Klasifikasi menunjukkan di mana pertahanan dipusatkan.",
      },
      "no-mfa": {
        title: "Kata sandi jadi satu-satunya kunci",
        technical:
          "Autentikasi hanya mengandalkan kata sandi. Pencurian kredensial lewat phishing, penggunaan ulang kata sandi, atau credential-stuffing dari kebocoran di tempat lain sudah cukup untuk mendapatkan sesi yang valid — tidak ada faktor kedua yang menghentikannya.",
        business:
          "Kata sandi yang dicuri atau ditebak adalah cara masuk paling umum. Autentikasi multi-faktor adalah kontrol bernilai tertinggi melawan pengambilalihan akun.",
      },
      "no-patching": {
        title: "Lubang yang diketahui tetap terbuka",
        technical:
          "Tidak ada jadwal patch yang ditegakkan. Kode eksploit publik untuk CVE yang diungkap biasanya muncul dalam hitungan hari, dan setiap hari sistem tetap tidak di-patch setelah itu adalah jalur serangan terbuka yang terindeks.",
        business:
          "Penyerang mengeksploitasi kerentanan yang diketahui dan belum di-patch dalam hitungan hari. Patching tepat waktu menutup pintu sebelum dipakai.",
      },
      "no-least-privilege": {
        title: "Semua orang bisa mengakses segalanya",
        technical:
          "Hak akses tidak dibatasi sesuai fungsi pekerjaan — akun umumnya memiliki izin lebih luas daripada yang dibutuhkan perannya. Satu kredensial yang terkompromi menjangkau sistem dan data jauh di luar yang dibutuhkan pengguna tersebut, memperluas blast radius secara default.",
        business:
          "Akses luas berarti satu akun yang terkompromi membuka seluruh lingkungan. Least privilege membatasi sejauh mana satu pembobolan menjangkau.",
      },
      "no-encryption": {
        title: "Data terbaca jika terambil",
        technical:
          "Data saat disimpan dan/atau saat dikirim tersimpan atau ditransmisikan dalam bentuk plaintext. Penyadapan di titik mana pun — laptop hilang, backup tanpa enkripsi, koneksi yang disadap — menghasilkan data yang langsung dapat digunakan tanpa langkah tambahan bagi penyerang.",
        business:
          "Data tanpa enkripsi sepenuhnya terekspos begitu perangkat, backup, atau koneksi disadap. Enkripsi membuat data curian tidak berguna.",
      },
      "no-siem": {
        title: "Serangan bisa lolos tanpa terdeteksi",
        technical:
          "Log dari berbagai sistem tidak diagregasi atau dikorelasikan. Pola serangan yang hanya terlihat lintas beberapa sumber log — login gagal di satu host diikuti pergerakan lateral di host lain — luput terdeteksi karena tidak ada satu sistem yang melihat seluruh urutan kejadian.",
        business:
          "Tanpa SIEM yang mengorelasikan log, penyerang bisa beroperasi berminggu-minggu sebelum ada yang sadar. Deteksi terpusat mengubah pembobolan senyap menjadi peringatan dini.",
      },
      "no-central-logging": {
        title: "Tidak ada catatan terpusat untuk investigasi",
        technical:
          "Log tetap tersimpan lokal di masing-masing sistem, bukan dikirim ke penyimpanan terpusat yang tahan terhadap perubahan. Penyerang dengan akses lokal dapat menghapus jejak intrusinya sendiri, dan tidak ada satu linimasa untuk merekonstruksi insiden.",
        business:
          "Bila log hanya tersimpan di masing-masing sistem, tidak ada satu tempat untuk melihat serangan berlangsung atau membuktikan apa yang terjadi. Log terpusat adalah fondasi deteksi dan respons.",
      },
      "no-endpoint-monitoring": {
        title: "Endpoint tidak dipantau",
        technical:
          "Endpoint tidak memiliki EDR atau agen setara yang memantau perilaku proses. Malware dan teknik living-off-the-land yang tidak memicu antivirus berbasis signature berjalan tanpa terdeteksi di perangkat tempat sebagian besar intrusi bermula.",
        business:
          "Laptop dan server adalah tempat mayoritas intrusi mendarat pertama kali. Pemantauan endpoint (EDR) menangkap aktivitas berbahaya di mesin sebelum menyebar.",
      },
      "no-alerting": {
        title: "Deteksi tanpa peringatan hanya jadi catatan",
        technical:
          "Bahkan ketika sinyal deteksi ada, tidak ada yang otomatis diberi notifikasi saat sinyal itu muncul. Kejadian yang terdeteksi tapi tak terlihat tepat waktu berdampak sama seperti kejadian yang tidak terdeteksi sama sekali — respons baru dimulai kapan pun seseorang kebetulan memeriksa.",
        business:
          "Sinyal yang tidak memicu notifikasi baru ditinjau setelah kerusakan terjadi. Alerting mengubah kejadian terdeteksi menjadi respons tepat waktu.",
      },
      "no-vuln-scanning": {
        title: "Celah yang tak diketahui tetap terbuka",
        technical:
          "Tidak ada pemindaian berkala untuk layanan yang terekspos, patch yang hilang, atau kesalahan konfigurasi. Kelemahan yang muncul dari perubahan rutin luput diketahui sampai ditemukan lebih dulu oleh penyerang — atau oleh sebuah insiden.",
        business:
          "Kelemahan yang belum ditambal dan terekspos adalah pintu yang dipakai penyerang. Pemindaian kerentanan berkala adalah cara bisnis menemukan dan menutupnya lebih dulu.",
      },
      "no-ir-plan": {
        title: "Tidak ada rencana saat insiden terjadi",
        technical:
          "Tidak ada rencana respons insiden yang terdokumentasi — tidak ada peran yang telah ditentukan, jalur eskalasi, atau playbook untuk skenario umum. Respons pertama terhadap insiden yang sedang berlangsung diimprovisasi secara real time, yang secara terukur memperpanjang waktu penanganan.",
        business:
          "Berimprovisasi saat insiden berlangsung menghabiskan waktu berjam-jam yang tak bisa ditebus. Rencana respons insiden terdokumentasi menjaga krisis tidak berubah jadi kekacauan.",
      },
      "no-isolation": {
        title: "Tidak ada yang menahan penyebaran",
        technical:
          "Jaringan tidak memiliki kemampuan segmentasi atau containment — tidak ada cara mengisolasi host yang terkompromi tanpa mematikan sistem di sekitarnya. Satu endpoint yang terinfeksi dapat bergerak lateral ke seluruh jaringan datar tanpa hambatan teknis.",
        business:
          "Tanpa kemampuan mengisolasi segmen yang terkompromi, satu mesin terinfeksi bisa menjatuhkan seluruh lingkungan. Isolasi jaringan adalah kontrol yang membendung insiden.",
      },
      "no-ir-ownership": {
        title: "Tidak ada pemilik respons",
        technical:
          "Tidak ada individu atau tim yang ditunjuk sebagai incident commander untuk sebuah kejadian keamanan. Tanpa kepemilikan yang eksplisit, jam pertama insiden apa pun habis untuk menentukan siapa yang memimpin sebelum tindakan containment bisa dimulai.",
        business:
          "Bila tidak ada yang jelas bertugas, jam pertama insiden habis untuk 'siapa yang menangani ini?'. Kepemilikan respons yang ditunjuk memulai penanganan lebih cepat.",
      },
      "no-breach-notification": {
        title: "Tidak ada proses pemberitahuan",
        technical:
          "Tidak ada proses yang ditetapkan untuk pemberitahuan pembobolan yang diwajibkan secara hukum dalam jendela waktu statutori (sering kali 72 jam). Melewatkan jendela ini mengubah insiden keamanan menjadi pelanggaran kepatuhan terpisah dengan sanksinya sendiri.",
        business:
          "Regulator dan pelanggan mengharapkan pengungkapan tepat waktu setelah pembobolan; jendela yang terlewat menambah penalti. Proses pemberitahuan pembobolan mencegah insiden teknis berubah jadi masalah kepatuhan.",
      },
    },
    rule321Title: "Aturan 3-2-1",
    rule321: {
      threeCopies: "tiga salinan",
      twoMedia: "dua media",
      oneOffsite: "satu offsite",
    },
    legend: {
      withinTarget: "dalam target",
      overrun: "melebihi",
      target: "target",
    },
    heatmap: {
      impact: "Dampak bisnis",
      readiness: "Kesiapan recovery",
      impactLevels: ["Rendah", "Sedang", "Tinggi"] as [string, string, string],
      gapLevels: ["Sesuai", "Sebagian", "Berisiko"] as [string, string, string],
      more: "+{n}",
      catastrophic: "Tak dapat dipulihkan",
      tierAxis: "per tier (biaya belum diisi)",
    },
    statusLabel: {
      good: "Siap",
      fair: "Perlu perhatian",
      poor: "Berisiko",
    },
    severity: {
      critical: "Kritis",
      warning: "Perhatian",
    },
  },

  drill: {
    title: "Simulasi langsung",
    totalLoss: "Total potensi kerugian bisnis",
    pickScenario: "Pilih bencana yang ingin disimulasikan:",
    idlePrompt: "Pilih skenario, lalu jalankan simulasi untuk melihat kronologis terjadinya bencana menit per menit secara detail.",
    generate: "Jalankan simulasi",
    regenerate: "Jalankan lagi",
    scenarios: {
      ransomware: "Ransomware",
      siteloss: "Bencana lokal (kebakaran/banjir)",
      outage: "Gangguan cloud/region",
      deletion: "Penghapusan tidak sengaja",
    },
    generating: "Menulis cerita simulasi Anda…",
    unavailable:
      "Cerita simulasi sedang tidak tersedia. Asesmen Anda di atas tetap lengkap dan tidak terpengaruh.",
    redacted:
      "Sebagian cerita tidak dapat diverifikasi terhadap temuan terhitung Anda dan ditahan. Asesmen Anda di atas tetap lengkap dan tidak terpengaruh.",
    capReached:
      "Kuota cerita untuk sesi ini sudah habis. Asesmen di atas tetap tersedia sepenuhnya.",
    languageNotice: "Cerita ini ditulis sebelum bahasa diganti — buat ulang untuk memperbaruinya.",
  },

  footer: {
    attribution: "Dibuat oleh Harun Jonatan — 25+ tahun di data protection enterprise.",
  },

  language: {
    id: "Bahasa Indonesia",
    en: "English",
  },
};
