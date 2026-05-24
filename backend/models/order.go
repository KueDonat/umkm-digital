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
	ProofOfDelivery string    `gorm:"type:text" json:"proof_of_delivery"` // Foto bukti pengiriman oleh Kurir
	Notes           string    `gorm:"type:text" json:"notes"`                 // Catatan untuk penjual
	Toppings        string    `gorm:"type:text" json:"toppings"`              // Pilihan topping/isi makanan
	Tax             float64   `gorm:"type:decimal(15,2);default:0" json:"tax"` // Pajak PPN 11%
	DeliveryFee     float64   `gorm:"type:decimal(15,2);default:0" json:"delivery_fee"` // Ongkos kirim
	AppFee          float64   `gorm:"type:decimal(15,2);default:0" json:"app_fee"` // Biaya aplikasi 2%
	MerchantRating  int       `gorm:"default:0" json:"merchant_rating"`       // Rating Resto (1-5)
	MerchantReview  string    `gorm:"type:text" json:"merchant_review"`       // Ulasan Resto
	CourierRating   int       `gorm:"default:0" json:"courier_rating"`        // Rating Kurir (1-5)
	BuyerRating     int       `gorm:"default:0" json:"buyer_rating"`          // Rating Pembeli oleh Kurir (1-5)
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}
