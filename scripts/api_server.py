import cv2
import numpy as np
import pandas as pd
import pickle
import warnings
import io
import base64
import os
from pathlib import Path
from datetime import datetime
from typing import Optional, List

from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from pydantic import BaseModel
from PIL import Image

warnings.filterwarnings("ignore")

# ============================================================
# PROJECT PATHS & IMPORTS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_DIR = BASE_DIR / "dataset"
EMBEDDINGS_DIR = BASE_DIR / "embeddings"
SCRIPTS_DIR = BASE_DIR / "scripts"

# Import existing core modules cleanly
import sys
sys.path.append(str(SCRIPTS_DIR))

from session_manager import (
    start_session as sys_start_session,
    stop_session as sys_stop_session,
    is_session_active,
    get_session
)

from attendance_manager import (
    mark_attendance as sys_mark_attendance,
    initialize_attendance,
    ATTENDANCE_FILE
)

from section_verifier import verify_section
from bunking_detector import check_student, get_student, get_current_class

app = FastAPI(
    title="ClassSync AI Backend API",
    description="REST API for Smart Classroom Face Recognition Attendance System",
    version="1.0.0"
)

# Enable CORS for frontend Vite server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize InsightFace model
insightface_app = None
model_error = None

try:
    from insightface.app import FaceAnalysis
    insightface_app = FaceAnalysis(
        name="buffalo_l",
        providers=["CPUExecutionProvider"]
    )
    insightface_app.prepare(ctx_id=0, det_size=(640, 640), det_thresh=0.3)
    print("InsightFace model initialized successfully with det_thresh=0.3.")
except Exception as e:
    model_error = str(e)
    print(f"Warning: InsightFace initialization failed: {e}")

def enhance_frame(frame):
    if frame is None:
        return frame
    try:
        lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
        l_channel, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        cl = clahe.apply(l_channel)
        limg = cv2.merge((cl, a, b))
        return cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
    except Exception:
        return frame

# Data Loading Helpers
def load_students_df():
    path = DATASET_DIR / "students.csv"
    if not path.exists():
        return pd.DataFrame(columns=["Student_ID", "Name", "Roll_No", "Section"])
    df = pd.read_csv(path)
    for col in ["Student_ID", "Name", "Roll_No", "Section"]:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip()
    return df

def load_faculty_df():
    path = DATASET_DIR / "faculty.csv"
    if not path.exists():
        return pd.DataFrame(columns=["Faculty_ID", "Name", "Subject", "Section", "Room"])
    df = pd.read_csv(path)
    for col in ["Faculty_ID", "Name", "Subject", "Section", "Room"]:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip()
    return df

def load_schedule_df():
    path = DATASET_DIR / "class_schedule.csv"
    if not path.exists():
        return pd.DataFrame(columns=["Faculty_ID", "Subject", "Room", "Day", "Start_Time", "End_Time", "Section"])
    df = pd.read_csv(path)
    for col in df.columns:
        df[col] = df[col].astype(str).str.strip()
    return df

def load_attendance_df():
    initialize_attendance()
    if not ATTENDANCE_FILE.exists():
        return pd.DataFrame(columns=["Student_ID", "Name", "Roll_No", "Section", "Date", "Time", "Subject", "Faculty_ID", "Room", "Status"])
    df = pd.read_csv(ATTENDANCE_FILE)
    for col in df.columns:
        df[col] = df[col].astype(str).str.strip()
    return df

def load_student_embeddings():
    path = EMBEDDINGS_DIR / "embeddings.pkl"
    if not path.exists():
        return {}
    try:
        with open(path, "rb") as f:
            return pickle.load(f)
    except Exception:
        return {}

def load_faculty_embeddings():
    path = EMBEDDINGS_DIR / "faculty_embeddings.pkl"
    if not path.exists():
        return {}
    try:
        with open(path, "rb") as f:
            return pickle.load(f)
    except Exception:
        return {}

def calculate_similarity(face_embedding, stored_embedding):
    face_emb = np.array(face_embedding).flatten()
    stored_emb = np.array(stored_embedding).flatten()
    face_norm = np.linalg.norm(face_emb)
    stored_norm = np.linalg.norm(stored_emb)
    if face_norm == 0 or stored_norm == 0:
        return -1.0
    return float(np.dot(face_emb, stored_emb) / (face_norm * stored_norm))

