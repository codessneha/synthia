from fastapi import APIRouter

router = APIRouter()

@router.post("/generate")
async def generate_embeddings():
    return {"message": "Embeddings endpoint - Coming soon"}