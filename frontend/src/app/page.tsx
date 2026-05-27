"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Star,
  Shield,
  MessageSquare,
  Camera,
  X,
  Send,
  Image,
  Edit3,
  Upload,
  Settings,
  Menu,
} from "lucide-react";

// Tipe Data
interface Merchant {
  id: number;
  owner_id?: number;
  name: string;
  address: string;
  category: string;
  description: string;
  image_url?: string;
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
  image_url?: string;
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
  notes?: string;
  toppings?: string;
  tax?: number;
  delivery_fee?: number;
  app_fee?: number;
  merchant_rating?: number;
  merchant_review?: string;
  courier_rating?: number;
  buyer_rating?: number;
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

// Helper function to compress image and convert to Base64
const compressAndConvertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 500;
        const MAX_HEIGHT = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress as JPEG with 0.7 quality
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

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
  const [newMenuImageURL, setNewMenuImageURL] = useState("");
  const [menuError, setMenuError] = useState("");
  const [menuLoading, setMenuLoading] = useState(false);

  // States Edit Menu (Penjual)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editMenuName, setEditMenuName] = useState("");
  const [editMenuDesc, setEditMenuDesc] = useState("");
  const [editMenuPrice, setEditMenuPrice] = useState("");
  const [editMenuStock, setEditMenuStock] = useState("");
  const [editMenuIsPO, setEditMenuIsPO] = useState(false);
  const [editMenuPODays, setEditMenuPODays] = useState("2");
  const [editMenuImageURL, setEditMenuImageURL] = useState("");
  const [editMenuLoading, setEditMenuLoading] = useState(false);
  const [editMenuError, setEditMenuError] = useState("");

  // States Edit Toko / Restoran
  const [isEditingMerchant, setIsEditingMerchant] = useState(false);
  const [editStoreName, setEditStoreName] = useState("");
  const [editStoreCategory, setEditStoreCategory] = useState("Kuliner Makanan");
  const [editStoreAddress, setEditStoreAddress] = useState("");
  const [editStoreDesc, setEditStoreDesc] = useState("");
  const [editStoreImageURL, setEditStoreImageURL] = useState("");
  const [editStoreLoading, setEditStoreLoading] = useState(false);
  const [editStoreError, setEditStoreError] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // States Pembeli / E-Commerce (GoFood)
  const [searchStoreQuery, setSearchStoreQuery] = useState("");
  const [cart, setCart] = useState<{ product: Product; qty: number; toppings?: string; notes?: string }[]>([]);
  const [shippingAddress, setShippingAddress] = useState("");

  // States Peta Koordinat (Leaflet Picker) & Helper
  const [checkoutLatLng, setCheckoutLatLng] = useState<[number, number]>([-6.1996, 106.8601]);
  const [regStoreLatLng, setRegStoreLatLng] = useState<[number, number]>([-6.2146, 106.8451]);
  const [editStoreLatLng, setEditStoreLatLng] = useState<[number, number]>([-6.2146, 106.8451]);

  const checkoutMapRef = useRef<any>(null);
  const checkoutMarkerRef = useRef<any>(null);
  const regMerchantMapRef = useRef<any>(null);
  const regMerchantMarkerRef = useRef<any>(null);
  const editMerchantMapRef = useRef<any>(null);
  const editMerchantMarkerRef = useRef<any>(null);

  const [isSearchingMap, setIsSearchingMap] = useState(false);
  const [routesCache, setRoutesCache] = useState<Record<number, [number, number][]>>({});

