import cv2
import numpy as np
import pandas as pd
import pickle
import warnings
from pathlib import Path
from datetime import datetime

from insightface.app import FaceAnalysis

from session_manager import (
    start_session,
    stop_session,
    is_session_active,
    get_session
)

from attendance_manager import (
    mark_attendance
)

from section_verifier import (
    verify_section
)


warnings.filterwarnings("ignore")


# ============================================================
# PROJECT PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

DATASET_DIR = BASE_DIR / "dataset"
EMBEDDINGS_DIR = BASE_DIR / "embeddings"


# ============================================================
# LOAD STUDENTS
# ============================================================

students_file = DATASET_DIR / "students.csv"

students = pd.read_csv(
    students_file
)

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


# ============================================================
# LOAD FACULTY
# ============================================================

faculty_file = DATASET_DIR / "faculty.csv"

faculty = pd.read_csv(
    faculty_file
)

faculty["Faculty_ID"] = (
    faculty["Faculty_ID"]
    .astype(str)
    .str.strip()
)


# ============================================================
# LOAD CLASS SCHEDULE
# ============================================================

schedule_file = DATASET_DIR / "class_schedule.csv"

schedule = pd.read_csv(
    schedule_file
)

schedule["Faculty_ID"] = (
    schedule["Faculty_ID"]
    .astype(str)
    .str.strip()
)

schedule["Day"] = (
    schedule["Day"]
    .astype(str)
    .str.strip()
)

schedule["Section"] = (
    schedule["Section"]
    .astype(str)
    .str.strip()
)

schedule["Start_Time"] = (
    schedule["Start_Time"]
    .astype(str)
    .str.strip()
)

schedule["End_Time"] = (
    schedule["End_Time"]
    .astype(str)
    .str.strip()
)


# ============================================================
# LOAD STUDENT EMBEDDINGS
# ============================================================

student_embedding_file = (
    EMBEDDINGS_DIR / "embeddings.pkl"
)

with open(
    student_embedding_file,
    "rb"
) as f:

    student_database = pickle.load(f)


# ============================================================
# LOAD FACULTY EMBEDDINGS
# ============================================================

faculty_embedding_file = (
    EMBEDDINGS_DIR / "faculty_embeddings.pkl"
)

with open(
    faculty_embedding_file,
    "rb"
) as f:

    faculty_database = pickle.load(f)


# ============================================================
# SYSTEM INFORMATION
# ============================================================

print()
print("======================================")
print("          SMART CLASSROOM AI")
print("======================================")

print(
    "Student Embeddings :",
    len(student_database)
)

print(
    "Faculty Embeddings :",
    len(faculty_database)
)

print("======================================")
print()


# ============================================================
# INITIALIZE INSIGHTFACE
# ============================================================

app = FaceAnalysis(
    name="buffalo_l",
    providers=["CPUExecutionProvider"]
)

app.prepare(
    ctx_id=0
)


# ============================================================
# COSINE SIMILARITY
# ============================================================

def calculate_similarity(
    face_embedding,
    stored_embedding
):

    face_embedding = np.array(
        face_embedding
    ).flatten()

    stored_embedding = np.array(
        stored_embedding
    ).flatten()


    face_norm = np.linalg.norm(
        face_embedding
    )

    stored_norm = np.linalg.norm(
        stored_embedding
    )


    if face_norm == 0:
        return -1


    if stored_norm == 0:
        return -1


    similarity = (
        np.dot(
            face_embedding,
            stored_embedding
        )
        /
        (
            face_norm *
            stored_norm
        )
    )


    return similarity


# ============================================================
# RECOGNIZE FACULTY
# ============================================================

def recognize_faculty(
    face_embedding
):

    best_match = None
    best_score = -1


    for faculty_id, embeddings in (
        faculty_database.items()
    ):

        if len(embeddings) == 0:
            continue


        for stored_embedding in embeddings:

            similarity = calculate_similarity(
                face_embedding,
                stored_embedding
            )


            if similarity > best_score:

                best_score = similarity
                best_match = faculty_id


    # --------------------------------------------------------
    # FACULTY THRESHOLD
    # --------------------------------------------------------

    if best_score >= 0.50:

        return (
            str(best_match),
            best_score
        )


    return (
        None,
        best_score
    )


