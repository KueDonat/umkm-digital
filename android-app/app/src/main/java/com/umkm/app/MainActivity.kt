package com.umkm.app

import android.os.Bundle
import android.content.Intent
import android.net.Uri
import androidx.compose.ui.platform.LocalContext
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog

// --- MODEL DATA MOBILE PREMIUM ---
data class ProductMobile(
    val id: Int, 
    val name: String, 
    val price: Long, 
    val stock: Int,
    val isPreOrder: Boolean = false,
    val preOrderDays: Int = 0
)

data class OrderMobile(
    val id: Int, 
    val buyer: String, 
    val address: String, 
    val item: String, 
    val status: String,
    val proofOfDelivery: String? = null
)

data class ChatMessageMobile(
    val id: Int,
    val orderId: Int,
    val senderId: Int, // 1 = Pembeli, 2 = Kurir
    val senderName: String,
    val message: String,
    val timestamp: String
)

class MainActivity : ComponentActivity() {
    private val googleLoginResult = mutableStateOf<Triple<String, String, String>?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        handleDeepLink(intent)
        setContent {
            MaterialTheme(
                colorScheme = darkColorScheme(
                    primary = Color(0xFF6366F1), // Indigo Premium
                    secondary = Color(0xFF10B981), // Emerald
                    background = Color(0xFF0B0F19), // Deep Cyber Dark
                    surface = Color(0xFF111827)
                )
            ) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    AppNavigation(googleLoginResult)
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleDeepLink(intent)
    }

    private fun handleDeepLink(intent: Intent?) {
        val intentData = intent?.data
        if (intentData != null && intentData.scheme == "umkm-app" && intentData.host == "login-success") {
            val email = intentData.getQueryParameter("email") ?: ""
            val name = intentData.getQueryParameter("name") ?: ""
            val role = intentData.getQueryParameter("role") ?: "pembeli"
            if (email.isNotEmpty() && name.isNotEmpty()) {
                googleLoginResult.value = Triple(email, name, role)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppNavigation(googleLoginResultState: State<Triple<String, String, String>?>) {
    val googleResult by googleLoginResultState

    // State Otentikasi Utama
    var isLoggedIn by remember { mutableStateOf(false) }
    var selectedRole by remember { mutableStateOf("kurir") } // Default ke kurir untuk memudahkan testing fitur baru
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    // React to Google Login Deep Link callback
    LaunchedEffect(googleResult) {
        googleResult?.let { (_, name, role) ->
            username = name
            selectedRole = role
            isLoggedIn = true
        }
    }

    // --- STATES FITUR BARU LIVE-CHAT & BUKTI FOTO ---
    var activeChatOrder by remember { mutableStateOf<OrderMobile?>(null) }
    var activePodOrder by remember { mutableStateOf<OrderMobile?>(null) }
    var previewPhotoUrl by remember { mutableStateOf<String?>(null) }

    // --- STATES SIMULASI PREMIUM GOOGLE SIGN-IN ---
    var showGoogleModal by remember { mutableStateOf(false) }

    // Simpan data dinamis
    val products = remember {
        mutableStateListOf(
            ProductMobile(1, "Kopi Gayo Arabica Premium", 85000, 12, isPreOrder = false),
            ProductMobile(2, "Keripik Tempe Renyah Bandung", 18000, 45, isPreOrder = true, preOrderDays = 2),
            ProductMobile(3, "Sambal Bawang Pedas Rumahan", 25000, 4, isPreOrder = true, preOrderDays = 3),
            ProductMobile(4, "Brownies Panggang Sekat Premium", 120000, 5, isPreOrder = true, preOrderDays = 1)
        )
    }

    val orders = remember {
        mutableStateListOf(
            OrderMobile(201, "Budi Santoso", "Jl. Merdeka No. 45, Delta Silicon", "Kopi Gayo (2x)", "Diproses"),
            OrderMobile(202, "Siti Rahma", "Perum Indah Blok C3 No. 12, Cikarang", "Keripik Tempe (5x)", "Sedang Diantar"),
            OrderMobile(203, "Alif Pratama", "Kost Asri Kamar 12, Delta Silicon II", "Sambal Bawang (1x)", "Selesai", "Paket diserahkan langsung ke Pembeli")
        )
    }

    val chatMessages = remember {
        mutableStateListOf(
            ChatMessageMobile(1, 202, 1, "Siti Rahma (Pembeli)", "Halo pak kurir, posisinya sudah sampai mana ya?", "21:40"),
            ChatMessageMobile(2, 202, 2, "Kurir Go-UMKM", "Saya baru mengambil makanan di Dapur UMKM, Kak. Sekarang sedang meluncur ke arah perumahan.", "21:41"),
            ChatMessageMobile(3, 202, 1, "Siti Rahma (Pembeli)", "Baik pak kurir, kalau sudah sampai tolong digantung di gagang pintu saja ya. Terima kasih!", "21:42"),
            ChatMessageMobile(4, 202, 2, "Kurir Go-UMKM", "Siap Kak, nanti kalau sudah sampai saya fotokan sebagai bukti pengiriman.", "21:43")
        )
    }

    // --- RENDERING MODAL DIALOGS ---
    // 1. Live Chat Modal Sheet
    activeChatOrder?.let { order ->
        ChatDialog(
            order = order,
            role = selectedRole,
            chatMessages = chatMessages,
            onSendMessage = { text ->
                val newMsg = ChatMessageMobile(
                    id = chatMessages.size + 1,
                    orderId = order.id,
                    senderId = if (selectedRole == "pembeli") 1 else 2,
                    senderName = if (selectedRole == "pembeli") "${order.buyer} (Pembeli)" else "Kurir Go-UMKM",
                    message = text,
                    timestamp = "21:47"
                )
                chatMessages.add(newMsg)
            },
            onDismiss = { activeChatOrder = null }
        )
    }

    // 2. POD Proof of Delivery Dialog
    activePodOrder?.let { order ->
        PodDialog(
            order = order,
            onSubmitPod = { photo ->
                // Cari index order dan update status serta bukti foto
                val idx = orders.indexOfFirst { it.id == order.id }
                if (idx != -1) {
                    orders[idx] = orders[idx].copy(
                        status = "Selesai",
                        proofOfDelivery = photo
                    )
                }
                activePodOrder = null
            },
            onDismiss = { activePodOrder = null }
        )
    }

    // 3. Preview Proof Photo Dialog
    previewPhotoUrl?.let { photo ->
        PhotoPreviewDialog(
            photo = photo,
            onDismiss = { previewPhotoUrl = null }
        )
    }

    // 4. Google Account Selector Dialog
    if (showGoogleModal) {
        GoogleAccountSelectorDialog(
            onAccountSelected = { email, name, role ->
                username = name
                selectedRole = role
                isLoggedIn = true
                showGoogleModal = false
            },
            onDismiss = { showGoogleModal = false }
        )
    }

    if (!isLoggedIn) {
        // --- 1. SCREEN LOGIN TERPADU MOBILE ---
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp)
                .background(Color(0xFF0B0F19)),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .background(
                        Brush.linearGradient(colors = listOf(Color(0xFF6366F1), Color(0xFF10B981))),
                        RoundedCornerShape(18.dp)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.ShoppingCart,
                    contentDescription = "Logo",
                    tint = Color.White,
                    modifier = Modifier.size(32.dp)
                )
            }
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "GO-UMKM PLATFORM",
                fontSize = 24.sp,
                fontWeight = FontWeight.ExtraBold,
                color = Color.White,
                textAlign = TextAlign.Center
            )
            Text(
                text = "Aplikasi Mobile Multi-Peran & PO Hub",
                fontSize = 12.sp,
                color = Color.Gray,
                modifier = Modifier.padding(bottom = 32.dp)
            )

            // Form Input
            OutlinedTextField(
                value = username,
                onValueChange = { username = it },
                label = { Text("Email / Username") },
                modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                colors = TextFieldDefaults.outlinedTextFieldColors(
                    focusedBorderColor = Color(0xFF6366F1),
                    unfocusedBorderColor = Color.Gray
                ),
                singleLine = true
            )

            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Password") },
                visualTransformation = PasswordVisualTransformation(),
                modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp),
                colors = TextFieldDefaults.outlinedTextFieldColors(
                    focusedBorderColor = Color(0xFF6366F1),
                    unfocusedBorderColor = Color.Gray
                ),
                singleLine = true
            )

