package middleware

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// GetJWTSecret mengambil kunci rahasia untuk tanda tangan JWT
func GetJWTSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "umkm_digital_platform_secret_key_2026" // Default fallback
	}
	return []byte(secret)
}

// AuthMiddleware memverifikasi validitas token JWT pada header request
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token otorisasi diperlukan (Header Authorization kosong)"})
			c.Abort()
			return
		}

		// Format token: "Bearer <token>"
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Format otorisasi tidak valid, harus menggunakan 'Bearer <token>'"})
			c.Abort()
			return
		}

		tokenStr := tokenParts[1]

		// Parse dan validasi token
		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("metode tanda tangan token tidak valid: %v", t.Header["alg"])
			}
			return GetJWTSecret(), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token kadaluarsa atau tidak valid"})
			c.Abort()
			return
		}

		// Simpan klaim data user ke dalam context Gin
		claims, ok := token.Claims.(jwt.MapClaims)
		if ok && token.Valid {
			c.Set("userID", uint(claims["user_id"].(float64)))
			c.Set("userEmail", claims["email"].(string))
			c.Set("userRole", claims["role"].(string))
			c.Set("userName", claims["name"].(string))
		}

		c.Next()
	}
}

// RoleBlockMiddleware menyaring hak akses berdasarkan peran tertentu (RBAC)
func RoleBlockMiddleware(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Ambil role user dari context yang di-set oleh AuthMiddleware
		roleVal, exists := c.Get("userRole")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak: Data peran tidak ditemukan"})
			c.Abort()
			return
		}

		userRole := roleVal.(string)
		isAllowed := false

		// Cek apakah role user ada di daftar role yang diperbolehkan
		for _, role := range allowedRoles {
			if userRole == role {
				isAllowed = true
				break
			}
		}

		if !isAllowed {
			c.JSON(http.StatusForbidden, gin.H{
				"error": fmt.Sprintf("Akses ditolak: Peran '%s' tidak memiliki wewenang untuk aksi ini", userRole),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
