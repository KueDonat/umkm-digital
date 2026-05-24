"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  CheckCircle,
  XCircle,
  RefreshCw,
  User,
  ShoppingBag,
  TrendingUp,
  Package,
  Truck,
  Database,
  Search,
  ShoppingCart,
  Plus,
  Trash2,
  Lock,
  AlertTriangle,
  Mail,
  UserPlus,
  LogOut,
  Sparkles,
  MapPin,
  Store,
  ChevronLeft,
  Clock,
  Check,
  Bell,
  MessageSquare,
  Camera,
  X,
  Send,
  Image,
} from "lucide-react";

// Tipe Data
interface Merchant {
  id: number;
  name: string;
  address: string;
  category: string;
  description: string;
}

interface Product {
  id: number;
  merchant_id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  is_pre_order: boolean;
  pre_order_days: number;
}

interface Order {
  id: number;
  buyer_id: number;
  seller_id: number;
  courier_id: number | null;
  total_price: number;
  status: "pending" | "diproses" | "dikirim" | "selesai";
  shipping_address: string;
  proof_of_delivery: string;
  created_at: string;
}

interface ChatMessage {
  id: number;
  order_id: number;
  sender_id: number;
  sender_name: string;
  message: string;
  created_at: string;
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: "penjual" | "pembeli" | "kurir" | "distributor";
}