            // Pilihan Role
            Text(
                text = "MASUK SEBAGAI PERAN:",
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF818CF8),
                modifier = Modifier.align(Alignment.Start).padding(bottom = 8.dp)
            )

            Row(
                modifier = Modifier.fillMaxWidth().padding(bottom = 32.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                val roles = listOf("penjual", "pembeli", "kurir", "distributor")
                roles.forEach { role ->
                    Button(
                        onClick = { selectedRole = role },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (selectedRole == role) Color(0xFF6366F1) else Color(0xFF1E293B)
                        ),
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                        modifier = Modifier.weight(1f).padding(horizontal = 2.dp),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            text = role.replaceFirstChar { it.uppercase() },
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                }
            }

            // Tombol Login
            Button(
                onClick = {
                    if (username.isEmpty()) {
                        username = "Mitra_GoUMKM"
                    }
                    isLoggedIn = true
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4F46E5))
            ) {
                Text("MASUK KE DASHBOARD", fontWeight = FontWeight.Bold, color = Color.White)
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Pemisah ATAU
            Row(
                modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(modifier = Modifier.weight(1f).height(1.dp).background(Color.Gray.copy(alpha = 0.3f)))
                Text(
                    text = "ATAU",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.Gray,
                    modifier = Modifier.padding(horizontal = 16.dp)
                )
                Box(modifier = Modifier.weight(1f).height(1.dp).background(Color.Gray.copy(alpha = 0.3f)))
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Tombol Login Google Premium
            Button(
                onClick = {
                    showGoogleModal = true
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
                    .border(BorderStroke(1.dp, Color.Gray.copy(alpha = 0.4f)), RoundedCornerShape(12.dp)),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0F172A))
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    // Google colored G icon represent
                    Box(
                        modifier = Modifier
                            .size(20.dp)
                            .background(Color.White, RoundedCornerShape(4.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("G", fontWeight = FontWeight.Bold, color = Color(0xFF4285F4), fontSize = 14.sp)
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Text("Masuk dengan Google", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 14.sp)
                }
            }
        }
    } else {
        // --- 2. LAYAR DASHBOARD ROLE-BASED ---
        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Column {
                            Text(
                                text = "Halo, $username!",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            Text(
                                text = "Peran: ${selectedRole.uppercase()} MOBILE",
                                fontSize = 10.sp,
                                color = Color(0xFF818CF8),
                                fontWeight = FontWeight.Bold
                            )
                        }
                    },
                    actions = {
                        IconButton(onClick = {
                            isLoggedIn = false
                            username = ""
                            password = ""
                        }) {
                            Icon(
                                imageVector = Icons.Default.ExitToApp,
                                contentDescription = "Logout",
                                tint = Color.LightGray
                            )
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF111827))
                )
            }
        ) { paddingValues ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .background(Color(0xFF0B0F19))
            ) {
                when (selectedRole) {
                    "penjual" -> SellerScreen(products, orders)
                    "pembeli" -> BuyerScreen(
                        products = products,
                        orders = orders,
                        onOpenChat = { activeChatOrder = it },
                        onPreviewPhoto = { previewPhotoUrl = it }
                    )
                    "kurir" -> CourierScreen(
                        orders = orders,
                        onOpenChat = { activeChatOrder = it },
                        onOpenPod = { activePodOrder = it },
                        onPreviewPhoto = { previewPhotoUrl = it }
                    )
                    "distributor" -> DistributorScreen()
                }
            }
        }
    }
}

