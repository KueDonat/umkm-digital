package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/user/project-umkm/backend/config"
	"github.com/user/project-umkm/backend/models"
)

// GetProducts mengambil semua data produk secara global
func GetProducts(c *gin.Context) {
	var products []models.Product
	if err := config.DB.Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data produk"})
		return
	}
	c.JSON(http.StatusOK, products)
}

// GetProduct mengambil satu produk berdasarkan ID
func GetProduct(c *gin.Context) {
	id := c.Param("id")
	var product models.Product

	if err := config.DB.First(&product, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Produk tidak ditemukan"})
		return
	}
	c.JSON(http.StatusOK, product)
}

// CreateProduct membuat produk baru dan otomatis mengaitkan dengan toko UMKM penjual
func CreateProduct(c *gin.Context) {
	// 1. Ambil userID dari context JWT yang login
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Otorisasi diperlukan!"})
		return
	}
	userID := userIDVal.(uint)

	// 2. Cari toko UMKM milik penjual ini
	var merchant models.Merchant
	if err := config.DB.Where("owner_id = ?", userID).First(&merchant).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Anda wajib mendaftarkan Toko UMKM terlebih dahulu!"})
		return
	}

	var input models.Product
	// Validasi input JSON
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 3. Otomatis pasangkan MerchantID berdasarkan toko milik penjual yang login (Aman!)
	input.MerchantID = merchant.ID

	// Simpan produk ke database
	if err := config.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat produk baru"})
		return
	}

	c.JSON(http.StatusCreated, input)
}

// UpdateProduct mengubah menu produk yang sudah ada (Diproteksi kepemilikan toko)
func UpdateProduct(c *gin.Context) {
	userIDVal, _ := c.Get("userID")
	userID := userIDVal.(uint)

	// Cari toko UMKM milik penjual yang sedang login
	var merchant models.Merchant
	if err := config.DB.Where("owner_id = ?", userID).First(&merchant).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak: Profil toko Anda tidak ditemukan"})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID tidak valid"})
		return
	}

	// Cari produk yang ingin diedit
	var product models.Product
	if err := config.DB.First(&product, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Produk tidak ditemukan"})
		return
	}

	// SECURITY CHECK: Pastikan produk ini benar-benar milik toko penjual ini
	if product.MerchantID != merchant.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak: Anda tidak berwenang mengedit produk milik toko lain!"})
		return
	}

	var input models.Product
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update data produk
	product.Name = input.Name
	product.Description = input.Description
	product.Price = input.Price
	product.Stock = input.Stock
	product.IsPreOrder = input.IsPreOrder
	product.PreOrderDays = input.PreOrderDays
	product.ImageURL = input.ImageURL

	if err := config.DB.Save(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui produk"})
		return
	}

	c.JSON(http.StatusOK, product)
}

// DeleteProduct menghapus produk berdasarkan ID (Diproteksi kepemilikan toko)
func DeleteProduct(c *gin.Context) {
	userIDVal, _ := c.Get("userID")
	userID := userIDVal.(uint)

	// Cari toko UMKM milik penjual yang sedang login
	var merchant models.Merchant
	if err := config.DB.Where("owner_id = ?", userID).First(&merchant).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak: Profil toko Anda tidak ditemukan"})
		return
	}

	id := c.Param("id")
	var product models.Product

	// Cari produk yang ingin dihapus
	if err := config.DB.First(&product, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Produk tidak ditemukan"})
		return
	}

	// SECURITY CHECK: Pastikan produk ini benar-benar milik toko penjual ini
	if product.MerchantID != merchant.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak: Anda tidak berwenang menghapus produk milik toko lain!"})
		return
	}

	if err := config.DB.Delete(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus produk"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Produk berhasil dihapus"})
}
