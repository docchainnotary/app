from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import IndexModel, ASCENDING, DESCENDING, TEXT
from pydantic import BaseModel, Field
from typing import Optional, Dict, List
from datetime import datetime
import asyncio
import bcrypt
from enum import Enum

# Configuration
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "notary_db"

# Pydantic models for data validation
class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"
    NOTARY = "notary"

class UserSchema(BaseModel):
    username: str
    email: str
    hashed_password: str
    stellar_address: Optional[str] = None
    role: UserRole = UserRole.USER
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    is_active: bool = True
    metadata: Optional[Dict] = None

class NotarizationSchema(BaseModel):
    document_hash: str
    transaction_id: str
    user_id: str
    filename: str
    file_size: int
    mime_type: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    status: str
    metadata: Optional[Dict] = None
    blockchain_proof: Dict
    ipfs_hash: Optional[str] = None

class VerificationSchema(BaseModel):
    document_hash: str
    verification_timestamp: datetime = Field(default_factory=datetime.utcnow)
    verified_by: str
    notarization_id: str
    status: str
    metadata: Optional[Dict] = None

async def init_database():
    """Initialize database with collections and indexes"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Create collections if they don't exist
    collections = await db.list_collection_names()
    
    # Users Collection
    if "users" not in collections:
        await db.create_collection("users")
    
    # Create indexes for users collection
    user_indexes = [
        IndexModel([("username", ASCENDING)], unique=True),
        IndexModel([("email", ASCENDING)], unique=True),
        IndexModel([("stellar_address", ASCENDING)], sparse=True),
        IndexModel([("created_at", DESCENDING)]),
        IndexModel([("role", ASCENDING)]),
    ]
    await db.users.create_indexes(user_indexes)

    # Notarizations Collection
    if "notarizations" not in collections:
        await db.create_collection("notarizations")
    
    # Create indexes for notarizations collection
    notarization_indexes = [
        IndexModel([("document_hash", ASCENDING)], unique=True),
        IndexModel([("transaction_id", ASCENDING)], unique=True),
        IndexModel([("user_id", ASCENDING)]),
        IndexModel([("timestamp", DESCENDING)]),
        IndexModel([("status", ASCENDING)]),
        IndexModel([("filename", TEXT)]),  # Enable text search on filenames
    ]
    await db.notarizations.create_indexes(notarization_indexes)

    # Verifications Collection
    if "verifications" not in collections:
        await db.create_collection("verifications")
    
    # Create indexes for verifications collection
    verification_indexes = [
        IndexModel([("document_hash", ASCENDING)]),
        IndexModel([("verification_timestamp", DESCENDING)]),
        IndexModel([("verified_by", ASCENDING)]),
        IndexModel([("notarization_id", ASCENDING)]),
    ]
    await db.verifications.create_indexes(verification_indexes)

    return db

async def create_admin_user(db) -> bool:
    """Create default admin user if it doesn't exist"""
    admin_user = {
        "username": "admin",
        "email": "admin@notaryservice.com",
        "hashed_password": bcrypt.hashpw("admin123".encode(), bcrypt.gensalt()),
        "role": UserRole.ADMIN,
        "created_at": datetime.utcnow(),
        "is_active": True,
        "metadata": {"created_by": "system"}
    }
    
    try:
        await db.users.insert_one(admin_user)
        print("Admin user created successfully")
        return True
    except Exception as e:
        print(f"Error creating admin user: {e}")
        return False

class NotaryDB:
    def __init__(self, db):
        self.db = db

    async def create_user(self, user: UserSchema) -> str:
        """Create a new user"""
        user_dict = user.dict()
        try:
            result = await self.db.users.insert_one(user_dict)
            return str(result.inserted_id)
        except Exception as e:
            raise Exception(f"Error creating user: {e}")

    async def create_notarization(self, notarization: NotarizationSchema) -> str:
        """Create a new notarization record"""
        notarization_dict = notarization.dict()
        try:
            result = await self.db.notarizations.insert_one(notarization_dict)
            return str(result.inserted_id)
        except Exception as e:
            raise Exception(f"Error creating notarization: {e}")

    async def create_verification(self, verification: VerificationSchema) -> str:
        """Create a new verification record"""
        verification_dict = verification.dict()
        try:
            result = await self.db.verifications.insert_one(verification_dict)
            return str(result.inserted_id)
        except Exception as e:
            raise Exception(f"Error creating verification: {e}")

    async def get_user_notarizations(self, user_id: str) -> List[NotarizationSchema]:
        """Get all notarizations for a user"""
        try:
            cursor = self.db.notarizations.find({"user_id": user_id})
            notarizations = await cursor.to_list(length=None)
            return [NotarizationSchema(**notarization) for notarization in notarizations]
        except Exception as e:
            raise Exception(f"Error retrieving notarizations: {e}")

    async def get_document_history(self, document_hash: str) -> Dict:
        """Get complete history of a document including notarizations and verifications"""
        try:
            notarization = await self.db.notarizations.find_one({"document_hash": document_hash})
            if not notarization:
                return None

            verifications = await self.db.verifications\
                .find({"document_hash": document_hash})\
                .sort("verification_timestamp", DESCENDING)\
                .to_list(length=None)

            return {
                "notarization": NotarizationSchema(**notarization),
                "verifications": [VerificationSchema(**v) for v in verifications]
            }
        except Exception as e:
            raise Exception(f"Error retrieving document history: {e}")

# Database initialization script
async def initialize_database():
    """Main function to initialize the database"""
    try:
        print("Initializing database...")
        db = await init_database()
        
        print("Creating admin user...")
        await create_admin_user(db)
        
        print("Database initialization completed successfully")
        return NotaryDB(db)
    except Exception as e:
        print(f"Error during database initialization: {e}")
        raise

# Usage example
async def main():
    try:
        # Initialize database
        notary_db = await initialize_database()
        
        # Example: Create a test user
        test_user = UserSchema(
            username="testuser",
            email="test@example.com",
            hashed_password=bcrypt.hashpw("password123".encode(), bcrypt.gensalt()),
            stellar_address="GBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            role=UserRole.USER
        )
        
        user_id = await notary_db.create_user(test_user)
        print(f"Test user created with ID: {user_id}")
        
        # Example: Create a test notarization
        test_notarization = NotarizationSchema(
            document_hash="0x1234567890abcdef",
            transaction_id="tx123456",
            user_id=user_id,
            filename="test_document.pdf",
            file_size=1024,
            mime_type="application/pdf",
            status="completed",
            blockchain_proof={
                "network": "stellar",
                "block_number": 12345,
                "timestamp": datetime.utcnow()
            }
        )
        
        notarization_id = await notary_db.create_notarization(test_notarization)
        print(f"Test notarization created with ID: {notarization_id}")
        
    except Exception as e:
        print(f"Error in main: {e}")

if __name__ == "__main__":
    # Run the initialization
    asyncio.run(main())