def recognize_faculty_embedding(face_embedding, threshold=0.50):
    faculty_db = load_faculty_embeddings()
    best_match = None
    best_score = -1.0
    for faculty_id, embeddings in faculty_db.items():
        if not embeddings:
            continue
        for stored in embeddings:
            sim = calculate_similarity(face_embedding, stored)
            if sim > best_score:
                best_score = sim
                best_match = faculty_id
    if best_score >= threshold:
        return str(best_match), best_score
    return None, best_score

def recognize_student_embedding(face_embedding, threshold=0.40):
    student_db = load_student_embeddings()
    best_match = None
    best_score = -1.0
    for student_id, embeddings in student_db.items():
        if not embeddings:
            continue
        for stored in embeddings:
            sim = calculate_similarity(face_embedding, stored)
            if sim > best_score:
                best_score = sim
                best_match = student_id
    if best_score >= threshold:
        return str(best_match), best_score
    return None, best_score

# ============================================================
# API MODELS
# ============================================================

class StartSessionRequest(BaseModel):
    faculty_id: str

class ManualAttendanceRequest(BaseModel):
    student_id: str
    subject: Optional[str] = None
    section: Optional[str] = None
    status: str = "Present"
    date: Optional[str] = None
    time: Optional[str] = None

class CreateStudentRequest(BaseModel):
    student_id: str
    name: str
    roll_no: str
    section: str

# ============================================================
# API ENDPOINTS
# ============================================================

@app.get("/api/status")
def get_system_status():
    student_embeddings = load_student_embeddings()
    faculty_embeddings = load_faculty_embeddings()
    students_df = load_students_df()
    attendance_df = load_attendance_df()
    session = get_session()
    
    return {
        "status": "online",
        "service_name": "ClassSync AI System Server",
        "version": "1.0.0",
        "model_status": {
            "loaded": insightface_app is not None,
            "model_name": "InsightFace (buffalo_l)",
            "error": model_error
        },
        "dataset_status": {
            "registered_students": len(students_df),
            "student_embeddings": len(student_embeddings),
            "faculty_embeddings": len(faculty_embeddings),
            "total_attendance_records": len(attendance_df)
        },
        "active_session": session
    }

@app.get("/api/dashboard/stats")
def get_dashboard_stats():
    students_df = load_students_df()
    attendance_df = load_attendance_df()
    total_students = len(students_df)
    
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    if not attendance_df.empty and "Date" in attendance_df.columns:
        today_records = attendance_df[attendance_df["Date"] == today_str]
        present_today = len(today_records["Student_ID"].unique())
    else:
        today_records = pd.DataFrame()
        present_today = 0
        
    absent_today = max(0, total_students - present_today)
    attendance_rate = round((present_today / total_students * 100), 1) if total_students > 0 else 0.0
    
    # Recent activity
    recent_activity = []
    if not attendance_df.empty:
        sorted_df = attendance_df.tail(10).iloc[::-1]
        for _, row in sorted_df.iterrows():
            recent_activity.append({
                "student_id": str(row.get("Student_ID", "")),
                "name": str(row.get("Name", "")),
                "roll_no": str(row.get("Roll_No", "")),
                "section": str(row.get("Section", "")),
                "date": str(row.get("Date", "")),
                "time": str(row.get("Time", "")),
                "subject": str(row.get("Subject", "")),
                "faculty_id": str(row.get("Faculty_ID", "")),
                "room": str(row.get("Room", "")),
                "status": str(row.get("Status", "Present"))
            })
            
    # Daily trend calculation
    daily_trend = []
    if not attendance_df.empty and "Date" in attendance_df.columns:
        grouped = attendance_df.groupby("Date")["Student_ID"].nunique().reset_index()
        for _, row in grouped.tail(7).iterrows():
            d_date = str(row["Date"])
            count = int(row["Student_ID"])
            rate = round((count / total_students * 100), 1) if total_students > 0 else 0
            daily_trend.append({
                "date": d_date,
                "present": count,
                "total": total_students,
                "rate": rate
            })
            
    # Section comparison
    class_wise = []
    if not students_df.empty:
        sections = students_df["Section"].unique()
        for sec in sections:
            sec_total = len(students_df[students_df["Section"] == sec])
            if not today_records.empty and "Section" in today_records.columns:
                sec_present = len(today_records[today_records["Section"] == sec]["Student_ID"].unique())
            else:
                sec_present = 0
            sec_rate = round((sec_present / sec_total * 100), 1) if sec_total > 0 else 0
            class_wise.append({
                "section": sec,
                "total": sec_total,
                "present": sec_present,
                "absent": max(0, sec_total - sec_present),
                "rate": sec_rate
            })

    return {
        "registered_students": total_students,
        "students_present_today": present_today,
        "students_absent_today": absent_today,
        "attendance_rate": attendance_rate,
        "date": today_str,
        "recent_activity": recent_activity,
        "daily_trend": daily_trend,
        "class_wise": class_wise
    }

