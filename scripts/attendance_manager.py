import pandas as pd
from datetime import datetime
from pathlib import Path


# ==========================================
# PROJECT PATH
# ==========================================

BASE_DIR = Path(__file__).resolve().parent.parent

ATTENDANCE_FILE = (
    BASE_DIR
    / "dataset"
    / "attendance.csv"
)


# ==========================================
# ATTENDANCE COLUMNS
# ==========================================

COLUMNS = [
    "Student_ID",
    "Name",
    "Roll_No",
    "Section",
    "Date",
    "Time",
    "Subject",
    "Faculty_ID",
    "Room",
    "Status"
]


# ==========================================
# INITIALIZE ATTENDANCE FILE
# ==========================================

def initialize_attendance():

    if not ATTENDANCE_FILE.exists():

        df = pd.DataFrame(
            columns=COLUMNS
        )

        df.to_csv(
            ATTENDANCE_FILE,
            index=False
        )

        return


    # --------------------------------------
    # Make sure required columns exist
    # --------------------------------------

    df = pd.read_csv(
        ATTENDANCE_FILE
    )

    changed = False

    for column in COLUMNS:

        if column not in df.columns:

            df[column] = ""

            changed = True


    if changed:

        df = df[COLUMNS]

        df.to_csv(
            ATTENDANCE_FILE,
            index=False
        )


# ==========================================
# MARK ATTENDANCE
# ==========================================

def mark_attendance(
    student_id,
    name,
    roll_no,
    section,
    subject,
    faculty_id,
    room
):

    initialize_attendance()


    # ======================================
    # CURRENT DATE / TIME
    # ======================================

    now = datetime.now()

    current_date = now.strftime(
        "%Y-%m-%d"
    )

    current_time = now.strftime(
        "%H:%M:%S"
    )


    # ======================================
    # LOAD ATTENDANCE
    # ======================================

    attendance = pd.read_csv(
        ATTENDANCE_FILE
    )


    # ======================================
    # CHECK DUPLICATE
    # ======================================

    if not attendance.empty:

        duplicate = attendance[
            (attendance["Student_ID"].astype(str)
             == str(student_id))
            &
            (attendance["Date"].astype(str)
             == current_date)
            &
            (attendance["Subject"].astype(str)
             == str(subject))
        ]


        if not duplicate.empty:

            print(
                "Attendance already marked :",
                name,
                "|",
                subject
            )

            return False


    # ======================================
    # CREATE RECORD
    # ======================================

    record = {
        "Student_ID": str(student_id),

        "Name": str(name),

        "Roll_No": str(roll_no),

        "Section": str(section),

        "Date": current_date,

        "Time": current_time,

        "Subject": str(subject),

        "Faculty_ID": str(faculty_id),

        "Room": str(room),

        "Status": "Present"
    }


    # ======================================
    # ADD RECORD
    # ======================================

    new_row = pd.DataFrame(
        [record]
    )


    attendance = pd.concat(
        [
            attendance,
            new_row
        ],
        ignore_index=True
    )


    # ======================================
    # SAVE
    # ======================================

    attendance.to_csv(
        ATTENDANCE_FILE,
        index=False
    )


    # ======================================
    # SUCCESS MESSAGE
    # ======================================

    print()
    print("======================================")
    print("       ATTENDANCE REGISTERED")
    print("======================================")

    print(
        "Student  :",
        name
    )

    print(
        "Student ID :",
        student_id
    )

    print(
        "Roll No  :",
        roll_no
    )

    print(
        "Section  :",
        section
    )

    print(
        "Subject  :",
        subject
    )

    print(
        "Faculty  :",
        faculty_id
    )

    print(
        "Room     :",
        room
    )

    print(
        "Date     :",
        current_date
    )

    print(
        "Time     :",
        current_time
    )

    print(
        "Status   : PRESENT"
    )

    print("======================================")
    print()


    return True