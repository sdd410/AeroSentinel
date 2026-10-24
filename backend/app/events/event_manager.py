import time
import uuid
from typing import List, Optional
from ..schemas.models import Alert, AlertSeverity


class EventManager:
    def __init__(self, max_history: int = 300):
        self.max_history = max_history
        self.alerts: List[Alert] = []

    def log(
        self,
        severity: AlertSeverity,
        source: str,
        message: str,
        entity_id: Optional[str] = None,
        sim_time: Optional[float] = None,
    ) -> Alert:
        timestamp = sim_time if sim_time is not None else time.time()
        alert = Alert(
            id=str(uuid.uuid4())[:8],
            severity=severity,
            timestamp=round(timestamp, 2),
            source=source,
            message=message,
            acknowledged=False,
            entity_id=entity_id,
        )
        self.alerts.append(alert)
        if len(self.alerts) > self.max_history:
            self.alerts.pop(0)
        return alert

    def info(self, source: str, message: str, entity_id: Optional[str] = None, sim_time: Optional[float] = None) -> Alert:
        return self.log(AlertSeverity.INFO, source, message, entity_id, sim_time)

    def warning(self, source: str, message: str, entity_id: Optional[str] = None, sim_time: Optional[float] = None) -> Alert:
        return self.log(AlertSeverity.WARNING, source, message, entity_id, sim_time)

    def critical(self, source: str, message: str, entity_id: Optional[str] = None, sim_time: Optional[float] = None) -> Alert:
        return self.log(AlertSeverity.CRITICAL, source, message, entity_id, sim_time)

    def acknowledge(self, alert_id: str) -> bool:
        for alert in self.alerts:
            if alert.id == alert_id:
                alert.acknowledged = True
                return True
        return False

    def clear(self):
        self.alerts.clear()

    def get_recent(self, limit: int = 50) -> List[Alert]:
        return self.alerts[-limit:]

    def get_counts(self) -> dict:
        counts = {"critical": 0, "warning": 0, "info": 0}
        for a in self.alerts:
            if a.severity == AlertSeverity.CRITICAL:
                counts["critical"] += 1
            elif a.severity == AlertSeverity.WARNING:
                counts["warning"] += 1
            else:
                counts["info"] += 1
        return counts