@app.get("/api/students")
def get_students(search: Optional[str] = None, section: Optional[str] = None):
    students_df = load_students_df()
    student_embeddings = load_student_embeddings()
    attendance_df = load_attendance_df()
    
    if students_df.empty:
        return {"count": 0, "students": []}
        
    result_df = students_df.copy()
    if section and section.strip() and section != "all":
        result_df = result_df[result_df["Section"].str.upper() == section.strip().upper()]
        
    if search and search.strip():
        q = search.strip().lower()
        result_df = result_df[
            result_df["Name"].str.lower().str.contains(q) |
            result_df["Student_ID"].str.lower().str.contains(q) |
            result_df["Roll_No"].str.lower().str.contains(q)
        ]
        
    records = []
    for _, row in result_df.iterrows():
        sid = str(row["Student_ID"])
        has_emb = sid in student_embeddings and len(student_embeddings[sid]) > 0
        
        # Calculate attendance stats for student
        if not attendance_df.empty and "Student_ID" in attendance_df.columns:
            st_att = attendance_df[attendance_df["Student_ID"] == sid]
            days_present = len(st_att)
        else:
            days_present = 0
            
        records.append({
            "student_id": sid,
            "name": str(row["Name"]),
            "roll_no": str(row["Roll_No"]),
            "section": str(row["Section"]),
            "registration_status": "Registered" if has_emb else "Details Only",
            "embeddings_count": len(student_embeddings.get(sid, [])),
            "attendance_count": days_present
        })
        
    return {
        "count": len(records),
        "total_registered": len(students_df),
        "students": records
    }

