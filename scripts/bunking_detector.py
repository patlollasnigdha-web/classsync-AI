import pandas as pd
from datetime import datetime
from pathlib import Path


# ==========================================
# PROJECT PATH
# ==========================================

BASE_DIR = Path(__file__).resolve().parent.parent

DATASET_DIR = BASE_DIR / "dataset"


# ==========================================
# LOAD DATASETS
# ==========================================

students = pd.read_csv(
    DATASET_DIR / "students.csv"
)

schedule = pd.read_csv(
    DATASET_DIR / "class_schedule.csv"
)


# ==========================================
# CLEAN DATA
# ==========================================

students["Student_ID"] = (
    students["Student_ID"]
    .astype(str)
    .str.strip()
)

students["Section"] = (
    students["Section"]
    .astype(str)
    .str.strip()
)

schedule["Section"] = (
    schedule["Section"]
    .astype(str)
    .str.strip()
)

schedule["Day"] = (
    schedule["Day"]
    .astype(str)
    .str.strip()
)


# ==========================================
# FIND STUDENT
# ==========================================

def get_student(student_id):

    student_id = str(student_id).strip()

    result = students[
        students["Student_ID"] == student_id
    ]

    if result.empty:
        return None

    return result.iloc[0]


# ==========================================
# FIND CURRENT CLASS
# ==========================================

def get_current_class(section):

    current_day = datetime.now().strftime("%A")
    current_time = datetime.now().strftime("%H:%M")

    section = str(section).strip()

    classes = schedule[
        (schedule["Section"] == section) &
        (schedule["Day"] == current_day)
    ]

    for _, class_row in classes.iterrows():

        start_time = str(
            class_row["Start_Time"]
        ).strip()

        end_time = str(
            class_row["End_Time"]
        ).strip()

        if start_time <= current_time <= end_time:

            return class_row

    return None


# ==========================================
# CHECK STUDENT STATUS
# ==========================================

def check_student(student_id):

    # --------------------------------------
    # Find student
    # --------------------------------------

    student = get_student(student_id)

    if student is None:

        return {
            "status": "UNKNOWN_STUDENT",
            "message": "Student is not registered"
        }


    # --------------------------------------
    # Student information
    # --------------------------------------

    student_id = str(
        student["Student_ID"]
    )

    name = str(
        student["Name"]
    )

    roll_no = str(
        student["Roll_No"]
    )

    section = str(
        student["Section"]
    )


    # --------------------------------------
    # Find current class
    # --------------------------------------

    current_class = get_current_class(
        section
    )


    # ======================================
    # FREE HOUR
    # ======================================

    if current_class is None:

        return {

            "status": "FREE_HOUR",

            "student_id": student_id,

            "name": name,

            "roll_no": roll_no,

            "section": section,

            "subject": None,

            "faculty_id": None,

            "room": None,

            "start_time": None,

            "end_time": None,

            "message":
                "Student has no class at this time"
        }


    # ======================================
    # CLASS FOUND
    # ======================================

    subject = str(
        current_class["Subject"]
    )

    faculty_id = str(
        current_class["Faculty_ID"]
    )

    room = str(
        current_class["Room"]
    )

    start_time = str(
        current_class["Start_Time"]
    )

    end_time = str(
        current_class["End_Time"]
    )


    return {

        "status": "CLASS_SCHEDULED",

        "student_id": student_id,

        "name": name,

        "roll_no": roll_no,

        "section": section,

        "subject": subject,

        "faculty_id": faculty_id,

        "room": room,

        "start_time": start_time,

        "end_time": end_time,

        "message":
            "Student has a class scheduled"
    }


# ==========================================
# TEST FUNCTION
# ==========================================

if __name__ == "__main__":

    print("\n======================================")
    print("       SMART CLASSROOM")
    print("       STATUS TEST")
    print("======================================\n")


    # Test S001
    student_id = "S001"

    result = check_student(
        student_id
    )


    print(
        "Student :",
        result["name"]
        if "name" in result
        else "Unknown"
    )

    print(
        "Student ID :",
        result["student_id"]
        if "student_id" in result
        else student_id
    )

    print(
        "Section :",
        result["section"]
        if "section" in result
        else "Unknown"
    )

    print(
        "Status :",
        result["status"]
    )


    if result["status"] == "CLASS_SCHEDULED":

        print(
            "Subject :",
            result["subject"]
        )

        print(
            "Faculty :",
            result["faculty_id"]
        )

        print(
            "Room :",
            result["room"]
        )

        print(
            "Time :",
            result["start_time"],
            "-",
            result["end_time"]
        )


    elif result["status"] == "FREE_HOUR":

        print(
            "No class scheduled at this time."
        )


        print("\n======================================")