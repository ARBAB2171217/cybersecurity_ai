import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from app.routers.reports import get_current_token_payload
from app.schemas.response import StandardResponse
from app.services.assistant_service import assistant_service
from app.services.upload_service import upload_service

router = APIRouter(prefix="/assistant", tags=["AI Assistant"])

@router.post("/query", response_model=StandardResponse[str])
async def ask_assistant(
    context_type: str = Form(..., description="Type of context: CURRENCY_REPORT, CYBER_SCAM_ANALYSIS, REPORT_ASSISTANT, COMMUNITY_INTELLIGENCE, EDUCATION, SUMMARIZATION, EVIDENCE_EXPLANATION"),
    user_prompt: str = Form(...),
    context_data: Optional[str] = Form(None, description="JSON string of context data"),
    files: List[UploadFile] = File(None, description="Optional images/evidence"),
    token_payload: dict = Depends(get_current_token_payload),
):
    """
    Unified endpoint for the Cyber Intelligence Assistant.
    """
    import json
    parsed_context = {}
    if context_data:
        try:
            parsed_context = json.loads(context_data)
        except json.JSONDecodeError:
            pass

    image_paths = []
    if files:
        for file in files:
            # We temporarily save the file to pass to Gemini
            saved_path = await upload_service.save_uploaded_image(file)
            image_paths.append(saved_path)

    try:
        response_text = await assistant_service.handle_query(
            context_type=context_type,
            user_prompt=user_prompt,
            context_data=parsed_context,
            image_paths=image_paths
        )
    finally:
        # Cleanup temporary files sent just for analysis
        import os
        for path in image_paths:
            if os.path.exists(path):
                try:
                    os.remove(path)
                except Exception:
                    pass

    return StandardResponse(
        success=True,
        message="Assistant response generated.",
        data=response_text
    )
