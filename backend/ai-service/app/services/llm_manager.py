from typing import List, Dict, Any, Optional
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
from groq import AsyncGroq
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings


class LLMManager:
    """
    Manages interactions with LLM providers (OpenAI, Anthropic, Groq)
    """
    
    def __init__(self):
        """Initialize LLM clients"""
        self.openai_client = None
        self.anthropic_client = None
        self.groq_client = None
        
        # Initialize OpenAI if key is available
        if settings.OPENAI_API_KEY:
            try:
                self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
                logger.info("OpenAI client initialized")
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client: {e}")
        
        # Initialize Anthropic if key is available
        if settings.ANTHROPIC_API_KEY:
            try:
                self.anthropic_client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
                logger.info("Anthropic client initialized")
            except Exception as e:
                logger.error(f"Failed to initialize Anthropic client: {e}")
        
        # Initialize Groq if key is available
        if settings.GROQ_API_KEY:
            try:
                self.groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)
                logger.info("Groq client initialized")
            except Exception as e:
                logger.error(f"Failed to initialize Groq client: {e}")
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def generate_completion(
        self,
        messages: List[Dict[str, str]],
        model: str = "gpt-4",
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate completion from LLM
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            model: Model identifier
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            
        Returns:
            Dict with 'content', 'tokens', and 'finish_reason'
        """
        try:
            # Determine provider from model name and check availability
            if (model.startswith("gpt") or model.startswith("o1")) and self.openai_client:
                return await self._generate_openai(messages, model, temperature, max_tokens, **kwargs)
            elif model.startswith("claude") and self.anthropic_client:
                return await self._generate_anthropic(messages, model, temperature, max_tokens, **kwargs)
            elif (model.startswith("llama") or model.startswith("mixtral") or model.startswith("gemma")) and self.groq_client:
                return await self._generate_groq(messages, model, temperature, max_tokens, **kwargs)
            else:
                # Fallback logic: Use Groq if available, otherwise switch to whatever is available
                logger.info(f"Model {model} requested but provider not available or unknown. Falling back to available provider.")
                if self.groq_client:
                    # Switch to default Groq model if the requested one was an OpenAI model
                    target_model = model if (model.startswith("llama") or model.startswith("mixtral")) else settings.GROQ_MODEL
                    return await self._generate_groq(messages, target_model, temperature, max_tokens, **kwargs)
                elif self.openai_client:
                    target_model = model if model.startswith("gpt") else settings.OPENAI_MODEL
                    return await self._generate_openai(messages, target_model, temperature, max_tokens, **kwargs)
                elif self.anthropic_client:
                    target_model = model if model.startswith("claude") else settings.ANTHROPIC_MODEL
                    return await self._generate_anthropic(messages, target_model, temperature, max_tokens, **kwargs)
                
                raise ValueError("No LLM providers initialized. Please check your API keys.")
                
        except Exception as e:
            logger.error(f"LLM generation error: {e}")
            raise
    
    async def _generate_openai(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float,
        max_tokens: int,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate completion using OpenAI"""
        if not self.openai_client:
            raise ValueError("OpenAI client not initialized. Check API key.")
        
        try:
            response = await self.openai_client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            )
            
            return {
                'content': response.choices[0].message.content,
                'tokens': response.usage.total_tokens,
                'finish_reason': response.choices[0].finish_reason,
                'model': model,
                'provider': 'openai'
            }
            
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            raise
    
    async def _generate_anthropic(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float,
        max_tokens: int,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate completion using Anthropic Claude"""
        if not self.anthropic_client:
            raise ValueError("Anthropic client not initialized. Check API key.")
        
        try:
            # Convert messages format (Anthropic uses different format)
            system_message = None
            anthropic_messages = []
            
            for msg in messages:
                if msg['role'] == 'system':
                    system_message = msg['content']
                else:
                    anthropic_messages.append({
                        'role': msg['role'],
                        'content': msg['content']
                    })
            
            response = await self.anthropic_client.messages.create(
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_message,
                messages=anthropic_messages
            )
            
            return {
                'content': response.content[0].text,
                'tokens': response.usage.input_tokens + response.usage.output_tokens,
                'finish_reason': response.stop_reason,
                'model': model,
                'provider': 'anthropic'
            }
            
        except Exception as e:
            logger.error(f"Anthropic API error: {e}")
            raise
    
    async def _generate_groq(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float,
        max_tokens: int,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate completion using Groq"""
        if not self.groq_client:
            raise ValueError("Groq client not initialized. Check API key.")
        
        try:
            response = await self.groq_client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            )
            
            return {
                'content': response.choices[0].message.content,
                'tokens': response.usage.total_tokens,
                'finish_reason': response.choices[0].finish_reason,
                'model': model,
                'provider': 'groq'
            }
            
        except Exception as e:
            logger.error(f"Groq API error: {e}")
            raise
    
    async def generate_embeddings(
        self,
        texts: List[str],
        model: str = "text-embedding-ada-002"
    ) -> List[List[float]]:
        """
        Generate embeddings for texts
        
        Args:
            texts: List of text strings
            model: Embedding model to use
            
        Returns:
            List of embedding vectors
        """
        if not self.openai_client:
            raise ValueError("OpenAI client not initialized. Check API key.")
        
        try:
            response = await self.openai_client.embeddings.create(
                model=model,
                input=texts
            )
            
            return [item.embedding for item in response.data]
            
        except Exception as e:
            logger.error(f"Embedding generation error: {e}")
            raise
    
    async def generate_single_embedding(
        self,
        text: str,
        model: str = "text-embedding-ada-002"
    ) -> List[float]:
        """
        Generate embedding for a single text
        
        Args:
            text: Text string
            model: Embedding model to use
            
        Returns:
            Embedding vector
        """
        embeddings = await self.generate_embeddings([text], model)
        return embeddings[0] if embeddings else []
    
    def is_available(self, provider: str = "openai") -> bool:
        """
        Check if a provider is available
        
        Args:
            provider: Provider name ('openai', 'anthropic', or 'groq')
            
        Returns:
            True if provider is initialized
        """
        if provider == "openai":
            return self.openai_client is not None
        elif provider == "anthropic":
            return self.anthropic_client is not None
        elif provider == "groq":
            return self.groq_client is not None
        return False
    
    async def count_tokens(self, text: str, model: str = "gpt-4") -> int:
        """
        Estimate token count for text
        
        Note: This is a rough estimate. For accurate counts, use tiktoken library.
        
        Args:
            text: Text to count
            model: Model to use for counting
            
        Returns:
            Estimated token count
        """
        # Rough estimate: ~4 characters per token
        return len(text) // 4