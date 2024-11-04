from fastapi import FastAPI, HTTPException, File, UploadFile, Depends, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from typing import Optional, Dict, List
from datetime import datetime, timedelta
from enum import Enum
import hashlib
import jwt
from stellar_sdk import Server, Keypair, TransactionBuilder, Network
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import uvicorn

# Configuration
STELLAR_NETWORK_URL = "https://horizon-testnet.stellar.org"
MONGO_URL = "mongodb://localhost:27017"
SECRET_KEY = "SBPW2BGMHBFKVBZUBLPVDVWI42P4CC2LHYGQSGDHLF7AUOARPNNMKU33"
ALGORITHM = "HS256"

app = FastAPI(title="DocChain Digital Notary Service API")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Database initialization
client = AsyncIOMotorClient(MONGO_URL)
db = client.notary_db

# Stellar initialization
server = Server(horizon_url=STELLAR_NETWORK_URL)

# Models
class VersionStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"

class DocumentVersion(BaseModel):
    hash: str
    parent_hash: Optional[str] = None
    title: str
    status: VersionStatus
    creator_id: str
    timestamp: datetime
    signatures: List[Dict] = Field(default_factory=list)
    required_signers: List[str] = Field(default_factory=list)
    metadata: Dict = Field(default_factory=dict)

class IdentityClaim(BaseModel):
    authority_id: str
    claim_type: str
    claim_value: str
    signature: str
    expiration: datetime
    metadata: Dict = Field(default_factory=dict)

class NotarizationRequest(BaseModel):
    title: str
    signers: List[str]
    metadata: Optional[Dict] = None

class VersionRequest(BaseModel):
    title: str
    metadata: Optional[Dict] = None

class SignatureRequest(BaseModel):
    signature_data: str
    claim_reference: str

# Enhanced API endpoints
@app.post("/documents/", response_model=Dict)
async def create_document(
    file: UploadFile,
    request: NotarizationRequest,
    background_tasks: BackgroundTasks,
    current_user: str = Depends(get_current_user)
):
    """Create a new document with initial version"""
    try:
        # Generate document hash
        content = await file.read()
        document_hash = hashlib.sha256(content).hexdigest()

        # Verify user identity claim
        if not await verify_user_identity(current_user):
            raise HTTPException(status_code=401, detail="Valid identity claim required")

        # Create stellar transaction for document creation
        transaction = await create_document_transaction(
            document_hash,
            request.title,
            request.signers,
            current_user
        )

        #
