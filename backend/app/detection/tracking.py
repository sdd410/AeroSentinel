import math
from typing import List, Dict, Tuple, Optional
from ..schemas.models import Detection, Track, TrackStatus


class MultiTargetTracker:
    def __init__(self, track_timeout: float = 5.0, association_distance: float = 40.0):
        self.track_timeout = track_timeout
        self.association_distance = association_distance
        self.tracks: Dict[str, Track] = {}
        self.track_counter = 1

    def update(self, detections: List[Detection], sim_time: float) -> List[Track]:
        # Associate detections with existing tracks (greedy nearest-neighbor)
        unmatched_detections = detections.copy()
        matched_track_ids = set()

        for track_id, track in list(self.tracks.items()):
            best_det = None
            best_dist = float('inf')

            for det in unmatched_detections:
                if det.object_class != track.object_class:
                    continue
                dist = math.hypot(det.x - track.x, det.y - track.y)
                if dist < self.association_distance and dist < best_dist:
                    best_dist = dist
                    best_det = det

            if best_det is not None:
                # Update track with smooth filter
                alpha = 0.6  # weight on new observation
                track.x = round(track.x * (1 - alpha) + best_det.x * alpha, 1)
                track.y = round(track.y * (1 - alpha) + best_det.y * alpha, 1)
                track.confidence = best_det.confidence
                track.last_seen = sim_time
                track.observing_drone_id = best_det.observing_drone_id
                track.status = TrackStatus.ACTIVE

                # Append history
                if len(track.history) == 0 or math.hypot(track.x - track.history[-1][0], track.y - track.history[-1][1]) > 5.0:
                    track.history.append((track.x, track.y))
                    if len(track.history) > 25:
                        track.history.pop(0)

                matched_track_ids.add(track_id)
                unmatched_detections.remove(best_det)

        # Create new tracks for remaining unmatched detections
        for det in unmatched_detections:
            new_id = f"TRK-{self.track_counter:03d}"
            self.track_counter += 1
            self.tracks[new_id] = Track(
                id=new_id,
                target_id=det.target_id,
                object_class=det.object_class,
                confidence=det.confidence,
                x=det.x,
                y=det.y,
                first_seen=sim_time,
                last_seen=sim_time,
                observing_drone_id=det.observing_drone_id,
                status=TrackStatus.ACTIVE,
                history=[(det.x, det.y)],
            )

        # Check track staleness and expiration
        stale_threshold = self.track_timeout * 0.4
        for track_id, track in list(self.tracks.items()):
            time_since_seen = sim_time - track.last_seen
            if time_since_seen > self.track_timeout:
                track.status = TrackStatus.LOST
                # Expire lost tracks after 2x timeout
                if time_since_seen > self.track_timeout * 2.0:
                    del self.tracks[track_id]
            elif time_since_seen > stale_threshold:
                track.status = TrackStatus.STALE

        return list(self.tracks.values())

    def clear(self):
        self.tracks.clear()
        self.track_counter = 1
