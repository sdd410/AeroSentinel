from abc import ABC, abstractmethod
from typing import List
from ..schemas.models import Detection, Target, DroneTelemetry


class BaseDetector(ABC):
    @abstractmethod
    def detect(self, drones: List[DroneTelemetry], targets: List[Target], sim_time: float) -> List[Detection]:
        """Produce object detections given drone positions and target objects."""
        pass
