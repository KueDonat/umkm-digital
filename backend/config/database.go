package config

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/user/project-umkm/backend/models"
)

// DB adalah instance database global
var DB *gorm.DB

// ConnectDatabase menginisialisasi koneksi PostgreSQL menggunakan GORM
func ConnectDatabase() {
	// Load file .env jika ada
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: File .env tidak ditemukan, menggunakan environment system")
	}

	// Ambil variabel environment
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")
	sslmode := os.Getenv("DB_SSLMODE")
	timezone := os.Getenv("DB_TIMEZONE")

	// Format DSN (Data Source Name) untuk PostgreSQL
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=%s",
		host, user, password, dbname, port, sslmode, timezone)

	// Koneksi ke Database
	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		log.Fatal("Gagal terhubung ke database: ", err)
	}

	log.Println("Berhasil terhubung ke database PostgreSQL!")

	// Auto Migration untuk semua model
	err = database.AutoMigrate(&models.Product{}, &models.User{}, &models.Order{}, &models.SupplyOrder{}, &models.Merchant{}, &models.ChatMessage{})
	if err != nil {
		log.Println("Gagal melakukan migrasi database: ", err)
	} else {
		log.Println("Migrasi database berhasil diselesaikan!")
	}

	DB = database
}
