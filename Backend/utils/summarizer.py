import vertexai
from vertexai.preview.generative_models import GenerativeModel
from typing import Dict, Any
import logging
from config.settings import settings
import json
import re

logger = logging.getLogger(__name__)

class GeminiSummarizer:
    def __init__(self):
        vertexai.init(project=settings.GCP_PROJECT_ID, location=settings.GCP_LOCATION)
        self.model = GenerativeModel("gemini-2.5-pro")

    async def summarize_pitch_deck(self, full_text: str) -> Dict[str, str]:
        """Summarize pitch deck into structured sections"""
        try:
            prompt = f"""
            Analyze the following pitch deck content and extract information for these sections:
            - problem: What problem is being solved?
            - solution: What is the proposed solution?
            - market: Market size, opportunity, and target customers
            - team: Information about the founding team and key personnel
            - traction: Current progress, metrics, customers, revenue
            - financials: Financial projections, funding requirements, revenue model

            Pitch deck content:
            {full_text}

            Return the analysis as a JSON object with the above keys. Be concise but comprehensive.
            If a section is not clearly addressed in the pitch deck, indicate "Not specified" for that key.
            """

            response = self.model.generate_content(prompt)
            # print("response: ",response.text)
            
            founder_prompt = f"""
            Analyze the following pitch deck content and extract list of founders in array:
            
            
            Pitch deck content:
            {full_text}

            Return the analysis as an array.
            If no data found send empty array.
            """

            founder_response_temp = self.model.generate_content(founder_prompt)
            founder_response_temp = re.sub(r"^```json\s*|\s*```$", "", founder_response_temp.text.strip(), flags=re.MULTILINE)

            # Convert to Python list
            founder_response = json.loads(founder_response_temp)
            print("founder_response: ", founder_response)
            # founder_response_temp = founder_response_temp.text[7:-3];
            # founder_response = re.sub(r"^``````$", "", founder_response_temp.text.strip(), flags=re.IGNORECASE)
            
            sector_prompt = f"""
            Analyze the following pitch deck content and extract name of sector in which this startup fall in:
            
            
            Pitch deck content:
            {full_text}

            Return specific sector name only no extra word.
            If no data found send empty string "".
            """

            sector_response_temp = self.model.generate_content(sector_prompt)        
            sector_response = re.sub(r"^``````$", "", sector_response_temp.text.strip(), flags=re.IGNORECASE)
            
            company_name_prompt = f"""
            Analyze the following pitch deck content and extract name of the startup/company this pitch is for:
            
            
            Pitch deck content:
            {full_text}

            Return specific name only no extra words.
            If no data found send empty string "".
            """

            company_name_response_temp = self.model.generate_content(company_name_prompt)
            company_name_response = re.sub(r"^``````$", "", company_name_response_temp.text.strip(), flags=re.IGNORECASE)
            
            
            # Try direct parse first
#             try:
#                 return json.loads(response.text.strip())
            
#             except json.JSONDecodeError:
#                 pass
            
#             print("extract_json_block")
            # Extract JSON block and parse
            # block = self.extract_json_block(response.text.strip())
            # if block:
            #     try:
            #         return json.loads(block)
            #     except json.JSONDecodeError:
            #         pass
            # Parse JSON response
#             try:
#                 summary = json.loads(response.text.strip())
#             except json.JSONDecodeError:
#                 # Fallback parsing if JSON is malformed
#                 summary = self._parse_fallback_summary(response.text)