@app.post("/api/students")
async def create_student(
    student_id: str = Form(...),
    name: str = Form(...),
    roll_no: str = Form(...),
    section: str = Form(...),
    image: Optional[UploadFile] = File(None)
):
    students_df = load_students_df()
    
    # Check duplicate
    if not students_df.empty and student_id in students_df["Student_ID"].values:
        raise HTTPException(status_code=400, detail=f"Student ID {student_id} already exists.")
        
    new_row = pd.DataFrame([{
        "Student_ID": str(student_id).strip(),
        "Name": str(name).strip(),
        "Roll_No": str(roll_no).strip(),
        "Section": str(section).strip().upper()
    }])
    
    students_df = pd.concat([students_df, new_row], ignore_index=True)
    students_df.to_csv(DATASET_DIR / "students.csv", index=False)
    
    # Handle image upload and embedding generation
    image_processed = False
    embedding_generated = False
    
    if image is not None:
        student_folder = DATASET_DIR / "students" / str(student_id).strip()
        student_folder.mkdir(parents=True, exist_ok=True)
        img_bytes = await image.read()
        img_path = student_folder / f"{student_id}_1.jpg"
        with open(img_path, "wb") as f:
            f.write(img_bytes)
        image_processed = True
        
        # If insightface is loaded, extract embedding
        if insightface_app is not None:
            nparr = np.frombuffer(img_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if frame is not None:
                faces = insightface_app.get(frame)
                if faces and len(faces) > 0:
                    emb = faces[0].embedding
                    student_embeddings = load_student_embeddings()
                    if str(student_id) not in student_embeddings:
                        student_embeddings[str(student_id)] = []
                    student_embeddings[str(student_id)].append(emb)
                    with open(EMBEDDINGS_DIR / "embeddings.pkl", "wb") as ef:
                        pickle.dump(student_embeddings, ef)
                    embedding_generated = True

    return {
        "success": True,
        "message": f"Student {name} ({student_id}) registered successfully.",
        "image_saved": image_processed,
        "embedding_generated": embedding_generated
    }

@app.get("/api/classes")
def get_classes():
    students_df = load_students_df()
    schedule_df = load_schedule_df()
    faculty_df = load_faculty_df()
    attendance_df = load_attendance_df()
    
    sections = set()
    if not students_df.empty:
        sections.update(students_df["Section"].unique())
    if not schedule_df.empty:
        sections.update(schedule_df["Section"].unique())
        
    classes_list = []
    for sec in sorted(list(sections)):
        sec_students = students_df[students_df["Section"] == sec] if not students_df.empty else pd.DataFrame()
        sec_schedule = schedule_df[schedule_df["Section"] == sec] if not schedule_df.empty else pd.DataFrame()
        
        schedules = []
        for _, row in sec_schedule.iterrows():
            fid = str(row.get("Faculty_ID", ""))
            fac_row = faculty_df[faculty_df["Faculty_ID"] == fid] if not faculty_df.empty else pd.DataFrame()
            fac_name = str(fac_row.iloc[0]["Name"]) if not fac_row.empty else fid
            schedules.append({
                "subject": str(row.get("Subject", "")),
                "faculty_id": fid,
                "faculty_name": fac_name,
                "room": str(row.get("Room", "")),
                "day": str(row.get("Day", "")),
                "start_time": str(row.get("Start_Time", "")),
                "end_time": str(row.get("End_Time", ""))
            })
            
        today_str = datetime.now().strftime("%Y-%m-%d")
        sec_att = attendance_df[(attendance_df["Section"] == sec) & (attendance_df["Date"] == today_str)] if not attendance_df.empty else pd.DataFrame()
        
        classes_list.append({
            "section": sec,
            "student_count": len(sec_students),
            "schedules": schedules,
            "today_attendance_count": len(sec_att["Student_ID"].unique()) if not sec_att.empty else 0
        })
        
    return {
        "count": len(classes_list),
        "classes": classes_list
    }

@app.get("/api/attendance")
def get_attendance_records(
    date: Optional[str] = None,
    section: Optional[str] = None,
    student_id: Optional[str] = None,
    search: Optional[str] = None,
    status: Optional[str] = None
):
    df = load_attendance_df()
    if df.empty:
        return {"count": 0, "records": []}
        
    if date and date.strip():
        df = df[df["Date"] == date.strip()]
    if section and section.strip() and section != "all":
        df = df[df["Section"].str.upper() == section.strip().upper()]
    if student_id and student_id.strip():
        df = df[df["Student_ID"] == student_id.strip()]
    if status and status.strip() and status != "all":
        df = df[df["Status"].str.lower() == status.strip().lower()]
    if search and search.strip():
        q = search.strip().lower()
        df = df[
            df["Name"].str.lower().str.contains(q) |
            df["Student_ID"].str.lower().str.contains(q) |
            df["Roll_No"].str.lower().str.contains(q) |
            df["Subject"].str.lower().str.contains(q)
        ]
        
    records = []
    for _, row in df.iloc[::-1].iterrows():
        records.append({
            "student_id": str(row.get("Student_ID", "")),
            "name": str(row.get("Name", "")),
            "roll_no": str(row.get("Roll_No", "")),
            "section": str(row.get("Section", "")),
            "date": str(row.get("Date", "")),
            "time": str(row.get("Time", "")),
            "subject": str(row.get("Subject", "")),
            "faculty_id": str(row.get("Faculty_ID", "")),
            "room": str(row.get("Room", "")),
            "status": str(row.get("Status", "Present"))
        })
        
    return {
        "count": len(records),
        "records": records
    }

@app.get("/api/attendance/export")
def export_attendance_csv(
    date: Optional[str] = None,
    section: Optional[str] = None
):
    df = load_attendance_df()
    if date and date.strip():
        df = df[df["Date"] == date.strip()]
    if section and section.strip() and section != "all":
        df = df[df["Section"].str.upper() == section.strip().upper()]
        
    csv_content = df.to_csv(index=False)
    filename = f"attendance_export_{date or 'all'}_{section or 'all'}.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.get("/api/attendance/session")
def get_current_session_info():
    session = get_session()
    schedule_df = load_schedule_df()
    faculty_df = load_faculty_df()
    
    faculty_name = None
    if session.get("faculty_id"):
        fac_row = faculty_df[faculty_df["Faculty_ID"] == str(session["faculty_id"])] if not faculty_df.empty else pd.DataFrame()
        if not fac_row.empty:
            faculty_name = str(fac_row.iloc[0]["Name"])
            
    return {
        "session": session,
        "faculty_name": faculty_name
    }

@app.post("/api/attendance/session/start")
def start_attendance_session(req: StartSessionRequest):
    faculty_df = load_faculty_df()
    if faculty_df.empty or req.faculty_id not in faculty_df["Faculty_ID"].values:
        raise HTTPException(status_code=404, detail=f"Faculty ID {req.faculty_id} not found in database.")
        
    started = sys_start_session({"Faculty_ID": str(req.faculty_id)})
    session = get_session()
    
    if not started:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot start session for Faculty {req.faculty_id}. No active class scheduled at current time in schedule database."
        )
        
    return {
        "success": True,
        "message": f"Classroom attendance session started for Faculty {req.faculty_id}.",
        "session": session
    }

