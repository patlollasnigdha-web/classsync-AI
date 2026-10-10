import cv2
import numpy as np
import pickle
import pandas as pd
import warnings
from insightface.app import FaceAnalysis
from attendance import mark_attendance
from pathlib import Path

warnings.filterwarnings("ignore")

BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_DIR = BASE_DIR / "dataset"
EMBEDDINGS_DIR = BASE_DIR / "embeddings"
# ==========================================
# Load Student Details
# ==========================================
pd.read_csv(DATASET_DIR / "students.csv")
students["Student_ID"] = students["Student_ID"].astype(str)

# ==========================================
# Load Student Embeddings
# ==========================================
with open(EMBEDDINGS_DIR / "embeddings.pkl", "rb") as f:
    database = pickle.load(f)

print("\n========== STUDENT DATABASE ==========")
print("Embedding Keys :", list(database.keys()))
print(students)
print("======================================\n")

# ==========================================
# Initialize InsightFace
# ==========================================

app = FaceAnalysis(
    name="buffalo_l",
    providers=["CPUExecutionProvider"]
)

app.prepare(ctx_id=0)

# ==========================================
# Open Webcam
# ==========================================

cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Cannot open webcam.")
    exit()

print("Press Q to Quit")

# ==========================================
# Recognition Loop
# ==========================================

while True:

    ret, frame = cap.read()

    if not ret:
        break

    faces = app.get(frame)

    for face in faces:

        x1, y1, x2, y2 = face.bbox.astype(int)

        embedding = face.embedding

        best_match = "Unknown"
        best_score = -1

        # ==========================================
        # Compare Embeddings
        # ==========================================

        for student_id, stored_embeddings in database.items():

            if len(stored_embeddings) == 0:
                continue

            for stored_embedding in stored_embeddings:

                stored_embedding = np.array(stored_embedding).flatten()

                similarity = np.dot(
                    embedding,
                    stored_embedding
                ) / (
                    np.linalg.norm(embedding)
                    * np.linalg.norm(stored_embedding)
                )

                if similarity > best_score:
                    best_score = similarity
                    best_match = student_id

        # ==========================================
        # Recognition Threshold
        # ==========================================

        if best_score < 0.50:
            best_match = "Unknown"

        color = (0, 255, 0)

        if best_match == "Unknown":
            color = (0, 0, 255)

        cv2.rectangle(
            frame,
            (x1, y1),
            (x2, y2),
            color,
            2
        )

        # ==========================================
        # Unknown Person
        # ==========================================

        if best_match == "Unknown":

            cv2.putText(
                frame,
                "Unknown",
                (x1, y1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                color,
                2
            )

        else:

            student = students[
                students["Student_ID"] == str(best_match)
            ]

            if not student.empty:

                student = student.iloc[0]

                try:
                    mark_attendance(student)
                except Exception as e:
                    print("Attendance Error:", e)

                cv2.putText(
                    frame,
                    student["Name"],
                    (x1, y1 - 60),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    color,
                    2
                )

                cv2.putText(
                    frame,
                    "ID : " + str(student["Student_ID"]),
                    (x1, y1 - 40),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    color,
                    2
                )

                cv2.putText(
                    frame,
                    "Roll : " + str(student["Roll_No"]),
                    (x1, y1 - 20),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    color,
                    2
                )

                cv2.putText(
                    frame,
                    "Section : " + str(student["Section"]),
                    (x1, y2 + 25),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (255, 255, 0),
                    2
                )

        cv2.putText(
            frame,
            "Score : {:.2f}".format(best_score),
            (x1, y2 + 50),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (255, 255, 255),
            2
        )

    cv2.imshow("Student Recognition", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()