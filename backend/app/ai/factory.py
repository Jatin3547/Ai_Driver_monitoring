"""Chooses simulation vs. live detector based on AI_MODE, with a safe
fallback: if AI_MODE=live but the optional CV deps aren't installed, we
fall back to simulation rather than crashing the whole API — and the
route response always reports which source actually served the data via
each event/status object's "source" field.
"""

from app.ai.base import BaseDetector
from app.ai.simulator import SimulatedDetector
from app.core.config import settings

_detector: BaseDetector | None = None
_active_source = "simulation"


def get_detector() -> BaseDetector:
    global _detector, _active_source
    if _detector is not None:
        return _detector

    if settings.ai_mode == "live":
        try:
            from app.ai.vision import LiveVisionDetector

            _detector = LiveVisionDetector(camera_index=settings.ai_camera_index)
            _active_source = "live"
            return _detector
        except Exception as exc:
            # Missing deps / no camera — fall back rather than crash the API.
            import logging

            logging.getLogger("fleet.ai").warning(
                "AI_MODE=live requested but live detector could not start (%s). "
                "Falling back to simulation.",
                exc,
            )

    _detector = SimulatedDetector()
    _active_source = "simulation"
    return _detector


def active_source() -> str:
    get_detector()
    return _active_source


def ai_status() -> dict:
    """Reports what's actually active, for the Settings page — never
    claims 'live' unless a live detector genuinely constructed successfully."""
    from app.ai.vision import VISION_DEPENDENCIES_AVAILABLE

    get_detector()  # ensures _active_source reflects a real attempt
    return {
        "configuredMode": settings.ai_mode,
        "activeSource": _active_source,
        "visionDependenciesInstalled": VISION_DEPENDENCIES_AVAILABLE,
        "cameraIndex": settings.ai_camera_index,
    }