  const handleSearchAddress = async (type: "checkout" | "reg" | "edit", query: string) => {
    if (!query) return;
    setIsSearchingMap(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          const displayName = data[0].display_name;

          if (type === "checkout") {
            setCheckoutLatLng([lat, lng]);
            if (checkoutMapRef.current) {
              checkoutMapRef.current.setView([lat, lng], 16);
            }
            if (checkoutMarkerRef.current) {
              checkoutMarkerRef.current.setLatLng([lat, lng]);
            }
            setShippingAddress(displayName);
          } else if (type === "reg") {
            setRegStoreLatLng([lat, lng]);
            if (regMerchantMapRef.current) {
              regMerchantMapRef.current.setView([lat, lng], 16);
            }
            if (regMerchantMarkerRef.current) {
              regMerchantMarkerRef.current.setLatLng([lat, lng]);
            }
            setRegStoreAddress(displayName);
          } else if (type === "edit") {
            setEditStoreLatLng([lat, lng]);
            if (editMerchantMapRef.current) {
              editMerchantMapRef.current.setView([lat, lng], 16);
            }
            if (editMerchantMarkerRef.current) {
              editMerchantMarkerRef.current.setLatLng([lat, lng]);
            }
            setEditStoreAddress(displayName);
          }
        } else {
          showPremiumAlert("Lokasi tidak ditemukan. Harap masukkan nama jalan, kelurahan, atau kota.", "Info");
        }
      }
    } catch (err) {
      console.error("OSM Geocoding Error:", err);
    } finally {
      setIsSearchingMap(false);
    }
  };

  const formatAddressText = (addr: string) => {
    if (!addr) return "";
    return addr.includes("||") ? addr.split("||")[0] : addr;
  };

  const getOrderOriginCoords = (o: any): [number, number] => {
    let merchantAddress = "";
    if (user?.role === "penjual" && myMerchant) {
      merchantAddress = myMerchant.address;
    } else {
      const m = merchants.find(merch => merch.owner_id === o.seller_id);
      if (m) {
        merchantAddress = m.address;
      }
    }
    
    if (merchantAddress && merchantAddress.includes("||")) {
      const parts = merchantAddress.split("||");
      if (parts.length > 1) {
        const coords = parts[1].split(",");
        if (coords.length === 2) {
          const lat = parseFloat(coords[0]);
          const lng = parseFloat(coords[1]);
          if (!isNaN(lat) && !isNaN(lng)) {
            return [lat, lng];
          }
        }
      }
    }
    return [-6.2146, 106.8451]; // Default fallback
  };

  const getMerchantCoords = (m: any): [number, number] => {
    if (m && m.address && m.address.includes("||")) {
      const parts = m.address.split("||");
      if (parts.length > 1) {
        const coords = parts[1].split(",");
        if (coords.length === 2) {
          const lat = parseFloat(coords[0]);
          const lng = parseFloat(coords[1]);
          if (!isNaN(lat) && !isNaN(lng)) {
            return [lat, lng];
          }
        }
      }
    }
    return [-6.2146, 106.8451]; // Default
  };

  const handleForgotPasswordClick = () => {
    if (!authEmail) {
      showPremiumAlert("Silakan masukkan email Anda pada kolom EMAIL USER terlebih dahulu untuk menyetel ulang kata sandi.", "Info");
      return;
    }
    
    showPremiumAlert(
      `Tautan instruksi penyetelan ulang kata sandi (reset password) telah sukses dikirim ke email: ${authEmail}. Silakan periksa kotak masuk atau spam email Anda! (Simulasi)`,
      "Sukses"
    );
  };
  
  // 1A. STATES BARU FITUR EVALUASI & RATING
  const [customAlert, setCustomAlert] = useState<{
    show: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  } | null>(null);

  const [selectedProductForOrder, setSelectedProductForOrder] = useState<Product | null>(null);
  const [orderQty, setOrderQty] = useState(1);
  const [selectedTopping, setSelectedTopping] = useState("Polos");
  const [sellerNote, setSellerNote] = useState("");

  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);
  const [ratingRestoVal, setRatingRestoVal] = useState(5);
  const [ratingCourierVal, setRatingCourierVal] = useState(5);
  const [ratingReviewText, setRatingReviewText] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const [ratingBuyerOrder, setRatingBuyerOrder] = useState<Order | null>(null);
  const [ratingBuyerVal, setRatingBuyerVal] = useState(5);
  const [ratingBuyerSubmitting, setRatingBuyerSubmitting] = useState(false);

  // 1B. UTILITY: PREMIUM PHOTO GENERATORS
  const getProductPhoto = (name: string): string => {
    const term = name.toLowerCase();
    if (term.includes("nasi")) {
      return "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&q=80&w=350";
    }
    if (term.includes("mie") || term.includes("bakso")) {
      return "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&q=80&w=350";
    }
    if (term.includes("ayam")) {
      return "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=350";
    }
    if (term.includes("roti") || term.includes("kue") || term.includes("donat")) {
      return "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=350";
    }
    if (term.includes("minum") || term.includes("kopi") || term.includes("teh") || term.includes("jus")) {
      return "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=350";
    }
    return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=350";
  };

  const getMerchantPhoto = (name: string): string => {
    const term = name.toLowerCase();
    if (term.includes("padang")) {
      return "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=400";
    }
    if (term.includes("mie") || term.includes("bakso")) {
      return "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=400";
    }
    return "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400";
  };

  // 1C. CUSTOM ALERT WRAPPERS
  const showPremiumAlert = (message: string, title = "Notifikasi", onConfirm?: () => void) => {
    setCustomAlert({
      show: true,
      title,
      message,
      confirmText: "OK",
      onConfirm: () => {
        setCustomAlert(null);
        if (onConfirm) onConfirm();
      }
    });
  };

  const showPremiumConfirm = (message: string, onConfirm: () => void, title = "Konfirmasi") => {
    setCustomAlert({
      show: true,
      title,
      message,
      confirmText: "Ya, Lanjutkan",
      cancelText: "Batal",
      onConfirm: () => {
        setCustomAlert(null);
        onConfirm();
      },
      onCancel: () => {
        setCustomAlert(null);
      }
    });
  };

  const alert = (msg: string) => showPremiumAlert(msg);

  // 1D. IMPLEMENTASI RATING & KUSTOMISASI KERANJANG
  const openCustomizationModal = (product: Product) => {
    setSelectedProductForOrder(product);
    setOrderQty(1);
    setSelectedTopping("Polos");
    setSellerNote("");
  };

  const handleConfirmAddToCart = () => {
    if (!selectedProductForOrder) return;
    
    // Check Single Merchant Cart Policy
    if (cart.length > 0 && selectedProductForOrder.merchant_id !== cart[0].product.merchant_id) {
      showPremiumConfirm(
        "Keranjang belanja Anda berisi makanan dari dapur toko lain. Kosongkan keranjang untuk memesan dari dapur toko ini?",
        () => {
          // Clear cart and add new item
          setCart([{ product: selectedProductForOrder, qty: orderQty, toppings: selectedTopping, notes: sellerNote }]);
          setSelectedProductForOrder(null);
          showPremiumAlert("Keranjang disetel ulang untuk toko baru!", "Sukses");
        },
        "Ganti Toko UMKM?"
      );
      return;
    }

    // Add or merge into cart
    const existingIndex = cart.findIndex(item => 
      item.product.id === selectedProductForOrder.id && 
      item.toppings === selectedTopping && 
      item.notes === sellerNote
    );

    if (existingIndex > -1) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].qty += orderQty;
      setCart(updatedCart);
    } else {
      setCart([...cart, { product: selectedProductForOrder, qty: orderQty, toppings: selectedTopping, notes: sellerNote }]);
    }
    
    setSelectedProductForOrder(null);
    showPremiumAlert(`${selectedProductForOrder.name} berhasil ditambahkan ke keranjang!`, "Sukses");
  };

  const handleRateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingOrder || !token) return;
    setRatingSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/orders/${ratingOrder.id}/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          merchant_rating: ratingRestoVal,
          merchant_review: ratingReviewText,
          courier_rating: ratingCourierVal
        })
      });
      if (res.ok) {
        showPremiumAlert("Terima kasih atas penilaian Anda! Ulasan Anda telah disimpan.", "Ulasan Terkirim");
        setRatingOrder(null);
        setRatingReviewText("");
        fetchRoleOrders();
      } else {
        const data = await res.json();
        showPremiumAlert(data.error || "Gagal mengirim penilaian.", "Gagal");
      }
    } catch (err) {
      showPremiumAlert("Gagal terhubung ke server API.", "Error");
    } finally {
      setRatingSubmitting(false);
    }
  };

  const handleRateBuyerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingBuyerOrder || !token) return;
    setRatingBuyerSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/orders/${ratingBuyerOrder.id}/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          buyer_rating: ratingBuyerVal
        })
      });
      if (res.ok) {
        showPremiumAlert("Penilaian kebaikan pelanggan berhasil disimpan!", "Sukses");
        setRatingBuyerOrder(null);
        fetchRoleOrders();
      } else {
        const data = await res.json();
        showPremiumAlert(data.error || "Gagal mengirim penilaian pelanggan.", "Gagal");
      }
    } catch (err) {
      showPremiumAlert("Gagal terhubung ke server API.", "Error");
    } finally {
      setRatingBuyerSubmitting(false);
    }
  };

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

  const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined"
    ? (window.location.protocol === "https:" ? "https://umkm-backend-ivory.vercel.app/api" : `http://${window.location.hostname}:8080/api`)
    : "https://umkm-backend-ivory.vercel.app/api");
  const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_BASE || (typeof window !== "undefined"
    ? (window.location.protocol === "https:" ? "https://umkm-backend-ivory.vercel.app" : `http://${window.location.hostname}:8080`)
    : "https://umkm-backend-ivory.vercel.app");
  const DEFAULT_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "942189841866-lk7pi6eilk9i10km1er57voe1360bfq4.apps.googleusercontent.com";

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

    // LOAD LEAFLET DYNAMICALLY FOR THE PREMIUM MAP
    if (typeof window !== "undefined" && !window.hasOwnProperty("L")) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => {
        setLeafletLoaded(true);
      };
      document.body.appendChild(script);
    } else if (typeof window !== "undefined" && window.hasOwnProperty("L")) {
      setLeafletLoaded(true);
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
              { theme: "filled_blue", size: "large", width: 290, shape: "rectangular" }
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
              { theme: "filled_blue", size: "large", width: 290, shape: "rectangular" }
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
            if (current < 1.0) {
              next[o.id] = parseFloat((current + 0.045).toFixed(3));
            } else {
              next[o.id] = 1.0; // Arrived at destination
            }
          }
        });
        return next;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [token, orders]);

  // Fetch actual street routes from OSRM for active deliveries
  useEffect(() => {
    if (typeof window === "undefined" || !leafletLoaded) return;
    const activeOrders = orders.filter(o => o.status === "dikirim");
    
    activeOrders.forEach(async (o) => {
      if (routesCache[o.id]) return; // Already cached
      
      const originLatLng = getOrderOriginCoords(o);
      let destLatLng: [number, number] = [-6.1996, 106.8601];
      if (o.shipping_address && o.shipping_address.includes("||")) {
        const parts = o.shipping_address.split("||");
        if (parts.length > 1) {
          const coords = parts[1].split(",");
          if (coords.length === 2) {
            const lat = parseFloat(coords[0]);
            const lng = parseFloat(coords[1]);
            if (!isNaN(lat) && !isNaN(lng)) {
              destLatLng = [lat, lng];
            }
          }
        }
      }
      
      try {
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${originLatLng[1]},${originLatLng[0]};${destLatLng[1]},${destLatLng[0]}?overview=full&geometries=geojson`);
        if (res.ok) {
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const coords: [number, number][] = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
            if (coords && coords.length > 0) {
              setRoutesCache(prev => ({ ...prev, [o.id]: coords }));
            }
          }
        }
      } catch (err) {
        console.error("OSRM Routing Error:", err);
      }
    });
  }, [leafletLoaded, orders]);

  // DYNAMIC MAP: Inisialisasi Peta Interaktif LeafletJS Dark Cyber Premium
  useEffect(() => {
    if (!leafletLoaded || typeof window === "undefined") return;
    
    const activeOrders = orders.filter(o => o.status === "dikirim");
    const L = (window as any).L;
    if (!L) return;

    activeOrders.forEach(o => {
      const mapId = `map-${o.id}`;
      const mapContainer = document.getElementById(mapId);
      if (!mapContainer) return;

      // Ambil data koordinat dinamis dari progress
      const progress = gpsProgress[o.id] || 0.05;
      
      // Rute dari Dapur (Origin) ke Pembeli (Tujuan)
      const originLatLng = getOrderOriginCoords(o);
      
      let destLatLng: [number, number] = [-6.1996, 106.8601];
      if (o.shipping_address && o.shipping_address.includes("||")) {
        const parts = o.shipping_address.split("||");
        if (parts.length > 1) {
          const coords = parts[1].split(",");
          if (coords.length === 2) {
            const lat = parseFloat(coords[0]);
            const lng = parseFloat(coords[1]);
            if (!isNaN(lat) && !isNaN(lng)) {
              destLatLng = [lat, lng];
            }
          }
        }
      }
      
      // Check if we have OSRM route coordinates in cache
      const routePoints = routesCache[o.id];
      let currentLat = originLatLng[0];
      let currentLng = originLatLng[1];

      if (routePoints && routePoints.length > 0) {
        // Interpolate along the actual road path!
        const totalPoints = routePoints.length;
        const index = Math.min(Math.floor(progress * totalPoints), totalPoints - 1);
        currentLat = routePoints[index][0];
        currentLng = routePoints[index][1];
      } else {
        // Fallback to straight line interpolation if OSRM hasn't returned yet
        currentLat = originLatLng[0] + (progress * (destLatLng[0] - originLatLng[0]));
        currentLng = originLatLng[1] + (progress * (destLatLng[1] - originLatLng[1]));
      }

      if ((mapContainer as any)._leaflet_map) {
        // Peta sudah diinisialisasi, cukup update posisi marker kurir
        if ((mapContainer as any)._courier_marker) {
          (mapContainer as any)._courier_marker.setLatLng([currentLat, currentLng]);
          
          // Auto-center map ke kurir agar tampak dinamis
          (mapContainer as any)._leaflet_map.panTo([currentLat, currentLng]);
        }

        // Dynamic Route Polyline Update when OSRM API call completes!
        if ((mapContainer as any)._route_polyline && routePoints && routePoints.length > 0) {
          (mapContainer as any)._route_polyline.setLatLngs(routePoints);
          (mapContainer as any)._route_polyline.setStyle({
            dashArray: '1', // solid line
            weight: 4,
            opacity: 0.75
          });
        }
        return;
      }

      // Inisialisasi Peta baru
      const map = L.map(mapId, {
        zoomControl: false,
        attributionControl: false
      }).setView([currentLat, currentLng], 14);

      (mapContainer as any)._leaflet_map = map;

      // Dark cyber map tile layer (CartoDB Dark Matter)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 20
      }).addTo(map);

      // Icon Dapur (Green)
      const originIcon = L.divIcon({
        html: `<div class="p-1 bg-emerald-500 text-white rounded-lg border border-white shadow flex items-center justify-center" style="width: 26px; height: 26px;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-store"><path d="M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5"></path><path d="M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244"></path><path d="M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05"></path></svg></div>`,
        className: 'custom-leaflet-icon-container',
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });
      L.marker(originLatLng, { icon: originIcon }).addTo(map).bindPopup("Dapur UMKM");

      // Icon Penerima (Indigo)
      const destIcon = L.divIcon({
        html: `<div class="p-1 bg-indigo-500 text-white rounded-lg border border-white shadow flex items-center justify-center" style="width: 26px; height: 26px;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>`,
        className: 'custom-leaflet-icon-container',
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });
      L.marker(destLatLng, { icon: destIcon }).addTo(map).bindPopup("Tujuan Pengantaran");

      // Draw Route Line - Use OSRM road coordinates if available, otherwise straight line
      const polylinePoints = (routePoints && routePoints.length > 0) ? routePoints : [originLatLng, destLatLng];
      const routePolyline = L.polyline(polylinePoints, {
        color: '#6366F1',
        weight: 4,
        opacity: 0.75,
        dashArray: (routePoints && routePoints.length > 0) ? '1' : '5, 5'
      }).addTo(map);
      (mapContainer as any)._route_polyline = routePolyline;

      // Icon Moving Courier
      const courierIcon = L.divIcon({
        html: `<div class="p-1.5 bg-amber-500 text-slate-950 rounded-full border-2 border-white shadow-lg animate-pulse flex items-center justify-center" style="width: 30px; height: 30px;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-truck"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg></div>`,
        className: 'custom-leaflet-icon-container',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      const courierMarker = L.marker([currentLat, currentLng], { icon: courierIcon }).addTo(map);
      (mapContainer as any)._courier_marker = courierMarker;
    });
  }, [leafletLoaded, orders, gpsProgress, routesCache]);

  // 1. useEffect for Checkout Map Picker
  useEffect(() => {
    if (!leafletLoaded || typeof window === "undefined") return;
    const L = (window as any).L;
    if (!L) return;

    let activeMap: any = null;

    const timer = setTimeout(() => {
      const mapContainer = document.getElementById("checkout-map");
      if (!mapContainer) {
        if (checkoutMapRef.current) {
          checkoutMapRef.current.remove();
          checkoutMapRef.current = null;
          checkoutMarkerRef.current = null;
        }
        return;
      }

      if (checkoutMapRef.current) return;

      let centerLatLng: [number, number] = [-6.1996, 106.8601];
      if (selectedMerchant) {
        centerLatLng = getMerchantCoords(selectedMerchant);
        centerLatLng = [centerLatLng[0] + 0.003, centerLatLng[1] + 0.003];
      }

      const map = L.map("checkout-map", {
        zoomControl: true,
        attributionControl: false
      }).setView(centerLatLng, 14);

      checkoutMapRef.current = map;
      activeMap = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 20
      }).addTo(map);

      const storeIcon = L.divIcon({
        html: `<div class="p-1 bg-emerald-500 text-white rounded-lg border border-white shadow flex items-center justify-center animate-pulse" style="width: 24px; height: 24px;"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5"></path><path d="M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244"></path><path d="M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05"></path></svg></div>`,
        className: 'custom-leaflet-icon-container',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      if (selectedMerchant) {
        L.marker(getMerchantCoords(selectedMerchant), { icon: storeIcon }).addTo(map).bindPopup("Dapur Penjual");
      }

      const buyerIcon = L.divIcon({
        html: `<div class="p-1.5 bg-indigo-500 text-white rounded-lg border border-white shadow flex items-center justify-center animate-bounce" style="width: 28px; height: 28px;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>`,
        className: 'custom-leaflet-icon-container',
        iconSize: [28, 28],
        iconAnchor: [14, 28]
      });

      const marker = L.marker(centerLatLng, {
        icon: buyerIcon,
        draggable: true
      }).addTo(map);

      checkoutMarkerRef.current = marker;
      setCheckoutLatLng(centerLatLng);

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        setCheckoutLatLng([pos.lat, pos.lng]);
      });

      map.on("click", (e: any) => {
        marker.setLatLng(e.latlng);
        setCheckoutLatLng([e.latlng.lat, e.latlng.lng]);
      });

      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }, 300);

    return () => {
      clearTimeout(timer);
      if (activeMap) {
        activeMap.remove();
        checkoutMapRef.current = null;
        checkoutMarkerRef.current = null;
      }
    };
  }, [leafletLoaded, cart.length, selectedMerchant]);

  // 2. useEffect for Merchant Registration Map Picker
  useEffect(() => {
    if (!leafletLoaded || typeof window === "undefined") return;
    const L = (window as any).L;
    if (!L) return;

    let activeMap: any = null;

    const timer = setTimeout(() => {
      const mapContainer = document.getElementById("reg-merchant-map");
      if (!mapContainer) {
        if (regMerchantMapRef.current) {
          regMerchantMapRef.current.remove();
          regMerchantMapRef.current = null;
          regMerchantMarkerRef.current = null;
        }
        return;
      }

      if (regMerchantMapRef.current) return;

      const centerLatLng: [number, number] = [-6.2146, 106.8451];

      const map = L.map("reg-merchant-map", {
        zoomControl: true,
        attributionControl: false
      }).setView(centerLatLng, 14);

      regMerchantMapRef.current = map;
      activeMap = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 20
      }).addTo(map);

      const storeIcon = L.divIcon({
        html: `<div class="p-1 bg-emerald-500 text-white rounded-lg border border-white shadow flex items-center justify-center animate-bounce" style="width: 28px; height: 28px;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5"></path><path d="M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244"></path><path d="M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05"></path></svg></div>`,
        className: 'custom-leaflet-icon-container',
        iconSize: [28, 28],
        iconAnchor: [14, 28]
      });

      const marker = L.marker(centerLatLng, {
        icon: storeIcon,
        draggable: true
      }).addTo(map);

      regMerchantMarkerRef.current = marker;
      setRegStoreLatLng(centerLatLng);

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        setRegStoreLatLng([pos.lat, pos.lng]);
      });

      map.on("click", (e: any) => {
        marker.setLatLng(e.latlng);
        setRegStoreLatLng([e.latlng.lat, e.latlng.lng]);
      });

      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }, 300);

    return () => {
      clearTimeout(timer);
      if (activeMap) {
        activeMap.remove();
        regMerchantMapRef.current = null;
        regMerchantMarkerRef.current = null;
      }
    };
  }, [leafletLoaded, myMerchant]);

  // 3. useEffect for Merchant Edit Profile Map Picker
  useEffect(() => {
    if (!leafletLoaded || typeof window === "undefined") return;
    const L = (window as any).L;
    if (!L) return;

    let activeMap: any = null;

    const timer = setTimeout(() => {
      const mapContainer = document.getElementById("edit-merchant-map");
      if (!mapContainer) {
        if (editMerchantMapRef.current) {
          editMerchantMapRef.current.remove();
          editMerchantMapRef.current = null;
          editMerchantMarkerRef.current = null;
        }
        return;
      }

      if (editMerchantMapRef.current) return;

      let centerLatLng = editStoreLatLng;
      if (myMerchant && myMerchant.address) {
        if (myMerchant.address.includes("||")) {
          const parts = myMerchant.address.split("||");
          if (parts.length > 1) {
            const coords = parts[1].split(",");
            if (coords.length === 2) {
              const lat = parseFloat(coords[0]);
              const lng = parseFloat(coords[1]);
              if (!isNaN(lat) && !isNaN(lng)) {
                centerLatLng = [lat, lng];
              }
            }
          }
        }
      }

      const map = L.map("edit-merchant-map", {
        zoomControl: true,
        attributionControl: false
      }).setView(centerLatLng, 14);

      editMerchantMapRef.current = map;
      activeMap = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 20
      }).addTo(map);

      const storeIcon = L.divIcon({
        html: `<div class="p-1 bg-emerald-500 text-white rounded-lg border border-white shadow flex items-center justify-center animate-bounce" style="width: 28px; height: 28px;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5"></path><path d="M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244"></path><path d="M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05"></path></svg></div>`,
        className: 'custom-leaflet-icon-container',
        iconSize: [28, 28],
        iconAnchor: [14, 28]
      });

      const marker = L.marker(centerLatLng, {
        icon: storeIcon,
        draggable: true
      }).addTo(map);

      editMerchantMarkerRef.current = marker;
      setEditStoreLatLng(centerLatLng);

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        setEditStoreLatLng([pos.lat, pos.lng]);
      });

      map.on("click", (e: any) => {
        marker.setLatLng(e.latlng);
        setEditStoreLatLng([e.latlng.lat, e.latlng.lng]);
      });

      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }, 300);

    return () => {
      clearTimeout(timer);
      if (activeMap) {
        activeMap.remove();
        editMerchantMapRef.current = null;
        editMerchantMarkerRef.current = null;
      }
    };
  }, [leafletLoaded, isEditingMerchant]);

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

  const handleDeleteMenu = async (productId: number) => {
    if (!token) return;
    if (!confirm("Apakah Anda yakin ingin menghapus menu ini?")) return;
    
    try {
      const res = await fetch(`${API_URL}/products/${productId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        alert("Menu berhasil dihapus!");
        if (myMerchant) {
          fetchMyProducts(myMerchant.id);
        }
      } else {
        const data = await res.json();
        alert(data.error || "Gagal menghapus menu.");
      }
    } catch (err) {
      console.error("Delete menu error:", err);
      alert("Koneksi gagal: " + (err instanceof Error ? err.message : String(err)));
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
          address: `${regStoreAddress}||${regStoreLatLng[0]},${regStoreLatLng[1]}`,
          category: regStoreCategory,
          description: regStoreDesc,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMyMerchant(data);
        showPremiumAlert("Toko Anda berhasil didaftarkan!", "Sukses");
        setRegStoreName("");
        setRegStoreAddress("");
        setRegStoreDesc("");
        fetchAllMerchants();
      } else {
        setRegStoreError(data.error || "Pendaftaran gagal.");
      }
    } catch (err) {
      setRegStoreError("Koneksi gagal.");
    } finally {
      setRegStoreLoading(false);
    }
  };

  const openEditMerchantModal = () => {
    if (!myMerchant) return;
    setEditStoreName(myMerchant.name);
    setEditStoreCategory(myMerchant.category);
    
    const rawAddress = myMerchant.address || "";
    const textAddress = rawAddress.includes("||") ? rawAddress.split("||")[0] : rawAddress;
    setEditStoreAddress(textAddress);

    if (rawAddress.includes("||")) {
      const parts = rawAddress.split("||");
      if (parts.length > 1) {
        const coords = parts[1].split(",");
        if (coords.length === 2) {
          const lat = parseFloat(coords[0]);
          const lng = parseFloat(coords[1]);
          if (!isNaN(lat) && !isNaN(lng)) {
            setEditStoreLatLng([lat, lng]);
          }
        }
      }
    } else {
      setEditStoreLatLng([-6.2146, 106.8451]);
    }

    setEditStoreDesc(myMerchant.description || "");
    setEditStoreImageURL(myMerchant.image_url || "");
    setEditStoreError("");
    setIsEditingMerchant(true);
  };

  const handleEditMerchantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !myMerchant) return;
    setEditStoreLoading(true);
    setEditStoreError("");
    try {
      const res = await fetch(`${API_URL}/merchants/my`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editStoreName,
          address: `${editStoreAddress}||${editStoreLatLng[0]},${editStoreLatLng[1]}`,
          category: editStoreCategory,
          description: editStoreDesc,
          image_url: editStoreImageURL,
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMyMerchant(data);
        showPremiumAlert("Profil toko Anda berhasil diperbarui!", "Sukses");
        setIsEditingMerchant(false);
        fetchAllMerchants();
      } else {
        setEditStoreError(data.error || "Gagal memperbarui profil toko.");
      }
    } catch (err) {
      setEditStoreError("Koneksi gagal.");
    } finally {
      setEditStoreLoading(false);
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

    const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
    const deliveryFee = 10000;
    const tax = Math.round(subtotal * 0.11);
    const appFee = Math.round(subtotal * 0.02);
    const totalPrice = subtotal + deliveryFee + tax + appFee;

    // Concatenate toppings and notes
    const toppingsSummary = cart.map(item => `${item.product.name} (Topping: ${item.toppings || "Polos"}) x${item.qty}`).join("; ");
    const notesSummary = cart.map(item => item.notes ? `${item.product.name}: ${item.notes}` : "").filter(Boolean).join("; ");

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
          shipping_address: `${shippingAddress}||${checkoutLatLng[0]},${checkoutLatLng[1]}`,
          notes: notesSummary,
          toppings: toppingsSummary,
          tax: tax,
          delivery_fee: deliveryFee,
          app_fee: appFee
        }),
      });

      if (res.ok) {
        alert("Pesanan sukses dikirim ke Dapur Penjual!");
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
        // Clear all previous user states to prevent leakage between sessions
        setOrders([]);
        setCart([]);
        setSelectedMerchant(null);
        setActiveChatOrder(null);
        setChatMessages([]);
        setNewChatMessage("");

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
        // Clear all previous user states to prevent leakage between sessions
        setOrders([]);
        setCart([]);
        setSelectedMerchant(null);
        setActiveChatOrder(null);
        setChatMessages([]);
        setNewChatMessage("");

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
        // Clear all previous user states to prevent leakage between sessions
        setOrders([]);
        setCart([]);
        setSelectedMerchant(null);
        setActiveChatOrder(null);
        setChatMessages([]);
        setNewChatMessage("");

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
          image_url: newMenuImageURL,
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
        setNewMenuImageURL("");
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

  const openEditMenuModal = (product: Product) => {
    setEditingProduct(product);
    setEditMenuName(product.name);
    setEditMenuDesc(product.description || "");
    setEditMenuPrice(product.price.toString());
    setEditMenuStock(product.stock.toString());
    setEditMenuIsPO(product.is_pre_order);
    setEditMenuPODays(product.pre_order_days ? product.pre_order_days.toString() : "2");
    setEditMenuImageURL(product.image_url || "");
    setEditMenuError("");
  };

  const handleEditMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !token) return;
    setEditMenuLoading(true);
    setEditMenuError("");
    try {
      const res = await fetch(`${API_URL}/products/${editingProduct.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editMenuName,
          description: editMenuDesc,
          price: parseFloat(editMenuPrice),
          stock: parseInt(editMenuStock),
          is_pre_order: editMenuIsPO,
          pre_order_days: editMenuIsPO ? parseInt(editMenuPODays) : 0,
          image_url: editMenuImageURL,
        })
      });
      const data = await res.json();
      if (res.ok) {
        showPremiumAlert("Menu berhasil diperbarui!", "Sukses");
        if (myMerchant) {
          fetchMyProducts(myMerchant.id);
        } else {
          setProducts(products.map(p => p.id === editingProduct.id ? data : p));
        }
        setEditingProduct(null);
      } else {
        setEditMenuError(data.error || "Gagal memperbarui menu.");
      }
    } catch (err) {
      setEditMenuError("Koneksi gagal.");
    } finally {
      setEditMenuLoading(false);
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
    setOrders([]);
    setMyMerchant(null);
    setActiveChatOrder(null);
    setChatMessages([]);
    setNewChatMessage("");
    setSelectedProductForOrder(null);
    setRatingOrder(null);
    setRatingBuyerOrder(null);
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
            {/* Desktop Menu */}
            {token && (
              <div className="hidden md:flex items-center gap-3">
                {user && (
                  <div className="bg-slate-900/60 px-3.5 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2 text-xs text-slate-350 animate-fadeIn">
                    <User className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="font-semibold">{user.name} ({user.role.toUpperCase()})</span>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-855 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-800 flex items-center gap-1 transition-all"
                >
                  <LogOut className="h-3.5 w-3.5" /> Keluar
                </button>
              </div>
            )}

            {!token && (
              <button
                onClick={() => {
                  setIsRegisterMode(false);
                  setShowAuthModal(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95 animate-fadeIn"
              >
                <Lock className="h-3.5 w-3.5" /> Masuk / Daftar
              </button>
            )}

            {/* Mobile Menu Button (Hamburger) */}
            {token && (
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition-all flex items-center justify-center"
                title="Menu"
              >
                {showMobileMenu ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Dropdown Panel */}
        {token && showMobileMenu && (
          <div className="md:hidden bg-slate-950/95 backdrop-blur-md border-t border-slate-900 px-4 py-4 space-y-3 animate-fadeIn flex flex-col">
            {user && (
              <div className="bg-slate-900/60 px-4 py-3 rounded-xl border border-slate-850 flex items-center gap-2.5 text-xs text-slate-200">
                <User className="h-4.5 w-4.5 text-indigo-400 font-bold" />
                <div className="flex flex-col">
                  <span className="font-bold text-white leading-tight">{user.name}</span>
                  <span className="text-[10px] text-slate-400 font-medium uppercase mt-0.5 tracking-wider">{user.role} Account</span>
                </div>
              </div>
            )}
            <button
              onClick={() => {
                setShowMobileMenu(false);
                handleLogout();
              }}
              className="w-full py-3 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 rounded-xl text-xs font-bold transition-all border border-rose-500/20 flex items-center justify-center gap-2"
            >
              <LogOut className="h-4.5 w-4.5" /> Keluar dari Sistem
            </button>
          </div>
        )}
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">

        {/* ==================== 1. LOGIN & REGISTER CONTAINER ==================== */}
        {!token ? (
          !showAuthModal ? (
            <div className="space-y-20 animate-fadeIn max-w-6xl mx-auto py-6">
              {/* MAGNIFICENT HERO SECTION */}
              <div className="relative rounded-3xl overflow-hidden border border-slate-850/60 bg-gradient-to-br from-indigo-950/20 via-slate-900/40 to-emerald-950/10 p-8 md:p-16 text-center space-y-8 shadow-2xl">
                <div className="absolute top-0 left-1/4 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-[10px] font-extrabold uppercase tracking-widest animate-pulse mx-auto">
                  <Sparkles className="h-3.5 w-3.5 animate-bounce" /> Platform UMKM Kuliner Premium
                </div>

                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight max-w-4xl mx-auto bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                  Transformasikan Bisnis Kuliner Anda Bersama UMKM Digital
                </h2>

                <p className="text-xs md:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
                  Ekosistem terintegrasi yang menghubungkan Dapur UMKM Mandiri, Pembeli Setia, dan Kurir Profesional. Dilengkapi peta live GPS jalan raya, obrolan real-time, kustomisasi PO hidangan, & isolasi akun 100% aman.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                  <button
                    onClick={() => {
                      setIsRegisterMode(true);
                      setAuthRole("pembeli");
                      setShowAuthModal(true);
                      setAuthError("");
                      setAuthSuccess("");
                    }}
                    className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                  >
                    <UserPlus className="h-4.5 w-4.5" /> Daftar Akun (Gratis)
                  </button>
                  <button
                    onClick={() => {
                      setIsRegisterMode(false);
                      setShowAuthModal(true);
                      setAuthError("");
                      setAuthSuccess("");
                    }}
                    className="w-full sm:w-auto px-8 py-3.5 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-850 flex items-center justify-center gap-2 hover:border-slate-700"
                  >
                    <Lock className="h-4.5 w-4.5 text-indigo-400" /> Masuk ke Dashboard
                  </button>
                </div>

                <div className="pt-8 border-t border-slate-850/60 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="space-y-1">
                    <span className="block text-lg md:text-xl font-black text-white">15,000+</span>
                    <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Transaksi Sukses</span>
                  </div>
                  <div className="space-y-1">
                    <span className="block text-lg md:text-xl font-black text-white">850+</span>
                    <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Mitra Dapur UMKM</span>
                  </div>
                  <div className="space-y-1">
                    <span className="block text-lg md:text-xl font-black text-white">Rp 2.4 M+</span>
                    <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Omzet Terbantu</span>
                  </div>
                  <div className="space-y-1">
                    <span className="block text-lg md:text-xl font-black text-white">99.8%</span>
                    <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Tingkat Kepuasan</span>
                  </div>
                </div>
              </div>

              {/* FITUR UNGGULAN PREMIUM */}
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-black text-white uppercase tracking-wider">Fitur Unggulan Sistem</h3>
                  <p className="text-xs text-slate-400 max-w-lg mx-auto">Dirancang khusus untuk menghadirkan pengalaman berbisnis dan bertransaksi kuliner terbaik di Indonesia.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-850 hover:border-indigo-500/30 transition-all space-y-4 hover:-translate-y-1 text-left">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                      <Store className="h-5 w-5" />
                    </div>
                    <h5 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Multi-Merchant Catalog</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Pesan kuliner dari mitra UMKM mana pun dengan aturan Single-Merchant Cart Policy demi mencegah kesalahan pesanan ganda yang membingungkan.
                    </p>
                  </div>
                  <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-850 hover:border-indigo-500/30 transition-all space-y-4 hover:-translate-y-1 text-left">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <h5 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Peta Live GPS Jalan Raya</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Lacak posisi real-time kurir pengantar di peta LeafletJS dengan rute yang digambar persis menyusuri jalan raya riil berkat integrasi OSRM Engine.
                    </p>
                  </div>
                  <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-850 hover:border-indigo-500/30 transition-all space-y-4 hover:-translate-y-1 text-left">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                      <Clock className="h-5 w-5" />
                    </div>
                    <h5 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Sistem PO & Kustomisasi</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Layanan Pre-Order terjadwal (1-7 hari) serta pemesanan hidangan kustom dengan topping pilihan dan catatan penjual secara praktis.
                    </p>
                  </div>
                  <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-850 hover:border-indigo-500/30 transition-all space-y-4 hover:-translate-y-1 text-left">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <h5 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Obrolan Real-Time & POD</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Fitur live chat instan pembeli-kurir dengan enkapsulasi state sesi terisolasi, serta wajib unggah foto POD saat penyerahan pesanan selesai.
                    </p>
                  </div>
                </div>
              </div>

              {/* TESTIMONIALS */}
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-black text-white uppercase tracking-wider">Bukti Sosial & Kepuasan Mitra</h3>
                  <p className="text-xs text-slate-400 max-w-lg mx-auto">Dengarkan kisah sukses langsung dari mereka yang telah merasakan kemudahan ekosistem digital kami.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-850 space-y-4 relative flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-1 text-amber-400">
                        <Star className="h-3.5 w-3.5 fill-amber-400" />
                        <Star className="h-3.5 w-3.5 fill-amber-400" />
                        <Star className="h-3.5 w-3.5 fill-amber-400" />
                        <Star className="h-3.5 w-3.5 fill-amber-400" />
                        <Star className="h-3.5 w-3.5 fill-amber-400" />
                      </div>
                      <p className="text-[11px] text-slate-350 leading-relaxed italic text-left">
                        "Semenjak dapur bakso mercon kami bergabung dengan UMKM Digital, pesanan PO melonjak 300%. Sistem foto terkompresi lokal sangat mudah dipahami oleh staf kami yang awam."
                      </p>
                    </div>
                    <div className="pt-4 border-t border-slate-850/60 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black text-xs">BA</div>
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-slate-200 text-xs">Bu Ani Suryani</span>
                        <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">Pemilik Dapur Bakso Mercon</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-850 space-y-4 relative flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-1 text-amber-400">
                        <Star className="h-3.5 w-3.5 fill-amber-400" />
                        <Star className="h-3.5 w-3.5 fill-amber-400" />
                        <Star className="h-3.5 w-3.5 fill-amber-400" />
                        <Star className="h-3.5 w-3.5 fill-amber-400" />
                        <Star className="h-3.5 w-3.5 fill-amber-400" />
                      </div>
                      <p className="text-[11px] text-slate-350 leading-relaxed italic text-left">
                        "Fitur maps jalan raya dan upload bukti pengantaran (POD) di aplikasi ini sangat membantu kerja di lapangan. Pengantaran jadi sangat presisi, aman, dan bebas komplain salah tujuan."
                      </p>
                    </div>
                    <div className="pt-4 border-t border-slate-850/60 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-xs">RK</div>
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-slate-200 text-xs">Rian Kurniawan</span>
                        <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Kurir Pengantar Profesional</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-850 space-y-4 relative flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-1 text-amber-400">
                        <Star className="h-3.5 w-3.5 fill-amber-400" />
                        <Star className="h-3.5 w-3.5 fill-amber-400" />
                        <Star className="h-3.5 w-3.5 fill-amber-400" />
                        <Star className="h-3.5 w-3.5 fill-amber-400" />
                        <Star className="h-3.5 w-3.5 fill-amber-400" />
                      </div>
                      <p className="text-[11px] text-slate-350 leading-relaxed italic text-left">
                        "Rincian checkout sangat transparan (ongkir flat Rp 10.000, PPN 11%, dan biaya aplikasi 2%). Saya juga sangat terbantu dengan pencarian geocoding peta riil saat pin alamat rumah."
                      </p>
                    </div>
                    <div className="pt-4 border-t border-slate-850/60 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black text-xs">LN</div>
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-slate-200 text-xs">Lina Natalia</span>
                        <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">Pembeli Setia Sembako & Roti</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* HARGA / LAYANAN (PRICING) */}
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-black text-white uppercase tracking-wider">Skema Biaya Transparan</h3>
                  <p className="text-xs text-slate-400 max-w-lg mx-auto">Tanpa biaya bulanan tersembunyi. Kami hanya berkembang bersama keberhasilan bisnis kuliner Anda.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto text-left animate-fadeIn">
                  <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-850 space-y-6 relative flex flex-col justify-between hover:border-indigo-500/30 transition-all shadow-xl">
                    <div className="space-y-4">
                      <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 uppercase tracking-widest">Penjual / UMKM</span>
                      <h4 className="text-xl font-black text-white">Mitra Dapur UMKM</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">Kelola produk kuliner, terima pesanan pre-order/instan, kustomisasi menu, dan kelola pendapatan.</p>
                      
                      <div className="flex items-baseline gap-1 pt-2">
                        <span className="text-2xl font-black text-white">Bebas Biaya</span>
                        <span className="text-slate-500 text-[10px] font-bold">/ Pendaftaran</span>
                      </div>

                      <ul className="space-y-2.5 text-[11px] text-slate-350 pt-2 border-t border-slate-850">
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400 shrink-0" /> Komisi aplikasi flat 2% per transaksi sukses</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400 shrink-0" /> Unggah menu lokal terkompresi instan</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400 shrink-0" /> Edit menu & profil restoran live</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400 shrink-0" /> Obrolan langsung dengan kurir & pembeli</li>
                      </ul>
                    </div>

                    <button
                      onClick={() => {
                        setIsRegisterMode(true);
                        setAuthRole("penjual");
                        setShowAuthModal(true);
                        setAuthError("");
                        setAuthSuccess("");
                      }}
                      className="w-full mt-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                    >
                      Daftar Mitra Sekarang
                    </button>
                  </div>

                  <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-850 space-y-6 relative flex flex-col justify-between hover:border-emerald-500/30 transition-all shadow-xl">
                    <div className="space-y-4">
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest">Konsumen / Pembeli</span>
                      <h4 className="text-xl font-black text-white">Akun Konsumen</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">Nikmati beragam hidangan lezat langsung dari dapur produsen lokal dengan sistem PO dinamis.</p>

                      <div className="flex items-baseline gap-1 pt-2">
                        <span className="text-2xl font-black text-white">Rp 10.000</span>
                        <span className="text-slate-500 text-[10px] font-bold">/ Flat Ongkos Kirim</span>
                      </div>

                      <ul className="space-y-2.5 text-[11px] text-slate-350 pt-2 border-t border-slate-850">
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400 shrink-0" /> Peta Live GPS jalan raya dengan Nominatim search</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400 shrink-0" /> Kustomisasi toppings dan catatan penjual</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400 shrink-0" /> Rating & review resto terintegrasi</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400 shrink-0" /> Direct chat terisolasi dengan kurir</li>
                      </ul>
                    </div>

                    <button
                      onClick={() => {
                        setIsRegisterMode(true);
                        setAuthRole("pembeli");
                        setShowAuthModal(true);
                        setAuthError("");
                        setAuthSuccess("");
                      }}
                      className="w-full mt-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                    >
                      Mulai Berbelanja
                    </button>
                  </div>
                </div>
              </div>

              {/* CALL TO ACTION BOTTOM BANNER */}
              <div className="bg-gradient-to-r from-indigo-900/30 to-emerald-950/20 p-8 md:p-12 rounded-3xl border border-indigo-500/10 text-center space-y-6 max-w-4xl mx-auto shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none"></div>
                <h4 className="text-xl md:text-2xl font-black text-white">Siap Digitalkan Bisnis Kuliner Anda?</h4>
                <p className="text-xs text-slate-400 max-w-lg mx-auto">Bergabunglah bersama ratusan mitra UMKM Mandiri lainnya dan hadirkan layanan kuliner premium dengan pelacakan jalan raya riil terintegrasi.</p>
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => {
                      setIsRegisterMode(true);
                      setShowAuthModal(true);
                      setAuthError("");
                      setAuthSuccess("");
                    }}
                    className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95"
                  >
                    Daftar Sekarang Juga
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Floating Auth Modal Overlay */
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm overflow-y-auto flex justify-center p-4 py-8 md:py-12">
              <div className="max-w-md w-full bg-slate-900/90 p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-6 relative animate-fadeIn my-auto">
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-950 border border-slate-850 hover:border-indigo-500 text-slate-400 hover:text-indigo-400 transition-all active:scale-95"
                  title="Tutup"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
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
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] font-bold text-slate-400">PASSWORD</label>
                      {!isRegisterMode && (
                        <button
                          type="button"
                          onClick={handleForgotPasswordClick}
                          className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          Lupa Password?
                        </button>
                      )}
                    </div>
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
                        className="bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none w-full cursor-pointer"
                      >
                        <option value="pembeli">Pembeli</option>
                        <option value="penjual">Penjual</option>
                        <option value="kurir">Kurir</option>
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
                    {/* Official Google Button container */}
                    {!isRawIp && (
                      <div id="google-main-signin-btn" className="w-full min-h-[40px] flex justify-center items-center overflow-hidden"></div>
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
            </div>
          )
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
                        {leafletLoaded && (
                          <div className="space-y-2 mt-2.5">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Cari lokasi dapur Anda..."
                                className="bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none flex-grow"
                                id="reg-search-input"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    const query = (document.getElementById("reg-search-input") as HTMLInputElement)?.value;
                                    handleSearchAddress("reg", query);
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const query = (document.getElementById("reg-search-input") as HTMLInputElement)?.value;
                                  handleSearchAddress("reg", query);
                                }}
                                disabled={isSearchingMap}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-1"
                              >
                                {isSearchingMap ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Cari"}
                              </button>
                            </div>
                            <span className="text-[9px] text-slate-500 italic block">Geser pin pada peta untuk menandai lokasi tepat dapur Anda:</span>
                            <div id="reg-merchant-map" className="h-44 w-full rounded-xl border border-slate-850 bg-slate-950 overflow-hidden relative z-10" />
                          </div>
                        )}
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
                        <div className="relative shrink-0">
                          <img
                            src={myMerchant.image_url || getMerchantPhoto(myMerchant.name)}
                            alt={myMerchant.name}
                            className="w-14 h-14 rounded-xl object-cover border border-slate-800 bg-slate-950"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-white">{myMerchant.name}</h3>
                            <button
                              type="button"
                              onClick={openEditMerchantModal}
                              className="p-1 bg-slate-950 border border-slate-850 hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-400 rounded-lg transition"
                              title="Edit Profil Toko"
                            >
                              <Settings className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                            <span className="bg-slate-950 px-2 py-0.5 rounded text-[10px] font-bold text-indigo-400 border border-slate-850">{myMerchant.category}</span>
                            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-500" /> {formatAddressText(myMerchant.address)}</span>
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

                          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                            <label className="text-xs font-bold text-slate-200 block">Foto Makanan / Minuman</label>
                            
                            {/* File Upload Trigger & Preview Area */}
                            <div className="relative border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 transition-all bg-slate-900/30 flex flex-col items-center justify-center min-h-[110px] text-center">
                              {newMenuImageURL ? (
                                <div className="w-full flex flex-col items-center space-y-2 relative">
                                  <img
                                    src={newMenuImageURL}
                                    alt="Preview"
                                    className="max-h-24 object-cover rounded-lg border border-slate-800 shadow"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setNewMenuImageURL("")}
                                    className="text-[10px] font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/20 transition-all"
                                  >
                                    Hapus Foto
                                  </button>
                                </div>
                              ) : (
                                <label className="cursor-pointer flex flex-col items-center justify-center space-y-1.5 w-full h-full py-2">
                                  <Upload className="h-6 w-6 text-slate-500 animate-pulse" />
                                  <span className="text-[10px] text-slate-300 font-bold">Pilih / Upload Foto Makanan</span>
                                  <span className="text-[9px] text-slate-500">Klik untuk menjelajahi galeri HP / file komputer</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        try {
                                          const compressed = await compressAndConvertToBase64(file);
                                          setNewMenuImageURL(compressed);
                                        } catch (err) {
                                          console.error("Gagal mengompres gambar:", err);
                                          alert("Gagal mengolah file gambar. Coba gambar lain.");
                                        }
                                      }
                                    }}
                                  />
                                </label>
                              )}
                            </div>

                            {/* Preset Fallbacks */}
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Atau pilih preset cepat:</span>
                              <div className="flex flex-wrap gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setNewMenuImageURL("https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=500")}
                                  className="px-2 py-1 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded text-[10px] transition"
                                >
                                  🍗 Ayam
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setNewMenuImageURL("https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&q=80&w=500")}
                                  className="px-2 py-1 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded text-[10px] transition"
                                >
                                  🍜 Mie/Bakso
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setNewMenuImageURL("https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&q=80&w=500")}
                                  className="px-2 py-1 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded text-[10px] transition"
                                >
                                  🍚 Nasi
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setNewMenuImageURL("https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=500")}
                                  className="px-2 py-1 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded text-[10px] transition"
                                >
                                  ☕ Kopi
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setNewMenuImageURL("https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=500")}
                                  className="px-2 py-1 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded text-[10px] transition"
                                >
                                  🍩 Roti/Kue
                                </button>
                              </div>
                            </div>
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
                                      <p className="text-[10px] text-slate-400">Alamat Kirim: {formatAddressText(o.shipping_address)}</p>
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
                                <div className="flex items-center">
                                  <img
                                    src={p.image_url || getProductPhoto(p.name)}
                                    alt={p.name}
                                    className="w-12 h-12 rounded-lg object-cover mr-3.5 shrink-0 border border-slate-800 bg-slate-950"
                                  />
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
                                    <p className="text-[10px] text-indigo-400 font-bold mt-1">Rp {p.price.toLocaleString("id-ID")} • Stok: {p.stock}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => openEditMenuModal(p)}
                                    className="p-2.5 bg-slate-950 border border-slate-850 hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-400 rounded-xl transition"
                                    title="Edit Menu"
                                  >
                                    <Edit3 className="h-4.5 w-4.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMenu(p.id)}
                                    className="p-2.5 bg-slate-950 border border-slate-850 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-xl transition"
                                    title="Hapus Menu"
                                  >
                                    <Trash2 className="h-4.5 w-4.5" />
                                  </button>
                                </div>
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
                        {filteredMerchants.map(merchant => {
                          const mockRating = (4.5 + (merchant.id % 5) * 0.1).toFixed(1);
                          const mockReviews = 12 + (merchant.id * 7) % 30;
                          return (
                            <div
                              key={merchant.id}
                              onClick={() => fetchMerchantProducts(merchant)}
                              className="bg-slate-900/50 p-5 rounded-3xl border border-slate-900 hover:border-slate-800 hover:bg-slate-900/80 cursor-pointer shadow-lg transition-all group flex flex-col justify-between"
                            >
                              <div className="space-y-4">
                                {/* Storefront Cover Photo */}
                                <div className="relative h-40 w-full rounded-2xl overflow-hidden border border-slate-850 bg-slate-950">
                                  <img src={merchant.image_url || getMerchantPhoto(merchant.name)} alt={merchant.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                                  <span className="absolute top-3 right-3 text-[9px] font-bold bg-indigo-600/90 text-white px-2 py-0.5 rounded-lg border border-indigo-400/35 uppercase shadow-md">
                                    {merchant.category}
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center gap-2">
                                    <h5 className="font-bold text-white text-base group-hover:text-indigo-400 transition-colors leading-tight">
                                      {merchant.name}
                                    </h5>
                                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 shrink-0 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                                      <span>★</span>
                                      <span>{mockRating}</span>
                                      <span className="text-slate-500 text-[9px] font-normal">({mockReviews})</span>
                                    </div>
                                  </div>
                                  <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">{merchant.description}</p>
                                </div>
                              </div>
                              <div className="pt-3.5 mt-3 border-t border-slate-850 flex items-center gap-1.5 text-xs text-slate-500">
                                <MapPin className="h-4 w-4 text-slate-450 shrink-0" />
                                <span className="truncate">{formatAddressText(merchant.address)}</span>
                              </div>
                            </div>
                          );
                        })}
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
                      <div className="relative shrink-0">
                        <img
                          src={selectedMerchant.image_url || getMerchantPhoto(selectedMerchant.name)}
                          alt={selectedMerchant.name}
                          className="w-14 h-14 rounded-xl object-cover border border-slate-800 bg-slate-950"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{selectedMerchant.name}</h3>
                        <p className="text-xs text-slate-400 mt-1">{selectedMerchant.description}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                          <span className="bg-slate-950 px-2 py-0.5 rounded text-[10px] font-bold text-indigo-400 border border-slate-850">{selectedMerchant.category}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-400" /> {formatAddressText(selectedMerchant.address)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      <div className="lg:col-span-8 space-y-4">
                        <h4 className="font-bold text-slate-300 text-sm">Katalog Menu</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {products.map(p => (
                            <div key={p.id} className="bg-slate-900/50 p-5 rounded-2xl border border-slate-900 flex flex-col justify-between gap-4 shadow-lg hover:border-slate-800 transition-all group">
                              <div className="space-y-3">
                                {/* Cover Photo Makanan Premium */}
                                <div className="relative h-32 w-full rounded-xl overflow-hidden border border-slate-855 bg-slate-950">
                                  <img src={p.image_url || getProductPhoto(p.name)} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between items-start gap-2">
                                    <h5 className="font-bold text-white text-sm group-hover:text-indigo-400 transition-colors leading-snug">{p.name}</h5>
                                    {p.is_pre_order ? (
                                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] font-bold rounded border border-amber-500/20 whitespace-nowrap">PO {p.pre_order_days} Hari</span>
                                    ) : (
                                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/20 whitespace-nowrap">⚡ Ready</span>
                                    )}
                                  </div>
                                  <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">{p.description}</p>
                                </div>
                              </div>
                              <div className="flex justify-between items-center pt-3 border-t border-slate-900">
                                <span className="text-sm font-extrabold text-white">Rp {p.price.toLocaleString("id-ID")}</span>
                                <button
                                  onClick={() => openCustomizationModal(p)}
                                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
                                >
                                  Pesan
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
                            (() => {
                              const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
                              const deliveryFee = 10000;
                              const tax = Math.round(subtotal * 0.11);
                              const appFee = Math.round(subtotal * 0.02);
                              const totalPrice = subtotal + deliveryFee + tax + appFee;
                              return (
                                <div className="space-y-4 animate-fadeIn">
                                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {cart.map((item, idx) => (
                                      <div key={idx} className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                                        <div className="flex-1 pr-2">
                                          <h6 className="text-xs font-bold text-slate-200 truncate">{item.product.name}</h6>
                                          {item.toppings && (
                                            <span className="text-[9px] text-indigo-400 font-bold block mt-0.5">
                                              Topping: {item.toppings}
                                            </span>
                                          )}
                                          {item.notes && (
                                            <span className="text-[9px] text-slate-500 block italic truncate mt-0.5">
                                              Catatan: "{item.notes}"
                                            </span>
                                          )}
                                          <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                                            {item.qty} x Rp {item.product.price.toLocaleString("id-ID")}
                                          </span>
                                        </div>
                                        <button 
                                          onClick={() => setCart(cart.filter((_, i) => i !== idx))} 
                                          className="p-1 text-slate-500 hover:text-rose-400"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                  
                                  {/* Rincian Biaya Premium */}
                                  <div className="space-y-2 border-t border-slate-850 pt-3 text-xs font-semibold">
                                    <div className="flex justify-between items-center text-slate-450">
                                      <span>Subtotal Makanan:</span>
                                      <span className="text-slate-200">Rp {subtotal.toLocaleString("id-ID")}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-450">
                                      <span>Ongkos Kirim (Flat):</span>
                                      <span className="text-slate-200">Rp {deliveryFee.toLocaleString("id-ID")}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-450">
                                      <span>PPN Resto (11%):</span>
                                      <span className="text-slate-200">Rp {tax.toLocaleString("id-ID")}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-450">
                                      <span>Biaya Layanan (2%):</span>
                                      <span className="text-slate-200">Rp {appFee.toLocaleString("id-ID")}</span>
                                    </div>
                                    <div className="border-t border-slate-800 pt-2 flex justify-between items-center font-extrabold text-[11px] text-indigo-400 uppercase tracking-wide">
                                      <span>TOTAL BAYAR:</span>
                                      <span className="text-white text-xs bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 shadow-sm shadow-indigo-500/5">
                                        Rp {totalPrice.toLocaleString("id-ID")}
                                      </span>
                                    </div>
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
                                    {leafletLoaded && (
                                      <div className="space-y-2 mt-2">
                                        <div className="flex gap-2">
                                          <input
                                            type="text"
                                            placeholder="Cari jalan / kelurahan / kota..."
                                            className="bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none flex-grow"
                                            id="checkout-search-input"
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") {
                                                e.preventDefault();
                                                const query = (document.getElementById("checkout-search-input") as HTMLInputElement)?.value;
                                                handleSearchAddress("checkout", query);
                                              }
                                            }}
                                          />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const query = (document.getElementById("checkout-search-input") as HTMLInputElement)?.value;
                                              handleSearchAddress("checkout", query);
                                            }}
                                            disabled={isSearchingMap}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-1"
                                          >
                                            {isSearchingMap ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Cari"}
                                          </button>
                                        </div>
                                        <span className="text-[9px] text-slate-500 italic block">Geser pin pada peta untuk menandai lokasi tepat pengiriman Anda:</span>
                                        <div id="checkout-map" className="h-44 w-full rounded-xl border border-slate-850 bg-slate-950 overflow-hidden relative z-10" />
                                      </div>
                                    )}
                                    <button 
                                      type="submit" 
                                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all"
                                    >
                                      Checkout
                                    </button>
                                  </form>
                                </div>
                              );
                            })()
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
                            <p className="text-[10px] text-slate-400 truncate">Alamat: {formatAddressText(o.shipping_address)}</p>

                            {/* GPS LIVE TRACKING MAP (Simulasi GPS Seluler Premium) */}
                            {o.status === "dikirim" && (
                              <div className="w-full bg-slate-900/60 border border-indigo-500/20 rounded-xl p-3 space-y-2.5 my-2">
                                <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                                  <span className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5 text-indigo-400 animate-bounce" /> LACAK POSISI KURIR (GPS LIVE)</span>
                                  <span className="text-indigo-400 uppercase">Sedang Diantar</span>
                                </div>
                                
                                {/* Dynamic Peta LeafletJS / CSS simulated path */}
                                {leafletLoaded ? (
                                  <div id={`map-${o.id}`} className="h-44 w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800/80 shadow-inner my-2 z-10" />
                                ) : (
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
                                )}

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
                                        ? "Tiba!" 
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

                            {/* RATING BUTTON FOR BUYER */}
                            {o.status === "selesai" && (
                              (() => {
                                const hasRated = o.merchant_rating && o.merchant_rating > 0;
                                return hasRated ? (
                                  <div className="w-full p-2.5 bg-slate-900/60 border border-slate-850 rounded-xl text-[9px] font-semibold text-slate-400 flex flex-col gap-1 w-full text-left">
                                    <div className="flex justify-between items-center">
                                      <span className="flex items-center gap-1 text-amber-400">★ Resto: {o.merchant_rating}/5</span>
                                      <span className="flex items-center gap-1 text-indigo-400">★ Kurir: {o.courier_rating}/5</span>
                                    </div>
                                    {o.merchant_review && <span className="text-slate-500 italic mt-0.5 truncate block">Ulasan: "{o.merchant_review}"</span>}
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setRatingOrder(o);
                                      setRatingRestoVal(5);
                                      setRatingCourierVal(5);
                                      setRatingReviewText("");
                                    }}
                                    className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold rounded-xl text-[10px] transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95 text-white"
                                  >
                                    <Sparkles className="h-3.5 w-3.5 animate-pulse" /> Beri Bintang & Ulasan Resto / Kurir
                                  </button>
                                );
                              })()
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
                              <p className="text-[10px] text-slate-400">Tujuan: {formatAddressText(o.shipping_address)}</p>
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
                              <p className="text-xs text-slate-400">Tujuan: <span className="text-indigo-400 font-medium">{formatAddressText(o.shipping_address)}</span></p>
                              
                              {/* Courier's Dynamic GPS Live Tracking Map */}
                              {leafletLoaded && (
                                <div id={`map-${o.id}`} className="h-44 w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800/80 shadow-inner my-2.5 z-10" />
                              )}
                              
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
                        <div className="flex items-center gap-2">
                          {o.buyer_rating && o.buyer_rating > 0 ? (
                            <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/20 whitespace-nowrap">
                              ⭐ Pelanggan: {o.buyer_rating}/5
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setRatingBuyerOrder(o);
                                setRatingBuyerVal(5);
                              }}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[9px] font-bold transition-all shadow-md active:scale-95 whitespace-nowrap"
                            >
                              Beri Rating Pelanggan
                            </button>
                          )}
                          {o.proof_of_delivery && (
                            <button
                              onClick={() => setPreviewPhotoUrl(o.proof_of_delivery)}
                              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800 shrink-0"
                              title="Lihat Bukti Foto"
                            >
                              <Image className="h-4 w-4" />
                            </button>
                          )}
                        </div>
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
        <div className="fixed inset-0 z-50 bg-slate-950/90 overflow-y-auto flex justify-center p-4 py-8">
          <div className="max-w-md w-full bg-slate-900 border border-slate-850 rounded-3xl p-5 space-y-4 shadow-2xl relative my-auto">
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
              Foto di atas diunggah langsung oleh kurir Anda saat paket makanan diserah terimakan dengan selamat.
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
                <option value="pembeli">Pembeli</option>
                <option value="penjual">Penjual</option>
                <option value="kurir">Kurir</option>
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
      {/* ==================== PREMIUM OVERLAYS & MODALS ==================== */}
      {/* 1. Custom Glassmorphic Toast/Alert/Confirm Modal */}
      {customAlert && customAlert.show && (
        <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-md overflow-y-auto flex justify-center p-4 py-8">
          <div className="bg-slate-900/95 border border-slate-850 rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl p-6 space-y-4 animate-scaleUp text-slate-100 relative my-auto">
            <div className="flex items-center gap-3 border-b border-slate-850 pb-3">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                <AlertTriangle className="h-5 w-5 animate-pulse text-indigo-405" />
              </div>
              <h4 className="font-bold text-white text-base">{customAlert.title}</h4>
            </div>
            <p className="text-xs text-slate-350 leading-relaxed font-medium">
              {customAlert.message}
            </p>
            <div className="pt-2 flex gap-3">
              {customAlert.cancelText && (
                <button
                  type="button"
                  onClick={customAlert.onCancel}
                  className="flex-grow py-2.5 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-850 rounded-xl text-xs font-bold transition-all"
                >
                  {customAlert.cancelText}
                </button>
              )}
              <button
                type="button"
                onClick={customAlert.onConfirm}
                className="flex-grow py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/25"
              >
                {customAlert.confirmText || "OK"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Product Customization Modal */}
      {selectedProductForOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm overflow-y-auto flex justify-center p-4 py-8">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-5 animate-scaleUp my-auto">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Plus className="h-4.5 w-4.5 text-indigo-400" />
                Kustomisasi Hidangan
              </h4>
              <button
                onClick={() => setSelectedProductForOrder(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Product Details */}
            <div className="flex gap-4 items-start">
              <img src={getProductPhoto(selectedProductForOrder.name)} alt={selectedProductForOrder.name} className="w-24 h-24 rounded-xl object-cover border border-slate-800 shrink-0 bg-slate-950" />
              <div className="space-y-1">
                <h5 className="font-bold text-white text-sm">{selectedProductForOrder.name}</h5>
                <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">{selectedProductForOrder.description}</p>
                <span className="text-indigo-400 font-extrabold text-sm block pt-1">Rp {selectedProductForOrder.price.toLocaleString("id-ID")}</span>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Kuantitas Pesanan:</label>
              <div className="flex items-center gap-4 bg-slate-950 p-2 rounded-xl border border-slate-850 w-fit">
                <button
                  type="button"
                  disabled={orderQty <= 1}
                  onClick={() => setOrderQty(orderQty - 1)}
                  className="p-1.5 hover:bg-slate-900 text-slate-400 hover:text-white rounded-lg disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-bold text-white w-8 text-center">{orderQty}</span>
                <button
                  type="button"
                  disabled={!selectedProductForOrder.is_pre_order && orderQty >= selectedProductForOrder.stock}
                  onClick={() => setOrderQty(orderQty + 1)}
                  className="p-1.5 hover:bg-slate-900 text-slate-400 hover:text-white rounded-lg disabled:opacity-30 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              {!selectedProductForOrder.is_pre_order && (
                <span className="text-[10px] text-slate-500 font-medium">Stok Tersedia: {selectedProductForOrder.stock} porsi</span>
              )}
            </div>

            {/* Toppings Options */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pilih Topping / Isi:</label>
              <div className="grid grid-cols-2 gap-2">
                {["Polos", "Ekstra Keju", "Ekstra Cokelat", "Saus Pedas"].map((topping) => (
                  <label
                    key={topping}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      selectedTopping === topping ? "bg-indigo-600/10 border-indigo-505 text-white font-bold" : "bg-slate-955 border-slate-850 text-slate-400 bg-slate-950"
                    }`}
                  >
                    <input
                      type="radio"
                      name="topping"
                      value={topping}
                      checked={selectedTopping === topping}
                      onChange={() => setSelectedTopping(topping)}
                      className="hidden"
                    />
                    <span className="text-xs">{topping}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Catatan untuk Penjual:</label>
              <textarea
                placeholder="Contoh: pedas sedang ya, tanpa sendok plastik..."
                value={sellerNote}
                onChange={e => setSellerNote(e.target.value)}
                className="bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none w-full resize-none placeholder:text-slate-650"
                rows={2}
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedProductForOrder(null)}
                className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-850 text-slate-450 rounded-xl text-xs font-bold transition-all border border-slate-850"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmAddToCart}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
              >
                Tambah ke Keranjang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Rating & Ulasan Resto + Kurir Modal */}
      {ratingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm overflow-y-auto flex justify-center p-4 py-8">
          <form onSubmit={handleRateOrderSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-5 animate-scaleUp my-auto">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-amber-400 animate-pulse" />
                Beri Bintang & Ulasan
              </h4>
              <button
                type="button"
                onClick={() => setRatingOrder(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Resto Stars */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Rasa Makanan & Dapur Resto:</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingRestoVal(star)}
                    className={`text-2xl transition-all ${ratingRestoVal >= star ? "text-amber-400 scale-110" : "text-slate-650 hover:text-slate-500"}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Review Input */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Ulasan Hidangan Makanan:</label>
              <textarea
                placeholder="Makanan hangat dan rasa sangat nikmat..."
                value={ratingReviewText}
                onChange={e => setRatingReviewText(e.target.value)}
                className="bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none w-full resize-none placeholder:text-slate-650"
                rows={3}
                required
              />
            </div>

            {/* Courier Stars */}
            <div className="space-y-2 pt-2 border-t border-slate-850">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pelayanan Pengantaran Kurir:</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingCourierVal(star)}
                    className={`text-2xl transition-all ${ratingCourierVal >= star ? "text-indigo-400 scale-110" : "text-slate-650 hover:text-slate-500"}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setRatingOrder(null)}
                className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-850 text-slate-450 rounded-xl text-xs font-bold transition-all border border-slate-850"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={ratingSubmitting}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                {ratingSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Kirim Ulasan"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Courier Rating to Buyer Modal */}
      {ratingBuyerOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm overflow-y-auto flex justify-center p-4 py-8">
          <form onSubmit={handleRateBuyerSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-5 animate-scaleUp my-auto">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <User className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
                Nilai Kebaikan Pelanggan
              </h4>
              <button
                type="button"
                onClick={() => setRatingBuyerOrder(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Buyer Stars */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Sopan Santun & Keramahan Penerima Paket:</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingBuyerVal(star)}
                    className={`text-2xl transition-all ${ratingBuyerVal >= star ? "text-emerald-400 scale-110" : "text-slate-655 hover:text-slate-500"}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setRatingBuyerOrder(null)}
                className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-850 text-slate-455 rounded-xl text-xs font-bold transition-all border border-slate-850"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={ratingBuyerSubmitting}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                {ratingBuyerSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Simpan Penilaian"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. Edit Menu Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm overflow-y-auto flex justify-center p-4 py-8">
          <form onSubmit={handleEditMenuSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-4 animate-scaleUp my-auto">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Edit3 className="h-4.5 w-4.5 text-indigo-400" />
                Edit Menu Makanan
              </h4>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {editMenuError && (
              <p className="text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">{editMenuError}</p>
            )}

            <div className="space-y-3.5 max-h-[70vh] overflow-y-auto pr-1">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nama Makanan</label>
                <input
                  type="text"
                  placeholder="e.g. Nasi Goreng Spesial"
                  value={editMenuName}
                  onChange={e => setEditMenuName(e.target.value)}
                  className="bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none w-full"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Deskripsi Hidangan</label>
                <textarea
                  placeholder="Deskripsi bahan, porsi, rasa..."
                  value={editMenuDesc}
                  onChange={e => setEditMenuDesc(e.target.value)}
                  className="bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none w-full resize-none"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    placeholder="Harga"
                    value={editMenuPrice}
                    onChange={e => setEditMenuPrice(e.target.value)}
                    className="bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs text-slate-100 outline-none w-full"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Stok Porsi</label>
                  <input
                    type="number"
                    placeholder="Stok"
                    value={editMenuStock}
                    onChange={e => setEditMenuStock(e.target.value)}
                    className="bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs text-slate-100 outline-none w-full"
                    required
                  />
                </div>
              </div>

              {/* Pre-Order Section */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editMenuIsPO}
                    onChange={e => setEditMenuIsPO(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-slate-800 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-200">Menu Pre-Order (PO)</span>
                </label>
                {editMenuIsPO && (
                  <div className="flex items-center gap-2 pt-1 animate-fadeIn">
                    <span className="text-[10px] text-slate-400">Estimasi PO:</span>
                    <input
                      type="number"
                      value={editMenuPODays}
                      onChange={e => setEditMenuPODays(e.target.value)}
                      className="bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg px-2 py-1 text-xs text-slate-200 w-16 outline-none"
                    />
                    <span className="text-[10px] text-slate-400">Hari</span>
                  </div>
                )}
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Foto Makanan / Minuman</label>
                
                {/* File Upload Trigger & Preview Area */}
                <div className="relative border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 transition-all bg-slate-900/30 flex flex-col items-center justify-center min-h-[110px] text-center">
                  {editMenuImageURL ? (
                    <div className="w-full flex flex-col items-center space-y-2 relative">
                      <img
                        src={editMenuImageURL}
                        alt="Preview"
                        className="max-h-24 object-cover rounded-lg border border-slate-800 shadow"
                      />
                      <button
                        type="button"
                        onClick={() => setEditMenuImageURL("")}
                        className="text-[10px] font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/20 transition-all"
                      >
                        Hapus Foto
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center space-y-1.5 w-full h-full py-2">
                      <Upload className="h-6 w-6 text-slate-500 animate-pulse" />
                      <span className="text-[10px] text-slate-300 font-bold">Pilih / Upload Foto Makanan</span>
                      <span className="text-[9px] text-slate-500">Klik untuk menjelajahi galeri HP / file komputer</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const compressed = await compressAndConvertToBase64(file);
                              setEditMenuImageURL(compressed);
                            } catch (err) {
                              console.error("Gagal mengompres gambar:", err);
                              alert("Gagal mengolah file gambar. Coba gambar lain.");
                            }
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Preset Fallbacks */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Atau pilih preset cepat:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditMenuImageURL("https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=500")}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded text-[10px] transition"
                    >
                      🍗 Ayam
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditMenuImageURL("https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&q=80&w=500")}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded text-[10px] transition"
                    >
                      🍜 Mie/Bakso
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditMenuImageURL("https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&q=80&w=500")}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded text-[10px] transition"
                    >
                      🍚 Nasi
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditMenuImageURL("https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=500")}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded text-[10px] transition"
                    >
                      ☕ Kopi
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditMenuImageURL("https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=500")}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded text-[10px] transition"
                    >
                      🍩 Roti/Kue
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex gap-3 border-t border-slate-850">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-850 text-slate-400 rounded-xl text-xs font-bold transition-all border border-slate-850"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={editMenuLoading}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                {editMenuLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 6. Edit Restaurant Profile Modal */}
      {isEditingMerchant && myMerchant && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm overflow-y-auto flex justify-center p-4 py-8">
          <form onSubmit={handleEditMerchantSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-4 animate-scaleUp my-auto">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Store className="h-4.5 w-4.5 text-indigo-400" />
                Edit Profil Toko UMKM
              </h4>
              <button
                type="button"
                onClick={() => setIsEditingMerchant(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {editStoreError && (
              <p className="text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">{editStoreError}</p>
            )}

            <div className="space-y-3.5 max-h-[70vh] overflow-y-auto pr-1">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nama Toko / UMKM</label>
                <input
                  type="text"
                  placeholder="e.g. Bakso Mercon Bu Ani"
                  value={editStoreName}
                  onChange={e => setEditStoreName(e.target.value)}
                  className="bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none w-full"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Kategori Kuliner</label>
                <select
                  value={editStoreCategory}
                  onChange={e => setEditStoreCategory(e.target.value)}
                  className="bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs text-slate-100 outline-none w-full cursor-pointer"
                >
                  <option value="Kuliner Makanan">Kuliner Makanan</option>
                  <option value="Camilan & Jajanan">Camilan & Jajanan</option>
                  <option value="Minuman Dingin/Hangat">Minuman Dingin/Hangat</option>
                  <option value="Kue & Roti Manis">Kue & Roti Manis</option>
                  <option value="Bahan Pokok & Sembako">Bahan Pokok & Sembako</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Alamat Dapur / Toko</label>
                <input
                  type="text"
                  placeholder="e.g. Jl. Anggrek No. 12, Sunter"
                  value={editStoreAddress}
                  onChange={e => setEditStoreAddress(e.target.value)}
                  className="bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none w-full"
                  required
                />
                {leafletLoaded && (
                  <div className="space-y-2 mt-2.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Cari lokasi dapur Anda..."
                        className="bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none flex-grow"
                        id="edit-search-input"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const query = (document.getElementById("edit-search-input") as HTMLInputElement)?.value;
                            handleSearchAddress("edit", query);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const query = (document.getElementById("edit-search-input") as HTMLInputElement)?.value;
                          handleSearchAddress("edit", query);
                        }}
                        disabled={isSearchingMap}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-1"
                      >
                        {isSearchingMap ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Cari"}
                      </button>
                    </div>
                    <span className="text-[9px] text-slate-500 italic block">Geser pin pada peta untuk menandai lokasi tepat dapur Anda:</span>
                    <div id="edit-merchant-map" className="h-44 w-full rounded-xl border border-slate-850 bg-slate-950 overflow-hidden relative z-10" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Deskripsi Singkat Toko</label>
                <textarea
                  placeholder="Jelaskan keistimewaan rasa kuliner atau jam buka..."
                  value={editStoreDesc}
                  onChange={e => setEditStoreDesc(e.target.value)}
                  className="bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none w-full resize-none"
                  rows={2}
                />
              </div>

              {/* Restaurant Storefront Photo Upload Area */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Foto Toko / Restoran</label>
                
                {/* File Upload Trigger & Preview Area */}
                <div className="relative border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 transition-all bg-slate-900/30 flex flex-col items-center justify-center min-h-[110px] text-center">
                  {editStoreImageURL ? (
                    <div className="w-full flex flex-col items-center space-y-2 relative">
                      <img
                        src={editStoreImageURL}
                        alt="Preview Resto"
                        className="max-h-24 object-cover rounded-lg border border-slate-800 shadow"
                      />
                      <button
                        type="button"
                        onClick={() => setEditStoreImageURL("")}
                        className="text-[10px] font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/20 transition-all"
                      >
                        Hapus Foto
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center space-y-1.5 w-full h-full py-2">
                      <Upload className="h-6 w-6 text-slate-500 animate-pulse" />
                      <span className="text-[10px] text-slate-300 font-bold">Pilih / Upload Foto Toko</span>
                      <span className="text-[9px] text-slate-500">Klik untuk menjelajahi galeri HP / file komputer</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const compressed = await compressAndConvertToBase64(file);
                              setEditStoreImageURL(compressed);
                            } catch (err) {
                              console.error("Gagal mengompres gambar:", err);
                              alert("Gagal mengolah file gambar. Coba gambar lain.");
                            }
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Preset Facade Fallbacks */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Atau pilih preset cepat:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditStoreImageURL("https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=500")}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded text-[10px] transition"
                    >
                      🍛 Padang
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditStoreImageURL("https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=500")}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded text-[10px] transition"
                    >
                      🍜 Kedai Makan
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditStoreImageURL("https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=500")}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded text-[10px] transition"
                    >
                      ☕ Cafe Modern
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex gap-3 border-t border-slate-850">
              <button
                type="button"
                onClick={() => setIsEditingMerchant(false)}
                className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-850 text-slate-400 rounded-xl text-xs font-bold transition-all border border-slate-850"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={editStoreLoading}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                {editStoreLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Simpan Profil"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