// --- SCREEN PERAN 1: PENJUAL (UMKM SELLER) ---
@Composable
fun SellerScreen(products: List<ProductMobile>, orders: List<OrderMobile>) {
    LazyColumn(modifier = Modifier.padding(16.dp)) {
        item {
            Text("Dasbor Penjual (Pemilik UMKM)", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White, modifier = Modifier.padding(bottom = 16.dp))
            
            // Ringkasan Stats
            Row(modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Card(modifier = Modifier.weight(1f), colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B))) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("Katalog", fontSize = 10.sp, color = Color.Gray)
                        Text("${products.size} Item", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    }
                }
                Card(modifier = Modifier.weight(1f), colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B))) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("Proses", fontSize = 10.sp, color = Color.Gray)
                        Text("${orders.filter { it.status == "Diproses" }.size} Order", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    }
                }
            }

            Text("Katalog Produk Anda", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.LightGray, modifier = Modifier.padding(bottom = 8.dp))
        }

        // List Produk
        items(products) { product ->
            Card(
                modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B))
            ) {
                Row(modifier = Modifier.padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(product.name, fontWeight = FontWeight.Bold, color = Color.White, fontSize = 14.sp)
                            Spacer(modifier = Modifier.width(6.dp))
                            if (product.isPreOrder) {
                                Card(
                                    colors = CardDefaults.cardColors(containerColor = Color(0xFF78350F))
                                ) {
                                    Text(
                                        "PO: ${product.preOrderDays} H",
                                        color = Color(0xFFFCD34D),
                                        fontSize = 8.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                                    )
                                }
                            }
                        }
                        Text("Stok: ${product.stock} pcs", color = Color.Gray, fontSize = 12.sp)
                    }
                    Text("Rp ${product.price}", fontWeight = FontWeight.Bold, color = Color(0xFF10B981), fontSize = 14.sp)
                }
            }
        }
    }
}

