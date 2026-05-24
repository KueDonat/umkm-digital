package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/user/project-umkm/backend/config"
	"github.com/user/project-umkm/backend/models"
)

// MerchantInput mendefinisikan skema JSON pendaftaran toko UMKM
type MerchantInput struct {
	Name        string `json:"name" binding:"required"`
	Address     string `json:"address" binding:"required"`
	Category    string `json:"category" binding:"required"`
	Description string `json:"description"`
}

// RegisterMerchant menangani pendaftaran profil toko UMKM baru oleh Penjual
func RegisterMerchant(c *gin.Context) {
	// Ambil userID dari context JWT
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Otorisasi diperlukan!"})
		return
	}
	userID := userIDVal.(uint)

	// Pastikan user belum terdaftar memiliki toko UMKM
	var existingMerchant models.Merchant
	if err := config.DB.Where("owner_id = ?", userID).First(&existingMerchant).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Anda sudah memiliki profil toko UMKM terdaftar!"})
		return
	}

	var input MerchantInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	newMerchant := models.Merchant{
		OwnerID:     userID,
		Name:        input.Name,
		Address:     input.Address,
		Category:    input.Category,
		Description: input.Description,
	}

	if err := config.DB.Create(&newMerchant).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan profil UMKM"})
		return
	}

	c.JSON(http.StatusCreated, newMerchant)
}

// GetMyMerchant mengambil profil UMKM penjual yang sedang login
func GetMyMerchant(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Otorisasi diperlukan!"})
		return
	}
	userID := userIDVal.(uint)

	var merchant models.Merchant
	if err := config.DB.Where("owner_id = ?", userID).First(&merchant).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Toko UMKM belum didaftarkan!"})
		return
	}

	c.JSON(http.StatusOK, merchant)
}

// GetAllMerchants mengambil semua merchant UMKM terdaftar (Gofood-like list)
func GetAllMerchants(c *gin.Context) {
	var merchants []models.Merchant
	if err := config.DB.Find(&merchants).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil daftar merchant"})
		return
	}
	c.JSON(http.StatusOK, merchants)
}

// GetMerchantProducts mengambil semua menu produk kuliner dari merchant tertentu
func GetMerchantProducts(c *gin.Context) {
	merchantID := c.Param("id")
	var products []models.Product

	if err := config.DB.Where("merchant_id = ?", merchantID).Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil daftar menu produk"})
		return
	}

	c.JSON(http.StatusOK, products)
}