#             return summary
            return {"summary_res": response.text,
                   "founder_response": founder_response,
                   "sector_response": sector_response,
                   "company_name_response": company_name_response}

        except Exception as e:
            logger.error(f"Pitch deck summarization error: {str(e)}")
            return {
                "problem": "Error in processing",
                "solution": "Error in processing",
                "market": "Error in processing",
                "team": "Error in processing",
                "traction": "Error in processing",
                "financials": "Error in processing"
            }

    async def summarize_audio_transcript(self, transcript: str) -> str:
        """Summarize audio transcript"""
        try:
            prompt = f"""
            Summarize the following pitch transcript into key points:
            - Main value proposition
            - Key business metrics mentioned
            - Important insights about market or competition
            - Notable quotes from the founder

            Transcript:
            {transcript}

            Provide a concise summary in bullet points.
            """

            response = self.model.generate_content(prompt)
            return response.text.strip()

        except Exception as e:
            logger.error(f"Audio summarization error: {str(e)}")
            return "Error processing audio transcript"

    async def generate_memo(self, deal_data: Dict[str, Any], weightage: dict) -> str:
        """Generate complete investment memo"""
        try:
            # Extract data
            # print("deal data: ", deal_data)
            metadata = deal_data.get('metadata', {})
            extracted_text = deal_data.get('extracted_text', {})
            public_data = deal_data.get('public_data', {})
            user_input = deal_data.get('user_input', {})
            print("Data Retriverd")
            # Build context
            context = self._build_memo_context(metadata, extracted_text, public_data, user_input)
            # print("context : ",context)

#             prompt = f"""
#             Generate a comprehensive investment memo based on the following information.

#             {context}

#             Structure the memo with these sections:
#             1. Executive Summary
#             2. Founder Profile & Market Fit
#             3. Problem & Opportunity
#             4. Unique Differentiator
#             5. Team Execution Ability
#             6. Market Benchmarks
#             7. Risks & Red Flags
#             8. Investment Recommendation

