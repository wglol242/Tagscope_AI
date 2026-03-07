from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Union, Dict, Any
from datetime import datetime
from ratelimit import limits, sleep_and_retry
from bs4 import BeautifulSoup
import os
import json
import re
import numpy as np
import requests
from dotenv import load_dotenv
import psycopg2
from psycopg2 import sql
from google import genai
from google.genai import types
from fastapi import Query

load_dotenv()
app = FastAPI(title="Bookmark Search API", version="1.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CONFIG_FILE = "config.json"
DEFAULT_CONFIG = {"google_api_key": ""}

class Bookmark(BaseModel):
    link: str
    summary: Optional[str] = None
    embedding_summary: Optional[List[float]] = None
    embedding_tags: Optional[List[float]] = None
    base_url: Optional[str] = None
    timestamp: Optional[str] = None
    tags: Optional[List[str]] = None
    source_type: Optional[str] = None
    image_url: Optional[str] = None

class BookmarkRequest(BaseModel):
    url: Union[str, List[str]]

class GoogleAPIKeyRequest(BaseModel):
    google_api_key: str

class UpdateBookmarkRequest(BaseModel):
    original_link: str
    new_link: str
    new_summary: str

def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as f:
            return json.load(f)
    return DEFAULT_CONFIG.copy()

def save_config(cfg):
    with open(CONFIG_FILE, "w") as f:
        json.dump(cfg, f)

config = load_config()

def get_client():
    cfg = load_config()
    if not cfg.get("google_api_key"):
        raise HTTPException(status_code=400, detail="Google API Key not configured")
    return genai.Client(api_key=cfg["google_api_key"])

def connect_to_db():
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
    )

def initialize_database():
    conn = connect_to_db()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS bookmarks (
                    id SERIAL PRIMARY KEY,
                    link TEXT NOT NULL UNIQUE,
                    summary TEXT,
                    embedding_summary VECTOR(1536),
                    embedding_tags VECTOR(1536),
                    base_url TEXT,
                    timestamp TIMESTAMP,
                    tags TEXT[],
                    source_type TEXT NOT NULL DEFAULT 'Etc',
                    image_url TEXT
                );
                """
            )
            cur.execute(
                """
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint WHERE conname = 'bookmarks_source_type_check'
                    ) THEN
                        ALTER TABLE bookmarks
                        ADD CONSTRAINT bookmarks_source_type_check
                        CHECK (source_type IN ('Social','Media','Portal','Blog','News','Tool','Public','Etc'));
                    END IF;
                END $$;
                """
            )
            cur.execute("CREATE INDEX IF NOT EXISTS idx_bookmarks_source_type ON bookmarks (source_type);")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_bookmarks_base_url ON bookmarks (base_url);")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_bookmarks_timestamp ON bookmarks (timestamp DESC);")
            cur.execute(
                """
                CREATE INDEX IF NOT EXISTS bookmarks_embedding_summary_hnsw_cos
                ON bookmarks USING hnsw (embedding_summary vector_cosine_ops)
                WITH (m = 16, ef_construction = 200);
                """
            )
            cur.execute(
                """
                CREATE INDEX IF NOT EXISTS bookmarks_embedding_tags_hnsw_cos
                ON bookmarks USING hnsw (embedding_tags vector_cosine_ops)
                WITH (m = 16, ef_construction = 200);
                """
            )
    finally:
        conn.close()

def get_og_image(url: str) -> Optional[str]:
    try:
        resp = requests.get(url, timeout=5, headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        og_tag = soup.find("meta", property="og:image")
        if og_tag and og_tag.get("content"):
            return og_tag["content"].strip()
        return None
    except Exception:
        return None

@sleep_and_retry
@limits(calls=14, period=1)
def get_summary_and_tags(url: str):
    client = get_client()
    m = re.search(r"https?://([^/]+)", url)
    base_domain = m.group(1) if m else url
    title = base_domain
    try:
        resp = requests.get(url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
        soup = BeautifulSoup(resp.content, "html.parser")
        if soup.title and soup.title.string:
            title = soup.title.string.strip()

        prompt = f"""
입력 데이터:
- Title: {title}
- Url: {url}
- BaseDomain: {base_domain}

