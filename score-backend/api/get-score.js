import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Connected to MongoDB');
    }
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
};

const ScoreSchema = new mongoose.Schema({
  player: { type: String, required: true, unique: true },
  highScore: { type: Number, default: 0 },
});

const Score = mongoose.models.Score || mongoose.model('Score', ScoreSchema);

// Helper function to set CORS headers
const setCorsHeaders = (res) => {
  const allowedOrigins = [
    'https://new-game-7g95qeu1x-avanishs-projects-3608432a.vercel.app',
    'https://new-game-dusky.vercel.app',
    'http://localhost:3000' // for local development
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
};

export default async function handler(req, res) {
  // Set CORS headers
  setCorsHeaders(res);

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  try {
    await connectDB();
    
    const player = req.query.player;
    if (!player) {
      return res.status(400).json({
        success: false,
        error: 'Player name is required'
      });
    }

    const score = await Score.findOne({ player });
    
    return res.status(200).json({ 
      success: true,
      player,
      highScore: score ? score.highScore : 0 
    });

  } catch (err) {
    console.error('Error in /api/get-score:', err);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: err.message 
    });
  }
}