#             Write in a professional, analytical tone suitable for investment committee review.
#             Include specific data points and metrics where available.
#             Provide a weighted scoring recommendation based on the weightages provided.
#             """

            # prompt = f""" Generate a structured investment memo in JSON format for the startup under review. Based on the following information 
            #      {context} 
            #      Generate an investment memo considering these weightages:
            #      Team Strength: {weightage['team_strength']}%
            #      Market Opportunity: {weightage['market_opportunity']}%
            #      Traction: {weightage['traction']}%
            #      Claim Credibility: {weightage['claim_credibility']}%
            #      Financial Health: {weightage['financial_health']}%
            #      from the provided data above extract all available information about the company, including its name, founders’ educational and professional details, previous ventures, sector focus, current market presence, technology stack, facilities, revenue model, pricing, unit economics, scalability, fundraising history, valuation rationale, financial metrics, risks, and mitigation strategies. Then, enrich this with data scraped from the internet to identify the company’s closest competitors, their business models, funding rounds, margins, and growth rates, as well as any latest news about the company itself. The analysis must also cover the broader industry trends, current market size, sub-segment opportunities, and growth forecasts relevant to the company’s sector. For every claim made by the company regarding revenue targets, market share, or growth potential, conduct a probabilistic verification using forecasting models. If the dataset available is only 6 to 12 months long, apply ETS or Bayesian log-linear regression; if 12 to 18 months, use ARIMA or Holt-Winters; if 18 months or longer, apply Prophet or Bayesian Structural Time Series. Run the chosen algorithm to simulate future trajectories and calculate the probability of the company achieving its stated goals. Incorporate Monte Carlo simulations where variability and uncertainty in assumptions must be captured. Construct a risk metric by combining financial metrics such as burn rate, runway, gross margins, ARR growth, customer acquisition cost, and LTV ratios with the credibility of claims validated through the probabilistic methods. The risk metric should output a percentage score representing the likelihood of safe investment versus potential downside. The predictions and risk metrics must be deterministic and stable across runs, always yielding the same result unless the input data itself changes. Present the final output in JSON format with the following structure: “company_overview” including name, sector, founders, and technology; “market_analysis” covering industry size, sub-segments, competitor details, and recent news; “business_model” describing revenue streams, pricing, and scalability; “financials” covering ARR, MRR, burn, runway, funding history, valuation rationale, and projections; “claims_analysis” where each claim is listed with the chosen algorithm, input dataset length, simulated probability, and result; “risk_metrics” providing the composite score and narrative justification; “conclusion” summarizing overall attractiveness of the opportunity. 
            #      """
            
            prompt = f"""
                You are an investment analyst. Your task is to generate a structured investment memo for the startup under review.

                Instructions:
                1. The output MUST be in strict JSON format. Do not include text outside the JSON. 
                2. Always follow the schema below exactly. Every key and subkey MUST appear, even if data is missing (use "Not available" or [] for empty). 
                3. The response must be deterministic and stable across runs — always yielding the same result unless the input data itself changes.
                4. Use the provided company data first, then enrich with reliable internet sources about competitors, market size, and industry trends.
                5. For probabilistic forecasting of company claims, follow these rules:
                   - Dataset length 6–12 months → ETS or Bayesian log-linear regression
                   - Dataset length 12–18 months → ARIMA or Holt-Winters
                   - Dataset length 18+ months → Prophet or Bayesian Structural Time Series
                   - If historical time-series is unavailable, run Monte Carlo simulations on pipeline data
                6. Construct a composite risk metric by combining:
                   - Burn rate
                   - Runway
                   - Gross margins
                   - ARR growth
                   - CAC/LTV ratios
                   - Credibility of claims (based on probabilistic analysis)
                   The risk metric should output a numeric score (0–100) and a narrative justification.
                7. Keep analysis fact-based and consistent. Do not invent competitors or valuations without attribution.
                8. All financial projections, probabilities, and risk metrics must be deterministic and stable.

                Schema to follow exactly:

                {{
                  "company_overview": {{
                    "name": "string",
                    "sector": "string",
                    "founders": [
                      {{
                        "name": "string",
                        "education": "string",
                        "professional_background": "string",
                        "previous_ventures": "string"
                      }}
                    ],
                    "technology": "string"
                  }},
                  "market_analysis": {{
                    "industry_size_and_growth": {{
                      "total_addressable_market": {{
                        "name": "string",
                        "value": "string",
                        "cagr": "string",
                        "source": "string"
                      }},
                      "serviceable_obtainable_market": {{
                        "name": "string",
                        "value": "string",
                        "projection": "string",
                        "cagr": "string",
                        "source": "string"
                      }},
                      "commentary": "string"
                    }},
                    "sub_segment_opportunities": ["string"],
                    "competitor_details": [
                      {{
                        "name": "string",
                        "category": "string",
                        "business_model": "string",
                        "funding": "string",
                        "margins": "string",
                        "commentary": "string"
                      }}
                    ],
                    "recent_news": "string"
                  }},
                  "business_model": {{
                    "revenue_streams": "string",
                    "pricing": "string",
                    "unit_economics": "string",
                    "scalability": "string"
                  }},
                  "financials": {{
                    "arr_mrr": {{
                      "current_booked_arr": "string",
                      "current_mrr": "string"
                    }},
                    "burn_and_runway": {{
                      "funding_ask": "string",
                      "stated_runway": "string",
                      "implied_net_burn": "string"
                    }},
                    "funding_history": "string",
                    "valuation_rationale": "string",
                    "projections": [
                      {{ "year": "string", "revenue": "string" }}
                    ]
                  }},
                  "claims_analysis": [
                    {{
                      "claim": "string",
                      "analysis_method": "string",
                      "input_dataset_length": "string",
                      "simulation_assumptions": "string or object",
                      "simulated_probability": "string",
                      "result": "string"
                    }}
                  ],
                  "risk_metrics": {{
                    "composite_risk_score": "number",
                    "score_interpretation": "string",
                    "narrative_justification": "string"
                  }},
                  "conclusion": {{
                    "overall_attractiveness": "string"
                  }}
                }}

                Startup data:
                {context}

                Weightages:
                Team Strength: {weightage['team_strength']}%
                Market Opportunity: {weightage['market_opportunity']}%
                Traction: {weightage['traction']}%
                Claim Credibility: {weightage['claim_credibility']}%
                Financial Health: {weightage['financial_health']}%
                """

            response_temp = self.model.generate_content(prompt)
            # response = re.sub(r"^``````$", "", response_temp.text.strip(), flags=re.IGNORECASE)
            clean_json_text = response_temp.text.strip()  # Remove leading/trailing whitespace
            # print("Memo Response: ", clean_json_text)
            
