#!/usr/bin/env python3
"""
Voiceflow Knowledge Base Backend API

A FastAPI server that integrates with the vf-knowledge-base-exporter library
to provide enhanced knowledge base functionality for the SaaSDashKit frontend.
"""

import os
import json
import logging
from typing import Dict, List, Optional, Any
from pathlib import Path
from datetime import datetime
import tempfile
import uuid

from fastapi import FastAPI, HTTPException, File, UploadFile, Form, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import uvicorn

# Import the vf-knowledge-base-exporter library
import sys
sys.path.append(str(Path(__file__).parent.parent / "attached_assets" / "vf-kb-exporter" / "vf-knowledge-base-exporter"))

from voiceflow_kb import VoiceflowKB

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Voiceflow Knowledge Base API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global KB manager instance
kb_manager: Optional[VoiceflowKB] = None

def get_kb_manager() -> VoiceflowKB:
    """Get or create the Knowledge Base manager instance"""
    global kb_manager
    if kb_manager is None:
        api_key = os.getenv("VOICEFLOW_API_KEY", "VF.DM.68e6a156911014714892eee8.Yeb3HK3luekO31gR")
        project_id = os.getenv("VOICEFLOW_PROJECT_ID", "68e56f7170abdf09f66dc756")

        if not api_key or not project_id:
            raise HTTPException(
                status_code=500,
                detail="Voiceflow API credentials not configured"
            )

        kb_manager = VoiceflowKB(api_key, project_id)
        logger.info(f"Initialized KB manager for project {project_id}")

    return kb_manager

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# Knowledge Base Endpoints

@app.get("/api/knowledge-base")
async def list_documents(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    search: Optional[str] = Query(None)
):
    """List all documents in the knowledge base"""
    try:
        kb = get_kb_manager()
        result = kb.list_documents(limit=limit, offset=offset)

        documents = result.get('data', [])

        # Filter by search term if provided
        if search:
            search_lower = search.lower()
            documents = [
                doc for doc in documents
                if search_lower in doc.get('name', '').lower()
                or search_lower in str(doc.get('metadata', {})).lower()
            ]

        return {
            "documents": documents,
            "total": len(documents),
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        logger.error(f"Error listing documents: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list documents: {str(e)}")

@app.post("/api/knowledge-base/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    metadata: Optional[str] = Form(None),
    overwrite: bool = Form(False)
):
    """Upload a document to the knowledge base"""
    try:
        kb = get_kb_manager()

        # Validate file type
        allowed_types = [
            'application/pdf',
            'text/plain',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/csv',
            'application/csv'
        ]

        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file.content_type}"
            )

        # Parse metadata if provided
        metadata_dict = None
        if metadata:
            try:
                metadata_dict = json.loads(metadata)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid metadata JSON")

        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        try:
            # Upload to Voiceflow
            result = kb.upload_document(
                file_path=temp_file_path,
                metadata=metadata_dict,
                overwrite=overwrite
            )

            document_id = result.get('data', {}).get('documentID')
            if not document_id:
                raise HTTPException(status_code=500, detail="Failed to get document ID from upload")

            logger.info(f"Successfully uploaded document: {document_id}")

            return {
                "id": document_id,
                "name": result.get('data', {}).get('name', file.filename),
                "status": "success",
                "uploaded_at": datetime.now().isoformat()
            }

        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading document: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload document: {str(e)}")

