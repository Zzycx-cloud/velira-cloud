const API_BASE = "/api";

async function apiGetProducts() {
  const res = await fetch(`${API_BASE}/products`);
  if (!res.ok) throw new Error("Mahsulotlarni yuklab bo'lmadi");
  return res.json();
}

async function apiCreateOrder(payload) {
  const res = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Buyurtma xatosi");
  return data;
}

async function apiSendContact(payload) {
  const res = await fetch(`${API_BASE}/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Xabar xatosi");
  return data;
}
