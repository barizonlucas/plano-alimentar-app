import os
from fastapi import FastAPI, UploadFile, File, Form, Depends, Body, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from database import engine, Base, get_db
import models
from services.gemini_service import interpret_diet_plan_service, analyze_meal_service

app = FastAPI()

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock Dependency for current user. Replace with actual JWT/Auth logic.
async def get_current_user(authorization: str = Header(None), db: AsyncSession = Depends(get_db)):
    # Replace mock logic with proper token decoding (e.g. JWT) using the authorization header
    mock_user_id = int(os.getenv("MOCK_USER_ID", "1"))
    user = await db.get(models.User, mock_user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user

@app.get("/")
def read_root():
    return {"message": "Microservices Backend running with FastAPI and PostgreSQL!"}

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

# --- Persistence Endpoints ---

@app.get("/api/plans/current")
async def get_current_plan(current_user: models.User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.DietPlan).where(models.DietPlan.user_id == current_user.id).order_by(desc(models.DietPlan.created_at)).limit(1))
    plan = result.scalars().first()
    return plan.content if plan else {}

@app.post("/api/plans")
async def save_plan(plan_content: dict = Body(...), current_user: models.User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    new_plan = models.DietPlan(user_id=current_user.id, content=plan_content)
    db.add(new_plan)
    await db.commit()
    return {"status": "success", "id": new_plan.id}