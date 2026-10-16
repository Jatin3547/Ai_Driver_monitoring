"""Converts SQLAlchemy model instances into plain dicts whose keys match
the frontend TypeScript types exactly (camelCase, `id` = human-readable
code like "DRV-001" rather than the internal UUID primary key).

Centralizing this here means every route returns a consistent shape and
there is exactly one place to update if the contract ever changes.
"""

from datetime import datetime, timezone

from app.models import Alert, Driver, GPSLocation, Incident, SafetyEvent, Vehicle


def _iso(dt: datetime) -> str:
    """SQLite strips tzinfo on round-trip; re-attach UTC before formatting
    so the frontend's `new Date(iso)` doesn't misinterpret it as local
    time. All timestamps in this system are stored/generated in UTC."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def driver_to_dict(d: Driver) -> dict:
    return {
        "id": d.code,
        "name": d.name,
        "licenseNumber": d.license_number,
        "phone": d.phone,
        "email": d.email,
        "status": d.status,
        "safetyScore": d.safety_score,
        "assignedVehicleId": d.assigned_vehicle.code if d.assigned_vehicle else None,
        "joinedDate": d.joined_date.isoformat(),
        "totalTrips": d.total_trips,
        "totalDistanceKm": d.total_distance_km,
        "incidentCount": d.incident_count,
    }


def vehicle_to_dict(v: Vehicle) -> dict:
    return {
        "id": v.code,
        "plateNumber": v.plate_number,
        "model": v.model,
        "make": v.make,
        "year": v.year,
        "type": v.type,
        "status": v.status,
        "assignedDriverId": v.assigned_driver.code if v.assigned_driver else None,
        "odometerKm": v.odometer_km,
        "fuelLevel": v.fuel_level,
        "lastServiceDate": v.last_service_date.isoformat() if v.last_service_date else "",
        "nextServiceDueKm": v.next_service_due_km,
    }


def incident_to_dict(i: Incident, driver: Driver | None, vehicle: Vehicle | None) -> dict:
    return {
        "id": i.id,
        "driverId": driver.code if driver else i.driver_id,
        "vehicleId": vehicle.code if vehicle else None,
        "type": i.type,
        "severity": i.severity,
        "status": i.status,
        "timestamp": _iso(i.timestamp),
        "location": i.location,
        "description": i.description,
    }


def alert_to_dict(a: Alert, driver: Driver | None, vehicle: Vehicle | None) -> dict:
    return {
        "id": a.id,
        "type": a.type,
        "severity": a.severity,
        "driverId": driver.code if driver else None,
        "vehicleId": vehicle.code if vehicle else None,
        "message": a.message,
        "timestamp": _iso(a.timestamp),
        "read": a.read,
    }


def gps_to_dict(g: GPSLocation, vehicle_code: str) -> dict:
    return {
        "vehicleId": vehicle_code,
        "lat": g.latitude,
        "lng": g.longitude,
        "speedKmh": g.speed_kmh,
        "heading": g.heading,
        "accelerationMs2": g.acceleration_ms2,
        "source": g.source,
        "timestamp": _iso(g.timestamp),
    }


def safety_event_to_dict(e: SafetyEvent, driver_code: str, vehicle_code: str) -> dict:
    return {
        "id": e.id,
        "driverId": driver_code,
        "vehicleId": vehicle_code,
        "type": e.event_type,
        "severity": e.severity,
        "confidence": e.confidence,
        "source": e.source,
        "timestamp": _iso(e.timestamp),
        "snapshotUrl": e.snapshot_url,
    }
