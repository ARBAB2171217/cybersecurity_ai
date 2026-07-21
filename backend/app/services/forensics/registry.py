from typing import List, Dict
from app.services.forensics.detectors import *
from app.services.forensics.models import FeatureSet, PreprocessingContext

class DetectorRegistry:
    def __init__(self):
        self._detectors: List[BaseDetector] = []
        
    def register(self, detector: BaseDetector):
        self._detectors.append(detector)
        
    def execute_all(self, context: PreprocessingContext) -> Dict[str, FeatureSet]:
        results = {}
        for d in self._detectors:
            if d.should_analyze(context):
                results[d.name] = d.extractor.extract(context)
        return results
