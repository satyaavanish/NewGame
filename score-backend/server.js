import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import nodemailer from 'nodemailer';

const app = express();
const PORT = 3000;

console.log("Starting server...");

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/highscores', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Score Schema & Model
import mongoosePkg from 'mongoose';
const { Schema, model } = mongoosePkg;

const scoreSchema = new Schema({
  player: { type: String, required: true, unique: true },
  highScore: { type: Number, default: 0 },
});

const Score = model('Score', scoreSchema);

// GET: Fetch player score
app.get('/score/:player', async (req, res) => {
  try {
    const playerName = req.params.player;
    const score = await Score.findOne({ player: playerName });
    res.json({ player: playerName, highScore: score ? score.highScore : 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Save/Update high score
app.post('/score', async (req, res) => {
  try {
    const { player, score } = req.body;
    if (!player || score === undefined) {
      return res.status(400).json({ error: 'Player name and score required' });
    }

    const existingScore = await Score.findOne({ player });
    if (!existingScore) {
      await new Score({ player, highScore: score }).save();
    } else if (score > existingScore.highScore) {
      existingScore.highScore = score;
      await existingScore.save();
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
