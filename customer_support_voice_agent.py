import os
import tempfile
import uuid
from datetime import datetime
import pyttsx3
import re
import traceback
import anthropic
from firecrawl import FirecrawlApp, ScrapeOptions
from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.http.models import Distance, VectorParams
from fastembed import TextEmbedding
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
import base64
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

# Initialisation globale
QDRANT_URL = os.getenv("QDRANT_URL", "")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "")
FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY", "")
CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY", "")
DOC_URL = "https://www.tripadvisor.com/Hotels-g293753-Tunisia-Hotels.html"

COLLECTION_NAME = "docs_embeddings"

app = FastAPI()

# Autoriser toutes les origines (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],  # Autorise uniquement ton front-end
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = None
embedding_model = None

# Initialisation Qdrant et embeddings au démarrage
@app.on_event("startup")
def startup_event():
    global client, embedding_model
    print("🔄 Initialisation Qdrant...")
    client, embedding_model = setup_qdrant_collection(QDRANT_URL, QDRANT_API_KEY)
    print("✅ Qdrant prêt.")
    print("🔄 Crawl de la documentation...")
    pages = crawl_documentation(FIRECRAWL_API_KEY, DOC_URL)
    print(f"✅ {len(pages)} pages récupérées.")
    print("🔄 Indexation des embeddings...")
    store_embeddings(client, embedding_model, pages, COLLECTION_NAME)
    print("✅ Système prêt !")
    

    
def setup_qdrant_collection(qdrant_url: str, qdrant_api_key: str, collection_name: str = COLLECTION_NAME):
    client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
    embedding_model = TextEmbedding()
    test_embedding = list(embedding_model.embed(["test"]))[0]
    embedding_dim = len(test_embedding)
    try:
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=embedding_dim, distance=Distance.COSINE)
        )
    except Exception as e:
        if "already exists" not in str(e):
            raise e
    return client, embedding_model

def crawl_documentation(firecrawl_api_key: str, url: str):
    firecrawl = FirecrawlApp(api_key=firecrawl_api_key)
    response = firecrawl.crawl_url(
        url,
        limit=5,
        scrape_options=ScrapeOptions(formats=['markdown', 'html'])
    )
    pages = []
    while True:
        for page in getattr(response, 'data', []):
            content = getattr(page, 'markdown', None) or getattr(page, 'html', '')
            metadata = getattr(page, 'metadata', {})
            source_url = metadata.get('sourceURL', '')
            pages.append(dict(
                content=content,
                url=source_url,
                metadata=dict(
                    title=metadata.get('title', ''),
                    description=metadata.get('description', ''),
                    language=metadata.get('language', 'en'),
                    crawl_date=datetime.now().isoformat()
                )
            ))
        next_url = getattr(response, 'next', None)
        if not next_url:
            break
        response = firecrawl.get(next_url)
    return pages

def store_embeddings(client: QdrantClient, embedding_model: TextEmbedding, pages, collection_name: str):
    for page in pages:
        embedding = list(embedding_model.embed([page["content"]]))[0]
        payload = {
            "content": page.get("content", ""),
            "url": page.get("url", ""),
        }
        if "metadata" in page and isinstance(page["metadata"], dict):
            payload.update(page["metadata"])
        client.upsert(
            collection_name=collection_name,
            points=[
                models.PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embedding.tolist(),
                    payload=payload
                )
            ]
        )

