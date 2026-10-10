# ==========================================
# SECTION VERIFICATION
# ==========================================

def verify_section(student_section, class_section):

    student_section = str(
        student_section
    ).strip().upper()

    class_section = str(
        class_section
    ).strip().upper()


    # ======================================
    # SECTION MATCH
    # ======================================

    if student_section == class_section:

        return {
            "authorized": True,
            "status": "AUTHORIZED",
            "message": "Student belongs to this section."
        }


    # ======================================
    # SECTION MISMATCH
    # ======================================

    return {
        "authorized": False,
        "status": "WRONG_SECTION",
        "message": (
            "Student does not belong to this section."
        )
    }