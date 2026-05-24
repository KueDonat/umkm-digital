package models

import (
	"time"
)

// Merchant mewakili badan usaha atau toko UMKM kuliner
type Merchant struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	OwnerID     uint      `gorm:"uniqueIndex;not null" json:"owner_id"` // Satu penjual hanya bisa memiliki satu toko UMKM
	Name        string    `gorm:"type:varchar(100);not null" json:"name"` // Nama UMKM / Toko
	Address     string    `gorm:"type:text;not null" json:"address"` // Alamat Toko / Dapur
	Category    string    `gorm:"type:varchar(50);not null;default:'Kuliner'" json:"category"` // Kuliner, Camilan, dll
	Description string    `gorm:"type:text" json:"description"`
	ImageURL    string    `gorm:"type:text" json:"image_url"` // URL/Base64 Foto Restoran kustom
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
