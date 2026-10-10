import os
import cv2
import pickle
from insightface.app import FaceAnalysis
from pathlib import Path
# ============================================
# Initialize InsightFace
# ============================================

app = FaceAnalysis(
    name="buffalo_l",
    providers=["CPUExecutionProvider"]
)

app.prepare(ctx_id=0)

# ============================================
# Paths
# ============================================

BASE_DIR = Path(__file__).resolve().parent.parent

dataset_path = BASE_DIR / "dataset" / "faculty"
save_path = BASE_DIR / "embeddings" / "faculty_embeddings.pkl"

faculty_embeddings = {}

print("=" * 50)
print("Generating Faculty Face Embeddings...")
print("=" * 50)

# ============================================
# Loop through Faculty folders
# ============================================

for faculty_id in os.listdir(dataset_path):

    faculty_folder = os.path.join(dataset_path, faculty_id)

    if not os.path.isdir(faculty_folder):
        continue

    print(f"\nFaculty : {faculty_id}")

    faculty_embeddings[faculty_id] = []

    for image_name in os.listdir(faculty_folder):

        image_path = os.path.join(faculty_folder, image_name)

        image = cv2.imread(image_path)

        if image is None:
            print(f"Cannot read {image_name}")
            continue

        faces = app.get(image)

        if len(faces) == 0:
            print(f"No face detected in {image_name}")
            continue

        embedding = faces[0].embedding

        faculty_embeddings[faculty_id].append(embedding)

        print(f"Processed : {image_name}")

# ============================================
# Save Embeddings
# ============================================

os.makedirs("embeddings", exist_ok=True)

with open(save_path, "wb") as f:
    pickle.dump(faculty_embeddings, f)

print("\nFaculty Embeddings Saved Successfully!")

print("\nSummary")

for faculty_id, embeddings in faculty_embeddings.items():
    print(f"{faculty_id} : {len(embeddings)} embeddings")