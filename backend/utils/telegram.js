// Sends a plain-text message to one or more Telegram chats using the Bot API.
// Requires TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in the environment (.env).
// TELEGRAM_CHAT_ID can hold a single id, or several ids separated by commas
// (e.g. "6600336418,-1003851734252") to notify a personal chat AND a group/channel.
// Uses Node's built-in global fetch (Node 18+). No extra dependency needed.

async function sendToSingleChat(token, chatId, text) {
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
      console.error(`[telegram] API xatosi (chat_id=${chatId}):`, data);
    }
    return data;
  } catch (err) {
    console.error(`[telegram] Yuborishda xatolik (chat_id=${chatId}):`, err.message);
    return { ok: false, error: err.message };
  }
}

async function sendTelegramMessage(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const rawChatIds = process.env.TELEGRAM_CHAT_ID;

  if (!token || !rawChatIds) {
    console.warn(
      "[telegram] TELEGRAM_BOT_TOKEN yoki TELEGRAM_CHAT_ID .env faylida topilmadi — xabar yuborilmadi. " +
        "README.md dagi 'Telegram bot sozlash' bo'limiga qarang."
    );
    return { ok: false, skipped: true };
  }

  // Split on commas, trim whitespace, drop empty entries
  const chatIds = rawChatIds
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  const results = await Promise.all(
    chatIds.map((chatId) => sendToSingleChat(token, chatId, text))
  );

  const allOk = results.every((r) => r && r.ok);
  return { ok: allOk, results };
}

module.exports = { sendTelegramMessage };
