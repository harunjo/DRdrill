import type { Dictionary } from "./en";

// Indonesian dictionary — mirrors lib/locales/en.ts exactly (typed against it).

export const id: Dictionary = {
  appName: "DR Drill",
  masthead: "Asesmen business continuity",
  tagline: "Gambarkan lingkungan IT Anda, lalu lihat kesiapan recovery yang sebenarnya — RPO/RTO yang benar-benar bisa dicapai, bukan sekadar angka di slide.",
  privacyLine:
    "Detail lingkungan dan nama workload Anda tidak pernah meninggalkan browser ini. Cerita simulasi ditulis hanya dari temuan yang dianonimkan (W1, W2, …), dan tidak ada input atau data Anda yang disimpan di server ini.",
  trustIndicator: "Berjalan lokal · data tetap di perangkat",

  intake: {
    steps: {
      model: "Lingkungan",
      workloads: "Workload",
      protection: "Proteksi",
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
      files: "File share",
      saas: "SaaS",
    },
    sizeLabel: "Ukuran (GB)",
    cost: {
      label: "Biaya downtime (opsional)",
      unit: "Rp / jam",
      placeholder: "mis. 5000000",
      quickFill: "Isi cepat biaya downtime",
      sameForAll: "Sama untuk semua",
      byTier: "Per tier",
      apply: "Terapkan",
      tierShort: "T{n}",
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
    run: "Jalankan asesmen",
    zeroWorkloads: "Tambahkan minimal satu workload bernama untuk menjalankan asesmen.",
    back: "Kembali",
    next: "Lanjut",
    stepCounter: "Langkah {n} dari {total}",
  },

  report: {
    newAssessment: "Asesmen baru",
    coverageShort: "Berdasarkan {n} workload yang Anda gambarkan",
    lensesLabel: "Tampilan laporan",
    lenses: { business: "Dampak bisnis", technical: "Teknis", investment: "Usulan investasi" },
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
    unrecoverable: "tidak dapat dipulihkan",
    units: { min: "mnt", h: "jam", d: "hari" },
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
    },
    invest: {
      fundingCase: "Business continuity — usulan pendanaan",
      exposureAtRisk: "Eksposur berisiko",
      plusUnrecoverable: "plus {n} tak terpulihkan",
      allUnrecoverable: "{n} workload tak terpulihkan",
      noCost: "Isi biaya downtime di intake untuk mengukur eksposur.",
      posture: "Postur",
      bia: "BIA · asesmen mandiri selaras dengan ISO 22301 / NIST CSF",
      closes: "Menutup ~{amount} eksposur",
      closesQual: "Menutup eksposur yang dilindungi kontrol ini",
      makesRecoverable: "Membuat {n} workload dapat dipulihkan",
      strengthens: "Memperkuat ketahanan",
      preparedBy: "Disiapkan oleh IT · tidak ada yang disimpan",
      copy: "Salin ringkasan",
      copied: "Tersalin",
      copyFailed: "Salin tidak tersedia — pilih teks di bawah untuk menyalin manual:",
      scope: { onprem: "on-premise", cloud: "cloud" },
    },
    flagsTitle: "Tanda risiko",
    flags: {
      "no-immutable": {
        title: "Ransomware bisa menjangkau backup",
        detail:
          "Dengan kredensial admin, penyerang dapat mengenkripsi atau menghapus backup bersama produksi. Salinan immutable (WORM) adalah investasi yang menutup celah ini — inilah yang menahan wabah sekelas 2017 di lapisan backup.",
      },
      "no-offsite": {
        title: "Semua berada di satu lokasi",
        detail:
          "Kebakaran, banjir, atau insiden di tingkat lokasi mengambil produksi dan backup sekaligus. Salinan offsite adalah yang melindungi bisnis dari kehilangan keduanya.",
      },
      "no-cross-region": {
        title: "Gangguan satu region menghentikan bisnis",
        detail:
          "Untuk bertahan dari insiden region cloud, bisnis memerlukan salinan data lintas region. Tanpanya, pemulihan menunggu penyedia layanan.",
      },
      "single-site": {
        title: "Tidak ada lokasi kedua untuk failover",
        detail:
          "Gangguan di tingkat lokasi atau region berarti pemulihan dibatasi oleh waktu pengadaan dan pembangunan ulang, bukan kecepatan restore. Target failover adalah investasi yang mengubah hitungan hari menjadi jam.",
      },
      "saas-shared-responsibility": {
        title: "Data SaaS bergantung pada vendor",
        detail:
          "Tanggung jawab berbagi: vendor menjaga layanan tetap berjalan; menjaga data tetap dapat dipulihkan memerlukan salinan milik bisnis sendiri. Pastikan data SaaS benar-benar masuk cakupan backup.",
      },
      "unprotected-workloads": {
        title: "Sebagian workload tidak dapat dipulihkan",
        detail:
          "Workload tanpa proteksi apa pun hanya berjarak satu insiden dari kehilangan permanen. Melindunginya adalah investasi pertama yang perlu dilakukan.",
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
    pickScenario: "Pilih bencana yang ingin disimulasikan:",
    idlePrompt: "Pilih skenario, lalu jalankan simulasi untuk melihat bagaimana malam ini berjalan — menit demi menit.",
    generate: "Jalankan simulasi",
    regenerate: "Jalankan lagi",
    scenarios: {
      ransomware: "Ransomware",
      siteloss: "Kehilangan lokasi (kebakaran/banjir)",
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
