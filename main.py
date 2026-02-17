from fastapi import FastAPI, Form, HTTPException
from fastapi.responses import FileResponse
from passlib.context import CryptContext
import mysql.connector
from fastapi.staticfiles import StaticFiles

app = FastAPI()

from fastapi.staticfiles import StaticFiles

# ... (rest of your code)

app = FastAPI()

# ----------------- MODIFIED STATIC MOUNT -----------------
# 1. Mount the folder named "static" (the directory).
# 2. Make it accessible via the URL path /static (the name).
app.mount("/static", StaticFiles(directory="static"), name="static") 
# ---------------------------------------------------------

# ... (rest of your code)


# 🔐 Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 🛢 MySQL connection
db = mysql.connector.connect(
    host="mysql-189ae13c-john-2f78.b.aivencloud.com",
    user="avnadmin",
    password="AVNS_zJj0GyzfDhpT5Uz99ry",
    database="defaultdb",
    port = "19128"
)
cursor = db.cursor(dictionary=True)

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)



# ---------------- SIGNUP ----------------
@app.get("/signup")
async def show_signup():
    return FileResponse("signup.html")

@app.post("/signup")
def signup(
    username: str = Form(...),
    userpassword: str = Form(...)
):
    # Check if user already exists
    cursor.execute(
        "SELECT id FROM userss WHERE username=%s",
        (username,)
    )
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed = hash_password(userpassword)

    cursor.execute(
        "INSERT INTO userss (username, password_hash) VALUES (%s, %s)",
        (username, hashed)
    )
    db.commit()

    return {"message": "User registered successfully"}

# ---------------- LOGIN ----------------
@app.get("/login")
async def show_login():
    return FileResponse("login.html")

@app.post("/login")
def login(
    username: str = Form(...),
    password: str = Form(...)
):
    cursor.execute(
        "SELECT * FROM userss WHERE username=%s",
        (username,)
    )
    user = cursor.fetchone()

    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return {"message": "Login successful"}