@app.post("/api/attendance/session/stop")
def stop_attendance_session():
    sys_stop_session()
    return {
        "success": True,
        "message": "Classroom session closed.",
        "session": get_session()
    }

@app.post("/api/attendance/recognize-frame")
async def recognize_frame(
    file: Optional[UploadFile] = File(None),
    image_data: Optional[str] = Form(None)
):
    if insightface_app is None:
        raise HTTPException(
            status_code=503,
            detail=f"InsightFace machine learning model is not operational: {model_error or 'Model not loaded'}"
        )
        
    frame = None
    if file is not None:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    elif image_data is not None:
        # Base64 string header check
        if "," in image_data:
            image_data = image_data.split(",")[1]
        img_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
    if frame is None:
        raise HTTPException(status_code=400, detail="Invalid image payload. Provide a valid file or base64 frame.")
        
    # Run InsightFace face detection (with CLAHE fallback for backlit/shadowed images)
    faces = insightface_app.get(frame)
    if not faces or len(faces) == 0:
        enhanced = enhance_frame(frame)
        faces = insightface_app.get(enhanced)
    students_df = load_students_df()
    faculty_df = load_faculty_df()
    current_session = get_session()
    
    detected_results = []
    
    for face in faces:
        bbox = face.bbox.astype(int).tolist()
        embedding = face.embedding
        
        # 1. Check Faculty first
        fac_id, fac_score = recognize_faculty_embedding(embedding)
        if fac_id is not None:
            fac_row = faculty_df[faculty_df["Faculty_ID"] == fac_id] if not faculty_df.empty else pd.DataFrame()
            fac_name = str(fac_row.iloc[0]["Name"]) if not fac_row.empty else f"Faculty {fac_id}"
            
            # Start session if not active
            session_started = False
            if not is_session_active():
                session_started = sys_start_session({"Faculty_ID": fac_id})
                current_session = get_session()
                
            detected_results.append({
                "type": "faculty",
                "bbox": bbox,
                "person_id": fac_id,
                "name": fac_name,
                "score": round(float(fac_score), 2),
                "status": "FACULTY_DETECTED",
                "message": f"Faculty {fac_name} detected. Session active.",
                "attendance_marked": False
            })
            continue
            
        # 2. Check Student recognition
        st_id, st_score = recognize_student_embedding(embedding)
        if st_id is not None:
            st_row = students_df[students_df["Student_ID"] == st_id] if not students_df.empty else pd.DataFrame()
            if not st_row.empty:
                st_info = st_row.iloc[0]
                st_name = str(st_info["Name"])
                st_roll = str(st_info["Roll_No"])
                st_section = str(st_info["Section"])
                
                # Check section verification & bunking status
                status_res = check_student(st_id)
                marked = False
                mark_msg = ""
                
                # Verify section matching if session is active
                if is_session_active():
                    active_sec = current_session.get("section")
                    sec_ver = verify_section(st_section, active_sec)
                    if sec_ver["authorized"]:
                        # Mark attendance
                        marked = sys_mark_attendance(
                            student_id=st_id,
                            name=st_name,
                            roll_no=st_roll,
                            section=st_section,
                            subject=current_session.get("subject", "General"),
                            faculty_id=current_session.get("faculty_id", "F001"),
                            room=current_session.get("room", "Room-101")
                        )
                        mark_msg = "Attendance marked successfully." if marked else "Attendance already recorded today for this session."
                    else:
                        mark_msg = f"Section Mismatch: Student is in {st_section}, active class is {active_sec}."
                else:
                    mark_msg = "No active classroom session. Attendance cannot be recorded."
                    
                detected_results.append({
                    "type": "student",
                    "bbox": bbox,
                    "person_id": st_id,
                    "name": st_name,
                    "roll_no": st_roll,
                    "section": st_section,
                    "score": round(float(st_score), 2),
                    "status": status_res.get("status", "RECOGNIZED"),
                    "message": mark_msg,
                    "attendance_marked": marked
                })
                continue
                
        # 3. Unknown face
        detected_results.append({
            "type": "unknown",
            "bbox": bbox,
            "person_id": "UNKNOWN",
            "name": "Unknown",
            "score": 0.0,
            "status": "UNKNOWN_FACE",
            "message": "Face not recognized in dataset.",
            "attendance_marked": False
        })

    return {
        "faces_count": len(faces),
        "results": detected_results,
        "active_session": current_session
    }

