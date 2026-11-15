/* =====================================================================
   FAMILY 100 — "JADUL"
   Satu berkas dipakai untuk dua halaman:
     - game.html?soal=N  -> memainkan satu soal
     - index.html        -> menu 6 soal, skor total, dan status terkunci
   Untuk menambah/mengubah soal cukup mengedit array SOAL di bawah.
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. DATA SOAL
   Bentuk tiap jawaban:
     { teks: "KETUPAT", poin: 25, varian: ["KUPAT"] }
   - `teks`   : jawaban yang ditampilkan di papan.
   - `poin`   : skor yang didapat kalau benar.
   - `varian` : (opsional) ejaan lain yang juga diterima.
   Perbandingan jawaban mengabaikan besar-kecil huruf, spasi berlebih,
   serta tanda hubung -- jadi "JALAN-JALAN" otomatis sama dengan "JALAN JALAN".
   Contoh menambah padanan: { teks: "BAJU", poin: 30, varian: ["KEMEJA"] }
   --------------------------------------------------------------------- */
const SOAL = [
  {
    tanya: "Makanan apa saja yang biasa ditemukan ketika lebaran?",
    pesanSalah: "JAWABAN SALAH",
    jawaban: [
      { teks: "INACO", poin: 30 },
      { teks: "KETUPAT", poin: 25 },
      { teks: "RENDANG", poin: 20 },
      { teks: "NASTAR", poin: 15 },
      { teks: "OPOR", poin: 10 }
    ]
  },
  {
    tanya: "Apa yang biasa dilakukan seseorang ketika bertemu teman lamanya?",
    pesanSalah: "AYO... PIKIR LAGI",
    jawaban: [
      { teks: "MINTA NOMOR", poin: 30 },
      { teks: "BERPELUKAN", poin: 25 },
      // papan menampilkan "JALAN-JALAN"; ketikan "JALAN JALAN" juga diterima
      // karena normalisasi mengubah tanda hubung menjadi spasi
      { teks: "JALAN-JALAN", poin: 20 },
      { teks: "NGOBROL", poin: 15 },
      { teks: "BERSALAMAN", poin: 10 }
    ]
  },
  {
    tanya: "Jajanan paling favorit di Pondok",
    pesanSalah: "COBA LAGI YA...",
    jawaban: [
      { teks: "SEMPOL", poin: 30 },
      { teks: "AOKA", poin: 25 },
      { teks: "NABATI", poin: 20 },
      { teks: "RISOL", poin: 15 },
      { teks: "BATAGOR", poin: 10 }
    ]
  },
  {
    tanya: "Sebutkan sesuatu yang berjalan beriringan?",
    pesanSalah: "WADUH SALAH",
    jawaban: [
      { teks: "SEMUT", poin: 30 },
      { teks: "BEBEK", poin: 25 },
      { teks: "MOBIL PEJABAT", poin: 20 },
      { teks: "PAWAI", poin: 15 },
      { teks: "PENGANTIN", poin: 10 }
    ]
  },
  {
    tanya: "Sebutkan olahraga air yang tidak dilakukan di kolam renang?",
    pesanSalah: "BELAJAR LAGI DEK....",
    jawaban: [
      { teks: "SELANCAR", poin: 30 },
      { teks: "JET SKI", poin: 25 },
      { teks: "DAYUNG", poin: 20 },
      { teks: "PERAHU LAYAR", poin: 15 },
      { teks: "ARUM JERAM", poin: 10 }
    ]
  },
  {
    tanya: "Sebutkan sesuatu yang tidak terpakai jika berlubang?",
    pesanSalah: "JAWABAN SALAH",
    jawaban: [
      { teks: "CELANA", poin: 30 },
      { teks: "BAJU", poin: 25 },
      { teks: "EMBER", poin: 20 },
      { teks: "KRESEK", poin: 15 },
      { teks: "PAYUNG", poin: 10 }
    ]
  }
];

const MAKS_SALAH = 3; // kesempatan salah per soal, seperti Family 100
const KUNCI_SIMPAN = "jadul-family100-v1";

