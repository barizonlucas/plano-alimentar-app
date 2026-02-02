import os
import json
import re
import google.generativeai as genai
from fastapi import UploadFile, HTTPException
from typing import List

# Configuração da API Key via variável de ambiente
GENAI_API_KEY = os.getenv("GEMINI_API_KEY")
if GENAI_API_KEY:
    genai.configure(api_key=GENAI_API_KEY)

# Prompts originais migrados do frontend
DIET_PLAN_PROMPT = """
Você é um assistente especializado em extrair planos alimentares de PDFs brasileiros.

Analise o PDF anexado e retorne APENAS um JSON válido, sem nenhum texto antes ou depois, exatamente nesta estrutura:

{
  "diet": {
    "Seg": [ /* refeições completas de segunda */ ],
    "Ter": [ /* refeições completas de terça */ ],
    "Qua": [ /* refeições completas de quarta */ ],
    "Qui": [ /* refeições completas de quinta */ ],
    "Sex": [ /* refeições completas de sexta */ ],
    "Sab": [ /* refeições completas de sábado */ ],
    "Dom": [ /* refeições completas de domingo */ ]
  }
}

Regras obrigatórias:
- Cada dia é independente.
- Se o plano diz “Seg Qua Sex” → copie exatamente o mesmo conteúdo para Seg, Qua e Sex.
- Se diz “Ter Qui Sab Dom” → copie exatamente o mesmo conteúdo para Ter, Qui, Sab e Dom.
- Cada refeição deve ter:
  {
    "time": "HH:MM",           // ex: "06:00"
    "name": "Nome da refeição", // ex: "Café da manhã"
    "options": [               // array com 1 ou mais opções
      [
        "Alimento completo com quantidade e marca quando houver (ex: Suco de uva integral - Superbom® (200ml))",
        "Outro alimento da mesma opção...",
        ...
      ],
      [ /* próxima opção, se existir */ ]
    ]
  }
- Quando houver “ou” dentro da mesma linha → mantenha no mesmo item com “ou” (ex: "Arroz branco (130g) ou Batata doce (165g)")
- Quando houver várias linhas separadas com • → cada linha vira um item do array da opção.
- Se houver “Substituição 1” ou similar → vira uma segunda opção dentro do mesmo horário.
- Ignora kcal, grupos alimentares, nome do nutricionista, nome do paciente, observações e observações gerais.
- Resposta deve ser 100% JSON válido, sem markdown, sem ```json, sem explicações.

Retorne somente o JSON.
"""

MEAL_ANALYSIS_PROMPT = """
Você é um assistente especializado em análise nutricional de refeições via imagens.
Analise as imagens anexadas da refeição consumida. Descreva os ingredientes identificados, estime quantidades aproximadas e valores nutricionais (calorias, proteínas, carboidratos, gorduras) com base em conhecimento geral de alimentos.
Compare com o plano alimentar fornecido para o dia "{dia}" e refeição "{refeicao}": {plano_refeicao_json} (inclua opções e substituições).
Calcule:

Aderência: Alta, Média ou Baixa (baseado em similaridade de itens, quantidades e nutrientes).
Percentual de proximidade ao ideal: Número de 0 a 100%.
Pontuação: Número de 0 a 10 para gamificação (baseado em aderência, equilíbrio nutricional e completude).

Retorne APENAS um JSON válido, sem texto extra:
{
"aderencia": "Alta/Média/Baixa",
"percentual": 85,
"pontuacao": 8,
"descricao": "Breve explicação da análise e comparação.",
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
    # Remove blocos de código markdown se existirem
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    return text.strip()

async def interpret_diet_plan_service(file: UploadFile):
    if not GENAI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")

    model = genai.GenerativeModel('gemini-1.5-flash')
    
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
        raise HTTPException(status_code=500, detail="Falha ao processar o plano alimentar com Gemini.")

async def analyze_meal_service(photos: List[UploadFile], day_label: str, meal_name: str, meal_plan_json: str):
    if not GENAI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")
        
    model = genai.GenerativeModel('gemini-1.5-flash')
    
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
        raise HTTPException(status_code=500, detail="Falha ao analisar a refeição com Gemini.")