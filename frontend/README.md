# 🎨 Frontend - Next.js UMKM Platform

Aplikasi Client Web-App ini dikembangkan menggunakan **Next.js 14+ (App Router)**, **TypeScript**, dan **Tailwind CSS**. Tampilan dirancang dengan estetika premium gelap (glassmorphic dark theme) untuk memantau data inventaris secara elegan.

---

## 📂 Struktur Direktori

* `/src/app`: Lokasi folder App Router utama.
  * `page.tsx`: Halaman utama Dashboard inventaris interaktif.
  * `layout.tsx`: Root Layout tempat meta-tag, font (Geist), dan global styling dimuat.
  * `globals.css`: Setup Tailwind CSS v4.
* `/public`: Aset gambar dan statis.

---

## 🛠️ Cara Menjalankan

1. **Instalasi Dependency**:
   Pastikan Anda berada di direktori `frontend`, lalu jalankan:
   ```bash
   npm install
   ```

2. **Menjalankan Server Development**:
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 🔌 Sinkronisasi dengan Backend API

Secara default, dashboard ini dilengkapi fitur **Koneksi Pintar**:
* **Mode Mock (Offline)**: Jika backend Golang mati, dashboard akan menggunakan memori browser lokal (`localStorage`) sehingga halaman tetap dapat diuji, ditambah, dan dihapus datanya secara interaktif.
* **Mode Live REST API (Online)**: Begitu server backend Golang Anda berjalan di `http://localhost:8080`, tombol status di pojok kanan atas akan menyala hijau, dan Anda bisa menekan tombol **"Ganti ke Live API"** untuk menyinkronkan data secara real-time ke database PostgreSQL via API REST.
