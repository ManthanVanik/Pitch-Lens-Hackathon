from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi import Body
import uvicorn
import os
import uuid
import logging
from datetime import datetime
from typing import Optional
import io
from google.cloud import storage

from models.schemas import DealMetadata, UserInput, MemoResponse, ProcessingStatus, Weightage
from utils.gcs_utils import GCSManager
from utils.ocr_utils import PDFProcessor
from utils.summarizer import GeminiSummarizer
from utils.search_utils import PublicDataGatherer
from utils.docx_utils import MemoExporter
from utils.firestore_utils import FirestoreManager
from config.settings import settings

from fastapi.responses import StreamingResponse
import aiofiles
import tempfile

from dotenv import load_dotenv
load_dotenv()

# ---------- Logging ----------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------- FastAPI app (for Jupyter proxy support) ----------
PORT = os.getenv("PORT", "9000")
ROOT_PATH = f"/proxy/{PORT}"

app = FastAPI(
    title="AI Investment Memo Generator",
    description="Generate investor-ready memos from pitch materials",
    version="1.0.0",
    root_path=ROOT_PATH,
    docs_url="/docs",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Initialize services ----------
gcs_manager = GCSManager()
pdf_processor = PDFProcessor()
gemini_summarizer = GeminiSummarizer()
data_gatherer = PublicDataGatherer()
memo_exporter = MemoExporter()
firestore_manager = FirestoreManager()

# ---------- Endpoints ----------

@app.get("/")
def root():
    return {"status": "ok", "service": "investment-memo", "docs": f"{ROOT_PATH}/docs"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

@app.post("/upload", response_model=dict)
async def upload_deal(
    background_tasks: BackgroundTasks,
    # company_name: str,
    pitch_deck: UploadFile = File(...),
):
    """Upload deal materials and start processing"""
    try:
        print("upload_deal called")
        # Generate unique deal ID
        # deal_id = f"{company_name.lower().replace(' ', '')}_{uuid.uuid4().hex[:6]}"
        deal_id = f"{uuid.uuid4().hex[:6]}"

        # Create deal metadata
        metadata = DealMetadata(
            deal_id=deal_id,
            # company_name=company_name,
            status="uploading",
            created_at=datetime.utcnow()
        )

        # Save initial metadata to Firestore
        await firestore_manager.create_deal(deal_id, metadata.dict())

        # Upload pitch deck to GCS
        file_urls = {}
        if pitch_deck:
            file_urls['pitch_deck_url'] = await gcs_manager.upload_file(
                pitch_deck, f"deals/{deal_id}/pitch_deck.pdf"
            )

        # Update Firestore with file URLs
        await firestore_manager.update_deal(deal_id, {"raw_files": file_urls})

        # Start background processing
        background_tasks.add_task(process_deal, deal_id, file_urls)

        return {
            "deal_id": deal_id,
            # "company_name": company_name,
            "status": "uploaded",
            "files": file_urls,
            "message": "Files uploaded successfully. Processing started."
        }

    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/status/{deal_id}", response_model=ProcessingStatus)
async def get_processing_status(deal_id: str):
    """Get current processing status"""
    try:
        deal_data = await firestore_manager.get_deal(deal_id)
        if not deal_data:
            raise HTTPException(status_code=404, detail="Deal not found")

        return ProcessingStatus(**deal_data.get('metadata', {}))

    except Exception as e:
        logger.error(f"Status check error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate_memo/{deal_id}", response_model=MemoResponse)
async def generate_memo(deal_id: str, weightage: Weightage = Body(...)):
    """Generate investment memo"""
    try:
        deal_data = await firestore_manager.get_deal(deal_id)
        if not deal_data:
            raise HTTPException(status_code=404, detail="Deal not found")

        if deal_data.get('metadata', {}).get('status') != 'processed':
            raise HTTPException(status_code=400, detail="Deal processing not complete")
        
        await firestore_manager.update_deal(deal_id, {
            "metadata.weightage": weightage.dict()
        })
        
        # Generate memo using Gemini
        memo_text = await gemini_summarizer.generate_memo(deal_data, weightage.dict())

        # Export to DOCX
        docx_url = await memo_exporter.create_memo_docx(deal_id, memo_text)
        
        deal_data_to_Send = await firestore_manager.get_deal(deal_id)
        # Save memo to Firestore
        memo_data = {
            "draft_v1": memo_text,
            "docx_url": docx_url,
            "generated_at": datetime.utcnow()
        }
        await firestore_manager.update_deal(deal_id, {"memo": memo_data})

        return MemoResponse(
            deal_id=deal_id,
            memo_text=memo_text,
            docx_url=docx_url,
            all_data=deal_data_to_Send
        )

    except Exception as e:
        logger.error(f"Memo generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ---------- Background Processing ----------
async def process_deal(deal_id: str, file_urls: dict):
    """Background task to process deal materials"""
    try:
        print("process_deal called")
        await firestore_manager.update_deal(deal_id, {"metadata.status": "processing"})
        extracted_text = {}
        temp_res = {}

        if 'pitch_deck_url' in file_urls:
            logger.info(f"Processing PDF for deal {deal_id}")
            pdf_data = await pdf_processor.process_pdf(file_urls['pitch_deck_url'])
            # extracted_text['pitch_deck'] = pdf_data
            temp_res = pdf_data;
            extracted_text['pitch_deck'] = {
                "raw":pdf_data["raw"],
                "concise":pdf_data["concise"],
            }
            #  {
            #     "raw": {str(i + 1): t for i, t in enumerate(page_texts)},
            #     "concise": concise_summary['summary_res'],
            #     "founder_response": concise_summary['founder_response'],
            #     "sector_response": concise_summary['sector_response']
            # }

        # Gather public data
        logger.info(f"Gathering public data for deal {deal_id}")
        deal_data = await firestore_manager.get_deal(deal_id)
        company_name = deal_data['metadata'].get('company_name', "")

        public_data = await data_gatherer.gather_data(temp_res["company_name_response"], temp_res["founder_response"], temp_res["sector_response"])
        # print("Extracted Text", extracted_text)
        await firestore_manager.update_deal(deal_id, {
            "extracted_text": extracted_text,
            "public_data": public_data,
            "metadata.status": "processed",
            "metadata.processed_at": datetime.utcnow(),
            "metadata.company_name": temp_res["company_name_response"],
            "metadata.founder_names": temp_res["founder_response"],
            "metadata.sector": temp_res["sector_response"],
        })

        logger.info(f"Deal {deal_id} processed successfully")

    except Exception as e:
        logger.error(f"Processing error for deal {deal_id}: {str(e)}")
        await firestore_manager.update_deal(deal_id, {
            "metadata.status": "error",
            "metadata.error": str(e)
        })

@app.get("/deals", response_model=list)
async def fetch_all_deals():
    """Fetch all deals from Firestore"""
    try:
        # all_deals = await firestore_manager.get_all_deals()  # You need to implement this in FirestoreManager
        all_deals = await firestore_manager.list_deals()  # You need to implement this in FirestoreManager
    
        return all_deals
    except Exception as e:
        logger.error(f"Fetch all deals error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/deals/{deal_id}", response_model=dict)
async def fetch_specific_deal(deal_id: str):
    """Fetch a specific deal by deal_id"""
    try:
        deal = await firestore_manager.get_deal(deal_id)
        if not deal:
            raise HTTPException(status_code=404, detail="Deal not found")
        return deal
    except Exception as e:
        logger.error(f"Fetch deal error for {deal_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/deals/{deal_id}", response_model=dict)
async def delete_specific_deal(deal_id: str):
    """Delete a specific deal by deal_id"""
    try:
        deal = await firestore_manager.get_deal(deal_id)
        if not deal:
            raise HTTPException(status_code=404, detail="Deal not found")

        await firestore_manager.delete_deal(deal_id)  # You need to implement this in FirestoreManager

        return {"deal_id": deal_id, "status": "deleted", "message": "Deal deleted successfully"}
    except Exception as e:
        logger.error(f"Delete deal error for {deal_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
        
@app.get("/download_memo/{deal_id}")
async def download_memo(deal_id: str):
    deal_data = await firestore_manager.get_deal(deal_id)
    print(deal_data)
    if not deal_data or "memo" not in deal_data:
        raise HTTPException(status_code=404, detail="Memo not found")

    gs_url = deal_data["memo"]["docx_url"]

    # Download the file from GCS to a temporary local file
    local_path = f"/tmp/{deal_id}_memo.docx"
    await gcs_manager.download_file(gs_url, local_path)  # implement download_file in GCSManager

    # Return as a downloadable file
    return StreamingResponse(
        open(local_path, "rb"),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename={deal_id}_memo.docx"}
    )

@app.get("/download_pitch_deck/{deal_id}")
async def download_pitch_deck(deal_id: str):
    """
    Download the pitch deck for a deal from GCS.
    """
    try:
        # Fetch deal from Firestore
        deal = await firestore_manager.get_deal(deal_id)
        if not deal:
            raise HTTPException(status_code=404, detail="Deal not found")

        # Get pitch deck URL
        gcs_path = deal.get("raw_files", {}).get("pitch_deck_url")
        if not gcs_path:
            raise HTTPException(status_code=404, detail="Pitch deck not found")

        # Parse bucket and blob name from gs:// URL
        assert gcs_path.startswith("gs://")
        parts = gcs_path[5:].split("/", 1)
        bucket_name, blob_name = parts[0], parts[1]

        # Download file from GCS into memory
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(blob_name)

        file_stream = io.BytesIO()
        blob.download_to_file(file_stream)
        file_stream.seek(0)

        filename = blob_name.split("/")[-1]
        return StreamingResponse(
            file_stream,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    except Exception as e:
        logger.error(f"Download pitch deck error for deal {deal_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
# ---------- Run ----------
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(PORT))
