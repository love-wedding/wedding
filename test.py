
import cv2
import pytesseract
import numpy as np

# Load Haar Cascade
plate_cascade = cv2.CascadeClassifier(
    "haarcascade_russian_plate_number.xml"
)

cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()

    if not ret:
        break

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    plates = plate_cascade.detectMultiScale(
        gray, 1.1, 4
    )

    for (x, y, w, h) in plates:
        plate_img = frame[y:y+h, x:x+w]

        plate_gray = cv2.cvtColor(
            plate_img, cv2.COLOR_BGR2GRAY
        )

        _, thresh = cv2.threshold(
            plate_gray, 0, 255,
            cv2.THRESH_BINARY + cv2.THRESH_OTSU
        )

        number = pytesseract.image_to_string(
            thresh,
            config='--psm 7'
        )

        number = number.strip()

        if number:
            print(f"Number Plate: {number}")

            cv2.rectangle(
                frame, (x, y), (x+w, y+h),
                (0, 255, 0), 2
            )

            cv2.putText(
                frame, number, (x, y-10),
                cv2.FONT_HERSHEY_SIMPLEX, 1,
                (0, 255, 0), 2
            )

    cv2.imshow('Number Plate Recognition', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
