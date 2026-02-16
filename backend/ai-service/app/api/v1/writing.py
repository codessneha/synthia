# AI Service - Writing Analysis Endpoint
# Add to backend/ai-service/app/api/v1/writing.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.llm_manager import LLMManager
import re

router = APIRouter()
llm_manager = LLMManager()

class WritingAnalysisRequest(BaseModel):
    text: str
    analysis_types: List[str] = ['grammar', 'style', 'clarity', 'academic']

class Suggestion(BaseModel):
    title: str
    description: str
    category: str
    severity: str  # 'error', 'warning', 'info'
    original: Optional[str] = None
    replacement: Optional[str] = None
    explanation: Optional[str] = None

class WritingAnalysisResponse(BaseModel):
    grammar: List[Suggestion]
    style: List[Suggestion]
    clarity: List[Suggestion]
    academic: List[Suggestion]
    improvements: List[str]

@router.post("/analyze-writing", response_model=WritingAnalysisResponse)
async def analyze_writing(request: WritingAnalysisRequest):
    """
    Analyze text for grammar, style, clarity, and academic writing issues
    """
    try:
        if len(request.text) < 50:
            raise HTTPException(status_code=400, detail="Text must be at least 50 characters")

        suggestions = {
            'grammar': [],
            'style': [],
            'clarity': [],
            'academic': [],
            'improvements': []
        }

        # Grammar Analysis
        if 'grammar' in request.analysis_types:
            grammar_prompt = f"""
            Analyze the following text for grammar issues. Return a JSON array of issues found.
            For each issue, provide:
            - title: Brief title of the issue
            - description: What's wrong
            - category: Type of grammar issue
            - severity: 'error' or 'warning'
            - original: The problematic text
            - replacement: Corrected version
            - explanation: Why it's wrong and how to fix it

            Text: {request.text}

            Return ONLY a JSON array, no other text.
            """
            
            grammar_result = await llm_manager.generate_completion(
                messages=[{"role": "user", "content": grammar_prompt}],
                temperature=0.3
            )
            
            try:
                import json
                grammar_issues = json.loads(grammar_result)
                suggestions['grammar'] = [
                    Suggestion(**issue) for issue in grammar_issues[:10]
                ]
            except:
                pass

        # Style Analysis
        if 'style' in request.analysis_types:
            style_prompt = f"""
            Analyze the following text for style improvements. Return a JSON array of suggestions.
            Focus on:
            - Wordiness
            - Passive voice
            - Repetition
            - Weak verbs
            - Clichés

            For each suggestion, provide:
            - title: What to improve
            - description: Why it should be changed
            - category: 'wordiness', 'passive', 'repetition', etc.
            - severity: 'warning' or 'info'
            - original: Current text
            - replacement: Better version
            - explanation: Why the replacement is better

            Text: {request.text}

            Return ONLY a JSON array, no other text.
            """
            
            style_result = await llm_manager.generate_completion(
                messages=[{"role": "user", "content": style_prompt}],
                temperature=0.5
            )
            
            try:
                import json
                style_issues = json.loads(style_result)
                suggestions['style'] = [
                    Suggestion(**issue) for issue in style_issues[:10]
                ]
            except:
                pass

        # Clarity Analysis
        if 'clarity' in request.analysis_types:
            clarity_prompt = f"""
            Analyze the following text for clarity issues. Return a JSON array of suggestions.
            Focus on:
            - Complex sentences
            - Jargon without explanation
            - Ambiguous references
            - Unclear transitions
            - Confusing structure

            For each issue, provide:
            - title: What's unclear
            - description: How it affects clarity
            - category: 'complexity', 'jargon', 'ambiguity', etc.
            - severity: 'warning' or 'info'
            - original: Unclear text
            - replacement: Clearer version
            - explanation: How the replacement improves clarity

            Text: {request.text}

            Return ONLY a JSON array, no other text.
            """
            
            clarity_result = await llm_manager.generate_completion(
                messages=[{"role": "user", "content": clarity_prompt}],
                temperature=0.4
            )
            
            try:
                import json
                clarity_issues = json.loads(clarity_result)
                suggestions['clarity'] = [
                    Suggestion(**issue) for issue in clarity_issues[:10]
                ]
            except:
                pass

        # Academic Writing Analysis
        if 'academic' in request.analysis_types:
            academic_prompt = f"""
            Analyze the following text for academic writing standards. Return a JSON array of suggestions.
            Focus on:
            - Formal tone
            - First/second person usage
            - Contractions
            - Colloquialisms
            - Citation needs
            - Hedging language
            - Thesis clarity

            For each issue, provide:
            - title: Academic writing issue
            - description: What needs improvement
            - category: 'tone', 'citations', 'formality', etc.
            - severity: 'warning' or 'info'
            - original: Current text (if applicable)
            - replacement: More academic version (if applicable)
            - explanation: Why this is important in academic writing

            Text: {request.text}

            Return ONLY a JSON array, no other text.
            """
            
            academic_result = await llm_manager.generate_completion(
                messages=[{"role": "user", "content": academic_prompt}],
                temperature=0.3
            )
            
            try:
                import json
                academic_issues = json.loads(academic_result)
                suggestions['academic'] = [
                    Suggestion(**issue) for issue in academic_issues[:10]
                ]
            except:
                pass

        # Overall Improvements
        improvements_prompt = f"""
        Based on this text, provide 3-5 high-level suggestions for improvement.
        Focus on the biggest impact changes.
        Return ONLY a JSON array of strings, no other text.

        Text: {request.text}
        """
        
        improvements_result = await llm_manager.generate_completion(
            messages=[{"role": "user", "content": improvements_prompt}],
            temperature=0.6
        )
        
        try:
            import json
            suggestions['improvements'] = json.loads(improvements_result)[:5]
        except:
            suggestions['improvements'] = [
                "Review overall structure and flow",
                "Check all citations and references",
                "Ensure consistent academic tone",
                "Verify all claims are supported",
                "Proofread for grammar and clarity"
            ]

        return WritingAnalysisResponse(**suggestions)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/paraphrase")
async def paraphrase_text(text: str, style: str = "academic"):
    """
    Paraphrase text in different styles
    """
    try:
        prompt = f"""
        Paraphrase the following text in a {style} style.
        Maintain the meaning but use different words and sentence structure.
        
        Original text: {text}
        
        Return only the paraphrased version, nothing else.
        """
        
        result = await llm_manager.generate_completion(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        
        return {"paraphrased": result}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Paraphrasing failed: {str(e)}")


@router.post("/improve-sentence")
async def improve_sentence(sentence: str, focus: str = "clarity"):
    """
    Improve a specific sentence
    """
    try:
        prompts = {
            'clarity': "Make this sentence clearer and easier to understand",
            'conciseness': "Make this sentence more concise without losing meaning",
            'academic': "Make this sentence more suitable for academic writing",
            'formal': "Make this sentence more formal",
        }
        
        instruction = prompts.get(focus, prompts['clarity'])
        
        prompt = f"""
        {instruction}:
        
        Original: {sentence}
        
        Return only the improved sentence, nothing else.
        """
        
        result = await llm_manager.generate_completion(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5
        )
        
        return {
            "original": sentence,
            "improved": result,
            "focus": focus
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Improvement failed: {str(e)}")