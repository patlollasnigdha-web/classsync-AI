import csv
import os
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
ATTENDANCE_FILE = BASE_DIR / "dataset" / "attendance.csv"

HEADER = [
    "Date",
    "Time",
    "Student_ID",
    "Name",
    "Roll_No",
    "Section",
    "Status"
]


def mark_attendance(student):

    os.makedirs("dataset", exist_ok=True)

    # Create file with header if it doesn't exist or is empty
    if (not os.path.exists(ATTENDANCE_FILE)) or (os.path.getsize(ATTENDANCE_FILE) == 0):
        with open(ATTENDANCE_FILE, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(HEADER)

    today = datetime.now().strftime("%d-%m-%Y")
    now = datetime.now().strftime("%H:%M:%S")

    student_id = str(student["Student_ID"])

    # Read existing attendance safely
    try:
        with open(ATTENDANCE_FILE, "r", newline="") as f:
            reader = csv.DictReader(f)

            # If header is wrong, recreate file
            if reader.fieldnames != HEADER:
                raise Exception("Invalid Header")

            for row in reader:
                if row["Date"] == today and row["Student_ID"] == student_id:
                    return

    except Exception:
        # Recreate attendance file
        with open(ATTENDANCE_FILE, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(HEADER)

    # Append attendance
    with open(ATTENDANCE_FILE, "a", newline="") as f:
        writer = csv.writer(f)

        writer.writerow([
            today,
            now,
            student["Student_ID"],
            student["Name"],
            student["Roll_No"],
            student["Section"],
            "Present"
        ])

    print(f"✅ Attendance Marked : {student['Name']}")