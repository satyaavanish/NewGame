import mongoose from 'mongoose';

const connectDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
};

const ScoreSchema = new mongoose.Schema({
  player: { type: String, required: true, unique: true },
  highScore: { type: Number, default: 0 },
});

const Score = mongoose.models.Score || mongoose.model('Score', ScoreSchema);

export default async function handler(req, res) {
  // ✅ Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*"); // Use specific origin in production
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ✅ Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET allowed' });
  }

  try {
    await connectDB();
    const player = req.query.player;
    const score = await Score.findOne({ player });
    res.status(200).json({ player, highScore: score ? score.highScore : 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