작업:
1) Title 텍스트만 사용하여, 가능한 경우 간결하게 요약하세요.
2) Title을 참고하여 관련성 높은면서 넓은 의미의 상위 8개의 태그를 생성하세요.
3) 사이트 유형 분류: Social, Media, Portal, Blog, Tool, News, Public, Etc
4) 무조건 JSON 파일 형식으로 출력하세요.
JSON:
{{
  "summary": "string",
  "tags": ["string","string","string","string","string","string","string","string"],
  "source_type": "Social|Media|Portal|Blog|Tool|News|Public|Etc"
}}
"""
        response = client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )

        raw = response.text.strip()
        try:
            result = json.loads(raw)
        except Exception:
            mm = re.search(r"\{.*\}", raw, re.DOTALL)
            result = json.loads(mm.group(0)) if mm else {}

        summary = (result.get("summary") or title).strip()
        tags = result.get("tags") or []
        source_type = (result.get("source_type") or "Etc").strip()
        return summary, tags, source_type

    except Exception:
        return title, [title], "Etc"

def get_embedding(corpus: str) -> np.ndarray:
    cfg = load_config()
    api_key = cfg.get("google_api_key")
    if not api_key:
        raise HTTPException(status_code=400, detail="Google API Key not configured")

    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent"
    params = {"key": api_key}
    headers = {"Content-Type": "application/json"}
    data = {
        "model": "models/gemini-embedding-001",
        "content": {"parts": [{"text": corpus}]},
        "output_dimensionality": 1536,
    }

    resp = requests.post(url, params=params, headers=headers, json=data)
    if resp.status_code == 200:
        j = resp.json()
        embedding = j.get("embedding", {}).get("values") or j.get("data", [{}])[0].get("embedding", {}).get("values")
        if not embedding:
            raise HTTPException(status_code=502, detail="Embedding missing in response")
        return np.array(embedding, dtype=np.float32)
    else:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)

def rerank_with_gemini(query: str, candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    client = get_client()

    docs_text = "\n".join([
        f"[{i+1}] 요약: {c.get('summary') or 'No summary'}"
        for i, c in enumerate(candidates)
    ])

    prompt = f"""
검색 키워드: {query}

후보 문서:
{docs_text}

작업:
1. 각 요약이 키워드와 직접적으로 연관되어 있는지 판단하세요.  
2. 연관성이 전혀 없거나 약한 문서는 반드시 제외하세요.  
3. 남은 문서를 관련성이 높은 순서대로 정렬하세요.  
4. 최종 출력은 JSON 형식으로, 선택한 문서 인덱스만 포함하세요.  

출력 예시:
{{
  "relevant": [2, 5, 1]
}}
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(response_mime_type="application/json"),
    )

    raw = getattr(response, "text", "").strip()
    
    try:
        result = json.loads(raw)
        order = result.get("relevant", [])
    except Exception:
        order = []

    reranked = []
    for i in order:
        try:
            idx = int(i)
            if 1 <= idx <= len(candidates):
                reranked.append(candidates[idx-1])
        except Exception:
            continue

    return reranked

def read_bookmarks():
    conn = connect_to_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT link, summary, embedding_summary, embedding_tags, base_url, timestamp, tags, source_type, image_url FROM bookmarks ORDER BY timestamp DESC NULLS LAST"
    )
    bookmarks = [
        {
            'link': row[0], 'summary': row[1],
            'embedding_summary': row[2], 'embedding_tags': row[3],
            'base_url': row[4], 'timestamp': row[5], 'tags': row[6],
            'source_type': row[7], 'image_url': row[8]
        }
        for row in cur.fetchall()
    ]
    cur.close()
    conn.close()
    return bookmarks

def write_bookmark(bookmark: dict):
    conn = connect_to_db()
    cur = conn.cursor()
    cur.execute(
        sql.SQL(
            """INSERT INTO bookmarks (link, summary, embedding_summary, embedding_tags, base_url, timestamp, tags, source_type, image_url)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (link) DO NOTHING"""
        ),
        (
            bookmark['link'], bookmark.get('summary'),
            bookmark.get('embedding_summary'), bookmark.get('embedding_tags'),
            bookmark.get('base_url'), bookmark.get('timestamp'), bookmark.get('tags'),
            bookmark.get('source_type', 'Etc'), bookmark.get('image_url')
        )
    )
    conn.commit()
    cur.close()
    conn.close()

def remove_bookmark_db(link: str):
    conn = connect_to_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM bookmarks WHERE link = %s", (link,))
    conn.commit()
    cur.close()
    conn.close()

def update_bookmark_db(original_link: str, new_link: str, new_summary: str):
    conn = connect_to_db()
    cur = conn.cursor()
    cur.execute("UPDATE bookmarks SET link=%s, summary=%s WHERE link=%s",
                (new_link, new_summary, original_link))
    conn.commit()
    cur.close()
    conn.close()

