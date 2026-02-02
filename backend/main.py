from fastapi import FastAPI, UploadFile, File, Form, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from database import engine, Base, get_db
import models  # Importa os modelos para que o Base.metadata os reconheça
from services.gemini_service import interpret_diet_plan_service, analyze_meal_service

app = FastAPI()

origins = ["*"]  # Em produção, especifique o domínio exato (ex: http://localhost:8080)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    # Cria as tabelas no banco de dados (apenas para desenvolvimento inicial)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/")
def read_root():
    return {"message": "Backend de Microsserviços rodando com FastAPI e SQLAlchemy!"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/v1/interpret-plan")
async def interpret_plan(file: UploadFile = File(...)):
    return await interpret_diet_plan_service(file)

@app.post("/api/v1/analyze-meal")
async def analyze_meal(
    photos: List[UploadFile] = File(...),
    day_label: str = Form(...),
    meal_name: str = Form(...),
    meal_plan_json: str = Form(...)
):
    return await analyze_meal_service(photos, day_label, meal_name, meal_plan_json)

# --- Novos Endpoints de Persistência ---

@app.get("/api/plans/current")
async def get_current_plan(db: AsyncSession = Depends(get_db)):
    # Mock: Pega o plano do usuário ID 1 (em produção usaria autenticação real)
    user_id = 1
    result = await db.execute(select(models.DietPlan).where(models.DietPlan.user_id == user_id).order_by(desc(models.DietPlan.created_at)).limit(1))
    plan = result.scalars().first()
    return plan.content if plan else {}

@app.post("/api/plans")
async def save_plan(plan_content: dict = Body(...), db: AsyncSession = Depends(get_db)):
    user_id = 1
    
    # Verifica se o usuário mock existe, se não, cria
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        new_user = models.User(id=user_id, nome="Usuário Teste", email="teste@plano.ai", password_hash="dummy", role=models.UserRole.PACIENTE)
        db.add(new_user)
        await db.commit()
    
    # Salva o novo plano
    new_plan = models.DietPlan(user_id=user_id, content=plan_content)
    db.add(new_plan)
    await db.commit()
    return {"status": "success", "id": new_plan.id}