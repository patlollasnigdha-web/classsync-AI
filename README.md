# Smart Classroom Attendance System

### AI-Powered Face Recognition for Automated Classroom Attendance

An intelligent attendance management system that automates classroom attendance using **face recognition and machine learning**. The system aims to reduce manual effort, improve attendance tracking, and provide a more efficient way to manage classroom records.

---

## 📌 Project Overview

Traditional attendance systems require instructors to spend valuable classroom time recording attendance manually. This project proposes an automated solution that identifies students using facial recognition and supports efficient attendance management.

The system uses computer vision to detect and recognize faces, helping automate the attendance recording process.

## 🎯 Problem Statement

Manual attendance management is time-consuming, repetitive, and prone to human error. Proxy attendance and inaccurate records can also affect the reliability of traditional attendance methods.

The proposed system aims to automate attendance recording through facial recognition, reducing manual intervention and improving the efficiency of classroom attendance management.

## 💡 Objectives

* Automate classroom attendance using face recognition.
* Reduce the time required for manual attendance.
* Minimize errors in attendance recording.
* Maintain organized attendance records.
* Provide a foundation for a smart classroom management system.

## ⚙️ Technologies Used

| Technology       | Purpose                                                     |
| ---------------- | ----------------------------------------------------------- |
| Python           | Core application development                                |
| OpenCV           | Image processing and computer vision                        |
| InsightFace      | Facial analysis and recognition                             |
| NumPy            | Numerical computations                                      |
| Machine Learning | Support intelligent face recognition workflows              |
| React            | Frontend development, if implemented in the current version |
| Node.js and npm  | Frontend development environment                            |

> **Note:** The final technology list should reflect the libraries and frameworks actually used in your implementation.

## 🧠 System Workflow

1. **Face Registration:** Capture student facial images and prepare the data for recognition.
2. **Face Detection:** Detect faces from the input image or camera stream.
3. **Face Analysis:** Extract facial representations using the selected face analysis model.
4. **Face Recognition:** Compare the extracted representation with registered student data.
5. **Attendance Recording:** Record attendance when the recognition result satisfies the configured matching criteria.
6. **Attendance Management:** Maintain attendance records for further review.

## 📂 Project Structure

```text
ML-project/
│
├── smartclassroom/
│   ├── frontend/
│   │   ├── src/
│   │   ├── public/
│   │   └── package.json
│   │
│   ├── scripts/
│   │   └── main.py
│   │
│   └── ...
│
├── .venv/
└── README.md
```

*This is an illustrative structure. Update it to match your actual repository.*

## 🚀 Installation and Setup

### Prerequisites

Install the following:

* Python
* Node.js and npm, if using the React frontend
* Git

### 1. Clone the Repository

```bash
git clone <patlollasnigdha-web/classsync-AI.git>
```

Navigate to the project directory:

```bash
cd ML-project
```

### 2. Create a Python Virtual Environment

```bash
python -m venv .venv
```

Activate it on Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

### 3. Install Python Dependencies

If your repository contains a `requirements.txt` file, run:

```bash
pip install -r requirements.txt
```

Otherwise, install the dependencies listed in your project's actual Python imports and configuration files.

### 4. Start the Application

Navigate to the Smart Classroom directory:

```bash
cd smartclassroom
```

Run the Python application:

```bash
python scripts/main.py
```

**Important:** Run this command only if `scripts/main.py` is the correct application entry point in your current project.

### 5. Run the Frontend

Open a separate terminal:

```bash
cd smartclassroom/frontend
npm install
npm run dev
```

Use the local URL printed in the terminal to access the frontend.

*The frontend commands assume that your `package.json` defines a compatible `dev` script.*

## 📊 Expected Outcomes

* Automated face-based attendance recording.
* Reduced dependence on manual attendance.
* Organized student attendance records.
* Faster attendance management.
* A foundation for future smart classroom features.

Actual performance depends on the implementation, dataset quality, lighting conditions, camera quality, and recognition threshold.

## 🔮 Future Enhancements

* Real-time classroom attendance monitoring.
* Student and faculty authentication.
* Attendance history and report generation.
* Integration with classroom management platforms.
* Improved recognition under different lighting conditions.
* Dashboard analytics and attendance summaries.
* Secure storage and management of student facial data.

## 🔐 Privacy and Security

Facial data is sensitive biometric information. A production deployment should use appropriate access controls, secure storage, data minimization, and consent procedures. Facial data should be retained only as necessary and in accordance with applicable institutional policies and laws.

## 👥 Team

**Project:** Smart Classroom Attendance System
**Domain:** Machine Learning and Computer Vision
**Institution:** KLH university
**Department:** CSE


## 📚 References

1. **ArcFace: Additive Angular Margin Loss for Deep Face Recognition**
   Authors: Jiankang Deng et al.
   CVPR, 2019.
   https://arxiv.org/abs/1801.07698

2. **InsightFace: 2D and 3D Face Analysis Project**
   Official GitHub Repository.
   https://github.com/deepinsight/insightface

3. **OpenCV: Open Source Computer Vision Library**
   Official Documentation.
   https://opencv.org/

4. **Deep Face Recognition**
   Authors: Florian Schroff, Dmitry Kalenichenko, and James Philbin.
   CVPR, 2015.
   https://arxiv.org/abs/1503.03832

5. **FaceNet: A Unified Embedding for Face Recognition and Clustering**
   Authors: Florian Schroff, Dmitry Kalenichenko, and James Philbin.
   CVPR, 2015.
   https://arxiv.org/abs/1503.03832

6. **A Decision-Theoretic Generalization of On-Line Learning and an Application to Boosting**
   Author: Yoav Freund and Robert E. Schapire.
   Journal of Computer and System Sciences, 1997.
   https://doi.org/10.1006/jcss.1997.1504

7. **NumPy: The Fundamental Package for Scientific Computing in Python**
   Official Documentation.
   https://numpy.org/


**Smart Classroom Attendance System — Making classroom attendance smarter through machine learning and computer vision.**
