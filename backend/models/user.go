package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
)

// User mewakili entitas pengguna sistem multi-role
type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"type:varchar(100);not null" json:"name"`
	Email     string    `gorm:"type:varchar(100);uniqueIndex;not null" json:"email"`
	Password  string    `gorm:"type:varchar(255);not null" json:"-"` // Disembunyikan dari JSON response
	Role      string    `gorm:"type:varchar(20);not null;default:'pembeli'" json:"role"` // penjual, pembeli, kurir, distributor
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// HashPassword mengenkripsi kata sandi pengguna sebelum disimpan ke database
func (u *User) HashPassword() error {
	bytes, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(bytes)
	return nil
}

// ComparePassword memvalidasi apakah kata sandi yang diinput cocok dengan hash di database
func (u *User) ComparePassword(providedPassword string) error {
	return bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(providedPassword))
}