// --- SCREEN PERAN 2: PEMBELI (CUSTOMER STOREFRONT WITH CHAT & POD PREVIEW) ---
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BuyerScreen(
    products: List<ProductMobile>,
    orders: List<OrderMobile>,
    onOpenChat: (OrderMobile) -> Unit,
    onPreviewPhoto: (String) -> Unit
) {
    var cartCount by remember { mutableStateOf(0) }
    var selectedTab by remember { mutableStateOf(0) } // 0 = Toko Menu, 1 = Lacak Pesanan

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        // Toko Header & Cart info
        Row(
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Dapur Kuliner UMKM", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
            Badge(containerColor = Color(0xFF10B981)) {
                Text("$cartCount Item", color = Color.White, modifier = Modifier.padding(6.dp), fontSize = 10.sp)
            }
        }

        // Custom Tab Selector
        Row(
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = { selectedTab = 0 },
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (selectedTab == 0) Color(0xFF6366F1) else Color(0xFF1E293B)
                ),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("Beli Kuliner", fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
            Button(
                onClick = { selectedTab = 1 },
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (selectedTab == 1) Color(0xFF6366F1) else Color(0xFF1E293B)
                ),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("Lacak Pesanan (${orders.size})", fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
        }

        if (selectedTab == 0) {
            // CATALOG MENU
            LazyColumn {
                items(products) { product ->
                    Card(
                        modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B))
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text(product.name, fontWeight = FontWeight.Bold, color = Color.White, fontSize = 15.sp)
                                if (product.isPreOrder) {
                                    Card(
                                        colors = CardDefaults.cardColors(containerColor = Color(0xFF78350F)),
                                        shape = RoundedCornerShape(4.dp)
                                    ) {
                                        Text(
                                            "PO: ${product.preOrderDays} Hari",
                                            color = Color(0xFFFCD34D),
                                            fontSize = 9.sp,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                        )
                                    }
                                } else {
                                    Card(
                                        colors = CardDefaults.cardColors(containerColor = Color(0xFF065F46)),
                                        shape = RoundedCornerShape(4.dp)
                                    ) {
                                        Text(
                                            "⚡ Ready",
                                            color = Color(0xFF34D399),
                                            fontSize = 9.sp,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                        )
                                    }
                                }
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("Sisa Stok: ${product.stock} pcs", color = Color.Gray, fontSize = 11.sp)
                            Spacer(modifier = Modifier.height(12.dp))
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                Text("Rp ${product.price}", fontWeight = FontWeight.ExtraBold, color = Color(0xFF10B981), fontSize = 15.sp)
                                Button(
                                    onClick = { cartCount++ },
                                    shape = RoundedCornerShape(8.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1))
                                ) {
                                    Text("Beli", fontSize = 11.sp)
                                }
                            }
                        }
                    }
                }
            }
        } else {
            // ORDER HISTORY & TRACKING
            LazyColumn {
                items(orders) { order ->
                    Card(
                        modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B))
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("ID: #${order.id}", fontWeight = FontWeight.Bold, color = Color.Gray, fontSize = 11.sp)
                                val statusColor = when (order.status) {
                                    "Pending" -> Color(0xFFF59E0B)
                                    "Diproses" -> Color(0xFF6366F1)
                                    "Sedang Diantar" -> Color(0xFF8B5CF6)
                                    else -> Color(0xFF10B981)
                                }
                                Text(
                                    text = order.status,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = statusColor,
                                    fontSize = 11.sp
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(order.item, fontWeight = FontWeight.Bold, color = Color.White, fontSize = 15.sp)
                            Text("Alamat Kirim: ${order.address}", color = Color.LightGray, fontSize = 12.sp)
                            
                            if (order.status == "Sedang Diantar") {
                                GpsTrackingMap(order.id)
                            }
                            
                            Spacer(modifier = Modifier.height(12.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                // Chat button
                                if (order.status == "Sedang Diantar") {
                                    Button(
                                        onClick = { onOpenChat(order) },
                                        modifier = Modifier.weight(1f),
                                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF312E81)),
                                        shape = RoundedCornerShape(8.dp),
                                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 6.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Send,
                                            contentDescription = "Chat",
                                            tint = Color.White,
                                            modifier = Modifier.size(14.dp)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("Chat Kurir", fontSize = 11.sp, color = Color.White)
                                    }
                                }

                                // Proof preview button
                                if (order.status == "Selesai" && order.proofOfDelivery != null) {
                                    Button(
                                        onClick = { onPreviewPhoto(order.proofOfDelivery) },
                                        modifier = Modifier.fillMaxWidth(),
                                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF065F46)),
                                        shape = RoundedCornerShape(8.dp),
                                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 6.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.CheckCircle,
                                            contentDescription = "POD",
                                            tint = Color.White,
                                            modifier = Modifier.size(14.dp)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("Lihat Bukti Foto Paket Sampai", fontSize = 11.sp, color = Color.White)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// --- SCREEN PERAN 3: KURIR (COURIER SHIPMENT WITH MANDATORY POD & LIVE-CHAT) ---
@Composable
fun CourierScreen(
    orders: List<OrderMobile>,
    onOpenChat: (OrderMobile) -> Unit,
    onOpenPod: (OrderMobile) -> Unit,
    onPreviewPhoto: (String) -> Unit
) {
    var selectedTab by remember { mutableStateOf(0) } // 0 = Tugas Aktif, 1 = Riwayat Berhasil

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text(
            "Tugas Pengantaran Kurir",
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold,
            color = Color.White,
            modifier = Modifier.padding(bottom = 12.dp)
        )

        // Tabs
        Row(
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = { selectedTab = 0 },
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (selectedTab == 0) Color(0xFF6366F1) else Color(0xFF1E293B)
                ),
                shape = RoundedCornerShape(8.dp)
            ) {
                val activeCount = orders.filter { it.status == "Sedang Diantar" }.size
                Text("Tugas Aktif ($activeCount)", fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
            Button(
                onClick = { selectedTab = 1 },
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (selectedTab == 1) Color(0xFF6366F1) else Color(0xFF1E293B)
                ),
                shape = RoundedCornerShape(8.dp)
            ) {
                val completedCount = orders.filter { it.status == "Selesai" }.size
                Text("Riwayat Berhasil ($completedCount)", fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
        }

        if (selectedTab == 0) {
            val activeDeliveries = orders.filter { it.status == "Sedang Diantar" }
            LazyColumn(modifier = Modifier.fillMaxSize()) {
                if (activeDeliveries.isEmpty()) {
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B))
                        ) {
                            Text(
                                "Semua kiriman beres! Menunggu tugas baru dari sistem.",
                                color = Color.Gray,
                                fontSize = 12.sp,
                                modifier = Modifier.padding(24.dp),
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                } else {
                    items(activeDeliveries) { order ->
                        Card(
                            modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B))
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text("ID: #${order.id}", fontWeight = FontWeight.Bold, color = Color.Gray, fontSize = 11.sp)
                                    Text(order.status, fontWeight = FontWeight.Bold, color = Color(0xFF6366F1), fontSize = 11.sp)
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(order.item, fontWeight = FontWeight.Bold, color = Color.White, fontSize = 15.sp)
                                Text("Penerima: ${order.buyer}", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                Text("Alamat: ${order.address}", color = Color.LightGray, fontSize = 12.sp)
                                
                                Spacer(modifier = Modifier.height(12.dp))

                                // Chat Button
                                Button(
                                    onClick = { onOpenChat(order) },
                                    modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF312E81)),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Send,
                                        contentDescription = "Chat",
                                        tint = Color.White,
                                        modifier = Modifier.size(14.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Buka Obrolan Chat dengan Pembeli", fontSize = 11.sp, color = Color.White)
                                }

                                // Mark Done with POD Photo
                                Button(
                                    onClick = { onOpenPod(order) },
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.CheckCircle,
                                        contentDescription = "Selesai",
                                        tint = Color.White,
                                        modifier = Modifier.size(14.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Selesaikan & Upload Bukti Foto", fontWeight = FontWeight.Bold, fontSize = 11.sp)
                                }
                            }
                        }
                    }
                }
            }
        } else {
            val completedDeliveries = orders.filter { it.status == "Selesai" }
            LazyColumn(modifier = Modifier.fillMaxSize()) {
                if (completedDeliveries.isEmpty()) {
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B))
                        ) {
                            Text(
                                "Belum ada riwayat pengiriman yang selesai.",
                                color = Color.Gray,
                                fontSize = 12.sp,
                                modifier = Modifier.padding(24.dp),
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                } else {
                    items(completedDeliveries) { order ->
                        Card(
                            modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B))
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text("ID: #${order.id}", fontWeight = FontWeight.Bold, color = Color.Gray, fontSize = 11.sp)
                                    Text("BERHASIL", fontWeight = FontWeight.Bold, color = Color(0xFF10B981), fontSize = 11.sp)
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(order.item, fontWeight = FontWeight.Bold, color = Color.White, fontSize = 15.sp)
                                Text("Penerima: ${order.buyer}", color = Color.LightGray, fontSize = 12.sp)
                                
                                if (order.proofOfDelivery != null) {
                                    Spacer(modifier = Modifier.height(12.dp))
                                    Button(
                                        onClick = { onPreviewPhoto(order.proofOfDelivery) },
                                        modifier = Modifier.fillMaxWidth(),
                                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E293B)),
                                        shape = RoundedCornerShape(8.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.CheckCircle,
                                            contentDescription = "Bukti Foto",
                                            tint = Color(0xFF10B981),
                                            modifier = Modifier.size(14.dp)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("Lihat Bukti Foto Pengiriman", fontSize = 11.sp, color = Color.White)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// --- SCREEN PERAN 4: DISTRIBUTOR (RAW SUPPLY CHAIN) ---
@Composable
fun DistributorScreen() {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Penyuplai Bahan Baku (Distributor)", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White, modifier = Modifier.padding(bottom = 16.dp))

        val supplies = listOf(
            Pair("Biji Kopi Gayo Mentah", "150 kg"),
            Pair("Tempe Mentah Kedelai", "300 papan"),
            Pair("Cabai Rawit Merah Segar", "80 kg"),
            Pair("Standing Pouch Premium", "1000 pcs")
        )

        Text("Persediaan Bahan Baku Grosir", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.LightGray, modifier = Modifier.padding(bottom = 8.dp))
        supplies.forEach { item ->
            Card(
                modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B))
            ) {
                Row(modifier = Modifier.padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(item.first, fontWeight = FontWeight.Bold, color = Color.White)
                    Text(item.second, fontWeight = FontWeight.Bold, color = Color(0xFF10B981))
                }
            }
        }
    }
}

// ==================== DIALOG COMPONENT: LIVE CHAT COORDINATION ====================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatDialog(
    order: OrderMobile,
    role: String,
    chatMessages: List<ChatMessageMobile>,
    onSendMessage: (String) -> Unit,
    onDismiss: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
            border = BorderStroke(1.dp, Color(0xFF6366F1).copy(alpha = 0.3f)),
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Chat Koordinasi #${order.id}",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            text = "Hubungi: ${if (role == "kurir") "Pembeli (${order.buyer})" else "Kurir Antaran"}",
                            fontSize = 11.sp,
                            color = Color(0xFF818CF8),
                            fontWeight = FontWeight.Bold
                        )
                    }
                    IconButton(
                        onClick = onDismiss,
                        colors = IconButtonDefaults.iconButtonColors(containerColor = Color(0xFF1E293B))
                    ) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = "Close", tint = Color.LightGray)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Chat Log
                var textState by remember { mutableStateOf("") }
                val filteredMessages = chatMessages.filter { it.orderId == order.id }

                LazyColumn(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                        .background(Color(0xFF070B14), RoundedCornerShape(16.dp))
                        .padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    if (filteredMessages.isEmpty()) {
                        item {
                            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                Text(
                                    "Belum ada pesan obrolan. Kirim pesan pertama Anda!",
                                    color = Color.Gray,
                                    fontSize = 11.sp,
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier.padding(24.dp)
                                )
                            }
                        }
                    } else {
                        items(filteredMessages) { msg ->
                            val isMe = (role == "pembeli" && msg.senderId == 1) || (role == "kurir" && msg.senderId == 2)
                            val bubbleColor = if (isMe) Color(0xFF6366F1) else Color(0xFF1E293B)
                            val alignment = if (isMe) Alignment.End else Alignment.Start
                            val shape = if (isMe) RoundedCornerShape(12.dp, 0.dp, 12.dp, 12.dp) else RoundedCornerShape(0.dp, 12.dp, 12.dp, 12.dp)

                            Column(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalAlignment = alignment
                            ) {
                                Text(
                                    text = msg.senderName,
                                    fontSize = 8.sp,
                                    color = Color.Gray,
                                    modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                                )
                                Card(
                                    shape = shape,
                                    colors = CardDefaults.cardColors(containerColor = bubbleColor),
                                    modifier = Modifier.widthIn(max = 220.dp)
                                ) {
                                    Column(modifier = Modifier.padding(10.dp)) {
                                        Text(
                                            text = msg.message,
                                            fontSize = 12.sp,
                                            color = Color.White
                                        )
                                        Box(
                                            modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                                            contentAlignment = Alignment.BottomEnd
                                        ) {
                                            Text(
                                                text = msg.timestamp,
                                                fontSize = 8.sp,
                                                color = Color.LightGray
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Input Field
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = textState,
                        onValueChange = { textState = it },
                        placeholder = { Text("Tulis pesan...", fontSize = 12.sp, color = Color.Gray) },
                        modifier = Modifier
                            .weight(1f)
                            .padding(end = 8.dp),
                        colors = TextFieldDefaults.outlinedTextFieldColors(
                            focusedBorderColor = Color(0xFF6366F1),
                            unfocusedBorderColor = Color.Gray
                        ),
                        singleLine = true
                    )
                    IconButton(
                        onClick = {
                            if (textState.isNotBlank()) {
                                onSendMessage(textState)
                                textState = ""
                            }
                        },
                        colors = IconButtonDefaults.iconButtonColors(containerColor = Color(0xFF6366F1))
                    ) {
                        Icon(
                            imageVector = Icons.Default.Send,
                            contentDescription = "Kirim",
                            tint = Color.White
                        )
                    }
                }
            }
        }
    }
}

// ==================== DIALOG COMPONENT: PROOF OF DELIVERY (POD) ====================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PodDialog(
    order: OrderMobile,
    onSubmitPod: (String) -> Unit,
    onDismiss: () -> Unit
) {
    var selectedPreset by remember { mutableStateOf("") }
    var customUrl by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf("") }

    val presets = listOf(
        Pair("Paket diterima di pagar rumah", "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=300"),
        Pair("Diserahkan langsung ke Pembeli", "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&q=80&w=300"),
        Pair("Paket digantung di gagang pintu", "https://images.unsplash.com/photo-1590247813693-5541d1c609fd?auto=format&fit=crop&q=80&w=300")
    )

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
            border = BorderStroke(1.dp, Color(0xFF10B981).copy(alpha = 0.3f)),
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = "POD",
                            tint = Color(0xFF10B981),
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Konfirmasi Foto (POD)",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                    IconButton(
                        onClick = onDismiss,
                        colors = IconButtonDefaults.iconButtonColors(containerColor = Color(0xFF1E293B))
                    ) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = "Close", tint = Color.LightGray)
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = "Kurir wajib melampirkan bukti foto untuk menandai pengantaran selesai.",
                    fontSize = 12.sp,
                    color = Color.Gray
                )

                if (errorMessage.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF7F1D1D)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = errorMessage,
                            color = Color(0xFFFCA5A5),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(10.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "PILIH PRESET BUKTI FOTO (SIMULASI):",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF818CF8),
                    modifier = Modifier.padding(bottom = 8.dp)
                )

                presets.forEach { preset ->
                    val isSelected = selectedPreset == preset.second && customUrl.isEmpty()
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 8.dp)
                            .clickable {
                                selectedPreset = preset.second
                                customUrl = ""
                                errorMessage = ""
                            },
                        border = BorderStroke(
                            width = 2.dp,
                            color = if (isSelected) Color(0xFF6366F1) else Color.Transparent
                        ),
                        colors = CardDefaults.cardColors(
                            containerColor = if (isSelected) Color(0xFF1E293B) else Color(0xFF0F172A)
                        )
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .background(Color(0xFF312E81).copy(alpha = 0.5f), RoundedCornerShape(8.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Check,
                                    contentDescription = "Selected",
                                    tint = if (isSelected) Color(0xFF34D399) else Color.Gray,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = preset.first,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                                Text(
                                    text = "Simpan ke DB: ${preset.second.take(30)}...",
                                    fontSize = 9.sp,
                                    color = Color.Gray
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "ATAU MASUKKAN URL BUKTI FOTO CUSTOM:",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF818CF8),
                    modifier = Modifier.padding(bottom = 6.dp)
                )

                OutlinedTextField(
                    value = customUrl,
                    onValueChange = {
                        customUrl = it
                        selectedPreset = ""
                        errorMessage = ""
                    },
                    placeholder = { Text("https://link-foto-bukti.jpg", fontSize = 12.sp, color = Color.Gray) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = TextFieldDefaults.outlinedTextFieldColors(
                        focusedBorderColor = Color(0xFF6366F1),
                        unfocusedBorderColor = Color.Gray
                    ),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(20.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    TextButton(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Batal", color = Color.Gray)
                    }
                    Button(
                        onClick = {
                            val finalPhoto = if (customUrl.isNotBlank()) customUrl else selectedPreset
                            if (finalPhoto.isBlank()) {
                                errorMessage = "Bukti foto pengiriman wajib diisi/dipilih!"
                            } else {
                                onSubmitPod(finalPhoto)
                            }
                        },
                        modifier = Modifier.weight(1.5f),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text("Selesaikan Tugas", fontWeight = FontWeight.Bold, color = Color.White)
                    }
                }
            }
        }
    }
}