// Preset Bukti Foto Pengiriman Premium (Base64 Mocks untuk Kemudahan Simulasi Mobile/Web)
const MOCK_POD_PHOTOS = [
  { name: "Paket diterima di pagar", url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=300" },
  { name: "Diserahkan langsung ke Pembeli", url: "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&q=80&w=300" },
  { name: "Paket digantung di gagang pintu", url: "https://images.unsplash.com/photo-1590247813693-5541d1c609fd?auto=format&fit=crop&q=80&w=300" },
];

export default function SecureMultiplatformPlatform() {
  // Status Koneksi API
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  // Status Autentikasi
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Inputs Form Auth
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authRole, setAuthRole] = useState<"penjual" | "pembeli" | "kurir" | "distributor">("pembeli");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // States Data Utama
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [loadingMerchants, setLoadingMerchants] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // States Transaksi
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // States Toko Penjual
  const [myMerchant, setMyMerchant] = useState<Merchant | null>(null);
  const [isCheckingMerchant, setIsCheckingMerchant] = useState(false);

  // Form Registrasi Toko UMKM
  const [regStoreName, setRegStoreName] = useState("");
  const [regStoreCategory, setRegStoreCategory] = useState("Kuliner Makanan");
  const [regStoreAddress, setRegStoreAddress] = useState("");
  const [regStoreDesc, setRegStoreDesc] = useState("");
  const [regStoreError, setRegStoreError] = useState("");
  const [regStoreLoading, setRegStoreLoading] = useState(false);

  // Form Input Menu (Penjual)
  const [newMenuName, setNewMenuName] = useState("");
  const [newMenuDesc, setNewMenuDesc] = useState("");
  const [newMenuPrice, setNewMenuPrice] = useState("");
  const [newMenuStock, setNewMenuStock] = useState("");
  const [newMenuIsPO, setNewMenuIsPO] = useState(false);
  const [newMenuPODays, setNewMenuPODays] = useState("2");
  const [menuError, setMenuError] = useState("");
  const [menuLoading, setMenuLoading] = useState(false);

  // States Pembeli / E-Commerce (GoFood)
  const [searchStoreQuery, setSearchStoreQuery] = useState("");
  const [cart, setCart] = useState<{ product: Product; qty: number }[]>([]);
  const [shippingAddress, setShippingAddress] = useState("");

  // ==================== A. STATES BARU FITUR POD & LIVE-CHAT ====================
  // 1. Proof of Delivery (POD) Modal Kurir
  const [activePodOrder, setActivePodOrder] = useState<Order | null>(null);
  const [selectedPodPhoto, setSelectedPodPhoto] = useState(MOCK_POD_PHOTOS[0].url);
  const [customPodPhotoUrl, setCustomPodPhotoUrl] = useState("");
  const [podError, setPodError] = useState("");

  // 2. Buyer Photo Preview Modal
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // 3. Live Chat Modal/Drawer Floating
  const [activeChatOrder, setActiveChatOrder] = useState<Order | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatMessage, setNewChatMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // 4. Google Login Simulation States
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleRole, setGoogleRole] = useState<"penjual" | "pembeli" | "kurir">("pembeli");
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  const [customGoogleName, setCustomGoogleName] = useState("");
  const [googleError, setGoogleError] = useState("");
  const [googleClientId, setGoogleClientId] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("google_client_id") || "";
    }
    return "";
  });
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);
  const [isMobileFlow, setIsMobileFlow] = useState(false);
  const [isRawIp, setIsRawIp] = useState(false);
  const [gpsProgress, setGpsProgress] = useState<Record<number, number>>({});

  const API_URL = typeof window !== "undefined" ? `http://${window.location.hostname}:8080/api` : "http://localhost:8080/api";
  const BACKEND_BASE = typeof window !== "undefined" ? `http://${window.location.hostname}:8080` : "http://localhost:8080";
  const DEFAULT_CLIENT_ID = "942189841866-lk7pi6eilk9i10km1er57voe1360bfq4.apps.googleusercontent.com";

  const checkApi = async () => {
    try {
      const res = await fetch(BACKEND_BASE, { signal: AbortSignal.timeout(1500) });
      setApiOnline(res.ok);
    } catch {
      setApiOnline(false);
    }
  };

  useEffect(() => {
    checkApi();
    const savedToken = localStorage.getItem("jwt_token");
    const savedUser = localStorage.getItem("user_profile");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Detect mobile deep-link flow from search params and raw IP origin
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      const isIp = /^[0-9.]+$/.test(hostname) && hostname !== "127.0.0.1";
      setIsRawIp(isIp);

      const params = new URLSearchParams(window.location.search);
      const source = params.get("source");
      const role = params.get("role");
      if (source === "mobile") {
        setIsMobileFlow(true);
        if (role) {
          setGoogleRole(role as any);
        }
        // Automatically trigger Google Modal popup to make it friction-free!
        setShowGoogleModal(true);
      }
    }
  }, []);

  // Load Google Identity Services script dynamically
  useEffect(() => {
    if (typeof window !== "undefined") {
      if ((window as any).google) {
        setGoogleScriptLoaded(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setGoogleScriptLoaded(true);
      };
      document.body.appendChild(script);
      return () => {
        try {
          document.body.removeChild(script);
        } catch (e) {
          // ignore
        }
      };
    }
  }, []);

  // Initialize and Render Real Google Sign-In Button when Client ID is set
  useEffect(() => {
    const clientId = googleClientId || DEFAULT_CLIENT_ID;
    if (showGoogleModal && clientId && typeof window !== "undefined" && (window as any).google) {
      try {
        if (googleClientId) {
          localStorage.setItem("google_client_id", googleClientId);
        }
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            try {
              const base64Url = response.credential.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
              }).join(''));
              const decoded = JSON.parse(jsonPayload);
              if (decoded && decoded.email) {
                handleGoogleLoginSubmit(decoded.email, decoded.name || "Google User");
              }
            } catch (e) {
              setGoogleError("Gagal membaca respon Google.");
            }
          }
        });

        // Render the official Google Sign-In button
        setTimeout(() => {
          const btnContainer = document.getElementById("google-signin-btn-container");
          if (btnContainer && (window as any).google) {
            (window as any).google.accounts.id.renderButton(
              btnContainer,
              { theme: "filled_blue", size: "large", width: 340, shape: "rectangular" }
            );
          }
        }, 150);
      } catch (err) {
        console.error("GSI Error:", err);
      }
    }
  }, [showGoogleModal, googleClientId, googleScriptLoaded]);

  // Initialize and Render Real Google Sign-In Button on the Main Login Card
  useEffect(() => {
    if (!token && typeof window !== "undefined" && (window as any).google) {
      try {
        const clientId = googleClientId || DEFAULT_CLIENT_ID;
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            try {
              const base64Url = response.credential.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
              }).join(''));
              const decoded = JSON.parse(jsonPayload);
              if (decoded && decoded.email) {
                handleGoogleLoginSubmitDirect(decoded.email, decoded.name || "Google User");
              }
            } catch (e) {
              setAuthError("Gagal membaca respon Google.");
            }
          }
        });

        // Render the official Google Sign-In button on the main card
        setTimeout(() => {
          const btnContainer = document.getElementById("google-main-signin-btn");
          if (btnContainer && (window as any).google) {
            (window as any).google.accounts.id.renderButton(
              btnContainer,
              { theme: "filled_blue", size: "large", width: 340, shape: "rectangular" }
            );
          }
        }, 300);
      } catch (err) {
        console.error("GSI Main Button Error:", err);
      }
    }
  }, [token, googleClientId, googleScriptLoaded]);

  useEffect(() => {
    if (token) {
      if (user?.role === "penjual") {
        checkMyMerchantProfile();
        fetchRoleOrders();
      } else if (user?.role === "pembeli") {
        fetchAllMerchants();
        fetchRoleOrders();
      } else if (user?.role === "kurir") {
        fetchRoleOrders();
        fetchAllMerchants();
      }
    }
  }, [token, user]);

  // LIVE-POLLING CHAT & ORDERS: Otomatis memicu update data chat dan status order berkala
  useEffect(() => {
    if (!token) return;

    // Polling daftar order setiap 8 detik
    const orderInterval = setInterval(fetchRoleOrders, 8000);

    return () => {
      clearInterval(orderInterval);
    };
  }, [token]);

  // Simulasi GPS Live Tracking Kurir
  useEffect(() => {
    if (!token) return;
    
    const interval = setInterval(() => {
      setGpsProgress(prev => {
        const next = { ...prev };
        orders.forEach(o => {
          if (o.status === "dikirim") {
            const current = prev[o.id] || 0.05;
            if (current < 0.95) {
              next[o.id] = parseFloat((current + 0.045).toFixed(3));
            } else {
              next[o.id] = 0.95; // Arrived at destination
            }
          }
        });
        return next;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [token, orders]);

  // Polling Pesan Chat setiap 3 detik jika box chat sedang dibuka (Live Simulation!)
  useEffect(() => {
    if (!token || !activeChatOrder) return;

    fetchChatMessages(activeChatOrder.id);
    const chatInterval = setInterval(() => {
      fetchChatMessages(activeChatOrder.id);
    }, 3000);

    return () => clearInterval(chatInterval);
  }, [token, activeChatOrder]);

  // PROFILE & MERCHANTS FETCHES
  const checkMyMerchantProfile = async () => {
    if (!token) return;
    setIsCheckingMerchant(true);
    try {
      const res = await fetch(`${API_URL}/merchants/my`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMyMerchant(data);
        fetchMyProducts(data.id);
      } else {
        setMyMerchant(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCheckingMerchant(false);
    }
  };

  const fetchMyProducts = async (merchantId: number) => {
    try {
      const res = await fetch(`${API_URL}/merchants/${merchantId}/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRegisterStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegStoreError("");
    if (!regStoreName || !regStoreAddress) {
      setRegStoreError("Nama Toko & Alamat Dapur wajib diisi!");
      return;
    }

    setRegStoreLoading(true);
    try {
      const res = await fetch(`${API_URL}/merchants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: regStoreName,
          category: regStoreCategory,
          address: regStoreAddress,
          description: regStoreDesc,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMyMerchant(data);
        fetchMyProducts(data.id);
        alert("Pendaftaran Toko UMKM Anda Berhasil!");
      } else {
        setRegStoreError(data.error || "Gagal mendaftarkan toko.");
      }
    } catch (err) {
      setRegStoreError("Koneksi gagal.");
    } finally {
      setRegStoreLoading(false);
    }
  };

  const fetchAllMerchants = async () => {
    setLoadingMerchants(true);
    try {
      const res = await fetch(`${API_URL}/merchants`);
      if (res.ok) {
        const data = await res.json();
        setMerchants(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMerchants(false);
    }
  };

  const fetchMerchantProducts = async (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    setLoadingProducts(true);
    try {
      const res = await fetch(`${API_URL}/merchants/${merchant.id}/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchRoleOrders = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/orders`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // CHECKOUT & TRANSAKSI
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || !shippingAddress || !selectedMerchant) return;

    const totalPrice = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);

    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          merchant_id: selectedMerchant.id,
          total_price: totalPrice,
          shipping_address: shippingAddress,
        }),
      });

      if (res.ok) {
        alert("Pesanan sukses dikirim ke Dapur Dapur Penjual!");
        setCart([]);
        setShippingAddress("");
        fetchRoleOrders();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal checkout.");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Koneksi API gagal: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleConfirmOrder = async (orderId: number) => {
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: "diproses" }),
      });

      if (res.ok) {
        alert("Pesanan diterima! Status diubah menjadi 'Sedang Disiapkan' & Kurir terdekat akan dinotifikasi.");
        fetchRoleOrders();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAcceptDelivery = async (orderId: number) => {
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: "dikirim" }),
      });

      if (res.ok) {
        alert("Tugas diambil! Alamat dapur dan alamat penerima telah ditambahkan ke peta Anda.");
        fetchRoleOrders();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ==================== B. KONFIRMASI FOTO BUKTI PENGANTARAN (POD) KURIR ====================
  const handleOpenPodDialog = (order: Order) => {
    setActivePodOrder(order);
    setPodError("");
    setSelectedPodPhoto(MOCK_POD_PHOTOS[0].url);
    setCustomPodPhotoUrl("");
  };

  const handleCompleteDeliveryWithPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePodOrder) return;

    // Tentukan foto yang di-upload
    const photoUrl = customPodPhotoUrl ? customPodPhotoUrl : selectedPodPhoto;
    if (!photoUrl) {
      setPodError("Silakan pilih atau masukkan URL foto bukti pengiriman!");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/orders/${activePodOrder.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "selesai",
          proof_of_delivery: photoUrl
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Selesai! Bukti foto berhasil diunggah dan pengantaran sukses diselesaikan.");
        setActivePodOrder(null);
        fetchRoleOrders();
      } else {
        setPodError(data.error || "Gagal menyelesaikan antaran.");
      }
    } catch (err) {
      setPodError("Gagal terhubung ke API Server.");
    }
  };

  // ==================== C. SISTEM OBROLAN (LIVE-CHAT) COURIER <-> BUYER ====================
  const fetchChatMessages = async (orderId: number) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/chat`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatOrder || !newChatMessage.trim()) return;

    const messageText = newChatMessage.trim();
    setNewChatMessage(""); // Kosongkan input agar instan terasa cepat

    try {
      const res = await fetch(`${API_URL}/orders/${activeChatOrder.id}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ message: messageText }),
      });

      if (res.ok) {
        const msg = await res.json();
        setChatMessages([...chatMessages, msg]);
      } else {
        console.error("Gagal mengirim pesan chat.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // AUTH ACTIONS & LOGOUT
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    if (!authName || !authEmail || !authPassword) {
      setAuthError("Semua bidang wajib diisi!");
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: authName,
          email: authEmail,
          password: authPassword,
          role: authRole,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAuthSuccess("Registrasi sukses! Silakan login.");
        setIsRegisterMode(false);
        setAuthPassword("");
      } else {
        setAuthError(data.error || "Pendaftaran akun gagal!");
      }
    } catch (err) {
      console.error("Register error:", err);
      setAuthError("Koneksi API gagal: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    setAuthLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("jwt_token", data.token);
        localStorage.setItem("user_profile", JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
      } else {
        setAuthError(data.error || "Email/Password salah.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setAuthError("Koneksi gagal: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLoginSubmit = async (email: string, name: string) => {
    setGoogleError("");
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          name: name,
          role: googleRole,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("jwt_token", data.token);
        localStorage.setItem("user_profile", JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        
        // If it came from the mobile app, redirect back via deep link!
        const params = new URLSearchParams(window.location.search);
        const source = params.get("source");
        const role = params.get("role") || googleRole || "pembeli";
        if (source === "mobile" || isMobileFlow) {
          window.location.href = `umkm-app://login-success?token=${data.token}&name=${encodeURIComponent(data.user.name)}&email=${data.user.email}&role=${role}`;
          return;
        }
        setShowGoogleModal(false);
      } else {
        setGoogleError(data.error || "Gagal masuk via Google.");
      }
    } catch (err) {
      console.error("Google login submit error:", err);
      setGoogleError("Koneksi gagal: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleGoogleLoginSubmitDirect = async (email: string, name: string) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          name: name,
          role: "pembeli", // Default to pembeli for seamless customer checkout
        }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("jwt_token", data.token);
        localStorage.setItem("user_profile", JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        
        // If it came from the mobile app, redirect back via deep link!
        const params = new URLSearchParams(window.location.search);
        const source = params.get("source");
        const role = params.get("role") || googleRole || "pembeli";
        if (source === "mobile" || isMobileFlow) {
          window.location.href = `umkm-app://login-success?token=${data.token}&name=${encodeURIComponent(data.user.name)}&email=${data.user.email}&role=${role}`;
          return;
        }
      } else {
        setAuthError(data.error || "Gagal masuk via Google.");
      }
    } catch (err) {
      console.error("Google login submit direct error:", err);
      setAuthError("Koneksi gagal: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAddMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    setMenuError("");
    if (!newMenuName || !newMenuPrice || !newMenuStock) {
      setMenuError("Nama, Harga, dan Stok wajib diisi!");
      return;
    }

    setMenuLoading(true);
    try {
      const res = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newMenuName,
          description: newMenuDesc,
          price: parseFloat(newMenuPrice),
          stock: parseInt(newMenuStock),
          is_pre_order: newMenuIsPO,
          pre_order_days: newMenuIsPO ? parseInt(newMenuPODays) : 0,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setProducts([...products, data]);
        setNewMenuName("");
        setNewMenuDesc("");
        setNewMenuPrice("");
        setNewMenuStock("");
        setNewMenuIsPO(false);
        alert("Menu baru berhasil dipublikasikan!");
      } else {
        setMenuError(data.error || "Gagal mempublikasikan menu.");
      }
    } catch (err) {
      setMenuError("Gagal menghubungi server API.");
    } finally {
      setMenuLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      if (existing.qty >= product.stock && !product.is_pre_order) {
        alert("Batas stok siap saji terlampaui!");
        return;
      }
      setCart(cart.map(item => item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { product, qty: 1 }]);
    }
  };

  const filteredMerchants = merchants.filter(m =>
    m.name.toLowerCase().includes(searchStoreQuery.toLowerCase()) ||
    m.category.toLowerCase().includes(searchStoreQuery.toLowerCase())
  );

  const handleLogout = () => {
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("user_profile");
    setToken(null);
    setUser(null);
    setCart([]);
    setSelectedMerchant(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden antialiased">
      {/* Background Lights */}
      <div className="absolute top-0 left-[10%] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-[10%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[130px] pointer-events-none"></div>

      {/* Top Navbar */}
      <nav className="sticky top-0 z-20 backdrop-blur-md bg-slate-950/80 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-emerald-500 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center">
              <Store className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                UMKM DIGITAL
              </h1>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Multi-Merchant & PO System</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {token && user && (
              <div className="bg-slate-900/60 px-3.5 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2 text-xs text-slate-350 animate-fadeIn">
                <User className="h-3.5 w-3.5 text-indigo-400" />
                <span className="font-semibold">{user.name} ({user.role.toUpperCase()})</span>
              </div>
            )}

            {token && (
              <button
                onClick={handleLogout}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-800 flex items-center gap-1 transition-all"
              >
                <LogOut className="h-3.5 w-3.5" /> Keluar
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">

        {/* ==================== 1. LOGIN & REGISTER CONTAINER ==================== */}
        {!token ? (
          <div className="max-w-md mx-auto my-10 bg-slate-900/60 p-8 rounded-2xl border border-slate-850 shadow-2xl space-y-6 animate-fadeIn">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/20">
                <Lock className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-white">
                {isRegisterMode ? "Pendaftaran Akun Baru" : "Masuk Sistem UMKM DIGITAL"}
              </h2>
              <p className="text-xs text-slate-400">
                {isRegisterMode ? "Daftarkan akun kuliner Anda" : "Masukkan email & password untuk masuk"}
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-rose-500/10 text-rose-400 text-xs font-semibold rounded-xl border border-rose-500/20 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="p-3 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-xl border border-emerald-500/20">
                {authSuccess}
              </div>
            )}

            <form onSubmit={isRegisterMode ? handleRegister : handleLogin} className="space-y-4">
              {isRegisterMode && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400">NAMA LENGKAP</label>
                  <input
                    type="text"
                    placeholder="Contoh: Ani Suryani"
                    value={authName}
                    onChange={e => setAuthName(e.target.value)}
                    className="bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none w-full"
                    required
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400">EMAIL USER</label>
                <input
                  type="email"
                  placeholder="ani@email.com"
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  className="bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none w-full"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400">PASSWORD</label>
                <input
                  type="password"
                  placeholder="Min 6 karakter"
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  className="bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none w-full"
                  required
                />
              </div>

              {isRegisterMode && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400">PILIH PERAN</label>
                  <select
                    value={authRole}
                    onChange={e => setAuthRole(e.target.value as any)}
                    className="bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none w-full"
                  >
                    <option value="pembeli">Pembeli (Gofood-style catalog)</option>
                    <option value="penjual">Penjual (Daftar UMKM & Upload Menu)</option>
                    <option value="kurir">Kurir (Pengantar Go-Food)</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                {authLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : (isRegisterMode ? "Daftar Akun" : "Masuk Sistem")}
              </button>

              <div className="flex items-center my-3">
                <div className="flex-grow border-t border-slate-800/80"></div>
                <span className="mx-3 text-[9px] font-bold text-slate-500 uppercase tracking-wider">ATAU</span>
                <div className="flex-grow border-t border-slate-800/80"></div>
              </div>

              <div className="w-full flex flex-col items-center gap-2">
                {/* Official Google Button container (rendered on localhost if registered) */}
                {!isRawIp && (
                  <div id="google-main-signin-btn" className="w-full min-h-[40px] flex justify-center items-center"></div>
                )}
                
                {/* Custom Google Fallback Button shown on Local IPs / Mobile */}
                {(isRawIp || isMobileFlow) && (
                  <button
                    type="button"
                    onClick={() => {
                      setGoogleError("");
                      setShowGoogleModal(true);
                    }}
                    className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold shadow-md border border-slate-200 transition-all flex items-center justify-center gap-3 active:scale-[0.99]"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21.35,11.1H12v2.7h5.38C16.88,16.22,14.65,18,12,18c-3.31,0-6-2.69-6-6s2.69-6,6-6c1.66,0,3.14,0.67,4.24,1.76l2.1-2.1C16.51,3.84,14.42,3,12,3c-4.97,0-9,4.03-9,9s4.03,9,9,9c4.97,0,9-4.03,9-9C21,11.75,20.88,11.37,21.35,11.1z" fill="#4285F4" />
                      <path d="M12,21c4.97,0,9-4.03,9-9c0-0.65-0.12-1.25-0.35-1.9H12v2.7h5.38c-0.5,2.42-2.73,4.2-5.38,4.2c-3.31,0-6-2.69-6-6c0-0.38,0.04-0.75,0.11-1.12l-2.12-1.63C3.31,9.08,3,10.51,3,12C3,16.97,7.03,21,12,21z" fill="#34A853" />
                      <path d="M6.11,9.88C6.04,10.25,6,10.62,6,11c0,0.38,0.04,0.75,0.11,1.12l2.12,1.63C8.04,13.38,8,13.01,8,12.63c0-0.38,0.04-0.75,0.11-1.12L6.11,9.88z" fill="#FBBC05" />
                      <path d="M12,6c1.66,0,3.14,0.67,4.24,1.76l2.1-2.1C16.51,3.84,14.42,3,12,3c-4.97,0-9,4.03-9,9c0,1.49,0.31,2.92,0.86,4.23l2.12-1.63C6.04,13.38,6,13.01,6,12.63C6,7.69,8.69,6,12,6z" fill="#EA4335" />
                    </svg>
                    <span>Masuk dengan Google</span>
                  </button>
                )}
                
                {isMobileFlow && (
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = `umkm-app://login-success?token=simulated_jwt_token&name=${encodeURIComponent("lip")}&email=laestrodong@gmail.com&role=${googleRole}`;
                    }}
                    className="w-full py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-[11px] font-bold shadow-sm transition-all active:scale-[0.98] border border-indigo-500/30"
                  >
                    Masuk Cepat Google (Simulasi 1-Ketuk) &rarr;
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setGoogleError("");
                    setShowGoogleModal(true);
                  }}
                  className="text-[10px] text-slate-400 hover:text-indigo-400 hover:underline transition-all mt-1"
                >
                  Opsi Lanjut: Atur Client ID / Simulasi Akun Peran Lainnya &rarr;
                </button>
              </div>
            </form>

            <div className="text-center">
              <button
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setAuthError("");
                  setAuthSuccess("");
                }}
                className="text-xs text-slate-400 hover:text-indigo-400 transition-colors underline"
              >
                {isRegisterMode ? "Sudah punya akun? Masuk disini" : "Belum punya akun? Daftar disini"}
              </button>
            </div>
          </div>
        ) : (
          // ==================== 2. SCREEN TERAUTENTIKASI ====================
          <div className="space-y-8 animate-fadeIn">
            
            {/* ==================== 2A. POV PENJUAL (SELLER ROLE) ==================== */}
            {user?.role === "penjual" && (
              <div className="space-y-8">
                {isCheckingMerchant ? (
                  <div className="p-16 text-center text-slate-400">Memeriksa Profil Toko...</div>
                ) : !myMerchant ? (
                  // FORM REGISTRASI MERCHANDISE
                  <div className="max-w-md mx-auto bg-slate-900/60 p-8 rounded-2xl border border-slate-850 shadow-2xl space-y-6">
                    <div className="text-center space-y-2">
                      <div className="mx-auto w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/20">
                        <Store className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-bold text-white">Daftarkan Toko UMKM Anda</h3>
                      <p className="text-xs text-slate-400">Wajib mendaftarkan nama UMKM kuliner sebelum mengunggah menu makanan.</p>
                    </div>

                    {regStoreError && (
                      <div className="p-3 bg-rose-500/10 text-rose-400 text-xs font-semibold rounded-xl border border-rose-500/20">
                        {regStoreError}
                      </div>
                    )}

                    <form onSubmit={handleRegisterStore} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">NAMA TOKO / UMKM</label>
                        <input
                          type="text"
                          placeholder="Contoh: Bakso Mercon Bu Ani"
                          value={regStoreName}
                          onChange={e => setRegStoreName(e.target.value)}
                          className="bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none w-full"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">ALAMAT DAPUR / TOKO</label>
                        <textarea
                          placeholder="Jl. Cempaka Raya No. 12, Bandung"
                          value={regStoreAddress}
                          onChange={e => setRegStoreAddress(e.target.value)}
                          className="bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none w-full resize-none"
                          rows={2}
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={regStoreLoading}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center"
                      >
                        {regStoreLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Daftarkan Sekarang"}
                      </button>
                    </form>
                  </div>
                ) : (
                  // DASHBOARD UTAMA PENJUAL
                  <div className="space-y-8 animate-fadeIn">
                    {/* Profil Merchant */}
                    <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-850 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                          <Store className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{myMerchant.name}</h3>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                            <span className="bg-slate-950 px-2 py-0.5 rounded text-[10px] font-bold text-indigo-400 border border-slate-850">{myMerchant.category}</span>
                            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-500" /> {myMerchant.address}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-lg border border-indigo-500/20 uppercase tracking-wider">
                        Seller Dashboard
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Left: Input Menu */}
                      <div className="lg:col-span-5 bg-slate-900/50 p-6 rounded-2xl border border-slate-900 shadow-xl space-y-4">
                        <h4 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-850 pb-3">
                          <Plus className="h-4.5 w-4.5 text-indigo-400" /> Tambah Menu
                        </h4>
                        <form onSubmit={handleAddMenu} className="space-y-4">
                          <input
                            type="text"
                            placeholder="Nama Makanan (e.g. Bakso Bakar)"
                            value={newMenuName}
                            onChange={e => setNewMenuName(e.target.value)}
                            className="bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none w-full"
                            required
                          />
                          <input
                            type="text"
                            placeholder="Deskripsi Porsi/Bahan"
                            value={newMenuDesc}
                            onChange={e => setNewMenuDesc(e.target.value)}
                            className="bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none w-full"
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <input
                              type="number"
                              placeholder="Harga Jual"
                              value={newMenuPrice}
                              onChange={e => setNewMenuPrice(e.target.value)}
                              className="bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs text-slate-100 outline-none w-full"
                              required
                            />
                            <input
                              type="number"
                              placeholder="Stok"
                              value={newMenuStock}
                              onChange={e => setNewMenuStock(e.target.value)}
                              className="bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs text-slate-100 outline-none w-full"
                              required
                            />
                          </div>

                          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                            <label className="flex items-center gap-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={newMenuIsPO}
                                onChange={e => setNewMenuIsPO(e.target.checked)}
                                className="h-4.5 w-4.5 rounded border-slate-800 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="text-xs font-bold text-slate-200">Menu Pre-Order (PO)</span>
                            </label>
                            {newMenuIsPO && (
                              <div className="flex items-center gap-2 pt-1 animate-fadeIn">
                                <span className="text-[10px] text-slate-400">Estimasi PO:</span>
                                <input
                                  type="number"
                                  value={newMenuPODays}
                                  onChange={e => setNewMenuPODays(e.target.value)}
                                  className="bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg px-2 py-1 text-xs text-slate-200 w-16 outline-none"
                                />
                                <span className="text-[10px] text-slate-400">Hari</span>
                              </div>
                            )}
                          </div>

                          <button
                            type="submit"
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all"
                          >
                            Publish Menu
                          </button>
                        </form>
                      </div>

                      {/* Right: incoming orders */}
                      <div className="lg:col-span-7 space-y-6">
                        <div className="bg-slate-900/50 rounded-2xl border border-slate-900 shadow-xl overflow-hidden">
                          <div className="px-6 py-4.5 border-b border-slate-900 bg-slate-900/30 flex justify-between items-center">
                            <h4 className="font-bold text-white text-sm flex items-center gap-2">
                              <Bell className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
                              Konfirmasi Pesanan Pelanggan
                            </h4>
                          </div>

                          <div className="p-4 divide-y divide-slate-900">
                            {orders.filter(o => o.status === "pending").length === 0 ? (
                              <p className="text-slate-500 text-xs text-center py-6">Tidak ada pesanan baru yang masuk ke dapur Anda.</p>
                            ) : (
                              orders.filter(o => o.status === "pending").map(o => (
                                <div key={o.id} className="py-4 first:pt-0 space-y-3">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <span className="text-[9px] font-bold text-slate-500">ORDER ID: #{o.id}</span>
                                      <h5 className="text-xs font-extrabold text-white mt-0.5">Total Harga: Rp {o.total_price.toLocaleString("id-ID")}</h5>
                                      <p className="text-[10px] text-slate-400">Alamat Kirim: {o.shipping_address}</p>
                                    </div>
                                    <button
                                      onClick={() => handleConfirmOrder(o.id)}
                                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1"
                                    >
                                      <Check className="h-3.5 w-3.5" /> Terima & Siapkan Makanan
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Menu list */}
                        <div className="bg-slate-900/50 rounded-2xl border border-slate-900 shadow-xl overflow-hidden">
                          <div className="px-6 py-4 border-b border-slate-900 bg-slate-900/30">
                            <h4 className="font-bold text-white text-sm">Daftar Menu Toko Anda</h4>
                          </div>
                          <div className="divide-y divide-slate-900">
                            {products.map(p => (
                              <div key={p.id} className="p-5 flex items-center justify-between hover:bg-slate-900/10 transition-colors">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-200 text-sm">{p.name}</span>
                                    {p.is_pre_order ? (
                                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[9px] font-bold rounded border border-amber-500/20">PO {p.pre_order_days} Hari</span>
                                    ) : (
                                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-bold rounded border border-emerald-500/20">⚡ Ready</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500 mt-1">{p.description}</p>
                                </div>
                                <button
                                  onClick={() => handleDeleteMenu(p.id)}
                                  className="p-2.5 bg-slate-950 border border-slate-850 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-xl"
                                >
                                  <Trash2 className="h-4.5 w-4.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ==================== 2B. POV PEMBELI (BUYER ROLE WITH CHAT & POD PREVIEW) ==================== */}
            {user?.role === "pembeli" && (
              <div className="space-y-8 animate-fadeIn">
                
                {/* Toko list */}
                {!selectedMerchant ? (
                  <div className="space-y-6">
                    <div className="bg-slate-900/40 p-8 rounded-3xl border border-slate-800/80 space-y-4 shadow-xl">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-amber-400" /> Lagi lapar? Cari kuliner favoritmu...
                      </h3>
                      <div className="bg-slate-950 border border-slate-850 focus-within:border-indigo-500 pl-4 pr-2 py-2 rounded-2xl flex items-center gap-3 w-full sm:max-w-md transition-all shadow-inner">
                        <Search className="h-4.5 w-4.5 text-slate-500" />
                        <input
                          type="text"
                          placeholder="Cari Dapur Kuliner..."
                          value={searchStoreQuery}
                          onChange={e => setSearchStoreQuery(e.target.value)}
                          className="bg-transparent text-xs text-slate-200 outline-none w-full"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-350 text-sm flex items-center gap-2">
                        <Store className="h-4.5 w-4.5 text-indigo-400" /> Dapur Kuliner UMKM Terdaftar ({filteredMerchants.length})
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMerchants.map(merchant => (
                          <div
                            key={merchant.id}
                            onClick={() => fetchMerchantProducts(merchant)}
                            className="bg-slate-900/50 p-6 rounded-2xl border border-slate-900 hover:border-slate-800 hover:bg-slate-900/80 cursor-pointer shadow-lg transition-all group"
                          >
                            <div className="space-y-3">
                              <div className="flex justify-between items-start gap-2">
                                <h5 className="font-bold text-white text-base group-hover:text-indigo-400 transition-colors leading-tight">
                                  {merchant.name}
                                </h5>
                                <span className="text-[9px] font-bold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 uppercase">
                                  {merchant.category}
                                </span>
                              </div>
                              <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">{merchant.description}</p>
                              <div className="pt-3 border-t border-slate-850 flex items-center gap-1.5 text-xs text-slate-500">
                                <MapPin className="h-4 w-4 text-slate-400" />
                                <span className="truncate">{merchant.address}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Detail menu merchant
                  <div className="space-y-6 animate-fadeIn">
                    <button
                      onClick={() => {
                        setSelectedMerchant(null);
                        setProducts([]);
                      }}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold border border-slate-800 flex items-center gap-1 transition-all"
                    >
                      <ChevronLeft className="h-4 w-4" /> Kembali
                    </button>

                    <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-850 flex items-center gap-4 shadow-xl">
                      <div className="p-3.5 bg-indigo-600/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                        <Store className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{selectedMerchant.name}</h3>
                        <p className="text-xs text-slate-400 mt-1">{selectedMerchant.description}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                          <span className="bg-slate-950 px-2 py-0.5 rounded text-[10px] font-bold text-indigo-400 border border-slate-850">{selectedMerchant.category}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-400" /> {selectedMerchant.address}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      <div className="lg:col-span-8 space-y-4">
                        <h4 className="font-bold text-slate-300 text-sm">Katalog Menu</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {products.map(p => (
                            <div key={p.id} className="bg-slate-900/50 p-5 rounded-2xl border border-slate-900 flex flex-col justify-between gap-4 shadow-lg hover:border-slate-800 transition-all">
                              <div className="space-y-2">
                                <div className="flex justify-between items-start gap-2">
                                  <h5 className="font-bold text-white text-sm">{p.name}</h5>
                                  {p.is_pre_order ? (
                                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] font-bold rounded border border-amber-500/20">PO {p.pre_order_days} Hari</span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/20">⚡ Ready</span>
                                  )}
                                </div>
                                <p className="text-slate-400 text-xs line-clamp-2">{p.description}</p>
                              </div>
                              <div className="flex justify-between items-center pt-3 border-t border-slate-900">
                                <span className="text-sm font-extrabold text-white">Rp {p.price.toLocaleString("id-ID")}</span>
                                <button
                                  onClick={() => addToCart(p)}
                                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all"
                                >
                                  Tambah
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="lg:col-span-4">
                        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-900 shadow-xl space-y-4 sticky top-24">
                          <h4 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-850 pb-3">
                            <ShoppingCart className="h-4.5 w-4.5 text-indigo-400" /> Keranjang Belanja
                          </h4>
                          {cart.length === 0 ? (
                            <p className="text-slate-500 text-xs text-center py-8">Keranjang belanja Anda masih kosong.</p>
                          ) : (
                            <div className="space-y-4">
                              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                {cart.map(item => (
                                  <div key={item.product.id} className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                                    <div className="flex-1 pr-2">
                                      <h6 className="text-xs font-bold text-slate-200 truncate">{item.product.name}</h6>
                                      <span className="text-[10px] text-slate-500 font-bold block mt-0.5">{item.qty} x Rp {item.product.price.toLocaleString("id-ID")}</span>
                                    </div>
                                    <button onClick={() => setCart(cart.filter(c => c.product.id !== item.product.id))} className="p-1 text-slate-500 hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
                                  </div>
                                ))}
                              </div>
                              <div className="border-t border-slate-850 pt-3 flex justify-between items-center font-bold text-xs">
                                <span className="text-slate-400">TOTAL HARGA:</span>
                                <span className="text-white text-sm">Rp {cart.reduce((sum, item) => sum + item.product.price * item.qty, 0).toLocaleString("id-ID")}</span>
                              </div>
                              <form onSubmit={handleCheckout} className="border-t border-slate-850 pt-3 space-y-3">
                                <textarea
                                  placeholder="Alamat Lengkap Pengiriman..."
                                  value={shippingAddress}
                                  onChange={e => setShippingAddress(e.target.value)}
                                  className="bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none w-full resize-none"
                                  rows={2}
                                  required
                                />
                                <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md">Checkout</button>
                              </form>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Riwayat Belanja, Pelacakan PO, LIVE-CHAT & BUKTI POD FOTO */}
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-900 shadow-xl space-y-4">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-850 pb-3">
                    <Truck className="h-4.5 w-4.5 text-indigo-400" /> Riwayat Transaksi & Pelacakan PO Anda
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {orders.length === 0 ? (
                      <p className="text-slate-500 text-xs col-span-2 text-center py-6">Belum ada riwayat pesanan.</p>
                    ) : (
                      orders.map(o => (
                        <div key={o.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-3 shadow-md flex flex-col justify-between">
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-500">ORDER ID: #{o.id}</span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                                o.status === "pending" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                o.status === "diproses" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                                o.status === "dikirim" ? "bg-violet-500/10 text-violet-400 border-violet-500/20 animate-pulse" :
                                "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              }`}>
                                {o.status === "pending" ? "Menunggu Konfirmasi" :
                                 o.status === "diproses" ? "Sedang Disiapkan" :
                                 o.status === "dikirim" ? "Sedang Diantar" : "Selesai"}
                              </span>
                            </div>
                            <h5 className="text-sm font-extrabold text-white">Total: Rp {o.total_price.toLocaleString("id-ID")}</h5>
                            <p className="text-[10px] text-slate-400 truncate">Alamat: {o.shipping_address}</p>

                            {/* GPS LIVE TRACKING MAP (Simulasi GPS Seluler Premium) */}
                            {o.status === "dikirim" && (
                              <div className="w-full bg-slate-900/60 border border-indigo-500/20 rounded-xl p-3 space-y-2.5 my-2">
                                <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                                  <span className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5 text-indigo-400 animate-bounce" /> LACAK POSISI KURIR (GPS LIVE)</span>
                                  <span className="text-indigo-400 uppercase">Sedang Diantar</span>
                                </div>
                                
                                {/* Dynamic Peta CSS */}
                                <div className="h-28 w-full bg-slate-950 rounded-lg relative overflow-hidden border border-slate-800 flex items-center justify-center">
                                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:14px_14px] opacity-10"></div>
                                  
                                  {/* Origin Marker */}
                                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-center z-10 flex flex-col items-center">
                                    <div className="p-1 bg-emerald-500/20 border border-emerald-400/50 rounded-lg text-emerald-400">
                                      <Store className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="text-[6px] font-extrabold text-emerald-400 mt-0.5 block">DAPUR</span>
                                  </div>

                                  {/* Destination Marker */}
                                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-center z-10 flex flex-col items-center">
                                    <div className="p-1 bg-indigo-500/20 border border-indigo-400/50 rounded-lg text-indigo-400">
                                      <MapPin className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="text-[6px] font-extrabold text-indigo-400 mt-0.5 block">TUJUAN</span>
                                  </div>

                                  {/* Dotted Path */}
                                  <div className="absolute left-[36px] right-[36px] top-1/2 -translate-y-1/2 h-0.5 border-t border-dashed border-slate-850"></div>
                                  
                                  {/* Glowing Active Route */}
                                  <div 
                                    className="absolute left-[36px] top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-emerald-500 to-indigo-500 transition-all duration-1000 ease-in-out"
                                    style={{ width: `calc(${Math.min(100, Math.max(0, (gpsProgress[o.id] || 0.05) * 100))}% - 36px)` }}
                                  ></div>

                                  {/* Moving Courier */}
                                  <div 
                                    className="absolute top-1/2 -translate-y-1/2 z-20 flex flex-col items-center transition-all duration-1000 ease-in-out"
                                    style={{ left: `calc(36px + ${Math.min(85, Math.max(0, (gpsProgress[o.id] || 0.05) * 85))}%)` }}
                                  >
                                    <div className="p-1 bg-amber-500 text-slate-950 rounded-full border border-white shadow-lg animate-pulse">
                                      <Truck className="h-3 w-3" />
                                    </div>
                                    <span className="text-[5px] font-extrabold text-amber-400 bg-slate-950 px-1 rounded border border-slate-800 mt-0.5 whitespace-nowrap">KURIR</span>
                                  </div>

                                  {/* GPS Telemetry */}
                                  <div className="absolute bottom-1 right-2 text-[5px] text-slate-500 font-mono">
                                    LAT: -6.2146 | LON: 106.8451 | SPD: 24 km/h
                                  </div>
                                </div>

                                {/* Telemetry Details */}
                                <div className="bg-slate-950 p-2 rounded-lg border border-slate-850 flex justify-between items-center text-[10px]">
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                                    <div>
                                      <span className="text-[7px] text-slate-500 block font-bold leading-none">ESTIMASI KEDATANGAN</span>
                                      <span className="text-white font-extrabold text-[10px] mt-0.5 block">
                                        {(gpsProgress[o.id] || 0) >= 0.95 
                                          ? "Tiba di Lokasi Anda!" 
                                          : `~${Math.ceil((1 - (gpsProgress[o.id] || 0.05)) * 5)} menit lagi`}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[7px] text-slate-500 block font-bold leading-none">JARAK SISA</span>
                                    <span className="text-indigo-400 font-extrabold text-[10px] mt-0.5 block">
                                      {(gpsProgress[o.id] || 0) >= 0.95 
                                        ? "Selesai" 
                                        : `${Math.ceil((1 - (gpsProgress[o.id] || 0.05)) * 800)} meter`}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="pt-3 border-t border-slate-900 flex flex-wrap gap-2">
                            {/* LIVE CHAT BUTTON FOR BUYER */}
                            {o.status === "dikirim" && (
                              <button
                                onClick={() => setActiveChatOrder(o)}
                                className="flex-1 py-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-xl text-[10px] font-bold transition-all border border-indigo-500/20 flex items-center justify-center gap-1.5"
                              >
                                <MessageSquare className="h-3.5 w-3.5" /> Chat Kurir Anda
                              </button>
                            )}

                            {/* PREVIEW POD PHOTO FOR BUYER */}
                            {o.status === "selesai" && o.proof_of_delivery && (
                              <button
                                onClick={() => setPreviewPhotoUrl(o.proof_of_delivery)}
                                className="w-full py-2 bg-emerald-600/15 hover:bg-emerald-650 text-emerald-400 rounded-xl text-[10px] font-bold border border-emerald-500/20 transition-all flex items-center justify-center gap-1"
                              >
                                <CheckCircle className="h-3.5 w-3.5" /> Lihat Bukti Foto Paket Sampai
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* ==================== 2C. POV KURIR (COURIER ROLE WITH CHAT, POD & MOCK PHOTO DROPDOWN) ==================== */}
            {user?.role === "kurir" && (
              <div className="space-y-8 animate-fadeIn">
                
                {/* Notifikasi tugas terdekat */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4.5 w-4.5 text-indigo-400 animate-bounce" />
                    <h4 className="font-bold text-white text-sm">Notifikasi Pengantaran Terdekat (1.5 km dari Dapur UMKM)</h4>
                  </div>
                  <div className="space-y-3">
                    {orders.filter(o => o.status === "diproses").length === 0 ? (
                      <div className="p-6 bg-slate-900/30 rounded-xl border border-slate-900 text-center text-slate-500 text-xs">
                        Tidak ada notifikasi tugas baru di dekat Anda saat ini.
                      </div>
                    ) : (
                      orders.filter(o => o.status === "diproses").map(o => {
                        const merchantObj = merchants.find(m => m.owner_id === o.seller_id);
                        return (
                          <div key={o.id} className="bg-gradient-to-r from-slate-900 to-indigo-950/20 p-5 rounded-2xl border border-indigo-500/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold bg-indigo-500/15 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">📍 Tugas Terdekat (1.2 km)</span>
                              <h5 className="text-xs font-extrabold text-white mt-1.5">Penjemputan: {merchantObj ? merchantObj.name : "Dapur UMKM Mitra"}</h5>
                              <p className="text-[10px] text-slate-400">Tujuan: {o.shipping_address}</p>
                            </div>
                            <button onClick={() => handleAcceptDelivery(o.id)} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5">
                              <Truck className="h-4 w-4" /> Ambil & Antar Tugas
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Tugas Kurir Aktif */}
                <div className="bg-slate-900/50 rounded-2xl border border-slate-900 shadow-xl overflow-hidden">
                  <div className="px-6 py-4.5 border-b border-slate-900 bg-slate-900/30 flex justify-between items-center">
                    <h4 className="font-bold text-white text-sm">Paket Yang Sedang Anda Antar</h4>
                  </div>
                  <div className="divide-y divide-slate-900">
                    {orders.filter(o => o.status === "dikirim").length === 0 ? (
                      <p className="text-slate-500 text-xs text-center py-10">Belum ada paket yang sedang Anda antar. Ambil tugas terdekat di atas!</p>
                    ) : (
                      orders.filter(o => o.status === "dikirim").map(o => {
                        const merchantObj = merchants.find(m => m.owner_id === o.seller_id);
                        return (
                          <div key={o.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="space-y-1.5 flex-1">
                              <h5 className="font-bold text-white text-sm">Pengantaran #{o.id}</h5>
                              <p className="text-xs text-slate-400">Dari: <span className="font-bold text-slate-200">{merchantObj ? merchantObj.name : "Dapur UMKM"}</span></p>
                              <p className="text-xs text-slate-400">Tujuan: <span className="text-indigo-400 font-medium">{o.shipping_address}</span></p>
                              
                              {/* LIVE CHAT BUTTON FOR COURIER */}
                              <button
                                onClick={() => setActiveChatOrder(o)}
                                className="mt-2 py-1.5 px-3 bg-indigo-650/15 hover:bg-indigo-650 text-indigo-400 hover:text-white rounded-lg text-[10px] font-bold border border-indigo-500/20 transition-all flex items-center gap-1"
                              >
                                <MessageSquare className="h-3.5 w-3.5" /> Buka Obrolan (Chat) dengan Pembeli
                              </button>
                            </div>
                            
                            {/* MARK DELIVERED WITH MANDATORY POD PHOTO */}
                            <button
                              onClick={() => handleOpenPodDialog(o)}
                              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1"
                            >
                              <Camera className="h-4.5 w-4.5" /> Selesaikan & Upload Bukti Foto
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Riwayat Selesai */}
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-900 shadow-xl space-y-4">
                  <h4 className="font-bold text-white text-sm border-b border-slate-850 pb-3 flex items-center gap-2">
                    <CheckCircle className="h-4.5 w-4.5 text-emerald-400" /> Pengantaran Berhasil Hari Ini
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {orders.filter(o => o.status === "selesai").map(o => (
                      <div key={o.id} className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex items-center justify-between gap-4">
                        <div>
                          <span className="text-[9px] font-bold text-slate-500">ID: #{o.id}</span>
                          <h6 className="text-xs font-bold text-slate-350 mt-0.5">Nilai: Rp {o.total_price.toLocaleString("id-ID")}</h6>
                        </div>
                        {o.proof_of_delivery && (
                          <button
                            onClick={() => setPreviewPhotoUrl(o.proof_of_delivery)}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800"
                            title="Lihat Bukti Foto"
                          >
                            <Image className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

      </main>

      {/* ==================== D. MODAL FLOATING LIVE-CHAT SYSTEM (BOTTOM RIGHT) ==================== */}
      {activeChatOrder && (
        <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-slate-900 border border-indigo-500/25 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[400px] animate-slideIn">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 px-4 py-3 flex justify-between items-center border-b border-indigo-500/20">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-white">Hubungi {user?.role === "kurir" ? "Pembeli" : "Kurir Anda"}</h5>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Order ID: #{activeChatOrder.id}</span>
              </div>
            </div>
            <button
              onClick={() => setActiveChatOrder(null)}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Chat Messages Logs */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950 flex flex-col">
            {chatMessages.length === 0 ? (
              <div className="m-auto text-center p-6 text-slate-500 text-xs">
                Belum ada percakapan. Kirim pesan pertama untuk berkoordinasi!
              </div>
            ) : (
              chatMessages.map(msg => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[80%] ${isMe ? "self-end items-end" : "self-start items-start"}`}
                  >
                    <span className="text-[8px] text-slate-500 font-bold mb-0.5">{msg.sender_name}</span>
                    <div
                      className={`px-3 py-2 rounded-2xl text-xs font-medium ${
                        isMe
                          ? "bg-indigo-600 text-white rounded-tr-none shadow-md"
                          : "bg-slate-850 text-slate-200 rounded-tl-none border border-slate-800"
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Chat Input form */}
          <form onSubmit={handleSendChatMessage} className="bg-slate-900 p-3 border-t border-slate-850 flex items-center gap-2">
            <input
              type="text"
              placeholder="Tulis pesan koordinasi..."
              value={newChatMessage}
              onChange={e => setNewChatMessage(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none placeholder:text-slate-650"
              required
            />
            <button
              type="submit"
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white shadow-md active:scale-95 transition-all"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* ==================== E. MODAL BUKTI FOTO UPLOAD (POD) KURIR ==================== */}
      {activePodOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-5 animate-scaleUp">
            
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Camera className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
                Upload Bukti Pengiriman (POD)
              </h4>
              <button
                onClick={() => setActivePodOrder(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {podError && (
              <div className="p-3 bg-rose-500/10 text-rose-400 text-xs font-semibold rounded-xl border border-rose-500/20">
                {podError}
              </div>
            )}

            <form onSubmit={handleCompleteDeliveryWithPhoto} className="space-y-4">
              
              {/* Preset Premium Photo Selector */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pilih Simulasi Foto Bukti:</label>
                <div className="grid grid-cols-3 gap-3">
                  {MOCK_POD_PHOTOS.map((photo, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedPodPhoto(photo.url);
                        setCustomPodPhotoUrl("");
                      }}
                      className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                        selectedPodPhoto === photo.url && !customPodPhotoUrl ? "border-indigo-500 scale-95 shadow-lg shadow-indigo-500/25" : "border-slate-800 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={photo.url} alt={photo.name} className="h-16 w-full object-cover" />
                      <div className="bg-slate-950/80 p-1 text-[7px] text-center text-slate-300 font-bold truncate">
                        {photo.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Photo URL Input */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Atau Masukkan URL Foto Lainnya:</label>
                <input
                  type="text"
                  placeholder="https://link-gambar.com/foto-bukti.jpg"
                  value={customPodPhotoUrl}
                  onChange={e => setCustomPodPhotoUrl(e.target.value)}
                  className="bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none w-full"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setActivePodOrder(null)}
                  className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-850 text-slate-400 rounded-xl text-xs font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  Kirim & Selesaikan Tugas
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ==================== F. MODAL BUYER PREVIEW FOTO BUKTI (POD) ==================== */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-850 rounded-3xl p-5 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute top-4 right-4 p-2 bg-slate-950 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            <h4 className="font-bold text-white text-sm">Bukti Foto Penyerahan Makanan</h4>
            <div className="rounded-2xl overflow-hidden border border-slate-850 aspect-video">
              <img src={previewPhotoUrl} alt="Bukti Foto Pengiriman" className="w-full h-full object-cover" />
            </div>
            <p className="text-xs text-slate-400 text-center leading-relaxed">
              Foto di atas diunggah langsung oleh kurir Anda saat paket makanan diserahterimakan dengan selamat.
            </p>
          </div>
        </div>
      )}

      {/* ==================== G. SIMULASI GOOGLE SIGN-IN MODAL (OAUTH 2.0 STYLE) ==================== */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full overflow-y-auto max-h-[90vh] shadow-2xl p-6 space-y-4.5 animate-scaleUp text-slate-800 scrollbar-thin">
            
            {/* Google Identity Header */}
            <div className="text-center space-y-3">
              {/* Google Brand Logo G */}
              <div className="mx-auto flex justify-center items-center h-10 w-10">
                <svg viewBox="0 0 24 24" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
                  <g transform="matrix(1, 0, 0, 1, 0, 0)">
                    <path d="M21.35,11.1H12v2.7h5.38C16.88,16.22,14.65,18,12,18c-3.31,0-6-2.69-6-6s2.69-6,6-6c1.66,0,3.14,0.67,4.24,1.76l2.1-2.1C16.51,3.84,14.42,3,12,3c-4.97,0-9,4.03-9,9s4.03,9,9,9c4.97,0,9-4.03,9-9C21,11.75,20.88,11.37,21.35,11.1z" fill="#4285F4" />
                    <path d="M12,21c4.97,0,9-4.03,9-9c0-0.65-0.12-1.25-0.35-1.9H12v2.7h5.38c-0.5,2.42-2.73,4.2-5.38,4.2c-3.31,0-6-2.69-6-6c0-0.38,0.04-0.75,0.11-1.12l-2.12-1.63C3.31,9.08,3,10.51,3,12C3,16.97,7.03,21,12,21z" fill="#34A853" />
                    <path d="M6.11,9.88C6.04,10.25,6,10.62,6,11c0,0.38,0.04,0.75,0.11,1.12l2.12,1.63C8.04,13.38,8,13.01,8,12.63c0-0.38,0.04-0.75,0.11-1.12L6.11,9.88z" fill="#FBBC05" />
                    <path d="M12,6c1.66,0,3.14,0.67,4.24,1.76l2.1-2.1C16.51,3.84,14.42,3,12,3c-4.97,0-9,4.03-9,9c0,1.49,0.31,2.92,0.86,4.23l2.12-1.63C6.04,13.38,6,13.01,6,12.63C6,7.69,8.69,6,12,6z" fill="#EA4335" />
                  </g>
                </svg>
              </div>
              <h4 className="font-semibold text-lg text-slate-900">Masuk dengan Google</h4>
              <p className="text-xs text-slate-500">Pilih akun untuk melanjutkan ke <span className="font-bold text-slate-800">UMKM Digital</span></p>
            </div>

            {googleError && (
              <div className="p-3 bg-rose-50 text-rose-600 text-xs font-semibold rounded-xl border border-rose-200">
                {googleError}
              </div>
            )}

            {/* Role Selection (OAuth Custom Context) */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Langkah 1: Pilih Peran Anda di Sesi Ini</label>
              <select
                value={googleRole}
                onChange={e => setGoogleRole(e.target.value as any)}
                className="bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none w-full shadow-sm"
              >
                <option value="pembeli">Pembeli (Daftar Menu & Keranjang Belanja)</option>
                <option value="penjual">Penjual (Daftar Dapur UMKM & Upload Menu)</option>
                <option value="kurir">Kurir (Ambil Tugas & mandatory Photo POD)</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Langkah 2: Pilih Akun Google</label>
              
              {/* Account List */}
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto border border-slate-100 rounded-2xl shadow-sm bg-white">
                
                {/* Account 1 */}
                <div 
                  onClick={() => handleGoogleLoginSubmit("alif.pratama@gmail.com", "Alif Pratama")}
                  className="p-3.5 flex items-center gap-3 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm shadow-inner">A</div>
                  <div className="flex-1 text-left">
                    <h6 className="text-xs font-bold text-slate-800 leading-tight">Alif Pratama</h6>
                    <span className="text-[10px] text-slate-500">alif.pratama@gmail.com</span>
                  </div>
                </div>

                {/* Account 2 */}
                <div 
                  onClick={() => handleGoogleLoginSubmit("budi.santoso@gmail.com", "Budi Santoso")}
                  className="p-3.5 flex items-center gap-3 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm shadow-inner">B</div>
                  <div className="flex-1 text-left">
                    <h6 className="text-xs font-bold text-slate-800 leading-tight">Budi Santoso</h6>
                    <span className="text-[10px] text-slate-500">budi.santoso@gmail.com</span>
                  </div>
                </div>

                {/* Account 3 */}
                <div 
                  onClick={() => handleGoogleLoginSubmit("siti.rahma@gmail.com", "Siti Rahma")}
                  className="p-3.5 flex items-center gap-3 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-sm shadow-inner">S</div>
                  <div className="flex-1 text-left">
                    <h6 className="text-xs font-bold text-slate-800 leading-tight">Siti Rahma</h6>
                    <span className="text-[10px] text-slate-500">siti.rahma@gmail.com</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Real Google OAuth 2.0 Connection Section */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <label className="block text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Hubungkan Akun Google Riil Anda</label>
              
              <div className="space-y-2">
                <div className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-100 rounded-2xl w-full">
                  {/* Official Google Sign-In Button Container */}
                  <div id="google-signin-btn-container" className="my-1.5 min-h-[40px] flex items-center justify-center w-full"></div>
                  
                  {isRawIp && (
                    <div className="p-2.5 my-2 bg-amber-50 border border-amber-200 rounded-xl text-left text-[9px] text-amber-700 leading-normal">
                      ⚠️ <strong>Deteksi IP Lokal ({typeof window !== "undefined" ? window.location.hostname : ""}):</strong> Google memblokir otentikasi resmi pada IP mentah. Untuk masuk menggunakan Akun Google asli handphone Anda, silakan gunakan domain Vercel/ngrok, atau akses via localhost!
                    </div>
                  )}
                  
                  {/* Fallback Mobile Click for IP testing / Quick testing */}
                  {isMobileFlow && (
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = `umkm-app://login-success?token=simulated_jwt_token&name=${encodeURIComponent("Alif Pratama")}&email=alif.pratama@gmail.com&role=${googleRole}`;
                      }}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[11px] font-bold shadow-sm transition-all mt-2 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" xmlns="http://www.w3.org/2000/svg" className="fill-white">
                        <path d="M21.35,11.1H12v2.7h5.38C16.88,16.22,14.65,18,12,18c-3.31,0-6-2.69-6-6s2.69-6,6-6c1.66,0,3.14,0.67,4.24,1.76l2.1-2.1C16.51,3.84,14.42,3,12,3c-4.97,0-9,4.03-9,9s4.03,9,9,9c4.97,0,9-4.03,9-9C21,11.75,20.88,11.37,21.35,11.1z" />
                      </svg>
                      <span>Masuk Akun Google Asli (Android IP Fallback)</span>
                    </button>
                  )}

                  <span className="text-[9px] text-slate-400 text-center mt-1.5 leading-normal">
                    {isMobileFlow 
                      ? "Gunakan tombol Google resmi di atas (jika diakses via domain publik/Vercel) untuk masuk dengan akun Google asli handphone Anda."
                      : "Pilih akun Google asli Anda melalui tombol Google di atas."
                    }
                  </span>
                </div>

                {/* Optional Custom Client ID input for advanced users */}
                <details className="text-left">
                  <summary className="text-[10px] text-slate-400 hover:text-slate-650 cursor-pointer select-none">
                    Pengaturan Lanjut: Atur Custom Google Client ID
                  </summary>
                  <div className="pt-2 space-y-2">
                    <input
                      type="text"
                      placeholder="Masukkan Google Client ID Kustom Anda"
                      value={googleClientId}
                      onChange={e => setGoogleClientId(e.target.value)}
                      className="bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none w-full shadow-inner"
                    />
                    <p className="text-[9px] text-slate-450">
                      Default Client ID kami sudah siap digunakan. Ganti jika Anda ingin menggunakan credential project console Anda sendiri.
                    </p>
                  </div>
                </details>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowGoogleModal(false)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl text-xs font-bold transition-all mt-2"
            >
              Batal
            </button>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-24 border-t border-slate-900 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="space-y-1">
            <h5 className="font-bold text-slate-400">Go-UMKM Platform © 2026</h5>
            <p className="text-[10px]">Arsitektur Multi-Merchant Food Delivery mirip Gojek & Sistem Pre-Order terintegrasi.</p>
          </div>
          {/* Removed tech stack listing */}
        </div>
      </footer>
    </div>
  );
}
