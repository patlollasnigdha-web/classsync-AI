import cv2

model_path = "models/face_detection_yunet_2023mar.onnx"

detector = cv2.FaceDetectorYN.create(
    model=model_path,
    config="",
    input_size=(320, 320),
    score_threshold=0.6,
    nms_threshold=0.3,
    top_k=5000
)

cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)

print("Press Q to quit")

while True:

    ret, frame = cap.read()

    if not ret:
        break

    h, w = frame.shape[:2]

    detector.setInputSize((w, h))

    # Convert BGR → RGB
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    _, faces = detector.detect(rgb)

    print(faces)

    if faces is not None:

        for face in faces:

            x, y, width, height = face[:4].astype(int)

            cv2.rectangle(
                frame,
                (x, y),
                (x + width, y + height),
                (0, 255, 0),
                2
            )

    cv2.imshow("Face Detection", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()