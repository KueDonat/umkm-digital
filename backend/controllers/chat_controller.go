package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/user/project-umkm/backend/config"
	"github.com/user/project-umkm/backend/models"
)

// ChatInput mendefinisikan skema JSON untuk mengirim pesan
type ChatInput struct {
	Message string `json:"message" binding:"required"`
}

// SendChatMessage menangani pengiriman pesan obrolan terikat pada order pengiriman
func SendChatMessage(c *gin.Context) {
	userIDVal, _ := c.Get("userID")
	userID := userIDVal.(uint)

	userNameVal, _ := c.Get("userName")
	userName := userNameVal.(string)

	orderIDStr := c.Param("id")
	orderID, err := strconv.Atoi(orderIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID Pesanan tidak valid"})
		return
	}

	// Cari pesanan untuk memvalidasi hak akses kurir/pembeli
	var order models.Order
	if err := config.DB.First(&order, orderID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pesanan tidak ditemukan"})
		return
	}

	// SECURITY CHECK: Pastikan pengirim adalah Pembeli atau Kurir yang terikat dengan order ini
	if order.BuyerID != userID && (order.CourierID == nil || *order.CourierID != userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak: Anda tidak terlibat dalam pesanan ini!"})
		return
	}

	var input ChatInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	newMessage := models.ChatMessage{
		OrderID:    uint(orderID),
		SenderID:   userID,
		SenderName: userName,
		Message:    input.Message,
	}

	if err := config.DB.Create(&newMessage).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan pesan"})
		return
	}

	c.JSON(http.StatusCreated, newMessage)
}

// GetChatHistory mengambil seluruh log obrolan untuk suatu pesanan
func GetChatHistory(c *gin.Context) {
	userIDVal, _ := c.Get("userID")
	userID := userIDVal.(uint)

	orderIDStr := c.Param("id")
	orderID, err := strconv.Atoi(orderIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID Pesanan tidak valid"})
		return
	}

	// Cari pesanan untuk memvalidasi hak akses
	var order models.Order
	if err := config.DB.First(&order, orderID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pesanan tidak ditemukan"})
		return
	}

	// SECURITY CHECK: Hanya pembeli, penjual, atau kurir yang terikat yang boleh melihat obrolan ini
	if order.BuyerID != userID && order.SellerID != userID && (order.CourierID == nil || *order.CourierID != userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak: Anda tidak berwenang melihat obrolan ini!"})
		return
	}

	var messages []models.ChatMessage
	if err := config.DB.Where("order_id = ?", orderID).Order("created_at asc").Find(&messages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil log obrolan"})
		return
	}

	c.JSON(http.StatusOK, messages)
}
