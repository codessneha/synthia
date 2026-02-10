from typing import List, Dict, Any
from loguru import logger
import json


class PaperAnalyzer:
    """
    Analyzes research papers using LLM
    """
    
    def __init__(self, llm_manager):
        """
        Initialize analyzer
        
        Args:
            llm_manager: LLMManager instance
        """
        self.llm = llm_manager
    
    async def compare_papers(
        self,
        papers: List[Any],
        focus_areas: List[str]
    ) -> Dict[str, Any]:
        """
        Compare multiple papers
        
        Args:
            papers: List of paper data
            focus_areas: Areas to focus comparison on
            
        Returns:
            Comparison results
        """
        try:
            # Build comparison prompt
            paper_summaries = self._build_paper_summaries(papers)
            focus_text = ", ".join(focus_areas)
            
            prompt = f"""Compare these research papers focusing on: {focus_text}

{paper_summaries}

Provide a structured comparison including:
1. Summary: Brief overview of how papers relate
2. Key Similarities: What approaches/findings are common
3. Key Differences: How papers differ in methodology or conclusions
4. Strengths and Weaknesses: Of each paper
5. Research Gaps: What questions remain unanswered
6. Recommendations: For future research or which paper to prioritize

Format as JSON with these keys: summary, similarities, differences, strengths, weaknesses, gaps, recommendations"""

            messages = [
                {"role": "system", "content": "You are an expert research analyst comparing academic papers."},
                {"role": "user", "content": prompt}
            ]
            
            response = await self.llm.generate_completion(
                messages=messages,
                model="gpt-4",
                temperature=0.5,
                max_tokens=2000
            )
            
            # Parse JSON response
            try:
                result = json.loads(response['content'])
            except json.JSONDecodeError:
                # If not JSON, structure the response
                result = {
                    "summary": response['content'],
                    "comparisons": {},
                    "insights": [],
                    "gaps": [],
                    "recommendations": []
                }
            
            # Ensure all required fields exist
            return {
                "summary": result.get("summary", response['content'][:500]),
                "comparisons": {
                    "similarities": result.get("similarities", []),
                    "differences": result.get("differences", []),
                    "strengths": result.get("strengths", {}),
                    "weaknesses": result.get("weaknesses", {})
                },
                "insights": self._extract_list(result.get("similarities", [])),
                "gaps": self._extract_list(result.get("gaps", [])),
                "recommendations": self._extract_list(result.get("recommendations", []))
            }
            
        except Exception as e:
            logger.error(f"Paper comparison error: {e}")
            raise
    
    async def summarize_paper(
        self,
        paper: Any,
        summary_type: str = "detailed"
    ) -> Dict[str, Any]:
        """
        Generate paper summary
        
        Args:
            paper: Paper data
            summary_type: Type of summary ('brief', 'detailed', 'technical')
            
        Returns:
            Summary data
        """
        try:
            # Customize prompt based on summary type
            if summary_type == "brief":
                instructions = "Provide a 2-3 sentence summary of the main contribution."
                max_tokens = 200
            elif summary_type == "technical":
                instructions = "Provide a technical summary including methodology, datasets, metrics, and results."
                max_tokens = 1000
            else:  # detailed
                instructions = "Provide a comprehensive summary including background, methodology, key findings, and implications."
                max_tokens = 800
            
            prompt = f"""Summarize this research paper:

Title: {paper.title}
Authors: {', '.join(paper.authors)}
Abstract: {paper.abstract}
Keywords: {', '.join(paper.keywords)}

{instructions}"""

            messages = [
                {"role": "system", "content": "You are an expert at summarizing academic papers clearly and accurately."},
                {"role": "user", "content": prompt}
            ]
            
            response = await self.llm.generate_completion(
                messages=messages,
                model="gpt-4",
                temperature=0.3,
                max_tokens=max_tokens
            )
            
            return {
                "summary": response['content'],
                "type": summary_type,
                "tokens_used": response.get('tokens', 0)
            }
            
        except Exception as e:
            logger.error(f"Paper summarization error: {e}")
            raise
    
    async def identify_gaps(
        self,
        papers: List[Any],
        research_area: str
    ) -> Dict[str, Any]:
        """
        Identify research gaps
        
        Args:
            papers: List of papers
            research_area: Research area context
            
        Returns:
            Identified gaps
        """
        try:
            paper_summaries = self._build_paper_summaries(papers)
            
            prompt = f"""Analyze these papers in {research_area} and identify research gaps:

{paper_summaries}

Identify:
1. Unexplored Areas: Topics not covered
2. Methodological Gaps: Missing approaches or techniques
3. Contradictions: Conflicting findings that need resolution
4. Limitations: Common limitations across papers
5. Future Directions: Promising areas for future research

Provide specific, actionable gaps."""

            messages = [
                {"role": "system", "content": "You are a research strategist identifying gaps in scientific literature."},
                {"role": "user", "content": prompt}
            ]
            
            response = await self.llm.generate_completion(
                messages=messages,
                model="gpt-4",
                temperature=0.6,
                max_tokens=1500
            )
            
            return {
                "analysis": response['content'],
                "research_area": research_area,
                "papers_analyzed": len(papers)
            }
            
        except Exception as e:
            logger.error(f"Gap analysis error: {e}")
            raise
    
    async def extract_methodology(self, paper: Any) -> Dict[str, Any]:
        """
        Extract methodology details
        
        Args:
            paper: Paper data
            
        Returns:
            Methodology information
        """
        try:
            prompt = f"""Extract methodology details from this paper:

Title: {paper.title}
Abstract: {paper.abstract}

Extract and structure:
1. Research Method: Experimental, observational, computational, etc.
2. Datasets: Names and descriptions of datasets used
3. Evaluation Metrics: Metrics used to measure performance
4. Baselines: What the method is compared against
5. Implementation Details: Key technical details
6. Reproducibility: Information needed to reproduce

Format as structured JSON."""

            messages = [
                {"role": "system", "content": "You are an expert at extracting methodology from research papers."},
                {"role": "user", "content": prompt}
            ]
            
            response = await self.llm.generate_completion(
                messages=messages,
                model="gpt-4",
                temperature=0.3,
                max_tokens=1000
            )
            
            try:
                methodology = json.loads(response['content'])
            except json.JSONDecodeError:
                methodology = {"description": response['content']}
            
            return methodology
            
        except Exception as e:
            logger.error(f"Methodology extraction error: {e}")
            raise
    
    async def extract_key_insights(
        self,
        papers: List[Any],
        max_insights: int = 10
    ) -> List[str]:
        """
        Extract key insights from papers
        
        Args:
            papers: List of papers
            max_insights: Maximum number of insights
            
        Returns:
            List of insights
        """
        try:
            paper_summaries = self._build_paper_summaries(papers)
            
            prompt = f"""Extract the {max_insights} most important insights from these papers:

{paper_summaries}

Focus on:
- Novel findings or contributions
- Practical implications
- Theoretical advances
- Unexpected results
- Important limitations

List as concise bullet points."""

            messages = [
                {"role": "system", "content": "You are an expert at identifying key insights from research."},
                {"role": "user", "content": prompt}
            ]
            
            response = await self.llm.generate_completion(
                messages=messages,
                model="gpt-4",
                temperature=0.4,
                max_tokens=800
            )
            
            # Parse insights from response
            insights = [
                line.strip().lstrip('•-*').strip()
                for line in response['content'].split('\n')
                if line.strip() and any(c.isalnum() for c in line)
            ]
            
            return insights[:max_insights]
            
        except Exception as e:
            logger.error(f"Insight extraction error: {e}")
            raise
    
    async def analyze_trends(self, papers: List[Any]) -> Dict[str, Any]:
        """
        Analyze research trends
        
        Args:
            papers: List of papers
            
        Returns:
            Trend analysis
        """
        try:
            paper_summaries = self._build_paper_summaries(papers)
            
            prompt = f"""Analyze research trends across these papers:

{paper_summaries}

Identify:
1. Evolving Themes: How topics have evolved
2. Methodological Trends: Popular or emerging methods
3. Shifting Focus: Changes in research priorities
4. Common Patterns: Recurring approaches or findings

Provide specific trends with evidence."""

            messages = [
                {"role": "system", "content": "You are a research trend analyst."},
                {"role": "user", "content": prompt}
            ]
            
            response = await self.llm.generate_completion(
                messages=messages,
                model="gpt-4",
                temperature=0.5,
                max_tokens=1200
            )
            
            return {
                "analysis": response['content'],
                "paper_count": len(papers)
            }
            
        except Exception as e:
            logger.error(f"Trend analysis error: {e}")
            raise
    
    def _build_paper_summaries(self, papers: List[Any]) -> str:
        """Build formatted paper summaries"""
        summaries = []
        for i, paper in enumerate(papers, 1):
            summary = f"""
Paper {i}: {paper.title}
Authors: {', '.join(paper.authors)}
Abstract: {paper.abstract[:400]}...
Keywords: {', '.join(paper.keywords[:5])}
"""
            if hasattr(paper, 'methodology') and paper.methodology:
                summary += f"Methodology: {paper.methodology[:200]}...\n"
            if hasattr(paper, 'keyFindings') and paper.keyFindings:
                summary += f"Key Findings: {', '.join(paper.keyFindings[:3])}\n"
            
            summaries.append(summary)
        
        return "\n---\n".join(summaries)
    
    def _extract_list(self, data: Any) -> List[str]:
        """Extract list from various data types"""
        if isinstance(data, list):
            return data
        elif isinstance(data, str):
            return [item.strip() for item in data.split('\n') if item.strip()]
        elif isinstance(data, dict):
            return list(data.values())
        return []