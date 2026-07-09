const CART_KEY = "velira_cart"; // { [productId]: qty }
let PRODUCTS_CACHE = null;

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || {};
  } catch {
    return {};
  }
}

function setCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function addToCart(id, qty = 1) {
  const cart = getCart();
  cart[id] = (cart[id] || 0) + qty;
  setCart(cart);
  showToast(currentLangText("addedToast"));
  renderCartDrawer();
}

function removeFromCart(id) {
  const cart = getCart();
  delete cart[id];
  setCart(cart);
  renderCartDrawer();
}

function setQty(id, qty) {
  const cart = getCart();
  if (qty <= 0) {
    delete cart[id];
  } else {
    cart[id] = qty;
  }
  setCart(cart);
  renderCartDrawer();
}

function getCartCount() {
  const cart = getCart();
  return Object.values(cart).reduce((sum, q) => sum + q, 0);
}

function updateCartCount() {
  const el = document.getElementById("cartCount");
  if (el) el.textContent = getCartCount();
}

function currentLangText(key) {
  const lang = localStorage.getItem("velira_lang") || "ru";
  return (window.DICT && DICT[lang] && DICT[lang][key]) || "";
}

function showToast(msg) {
  let toast = document.getElementById("veliraToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "veliraToast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

async function ensureProducts() {
  if (!PRODUCTS_CACHE) {
    PRODUCTS_CACHE = await apiGetProducts();
  }
  return PRODUCTS_CACHE;
}

async function renderCartDrawer() {
  const itemsEl = document.getElementById("cartItems");
  const footEl = document.getElementById("cartFoot");
  if (!itemsEl) return;

  const cart = getCart();
  const ids = Object.keys(cart);
  const lang = localStorage.getItem("velira_lang") || "ru";

  if (ids.length === 0) {
    itemsEl.innerHTML = `<div class="cart-empty">${currentLangText("cartEmpty")}</div>`;
    if (footEl) footEl.style.display = "none";
    updateCartCount();
    return;
  }

  const products = await ensureProducts();
  let total = 0;
  let html = "";

  ids.forEach((id) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    const qty = cart[id];
    const lineTotal = product.price * qty;
    total += lineTotal;
    html += `
      <div class="cart-item">
        <img src="${product.image}" alt="${product.name[lang]}">
        <div>
          <h4>${product.name[lang]}</h4>
          <div class="qty-row">
            <button class="qty-btn" onclick="setQty('${id}', ${qty - 1})">−</button>
            <span>${qty}</span>
            <button class="qty-btn" onclick="setQty('${id}', ${qty + 1})">+</button>
          </div>
          <a class="remove-btn" onclick="removeFromCart('${id}')">✕</a>
        </div>
        <div style="font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:14px;">
          ${lineTotal.toLocaleString("uz-UZ")}
        </div>
      </div>`;
  });

  itemsEl.innerHTML = html;
  if (footEl) {
    footEl.style.display = "block";
    const totalEl = document.getElementById("cartTotalValue");
    if (totalEl) totalEl.textContent = `${total.toLocaleString("uz-UZ")} UZS`;
  }
  updateCartCount();
}

function openCart() {
  document.getElementById("cartDrawer")?.classList.add("open");
  document.getElementById("cartOverlay")?.classList.add("open");
  renderCartDrawer();
}
function closeCart() {
  document.getElementById("cartDrawer")?.classList.remove("open");
  document.getElementById("cartOverlay")?.classList.remove("open");
}

function openCheckout() {
  if (getCartCount() === 0) return;
  closeCart();
  document.getElementById("checkoutModal")?.classList.add("open");
}
function closeCheckout() {
  document.getElementById("checkoutModal")?.classList.remove("open");
}

async function submitOrder(e) {
  e.preventDefault();
  const form = e.target;
  const statusEl = document.getElementById("orderStatus");
  const submitBtn = form.querySelector("button[type=submit]");
  const originalBtnText = submitBtn.textContent;
  const lang = localStorage.getItem("velira_lang") || "ru";

  const cart = getCart();
  const items = Object.keys(cart).map((id) => ({ id, qty: cart[id] }));

  const payload = {
    name: form.name.value,
    phone: form.phone.value,
    address: form.address.value,
    comment: form.comment.value,
    items,
    lang,
  };

  submitBtn.disabled = true;
  statusEl.textContent = "";
  statusEl.className = "form-status";

  try {
    // Build a human-readable order summary for the email
    const products = await ensureProducts();
    let total = 0;
    const itemsText = items
      .map((it) => {
        const product = products.find((p) => p.id === it.id);
        const name = product ? (product.name[lang] || product.name.uz) : it.id;
        const lineTotal = product ? product.price * it.qty : 0;
        total += lineTotal;
        return `${name} x${it.qty} — ${lineTotal.toLocaleString("uz-UZ")} so'm`;
      })
      .join("\n");

    const templateParams = {
      type: "Yangi buyurtma",
      name: payload.name,
      contact: payload.phone,
      phone: payload.phone,
      address: payload.address || "—",
      message: payload.comment || "—",
      order_items: itemsText,
      order_total: `${total.toLocaleString("uz-UZ")} so'm`,
      reply_to: payload.phone,
    };

    await emailjs.send("service_rdyv22j", "template_48si1yf", templateParams);

    // Best-effort: also try to save to backend / notify Telegram, but don't block success on it
    try {
      await apiCreateOrder(payload);
    } catch (backendErr) {
      // backend may be offline; email delivery is what matters here
    }

    statusEl.textContent = currentLangText("orderSuccess");
    statusEl.classList.add("success");
    submitBtn.textContent = `${currentLangText("sentBtn")} ✅`;
    submitBtn.classList.add("btn-sent");
    setCart({});
    form.reset();
    setTimeout(() => {
      closeCheckout();
      statusEl.textContent = "";
      submitBtn.textContent = originalBtnText;
      submitBtn.classList.remove("btn-sent");
    }, 2200);
  } catch (err) {
    console.error("EmailJS error:", err);
    const detail = (err && (err.text || err.message)) ? ` (${err.text || err.message})` : "";
    statusEl.textContent = currentLangText("orderError") + detail;
    submitBtn.textContent = `${currentLangText("errorBtn")} ❌`;
    submitBtn.classList.add("btn-error");
    setTimeout(() => {
      submitBtn.textContent = originalBtnText;
      submitBtn.classList.remove("btn-error");
    }, 2600);
    statusEl.classList.add("error");
  } finally {
    submitBtn.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  document.getElementById("openCartBtn")?.addEventListener("click", openCart);
  document.getElementById("closeCartBtn")?.addEventListener("click", closeCart);
  document.getElementById("cartOverlay")?.addEventListener("click", closeCart);
  document.getElementById("checkoutBtn")?.addEventListener("click", openCheckout);
  document.getElementById("closeCheckoutBtn")?.addEventListener("click", closeCheckout);
  document.getElementById("checkoutForm")?.addEventListener("submit", submitOrder);
});

document.addEventListener("langchange", () => renderCartDrawer());
