# 📰 RAG-Powered News Chatbot

A simple full-stack chatbot that answers queries over a news corpus using a Retrieval-Augmented Generation (RAG) pipeline.  
Built as an assignment for the Full Stack Developer role at **Voosh**.

---

## 🚀 Features
- Ingest ~50 news articles (RSS feeds or scraped HTML).
- Embedding using **Jina Embeddings** (or any open-source embeddings).
- Vector storage using **Qdrant / Chroma / Faiss**.
- Query pipeline:
  1. Retrieve top-k relevant passages.
  2. Call **Google Gemini API** for the final answer.
- Session-based chat with unique session IDs.
- **Backend**: Node.js (Express)
  - REST API + WebSocket support
  - Redis for in-memory chat history
  - Optionally persist transcripts to MySQL/Postgres
- **Frontend**: React + SCSS
  - Chat screen with past messages
  - Input box for new messages
  - Streaming/typed bot responses
  - “Reset session” button
- **Caching**:
  - Session history cached in Redis
  - TTL configurable (default: 30 minutes)
  - Example cache warming strategy documented below

---

## 🛠️ Tech Stack
- **Embeddings**: Jina Embeddings (free tier)
- **Vector DB**: Qdrant / Chroma / Faiss (choose one)
- **LLM API**: Google Gemini (free trial)
- **Backend**: Node.js + Express
- **Cache & Sessions**: Redis (in-memory)
- **Database (optional)**: MySQL/Postgres
- **Frontend**: React + SCSS
- **Containerization**: Docker + docker-compose

---

## ⚙️ Architecture Overview
