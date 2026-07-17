import asyncio
import time
import os
import sys

# Setup environment to import backend modules
sys.path.append("/app")
from app.services.classification_service import EvidenceClassificationService
from app.services.pipeline_router_service import PipelineRouterService
from app.services.ai_detection_service import AIDetectionService
from app.repositories.report_repository import ReportRepository


async def trace_execution():
    print("="*50)
    print("STARTING UNIVERSAL AI SCANNER TRACE")
    print("="*50)
    
    # 1. Setup Dummy File
    image_path = "/app/media/uploads/test_trace.png"
    if not os.path.exists(image_path):
        # Create a simple image using PIL
        from PIL import Image
        img = Image.new('RGB', (100, 100), color = 'red')
        os.makedirs(os.path.dirname(image_path), exist_ok=True)
        img.save(image_path)
    
    overall_start = time.time()
    
    # 2. Classification
    print("\n[STAGE] ImageClassifierService")
    t0 = time.time()
    try:
        classification = await asyncio.to_thread(EvidenceClassificationService.classify, image_path)
        detected_type = classification.get("evidence_type", "Unknown")
        print(f"  - Detected Type: {detected_type}")
    except Exception as e:
        print(f"  - Exception: {e}")
        detected_type = "Unknown"
    print(f"  - Execution Time: {(time.time() - t0) * 1000:.2f} ms")

    # 3. Pipeline Router
    print("\n[STAGE] PipelineRouterService")
    # We need a mock AIDetectionService because we don't have a real DB session easily here.
    # Wait, let's just initialize it with a None repository or a mock.
    class DummyReport:
        def __init__(self):
            self.id = 999
            self.pipeline_used = None
            self.processing_time = None
            self.detected_type = None
            self.deleted_at = None
            self.image_url = "/test_trace.png"
            self.raw_ai_response = None
            self.unified_report = None
            self.extracted_text = None
            self.entities = None
            self.risk_score = 0
            self.threat_level = "Unknown"
            self.selected_pipeline = None

    class MockRepo:
        def __init__(self):
            self.db = type('obj', (object,), {'commit': lambda self: None})()
        
        async def update_report(self, *args, **kwargs):
            return DummyReport()
            
        async def get_by_id(self, report_id):
            return DummyReport()
            
    mock_ai = AIDetectionService(MockRepo())
    
    t0 = time.time()
    try:
        # Force it to run Screenshot pipeline to trace OCR & Gemini
        detected_type = "Screenshot" 
        
        router_output = await PipelineRouterService.execute_pipeline(
            detected_type=detected_type,
            image_path=image_path,
            original_filename="test_trace.png",
            report_id=999,
            ai_detection_service=mock_ai
        )
        print(f"  - Pipeline Used: {router_output.get('pipeline_used')}")
        if 'timeline' in router_output:
            for k, v in router_output['timeline'].items():
                print(f"    - {k}: {v} ms")
        if 'error' in router_output:
            print(f"  - Pipeline Error: {router_output['error']}")
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"  - Exception: {e}")
    print(f"  - Execution Time: {(time.time() - t0) * 1000:.2f} ms")

    print("="*50)
    print(f"TOTAL EXECUTION TIME: {(time.time() - overall_start) * 1000:.2f} ms")
    print("="*50)

if __name__ == "__main__":
    asyncio.run(trace_execution())