/* ---------------------------------------------------------------------
   2. PENYIMPANAN
   localStorage bisa diblokir (mis. dibuka sebagai file:// di beberapa
   peramban), jadi selalu dibungkus try/catch + fallback ke memori.
   --------------------------------------------------------------------- */
const penyimpanan = (function () {
  const memori = {};
  let siap = false;
  try {
    localStorage.setItem(KUNCI_SIMPAN + "__uji", "1");
    localStorage.removeItem(KUNCI_SIMPAN + "__uji");
    siap = true;
  } catch (e) {
    siap = false;
  }
  return {
    get: function (kunci) {
      if (siap) { try { return localStorage.getItem(kunci); } catch (e) { /* jatuh ke memori */ } }
      return Object.prototype.hasOwnProperty.call(memori, kunci) ? memori[kunci] : null;
    },
    set: function (kunci, nilai) {
      if (siap) { try { localStorage.setItem(kunci, nilai); return; } catch (e) { /* jatuh ke memori */ } }
      memori[kunci] = nilai;
    }
  };
})();

function bacaSemuaSoal() {
  try {
    const mentah = penyimpanan.get(KUNCI_SIMPAN);
    const data = mentah ? JSON.parse(mentah) : {};
    return data && typeof data === "object" ? data : {};
  } catch (e) {
    return {};
  }
}

function tulisSemuaSoal(data) {
  penyimpanan.set(KUNCI_SIMPAN, JSON.stringify(data));
}

function rekamanKosong() {
  return { poin: 0, terbuka: [], salah: 0, selesai: false, hasil: null };
}

/* ---------------------------------------------------------------------
   3. UTILITAS
   --------------------------------------------------------------------- */
