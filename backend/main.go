package main

import (
	"log"
	"os"

	"github.com/user/project-umkm/backend/config"
	"github.com/user/project-umkm/backend/routes"
)

func main() {
	// 1. Hubungkan ke database PostgreSQL
	config.ConnectDatabase()

	// 2. Setup Router
	r := routes.SetupRouter()

	// 3. Tentukan port backend
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// 4. Jalankan Server
	log.Printf("Server backend UMKM berjalan di port %s...", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Gagal menjalankan server: ", err)
	}
}
