package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/user/project-umkm/backend/config"
	"github.com/user/project-umkm/backend/models"
)

// OrderInput mendefinisikan skema JSON saat checkout pesanan
type OrderInput struct {
	MerchantID      uint    `json:"merchant_id" binding:"required"`
	TotalPrice      float64 `json:"total_price" binding:"required"`
	ShippingAddress string  `json:"shipping_address" binding:"required"`
	Notes           string  `json:"notes"`
	Toppings        string  `json:"toppings"`
	Tax             float64 `json:"tax"`
	DeliveryFee     float64 `json:"delivery_fee"`
	AppFee          float64 `json:"app_fee"`
}

// RateOrderInput mendefinisikan skema input rating dari pengguna
type RateOrderInput struct {
	MerchantRating int    `json:"merchant_rating"`
	MerchantReview string `json:"merchant_review"`
	CourierRating  int    `json:"courier_rating"`
	BuyerRating    int    `json:"buyer_rating"`
}

// UpdateStatusInput mendefinisikan skema input untuk mengubah status pesanan
type UpdateStatusInput struct {
	Status          string `json:"status" binding:"required"`
	ProofOfDelivery string `json:"proof_of_delivery"` // Foto bukti pengantaran (Wajib untuk status 'selesai')
}

// CreateOrder membuat pesanan baru dari Pembeli ke Dapur UMKM (Status Awal: pending)
func CreateOrder(c *gin.Context) {
	userIDVal, _ := c.Get("userID")
	buyerID := userIDVal.(uint)

	var input OrderInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Cari Merchant untuk mencari OwnerID (SellerID)
	var merchant models.Merchant
	if err := config.DB.First(&merchant, input.MerchantID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Dapur UMKM tidak ditemukan!"})
		return
	}

	newOrder := models.Order{
		BuyerID:         buyerID,
		SellerID:        merchant.OwnerID, // Pemilik dapur adalah penjualnya
		TotalPrice:      input.TotalPrice,
		ShippingAddress: input.ShippingAddress,
		Notes:           input.Notes,
		Toppings:        input.Toppings,
		Tax:             input.Tax,
		DeliveryFee:     input.DeliveryFee,
		AppFee:          input.AppFee,
		Status:          "pending", // Menunggu konfirmasi penjual
	}

	if err := config.DB.Create(&newOrder).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memproses pesanan"})
		return
	}

	c.JSON(http.StatusCreated, newOrder)
}

// GetOrders mengambil daftar pesanan dinamis berdasarkan Role pengguna yang login
func GetOrders(c *gin.Context) {
	userIDVal, _ := c.Get("userID")
	userID := userIDVal.(uint)

	roleVal, _ := c.Get("userRole")
	userRole := roleVal.(string)

	var orders []models.Order

	if userRole == "pembeli" {
		// Pembeli melihat riwayat belanja miliknya
		if err := config.DB.Where("buyer_id = ?", userID).Order("id desc").Find(&orders).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data pesanan"})
			return
		}
	} else if userRole == "penjual" {
		// Penjual melihat pesanan masuk ke tokonya
		if err := config.DB.Where("seller_id = ?", userID).Order("id desc").Find(&orders).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil pesanan masuk"})
			return
		}
	} else if userRole == "kurir" {
		// Kurir melihat tugas pengiriman yang siap diambil (diproses), sedang diantar, atau sudah diselesaikan olehnya
		if err := config.DB.Where("status = ? OR (courier_id = ? AND (status = ? OR status = ?))", "diproses", userID, "dikirim", "selesai").Order("id desc").Find(&orders).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil tugas kurir"})
			return
		}
	} else {
		// Distributor / role lain
		if err := config.DB.Order("id desc").Find(&orders).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data"})
			return
		}
	}

	c.JSON(http.StatusOK, orders)
}

// UpdateOrderStatus memperbarui status pesanan (Konfirmasi Penjual, Diambil Kurir, Sampai)
func UpdateOrderStatus(c *gin.Context) {
	userIDVal, _ := c.Get("userID")
	userID := userIDVal.(uint)

	roleVal, _ := c.Get("userRole")
	userRole := roleVal.(string)

	orderIDStr := c.Param("id")
	orderID, err := strconv.Atoi(orderIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID tidak valid"})
		return
	}

	var order models.Order
	if err := config.DB.First(&order, orderID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pesanan tidak ditemukan"})
		return
	}

	var input UpdateStatusInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ALUR HAK AKSES TRANSISI STATUS:
	if userRole == "penjual" {
		// Penjual HANYA bisa menyetujui pesanan pending miliknya menjadi "diproses"
		if order.SellerID != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak: Ini bukan pesanan toko Anda"})
			return
		}
		if input.Status != "diproses" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Penjual hanya dapat menyetujui pesanan ('diproses')"})
			return
		}
		order.Status = "diproses"

	} else if userRole == "kurir" {
		// Kurir bisa mengambil tugas ("dikirim") atau menyelesaikannya ("selesai")
		if input.Status == "dikirim" {
			// Kurir mengambil tugas pengantaran terdekat
			if order.Status != "diproses" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Pesanan belum siap atau sudah diambil kurir lain"})
				return
			}
			order.CourierID = &userID
			order.Status = "dikirim"
		} else if input.Status == "selesai" {
			// Kurir menyelesaikan pengantaran
			if order.CourierID == nil || *order.CourierID != userID {
				c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak: Anda bukan kurir pengantar paket ini"})
				return
			}
			// KELAS PREMIUM: Wajib melampirkan foto bukti pengantaran
			if input.ProofOfDelivery == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Wajib melampirkan foto bukti pengantaran sebagai konfirmasi paket sampai!"})
				return
			}
			order.ProofOfDelivery = input.ProofOfDelivery
			order.Status = "selesai"
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Status kurir tidak valid"})
			return
		}
	} else {
		c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak untuk peran Anda!"})
		return
	}

	// Simpan perubahan status
	if err := config.DB.Save(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui status pesanan"})
		return
	}

	c.JSON(http.StatusOK, order)
}

// RateOrder menyimpan penilaian kurir, resto, pembeli, dan ulasan pembeli
func RateOrder(c *gin.Context) {
	orderIDStr := c.Param("id")
	orderID, _ := strconv.Atoi(orderIDStr)

	var input RateOrderInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var order models.Order
	if err := config.DB.First(&order, orderID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pesanan tidak ditemukan"})
		return
	}

	// Simpan data rating
	if input.MerchantRating > 0 {
		order.MerchantRating = input.MerchantRating
	}
	if input.MerchantReview != "" {
		order.MerchantReview = input.MerchantReview
	}
	if input.CourierRating > 0 {
		order.CourierRating = input.CourierRating
	}
	if input.BuyerRating > 0 {
		order.BuyerRating = input.BuyerRating
	}

	if err := config.DB.Save(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan data penilaian"})
		return
	}

	c.JSON(http.StatusOK, order)
}
