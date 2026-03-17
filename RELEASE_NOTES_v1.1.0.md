# Tizen-QR v1.1.0: Auto-Discovery Update 📡

Selamat datang di pembaruan **Tizen-QR versi 1.1.0**! 🚀
Update kali ini difokuskan pada peningkatan kualitas koneksi yang membuat aplikasi menjadi jauh lebih cerdas dan berstatus *plug-and-play*.

## ✨ Fitur Baru & Peningkatan (What's New)

- **Smart Auto-Discovery**: 
  Server Node.js sekarang secara otomatis menyisir jaringan Wi-Fi lokal untuk menemukan Smart TV Samsung Anda secara mandiri! Anda tak perlu lagi pusing mencari tahu dan menulis (*hardcoding*) IP Address dan MAC Address TV ke dalam kode secara manual.
  
- **Dynamic Wake-On-LAN (WoL)**: 
  Sistem *Magic Packet* sekarang membaca MAC Address TV secara dinamis (hasil dari *Auto-Discovery*), memastikan fungsi menghidupkan TV dari mode *standby* selalu bekerja meskipun router mengubah IP TV Anda.

- **Intelligent Configuration Cache**: 
  Identitas TV Anda kini disimpan secara aman di dalam `tv-config.json` pada percobaan pertama. Hal ini memangkas drastis waktu *loading* atau deteksi (scan) berikutnya—koneksi ke TV akan terjadi secara instan (0 detik)!

- **Interactive Connection UI**: 
  Tampilan web remot sekarang dibekali indikator status dan pesan *real-time*:
  - 🟡 **Scanning/Kuning**: Server Bridge sedang aktif mencari TV Anda di udara.
  - 🟢 **Connected/Hijau**: Sukses terhubung ke *"Samsung TV [Nama Seri]"*.
  - 🔴 **Disconnected/Merah**: Gagal terhubung atau jembatan *bridge* terputus.

- **Manual Force-Scan Action**: 
  Terdapat tombol **Refresh 🔄** baru di pojok kanan atas UI Web. Satu kali klik akan memerintahkan server untuk memindai ulang jaringan Wi-Fi apabila alamat IP Smart TV berubah secara mendadak.

## 🌱 Perbaikan Teknis Internal
- Penyempurnaan kode dasar (*refactoring*) pada *Backend* (`server/index.js`) untuk stabilitas koneksi via port `8001` (HTTP API) dan `8002` (Secure WebSocket).
- Penambahan fungsi pembacaan data respons balik dari SmartTV API.

---

**Panduan Update / Install Lanjutan:**
Jika Anda mengunduh rilis terbaru ini, pastikan untuk kembali menjalankan `npm install internal-ip` di dalam direktori `server` karena terdapat dependensi *networking* baru yang dibutuhkan oleh skrip `scan.js`.
