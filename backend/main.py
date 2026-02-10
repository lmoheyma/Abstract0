from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
import re
import logging
from dotenv import load_dotenv
from mistralai import Mistral
from starlette.concurrency import run_in_threadpool

load_dotenv()

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

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

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
MISTRAL_AGENT_ID = os.getenv("MISTRAL_AGENT_ID")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "message": "Backend is running"}

@app.post("/generate", response_model=GenerateResponse)
async def generate_code(request: GenerateRequest):
    if not MISTRAL_API_KEY:
        raise HTTPException(500, "MISTRAL_API_KEY not configured")
    if not MISTRAL_AGENT_ID:
        raise HTTPException(500, "MISTRAL_AGENT_ID not configured")

    inputs = [
        {"role": m.role, "content": m.content}
        for m in request.context
        if m.role in {"user", "assistant"}
    ]
    inputs.append({"role": "user", "content": request.prompt})

    client = Mistral(api_key=MISTRAL_API_KEY)
    try:
        response = await run_in_threadpool(
            client.beta.conversations.start,
            agent_id=MISTRAL_AGENT_ID,
            inputs=inputs,
        )
    except Exception as e:
        logger.exception("Mistral API error")
        raise HTTPException(500, f"Mistral API error : {str(e)}")

    # Extract content from Mistral conversation response
    if not response.outputs or len(response.outputs) == 0:
        raise HTTPException(500, "Empty response from Mistral API")
    
    content = response.outputs[0].content
    
    if not content or not content.strip():
        raise HTTPException(500, "Empty response from model")
    
    content = content.strip()
    
    # Extract JSON from markdown code fences if present
    json_match = re.search(r'```(?:json)?\s*\n(.*?)\n```', content, re.DOTALL)
    if json_match:
        content = json_match.group(1).strip()
    
    # If content doesn't look like JSON, treat as conversational response
    if not content.startswith('{'):
        logger.info("Agent returned conversational text instead of JSON")
        return GenerateResponse(files={}, message=content)
    
    try:
        result = json.loads(content)
    except json.JSONDecodeError as e:
        logger.error("JSON decode error: %s", e)
        raise HTTPException(500, f"Invalid model response JSON: {str(e)}")
    
    if isinstance(result, dict) and "files" in result and isinstance(result["files"], dict):
        for key in list(result.keys()):
            if key in {"files", "message"}:
                continue
            value = result[key]
            if isinstance(value, str):
                result["files"][key] = value
                del result[key]

    if "files" not in result or "message" not in result:
        raise HTTPException(500, "Invalid response format (missing 'files' or 'message')")
    
    return GenerateResponse(files=result["files"], message=result["message"])
