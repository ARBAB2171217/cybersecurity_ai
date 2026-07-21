from app.services.forensics.extractors import *

class BaseDetector:
    def __init__(self, name: str, pipeline: str, extractor: FeatureExtractor):
        self.name = name
        self.pipeline = pipeline
        self.extractor = extractor
        
    def should_analyze(self, context: PreprocessingContext) -> bool:
        return True

class QRDetector(BaseDetector):
    def __init__(self):
        super().__init__("QR Code", "QR Pipeline", QRFeatureExtractor())
        
    def should_analyze(self, context: PreprocessingContext) -> bool:
        return context.qr_detected

class CurrencyDetector(BaseDetector):
    def __init__(self):
        super().__init__("Currency", "Currency Pipeline", CurrencyFeatureExtractor())

class ScreenshotDetector(BaseDetector):
    def __init__(self):
        super().__init__("Screenshot", "Screenshot Pipeline", ScreenshotFeatureExtractor())

class DocumentDetector(BaseDetector):
    def __init__(self):
        super().__init__("Document", "Document Pipeline", DocumentFeatureExtractor())
