require('dotenv').config();
const cron = require('node-cron');
const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');

// --- Environment Variables ---
const MONGO_URI = process.env.MONGO_URI;
const BOT_TOKEN = process.env.BOT_TOKEN;
const TARGET_CHANNEL_ID = process.env.TARGET_CHANNEL_ID;

if (!MONGO_URI || !BOT_TOKEN || !TARGET_CHANNEL_ID) {
  console.error("Missing MONGO_URI, BOT_TOKEN, or TARGET_CHANNEL_ID in environment variables");
  process.exit(1);
}

// --- Initialize Components ---
const bot = new TelegramBot(BOT_TOKEN, { polling: false });

// Define Mongoose Schema (Mirror of Next.js model)
const postSchema = new mongoose.Schema({
  originalText: String,
  aiRewrittenText: String,
  status: { type: String, enum: ["pending", "approved", "rejected", "published"] },
  sourceChannel: String,
  sourceMessageId: Number,
  publishedMessageId: Number,
}, { timestamps: true });

const Post = mongoose.model('Post', postSchema);

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB -> Publishing Bot Active.");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}

connectDB();

// --- Cron Job ---
// Run every minute
cron.schedule('* * * * *', async () => {
  console.log(`[${new Date().toISOString()}] Checking for approved posts...`);
  
  try {
    // Find oldest un-published approved post
    const postToPublish = await Post.findOne({ status: 'approved' }).sort({ updatedAt: 1 });

    if (!postToPublish) {
      console.log("No approved posts to publish.");
      return;
    }

    console.log(`Found post ${postToPublish._id} to publish. Sending to Telegram...`);

    // Only send the AI Rewritten Text
    const textToSend = postToPublish.aiRewrittenText;
    if (!textToSend) {
        console.error("Post has empty AI text. Skipping.");
        // optionally set status to rejected or pending
        return;
    }

    // Send the message using HTML parse mode
    const msg = await bot.sendMessage(TARGET_CHANNEL_ID, textToSend, {
        parse_mode: 'HTML',
        disable_web_page_preview: false
    });

    console.log(`Successfully published message (ID: ${msg.message_id})`);

    // Update status to 'published'
    postToPublish.status = 'published';
    postToPublish.publishedMessageId = msg.message_id;
    await postToPublish.save();

  } catch (error) {
    console.error("Error during publishing cycle:", error);
  }
});

console.log("Cron started. The bot will poll the DB every 1 minute.");
