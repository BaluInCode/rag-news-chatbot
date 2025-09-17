import axios from 'axios';
const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const COLLECTION = process.env.QDRANT_COLLECTION || 'news_passages';

export async function searchQdrant(queryEmbedding, topK = 5) {
  const resp = await axios.post(`${QDRANT_URL}/collections/${COLLECTION}/points/search`, {
    vector: queryEmbedding,
    limit: topK,
    with_payload: true,
    with_vector: false
  });
  return resp.data.result || resp.data;
}
