import os
import cv2
import pickle
from insightface.app import FaceAnalysis

# Initialize InsightFace
app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
app.prepare(ctx_id=0)

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

DATASET_PATH = BASE_DIR / "dataset" / "students"
OUTPUT_PATH = BASE_DIR / "embeddings" / "embeddings.pkl"

database = {}

print("=" * 50)
print("Generating Face Embeddings...")
print("=" * 50)

for student_id in os.listdir(DATASET_PATH):

    student_folder = os.path.join(DATASET_PATH, student_id)

    if not os.path.isdir(student_folder):
        continue

    embeddings = []

    print(f"\nStudent : {student_id}")

    for image_name in os.listdir(student_folder):

        image_path = os.path.join(student_folder, image_name)

        image = cv2.imread(image_path)

        if image is None:
            print(f"Cannot read {image_name}")
            continue

        faces = app.get(image)

        if len(faces) == 0:
            print(f"No face detected : {image_name}")
            continue

        embeddings.append(faces[0].embedding)

        print(f"Processed : {image_name}")

    database[student_id] = embeddings

os.makedirs("embeddings", exist_ok=True)

with open(OUTPUT_PATH, "wb") as f:
    pickle.dump(database, f)

print("\nEmbeddings Saved Successfully!")

print("\nSummary")

for sid in database:
    print(sid, ":", len(database[sid]), "embeddings")