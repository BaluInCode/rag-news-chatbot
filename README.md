# 📰 RAG-Powered News Chatbot

A full-stack chatbot that answers queries over a news corpus using a Retrieval-Augmented Generation (RAG) pipeline.  
Built as part of an assignment for the **Full Stack Developer** role at **Voosh**.

---

## 🚀 Features

- **News Corpus Ingestion**: Scrapes ~50 news articles from RSS feeds or HTML.
- **Embeddings**: Uses Jina Embeddings or any open-source embedding model.
- **Vector Search**: Stores embeddings in a vector database (Qdrant, Chroma, or FAISS).
- **RAG Pipeline**:
  - Retrieve top-k relevant passages from the vector DB.
  - Call **Google Gemini API** for the final answer.
- **Session Management**:
  - Unique session IDs per user.
  - Chat history stored in Redis (TTL configurable).
- **Frontend** (React + SCSS):
  - Chat screen displays past messages.
  - Input box for new messages.
  - Streaming / typed-out bot responses.
  - “Reset session” button to clear chat.
- **Backend** (Node.js + Express):
  - REST API and WebSocket support.
  - Optional persistence of chat transcripts to MySQL/Postgres.
- **Caching & Performance**:
  - Session history cached in Redis.
  - Cache TTL and warming strategy explained below.

---

## 🛠️ Tech Stack

| Component           | Technology                             |
|---------------------|----------------------------------------|
| Embeddings          | Jina Embeddings / Sentence Transformers|
| Vector Database     | Qdrant / Chroma / FAISS                |
| LLM API             | Google Gemini API                      |
| Backend             | Node.js + Express                      |
| Frontend            | React + SCSS                           |
| Cache & Sessions    | Redis                                   |
| Optional Database   | MySQL / Postgres                       |
| Containerization    | Docker + docker-compose                |

---

## ⚙️ Architecture Overview

