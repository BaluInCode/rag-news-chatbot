import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { redisClient } from './redisClient.js';
import { searchQdrant } from './qdrantClient.js';
import { callGemini } from './geminiClient.js';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(bodyParser.json());

const COLLECTION = process.env.QDRANT_COLLECTION || 'news_passages';
const EMBED_MODEL_DIM = 1536;

// Helper: get embedding for user query
async function embedQueryText(text) {
  // Ideally use same embedding pipeline as ingestion (Jina)
  // You might call a local embedding endpoint or Jina client via HTTP
  const resp = await axios.post(process.env.JINA_EMBEDDING_HTTP || 'http://localhost:51000/embed', { texts: [text] });
  return resp.data[0].embedding;
}

app.post('/chat', async (req, res) => {
  try {
    const { sessionId, message, topK = 5 } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

    // 1) Save user message to Redis history
    const userMsg = { role: 'user', content: message, ts: Date.now() };
    await redisClient.rPush(`session:${sessionId}:history`, JSON.stringify(userMsg));
    // set TTL for session history (e.g., 24h)
    await redisClient.expire(`session:${sessionId}:history`, 24 * 3600);

    // 2) Embed query (same model as ingestion)
    const queryEmbedding = await embedQueryText(message);

    // 3) Retrieve top-k passages from Qdrant
    const results = await searchQdrant(queryEmbedding, topK);

    // 4) Build prompt/context for Gemini
    const contextTexts = results.map(r => {
      const payload = r.payload || {};
      return `Title: ${payload.title}\nLink: ${payload.link}\nPassage: ${payload.text || payload.content || ''}`; // ensure ingestion saved passage text in payload if desired
    }).join("\n\n---\n\n");

    const prompt = `You are a helpful assistant answering user questions based on news passages. Use the following passages strictly to answer, cite link(s) if relevant, and be concise.\n\nCONTEXT:\n${contextTexts}\n\nUSER QUESTION: ${message}\n\nAnswer:`;

    // 5) Call Gemini to generate final reply
    const gemResp = await callGemini([{ role: 'system', content: 'You are a helpful news assistant.' }, { role: 'user', content: prompt }]);

    const botMessage = { role: 'assistant', content: gemResp?.text || gemResp?.output || JSON.stringify(gemResp), ts: Date.now() };

    // 6) Save assistant message to Redis
    await redisClient.rPush(`session:${sessionId}:history`, JSON.stringify(botMessage));
    await redisClient.expire(`session:${sessionId}:history`, 24 * 3600);

    // 7) Return answer + sources
    res.json({ answer: botMessage.content, sources: results.map(r => r.payload?.link) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal error', detail: String(err) });
  }
});

app.get('/history/:sessionId', async (req, res) => {
  const sid = req.params.sessionId;
  const items = await redisClient.lRange(`session:${sid}:history`, 0, -1);
  const history = items.map(i => JSON.parse(i));
  res.json({ history });
});

app.post('/reset/:sessionId', async (req, res) => {
  const sid = req.params.sessionId;
  await redisClient.del(`session:${sid}:history`);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`RAG backend listening on ${PORT}`));
