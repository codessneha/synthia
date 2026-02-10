from fastapi import APIRouter

router = APIRouter()

@router.post("/parse")
async def parse_citation():
    return {"message": "Citation parsing endpoint - Coming soon"}