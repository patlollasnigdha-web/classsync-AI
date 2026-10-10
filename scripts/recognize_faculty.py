import cv2
import numpy as np
import pickle
import pandas as pd
import warnings
from insightface.app import FaceAnalysis
from faculty_attendance import mark_faculty_attendance
from session_manager import start_session

warnings.filterwarnings("ignore")

BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_DIR = BASE_DIR / "dataset"
EMBEDDINGS_DIR = BASE_DIR / "embeddings"
# ==========================================
# Load Faculty Details
# ==========================================
faculty = pd.read_csv(DATASET_DIR / "faculty.csv")
faculty["Faculty_ID"] = faculty["Faculty_ID"].astype(str)

# ==========================================
# Load Faculty Embeddings
# ==========================================
with open(EMBEDDINGS_DIR / "faculty_embeddings.pkl", "rb") as f:
    database = pickle.load(f)

print("\n========== FACULTY DATABASE ==========")
print("Embedding Keys :", list(database.keys()))
print(faculty)
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

        for faculty_id, stored_embeddings in database.items():

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
                    best_match = faculty_id

        # ==========================================
        # Recognition Threshold
        # ==========================================

        if best_score < 0.50:
            best_match = "Unknown"

        # Rectangle Color
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

            faculty_member = faculty[
                faculty["Faculty_ID"] == str(best_match)
            ]

            if not faculty_member.empty:

                faculty_member = faculty_member.iloc[0]

                # Mark Faculty Attendance
                try:
                    mark_faculty_attendance(faculty_member)
                    start_session(faculty_member)
                except Exception as e:
                    print("Faculty Attendance Error:", e)

                # Display Name
                cv2.putText(
                    frame,
                    faculty_member["Name"],
                    (x1, y1 - 100),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    color,
                    2
                )

                # Faculty ID
                cv2.putText(
                    frame,
                    "Faculty ID : " + str(faculty_member["Faculty_ID"]),
                    (x1, y1 - 75),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    color,
                    2
                )

                # Subject
                cv2.putText(
                    frame,
                    "Subject : " + str(faculty_member["Subject"]),
                    (x1, y1 - 50),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    color,
                    2
                )

                # Section
                cv2.putText(
                    frame,
                    "Section : " + str(faculty_member["Section"]),
                    (x1, y1 - 25),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    color,
                    2
                )

                # Room
                cv2.putText(
                    frame,
                    "Room : " + str(faculty_member["Room"]),
                    (x1, y2 + 25),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (255, 255, 0),
                    2
                )

        # Similarity Score
        cv2.putText(
            frame,
            "Score : {:.2f}".format(best_score),
            (x1, y2 + 50),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (255, 255, 255),
            2
        )

    cv2.imshow("Faculty Recognition", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()