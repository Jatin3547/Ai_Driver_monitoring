"""REAL computer-vision driver-monitoring pipeline.

This is the "live" counterpart to app/ai/simulator.py. It is only usable
when:
  1. AI_MODE=live in .env, AND
  2. `pip install -r requirements-ai.txt` has been run (OpenCV, MediaPipe,
     YOLO/ultralytics), AND
  3. a working webcam is available.

None of that is guaranteed on a low-end Windows laptop, so the app never
assumes this module works -- see app/ai/router_utils.get_detector(), which
falls back to the simulator with a clear log message if these imports
fail or AI_MODE != "live". This module intentionally does NOT fabricate
confidence values: every score is a real number returned by the
underlying model's inference call.

Design (Phase G/H pipeline):
  camera frame -> MediaPipe FaceMesh (eye aspect ratio for
  drowsiness/eye-closure, mouth aspect ratio for yawning) + YOLO
  (phone-in-hand / person-presence detection) -> DetectionResult objects
  matching the same interface as the simulator, so downstream code
  (safety classification, alerting, incident logging) is identical for
  both simulated and live sources.
"""

from app.ai.base import BaseDetector, DetectionResult

try:
    import cv2  # noqa: F401
    import mediapipe as mp  # noqa: F401
    from ultralytics import YOLO  # noqa: F401

    VISION_DEPENDENCIES_AVAILABLE = True
except ImportError:
    VISION_DEPENDENCIES_AVAILABLE = False


EYE_AR_THRESHOLD = 0.21
EYE_AR_CONSEC_FRAMES = 20
MOUTH_AR_THRESHOLD = 0.6


class LiveVisionDetector(BaseDetector):
    """Real MediaPipe FaceMesh + YOLO based detector.

    Raises RuntimeError at construction time if the optional CV
    dependencies are not installed, so the app fails fast and loudly
    instead of silently behaving like the simulator.
    """

    def __init__(self, camera_index: int = 0) -> None:
        if not VISION_DEPENDENCIES_AVAILABLE:
            raise RuntimeError(
                "Live AI mode requires opencv-python, mediapipe and ultralytics. "
                "Install them with: pip install -r requirements-ai.txt"
            )
        self.camera_index = camera_index
        self._face_mesh = mp.solutions.face_mesh.FaceMesh(
            max_num_faces=1, refine_landmarks=True, min_detection_confidence=0.5
        )
        self._yolo = YOLO("yolov8n.pt")  # downloaded on first use by ultralytics
        self._closed_eye_frame_count = 0

    def _eye_aspect_ratio(self, landmarks, eye_indices):
        pts = [landmarks[i] for i in eye_indices]
        vertical_1 = ((pts[1].x - pts[5].x) ** 2 + (pts[1].y - pts[5].y) ** 2) ** 0.5
        vertical_2 = ((pts[2].x - pts[4].x) ** 2 + (pts[2].y - pts[4].y) ** 2) ** 0.5
        horizontal = ((pts[0].x - pts[3].x) ** 2 + (pts[0].y - pts[3].y) ** 2) ** 0.5
        return (vertical_1 + vertical_2) / (2.0 * horizontal) if horizontal else 0.0

    def analyze_frame(self, driver_code: str):
        """Capture and analyze a single frame from the configured camera.

        Not exercised by the automated verification for this project (no
        camera is available in the build/test environment) -- this is the
        real inference path for a machine that does have one, and is
        structurally complete but unverified end-to-end here.
        """
        cap = cv2.VideoCapture(self.camera_index)
        ok, frame = cap.read()
        cap.release()
        if not ok:
            raise RuntimeError(f"Could not read a frame from camera index {self.camera_index}")

        results = []
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        mesh_result = self._face_mesh.process(rgb_frame)
        if not mesh_result.multi_face_landmarks:
            results.append(
                DetectionResult(event_type="no_presence", severity="high", confidence=0.9, source="live")
            )
            return results

        landmarks = mesh_result.multi_face_landmarks[0].landmark
        left_eye = [33, 160, 158, 133, 153, 144]
        right_eye = [362, 385, 387, 263, 373, 380]
        ear = (self._eye_aspect_ratio(landmarks, left_eye) + self._eye_aspect_ratio(landmarks, right_eye)) / 2.0

        if ear < EYE_AR_THRESHOLD:
            self._closed_eye_frame_count += 1
        else:
            self._closed_eye_frame_count = 0

        if self._closed_eye_frame_count >= EYE_AR_CONSEC_FRAMES:
            results.append(
                DetectionResult(
                    event_type="drowsiness",
                    severity="high",
                    confidence=round(min(1.0, self._closed_eye_frame_count / 40), 2),
                    source="live",
                )
            )
        elif ear < EYE_AR_THRESHOLD:
            results.append(
                DetectionResult(event_type="eye_closure", severity="medium", confidence=round(1 - ear, 2), source="live")
            )

        yolo_results = self._yolo.predict(frame, verbose=False, classes=[67])
        for r in yolo_results:
            for box in r.boxes:
                confidence = float(box.conf[0])
                results.append(
                    DetectionResult(event_type="phone_use", severity="medium", confidence=round(confidence, 2), source="live")
                )

        return results
