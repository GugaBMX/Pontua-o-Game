// server.js
// Servidor básico em Node.js + Express que serve o frontend e grava/ler JSONs por jogo.
// Rodar: npm install && npm start
const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper: path to JSON file per game
function filePath(game) {
  // sanitize simple: allow only alphanumeric and dash/underscore
  const safe = game.replace(/[^a-z0-9-_]/gi, '');
  return path.join(DATA_DIR, safe + '.json');
}

// Read data (returns array), creates file if missing
function readData(game) {
  const fp = filePath(game);
  if (!fs.existsSync(fp)) {
    fs.writeFileSync(fp, JSON.stringify([], null, 2));
    return [];
  }
  try {
    const raw = fs.readFileSync(fp, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    console.error('Erro lendo JSON', fp, e);
    return [];
  }
}

// Write data (overwrites)
function writeData(game, arr) {
  const fp = filePath(game);
  fs.writeFileSync(fp, JSON.stringify(arr, null, 2), 'utf8');
}

// API: pegar placar do jogo
app.get('/api/:game', (req, res) => {
  const game = req.params.game;
  const arr = readData(game);
  res.json(arr);
});

// API: substituir lista de jogadores (envia array)
app.post('/api/:game', (req, res) => {
  const game = req.params.game;
  const body = req.body;
  if (!Array.isArray(body)) {
    return res.status(400).json({ error: 'Body deve ser um array de jogadores' });
  }
  // validate simple shape
  const cleaned = body.map(p => ({
    id: String(p.id || ''),
    name: String(p.name || '').trim(),
    wins: Number(p.wins || 0),
    points: Number(p.points || 0)
  }));
  writeData(game, cleaned);
  res.json({ ok: true, saved: cleaned.length });
});

// Fallback: serve index.html for unknown routes (so client-side routing works in future)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
