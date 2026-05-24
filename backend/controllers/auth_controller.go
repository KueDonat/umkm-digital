package controllers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/user/project-umkm/backend/config"
	"github.com/user/project-umkm/backend/middleware"
	"github.com/user/project-umkm/backend/models"
)

// RegisterInput mendefinisikan skema input registrasi user baru
type RegisterInput struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Role     string `json:"role" binding:"required,oneof=penjual pembeli kurir distributor"`
}

// LoginInput mendefinisikan skema input masuk sistem
type LoginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// Register menangani pendaftaran pengguna baru ke sistem
func Register(c *gin.Context) {
	var input RegisterInput

	// Validasi input JSON
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Cek apakah email sudah terdaftar
	var existingUser models.User
	if err := config.DB.Where("email = ?", input.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email sudah terdaftar di sistem!"})
		return
	}

	// Buat entitas user
	newUser := models.User{
		Name:     input.Name,
		Email:    input.Email,
		Password: input.Password,
		Role:     input.Role,
	}

	// Hash password menggunakan bcrypt helper
	if err := newUser.HashPassword(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengenkripsi kata sandi"})
		return
	}

	// Simpan ke database
	if err := config.DB.Create(&newUser).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan akun pengguna"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Registrasi pengguna berhasil diselesaikan!",
		"user":    newUser,
	})
}

// Login menangani autentikasi akun pengguna dan memberikan token JWT
func Login(c *gin.Context) {
	var input LoginInput

	// Validasi input JSON
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Cari user berdasarkan email
	var user models.User
	if err := config.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email atau kata sandi Anda salah!"})
		return
	}

	// Verifikasi password
	if err := user.ComparePassword(input.Password); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email atau kata sandi Anda salah!"})
		return
	}

	// Generate JWT Token
	tokenClaims := jwt.MapClaims{
		"user_id": user.ID,
		"name":    user.Name,
		"email":   user.Email,
		"role":    user.Role,
		"exp":     time.Now().Add(24 * time.Hour).Unix(), // Aktif selama 24 jam
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, tokenClaims)
	tokenString, err := token.SignedString(middleware.GetJWTSecret())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghasilkan token otentikasi"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Autentikasi masuk sistem sukses!",
		"token":   tokenString,
		"user": gin.H{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role,
		},
	})
}

// GoogleLoginInput mendefinisikan input untuk login via Google
type GoogleLoginInput struct {
	Email string `json:"email" binding:"required,email"`
	Name  string `json:"name" binding:"required"`
	Role  string `json:"role" binding:"required,oneof=penjual pembeli kurir distributor"`
}

// GoogleLogin menangani login/registrasi instan via Google
func GoogleLogin(c *gin.Context) {
	var input GoogleLoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	err := config.DB.Where("email = ?", input.Email).First(&user).Error
	if err != nil {
		// User belum terdaftar, lakukan registrasi instan
		newUser := models.User{
			Name:     input.Name,
			Email:    input.Email,
			Password: "GoogleOAuthSecureBypassPass123!", // Dummy password
			Role:     input.Role,
		}

		if err := newUser.HashPassword(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengenkripsi kata sandi"})
			return
		}

		if err := config.DB.Create(&newUser).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mendaftarkan akun Google baru"})
			return
		}
		user = newUser
	}

	// Generate JWT Token
	tokenClaims := jwt.MapClaims{
		"user_id": user.ID,
		"name":    user.Name,
		"email":   user.Email,
		"role":    user.Role,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, tokenClaims)
	tokenString, err := token.SignedString(middleware.GetJWTSecret())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghasilkan token otentikasi"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Autentikasi masuk sistem via Google sukses!",
		"token":   tokenString,
		"user": gin.H{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role,
		},
	})
}

