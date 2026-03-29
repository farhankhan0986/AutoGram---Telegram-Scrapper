import os
import json
import re
import asyncio
import requests
from dotenv import load_dotenv
from telethon import TelegramClient, events
from telethon.errors import FloodWaitError

# Load environment variables
load_dotenv()

API_ID = os.getenv("API_ID")
API_HASH = os.getenv("API_HASH")
PHONE = os.getenv("PHONE")
INGEST_URL = os.getenv("INGEST_URL", "http://localhost:3000/api/ingest")
TARGET_CHANNELS = os.getenv("TARGET_CHANNELS", "").split(",")

if not API_ID or not API_HASH:
    raise ValueError("Missing API_ID or API_HASH in .env")

# Basic state management for deduplication
STATE_FILE = "scraper_state.json"

def load_state():
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_state(state):
    try:
        with open(STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(state, f, indent=4)
    except Exception as e:
        print(f"Failed to save state: {e}")

state = load_state()

# Content filtering
def clean_content(text: str) -> str:
    # Remove common ad lines and formatting
    lines = text.split('\n')
    cleaned_lines = []
    for line in lines:
        lower_line = line.lower()
        if 't.me/' in lower_line and ('join' in lower_line or 'subscribe' in lower_line):
            continue
        if lower_line.strip().startswith('@'):
            continue
        cleaned_lines.append(line)
    
    result = '\n'.join(cleaned_lines)
    # clean excessive newlines
    result = re.sub(r'\n{3,}', '\n\n', result)
    return result.strip()

# Initialize client
client = TelegramClient('scraper_session', int(API_ID), API_HASH)

async def process_and_send_message(message_text: str, channel_key: str, message_id: int):
    try:
        # Deduplication check
        if channel_key not in state:
            state[channel_key] = []
        
        if message_id in state[channel_key]:
            print(f"[{channel_key}] Message {message_id} already processed. Skipping.")
            return

        # Content filtering layer
        cleaned_text = clean_content(message_text)
        if not cleaned_text:
            print(f"[{channel_key}] Message {message_id} filtered out (empty after cleanup).")
            return

        print(f"[{channel_key}] Ingesting message id: {message_id}")

        # Payload to send to Next.js API
        payload = {
            "messageText": cleaned_text,
            "sourceChannel": channel_key,
            "messageId": message_id
        }

        # Send asynchronously without blocking the loop
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, lambda: requests.post(INGEST_URL, json=payload, timeout=10))
        
        if response.status_code == 201:
            print(f" -> Successfully ingested (DB ID: {response.json().get('postId')})")
            
            # Save state on success
            state[channel_key].append(message_id)
            state[channel_key] = state[channel_key][-200:]
            save_state(state)
        else:
            print(f" -> Failed to ingest: {response.status_code} {response.text}")
            
    except Exception as e:
        print(f" -> Error processing message: {e}")

@client.on(events.NewMessage(chats=[int(c) if c.lstrip('-').isdigit() else c for c in TARGET_CHANNELS if c]))
async def handle_new_message(event):
    try:
        # Add delay in live scraping to avoid rate limits
        await asyncio.sleep(2)

        message_text = event.message.message
        if not message_text:
            return

        chat = await event.get_chat()
        channel_name = chat.username if getattr(chat, 'username', None) else chat.title
        channel_id = str(chat.id)
        
        await process_and_send_message(message_text, channel_name or channel_id, event.message.id)

    except FloodWaitError as e:
        print(f"Rate limited by Telegram Flooding. Waiting for {e.seconds} seconds...")
        await asyncio.sleep(e.seconds)
    except Exception as e:
        print(f" -> Error handling live event: {e}")

async def main():
    print("Starting Telegram Scraper...")
    
    # Using phone=PHONE ensures the prompt strictly asks for User login
    if PHONE:
        await client.start(phone=PHONE)
    else:
        await client.start()
    
    # --- Fetch historical messages on startup ---
    print("Fetching latest 5 messages from each target channel and pushing to Dashboard...")
    for channel in TARGET_CHANNELS:
        ch = channel.strip()
        if not ch:
            continue
        try:
            async for msg in client.iter_messages(ch, limit=5):
                if msg.text:
                    # Small delay between historical fetches
                    await asyncio.sleep(1)
                    await process_and_send_message(msg.text, ch, msg.id)
        except Exception as e:
            print(f"Failed to fetch history for {ch}: {e}")
    # -------------------------------------------------

    print(f"\nListening for new live messages on channels: {TARGET_CHANNELS}")
    # run until disconnected
    await client.run_until_disconnected()

if __name__ == '__main__':
    asyncio.run(main())
