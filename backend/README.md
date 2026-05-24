# 🚀 Backend - Go UMKM Platform

Aplikasi API Backend ini dikembangkan menggunakan **Golang** dan framework **Gin-Gonic**, didukung oleh **GORM** sebagai ORM PostgreSQL.

---

## 📂 Struktur Direktori

* `/config`: Mengelola koneksi database PostgreSQL dan loading variabel lingkungan (`.env`).
* `/controllers`: Menyimpan logika utama penanganan HTTP Request (CRUD).
* `/models`: Mendefinisikan struct GORM yang dipetakan langsung menjadi tabel database.
* `/routes`: Tempat konfigurasi rute endpoint API dan middleware (CORS, dll).

---

## 🛠️ Cara Menjalankan

1. **Instalasi Paket & Dependency** (Lakukan pertama kali):
   ```bash
   go mod tidy
   ```

2. **Setup Environment**:
   Salin file konfigurasi environment:
   ```bash
   copy .env.example .env
   ```
   Sesuaikan detail koneksi database PostgreSQL lokal Anda di dalam file `.env`.

3. **Menjalankan Server**:
   ```bash
   go run main.go
   ```
   Server akan berjalan secara otomatis di port `8080` (dapat diubah di `.env`).

---

## 📦 Paket Utama yang Digunakan
* `github.com/gin-gonic/gin` - Web API framework.
* `gorm.io/gorm` - Object-Relational Mapping (ORM) berfitur lengkap untuk Go.
* `gorm.io/driver/postgres` - Driver GORM untuk PostgreSQL.
* `github.com/joho/godotenv` - Parser file `.env` di Go.
* `github.com/gin-contrib/cors` - Middleware penanganan CORS di Gin.
