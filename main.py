from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Backend de Microsserviços rodando!"}

@app.get("/health")
def health_check():
    return {"status": "ok"}