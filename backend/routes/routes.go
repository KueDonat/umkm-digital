package routes

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/user/project-umkm/backend/controllers"
	"github.com/user/project-umkm/backend/middleware"
)

// SetupRouter mengatur routing dan middleware untuk API
func SetupRouter() *gin.Engine {
	r := gin.Default()

	// Konfigurasi CORS Middleware (mengizinkan integrasi dari Next.js & perangkat mobile)
	r.Use(cors.New(cors.Config{
		AllowAllOrigins:  true, // Mengizinkan semua origin untuk kemudahan testing web & mobile
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Route Test Awal
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Welcome to UMKM Gofood & Pre-Order API Platform!",
			"status":  "Active",
		})
	})

	// Grouping API Routes
	api := r.Group("/api")
	{
		// 1. Auth Routes (Public)
		auth := api.Group("/auth")
		{
			auth.POST("/register", controllers.Register)
			auth.POST("/login", controllers.Login)
			auth.POST("/google", controllers.GoogleLogin)
		}

		// 2. Merchant Routes (Gojek-like Multi-Merchant)
		// - Publik bisa menjelajahi toko & melihat menu makanan
		api.GET("/merchants", controllers.GetAllMerchants)
		api.GET("/merchants/:id/products", controllers.GetMerchantProducts)

		// - Pendaftaran & pengecekan toko UMKM oleh Penjual
		merchantAdmin := api.Group("/merchants")
		merchantAdmin.Use(middleware.AuthMiddleware())
		merchantAdmin.Use(middleware.RoleBlockMiddleware("penjual"))
		{
			merchantAdmin.POST("", controllers.RegisterMerchant)
			merchantAdmin.GET("/my", controllers.GetMyMerchant)
			merchantAdmin.PUT("/my", controllers.UpdateMyMerchant)
		}

		// 3. Product Routes (Mix Public & Protected)
		// - Mengambil semua produk secara global
		api.GET("/products", controllers.GetProducts)
		api.GET("/products/:id", controllers.GetProduct)

		// - Modifikasi produk HANYA boleh dilakukan oleh penjual terdaftar
		productAdmin := api.Group("/products")
		productAdmin.Use(middleware.AuthMiddleware())
		productAdmin.Use(middleware.RoleBlockMiddleware("penjual"))
		{
			productAdmin.POST("", controllers.CreateProduct)
			productAdmin.PUT("/:id", controllers.UpdateProduct)
			productAdmin.DELETE("/:id", controllers.DeleteProduct)
		}

		// 4. Order & Transactional Routes (Protected JWT for Pembeli, Penjual & Kurir)
		orders := api.Group("/orders")
		orders.Use(middleware.AuthMiddleware())
		{
			orders.POST("", controllers.CreateOrder)          // Buyer checkout
			orders.GET("", controllers.GetOrders)            // Dynamic role query
			orders.PUT("/:id/status", controllers.UpdateOrderStatus) // Seller approve / Courier pick/deliver
			orders.POST("/:id/chat", controllers.SendChatMessage)   // Send message
			orders.GET("/:id/chat", controllers.GetChatHistory)     // Get chat history
			orders.POST("/:id/rate", controllers.RateOrder)        // Submit rating/review
		}
	}

	return r
}
