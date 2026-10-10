import cv2
import os

student_id = input("Enter Student ID: ")

save_folder = os.path.join("dataset", "students", student_id)
os.makedirs(save_folder, exist_ok=True)

face_cascade = cv2.CascadeClassifier(
    "models/haarcascade_frontalface_default.xml"
)

cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)

count = 0

print("Press Q to quit")

while True:

    ret, frame = cap.read()

    if not ret:
        break

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5
    )

    for (x, y, w, h) in faces:

        face = frame[y:y+h, x:x+w]

        face = cv2.resize(face, (160, 160))

        count += 1

        filename = os.path.join(
            save_folder,
            f"{count:03}.jpg"
        )

        cv2.imwrite(filename, face)

        cv2.rectangle(
            frame,
            (x, y),
            (x+w, y+h),
            (0,255,0),
            2
        )

        cv2.putText(
            frame,
            f"Images: {count}/50",
            (10,30),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0,255,0),
            2
        )

    cv2.imshow("Student Registration", frame)

    if count >= 50:
        print("Registration Complete!")
        break

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()