package models

import (
	"time"
)

// ChatMessage mewakili log obrolan kurir <-> pembeli per order
type ChatMessage struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	OrderID   uint      `gorm:"not null;index" json:"order_id"` // Terikat pada order tertentu
	SenderID  uint      `gorm:"not null" json:"sender_id"` // ID pengirim pesan
	SenderName string   `gorm:"type:varchar(100)" json:"sender_name"` // Nama pengirim untuk kemudahan frontend
	Message   string    `gorm:"type:text;not null" json:"message"`
	CreatedAt time.Time `json:"created_at"`
}
