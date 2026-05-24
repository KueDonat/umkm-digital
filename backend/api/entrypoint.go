package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/user/project-umkm/backend/config"
	"github.com/user/project-umkm/backend/routes"
)

var r *gin.Engine

func init() {
	// Initialize database only once (serverless cold start reuse)
	config.ConnectDatabase()
	r = routes.SetupRouter()
}

// Handler is the entrypoint for Vercel Serverless Functions in Go
func Handler(w http.ResponseWriter, req *http.Request) {
	r.ServeHTTP(w, req)
}
