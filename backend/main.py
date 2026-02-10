from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os
import json
import re
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    role: str  # "user" ou "assistant"
    content: str

class GenerateRequest(BaseModel):
    prompt: str
    context: list[Message] = []

class GenerateResponse(BaseModel):
    files: dict[str, str]
    message: str

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "message": "Backend is running"}

@app.post("/generate", response_model=GenerateResponse)
async def generate_code(request: GenerateRequest):
    if not OPENROUTER_API_KEY:
        raise HTTPException(500, "OPENROUTER_API_KEY not configured")

    messages = [{"role": m.role, "content": m.content} for m in request.context]
    messages.append({"role": "user", "content": request.prompt})

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "mistralai/devstral-2512",
                "messages": [
                    {"role": "system", "content": "You generate React/Vite code. Reply only in JSON with the shape: {\"files\": {\"path\": \"content\"}, \"message\": \"summary\"}"},
                    *messages
                ],
            },
            timeout=60.0
        )
    
    if response.status_code != 200:
        print(f"OpenRouter API error: {response.status_code} - {response.text}")
        raise HTTPException(500, f"OpenRouter API error: {response.status_code}")
    
    data = response.json()
    
    if "choices" not in data or not data["choices"]:
        print(f"Invalid API response structure: {data}")
        raise HTTPException(500, "Invalid API response structure")
    content = data["choices"][0]["message"]["content"]
    
    if not content or not content.strip():
        raise HTTPException(500, "Empty response from model")
    
    content = content.strip()
    if content.startswith("```"):
        match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', content, re.DOTALL)
        if match:
            content = match.group(1).strip()
    
    try:
        result = json.loads(content)
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
        print(f"Content that failed to parse: {content}")
        raise HTTPException(500, f"Invalid model response JSON: {str(e)}")
    
    if "files" not in result or "message" not in result:
        raise HTTPException(500, "Invalid response format (missing 'files' or 'message')")
    
    return GenerateResponse(files=result["files"], message=result["message"])
