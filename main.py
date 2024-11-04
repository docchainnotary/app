import json
import pymysql
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional
import hashlib
import jwt
import uvicorn

# Load configuration from .env.json
with open('.env.json') as f:
    config = json.load(f)

# Database Configuration
db_config = config["db"]
jwt_config = config["jwt"]

# FastAPI and OAuth2 configuration
app = FastAPI(title="DocChain Digital Notary Service API")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token.php")
SECRET_KEY = jwt_config["key"]
ALGORITHM = "HS256"

# MySQL Database Connection
def get_mysql_connection():
    return pymysql.connect(
        host=db_config["host"],
        user=db_config["user"],
        password=db_config["pass"],
        database=db_config["db"]
    )

# Models
class User(BaseModel):
    username: str
    password: str
    email: str
    full_name: Optional[str] = None

class UserProfile(BaseModel):
    username: str
    email: str
    full_name: Optional[str]
    created_at: datetime

# Hashing utility
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

# JWT token creation
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Register function
@app.post("/register")
async def register(user: User):
    conn = get_mysql_connection()
    cursor = conn.cursor()
    
    hashed_password = hash_password(user.password)
    try:
        cursor.execute("INSERT INTO users (username, password, email, full_name, created_at) VALUES (%s, %s, %s, %s, %s)",
                       (user.username, hashed_password, user.email, user.full_name, datetime.utcnow()))
        conn.commit()
        return {"status": "User registered successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    finally:
        cursor.close()
        conn.close()

# Login function
@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = get_mysql_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)
    
    hashed_password = hash_password(form_data.password)
    cursor.execute("SELECT * FROM users WHERE username = %s AND password = %s", (form_data.username, hashed_password))
    user = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    access_token = create_access_token(data={"sub": user["username"]})
    return {"access_token": access_token, "token_type": "bearer"}

# Profile function
@app.get("/profile", response_model=UserProfile)
async def get_profile(current_user: str = Depends(oauth2_scheme)):
    conn = get_mysql_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)
    
    cursor.execute("SELECT username, email, full_name, created_at FROM users WHERE username = %s", (current_user,))
    user = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserProfile(**user)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