@app.post("/api/attendance/mark-manual")
def mark_manual_attendance(req: ManualAttendanceRequest):
    students_df = load_students_df()
    st_row = students_df[students_df["Student_ID"] == req.student_id]
    if st_row.empty:
        raise HTTPException(status_code=404, detail=f"Student ID {req.student_id} not found.")
        
    info = st_row.iloc[0]
    session = get_session()
    
    subject = req.subject or session.get("subject") or "Machine Learning"
    section = req.section or str(info["Section"])
    faculty_id = session.get("faculty_id") or "F001"
    room = session.get("room") or "Room-101"
    
    marked = sys_mark_attendance(
        student_id=req.student_id,
        name=str(info["Name"]),
        roll_no=str(info["Roll_No"]),
        section=section,
        subject=subject,
        faculty_id=faculty_id,
        room=room
    )
    
    return {
        "success": marked,
        "message": "Attendance marked successfully." if marked else "Duplicate attendance record exists for this date and subject.",
        "record": {
            "student_id": req.student_id,
            "name": str(info["Name"]),
            "roll_no": str(info["Roll_No"]),
            "section": section,
            "subject": subject,
            "status": req.status
        }
    }

@app.get("/api/analytics")
def get_analytics():
    attendance_df = load_attendance_df()
    students_df = load_students_df()
    total_students = len(students_df)
    
    if attendance_df.empty or "Date" not in attendance_df.columns:
        return {
            "total_students": total_students,
            "total_records": 0,
            "daily_trends": [],
            "section_distribution": [],
            "status_breakdown": {"Present": 0, "Absent": total_students}
        }
        
    # Daily trends
    daily = attendance_df.groupby("Date")["Student_ID"].nunique().reset_index()
    daily_trends = []
    for _, row in daily.iterrows():
        cnt = int(row["Student_ID"])
        daily_trends.append({
            "date": str(row["Date"]),
            "present": cnt,
            "absent": max(0, total_students - cnt),
            "rate": round((cnt / total_students * 100), 1) if total_students > 0 else 0
        })
        
    # Section distribution
    sec_dist = []
    if not students_df.empty:
        for sec in students_df["Section"].unique():
            sec_tot = len(students_df[students_df["Section"] == sec])
            sec_att_df = attendance_df[attendance_df["Section"] == sec]
            unique_att = len(sec_att_df["Student_ID"].unique()) if not sec_att_df.empty else 0
            sec_dist.append({
                "section": sec,
                "total_students": sec_tot,
                "total_records": len(sec_att_df),
                "unique_present_today": unique_att,
                "rate": round((unique_att / sec_tot * 100), 1) if sec_tot > 0 else 0
            })
            
    return {
        "total_students": total_students,
        "total_records": len(attendance_df),
        "daily_trends": daily_trends,
        "section_distribution": sec_dist
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
