import mongoose from "mongoose";

// Debug
console.log("MONGODB_URI exists:", !!process.env.MONGODB_URI);

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      console.log("Connecting to MongoDB...");
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("Connected to MongoDB");
    }
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
};

const ScoreSchema = new mongoose.Schema({
  player: {
    type: String,
    required: true,
    unique: true,
  },
  highScore: {
    type: Number,
    default: 0,
  },
});

const Score =
  mongoose.models.Score || mongoose.model("Score", ScoreSchema);

// CORS
const setCorsHeaders = (req, res) => {
  const allowedOrigins = [
    "https://new-game-dusky.vercel.app",
    "https://new-game-7g95qeu1x-avanishs-projects-3608432a.vercel.app",
    "http://localhost:3000",
  ];

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");
};

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    await connectDB();

    const player = req.query.player;

    if (!player) {
      return res.status(400).json({
        success: false,
        error: "Player name is required",
      });
    }

    const score = await Score.findOne({ player });

    return res.status(200).json({
      success: true,
      player,
      highScore: score ? score.highScore : 0,
    });
  } catch (err) {
    console.error("Error in /api/get-score:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}
