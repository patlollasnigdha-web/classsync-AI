import os
import pandas as pd
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
ATTENDANCE_FILE = BASE_DIR / "dataset" / "faculty_attendance.csv"



def mark_faculty_attendance(faculty):

    if not os.path.exists(ATTENDANCE_FILE):

        df = pd.DataFrame(columns=[
            "Faculty_ID",
            "Name",
            "Subject",
            "Section",
            "Room",
            "Date",
            "Time"
        ])

        df.to_csv(ATTENDANCE_FILE, index=False)

    df = pd.read_csv(ATTENDANCE_FILE)

    today = datetime.now().strftime("%Y-%m-%d")

    faculty_id = faculty["Faculty_ID"]

    already_marked = df[
        (df["Faculty_ID"] == faculty_id) &
        (df["Date"] == today)
    ]

    if already_marked.empty:

        new_row = {
            "Faculty_ID": faculty["Faculty_ID"],
            "Name": faculty["Name"],
            "Subject": faculty["Subject"],
            "Section": faculty["Section"],
            "Room": faculty["Room"],
            "Date": today,
            "Time": datetime.now().strftime("%H:%M:%S")
        }

        df.loc[len(df)] = new_row

        df.to_csv(ATTENDANCE_FILE, index=False)

        print(f"Faculty Attendance Marked : {faculty['Name']}")