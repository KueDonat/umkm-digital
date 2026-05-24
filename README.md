# 🛒 UMKM Fullstack Project Boilerplate

Selamat datang di boilerplate resmi proyek pengembangan aplikasi UMKM! Proyek ini menggunakan arsitektur modern berkinerja tinggi yang memisahkan Frontend dan Backend secara bersih, didukung oleh database PostgreSQL.

---

## 🏛️ Arsitektur Teknologi

| Komponen | Teknologi | Deskripsi |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14+ (App Router) | Web App dengan TypeScript & Tailwind CSS untuk tampilan premium dan responsif. |
| **Backend** | Golang (Gin Framework) | REST API berkinerja tinggi dengan GORM ORM untuk pengelolaan data PostgreSQL. |
| **Database** | PostgreSQL | Penyimpanan relasional yang tangguh, didukung setup instan melalui Docker. |
| **Container** | Docker & Compose | Pengelolaan database & administrasi web (pgAdmin) secara portabel. |

---

## 📂 Struktur Direktori Utama

```text
project-umkm/
├── backend/          # Aplikasi Backend (Golang + Gin)
├── frontend/         # Aplikasi Frontend (Next.js App Router)
├── docker-compose.yml# Setup PostgreSQL & pgAdmin
├── .gitignore        # Git ignore global
└── README.md         # Dokumentasi utama proyek (file ini)
```

---

## 🚀 Panduan Memulai Cepat

### 1. Prasyarat Sistem
Pastikan Anda sudah menginstal alat-alat berikut di perangkat Anda:
* [Node.js (v18+)](https://nodejs.org/) & `npm`
* [Go (v1.20+)](https://go.dev/)
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Opsional, tapi disarankan untuk database)

### 2. Jalankan Database (PostgreSQL)
Jika Anda menggunakan Docker, Anda bisa menyalakan database dalam hitungan detik:
```bash
docker-compose up -d
```
* **Database Host**: `localhost:5432`
* **Username**: `umkm_user`
* **Password**: `umkm_password`
* **Database Name**: `umkm_db`
* **pgAdmin**: Kunjungi `http://localhost:5050` (Email: `admin@umkm.local` \| Password: `admin_password`)

### 3. Setup & Jalankan Backend (Golang)
1. Masuk ke direktori backend:
   ```bash
   cd backend
   ```
2. Salin template environment:
   ```bash
   copy .env.example .env
   ```
3. Unduh dependency Go:
   ```bash
   go mod tidy
   ```
4. Jalankan aplikasi:
   ```bash
   go run main.go
   ```
   * REST API akan berjalan di `http://localhost:8080`

### 4. Setup & Jalankan Frontend (Next.js)
1. Masuk ke direktori frontend:
   ```bash
   cd frontend
   ```
2. Instal semua dependency:
   ```bash
   npm install
   ```
3. Jalankan server development:
   ```bash
   npm run dev
   ```
   * Frontend dapat diakses melalui browser di `http://localhost:3000`

---

## 🔌 Dokumentasi API Awal (Boilerplate)

Secara default, backend dilengkapi dengan API produk sederhana untuk memverifikasi koneksi:

* **GET** `/api/products` - Mengambil semua produk UMKM
* **POST** `/api/products` - Menambahkan produk baru
* **GET** `/api/products/:id` - Mengambil detail satu produk
* **PUT** `/api/products/:id` - Mengubah produk
* **DELETE** `/api/products/:id` - Menghapus produk

---

Selamat berkreasi dan kembangkan UMKM Indonesia naik kelas! 🚀
