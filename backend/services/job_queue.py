import asyncio
import logging
import os
import traceback
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Callable
from bson import ObjectId

from database import db

logger = logging.getLogger("job_queue")

class JobStatus:
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    RETRYING = "retrying"

class JobQueue:
    """
    Durable Async Job Queue backed by MongoDB AsyncMongoClient.
    Handles background jobs for PDF conversion, document finalization, and email notifications
    with idempotency, status tracking, automatic retries, and failure safety.
    """
    
    _handlers: Dict[str, Callable] = {}
    _worker_task: Optional[asyncio.Task] = None
    _running: bool = False

    @classmethod
    def register_handler(cls, job_type: str, handler: Callable):
        """Register an async job execution handler function."""
        cls._handlers[job_type] = handler
        logger.info(f"[JOB-QUEUE] Registered handler for job_type: {job_type}")

    @classmethod
    async def enqueue(
        cls,
        job_type: str,
        payload: Dict[str, Any],
        idempotency_key: Optional[str] = None,
        max_attempts: int = 3,
        delay_seconds: int = 0
    ) -> str:
        """
        Enqueue a durable background job into db.jobs.
        Guarantees idempotency if idempotency_key is provided.
        """
        if db is None:
            raise RuntimeError("Database connection not initialized")

        now = datetime.utcnow()
        scheduled_at = now + timedelta(seconds=delay_seconds)

        if idempotency_key:
            existing = await db.jobs.find_one({"idempotency_key": idempotency_key})
            if existing:
                if existing.get("status") in [JobStatus.COMPLETED, JobStatus.PROCESSING]:
                    logger.info(f"[JOB-QUEUE] Job with idempotency key '{idempotency_key}' already {existing.get('status')}. Skipping.")
                    return str(existing["_id"])
                elif existing.get("status") == JobStatus.FAILED and existing.get("attempts", 0) >= max_attempts:
                    logger.warning(f"[JOB-QUEUE] Job '{idempotency_key}' previously failed permanently.")
                    return str(existing["_id"])

        job_doc = {
            "job_type": job_type,
            "payload": payload,
            "status": JobStatus.QUEUED,
            "progress": 0,
            "attempts": 0,
            "max_attempts": max_attempts,
            "idempotency_key": idempotency_key,
            "error": None,
            "created_at": now,
            "scheduled_at": scheduled_at,
            "started_at": None,
            "completed_at": None
        }

        if idempotency_key:
            res = await db.jobs.update_one(
                {"idempotency_key": idempotency_key},
                {"$setOnInsert": job_doc},
                upsert=True
            )
            if res.upserted_id:
                return str(res.upserted_id)
            existing = await db.jobs.find_one({"idempotency_key": idempotency_key})
            return str(existing["_id"])
        else:
            res = await db.jobs.insert_one(job_doc)
            return str(res.inserted_id)

    @classmethod
    async def get_job_status(cls, job_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve job details and progress status by job_id."""
        if db is None:
            return None
        try:
            job = await db.jobs.find_one({"_id": ObjectId(job_id)})
            if job:
                job["id"] = str(job["_id"])
                del job["_id"]
            return job
        except Exception as e:
            logger.error(f"[JOB-QUEUE] Error fetching job status: {e}")
            return None

    @classmethod
    def register_default_handlers(cls):
        """Register built-in handlers for email, conversion, and document finalization."""
        if "send_email" not in cls._handlers:
            async def _send_email_handler(payload: Dict[str, Any]):
                from routes.email_service import send_email
                to_email = payload.get("to_email")
                subject = payload.get("subject")
                html_content = payload.get("html_content")
                if not to_email or not subject or not html_content:
                    raise ValueError("Missing required fields: to_email, subject, html_content")
                success = await send_email(to_email, subject, html_content)
                if not success:
                    raise RuntimeError(f"Failed to send email to {to_email}")

            cls.register_handler("send_email", _send_email_handler)

        if "document_conversion" not in cls._handlers:
            async def _document_conversion_handler(payload: Dict[str, Any]):
                from routes.converter import convert_to_pdf, get_pdf_page_count
                from storage import storage
                document_id = payload.get("document_id")
                file_path = payload.get("file_path")
                filename = payload.get("filename", "document.docx")

                if not document_id or not file_path:
                    raise ValueError("Missing required fields: document_id, file_path")

                doc = await db.documents.find_one({"_id": ObjectId(document_id)})
                if not doc:
                    raise ValueError(f"Document {document_id} not found")

                input_bytes = await asyncio.to_thread(storage.download, file_path)
                pdf_bytes = await asyncio.to_thread(convert_to_pdf, input_bytes, filename)
                if not pdf_bytes:
                    raise RuntimeError(f"Failed to convert document {document_id} ({filename}) to PDF")

                out_filename = f"converted_{document_id}.pdf"
                pdf_storage_path = await asyncio.to_thread(storage.upload, pdf_bytes, out_filename, folder="converted_docs")
                page_count = await asyncio.to_thread(get_pdf_page_count, pdf_bytes)

                await db.documents.update_one(
                    {"_id": ObjectId(document_id)},
                    {
                        "$set": {
                            "file_path": pdf_storage_path,
                            "pdf_storage_path": pdf_storage_path,
                            "page_count": page_count,
                            "conversion_status": "completed",
                            "updated_at": datetime.utcnow()
                        }
                    }
                )

            cls.register_handler("document_conversion", _document_conversion_handler)

        if "document_finalize" not in cls._handlers:
            async def _document_finalize_handler(payload: Dict[str, Any]):
                from routes.recipient_signing import finalize_document
                document_id = payload.get("document_id")
                if not document_id:
                    raise ValueError("Missing required field: document_id")
                doc_obj_id = ObjectId(document_id) if isinstance(document_id, str) else document_id
                await finalize_document(doc_obj_id)

            cls.register_handler("document_finalize", _document_finalize_handler)

    @classmethod
    async def start_worker(cls, poll_interval_seconds: float = 2.0):
        """Start the background worker processing loop."""
        if cls._running:
            return
        cls.register_default_handlers()
        cls._running = True
        cls._worker_task = asyncio.create_task(cls._process_loop(poll_interval_seconds))
        logger.info("[JOB-QUEUE] Background worker started.")

    @classmethod
    async def stop_worker(cls):
        """Gracefully stop the background worker loop."""
        cls._running = False
        if cls._worker_task:
            cls._worker_task.cancel()
            try:
                await cls._worker_task
            except asyncio.CancelledError:
                pass
        logger.info("[JOB-QUEUE] Background worker stopped gracefully.")

    @classmethod
    async def _process_loop(cls, poll_interval: float):
        while cls._running:
            try:
                await cls._process_next_job()
            except Exception as e:
                logger.error(f"[JOB-QUEUE] Error in worker process loop: {e}")
            await asyncio.sleep(poll_interval)

    @classmethod
    async def _process_next_job(cls):
        if db is None:
            return

        now = datetime.utcnow()
        # Find queued or retrying job ready for execution
        job = await db.jobs.find_one_and_update(
            {
                "status": {"$in": [JobStatus.QUEUED, JobStatus.RETRYING]},
                "scheduled_at": {"$lte": now}
            },
            {
                "$set": {
                    "status": JobStatus.PROCESSING,
                    "started_at": now
                },
                "$inc": {"attempts": 1}
            },
            sort=[("scheduled_at", 1)]
        )

        if not job:
            return

        job_id = job["_id"]
        job_type = job.get("job_type")
        payload = job.get("payload", {})
        attempts = job.get("attempts", 1)
        max_attempts = job.get("max_attempts", 3)

        logger.info(f"[JOB-QUEUE] Processing job {job_id} (type: {job_type}, attempt: {attempts}/{max_attempts})")

        handler = cls._handlers.get(job_type)
        if not handler:
            err_msg = f"No registered handler for job_type '{job_type}'"
            logger.error(f"[JOB-QUEUE] {err_msg}")
            await db.jobs.update_one(
                {"_id": job_id},
                {"$set": {"status": JobStatus.FAILED, "error": err_msg, "completed_at": datetime.utcnow()}}
            )
            return

        try:
            # Execute job handler
            if asyncio.iscoroutinefunction(handler):
                await handler(payload)
            else:
                await asyncio.to_thread(handler, payload)

            # Mark job as completed
            await db.jobs.update_one(
                {"_id": job_id},
                {
                    "$set": {
                        "status": JobStatus.COMPLETED,
                        "progress": 100,
                        "error": None,
                        "completed_at": datetime.utcnow()
                    }
                }
            )
            logger.info(f"[JOB-QUEUE] Job {job_id} ({job_type}) completed successfully.")

        except Exception as exc:
            err_trace = traceback.format_exc()
            logger.error(f"[JOB-QUEUE] Job {job_id} failed on attempt {attempts}: {exc}")

            if attempts < max_attempts:
                # Exponential backoff retry: 30s * (2 ^ (attempts - 1))
                backoff_delay = 30 * (2 ** (attempts - 1))
                next_schedule = datetime.utcnow() + timedelta(seconds=backoff_delay)
                await db.jobs.update_one(
                    {"_id": job_id},
                    {
                        "$set": {
                            "status": JobStatus.RETRYING,
                            "error": str(exc),
                            "scheduled_at": next_schedule
                        }
                    }
                )
                logger.info(f"[JOB-QUEUE] Job {job_id} scheduled for retry #{attempts + 1} at {next_schedule}")
            else:
                await db.jobs.update_one(
                    {"_id": job_id},
                    {
                        "$set": {
                            "status": JobStatus.FAILED,
                            "error": str(exc),
                            "completed_at": datetime.utcnow()
                        }
                    }
                )
                logger.error(f"[JOB-QUEUE] Job {job_id} permanently failed after {max_attempts} attempts.")
