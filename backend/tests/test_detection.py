import pytest
import math
from app.simulation.environment import Environment
from app.detection.simulated import SimulatedDetector
from app.detection.tracking import MultiTargetTracker
from app.schemas.models import (
    EnvironmentConfig,
    DetectionConfig,
    DroneTelemetry,
    Target,
    TargetClass,
    TrackStatus,
)


def test_simulated_detection_fov_and_range():
    env = Environment(EnvironmentConfig(width=500, height=500))
    cfg = DetectionConfig(detection_range=100.0, confidence_threshold=0.5)
    detector = SimulatedDetector(cfg, env)

    drone = DroneTelemetry(
        id="D1",
        x=100,
        y=100,
        heading=0.0,  # Facing East (along +X)
        speed=0.0,
        battery=100.0,
        sensor_fov_deg=90.0,
        detection_range=100.0,
    )

    # Target directly in front (50m East) -> in FOV & range
    target_in_fov = Target(
        id="T1", target_class=TargetClass.PERSON, x=150, y=100, visible=True
    )

    # Target directly behind (50m West) -> out of FOV
    target_behind = Target(
        id="T2", target_class=TargetClass.VEHICLE, x=50, y=100, visible=True
    )

    detections = detector.detect([drone], [target_in_fov, target_behind], sim_time=1.0)
    detected_ids = [d.target_id for d in detections]

    assert "T1" in detected_ids
    assert "T2" not in detected_ids


def test_tracker_lifecycle_and_expiration():
    tracker = MultiTargetTracker(track_timeout=2.0)
    from app.schemas.models import Detection

    det1 = Detection(
        id="det-1",
        target_id="T1",
        object_class=TargetClass.PERSON,
        confidence=0.9,
        x=120.0,
        y=130.0,
        timestamp=0.0,
        observing_drone_id="D1",
    )

    # Step 1: initial detection creates track
    tracks = tracker.update([det1], sim_time=0.0)
    assert len(tracks) == 1
    assert tracks[0].status == TrackStatus.ACTIVE

    # Step 2: time progresses with no updates -> track becomes STALE then LOST
    tracks = tracker.update([], sim_time=1.5)
    assert tracks[0].status == TrackStatus.STALE

    tracks = tracker.update([], sim_time=3.0)
    assert tracks[0].status == TrackStatus.LOST
