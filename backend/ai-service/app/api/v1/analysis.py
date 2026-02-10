from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from loguru import logger

from app.services.llm_manager import LLMManager
from app.services.paper_analyzer import PaperAnalyzer

router = APIRouter()
llm_manager = LLMManager()
paper_analyzer = PaperAnalyzer(llm_manager)


class PaperData(BaseModel):
    """Paper data model"""
    id: str
    title: str
    authors: List[str]
    abstract: str
    keywords: List[str] = []
    methodology: Optional[str] = None
    keyFindings: Optional[List[str]] = None


class CompareRequest(BaseModel):
    """Comparative analysis request"""
    analysisType: str = "compare"
    papers: List[PaperData] = Field(..., min_items=2, max_items=10)
    focusAreas: List[str] = ["methodology", "findings", "limitations"]


class CompareResponse(BaseModel):
    """Comparative analysis response"""
    summary: str
    comparisons: Dict[str, Any]
    insights: List[str]
    gaps: List[str]
    recommendations: List[str]


@router.post("/compare", response_model=CompareResponse)
async def compare_papers(request: CompareRequest):
    """
    Compare multiple research papers
    
    Performs comprehensive comparative analysis across papers,
    identifying similarities, differences, and research gaps.
    """
    try:
        logger.info(f"Comparing {len(request.papers)} papers")
        
        # Generate comparison
        result = await paper_analyzer.compare_papers(
            papers=request.papers,
            focus_areas=request.focusAreas
        )
        
        return CompareResponse(**result)
        
    except Exception as e:
        logger.error(f"Comparison error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to compare papers: {str(e)}"
        )


class SummarizeRequest(BaseModel):
    """Paper summarization request"""
    paper: PaperData
    summaryType: str = "detailed"  # 'brief', 'detailed', 'technical'


@router.post("/summarize")
async def summarize_paper(request: SummarizeRequest):
    """
    Generate paper summary
    
    Creates structured summary of a research paper with
    key findings, methodology, and contributions.
    """
    try:
        logger.info(f"Summarizing paper: {request.paper.title}")
        
        summary = await paper_analyzer.summarize_paper(
            paper=request.paper,
            summary_type=request.summaryType
        )
        
        return {
            "summary": summary,
            "paper_id": request.paper.id,
            "title": request.paper.title
        }
        
    except Exception as e:
        logger.error(f"Summarization error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to summarize paper: {str(e)}"
        )


class GapAnalysisRequest(BaseModel):
    """Research gap analysis request"""
    papers: List[PaperData] = Field(..., min_items=2)
    researchArea: str


@router.post("/gap-analysis")
async def analyze_gaps(request: GapAnalysisRequest):
    """
    Identify research gaps
    
    Analyzes multiple papers to identify:
    - Unexplored areas
    - Contradictions
    - Future research directions
    """
    try:
        logger.info(f"Gap analysis for {len(request.papers)} papers in {request.researchArea}")
        
        gaps = await paper_analyzer.identify_gaps(
            papers=request.papers,
            research_area=request.researchArea
        )
        
        return {
            "research_area": request.researchArea,
            "paper_count": len(request.papers),
            "gaps": gaps
        }
        
    except Exception as e:
        logger.error(f"Gap analysis error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze gaps: {str(e)}"
        )


class MethodologyExtractionRequest(BaseModel):
    """Methodology extraction request"""
    paper: PaperData


@router.post("/extract-methodology")
async def extract_methodology(request: MethodologyExtractionRequest):
    """
    Extract methodology details
    
    Identifies and extracts:
    - Research methods used
    - Datasets
    - Evaluation metrics
    - Experimental setup
    """
    try:
        logger.info(f"Extracting methodology from: {request.paper.title}")
        
        methodology = await paper_analyzer.extract_methodology(request.paper)
        
        return {
            "paper_id": request.paper.id,
            "methodology": methodology
        }
        
    except Exception as e:
        logger.error(f"Methodology extraction error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to extract methodology: {str(e)}"
        )


class KeyInsightsRequest(BaseModel):
    """Key insights extraction request"""
    papers: List[PaperData]
    maxInsights: int = 10


@router.post("/key-insights")
async def extract_key_insights(request: KeyInsightsRequest):
    """
    Extract key insights from papers
    
    Identifies the most important findings and contributions
    across multiple papers.
    """
    try:
        logger.info(f"Extracting insights from {len(request.papers)} papers")
        
        insights = await paper_analyzer.extract_key_insights(
            papers=request.papers,
            max_insights=request.maxInsights
        )
        
        return {
            "insights": insights,
            "paper_count": len(request.papers)
        }
        
    except Exception as e:
        logger.error(f"Insight extraction error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to extract insights: {str(e)}"
        )


class TrendAnalysisRequest(BaseModel):
    """Research trend analysis request"""
    papers: List[PaperData]
    timeframe: Optional[str] = None


@router.post("/trends")
async def analyze_trends(request: TrendAnalysisRequest):
    """
    Analyze research trends
    
    Identifies evolving themes, methodologies, and focus areas
    across a collection of papers.
    """
    try:
        logger.info(f"Analyzing trends in {len(request.papers)} papers")
        
        trends = await paper_analyzer.analyze_trends(request.papers)
        
        return {
            "trends": trends,
            "paper_count": len(request.papers),
            "timeframe": request.timeframe
        }
        
    except Exception as e:
        logger.error(f"Trend analysis error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze trends: {str(e)}"
        )