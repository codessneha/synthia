from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from loguru import logger

from app.services.llm_manager import LLMManager
from app.core.config import settings

router = APIRouter()
llm_manager = LLMManager()


class Message(BaseModel):
    """Message model"""
    role: str
    content: str
    timestamp: Optional[str] = None


class ChatContext(BaseModel):
    """Chat context model"""
    sessionId: str
    papers: List[Dict[str, Any]]
    conversationHistory: List[Message] = []
    userIntent: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None


class ChatCompletionRequest(BaseModel):
    """Chat completion request"""
    message: str = Field(..., min_length=1, max_length=settings.MAX_MESSAGE_LENGTH)
    context: ChatContext
    model: str = "gpt-4"
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    maxTokens: int = Field(default=2000, ge=100, le=4000)


class ChatCompletionResponse(BaseModel):
    """Chat completion response"""
    content: str
    metadata: Dict[str, Any]


@router.post("/completion", response_model=ChatCompletionResponse)
async def chat_completion(request: ChatCompletionRequest):
    """
    Generate AI chat completion
    
    This endpoint handles conversational AI for research paper discussions.
    It uses the LLM to generate responses based on paper context and chat history.
    """
    try:
        logger.info(f"Chat completion request for session: {request.context.sessionId}")
        
        # Build system prompt with paper context
        paper_context = _build_paper_context(request.context.papers)
        
        # Build conversation history
        messages = _build_messages(
            request.message,
            request.context.conversationHistory,
            paper_context
        )
        
        # Generate completion
        response = await llm_manager.generate_completion(
            messages=messages,
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.maxTokens
        )
        
        logger.info(f"Chat completion successful. Tokens used: {response.get('tokens', 0)}")
        
        return ChatCompletionResponse(
            content=response['content'],
            metadata={
                'model': request.model,
                'tokens': response.get('tokens', 0),
                'finish_reason': response.get('finish_reason', 'stop')
            }
        )
        
    except Exception as e:
        logger.error(f"Chat completion error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate chat completion: {str(e)}"
        )


class SummarizeRequest(BaseModel):
    """Conversation summarization request"""
    messages: List[Message]
    sessionName: str


@router.post("/summarize")
async def summarize_conversation(request: SummarizeRequest):
    """
    Generate conversation summary
    
    Summarizes a chat conversation into key points and insights.
    """
    try:
        logger.info(f"Summarizing conversation: {request.sessionName}")
        
        # Build conversation text
        conversation_text = "\n\n".join([
            f"{msg.role.upper()}: {msg.content}"
            for msg in request.messages
        ])
        
        # Create summary prompt
        system_prompt = """You are an AI assistant that summarizes research discussions.
        Create a concise summary of the conversation, highlighting:
        1. Main topics discussed
        2. Key questions asked
        3. Important insights or conclusions
        4. Action items or next steps (if any)
        
        Keep the summary clear and organized."""
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Summarize this conversation:\n\n{conversation_text}"}
        ]
        
        # Generate summary
        response = await llm_manager.generate_completion(
            messages=messages,
            model="llama-3.3-70b-versatile",
            temperature=0.5,
            max_tokens=500
        )
        
        return {
            "summary": response['content'],
            "metadata": {
                "message_count": len(request.messages),
                "tokens": response.get('tokens', 0)
            }
        }
        
    except Exception as e:
        logger.error(f"Summarization error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate summary: {str(e)}"
        )


class QuestionSuggestionRequest(BaseModel):
    """Question suggestion request"""
    papers: List[Dict[str, Any]]
    conversationHistory: List[Message] = []


@router.post("/suggest-questions")
async def suggest_questions(request: QuestionSuggestionRequest):
    """
    Suggest follow-up questions
    
    Generate intelligent follow-up questions based on papers and conversation.
    """
    try:
        logger.info("Generating question suggestions")
        
        # Build context
        paper_titles = [p.get('title', 'Untitled') for p in request.papers]
        recent_messages = request.conversationHistory[-5:] if request.conversationHistory else []
        
        prompt = f"""Based on these research papers:
{chr(10).join([f'- {title}' for title in paper_titles])}

And recent conversation:
{chr(10).join([f"{msg.role}: {msg.content}" for msg in recent_messages]) if recent_messages else "No conversation yet"}

Suggest 5 insightful questions a researcher might want to ask about these papers.
Format as a simple numbered list."""

        messages = [
            {"role": "system", "content": "You are a research assistant helping formulate good research questions."},
            {"role": "user", "content": prompt}
        ]
        
        response = await llm_manager.generate_completion(
            messages=messages,
            model="llama-3.3-70b-versatile",
            temperature=0.8,
            max_tokens=300
        )
        
        # Parse questions (simple split by newline)
        questions = [
            q.strip() for q in response['content'].split('\n')
            if q.strip() and any(c.isdigit() for c in q[:3])
        ]
        
        return {
            "questions": questions[:5],  # Return max 5
            "metadata": {
                "paper_count": len(request.papers),
                "tokens": response.get('tokens', 0)
            }
        }
        
    except Exception as e:
        logger.error(f"Question suggestion error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate questions: {str(e)}"
        )


def _build_paper_context(papers: List[Dict[str, Any]]) -> str:
    """
    Build paper context string for the system prompt
    """
    if not papers:
        return "No papers in context."
    
    context_parts = []
    for i, paper in enumerate(papers, 1):
        title = paper.get('title', 'Untitled')
        authors = paper.get('authors', 'Unknown authors')
        abstract = paper.get('abstract', '')[:500]  # Limit abstract length
        keywords = ', '.join(paper.get('keywords', [])[:5])
        
        context_parts.append(f"""
Paper {i}: {title}
Authors: {authors}
Keywords: {keywords}
Abstract: {abstract}...
""")
    
    return "\n".join(context_parts)


def _build_messages(
    user_message: str,
    history: List[Message],
    paper_context: str
) -> List[Dict[str, str]]:
    """
    Build message list for LLM
    """
    system_prompt = f"""You are Synthia, an AI research assistant specializing in academic literature analysis.
You help researchers understand, compare, and synthesize research papers.

Papers in this session:
{paper_context}

Guidelines:
- Provide accurate, insightful analysis based on the papers
- Cite specific papers when referencing information
- Be concise but thorough
- Ask clarifying questions when needed
- Highlight connections between papers
- Point out contradictions or gaps in research"""

    messages = [{"role": "system", "content": system_prompt}]
    
    # Add recent conversation history (last 10 messages)
    for msg in history[-10:]:
        messages.append({
            "role": msg.role,
            "content": msg.content
        })
    
    # Add current user message
    messages.append({
        "role": "user",
        "content": user_message
    })
    
    return messages