# Store document metadata
        document_record = {
            "hash": document_hash,
            "title": request.title,
            "creator_id": current_user,
            "created_at": datetime.utcnow(),
            "file_name": file.filename,
            "file_size": len(content),
            "mime_type": file.content_type,
            "signers": request.signers,
            "current_version": {
                "hash": document_hash,
                "title": request.title,
                "status": VersionStatus.PENDING,
                "creator_id": current_user,
                "timestamp": datetime.utcnow(),
                "signatures": [],
                "required_signers": request.signers,
                "metadata": request.metadata or {}
            },
            "transaction_id": transaction["id"],
            "blockchain_proof": {
                "network": "stellar",
                "transaction_id": transaction["id"],
                "timestamp": datetime.utcnow()
            }
        }

        # Store in database
        await db.documents.insert_one(document_record)

        # Schedule background tasks
        background_tasks.add_task(notify_signers, request.signers, document_hash)
        background_tasks.add_task(update_user_documents, current_user, document_hash)

        return {
            "status": "success",
            "document_hash": document_hash,
            "transaction_id": transaction["id"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/documents/{document_hash}/versions")
async def create_document_version(
    document_hash: str,
    file: UploadFile,
    request: VersionRequest,
    background_tasks: BackgroundTasks,
    current_user: str = Depends(get_current_user)
):
    """Create a new version of an existing document"""
    try:
        # Verify document exists and user has access
        document = await db.documents.find_one({"hash": document_hash})
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        if current_user not in document["signers"]:
            raise HTTPException(status_code=403, detail="Unauthorized to create version")

        # Generate new version hash
        content = await file.read()
        new_hash = hashlib.sha256(content).hexdigest()

        # Create Stellar transaction for version creation
        transaction = await create_version_transaction(
            document_hash,
            new_hash,
            request.title,
            current_user
        )

        # Create version record
        version_record = {
            "hash": new_hash,
            "parent_hash": document_hash,
            "title": request.title,
            "status": VersionStatus.PENDING,
            "creator_id": current_user,
            "timestamp": datetime.utcnow(),
            "signatures": [],
            "required_signers": document["signers"],
            "metadata": request.metadata or {},
            "transaction_id": transaction["id"]
        }

        # Update document with new version
        await db.documents.update_one(
            {"hash": document_hash},
            {
                "$push": {"versions": version_record},
                "$set": {"current_version": version_record}
            }
        )

        # Notify signers of new version
        background_tasks.add_task(notify_signers, document["signers"], new_hash)

        return {
            "status": "success",
            "version_hash": new_hash,
            "transaction_id": transaction["id"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/documents/{document_hash}/signatures")
async def sign_document(
    document_hash: str,
    request: SignatureRequest,
    current_user: str = Depends(get_current_user)
):
    """Sign a document version"""
    try:
        # Verify document exists
        document = await db.documents.find_one({"hash": document_hash})
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        # Verify user is authorized to sign
        if current_user not in document["signers"]:
            raise HTTPException(status_code=403, detail="Unauthorized to sign")

        # Verify user hasn't already signed
        current_version = document["current_version"]
        if any(sig["signer_id"] == current_user for sig in current_version["signatures"]):
            raise HTTPException(status_code=400, detail="Already signed this version")

        # Create Stellar transaction for signature
        transaction = await create_signature_transaction(
            document_hash,
            request.signature_data,
            request.claim_reference,
            current_user
        )

        # Create signature record
        signature = {
            "signer_id": current_user,
            "timestamp": datetime.utcnow(),
            "signature_data": request.signature_data,
            "claim_reference": request.claim_reference,
            "transaction_id": transaction["id"]
        }

        # Update document with signature
        result = await db.documents.update_one(
            {"hash": document_hash},
            {"$push": {"current_version.signatures": signature}}
        )

        # Check if all required signatures are present
        document = await db.documents.find_one({"hash": document_hash})
        if len(document["current_version"]["signatures"]) == len(document["signers"]):
            await update_document_status(document_hash, VersionStatus.APPROVED)

        return {
            "status": "success",
            "transaction_id": transaction["id"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents/{document_hash}/history")
async def get_document_history(
    document_hash: str,
    current_user: str = Depends(get_current_user)
):
    """Get complete version history of document"""
    try:
        # Verify document exists and user has access
        document = await db.documents.find_one(
            {"hash": document_hash},
            {"versions": 1, "current_version": 1, "blockchain_proof": 1}
        )
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        # Verify on blockchain
        blockchain_history = await verify_blockchain_history(document_hash)

        return {
            "current_version": document["current_version"],
            "versions": document.get("versions", []),
            "blockchain_proof": document["blockchain_proof"],
            "blockchain_history": blockchain_history
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Helper functions
async def create_document_transaction(document_hash: str, title: str, signers: List[str], creator: str):
    """Create Stellar transaction for document creation"""
    try:
        source_keypair = await get_user_keypair(creator)
        source_account = await server.load_account(source_keypair.public_key)

        transaction = (
            TransactionBuilder(
                source_account=source_account,
                network_passphrase=Network.TESTNET_NETWORK_PASSPHRASE,
                base_fee=100,
            )
            .append_manage_data_op(
                data_name=f"doc:{document_hash}",
                data_value=title,
                source=source_keypair.public_key,
            )
            .set_timeout(30)
            .build()
        )

        transaction.sign(source_keypair)
        return await server.submit_transaction(transaction)

    except Exception as e:
        raise Exception(f"Error creating document transaction: {str(e)}")

async def verify_user_identity(user_id: str) -> bool:
    """Verify user has valid identity claim"""
    try:
        claim = await db.identity_claims.find_one({
            "user_id": user_id,
            "expiration": {"$gt": datetime.utcnow()},
            "status": "valid"
        })
        return bool(claim)
    except Exception as e:
        return False

async def notify_signers(signers: List[str], document_hash: str):
    """Notify signers of pending document"""
    # Implementation for notification system
    pass

async def update_user_documents(user_id: str, document_hash: str):
    """Update user's document list"""
    await db.users.update_one(
        {"_id": user_id},
        {"$addToSet": {"documents": document_hash}}
    )

async def verify_blockchain_history(document_hash: str):
    """Verify document history on blockchain"""
    # Implementation for blockchain verification
    pass

async def update_document_status(document_hash: str, status: VersionStatus):
    """Update document status"""
    await db.documents.update_one(
        {"hash": document_hash},
        {"$set": {"current_version.status": status}}
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
