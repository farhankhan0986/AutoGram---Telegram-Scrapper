# 🤖 AutoGram — Telegram Content Automation Pipeline

<div align="center">

![AutoGram Banner](https://img.shields.io/badge/AutoGram-Telegram%20Content%20Pipeline-6366f1?style=for-the-badge&logo=telegram&logoColor=white)

**A fully automated, AI-powered pipeline to scrape, rewrite, review, and publish content from Telegram channels.**

[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Groq AI](https://img.shields.io/badge/Groq-AI%20Rewriter-FF4500?style=flat-square)](https://groq.com)
[![Telethon](https://img.shields.io/badge/Telethon-MTProto-2CA5E0?style=flat-square&logo=telegram&logoColor=white)](https://docs.telethon.dev)

</div>

---

## 📖 Overview

**AutoGram** is a three-part, semi-automated content system that monitors public Telegram channels, processes scraped messages with an AI rewriter, presents them in an admin dashboard for human review, and then automatically publishes approved posts to your own Telegram channel — hands-free.

```
┌─────────────────────────────────────────────────────────────────────┐
│                       AutoGram Pipeline                             │
│                                                                     │
│   ┌──────────┐    ┌──────────────┐    ┌──────────┐    ┌─────────┐  │
│   │ Telegram │───▶│   Scraper    │───▶│   Web    │───▶│ Poster  │  │
│   │ Channels │    │  (Python /   │    │ Dashboard│    │ (Node / │  │
│   │ (Source) │    │  Telethon)   │    │ (Next.js)│    │  Cron)  │  │
│   └──────────┘    └──────────────┘    └────┬─────┘    └────┬────┘  │
│                                            │               │       │
│                                       AI Rewrite      Publishes    │
│                                        (Groq API)    to your Tg    │
│                                       + Human Review   Channel     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔍 **Live + Historical Scraping** | Fetches the latest 5 messages on startup, then listens for new messages in real-time |
| 🧹 **Spam Filtering** | Automatically strips ad links, `@mentions`, and excessive whitespace from scraped content |
| 🔁 **Deduplication** | Maintains a persistent state file to never ingest the same message twice |
| 🤖 **AI Rewriting** | Groq API rewrites raw scraped text into clean, publishable content |
| 📋 **Admin Dashboard** | Next.js web UI to review, edit, approve, or reject posts before they go live |
| 📣 **Auto-Publishing** | A Node.js cron job polls MongoDB every minute and sends approved posts to your channel |
| ⏱️ **Rate-Limit Aware** | Handles Telegram `FloodWaitError` gracefully with automatic backoff |

---

## 🗂️ Project Structure

```
telegram_bot/
│
├── 📁 scraper/              # Python Telethon scraper
│   ├── main.py              # Core scraping logic (live + historical)
│   ├── requirements.txt     # Python dependencies
│   ├── scraper_state.json   # Deduplication state (auto-generated)
│   └── .env                 # Scraper secrets (API_ID, API_HASH, etc.)
│
├── 📁 web/                  # Next.js admin dashboard + API backend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx             # Admin review dashboard UI
│   │   │   └── api/
│   │   │       ├── ingest/          # POST /api/ingest — receives scraped messages
│   │   │       └── posts/           # GET/PATCH /api/posts — manage post statuses
│   │   ├── components/
│   │   │   └── PostCard.tsx         # Card component for reviewing posts
│   │   ├── models/
│   │   │   └── Post.ts              # Mongoose schema for content posts
│   │   └── lib/                     # DB connection, Groq client utils
│   ├── package.json
│   └── .env                         # Web secrets (MONGO_URI, GROQ_API_KEY)
│
└── 📁 poster/               # Node.js Telegram publishing bot
    ├── poster.js            # Cron job: polls DB, sends approved posts
    ├── package.json
    └── .env                 # Poster secrets (BOT_TOKEN, TARGET_CHANNEL_ID)
```

---

## ⚙️ How It Works — Step by Step

### Step 1 — Scraper (`/scraper`)

The Python Telethon client authenticates via your **Telegram User API** (not a bot) to read public channels.

1. On startup, fetches the **last 5 messages** from every configured channel and pushes them to the web backend.
2. Then enters a **live listening loop**, forwarding every new message in real-time.
3. Before sending, each message is:
   - **Cleaned** (ad links, `@handles` stripped out)
   - **Deduplicated** against `scraper_state.json`
4. The cleaned payload is sent via `POST /api/ingest` to the Next.js backend.

### Step 2 — Web Dashboard (`/web`)

The Next.js app is both the **API backend** and the **admin frontend**.

- **`POST /api/ingest`**: Receives the scraped message, runs it through the **Groq AI API** to produce a rewritten version, and saves both the original and the rewritten text to MongoDB with status `pending`.
- **Admin UI**: Displays all posts filterable by status (`pending`, `approved`, `rejected`, `published`). You can review the AI's rewrite and approve or reject it.

### Step 3 — Poster (`/poster`)

A lightweight Node.js service with a **cron job** that fires every minute.

1. Queries MongoDB for the oldest `approved` post.
2. Sends the AI-rewritten text to your Telegram channel via the **Bot API** using HTML parse mode.
3. Updates the post status to `published` and saves the resulting `message_id`.

---

## 🚀 Setup & Installation

### Prerequisites

- Python **3.9+** and `pip`
- Node.js **18+** and `npm`
- A **MongoDB** database (Atlas or self-hosted)
- A **Telegram API** account at [my.telegram.org](https://my.telegram.org) (`api_id` + `api_hash`)
- A **Telegram Bot** token from [@BotFather](https://t.me/BotFather)
- A **Groq API** key from [console.groq.com](https://console.groq.com)

---

### 1️⃣ Set Up the Scraper

```bash
cd scraper

# Create and activate a virtual environment
python -m venv venv
.\venv\Scripts\activate      # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file inside `scraper/`:

```env
API_ID=your_telegram_api_id
API_HASH=your_telegram_api_hash
PHONE=+1234567890
TARGET_CHANNELS=channelname1,channelname2,-100123456789
INGEST_URL=http://localhost:3000/api/ingest
```

> **`TARGET_CHANNELS`** accepts both public usernames (e.g., `durov`) and numeric channel IDs (e.g., `-100123456789`).

Run the scraper:

```bash
python main.py
```

> On first run, Telethon will prompt you for your phone number and a verification code to authenticate. A session file (`scraper_session.session`) is saved so you only need to do this once.

---

### 2️⃣ Set Up the Web Dashboard

```bash
cd web
npm install
```

Create a `.env` file inside `web/`:

```env
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/autogram
GROQ_API_KEY=gsk_your_groq_api_key
```

Start the development server:

```bash
npm run dev
```

The dashboard will be available at **[http://localhost:3000](http://localhost:3000)**.

---

### 3️⃣ Set Up the Poster Bot

```bash
cd poster
npm install
```

Create a `.env` file inside `poster/`:

```env
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/autogram
BOT_TOKEN=123456789:ABCdef...
TARGET_CHANNEL_ID=@your_channel_username
```

> ⚠️ Your bot must be an **admin** of the target channel with permission to post messages.

Start the poster:

```bash
npm start
```

---

## 🗃️ Data Model

All content is stored in MongoDB as **Post** documents with the following schema:

```typescript
{
  originalText: string;         // Raw text scraped from the source channel
  aiRewrittenText: string;      // Groq-rewritten version ready to publish
  status: "pending"             // Waiting for review
         | "approved"           // Human-approved, queued for publishing
         | "rejected"           // Human-rejected, will not be published
         | "published";         // Successfully sent to the Telegram channel
  sourceChannel: string;        // Username or ID of origin channel
  sourceMessageId?: number;     // Original Telegram message ID (for tracing)
  publishedMessageId?: number;  // Telegram message ID after publishing
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ingest` | Receives a scraped message, triggers AI rewrite, saves to DB |
| `GET` | `/api/posts?status=pending` | Returns all posts matching the given status |
| `PATCH` | `/api/posts/:id` | Updates a post (approve / reject / edit AI text) |

---

## 🧠 AI Rewriting with Groq

When a message is ingested, the `/api/ingest` endpoint calls the **Groq API** (using a fast LLaMA-family model) to:

- Rewrite the raw content in a clean, engaging tone
- Remove promotional language that the scraper may have missed
- Format the output for Telegram (supports HTML: `<b>`, `<i>`, `<a>`, etc.)

The original text is always preserved so you can compare it side-by-side in the dashboard.

---

## 🖥️ Dashboard Preview

The **AutoGram** admin dashboard provides:

- **Status filter tabs** — switch between Pending, Approved, Rejected, and Published views
- **Post cards** — side-by-side view of the original and AI-rewritten text
- **One-click actions** — Approve ✅ or Reject ❌ with a single button
- **Live indicator** — pulsing badge confirms the scraper is actively running

---

## 🛡️ Environment Variables Reference

### `scraper/.env`

| Variable | Description | Required |
|----------|-------------|----------|
| `API_ID` | Telegram User API ID from my.telegram.org | ✅ |
| `API_HASH` | Telegram User API Hash | ✅ |
| `PHONE` | Your Telegram phone number (with country code) | ✅ |
| `TARGET_CHANNELS` | Comma-separated list of channel usernames or IDs | ✅ |
| `INGEST_URL` | Full URL to the web `/api/ingest` endpoint | ✅ |

### `web/.env`

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGO_URI` | MongoDB connection string | ✅ |
| `GROQ_API_KEY` | Groq API key for AI rewriting | ✅ |

### `poster/.env`

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGO_URI` | MongoDB connection string (same DB as web) | ✅ |
| `BOT_TOKEN` | Telegram Bot token from @BotFather | ✅ |
| `TARGET_CHANNEL_ID` | Target channel username or numeric ID to post into | ✅ |

---

## 🔒 Security & Legal Notes

- **Never commit your `.env` files.** All three modules include `.env` in their `.gitignore`.
- The scraper uses the **Telegram User API** (MTProto), not the Bot API — it authenticates as a real user. Use a dedicated account, not your personal one.
- Only scrape **public** channels. Scraping private channels without permission violates Telegram's Terms of Service.
- Always respect the original content creators and Telegram's [Terms of Service](https://telegram.org/tos).

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Scraper** | Python 3, [Telethon](https://docs.telethon.dev), `requests`, `python-dotenv` |
| **Web Backend** | [Next.js 16](https://nextjs.org) (App Router), TypeScript, Mongoose |
| **Database** | [MongoDB](https://mongodb.com) |
| **AI** | [Groq API](https://groq.com) (LLaMA-family models) |
| **Frontend** | React 19, Tailwind CSS v4, Lucide Icons |
| **Publisher** | Node.js, [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api), [node-cron](https://github.com/node-cron/node-cron) |

---

## 📄 License

This project is for personal and educational use. All third-party services (Telegram, Groq, MongoDB) are subject to their own Terms of Service.

---

<div align="center">

Built with ❤️ using Python, Next.js, and the Telegram API.

</div>
