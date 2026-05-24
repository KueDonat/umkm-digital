package models

import (
	"time"
)

// Order mewakili transaksi pesanan barang dagangan
type Order struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	BuyerID         uint      `gorm:"not null" json:"buyer_id"`
	SellerID        uint      `gorm:"not null" json:"seller_id"`
	CourierID       *uint     `gorm:"default:null" json:"courier_id"` // Nullable jika belum ditugaskan
	TotalPrice      float64   `gorm:"type:decimal(15,2);not null" json:"total_price"`
	Status          string    `gorm:"type:varchar(20);not null;default:'pending'" json:"status"` // pending, diproses, dikirim, selesai
	ShippingAddress string    `gorm:"type:text;not null" json:"shipping_address"`
	ProofOfDelivery string    `gorm:"type:text" json:"proof_of_delivery"` // Foto bukti pengiriman oleh Kurir (URL/Base64)
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}