@app.post("/api/knowledge-base/upload-url")
async def upload_url(
    url: str = Form(...),
    name: Optional[str] = Form(None),
    metadata: Optional[str] = Form(None)
):
    """Upload a URL to the knowledge base"""
    try:
        kb = get_kb_manager()

        # Parse metadata if provided
        metadata_dict = None
        if metadata:
            try:
                metadata_dict = json.loads(metadata)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid metadata JSON")

        result = kb.upload_url(
            url=url,
            name=name,
            metadata=metadata_dict
        )

        document_id = result.get('data', {}).get('documentID')
        logger.info(f"Successfully uploaded URL: {document_id}")

        return {
            "id": document_id,
            "name": result.get('data', {}).get('name', name or url),
            "status": "success",
            "uploaded_at": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Error uploading URL: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload URL: {str(e)}")

@app.post("/api/knowledge-base/upload-table")
async def upload_table(
    name: str = Form(...),
    data: str = Form(...),  # JSON string
    schema: str = Form(...),  # JSON string
    metadata: Optional[str] = Form(None)
):
    """Upload table data to the knowledge base"""
    try:
        kb = get_kb_manager()

        # Parse JSON data
        try:
            table_data = json.loads(data)
            table_schema = json.loads(schema)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON data or schema")

        # Parse metadata if provided
        metadata_dict = None
        if metadata:
            try:
                metadata_dict = json.loads(metadata)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid metadata JSON")

        result = kb.upload_table(
            name=name,
            data=table_data,
            schema=table_schema,
            metadata=metadata_dict
        )

        document_id = result.get('data', {}).get('documentID')
        logger.info(f"Successfully uploaded table: {document_id}")

        return {
            "id": document_id,
            "name": name,
            "status": "success",
            "uploaded_at": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Error uploading table: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload table: {str(e)}")

@app.get("/api/knowledge-base/{document_id}")
async def get_document(document_id: str):
    """Get document details"""
    try:
        kb = get_kb_manager()
        result = kb.get_document(document_id)

        return result.get('data', {})

    except Exception as e:
        logger.error(f"Error getting document {document_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get document: {str(e)}")

@app.delete("/api/knowledge-base/{document_id}")
async def delete_document(document_id: str):
    """Delete a document"""
    try:
        kb = get_kb_manager()
        result = kb.delete_document(document_id)

        logger.info(f"Successfully deleted document: {document_id}")
        return {"status": "success", "message": "Document deleted successfully"}

    except Exception as e:
        logger.error(f"Error deleting document {document_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {str(e)}")

@app.put("/api/knowledge-base/{document_id}")
async def update_document(
    document_id: str,
    file: UploadFile = File(...),
    metadata: Optional[str] = Form(None)
):
    """Update a document"""
    try:
        kb = get_kb_manager()

        # Validate file type
        allowed_types = [
            'application/pdf',
            'text/plain',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/csv',
            'application/csv'
        ]

        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file.content_type}"
            )

        # Parse metadata if provided
        metadata_dict = None
        if metadata:
            try:
                metadata_dict = json.loads(metadata)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid metadata JSON")

        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        try:
            result = kb.update_document(
                document_id=document_id,
                file_path=temp_file_path,
                metadata=metadata_dict
            )

            logger.info(f"Successfully updated document: {document_id}")
            return {"status": "success", "message": "Document updated successfully"}

        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)

    except Exception as e:
        logger.error(f"Error updating document {document_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update document: {str(e)}")

@app.post("/api/knowledge-base/query")
async def query_knowledge_base(
    question: str = Form(...),
    chunk_limit: int = Form(5),
    synthesis: bool = Form(True),
    metadata_filter: Optional[str] = Form(None)
):
    """Query the knowledge base"""
    try:
        kb = get_kb_manager()

        # Parse metadata filter if provided
        metadata_dict = None
        if metadata_filter:
            try:
                metadata_dict = json.loads(metadata_filter)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid metadata filter JSON")

        result = kb.query(
            question=question,
            chunkLimit=chunk_limit,
            synthesis=synthesis,
            metadata=metadata_dict
        )

        return {
            "question": question,
            "answer": result.get('output', ''),
            "chunks": result.get('chunks', []),
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Error querying knowledge base: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to query knowledge base: {str(e)}")

@app.get("/api/knowledge-base/stats")
async def get_knowledge_base_stats():
    """Get knowledge base statistics"""
    try:
        kb = get_kb_manager()
        result = kb.list_documents(limit=1000)  # Get all documents for stats

        documents = result.get('data', [])
        total_documents = len(documents)

        # Calculate stats by type
        type_stats = {}
        metadata_stats = {}

        for doc in documents:
            doc_type = doc.get('type', 'unknown')
            type_stats[doc_type] = type_stats.get(doc_type, 0) + 1

            # Extract metadata for stats
            doc_metadata = doc.get('metadata', {})
            for key, value in doc_metadata.items():
                if key not in metadata_stats:
                    metadata_stats[key] = {}
                if str(value) not in metadata_stats[key]:
                    metadata_stats[key][str(value)] = 0
                metadata_stats[key][str(value)] += 1

        return {
            "total_documents": total_documents,
            "type_distribution": type_stats,
            "metadata_distribution": metadata_stats,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Error getting KB stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get statistics: {str(e)}")

if __name__ == "__main__":
    port = int(os.getenv("KB_BACKEND_PORT", "8001"))
    uvicorn.run(
        "kb_backend:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
