"""Structured JSON logging via AWS Lambda Powertools.

Import `logger` everywhere. Pass context as keyword `extra` data rather than
formatting it into the message, so CloudWatch Logs Insights can query it:

    logger.info("Note created", extra={"note_id": str(note.id)})
"""

from aws_lambda_powertools import Logger

from core.config import get_settings
from core.project import PROJECT_SLUG

logger = Logger(service=f"{PROJECT_SLUG}-api", level=get_settings().log_level)
