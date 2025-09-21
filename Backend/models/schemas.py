from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class DealMetadata(BaseModel):
    deal_id: str
    # company_name: str
    status: str = "pending"
    created_at: datetime
    processed_at: Optional[datetime] = None
    error: Optional[str] = None

class UserInput(BaseModel):
    qna: Optional[Dict[str, str]] = {}
    weightages: Optional[Dict[str, float]] = {
        "market": 0.4,
        "founder": 0.3,
        "team": 0.2,
        "traction": 0.1
    }
    
class Weightage(BaseModel):
    team_strength: int
    market_opportunity: int
    traction: int
    claim_credibility: int
    financial_health: int

class ProcessingStatus(BaseModel):
    deal_id: str
    status: str
    progress: Optional[str] = None
    error: Optional[str] = None

class MemoResponse(BaseModel):
    deal_id: str
    memo_text: Dict[str, Any]
    docx_url: str