# ============================================================
# RECOGNIZE STUDENT
# ============================================================

def recognize_student(
    face_embedding
):

    best_match = None
    best_score = -1


    for student_id, embeddings in (
        student_database.items()
    ):

        if len(embeddings) == 0:
            continue


        for stored_embedding in embeddings:

            similarity = calculate_similarity(
                face_embedding,
                stored_embedding
            )


            if similarity > best_score:

                best_score = similarity
                best_match = student_id


    # --------------------------------------------------------
    # STUDENT THRESHOLD
    # --------------------------------------------------------

    if best_score >= 0.50:

        return (
            str(best_match),
            best_score
        )


    return (
        None,
        best_score
    )


# ============================================================
# GET CURRENT SCHEDULE FOR A SECTION
# ============================================================

def get_current_class(
    section
):

    current_day = datetime.now().strftime(
        "%A"
    )

    current_time = datetime.now().strftime(
        "%H:%M"
    )


    section = str(
        section
    ).strip()


    rows = schedule[
        (schedule["Section"] == section)
        &
        (schedule["Day"] == current_day)
    ]


    for _, row in rows.iterrows():

        start_time = str(
            row["Start_Time"]
        ).strip()

        end_time = str(
            row["End_Time"]
        ).strip()


        if (
            start_time
            <=
            current_time
            <=
            end_time
        ):

            return row


    return None


# ============================================================
# DRAW TEXT HELPER
# ============================================================

def draw_text(
    frame,
    text,
    x,
    y,
    color=(255, 255, 255),
    scale=0.65,
    thickness=2
):

    cv2.putText(
        frame,
        str(text),
        (x, y),
        cv2.FONT_HERSHEY_SIMPLEX,
        scale,
        color,
        thickness
    )


# ============================================================
# OPEN WEBCAM
# ============================================================

cap = cv2.VideoCapture(0)


if not cap.isOpened():

    print(
        "Cannot open webcam."
    )

    exit()


print(
    "System Ready..."
)

print(
    "Faculty + Student Detection Active"
)

print(
    "Section Verification Active"
)

print(
    "Attendance System Active"
)

print(
    "Press Q to Quit"
)

print()


# ============================================================
# MAIN LOOP
# ============================================================

