import pandas as pd
from datetime import datetime
from pathlib import Path


# ============================================================
# PROJECT PATH
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

schedule_file = BASE_DIR / "dataset" / "class_schedule.csv"


# ============================================================
# LOAD SCHEDULE
# ============================================================

schedule = pd.read_csv(
    schedule_file
)


# Clean columns

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

schedule["Section"] = (
    schedule["Section"]
    .astype(str)
    .str.strip()
)


# ============================================================
# SESSION
# ============================================================

SESSION = {
    "active": False,
    "faculty_id": None,
    "subject": None,
    "section": None,
    "room": None
}


# ============================================================
# START SESSION
# ============================================================

def start_session(faculty):

    # --------------------------------------------------------
    # IMPORTANT
    # If a session is already active, don't try again.
    # --------------------------------------------------------

    if SESSION["active"]:

        return True


    current_day = datetime.now().strftime(
        "%A"
    )

    current_time = datetime.now().strftime(
        "%H:%M"
    )


    faculty_id = str(
        faculty["Faculty_ID"]
    ).strip()


    # --------------------------------------------------------
    # FIND FACULTY'S CLASSES TODAY
    # --------------------------------------------------------

    rows = schedule[
        (schedule["Faculty_ID"] == faculty_id)
        &
        (schedule["Day"] == current_day)
    ]


    # --------------------------------------------------------
    # CHECK CURRENT TIME
    # --------------------------------------------------------

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

            # ================================================
            # START SESSION
            # ================================================

            SESSION["active"] = True

            SESSION["faculty_id"] = (
                str(row["Faculty_ID"])
            )

            SESSION["subject"] = (
                str(row["Subject"])
            )

            SESSION["section"] = (
                str(row["Section"])
            )

            SESSION["room"] = (
                str(row["Room"])
            )


            print()
            print(
                "======================================"
            )

            print(
                "          SESSION STARTED"
            )

            print(
                "======================================"
            )

            print(
                "Faculty :",
                SESSION["faculty_id"]
            )

            print(
                "Subject :",
                SESSION["subject"]
            )

            print(
                "Section :",
                SESSION["section"]
            )

            print(
                "Room    :",
                SESSION["room"]
            )

            print(
                "======================================"
            )

            print()


            return True


    # --------------------------------------------------------
    # NO CLASS
    # --------------------------------------------------------

    return False


# ============================================================
# STOP SESSION
# ============================================================

def stop_session():

    if not SESSION["active"]:

        return


    print()
    print(
        "======================================"
    )

    print(
        "          SESSION CLOSED"
    )

    print(
        "======================================"
    )


    SESSION["active"] = False

    SESSION["faculty_id"] = None
    SESSION["subject"] = None
    SESSION["section"] = None
    SESSION["room"] = None


# ============================================================
# CHECK SESSION
# ============================================================

def is_session_active():

    return SESSION["active"]


# ============================================================
# GET SESSION
# ============================================================

def get_session():

    return SESSION