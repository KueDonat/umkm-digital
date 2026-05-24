package models

import "time"

// Product mewakili data menu makanan/produk UMKM
type Product struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	MerchantID  uint      `gorm:"index" json:"merchant_id"` // Toko UMKM penyedia menu ini
	Name        string    `gorm:"type:varchar(100);not null" json:"name"`
	Description string    `gorm:"type:text" json:"description"`
	Price       float64   `gorm:"type:decimal(15,2);not null" json:"price"`
	Stock       int       `gorm:"type:int;not null;default:0" json:"stock"`
	IsPreOrder  bool      `gorm:"type:boolean;default:false;not null" json:"is_pre_order"` // Sistem Pre-Order (PO)
	PreOrderDays int      `gorm:"type:int;default:0;not null" json:"pre_order_days"` // Lama PO dalam hari (misal: PO 2 Hari)
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
