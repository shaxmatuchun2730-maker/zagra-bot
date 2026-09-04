import os
import telebot
from telebot import types
import yt_dlp

# Botingizning rasmiy API Tokeni
API_TOKEN = '8865532305:AAFc5rz0DuPLtVWbHCj7ztS893aOUlRuE28'

# Telegramga fayl yuborish vaqt limitlarini cheksiz (10 daqiqa) qilamiz
bot = telebot.TeleBot(API_TOKEN, threaded=False)
telebot.apihelper.CONNECT_TIMEOUT = 600
telebot.apihelper.READ_TIMEOUT = 600

DOWNLOAD_DIR = "downloads"
if not os.path.exists(DOWNLOAD_DIR):
    os.makedirs(DOWNLOAD_DIR)

user_links = {}

def is_valid_link(text):
    valid_domains = ["youtube.com", "youtu.be", "instagram.com", "tiktok.com"]
    return any(domain in text for domain in valid_domains)

@bot.message_handler(commands=['start'])
def send_welcome(message):
    bot.reply_to(message, "👋 Salom! Men Zagra botman.\nMenga video linkini yuboring, yuklab beraman! 🔥")

@bot.message_handler(func=lambda message: message.text and is_valid_link(message.text))
def handle_link(message):
    url = message.text
    user_id = message.from_user.id
    user_links[user_id] = url
    
    markup = types.InlineKeyboardMarkup(row_width=2)
    btn_video = types.InlineKeyboardButton("🎬 Video yuklash", callback_data="get_video")
    btn_audio = types.InlineKeyboardButton("🎵 MP3 yuklash", callback_data="get_audio")
    markup.add(btn_video, btn_audio)
    
    bot.reply_to(message, "Yuklab olish formatini tanlang 👇", reply_markup=markup)

@bot.callback_query_handler(func=lambda call: True)
def callback_query(call):
    chat_id = call.message.chat.id
    user_id = call.from_user.id
    action = call.data
    url = user_links.get(user_id)
    
    if not url:
        bot.answer_callback_query(call.id, "❌ Link muddati tugadi.")
        return

    bot.answer_callback_query(call.id, "Yuklanmoqda...")
    status_msg = bot.send_message(chat_id, "⏳ Zagra ishlamoqda, iltimos kuting...")

    try:
        if action == "get_video":
            # extractor_args orqali YouTubeni oddiy iOS telefon deb aldaymiz (blokdan qochish uchun)
            ydl_opts = {
                'format': 'mp4/best', 
                'outtmpl': f'{DOWNLOAD_DIR}/%(id)s.%(ext)s',
                'prefer_ffmpeg': False,
                'extractor_args': {'youtube': {'player_client': ['ios']}}
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                filename = ydl.prepare_filename(info)
                
            bot.edit_message_text("🚀 Video Telegramga yuklanmoqda...", chat_id, status_msg.message_id)
            with open(filename, 'rb') as video:
                bot.send_video(chat_id, video, caption="Zagra bot orqali yuklab olindi! 🔥")
                
        elif action == "get_audio":
            ydl_opts = {
                'format': 'bestaudio[ext=m4a]/bestaudio',
                'outtmpl': f'{DOWNLOAD_DIR}/%(id)s.%(ext)s',
                'prefer_ffmpeg': False,
                'extractor_args': {'youtube': {'player_client': ['ios']}}
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                filename = ydl.prepare_filename(info)
                
            bot.edit_message_text("🚀 Musiqa Telegramga yuklanmoqda...", chat_id, status_msg.message_id)
            with open(filename, 'rb') as audio:
                bot.send_audio(chat_id, audio, caption="Zagra bot orqali ajratib olindi! 🎵")

        if os.path.exists(filename):
            os.remove(filename)
        bot.delete_message(chat_id, status_msg.message_id)

    except Exception as e:
        bot.edit_message_text(f"❌ Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.", chat_id, status_msg.message_id)

print("Zagra bot yangilandi va muvaffaqiyatli ishga tushdi...")
bot.infinity_polling(timeout=10, long_polling_timeout=5)
