import axios from "axios";
import cron from "node-cron";
import dotenv from "dotenv";

dotenv.config();

// ===== ENV =====
const LAT = 21.028;
const LON = 105.834;
const CITY = "Hà Nội";

const API_KEY = '8v1d2gvli05pryvemg6mt25oydf7c04pwkldng8b';
const BOT_TOKEN = '8196847800:AAEv2mUFM_DDfU6MUv0oDaZ2OYnWXq3ej50';
const CHAT_ID = '6887114743';

// ===============================
// TEMPLATE TELEGRAM
// ===============================
function buildWeatherMessage(data, city = "Hà Nội") {
    const current = data.current;

    const icons = {
        "sunny": "☀️",
        "mostly_sunny": "🌤",
        "partly_sunny": "⛅",
        "partly_clear": "🌤",
        "clear": "🌙",
        "mostly_clear": "🌙",
        "fog": "🌫",
        "cloudy": "☁️",
        "rain": "🌧",
        "snow": "❄️"
    };

    const icon = icons[current.weather] || "🌤";

    const hourly = data.hourly.data.slice(0, 5);

    const hourlyText = hourly.map(h => {
        const time = h.date.slice(11, 16);
        const hIcon = icons[h.weather] || "🌤";
        return `• **${time}** — ${hIcon} ${h.summary} | ${h.temperature}°C | Gió ${h.wind.speed} m/s`;
    }).join("\n");

    return `
${icon} **Dự báo thời tiết hôm nay — ${city}**

📌 **Hiện tại:** ${current.summary}  
🌡 **Nhiệt độ:** ${current.temperature}°C  
💨 **Gió:** ${current.wind.speed} m/s (hướng ${current.wind.dir})  
☁️ **Mây:** ${current.cloud_cover}%  
☔ **Mưa:** ${current.precipitation.total}mm (${current.precipitation.type})

🕒 **Trong 5 giờ tới:**  
${hourlyText}

💙 Chúc cậu một ngày tuyệt vời!
    `;
}

// ===============================
// LẤY API & GỬI TELEGRAM
// ===============================
async function sendWeather() {
    try {
        console.log("🔍 Đang lấy dữ liệu Meteosource...");

        const url = "https://www.meteosource.com/api/v1/free/point";

        const res = await axios.get(url, {
            params: {
                lat: LAT,
                lon: LON,
                sections: "current,hourly",
                timezone: "Asia/Saigon",
                language: "en",
                units: "metric",
                key: API_KEY
            }
        });

        const msg = buildWeatherMessage(res.data, CITY);

        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: msg,
            parse_mode: "Markdown"
        });

        console.log("✔️ Đã gửi dự báo thời tiết vào Telegram.");
    } catch (err) {
        console.error("❌ Lỗi:", err.response?.data || err.message);
    }
}

// ===============================
// CRON JOBS
// ===============================

// Gửi lúc 06:00 sáng
cron.schedule("0 6 * * *", () => {
    console.log("⏰ 06:00 → gửi dự báo thời tiết...");
    sendWeather();
}, {
    timezone: "Asia/Ho_Chi_Minh"
});

// Gửi lúc 17:00 chiều
cron.schedule("0 17 * * *", () => {
    console.log("⏰ 17:00 → gửi dự báo thời tiết...");
    sendWeather();
}, {
    timezone: "Asia/Ho_Chi_Minh"
});

cron.schedule("10 10 * * *", () => {
    console.log("⏰ 10:10 → gửi dự báo thời tiết...");
    sendWeather();
}, {
    timezone: "Asia/Ho_Chi_Minh"
});
// ===============================
console.log("🚀 Weather bot đang chạy với cron 06:00 và 17:00 và 10:10...");
