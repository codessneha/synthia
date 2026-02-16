# AI Service - Complete Paper Analysis Implementation
# File: backend/ai-service/app/api/v1/paper_analysis.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
from ...core.config import settings
from ...services.llm_manager import LLMManager

router = APIRouter()
llm_manager = LLMManager()

# ============================================================================
# Request/Response Models
# ============================================================================

class Section(BaseModel):
    type: str
    length: int

class StructureAnalysisRequest(BaseModel):
    sections: List[Section]

class MethodologyAnalysisRequest(BaseModel):
    content: str

class ClarityAnalysisRequest(BaseModel):
    content: str

class AcademicToneAnalysisRequest(BaseModel):
    content: str

class Issue(BaseModel):
    severity: str
    message: str

class StructureAnalysisResponse(BaseModel):
    score: float
    has_all_sections: bool
    missing_sections: List[str]
    present_sections: List[str]
    issues: List[Issue]
    suggestions: List[str]

# ============================================================================
# Helper Functions
# ============================================================================

async def call_llm(prompt: str, temperature: float = 0.3, max_tokens: int = 2000) -> str:
    """
    Call LLM (Groq or OpenAI) with proper error handling
    Uses the model specified in settings
    """
    try:
        messages = [
            {
                "role": "system",
                "content": "You are an expert academic writing reviewer and editor with deep knowledge of research paper standards across multiple disciplines. Provide detailed, actionable, and accurate feedback."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
        
        # Use the configured model from settings
        response = await llm_manager.generate_completion(
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        return response['content']
    
    except Exception as e:
        print(f"LLM API Error: {e}")
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")


def safe_json_parse(text: str, default: Any = None) -> Any:
    """
    Safely parse JSON from LLM response, handling markdown code blocks
    """
    try:
        # Remove markdown code blocks if present
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        return json.loads(text)
    except json.JSONDecodeError as e:
        print(f"JSON Parse Error: {e}")
        print(f"Text: {text[:200]}")
        return default


# ============================================================================
# Structure Analysis Endpoint
# ============================================================================

@router.post("/analyze-structure", response_model=StructureAnalysisResponse)
async def analyze_structure(request: StructureAnalysisRequest):
    """
    Analyze paper structure using LLM
    Provides comprehensive feedback on section organization and completeness
    """
    try:
        # Prepare section information
        sections_info = "\n".join([
            f"- {s.type}: {s.length} characters"
            for s in request.sections
        ])
        
        present_sections = [s.type for s in request.sections]
        
        prompt = f"""
You are reviewing the structure of a research paper. Here are the sections present:

{sections_info}

Required sections for a complete research paper:
- abstract
- introduction
- literature_review (or related work)
- methodology (or methods)
- results
- discussion
- conclusion
- references

Tasks:
1. Identify which required sections are missing
2. Assess if sections are in logical order
3. Determine if section lengths are appropriate
4. Provide a quality score (0-100)
5. Give specific, actionable suggestions for improvement

Respond with ONLY a valid JSON object (no markdown, no extra text) in this exact format:
{{
    "score": 85.0,
    "has_all_sections": false,
    "missing_sections": ["methodology"],
    "present_sections": ["abstract", "introduction", "results"],
    "issues": [
        {{
            "severity": "error",
            "message": "Missing methodology section - readers need to know your research approach"
        }}
    ],
    "suggestions": [
        "Add a methodology section describing your research design and data collection",
        "Consider adding a literature review to contextualize your work"
    ]
}}

IMPORTANT: Respond ONLY with the JSON object, nothing else.
"""

        response_text = await call_llm(prompt, temperature=0.2)
        
        # Parse response
        result = safe_json_parse(response_text, {
            "score": 50.0,
            "has_all_sections": False,
            "missing_sections": [],
            "present_sections": present_sections,
            "issues": [],
            "suggestions": ["Could not analyze structure - please try again"]
        })
        
        return StructureAnalysisResponse(**result)
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Structure analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Structure analysis failed: {str(e)}")


# ============================================================================
# Methodology Analysis Endpoint
# ============================================================================

@router.post("/analyze-methodology")
async def analyze_methodology(request: MethodologyAnalysisRequest):
    """
    Analyze methodology section for completeness and rigor
    """
    try:
        prompt = f"""
Analyze the following methodology section from a research paper:

METHODOLOGY CONTENT:
{request.content[:3000]}

Evaluate the methodology based on:
1. Research Design: Is the overall approach clearly stated?
2. Data Collection: Are data collection methods described in detail?
3. Sample/Participants: Is the sample size and selection explained?
4. Analysis Methods: Are analysis techniques specified?
5. Validity/Reliability: Are measures for ensuring quality mentioned?
6. Ethical Considerations: Are ethical approvals and protections addressed?

Provide a score (0-100) and identify specific missing elements.

Respond with ONLY a valid JSON object in this format:
{{
    "score": 75.0,
    "completeness": "4/6 key elements",
    "has_all_elements": false,
    "missing_elements": ["validity_reliability", "ethical_considerations"],
    "issues": [
        {{
            "severity": "warning",
            "message": "No mention of validity or reliability measures"
        }}
    ],
    "suggestions": [
        "Add information about how you ensured data validity",
        "Include ethical approval details and informed consent procedures"
    ]
}}
"""

        response_text = await call_llm(prompt, temperature=0.3, max_tokens=1500)
        result = safe_json_parse(response_text, {
            "score": 50.0,
            "completeness": "Unknown",
            "has_all_elements": False,
            "missing_elements": [],
            "issues": [],
            "suggestions": ["Could not analyze methodology"]
        })
        
        return result
    
    except Exception as e:
        print(f"Methodology analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Methodology analysis failed: {str(e)}")


# ============================================================================
# Clarity Analysis Endpoint
# ============================================================================

@router.post("/analyze-clarity")
async def analyze_clarity(request: ClarityAnalysisRequest):
    """
    Analyze writing clarity and readability using LLM
    """
    try:
        # Truncate if too long
        content = request.content[:4000]
        
        prompt = f"""
Analyze the clarity and readability of this academic text:

TEXT:
{content}

Evaluate:
1. Sentence Complexity: Are sentences too long or convoluted?
2. Word Choice: Is vocabulary appropriate and clear?
3. Logical Flow: Do ideas connect smoothly?
4. Technical Jargon: Is jargon explained when first used?
5. Paragraph Structure: Are paragraphs well-organized?

Provide:
- A clarity score (0-100, where 100 is perfectly clear)
- Specific readability assessment
- Average sentence length category (short/medium/long)
- Percentage of complex words
- Specific issues found
- Actionable suggestions

Respond with ONLY valid JSON:
{{
    "score": 72.0,
    "readability_grade": "College level (fairly difficult)",
    "avg_sentence_length": "25 words (medium-long)",
    "complex_word_ratio": "18%",
    "issues": [
        {{
            "severity": "warning",
            "message": "Sentences in paragraph 3 exceed 35 words - consider breaking them up"
        }},
        {{
            "severity": "info",
            "message": "Technical term 'heteroscedasticity' used without definition"
        }}
    ],
    "suggestions": [
        "Break sentences longer than 30 words into two sentences",
        "Define technical terms on first use",
        "Use transition words (however, therefore, moreover) to improve flow"
    ]
}}
"""

        response_text = await call_llm(prompt, temperature=0.3, max_tokens=1500)
        result = safe_json_parse(response_text, {
            "score": 70.0,
            "readability_grade": "Standard",
            "avg_sentence_length": "20 words",
            "complex_word_ratio": "15%",
            "issues": [],
            "suggestions": ["Could not analyze clarity"]
        })
        
        return result
    
    except Exception as e:
        print(f"Clarity analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Clarity analysis failed: {str(e)}")


# ============================================================================
# Academic Tone Analysis Endpoint
# ============================================================================

@router.post("/analyze-academic-tone")
async def analyze_academic_tone(request: AcademicToneAnalysisRequest):
    """
    Analyze academic tone and formality using LLM
    """
    try:
        content = request.content[:4000]
        
        prompt = f"""
Analyze the academic tone and formality of this research paper text:

TEXT:
{content}

Check for:
1. Formal Language: Is the tone appropriately academic?
2. First-Person Usage: Excessive use of "I" or "we"?
3. Contractions: Are contractions used (shouldn't, don't, can't)?
4. Informal Expressions: Colloquialisms, slang, or casual phrases?
5. Hedging Language: Appropriate use of qualifiers (may, might, suggest)?
6. Voice: Active vs passive voice balance?

Provide a formality score (0-100) and identify specific issues.

Respond with ONLY valid JSON:
{{
    "score": 82.0,
    "is_formal": true,
    "first_person_usage": 12,
    "contractions": 3,
    "informal_language": 5,
    "issues": [
        {{
            "severity": "error",
            "message": "Found 3 contractions: 'don't' (line 45), 'can't' (line 78), 'won't' (line 102)"
        }},
        {{
            "severity": "warning",
            "message": "Informal phrase 'a lot of' used 5 times - use 'many' or 'numerous' instead"
        }}
    ],
    "suggestions": [
        "Replace all contractions with full forms (do not, cannot, will not)",
        "Replace 'a lot of' with more formal alternatives like 'numerous' or 'substantial'",
        "Consider reducing first-person pronouns by using passive voice in methodology sections"
    ]
}}
"""

        response_text = await call_llm(prompt, temperature=0.3, max_tokens=1500)
        result = safe_json_parse(response_text, {
            "score": 75.0,
            "is_formal": True,
            "first_person_usage": 0,
            "contractions": 0,
            "informal_language": 0,
            "issues": [],
            "suggestions": ["Could not analyze academic tone"]
        })
        
        return result
    
    except Exception as e:
        print(f"Academic tone analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Academic tone analysis failed: {str(e)}")


# ============================================================================
# Export router
# ============================================================================

# Register all endpoints with the API
# This router should be included in main.py with:
# app.include_router(paper_analysis.router, prefix="/api/v1/ai", tags=["paper-analysis"])