def clean_hotel_info(raw_text: str) -> str:
    text = raw_text
    # Remove images and base64 SVG blobs
    text = re.sub(r"!\[.*?\]\(.*?\)", "", text)
    text = re.sub(r"\[.*?\]\(data:image/svg.*?\)", "", text, flags=re.DOTALL)
    # Remove profile/user avatars/links
    text = re.sub(r"\[.*?\]\(https://www\.tripadvisor\.com/Profile/.*?\)", "", text)
    text = re.sub(r"@\w+", "", text)
    # Remove AI disclaimers or auto-generated notes
    text = re.sub(r"This hotel description was created by AI.*?\.", "", text, flags=re.DOTALL)
    text = re.sub(r"Tripadvisor did not create.*?description\.", "", text, flags=re.DOTALL)
    text = re.sub(r"Powered by AI.*", "", text)
    text = re.sub(r"Read more", "", text)
    # Remove navigation links and categories
    text = re.sub(r"\[.*?\]\(https://www\.tripadvisor\.com/.*?\)", "", text)
    # Remove headers and markdown fluff
    text = re.sub(r"[*]{2,}|#{1,6}|[* ]{3,}", "", text)
    # Remove calendar and unrelated months
    text = re.sub(r"\b(January|February|March|April|May|June|July|August|September|October|November|December)\b.*", "", text)
    text = re.sub(r"\bSUN|MON|TUE|WED|THU|FRI|SAT\b.*", "", text)
    # Collapse whitespace
    text = re.sub(r"\n\s*\n", "\n\n", text)
    text = re.sub(r" +", " ", text)
    return text.strip()

def ask_claude(query: str, client: QdrantClient, embedding_model: TextEmbedding, claude_api_key: str):
    query_embedding = list(embedding_model.embed([query]))[0]
    search_response = client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_embedding.tolist(),
        limit=5,
        with_payload=True
    )
    search_results = search_response.points if hasattr(search_response, 'points') else []
    hotel_info = ""
    for result in search_results:
        payload = result.payload or {}
        content = payload.get('content', '')
        cleaned_content = clean_hotel_info(content)
        hotel_info += cleaned_content.strip() + "\n\n"
        print(hotel_info)
    prompt = f"""
You are a helpful and professional travel agent at a Tunisian travel agency. 
Your job is to give detailed, accurate, and friendly advice to customers asking about hotels in Tunisia. 
You know the hotel offerings in various cities (like Tunis, Hammamet, Mahdia, Sousse, etc.) and can speak about hotel names, prices (if available), star ratings, customer reviews, locations, and services offered (like pools, spas, Wi-Fi, etc.).

Always answer directly, **never say things like 'based on the data provided'**. Instead, speak like an expert providing insights. 
If you find useful information in your internal documentation, include it naturally as part of your response.

Answer the following customer question clearly, using real names, numbers, ratings, reviews, or price ranges if available.
Use a helpful and friendly tone, as if speaking out loud to a customer at the counter.

Contextual knowledge about hotels:
{hotel_info}

Customer question: {query}

Respond now as a helpful travel advisor speaking to a customer in person.
"""
    client_claude = anthropic.Anthropic(api_key=claude_api_key)
    response = client_claude.messages.create(
        model="claude-3-haiku-20240307",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    )
    return response.content

class QueryRequest(BaseModel):
    query: str

@app.post("/ask")
def ask_endpoint(request: QueryRequest):
    try:
        result = ask_claude(request.query, client, embedding_model, CLAUDE_API_KEY)
        # Formatage joli de la réponse
        if isinstance(result, list):
            texts = []
            for item in result:
                item_str = str(item)
                match = re.search(r"text=['\"](.*?)['\"], type=", item_str)
                if match:
                    texts.append(match.group(1))
                else:
                    texts.append(item_str)
            formatted_text = "\n\n".join(texts)
        else:
            match = re.search(r"text=['\"](.*?)['\"], type=", str(result))
            if match:
                formatted_text = match.group(1)
            else:
                formatted_text = str(result)
        # Génération du fichier audio avec pyttsx3
        temp_dir = tempfile.gettempdir()
        audio_path = os.path.join(temp_dir, f"response_{uuid.uuid4()}.mp3")
        engine = pyttsx3.init()
        engine.save_to_file(formatted_text, audio_path)
        engine.runAndWait()
        # Encodage audio en base64
        with open(audio_path, "rb") as audio_file:
            audio_bytes = audio_file.read()
            audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
        return JSONResponse({
            "text": formatted_text,
            "audio_base64": audio_b64
        })
    except Exception as e:
        return JSONResponse({"error": str(e), "trace": traceback.format_exc()}, status_code=500)