// "  jalan-jalan " -> "JALAN JALAN" (huruf besar, tanda baca jadi spasi)
function normalisasi(teks) {
  return String(teks)
    .toUpperCase()
    .replace(/['’`]/g, "")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

function daftarTerima(jawaban) {
  const kandidat = [jawaban.teks].concat(jawaban.varian || []);
  return kandidat.map(normalisasi);
}

function jumlahMaksimal(nomor) {
  return SOAL[nomor - 1].jawaban.reduce(function (total, j) { return total + j.poin; }, 0);
}

function skorTotal(data) {
  let total = 0;
  for (let n = 1; n <= SOAL.length; n++) {
    const rek = data[n];
    if (rek && typeof rek.poin === "number") { total += rek.poin; }
  }
  return total;
}

function skorMaksimalTotal() {
  let total = 0;
  for (let n = 1; n <= SOAL.length; n++) { total += jumlahMaksimal(n); }
  return total;
}

function nomorSoalDariURL() {
  let nomor = parseInt(new URLSearchParams(window.location.search).get("soal"), 10);
  if (!Number.isFinite(nomor) || nomor < 1 || nomor > SOAL.length) { nomor = 1; }
  return nomor;
}

function el(id) { return document.getElementById(id); }

function isiTeks(id, teks) {
  const node = el(id);
  if (node) { node.textContent = teks; }
}

/* ---------------------------------------------------------------------
   4. HALAMAN GAME (game.html?soal=N)
   --------------------------------------------------------------------- */
function initGame() {
  const nomor = nomorSoalDariURL();
  const soal = SOAL[nomor - 1];
  const semuaData = bacaSemuaSoal();
  const tersimpan = semuaData[nomor] || rekamanKosong();

  const state = {
    poin: Number(tersimpan.poin) || 0,
    terbuka: new Set(
      (Array.isArray(tersimpan.terbuka) ? tersimpan.terbuka : [])
        .filter(function (i) { return Number.isInteger(i) && i >= 0 && i < soal.jawaban.length; })
    ),
    salah: Number(tersimpan.salah) || 0,
    selesai: Boolean(tersimpan.selesai),
    hasil: tersimpan.hasil || null
  };

  const form = el("form-jawaban");
  const input = el("input-jawaban");
  const papan = el("daftar-jawaban");
  const panel = el("panel-selesai");
  const tombolUlang = el("btn-ulang");
  const tombolLanjut = el("btn-lanjut");
  const kotakPesan = el("pesan");

  isiTeks("judul-soal", "Soal " + nomor + " dari " + SOAL.length);
  isiTeks("pertanyaan", soal.tanya);
  document.title = "Soal " + nomor + " — Family 100 JADUL";

  function simpan() {
    const data = bacaSemuaSoal();
    data[nomor] = {
      poin: state.poin,
      terbuka: Array.from(state.terbuka),
      salah: state.salah,
      selesai: state.selesai,
      hasil: state.hasil
    };
    tulisSemuaSoal(data);
  }

  function tampilkanPesan(teks, jenis) {
    kotakPesan.textContent = teks || "";
    kotakPesan.className = teks ? "pesan pesan--" + jenis : "pesan";
    kotakPesan.hidden = !teks;
  }

  let sorot = null; // baris yang baru dibuka, untuk animasi

  function renderPapan() {
    papan.innerHTML = "";
    soal.jawaban.forEach(function (jawaban, indeks) {
      const terbuka = state.terbuka.has(indeks);
      const baris = document.createElement("li");
      baris.className = "baris-jawaban" + (terbuka ? " terbuka" : "");
      baris.innerHTML =
        '<span class="nomor-jawaban">' + (indeks + 1) + "</span>" +
        '<span class="teks-jawaban"></span>' +
        '<span class="badge text-bg-primary rounded-pill poin-jawaban">' + jawaban.poin + "</span>";
      baris.querySelector(".teks-jawaban").textContent = terbuka ? jawaban.teks : "? ? ?";
      if (terbuka && indeks === sorot) { baris.classList.add("scale-up-hor-center"); }
      papan.appendChild(baris);
    });
    sorot = null;
  }

  function perbarui() {
    const data = bacaSemuaSoal();
    isiTeks("poin-soal", state.poin);
    isiTeks("sisa-kesempatan", Math.max(0, MAKS_SALAH - state.salah));
    isiTeks("skor-total", skorTotal(data));
    renderPapan();

    if (state.selesai) {
      form.hidden = true;
      panel.hidden = false;
      isiTeks("hasil-judul", state.hasil === "menang" ? "SEMUA JAWABAN TERBUKA!" : "KESEMPATAN HABIS");
      isiTeks("hasil-skor", "Skor soal ini: " + state.poin + " dari " + jumlahMaksimal(nomor));
      if (nomor < SOAL.length) {
        tombolLanjut.href = "game.html?soal=" + (nomor + 1);
        tombolLanjut.textContent = "Soal berikutnya (" + (nomor + 1) + ")";
      } else {
        tombolLanjut.href = "index.html";
        tombolLanjut.textContent = "Lihat skor total";
      }
    } else {
      form.hidden = false;
      panel.hidden = true;
    }
  }

  function selesaikan(hasil) {
    state.selesai = true;
    state.hasil = hasil;
    simpan();
    perbarui();
  }

  function periksa() {
    if (state.selesai) { return; }

    const teks = normalisasi(input.value);
    if (!teks) { tampilkanPesan("Tulis dulu jawabanmu.", "info"); return; }

    const cocok = soal.jawaban.findIndex(function (jawaban) {
      return daftarTerima(jawaban).indexOf(teks) !== -1;
    });

    if (cocok !== -1) {
      if (state.terbuka.has(cocok)) {
        tampilkanPesan("SUDAH DISEBUT", "info");
      } else {
        state.terbuka.add(cocok);
        sorot = cocok;
        state.poin += soal.jawaban[cocok].poin;
        tampilkanPesan("BENAR! +" + soal.jawaban[cocok].poin, "benar");
        if (state.terbuka.size === soal.jawaban.length) { selesaikan("menang"); }
      }
    } else {
      state.salah += 1;
      tampilkanPesan(soal.pesanSalah, "salah");
      if (state.salah >= MAKS_SALAH) {
        // buka semua supaya pemain tahu jawabannya
        soal.jawaban.forEach(function (_, indeks) { state.terbuka.add(indeks); });
        selesaikan("kalah");
      }
    }

    input.value = "";
    input.focus();
    simpan();
    perbarui();
  }

  form.addEventListener("submit", function (peristiwa) {
    peristiwa.preventDefault(); // Enter atau tombol, keduanya lewat sini
    periksa();
  });

  tombolUlang.addEventListener("click", function () {
    if (!window.confirm("Ulangi soal ini dari awal? Skor soal ini akan dihapus.")) { return; }
    const data = bacaSemuaSoal();
    delete data[nomor];
    tulisSemuaSoal(data);
    state.poin = 0;
    state.terbuka = new Set();
    state.salah = 0;
    state.selesai = false;
    state.hasil = null;
    tampilkanPesan("", "info");
    perbarui();
    input.focus();
  });

  window.addEventListener("storage", function (peristiwa) {
    if (peristiwa.key === KUNCI_SIMPAN) { perbarui(); }
  });

  perbarui();

  // tampilkan pesan kalau soal sudah pernah diselesaikan sebelumnya
  if (state.selesai) {
    tampilkanPesan(state.hasil === "menang" ? "Soal ini sudah kamu selesaikan." : "Soal ini sudah berakhir.", "info");
  }
}

/* ---------------------------------------------------------------------
   5. HALAMAN MENU (index.html)
   Menampilkan skor per soal, skor total, dan mengunci soal yang selesai.
   Statusnya tetap ada setelah halaman dimuat ulang karena disimpan.
   --------------------------------------------------------------------- */
function initIndex() {
  const kartu = document.querySelectorAll("[data-soal]");

  function segarkan() {
    const data = bacaSemuaSoal();

    kartu.forEach(function (tautan) {
      const nomor = Number(tautan.dataset.soal);
      const rek = data[nomor];
      const label = tautan.parentElement.querySelector(".skor-soal");
      const selesai = Boolean(rek && rek.selesai);

      tautan.classList.toggle("soal-selesai", selesai);
      tautan.setAttribute("aria-disabled", selesai ? "true" : "false");
      tautan.tabIndex = selesai ? -1 : 0;
      if (selesai) {
        tautan.removeAttribute("href");
      } else {
        tautan.href = "game.html?soal=" + nomor;
      }

      if (label) {
        if (selesai) {
          label.textContent = "Selesai — " + rek.poin + " poin";
          label.classList.add("teks-selesai");
        } else if (rek && rek.poin > 0) {
          label.textContent = rek.poin + " poin";
          label.classList.remove("teks-selesai");
        } else {
          label.textContent = "Belum dimainkan";
          label.classList.remove("teks-selesai");
        }
      }
    });

    isiTeks("skor-total", skorTotal(data));
    isiTeks("skor-maksimal", skorMaksimalTotal());

    const selesaiSemua = SOAL.every(function (_, i) { return data[i + 1] && data[i + 1].selesai; });
    isiTeks("status-permainan", selesaiSemua ? "Semua soal sudah dimainkan. Tekan Ulangi untuk mulai lagi." : "");
  }

  kartu.forEach(function (tautan) {
    tautan.addEventListener("click", function (peristiwa) {
      if (tautan.classList.contains("soal-selesai")) {
        peristiwa.preventDefault();
        window.alert("Soal ini sudah diselesaikan. Tekan \"Ulangi semua\" kalau ingin main lagi.");
      }
    });
  });

  const tombolHapus = el("btn-ulang-semua");
  if (tombolHapus) {
    tombolHapus.addEventListener("click", function () {
      if (!window.confirm("Hapus semua skor dan buka kembali 6 soal?")) { return; }
      penyimpanan.set(KUNCI_SIMPAN, "{}");
      segarkan();
    });
  }

  window.addEventListener("storage", function (peristiwa) {
    if (peristiwa.key === KUNCI_SIMPAN) { segarkan(); }
  });
  window.addEventListener("focus", segarkan);
  document.addEventListener("visibilitychange", segarkan);

  segarkan();
}

/* ---------------------------------------------------------------------
   6. JALANKAN
   --------------------------------------------------------------------- */
if (el("game-root")) { initGame(); }
if (el("menu-root")) { initIndex(); }
