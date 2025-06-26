from typing import List, Dict, Any, Optional, Union, Literal

from pydantic import BaseModel, Field


class ResumeEvaluationResult(BaseModel):
    pr_code: str
    resumeNo: str
    consultant_name: str
    klevel: str
    manday_cost_aka_rating: int
    comment: str
    evaluation_report: str = Field(
        default="",
        description="A detailed report of the evaluation process, including insights and recommendations. Use markdown formatting for better readability."
    )

class PurchaseRequirementEvaluationResponse(BaseModel):
    pr_code: str
    results: list[ResumeEvaluationResult]
    evaluation_report: str = Field(
        default="",
        description="A detailed report of the evaluation process, including insights and recommendations. Use markdown formatting for better readability."
    )
    status: Literal['input_required', 'error', 'completed'] = Field(
        default='completed',
        description="The status of the evaluation process. Can be 'input_required', 'error', or 'completed'."
    )
    message: Optional[str] = Field(
        default=None,
        description="An optional message providing additional information about the evaluation status."
    )

class PurchaseRequirementEvaluationRequest(BaseModel):
    pr_code: str = Field(
        ...,
        description="The unique code of the purchase requirement to be evaluated."
    )
    resumeNos: List[str] = Field(
        ...,
        description="A list of resume numbers to be evaluated against the purchase requirement."
    )