def semantic_search_db(query_vector: List[float], limit: int = 50) -> Dict[str, Any]:
    conn = connect_to_db()
    cur = conn.cursor()
    cur.execute(
        """SELECT link, summary, base_url, timestamp, tags, source_type, image_url,
                  1 - (embedding_summary <-> %s::vector) AS score
           FROM bookmarks WHERE embedding_summary IS NOT NULL
           ORDER BY embedding_summary <-> %s::vector LIMIT %s""",
        (query_vector, query_vector, limit),
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    results = []
    for row in rows:
        score = float(row[7]) if row[7] is not None else 0.0
        results.append({
            "link": row[0], "summary": row[1], "base_url": row[2],
            "timestamp": row[3], "tags": row[4], "source_type": row[5],
            "image_url": row[6], "score": score,
        })
    return {"count": len(results), "results": results}

@app.get("/bookmarks")
async def get_all_bookmarks():
    return read_bookmarks()

@app.post("/bookmarks")
async def add_bookmark(bookmark_request: BookmarkRequest):
    urls = [bookmark_request.url] if isinstance(bookmark_request.url, str) else (bookmark_request.url or [])
    if not urls:
        raise HTTPException(status_code=400, detail="Missing 'url'")
    for url in urls:
        m = re.search(r'https?://([^/]+)', url)
        base_url = m.group(1) if m else url
        summary, tags, source_type = get_summary_and_tags(url)
        embedding_summary = get_embedding(summary)
        tags_text = " ".join(tags) if tags else ""
        embedding_tags = get_embedding(tags_text) if tags_text else None
        image_url = get_og_image(url)
        new_bookmark = {
            'link': url,
            'summary': summary,
            'embedding_summary': embedding_summary.tolist(),
            'embedding_tags': embedding_tags.tolist() if embedding_tags is not None else None,
            'base_url': base_url,
            'timestamp': datetime.now(),
            'tags': tags,
            'source_type': source_type,
            'image_url': image_url
        }
        try:
            write_bookmark(new_bookmark)
        except psycopg2.errors.UniqueViolation:
            continue
    return {"message": "Bookmarks added successfully."}

@app.delete("/bookmarks")
async def remove_bookmark(request: BookmarkRequest):
    urls = [request.url] if isinstance(request.url, str) else (request.url or [])
    if not urls:
        raise HTTPException(status_code=400, detail="Missing 'url'")
    for url in urls:
        try:
            remove_bookmark_db(url)
        except Exception:
            pass
    return {"message": "Bookmarks removed successfully."}

@app.put("/bookmarks")
async def update_bookmark(request: UpdateBookmarkRequest):
    update_bookmark_db(request.original_link, request.new_link, request.new_summary)
    return {"message": "Bookmark updated successfully."}

@app.get("/search")
async def search_bookmarks(
    query: str,
    top_n: int = 10,
    precision: bool = Query(False),
    types: Optional[str] = None,   
    tags: Optional[str] = None     
) -> Dict[str, Any]:
    if not query or not query.strip():
        raise HTTPException(status_code=400, detail="Query is empty")

    qvec_summary = get_embedding(query)
    qvec_tags = get_embedding(query)

    conn = connect_to_db()
    cur = conn.cursor()

    where_clauses = ["embedding_summary IS NOT NULL", "embedding_tags IS NOT NULL"]
    params = [query, qvec_summary.tolist(), qvec_tags.tolist()]

    if types:
        type_list = [t.strip() for t in types.split(",") if t.strip()]
        if type_list:
            where_clauses.append("source_type = ANY(%s::text[])")
            params.append(type_list)

    if tags:
        tag_list = [t.strip() for t in tags.split(",") if t.strip()]
        if tag_list:
            where_clauses.append("tags && %s::text[]")
            params.append(tag_list)

    params.append(top_n)

    sql = f"""
    SELECT link, summary, base_url, timestamp, tags, source_type, image_url,
           ts_rank_cd(to_tsvector('simple', coalesce(summary,'')), plainto_tsquery('simple', %s)) AS bm25_score,
           1 - (embedding_summary <-> %s::vector) AS sim_score,
           1 - (embedding_tags <-> %s::vector) AS tag_score
    FROM bookmarks
    WHERE {" AND ".join(where_clauses)}
    ORDER BY bm25_score DESC, sim_score DESC, tag_score DESC
    LIMIT %s
    """

    cur.execute(sql, params)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    results = []
    for idx, row in enumerate(rows, start=1):   
        bm25_score = float(row[7]) if row[7] is not None else 0.0
        sim_score = float(row[8]) if row[8] is not None else 0.0
        tag_score = float(row[9]) if row[9] is not None else 0.0
        total_score = bm25_score + sim_score + tag_score

        results.append({
            "link": row[0], "summary": row[1], "base_url": row[2],
            "timestamp": row[3], "tags": row[4], "source_type": row[5],
            "image_url": row[6],
            "bm25_score": bm25_score,
            "sim_score": sim_score,
            "tag_score": tag_score,
            "total_score": total_score,
        })

    results = sorted(results, key=lambda x: x["total_score"], reverse=True)

    if precision and results:
        results = rerank_with_gemini(query, results)

    return {"query": query, "count": len(results), "results": results}

@app.get("/config")
async def get_config():
    return config

@app.post("/config")
async def update_config(request: GoogleAPIKeyRequest):
    config['google_api_key'] = request.google_api_key
    save_config(config)
    return {"message": "Config updated successfully."}

@app.get("/test_models")
async def test_models():
    try:
        client = get_client()
        res = client.models.generate_content(
            model="gemini-2.5-flash",
            contents="테스트 문장"
        )

        output = None
        if hasattr(res, "text"):
            output = res.text
        elif hasattr(res, "candidates") and res.candidates:
            parts = res.candidates[0].content.parts
            if parts:
                output = parts[0].text

        return {"message": "Models test successful.", "sample": output}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test failed: {str(e)}")

@app.on_event("startup")
async def startup_event():
    initialize_database()
