from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
import os
import json
from dotenv import load_dotenv
from google import genai

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

@app.get("/")
def read_root():
    return {"message": "Resume Analyzer API is running"}

@app.post("/analyze")
async def analyze_resume(file: UploadFile = File(...), job_description: str = Form(...)):
    # Step 1: Extract text from the uploaded PDF
    resume_text = ""
    with pdfplumber.open(file.file) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                resume_text += page_text + "\n"

    # Step 2: Build the prompt for Gemini
    prompt = f"""You are a resume analysis assistant. Compare the resume below with the job description.

Resume:
{resume_text}

Job Description:
{job_description}

Respond ONLY with valid JSON in this exact format, no other text, no markdown code fences:
{{
  "match_score": <number from 0-100>,
  "missing_skills": ["skill1", "skill2"],
  "strengths": ["strength1", "strength2"],
  "suggestions": ["suggestion1", "suggestion2"]
}}"""

    # Step 3: Call Gemini using the new Interactions API
    interaction = client.interactions.create(
        model="gemini-3.5-flash-lite",
        input=prompt
    )
    response_text = interaction.output_text.strip()

    # Gemini sometimes wraps JSON in ```json ... ``` — strip that if present
    if response_text.startswith("```"):
        response_text = response_text.strip("`")
        if response_text.startswith("json"):
            response_text = response_text[4:].strip()

    # Step 4: Parse Gemini's JSON response safely
    try:
        analysis = json.loads(response_text)
    except json.JSONDecodeError:
        analysis = {"raw_response": response_text}

    return {"filename": file.filename, "analysis": analysis}