#             if clean_json_text.startswith("'''json"):
#                 print("Remove called")
#                 clean_json_text = clean_json_text[len("'''json"):].strip()
#                 print("Removed '''json : ", clean_json_text)
#             if clean_json_text.endswith("'''"):
#                 clean_json_text = clean_json_text[:-3].strip()
            # clean_json_text = clean_json_text.removeprefix(r"'''json").removesuffix(r"'''").strip()
            clean_json_text = clean_json_text[7:-3];
            print("Cleaned :",clean_json_text);
        
            response = json.loads(clean_json_text)
            # print("memo response: ",response)
            # return response.text.strip()
            return response

        except Exception as e:
            logger.error(f"Memo generation error: {str(e)}")
            return "Error generating investment memo"

    def _build_memo_context(self, metadata: Dict, extracted_text: Dict, 
                           public_data: Dict, user_input: Dict) -> str:
        """Build context string for memo generation"""
        context_parts = []

        # Company information
        context_parts.append(f"Company: {metadata.get('company_name', 'N/A')}")
        context_parts.append(f"Founder: {metadata.get('founder_name', 'N/A')}")
        context_parts.append(f"Sector: {metadata.get('sector', 'N/A')}")

        # Pitch deck insights
        if 'pitch_deck' in extracted_text and 'concise' in extracted_text['pitch_deck']:
            deck_summary = extracted_text['pitch_deck']['concise']
            context_parts.append("Pitch Deck Analysis:")
            context_parts.append(deck_summary)
            # for key, value in deck_summary.items():
            #     context_parts.append(f"{key.title()}: {value}")

        # Audio/video insights
        for media_type in ['voice_pitch', 'video_pitch']:
            if media_type in extracted_text:
                media_summary = extracted_text[media_type].get('concise', {}).get('summary', '')
                if media_summary:
                    context_parts.append(f"{media_type.replace('_', ' ').title()} Summary:")
                    context_parts.append(media_summary)

        # Public data
        if public_data:
            context_parts.append("Public Information:")
            for key, value in public_data.items():
                if isinstance(value, list):
                    context_parts.append(f"{key.replace('_', ' ').title()}: {', '.join(value)}")
                else:
                    context_parts.append(f"{key.replace('_', ' ').title()}: {value}")

        # User input
        if user_input:
            if 'qna' in user_input:
                context_parts.append("Additional Q&A:")
                for q, a in user_input['qna'].items():
                    context_parts.append(f"Q: {q}")
                    context_parts.append(f"A: {a}")

            if 'weightages' in user_input:
                context_parts.append(f"Evaluation Weightages: {user_input['weightages']}")

        return "".join(context_parts)

    def _parse_fallback_summary(self, text: str) -> Dict[str, str]:
        """Fallback parser if JSON parsing fails"""
        sections = {
            "problem": "Not specified",
            "solution": "Not specified", 
            "market": "Not specified",
            "team": "Not specified",
            "traction": "Not specified",
            "financials": "Not specified"
        }

        # Simple text parsing logic
        lines = text.split('')
        current_key = None

        for line in lines:
            line = line.strip()
            if ':' in line:
                for key in sections.keys():
                    if key.lower() in line.lower():
                        current_key = key
                        sections[key] = line.split(':', 1)[1].strip()
                        break
            elif current_key and line:
                sections[current_key] += f" {line}"

        return sections

    def extract_json_block(s: str) -> str | None:
        # Remove common markdown fences
        s = s.strip()
        s = re.sub(r"^``````$", "", s, flags=re.IGNORECASE | re.DOTALL).strip()

        # Find first top-level JSON object or array
        start_idx = None
        brace_stack = []
        for i, ch in enumerate(s):
            if ch in "{[":
                if start_idx is None:
                    start_idx = i
                brace_stack.append(ch)
            elif ch in "}]":
                if not brace_stack:
                    continue
                open_ch = brace_stack.pop()
                if (open_ch, ch) not in {("{", "}"), ("[", "]")}:
                    # mismatched; keep scanning
                    continue
                if not brace_stack and start_idx is not None:
                    return s[start_idx:i+1]
        return None