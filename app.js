// Khởi tạo giỏ hàng từ LocalStorage (Yêu cầu Y1.5: Reload trang không mất dữ liệu)[cite: 3]
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let searchQuery = "";

// Hàm định dạng tiền tệ VNĐ
function formatCurrency(amount) {
  return amount.toLocaleString("vi-VN") + " đ";
}
// 1. Hiển thị danh sách sản phẩm ra giao diện (Yêu cầu Y1.1 & Y1.2)[cite: 2]
function renderProducts() {
  const categories = [
    { key: "moi", label: "Mới nhất", gridId: "newProductGrid" },
    { key: "hot", label: "Sản phẩm hot", gridId: "hotProductGrid" },
    { key: "khuyen-mai", label: "Khuyến mãi", gridId: "saleProductGrid" },
  ];
  const noProductsMessage = document.getElementById("noProductsMessage");
  if (!noProductsMessage) return;

  let visibleProductCount = 0;
  categories.forEach(({ key, label, gridId }) => {
    const section = document.getElementById(key);
    const grid = document.getElementById(gridId);
    if (!section || !grid) return;

    const categoryProducts = products.filter(
      (product) =>
        product.category === key &&
        product.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    visibleProductCount += categoryProducts.length;
    section.classList.toggle("hidden", categoryProducts.length === 0);

    grid.innerHTML = categoryProducts
      .map(
        (p) => `
        <div class="product-card bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div class="h-52 overflow-hidden bg-gray-100 relative">
                <span class="absolute top-3 left-3 bg-red-500 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow">${p.tag}</span>
                <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover hover:scale-105 transition duration-500">
            </div>
            <div class="p-5 flex-1 flex flex-col justify-between">
                <div>
                    <span class="text-xs uppercase text-indigo-500 font-bold tracking-wider">${label}</span>
                    <h3 class="font-bold text-gray-800 text-base mt-1 line-clamp-1">${p.name}</h3>
                </div>
                <div class="mt-4 flex items-center justify-between">
                    <div>
                        <span class="text-indigo-600 font-extrabold text-base">${formatCurrency(p.price)}</span>
                        ${p.oldPrice > p.price ? `<span class="text-gray-400 text-xs line-through block">${formatCurrency(p.oldPrice)}</span>` : ""}
                    </div>
                    <button onclick="addToCart(${p.id})" class="bg-indigo-600 text-white text-sm px-4 py-2 rounded-xl font-semibold hover:bg-indigo-700 transition shadow-md shadow-indigo-100 flex items-center gap-1.5">
                        <i class="fa-solid fa-cart-plus"></i> Thêm
                    </button>
                </div>
            </div>
        </div>
    `,
      )
      .join("");
  });

  noProductsMessage.classList.toggle("hidden", visibleProductCount > 0);
}
// Tìm kiếm sản phẩm theo thời gian thực (Real-time search)
const searchInput = document.getElementById("searchInput");
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    renderProducts();
  });
}
// 3. Quản lý Giỏ hàng & LocalStorage (Yêu cầu Y1.5)[cite: 3]
function toggleCart() {
  const drawer = document.getElementById("cartDrawer");
  const overlay = document.getElementById("cartOverlay");
  if (drawer && overlay) {
    drawer.classList.toggle("translate-x-full");
    overlay.classList.toggle("hidden");
  }
}
function addToCart(productId) {
  const product = products.find((p) => p.id === productId);
  const existing = cart.find((item) => item.id === productId);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  saveCart();
  updateCartUI();
  toggleCart();
}
function changeQuantity(productId, delta) {
  const item = cart.find((i) => i.id === productId);
  if (item) {
    item.quantity += delta;
    if (item.quantity <= 0) {
      cart = cart.filter((i) => i.id !== productId);
    }
  }
  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function updateCartUI() {
  const cartItemsContainer = document.getElementById("cartItems");
  const cartCount = document.getElementById("cartCount");
  const cartTotal = document.getElementById("cartTotal");
  if (!cartItemsContainer || !cartCount || !cartTotal) return;
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalCount;
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `<p class="text-gray-400 text-center py-12">Giỏ hàng của bạn đang trống.</p>`;
    cartTotal.textContent = formatCurrency(0);
    return;
  }
  cartItemsContainer.innerHTML = cart
    .map(
      (item) => `
        <div class="flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <img src="${item.image}" class="w-16 h-16 object-cover rounded-xl shadow-sm">
            <div class="flex-1">
                <h4 class="font-semibold text-sm text-gray-800 line-clamp-1">${item.name}</h4>
                <span class="text-indigo-600 text-sm font-bold">${formatCurrency(item.price)}</span>
            </div>
            <div class="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg border">
                <button onclick="changeQuantity(${item.id}, -1)" class="w-6 h-6 bg-white rounded font-bold text-xs hover:bg-gray-200 shadow-sm">-</button>
                <span class="text-sm font-bold w-4 text-center">${item.quantity}</span>
                <button onclick="changeQuantity(${item.id}, 1)" class="w-6 h-6 bg-white rounded font-bold text-xs hover:bg-gray-200 shadow-sm">+</button>
            </div>
        </div>
    `,
    )
    .join("");

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  cartTotal.textContent = formatCurrency(totalPrice);
}

// 4. Chức năng nâng cao: Đồng hồ đếm ngược Flash Sale (Yêu cầu Y1.6)[cite: 3]
function startCountdown() {
  let time = 10 * 3600 + 45 * 60; // 10 giờ 45 phút
  const timerElement = document.getElementById("countdownTimer");
  if (!timerElement) return;

  setInterval(() => {
    let hours = Math.floor(time / 3600);
    let minutes = Math.floor((time % 3600) / 60);
    let seconds = time % 60;

    timerElement.textContent = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    if (time > 0) time--;
  }, 1000);
}
// Khởi chạy khi tài liệu HTML đã tải xong
document.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  updateCartUI();
  startCountdown();
});
