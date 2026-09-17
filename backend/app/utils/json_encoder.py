import json
from datetime import datetime, date, time
from decimal import Decimal
from uuid import UUID

from fastapi.responses import JSONResponse


class CustomJSONEncoder(json.JSONEncoder):
    """JSON encoder that handles datetime, date, time, uuid, and Decimal objects."""
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, date):
            return obj.isoformat()
        if isinstance(obj, time):
            return obj.isoformat()
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, UUID):
            return str(obj)
        return super().default(obj)


class CustomJSONResponse(JSONResponse):
    def render(self, content) -> bytes:
        return json.dumps(content, cls=CustomJSONEncoder, ensure_ascii=False).encode("utf-8")