while True:

    ret, frame = cap.read()


    if not ret:

        print(
            "Failed to read webcam frame."
        )

        break


    # ========================================================
    # FACE DETECTION
    # ========================================================

    faces = app.get(
        frame
    )


    # ========================================================
    # PROCESS EACH FACE
    # ========================================================

    for face in faces:

        x1, y1, x2, y2 = (
            face.bbox.astype(int)
        )


        embedding = face.embedding


        # ====================================================
        # TRY FACULTY RECOGNITION
        # ====================================================

        faculty_id, faculty_score = (
            recognize_faculty(
                embedding
            )
        )


        # ====================================================
        # FACULTY DETECTED
        # ====================================================

        if faculty_id is not None:

            faculty_member = faculty[
                faculty["Faculty_ID"]
                ==
                str(faculty_id)
            ]


            if not faculty_member.empty:

                faculty_member = (
                    faculty_member.iloc[0]
                )


                color = (
                    0,
                    255,
                    0
                )


                # --------------------------------------------
                # FACE BOX
                # --------------------------------------------

                cv2.rectangle(
                    frame,
                    (x1, y1),
                    (x2, y2),
                    color,
                    2
                )


                # --------------------------------------------
                # FACULTY NAME
                # --------------------------------------------

                draw_text(
                    frame,
                    "Faculty : "
                    + str(
                        faculty_member["Name"]
                    ),
                    x1,
                    max(
                        25,
                        y1 - 80
                    ),
                    color
                )


                # --------------------------------------------
                # FACULTY ID
                # --------------------------------------------

                draw_text(
                    frame,
                    "ID : "
                    + str(
                        faculty_member[
                            "Faculty_ID"
                        ]
                    ),
                    x1,
                    max(
                        50,
                        y1 - 55
                    ),
                    color,
                    0.60
                )


                # --------------------------------------------
                # SCORE
                # --------------------------------------------

                draw_text(
                    frame,
                    "Score : {:.2f}".format(
                        faculty_score
                    ),
                    x1,
                    max(
                        75,
                        y1 - 30
                    ),
                    color,
                    0.60
                )


                # --------------------------------------------
                # CONSOLE
                # --------------------------------------------

                print(
                    "Faculty Detected :",
                    faculty_member["Name"],
                    "| ID :",
                    faculty_member["Faculty_ID"],
                    "| Score :",
                    round(
                        faculty_score,
                        2
                    )
                )


                # =================================================
                # START SESSION
                # =================================================

                if not is_session_active():

                    started = start_session(
                        {
                            "Faculty_ID":
                            str(
                                faculty_member[
                                    "Faculty_ID"
                                ]
                            )
                        }
                    )


                    if started:

                        print(
                            "Classroom session started."
                        )



        # ====================================================
        # STUDENT PROCESSING
        # ====================================================

        else:

            student_id, student_score = (
                recognize_student(
                    embedding
                )
            )


            # =================================================
            # STUDENT RECOGNIZED
            # =================================================

            if student_id is not None:

                student_member = students[
                    students["Student_ID"]
                    ==
                    str(student_id)
                ]


                if not student_member.empty:

                    student_member = (
                        student_member.iloc[0]
                    )


                    color = (
                        255,
                        255,
                        0
                    )


                    # =================================================
                    # STUDENT FACE BOX
                    # =================================================

                    cv2.rectangle(
                        frame,
                        (x1, y1),
                        (x2, y2),
                        color,
                        2
                    )


                    # =================================================
                    # STUDENT NAME
                    # =================================================

                    draw_text(
                        frame,
                        "Student : "
                        + str(
                            student_member[
                                "Name"
                            ]
                        ),
                        x1,
                        max(
                            25,
                            y1 - 105
                        ),
                        color
                    )


                    # =================================================
                    # STUDENT ID
                    # =================================================

                    draw_text(
                        frame,
                        "ID : "
                        + str(
                            student_member[
                                "Student_ID"
                            ]
                        ),
                        x1,
                        max(
                            50,
                            y1 - 80
                        ),
                        color,
                        0.60
                    )


                    # =================================================
                    # ROLL NUMBER
                    # =================================================

                    draw_text(
                        frame,
                        "Roll : "
                        + str(
                            student_member[
                                "Roll_No"
                            ]
                        ),
                        x1,
                        max(
                            75,
                            y1 - 55
                        ),
                        color,
                        0.60
                    )


                    # =================================================
                    # STUDENT SECTION
                    # =================================================

                    student_section = str(
                        student_member[
                            "Section"
                        ]
                    ).strip()


                    draw_text(
                        frame,
                        "Section : "
                        + student_section,
                        x1,
                        max(
                            100,
                            y1 - 30
                        ),
                        color,
                        0.60
                    )


                    # =================================================
                    # RECOGNITION SCORE
                    # =================================================

                    draw_text(
                        frame,
                        "Score : {:.2f}".format(
                            student_score
                        ),
                        x1,
                        y2 + 25,
                        (255, 255, 255),
                        0.60
                    )


                    # =================================================
                    # CONSOLE
                    # =================================================

                    print(
                        "Student Detected :",
                        student_member["Name"],
                        "| ID :",
                        student_member["Student_ID"],
                        "| Section :",
                        student_section,
                        "| Score :",
                        round(
                            student_score,
                            2
                        )
                    )


                    # =================================================
                    # ACTIVE SESSION CHECK
                    # =================================================

                    if is_session_active():

                        session = get_session()


                        session_section = str(
                            session["section"]
                        ).strip()


                        session_subject = str(
                            session["subject"]
                        )


                        session_room = str(
                            session["room"]
                        )


                        session_faculty = str(
                            session["faculty_id"]
                        )


                        # =============================================
                        # SECTION VERIFICATION
                        # =============================================

                        result = verify_section(
                            student_section,
                            session_section
                        )


                        # =============================================
                        # AUTHORIZED STUDENT
                        # =============================================

                        if result["authorized"]:

                            print(
                                "AUTHORIZED STUDENT :",
                                student_member["Name"]
                            )

                            print(
                                "Student Section :",
                                student_section
                            )

                            print(
                                "Class Section :",
                                session_section
                            )


                            # =========================================
                            # MARK ATTENDANCE
                            # =========================================

                            attendance_registered = (
                                mark_attendance(

                                    student_id=str(
                                        student_member[
                                            "Student_ID"
                                        ]
                                    ),

                                    name=str(
                                        student_member[
                                            "Name"
                                        ]
                                    ),

                                    roll_no=str(
                                        student_member[
                                            "Roll_No"
                                        ]
                                    ),

                                    section=student_section,

                                    subject=session_subject,

                                    faculty_id=session_faculty,

                                    room=session_room
                                )
                            )


                            # =========================================
                            # CLASS INFORMATION
                            # =========================================

                            draw_text(
                                frame,
                                "CLASS : "
                                + session_subject,
                                20,
                                215,
                                (0, 255, 0),
                                0.65
                            )


                            draw_text(
                                frame,
                                "ROOM : "
                                + session_room,
                                20,
                                245,
                                (0, 255, 0),
                                0.65
                            )


                            draw_text(
                                frame,
                                "CLASS SECTION : "
                                + session_section,
                                20,
                                275,
                                (0, 255, 0),
                                0.65
                            )


                            draw_text(
                                frame,
                                "STUDENT SECTION : "
                                + student_section,
                                20,
                                305,
                                (0, 255, 0),
                                0.65
                            )


                            # =========================================
                            # ATTENDANCE STATUS
                            # =========================================

                            if attendance_registered:

                                draw_text(
                                    frame,
                                    "STATUS : PRESENT",
                                    20,
                                    335,
                                    (0, 255, 0),
                                    0.75
                                )

                            else:

                                draw_text(
                                    frame,
                                    "STATUS : ALREADY MARKED",
                                    20,
                                    335,
                                    (0, 255, 255),
                                    0.70
                                )


                        # =============================================
                        # WRONG SECTION
                        # =============================================

                        else:

                            print()
                            print(
                                "======================================"
                            )

                            print(
                                "          WRONG SECTION"
                            )

                            print(
                                "======================================"
                            )

                            print(
                                "Student :",
                                student_member["Name"]
                            )

                            print(
                                "Student Section :",
                                student_section
                            )

                            print(
                                "Class Section :",
                                session_section
                            )

                            print(
                                "Subject :",
                                session_subject
                            )

                            print(
                                "Attendance : NOT REGISTERED"
                            )

                            print(
                                "======================================"
                            )

                            print()


                            # =========================================
                            # RED DISPLAY
                            # =========================================

                            draw_text(
                                frame,
                                "CLASS : "
                                + session_subject,
                                20,
                                215,
                                (0, 0, 255),
                                0.65
                            )


                            draw_text(
                                frame,
                                "ROOM : "
                                + session_room,
                                20,
                                245,
                                (0, 0, 255),
                                0.65
                            )


                            draw_text(
                                frame,
                                "CLASS SECTION : "
                                + session_section,
                                20,
                                275,
                                (0, 0, 255),
                                0.65
                            )


                            draw_text(
                                frame,
                                "STUDENT SECTION : "
                                + student_section,
                                20,
                                305,
                                (0, 0, 255),
                                0.65
                            )


                            draw_text(
                                frame,
                                "STATUS : WRONG SECTION",
                                20,
                                335,
                                (0, 0, 255),
                                0.75
                            )


                            draw_text(
                                frame,
                                "ATTENDANCE : NOT REGISTERED",
                                20,
                                365,
                                (0, 0, 255),
                                0.65
                            )


                    # =================================================
                    # NO ACTIVE FACULTY SESSION
                    # =================================================

                    else:

                        # ---------------------------------------------
                        # Check timetable anyway
                        # ---------------------------------------------

                        current_class = (
                            get_current_class(
                                student_section
                            )
                        )


                        # =============================================
                        # FREE HOUR
                        # =============================================

                        if current_class is None:

                            draw_text(
                                frame,
                                "CLASS : NO CLASS SCHEDULED",
                                20,
                                215,
                                (0, 0, 255),
                                0.65
                            )


                            draw_text(
                                frame,
                                "STUDENT SECTION : "
                                + student_section,
                                20,
                                245,
                                (255, 255, 0),
                                0.65
                            )


                            draw_text(
                                frame,
                                "STATUS : FREE HOUR",
                                20,
                                275,
                                (0, 255, 255),
                                0.70
                            )


                            draw_text(
                                frame,
                                "WAITING FOR CLASS SESSION",
                                20,
                                305,
                                (0, 255, 255),
                                0.65
                            )


                            print(
                                "FREE HOUR :",
                                student_member["Name"],
                                "| Section :",
                                student_section
                            )


                        # =============================================
                        # CLASS SCHEDULED BUT FACULTY NOT STARTED
                        # =============================================

                        else:

                            scheduled_subject = str(
                                current_class[
                                    "Subject"
                                ]
                            )

                            scheduled_room = str(
                                current_class[
                                    "Room"
                                ]
                            )

                            scheduled_section = str(
                                current_class[
                                    "Section"
                                ]
                            )

                            scheduled_faculty = str(
                                current_class[
                                    "Faculty_ID"
                                ]
                            )


                            draw_text(
                                frame,
                                "CLASS : "
                                + scheduled_subject,
                                20,
                                215,
                                (0, 255, 255),
                                0.65
                            )


                            draw_text(
                                frame,
                                "ROOM : "
                                + scheduled_room,
                                20,
                                245,
                                (0, 255, 255),
                                0.65
                            )


                            draw_text(
                                frame,
                                "CLASS SECTION : "
                                + scheduled_section,
                                20,
                                275,
                                (0, 255, 255),
                                0.65
                            )


                            draw_text(
                                frame,
                                "FACULTY : "
                                + scheduled_faculty,
                                20,
                                305,
                                (0, 255, 255),
                                0.65
                            )


                            draw_text(
                                frame,
                                "STATUS : WAITING FOR FACULTY",
                                20,
                                335,
                                (0, 255, 255),
                                0.65
                            )


                            print(
                                "CLASS SCHEDULED BUT SESSION NOT STARTED :",
                                student_member["Name"],
                                "|",
                                scheduled_subject
                            )


            # =================================================
            # UNKNOWN FACE
            # =================================================

            else:

                color = (
                    0,
                    0,
                    255
                )


                cv2.rectangle(
                    frame,
                    (x1, y1),
                    (x2, y2),
                    color,
                    2
                )


                draw_text(
                    frame,
                    "UNKNOWN",
                    x1,
                    max(
                        25,
                        y1 - 10
                    ),
                    color,
                    0.70
                )


    # ========================================================
    # HEADER
    # ========================================================

    draw_text(
        frame,
        "SMART CLASSROOM AI",
        20,
        35,
        (255, 255, 255),
        0.90
    )


    draw_text(
        frame,
        "Faculty + Student Detection",
        20,
        65,
        (255, 255, 255),
        0.60
    )


    # ========================================================
    # SESSION INFORMATION
    # ========================================================

    if is_session_active():

        session = get_session()


        draw_text(
            frame,
            "ACTIVE SESSION",
            20,
            405,
            (0, 255, 0),
            0.70
        )


        draw_text(
            frame,
            "SUBJECT : "
            + str(
                session["subject"]
            ),
            20,
            435,
            (0, 255, 0),
            0.60
        )


        draw_text(
            frame,
            "ROOM : "
            + str(
                session["room"]
            ),
            20,
            465,
            (0, 255, 0),
            0.60
        )


        draw_text(
            frame,
            "SECTION : "
            + str(
                session["section"]
            ),
            20,
            495,
            (0, 255, 0),
            0.60
        )


        draw_text(
            frame,
            "FACULTY : "
            + str(
                session["faculty_id"]
            ),
            20,
            525,
            (0, 255, 0),
            0.60
        )


    else:

        draw_text(
            frame,
            "NO ACTIVE SESSION",
            20,
            405,
            (0, 255, 255),
            0.70
        )


        draw_text(
            frame,
            "WAITING FOR FACULTY",
            20,
            435,
            (0, 255, 255),
            0.60
        )


    # ========================================================
    # SHOW CAMERA
    # ========================================================

    cv2.imshow(
        "Smart Classroom AI",
        frame
    )


    # ========================================================
    # QUIT
    # ========================================================

    key = cv2.waitKey(1) & 0xFF


    if key == ord("q"):

        break


# ============================================================
# CLOSE ACTIVE SESSION
# ============================================================

if is_session_active():

    stop_session()


# ============================================================
# RELEASE CAMERA
# ============================================================

cap.release()

cv2.destroyAllWindows()


print()
print(
    "Smart Classroom AI stopped."
)