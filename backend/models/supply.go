package models

import (
	"time"
)

// SupplyOrder mewakili transaksi pesanan bahan baku dari penjual ke distributor
type SupplyOrder struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	SellerID      uint      `gorm:"not null" json:"seller_id"`
	DistributorID uint      `gorm:"not null" json:"distributor_id"`
	MaterialName  string    `gorm:"type:varchar(100);not null" json:"material_name"` // misal: "Tepung Terigu", "Gula Pasir"
	Quantity      int       `gorm:"not null" json:"quantity"`
	Price         float64   `gorm:"type:decimal(15,2);not null" json:"price"`
	Status        string    `gorm:"type:varchar(20);not null;default:'diajukan'" json:"status"` // diajukan, dikirim, diterima
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
