# 🚀 Release Notes - v1.2.0 (Keyboard & Touchpad Update)

Pemotongan rilis terbaru ini menghadirkan dua fitur paling banyak di-request untuk navigasi Smart TV yang jauh lebih mulus, yaitu Sinkronisasi Keyboard dan Mouse Pointer Mode!

## ✨ Fitur Baru (New Features)
*   **⌨️ Sinkronisasi Keyboard Cerdas (Keyboard Sync)**
    *   **YouTube Mode (Real-time Typing):** Ketik langsung dari HP dan hurufnya akan muncul secara *real-time* satu per satu di kolom penelusuran YouTube Smart TV (melewati limitasi keyboard kustom Tizen).
    *   **Browser Mode (Bulk Typing):** Ketik kalimat panjang di HP, lalu kirim sekaligus ke Browser bawaan TV dengan sekali tap memakai protokol *SendInputString* resmi Samsung.
*   **🖱️ Mouse Pointer Mode (Touchpad)**
    *   Sekarang HP bisa berubah menjadi *fullscreen touchpad* layaknya laptop!
    *   **Geser 1 Jari:** Menggerakkan kursor mouse di browser TV dengan presisi tinggi.
    *   **Tap Layar:** Simulasi klik kiri (*Left Click*).
    *   **Geser 2 Jari:** Otomatis melakukan *Scroll* halaman ke atas/bawah.
    *   Tombol fisik "Klik Kiri" dan "Kembali" juga ditambahkan sebagai cadangan navigasi saat di mode Touchpad.

## 🛠️ Perbaikan & Optimasi (Improvements & Bug Fixes)
*   **Removed QR Overlay:** Menghapus overlay QR Code yang sebelumnya menutupi antarmuka remote utama (Sesuai request).
*   **UI Modernization:** Penambahan icon Mouse, styling keyboard modern (glassmorphism), dan state toggle YouTube/Browser yang responsif di aplikasi klien web.
*   **Optimasi WebSocket Bridge:** Mencegah spam *event fallback* pada saat mengetik menggunakan koneksi Tizen ms.remote.control API.
*   Pembersihan dependensi UI yang tidak digunakan (*QRCodeSVG* removed).

*Dibuat khusus untuk setup TV Samsung NU7100 Tizen OS, mendukung penuh ekosistem jaringan lokal yang lancar.* 🚀
