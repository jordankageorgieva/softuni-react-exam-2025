from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://softuni-react-exam-2025-test.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def health_check():
    return {"status": "ok"}

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.get("/api/hello")
def hello():
    return {"message": "Hello from FastAPI on Vercel"}

@app.get("/api/eur-usd")
async def get_eur_usd_price():
    url = "https://api.frankfurter.dev/v1/latest?symbols=USD"
    params = {
        "base": "EUR",
        "symbols": "USD"
    }

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(url, params=params)

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Failed to fetch exchange rate")

    data = response.json()

    return {
        "base": "EUR",
        "target": "USD",
        "rate": data["rates"]["USD"],
        "timestamp": data["date"]
    }