// ==================== DIALOG COMPONENT: PHOTO PREVIEW ====================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PhotoPreviewDialog(
    photo: String,
    onDismiss: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
            border = BorderStroke(1.dp, Color(0xFF6366F1).copy(alpha = 0.2f)),
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Foto Bukti Pengiriman",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    IconButton(
                        onClick = onDismiss,
                        colors = IconButtonDefaults.iconButtonColors(containerColor = Color(0xFF1E293B))
                    ) {
                        Icon(imageVector = Icons.Default.Close, contentDescription = "Close", tint = Color.LightGray)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Premium Glassmorphism visual card representing the image
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(180.dp)
                        .background(
                            Brush.verticalGradient(
                                colors = listOf(Color(0xFF312E81), Color(0xFF0F172A))
                            ),
                            RoundedCornerShape(16.dp)
                        )
                        .border(1.dp, Color(0xFF6366F1).copy(alpha = 0.5f), RoundedCornerShape(16.dp))
                        .padding(16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = "Sukti",
                            tint = Color(0xFF10B981),
                            modifier = Modifier.size(44.dp)
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = if (photo.startsWith("http")) "BUKTI DITERIMA: ${photo.take(35)}..." else photo,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            textAlign = TextAlign.Center
                        )
                        Text(
                            text = "Foto tersimpan aman di database PostgreSQL",
                            fontSize = 9.sp,
                            color = Color.Gray,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF065F46)),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Check,
                            contentDescription = "Verified",
                            tint = Color(0xFF34D399),
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "VERIFIED - INTEGRASI GORM DENGAN SUKSES",
                            color = Color(0xFFA7F3D0),
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = onDismiss,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1)),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Tutup Preview", color = Color.White, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

