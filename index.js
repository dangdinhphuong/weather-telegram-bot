import axios from "axios";
import cron from "node-cron";
import dotenv from "dotenv";
import fs from "fs";
import express from "express";

dotenv.config();
const app = express();
app.use(express.static("public"));

const WEATHER_FILE = "weather.json";

// =========================
// CONFIG
// =========================
const LAT = 21.028;
const LON = 105.834;
const CITY = "Hà Nội";

const API_KEY = '8v1d2gvli05pryvemg6mt25oydf7c04pwkldng8b';
const BOT_TOKEN = '8196847800:AAEv2mUFM_DDfU6MUv0oDaZ2OYnWXq3ej50';
const CHAT_ID = '6887114743';

// =========================
// RANDOM WISHES
// =========================
const WISHES = [
  "💙 Chúc cậu một ngày tuyệt vời!",
  "✨ Chúc cậu một ngày đầy năng lượng!",
  "🌼 Mong cậu có một ngày thật dễ chịu nha!",
  "🍀 Chúc mọi điều tốt đẹp sẽ đến với cậu!",
  "🌈 Chúc cậu một ngày rực rỡ và bình yên!",
  "☕ Chúc cậu một ngày làm việc hiệu quả!",
  "💫 Chúc cậu may mắn cả ngày!",
];

function randomWish() {
  return WISHES[Math.floor(Math.random() * WISHES.length)];
}

// =========================
// LƯU FILE WEATHER.JSON
// =========================
function saveRecord(record) {
  let list = [];
  if (fs.existsSync(WEATHER_FILE)) {
    list = JSON.parse(fs.readFileSync(WEATHER_FILE, "utf8"));
  }

  list.unshift(record);

  if (list.length > 1) list = list.slice(0, 1);

  fs.writeFileSync(WEATHER_FILE, JSON.stringify(list, null, 2));
}

// =========================
// GỬI TELEGRAM
// =========================
async function sendToTelegram(message) {
  await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    chat_id: CHAT_ID,
    text: message,
    parse_mode: "Markdown",
  });
}

// =========================
// HÀM CHÍNH: LẤY API
// =========================
async function sendWeather(sendTelegram = true) {
  try {
    const url = "https://www.meteosource.com/api/v1/free/point";

    const res = await axios.get(url, {
      params: {
        lat: LAT,
        lon: LON,
        sections: "current,hourly",
        timezone: "Asia/Saigon",
        units: "metric",
        language: "en",
        key: API_KEY,
      },
    });

    const now = new Date();
    const timeString = now.toLocaleTimeString("vi-VN", { hour12: false });
    const dateString = now.toLocaleDateString("vi-VN");

    const record = {
      time: `${timeString} ${dateString}`,
      city: CITY,
      wish: randomWish(),
      data: res.data,
    };

    saveRecord(record);

    if (sendTelegram) {
      const c = res.data.current;
      const message = `
                🌤 *Dự báo thời tiết ${CITY}*
                🕒 ${record.time}

                • ${c.summary}
                • 🌡 Nhiệt độ: ${c.temperature}°C
                • 💨 Gió: ${c.wind.speed} m/s — ${c.wind.dir}
                • ☁️ Mây: ${c.cloud_cover}%
                • ☔ Mưa: ${c.precipitation.total} mm

                ${record.wish}
            `;

      await sendToTelegram(message);
    }

    console.log("✔ Cập nhật thời tiết thành công.");
  } catch (err) {
    console.error("❌ Lỗi sendWeather:", err.response?.data || err.message);
  }
}

// =========================
// CRON JOBS
// =========================
cron.schedule("0 6 * * *", () => sendWeather(true), {
  timezone: "Asia/Ho_Chi_Minh",
});
cron.schedule("0 17 * * *", () => sendWeather(true), {
  timezone: "Asia/Ho_Chi_Minh",
});
cron.schedule( "*/5 * * * *",() => {console.log("⏰ Cron chạy mỗi 5 phút...");sendWeather();
  },
  { timezone: "Asia/Ho_Chi_Minh" }
);

// =========================
// API SERVER
// =========================

// Bản ghi mới nhất
app.get("/api/latest", (req, res) => {
  if (!fs.existsSync(WEATHER_FILE)) return res.json({ ok: false });

  const list = JSON.parse(fs.readFileSync(WEATHER_FILE));
  res.json(list[0]);
});

// 50 bản ghi
app.get("/api/list", (req, res) => {
  const list = fs.existsSync(WEATHER_FILE)
    ? JSON.parse(fs.readFileSync(WEATHER_FILE))
    : [];
  res.json(list);
});

// Cập nhật thủ công (không gửi Telegram)
app.get("/api/update", async (req, res) => {
  await sendWeather(false);
  res.json({ ok: true });
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("🌐 Web server running on port " + PORT);
});
