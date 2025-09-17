# ingest_news.py
import os
import feedparser
import requests
from bs4 import BeautifulSoup
from jina import Client as JinaClient  # jina-client for embeddings (example)
from qdrant_client import QdrantClient
from qdrant_client.http import models as rest
import tiktoken  # optional for token-based chunking
import uuid
import time

# CONFIG
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", None)
COLLECTION_NAME = "news_passages"
JINA_EMBEDDING_ENDPOINT = os.getenv("JINA_EMBEDDING_ENDPOINT", None)  # if running jina embedder service
RSS_FEEDS = [
    "http://feeds.bbci.co.uk/news/rss.xml",
    "https://rss.cnn.com/rss/edition.rss",
    # add more; target ~50 articles total
]

def fetch_article_from_feed(url):
    feed = feedparser.parse(url)
    articles = []
    for entry in feed.entries[:30]:
        link = entry.get("link")
        title = entry.get("title", "")
        # try to extract main text via requests+bs4 (simple)
        try:
            r = requests.get(link, timeout=10)
            soup = BeautifulSoup(r.text, "html.parser")

            # Naive extraction: join paragraphs
            paragraphs = [p.get_text().strip() for p in soup.find_all("p")]
            content = "\n\n".join(paragraphs)
        except Exception as e:
            content = entry.get("summary", "")
        articles.append({"id": entry.get("id", str(uuid.uuid4())), "title": title, "link": link, "content": content})
    return articles

def chunk_text(text, max_chars=2000):
    # Basic chunker by characters (you can replace with token-based)
    chunks = []
    i = 0
    while i < len(text):
        chunk = text[i:i+max_chars]
        chunks.append(chunk)
        i += max_chars
    return chunks

def embed_texts(texts):
    # Example: using Jina Embeddings via HTTP endpoint OR jina-client if available
    # Here we'll use simple placeholder: call a local Jina Embed service.
    # Replace with exact Jina usage per your setup.
    from jina import Client
    client = Client(host=JINA_EMBEDDING_ENDPOINT or "grpc://0.0.0.0:51000")
    resp = client.post("/embed", inputs=texts, return_results=True)
    # resp contains embeddings — extract depending on your Jina server implementation
    embeddings = []
    for r in resp:
        embeddings.append(r.embedding)  # may require adaptation
    return embeddings

def main():
    all_articles = []
    for feed in RSS_FEEDS:
        all_articles.extend(fetch_article_from_feed(feed))
    # Limit to ~50
    all_articles = all_articles[:50]

    # Prepare qdrant client
    qclient = QdrantClient(url=QDRANT_URL, prefer_grpc=False, api_key=QDRANT_API_KEY)

    # create collection if not exists
    try:
        qclient.recreate_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=rest.VectorParams(size=1536, distance=rest.Distance.COSINE)
        )
    except Exception as e:
        print("Collection exists or creation error:", e)

    points = []
    texts_to_embed = []
    meta_list = []
    for art in all_articles:
        chunks = chunk_text(art["content"] or art["title"], max_chars=1500)
        for idx, chunk in enumerate(chunks):
            pid = str(uuid.uuid4())
            metadata = {
                "article_id": art["id"],
                "title": art["title"],
                "link": art["link"],
                "chunk_index": idx
            }
            texts_to_embed.append(chunk)
            meta_list.append((pid, metadata))

    # Batch embed
    batch_size = 16
    for i in range(0, len(texts_to_embed), batch_size):
        batch_texts = texts_to_embed[i:i+batch_size]
        embeddings = embed_texts(batch_texts)
        points_batch = []
        for j, emb in enumerate(embeddings):
            pid, metadata = meta_list[i+j]
            points_batch.append(rest.PointStruct(id=pid, vector=emb, payload=metadata))
        qclient.upsert(collection_name=COLLECTION_NAME, points=points_batch)
        time.sleep(0.2)
        print(f"Upserted batch {i//batch_size + 1}")

if __name__ == "__main__":
    main()
