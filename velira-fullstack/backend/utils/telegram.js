// Sends a plain-text message to the configured Telegram chat using the Bot API.
// Requires TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in the environment (.env).
// Uses Node's built-in global fetch (Node 18+). No extra dependency needed.

async function sendTelegramMessage(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn(
      "[telegram] TELEGRAM_BOT_TOKEN yoki TELEGRAM_CHAT_ID .env faylida topilmadi — xabar yuborilmadi. " +
        "README.md dagi 'Telegram bot sozlash' bo'limiga qarang."
    );
    return { ok: false, skipped: true };
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      console.error("[telegram] API xatosi:", data);
    }
    return data;
  } catch (err) {
    console.error("[telegram] Yuborishda xatolik:", err.message);
    return { ok: false, error: err.message };
  }
}

module.exports = { sendTelegramMessage };