// ==================== DIALOG COMPONENT: GOOGLE ACCOUNT SELECTOR ====================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GoogleAccountSelectorDialog(
    onAccountSelected: (email: String, name: String, role: String) -> Unit,
    onDismiss: () -> Unit
) {
    var googleRole by remember { mutableStateOf("pembeli") }
    var customGoogleName by remember { mutableStateOf("") }
    var customGoogleEmail by remember { mutableStateOf("") }
    var showCustomForm by remember { mutableStateOf(false) }
    var googleError by remember { mutableStateOf("") }

    // States for premium Google Loading Animation
    var isGoogleConnecting by remember { mutableStateOf(false) }
    var selectedName by remember { mutableStateOf("") }
    var selectedEmail by remember { mutableStateOf("") }

    LaunchedEffect(isGoogleConnecting) {
        if (isGoogleConnecting) {
            kotlinx.coroutines.delay(1200) // Beautiful 1.2s authentic Google authentication delay
            onAccountSelected(selectedEmail, selectedName, googleRole)
        }
    }

    Dialog(onDismissRequest = { if (!isGoogleConnecting) onDismiss() }) {
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
            border = BorderStroke(1.dp, Color(0xFF6366F1).copy(alpha = 0.3f)),
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp)
                    .verticalScroll(rememberScrollState()),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                if (isGoogleConnecting) {
                    // --- SCREEN LOADING GOOGLE PREMIUM ---
                    Spacer(modifier = Modifier.height(24.dp))
                    // Google colored G icon represent
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .background(Color.White, RoundedCornerShape(12.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("G", fontWeight = FontWeight.Bold, color = Color(0xFF4285F4), fontSize = 28.sp)
                    }
                    Spacer(modifier = Modifier.height(24.dp))
                    CircularProgressIndicator(
                        color = Color(0xFF6366F1),
                        modifier = Modifier.size(36.dp),
                        strokeWidth = 3.dp
                    )
                    Spacer(modifier = Modifier.height(20.dp))
                    Text(
                        text = "Menghubungkan Akun Google...",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        textAlign = TextAlign.Center
                    )
                    Text(
                        text = "Mengautentikasi $selectedName ($selectedEmail)",
                        fontSize = 11.sp,
                        color = Color.Gray,
                        modifier = Modifier.padding(top = 4.dp),
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(24.dp))
                } else {
                    // --- SCREEN SELEKTOR AKUN GOOGLE ---
                    // Header Google Identity style
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(24.dp)
                                    .background(Color.White, RoundedCornerShape(4.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("G", fontWeight = FontWeight.Bold, color = Color(0xFF4285F4), fontSize = 16.sp)
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Masuk dengan Google",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                        IconButton(
                            onClick = onDismiss,
                            colors = IconButtonDefaults.iconButtonColors(containerColor = Color(0xFF1E293B))
                        ) {
                            Icon(imageVector = Icons.Default.Close, contentDescription = "Close", tint = Color.LightGray)
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    if (googleError.isNotEmpty()) {
                        Text(
                            text = googleError,
                            color = Color.Red,
                            fontSize = 11.sp,
                            modifier = Modifier.padding(bottom = 8.dp)
                        )
                    }

                    // Peran Pemilih
                    Text(
                        text = "PILIH PERAN DASHBOARD:",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF818CF8),
                        modifier = Modifier.align(Alignment.Start).padding(bottom = 8.dp)
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        val roles = listOf("penjual", "pembeli", "kurir", "distributor")
                        roles.forEach { role ->
                            Button(
                                onClick = { googleRole = role },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (googleRole == role) Color(0xFF6366F1) else Color(0xFF1E293B)
                                ),
                                contentPadding = PaddingValues(horizontal = 6.dp, vertical = 2.dp),
                                modifier = Modifier.weight(1f).padding(horizontal = 1.dp),
                                shape = RoundedCornerShape(6.dp)
                            ) {
                                Text(
                                    text = role.replaceFirstChar { it.uppercase() },
                                    fontSize = 8.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                            }
                        }
                    }

                    if (!showCustomForm) {
                        // Preset Accounts
                        Text(
                            text = "PILIH AKUN GOOGLE PADA PERANGKAT:",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.Gray,
                            modifier = Modifier.align(Alignment.Start).padding(bottom = 8.dp)
                        )

                        val presets = listOf(
                            Pair("Alif Pratama", "alif.pratama@gmail.com"),
                            Pair("Budi Santoso", "budi.santoso@gmail.com"),
                            Pair("Siti Rahma", "siti.rahma@gmail.com")
                        )

                        presets.forEach { preset ->
                            Card(
                                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(bottom = 8.dp)
                                    .clickable {
                                        selectedName = preset.first
                                        selectedEmail = preset.second
                                        isGoogleConnecting = true
                                    }
                            ) {
                                Row(
                                    modifier = Modifier.padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(32.dp)
                                            .background(Color(0xFF312E81), RoundedCornerShape(16.dp)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = preset.first.take(1),
                                            color = Color.White,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 14.sp
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Column {
                                        Text(preset.first, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                        Text(preset.second, color = Color.Gray, fontSize = 10.sp)
                                    }
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        // Option for another account
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                            border = BorderStroke(1.dp, Color.Gray.copy(alpha = 0.2f)),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { showCustomForm = true }
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(32.dp)
                                        .background(Color(0xFF1E293B), RoundedCornerShape(16.dp)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Add,
                                        contentDescription = "Add account",
                                        tint = Color.LightGray,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Text("Gunakan akun Google lainnya", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        // --- REAL GOOGLE BROWSER FLOW RESOLUTION ---
                        Spacer(modifier = Modifier.height(16.dp))
                        Box(
                            modifier = Modifier.fillMaxWidth().height(1.dp).background(Color.Gray.copy(alpha = 0.2f))
                        )
                        Spacer(modifier = Modifier.height(16.dp))

                        Text(
                            text = "KONEKSI AKUN GOOGLE ASLI (Dinamis):",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF818CF8),
                            modifier = Modifier.align(Alignment.Start).padding(bottom = 8.dp)
                        )

                        var webServerUrl by remember { mutableStateOf("http://192.168.100.8:3000") }
                        val context = LocalContext.current

                        OutlinedTextField(
                            value = webServerUrl,
                            onValueChange = { webServerUrl = it },
                            label = { Text("Alamat Server Web (IP Lokal / Vercel)", fontSize = 11.sp) },
                            supportingText = { Text("Gunakan IP Wi-Fi PC atau URL Vercel untuk dynamic Google login asli", fontSize = 8.sp, color = Color.Gray) },
                            modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
                            colors = TextFieldDefaults.outlinedTextFieldColors(
                                focusedBorderColor = Color(0xFF6366F1),
                                unfocusedBorderColor = Color.Gray
                            ),
                            singleLine = true
                        )

                        Button(
                            onClick = {
                                try {
                                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("${webServerUrl}?source=mobile&role=${googleRole}"))
                                    context.startActivity(intent)
                                    onDismiss()
                                } catch (e: Exception) {
                                    googleError = "Gagal membuka web browser: ${e.localizedMessage}"
                                }
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp)
                                .border(BorderStroke(1.dp, Color.Gray.copy(alpha = 0.4f)), RoundedCornerShape(12.dp)),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0F172A))
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.Center
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(20.dp)
                                        .background(Color.White, RoundedCornerShape(4.dp)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text("G", fontWeight = FontWeight.Bold, color = Color(0xFF4285F4), fontSize = 14.sp)
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Text("Masuk Google Asli & Hubungkan", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                        }
                    } else {
                        // --- FORM CUSTOM ACCOUNT GOOGLE ---
                        Text(
                            text = "MASUKKAN DETAIL AKUN GOOGLE:",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF818CF8),
                            modifier = Modifier.align(Alignment.Start).padding(bottom = 8.dp)
                        )

                        OutlinedTextField(
                            value = customGoogleName,
                            onValueChange = { customGoogleName = it },
                            label = { Text("Nama Lengkap Google", fontSize = 11.sp) },
                            modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                            colors = TextFieldDefaults.outlinedTextFieldColors(
                                focusedBorderColor = Color(0xFF6366F1),
                                unfocusedBorderColor = Color.Gray
                            ),
                            singleLine = true
                        )

                        OutlinedTextField(
                            value = customGoogleEmail,
                            onValueChange = { customGoogleEmail = it },
                            label = { Text("Email Google", fontSize = 11.sp) },
                            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                            colors = TextFieldDefaults.outlinedTextFieldColors(
                                focusedBorderColor = Color(0xFF6366F1),
                                unfocusedBorderColor = Color.Gray
                            ),
                            singleLine = true
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            TextButton(
                                onClick = { showCustomForm = false },
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("Batal", color = Color.Gray)
                            }

                            Button(
                                onClick = {
                                    if (customGoogleName.isBlank() || customGoogleEmail.isBlank()) {
                                        googleError = "Nama dan Email wajib diisi!"
                                    } else {
                                        selectedName = customGoogleName
                                        selectedEmail = customGoogleEmail
                                        isGoogleConnecting = true
                                    }
                                },
                                modifier = Modifier.weight(1.5f),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1)),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Text("Masuk", color = Color.White, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}

// ==================== DIALOG COMPONENT: LIVE GPS TRACKING MAP ====================
@Composable
fun GpsTrackingMap(orderId: Int) {
    var progress by remember { mutableStateOf(0.05f) }
    LaunchedEffect(Unit) {
        while (progress < 0.95f) {
            kotlinx.coroutines.delay(1200)
            progress += 0.045f
        }
        progress = 0.95f
    }

    val distance = Math.max(0, ((1f - progress) * 800).toInt())
    val eta = Math.max(0, Math.ceil(((1f - progress) * 5).toDouble()).toInt())

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 12.dp)
            .background(Color(0xFF070B14), RoundedCornerShape(16.dp))
            .border(BorderStroke(1.dp, Color(0xFF6366F1).copy(alpha = 0.2f)), RoundedCornerShape(16.dp))
            .padding(12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.LocationOn,
                    contentDescription = "GPS",
                    tint = Color(0xFF6366F1),
                    modifier = Modifier.size(14.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text("PELACAKAN GPS LIVE KURIR", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Gray)
            }
            Text("SEDANG DIANTAR", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color(0xFF818CF8))
        }

        // Peta Visual dengan Box
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(100.dp)
                .background(Color(0xFF0F172A), RoundedCornerShape(12.dp))
                .border(BorderStroke(1.dp, Color.Gray.copy(alpha = 0.1f)), RoundedCornerShape(12.dp))
                .padding(horizontal = 16.dp),
            contentAlignment = Alignment.Center
        ) {
            // Route line dotted represent
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(2.dp)
                    .background(Color.Gray.copy(alpha = 0.1f))
                    .align(Alignment.Center)
            ) {}

            // Origin: Dapur UMKM (Left)
            Box(
                modifier = Modifier
                    .align(Alignment.CenterStart)
                    .offset(x = 10.dp)
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        modifier = Modifier
                            .size(28.dp)
                            .background(Color(0xFF065F46), RoundedCornerShape(8.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(imageVector = Icons.Default.Home, contentDescription = "Dapur", tint = Color(0xFF34D399), modifier = Modifier.size(14.dp))
                    }
                    Text("DAPUR", fontSize = 6.sp, fontWeight = FontWeight.Bold, color = Color(0xFF34D399), modifier = Modifier.padding(top = 2.dp))
                }
            }

            // Destination: Rumah Pembeli (Right)
            Box(
                modifier = Modifier
                    .align(Alignment.CenterEnd)
                    .offset(x = (-10).dp)
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        modifier = Modifier
                            .size(28.dp)
                            .background(Color(0xFF312E81), RoundedCornerShape(8.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(imageVector = Icons.Default.Place, contentDescription = "Tujuan", tint = Color(0xFF818CF8), modifier = Modifier.size(14.dp))
                    }
                    Text("TUJUAN", fontSize = 6.sp, fontWeight = FontWeight.Bold, color = Color(0xFF818CF8), modifier = Modifier.padding(top = 2.dp))
                }
            }

            // Moving Courier Icon (Horizontal Translate)
            Box(
                modifier = Modifier
                    .align(Alignment.CenterStart)
                    .fillMaxWidth(0.7f)
                    .offset(x = (20.dp + ((progress * 180).toInt()).dp))
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        modifier = Modifier
                            .size(28.dp)
                            .background(Color(0xFFD97706), RoundedCornerShape(14.dp))
                            .border(BorderStroke(1.dp, Color.White), RoundedCornerShape(14.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(imageVector = Icons.Default.ShoppingCart, contentDescription = "Kurir", tint = Color.White, modifier = Modifier.size(12.dp))
                    }
                    Text("KURIR", fontSize = 6.sp, fontWeight = FontWeight.Bold, color = Color(0xFFFBBF24), modifier = Modifier.padding(top = 2.dp))
                }
            }

            // Coordinate telemetry label
            Text(
                text = "LAT: -6.2146 | LON: 106.8451 | SPD: 24 km/h",
                fontSize = 5.sp,
                fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace,
                color = Color.Gray,
                modifier = Modifier.align(Alignment.BottomEnd).padding(bottom = 2.dp, end = 4.dp)
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Distance & ETA status Card
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFF0F172A), RoundedCornerShape(10.dp))
                .padding(8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Refresh,
                    contentDescription = "ETA",
                    tint = Color(0xFFFBBF24),
                    modifier = Modifier.size(14.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Column {
                    Text("ESTIMASI KEDATANGAN", fontSize = 7.sp, fontWeight = FontWeight.Bold, color = Color.Gray)
                    Text(
                        text = if (progress >= 0.95f) "Tiba di Lokasi Anda!" else "~$eta menit lagi",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }
            }

            Column(horizontalAlignment = Alignment.End) {
                Text("JARAK SISA", fontSize = 7.sp, fontWeight = FontWeight.Bold, color = Color.Gray)
                Text(
                    text = if (progress >= 0.95f) "Selesai" else "$distance meter",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF818CF8)
                )
            }
        }
    }
}
