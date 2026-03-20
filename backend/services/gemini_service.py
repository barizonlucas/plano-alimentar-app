import os
import json
import re
import google.generativeai as genai
from fastapi import UploadFile, HTTPException
from typing import List

GENAI_API_KEY = os.getenv("GEMINI_API_KEY")
GENAI_MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

if GENAI_API_KEY:
    genai.configure(api_key=GENAI_API_KEY)

DIET_PLAN_PROMPT = """
You are an assistant specialized in extracting diet plans from Brazilian PDFs.

Analyze the attached PDF and return ONLY a valid JSON, without any text before or after, exactly in this structure:

{
  "diet": {
    "Seg": [ /* full meals for Monday */ ],
    "Ter": [ /* full meals for Tuesday */ ],
    "Qua": [ /* full meals for Wednesday */ ],
    "Qui": [ /* full meals for Thursday */ ],
    "Sex": [ /* full meals for Friday */ ],
    "Sab": [ /* full meals for Saturday */ ],
    "Dom": [ /* full meals for Sunday */ ]
  }
}

Mandatory rules:
- Each day is independent.
- If the plan says "Seg Qua Sex" → copy exactly the same content to Seg, Qua, and Sex.
- If it says "Ter Qui Sab Dom" → copy exactly the same content to Ter, Qui, Sab, and Dom.
- Each meal must have:
  {
    "time": "HH:MM",           // e.g., "06:00"
    "name": "Meal Name",       // e.g., "Café da manhã"
    "options": [               // array with 1 or more options
      [
        "Complete food item with quantity and brand when available (e.g., Suco de uva integral - Superbom® (200ml))",
        "Another food from the same option...",
        ...
      ],
      [ /* next option, if it exists */ ]
    ]
  }
- When there is "ou" (or) within the same line → keep it in the same item with "ou" (e.g., "Arroz branco (130g) ou Batata doce (165g)").
- When there are multiple lines separated by • → each line becomes an item in the option's array.
- If there is "Substituição 1" or similar → it becomes a second option within the same time.
- Ignore kcal, food groups, nutritionist name, patient name, observations, and general notes.
- Response must be 100% valid JSON, without markdown, without ```json, without explanations.

Return only the JSON.
"""

MEAL_ANALYSIS_PROMPT = """
You are an assistant specialized in nutritional analysis of meals via images.
Analyze the attached images of the consumed meal. Describe the identified ingredients, estimate approximate quantities and nutritional values (calories, proteins, carbohydrates, fats) based on general food knowledge.
Compare with the diet plan provided for the day "{dia}" and meal "{refeicao}": {plano_refeicao_json} (include options and substitutions).
Calculate:

Adherence: High, Medium or Low (based on similarity of items, quantities, and nutrients).
Percentage of proximity to ideal: Number from 0 to 100%.
Score: Number from 0 to 10 for gamification (based on adherence, nutritional balance, and completeness).

Return ONLY a valid JSON, without extra text:
{
  "aderencia": "High/Medium/Low",
  "percentual": 85,
  "pontuacao": 8,
  "descricao": "Brief explanation of the analysis and comparison.",
  "nutrientes_estimados": {
    "calorias": 500,
    "proteinas": 20,
    "carboidratos": 60,
    "gorduras": 15
  }
}
"""

def sanitize_response_text(text: str) -> str:
    if not text:
        return ""
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    return text.strip()

async def interpret_diet_plan_service(file: UploadFile):
    if not GENAI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")

    model = genai.GenerativeModel(GENAI_MODEL_NAME)
    
    content = await file.read()
    
    prompt_parts = [
        DIET_PLAN_PROMPT,
        {
            "mime_type": file.content_type or "application/pdf",
            "data": content
        }
    ]

    try:
        response = model.generate_content(prompt_parts)
        cleaned_text = sanitize_response_text(response.text)
        return json.loads(cleaned_text)
    except Exception as e:
        print(f"Gemini Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process the diet plan with Gemini.")

async def analyze_meal_service(photos: List[UploadFile], day_label: str, meal_name: str, meal_plan_json: str):
    if not GENAI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")
        
    model = genai.GenerativeModel(GENAI_MODEL_NAME)
    
    prompt_text = MEAL_ANALYSIS_PROMPT.replace("{dia}", day_label).replace("{refeicao}", meal_name).replace("{plano_refeicao_json}", meal_plan_json)
    
    prompt_parts = [prompt_text]
    
    for photo in photos:
        content = await photo.read()
        prompt_parts.append({
            "mime_type": photo.content_type or "image/jpeg",
            "data": content
        })
        
    try:
        response = model.generate_content(prompt_parts)
        cleaned_text = sanitize_response_text(response.text)
        return json.loads(cleaned_text)
    except Exception as e:
        print(f"Gemini Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze the meal with Gemini.")