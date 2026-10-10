// Central API Client for ClassSync AI Backend

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface SystemStatus {
  status: string;
  service_name: string;
  version: string;
  model_status: {
    loaded: boolean;
    model_name: string;
    error: string | null;
  };
  dataset_status: {
    registered_students: number;
    student_embeddings: number;
    faculty_embeddings: number;
    total_attendance_records: number;
  };
  active_session: {
    active: boolean;
    faculty_id: string | null;
    subject: string | null;
    section: string | null;
    room: string | null;
  };
}

export interface DashboardStats {
  registered_students: number;
  students_present_today: number;
  students_absent_today: number;
  attendance_rate: number;
  date: string;
  recent_activity: AttendanceRecord[];
  daily_trend: {
    date: string;
    present: number;
    total: number;
    rate: number;
  }[];
  class_wise: {
    section: string;
    total: number;
    present: number;
    absent: number;
    rate: number;
  }[];
}

export interface StudentRecord {
  student_id: string;
  name: string;
  roll_no: string;
  section: string;
  registration_status: string;
  embeddings_count: number;
  attendance_count: number;
}

export interface ClassInfo {
  section: string;
  student_count: number;
  schedules: {
    subject: string;
    faculty_id: string;
    faculty_name: string;
    room: string;
    day: string;
    start_time: string;
    end_time: string;
  }[];
  today_attendance_count: number;
}

export interface AttendanceRecord {
  student_id: string;
  name: string;
  roll_no: string;
  section: string;
  date: string;
  time: string;
  subject: string;
  faculty_id: string;
  room: string;
  status: string;
}

export interface RecognitionResult {
  type: 'faculty' | 'student' | 'unknown';
  bbox: [number, number, number, number];
  person_id: string;
  name: string;
  roll_no?: string;
  section?: string;
  score: number;
  status: string;
  message: string;
  attendance_marked: boolean;
}

export interface FrameRecognitionResponse {
  faces_count: number;
  results: RecognitionResult[];
  active_session: {
    active: boolean;
    faculty_id: string | null;
    subject: string | null;
    section: string | null;
    room: string | null;
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `Server error ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.detail) {
        errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
      }
    } catch {
      // Ignore JSON parse error
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

export const api = {
  // System Status
  async getStatus(): Promise<SystemStatus> {
    const res = await fetch(`${API_BASE_URL}/status`);
    return handleResponse<SystemStatus>(res);
  },

  // Dashboard Stats
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE_URL}/dashboard/stats`);
    return handleResponse<DashboardStats>(res);
  },

  // Students Management
  async getStudents(search?: string, section?: string): Promise<{ count: number; total_registered: number; students: StudentRecord[] }> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (section && section !== 'all') params.append('section', section);
    
    const url = `${API_BASE_URL}/students${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  async createStudent(formData: FormData): Promise<{ success: boolean; message: string; image_saved: boolean; embedding_generated: boolean }> {
    const res = await fetch(`${API_BASE_URL}/students`, {
      method: 'POST',
      body: formData
    });
    return handleResponse(res);
  },

  // Classes
  async getClasses(): Promise<{ count: number; classes: ClassInfo[] }> {
    const res = await fetch(`${API_BASE_URL}/classes`);
    return handleResponse(res);
  },

  // Attendance Records
  async getAttendanceRecords(filters?: {
    date?: string;
    section?: string;
    student_id?: string;
    search?: string;
    status?: string;
  }): Promise<{ count: number; records: AttendanceRecord[] }> {
    const params = new URLSearchParams();
    if (filters?.date) params.append('date', filters.date);
    if (filters?.section && filters.section !== 'all') params.append('section', filters.section);
    if (filters?.student_id) params.append('student_id', filters.student_id);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);

    const url = `${API_BASE_URL}/attendance${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  getExportUrl(date?: string, section?: string): string {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (section && section !== 'all') params.append('section', section);
    return `${API_BASE_URL}/attendance/export${params.toString() ? `?${params.toString()}` : ''}`;
  },

  // Attendance Session
  async getSessionInfo(): Promise<{ session: any; faculty_name: string | null }> {
    const res = await fetch(`${API_BASE_URL}/attendance/session`);
    return handleResponse(res);
  },

  async startSession(facultyId: string): Promise<{ success: boolean; message: string; session: any }> {
    const res = await fetch(`${API_BASE_URL}/attendance/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ faculty_id: facultyId })
    });
    return handleResponse(res);
  },

  async stopSession(): Promise<{ success: boolean; message: string; session: any }> {
    const res = await fetch(`${API_BASE_URL}/attendance/session/stop`, {
      method: 'POST'
    });
    return handleResponse(res);
  },

  // ML Frame Recognition
  async recognizeFrame(imageData: string): Promise<FrameRecognitionResponse> {
    const body = new URLSearchParams();
    body.append('image_data', imageData);

    const res = await fetch(`${API_BASE_URL}/attendance/recognize-frame`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });
    return handleResponse(res);
  },

  async recognizeFile(file: File): Promise<FrameRecognitionResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/attendance/recognize-frame`, {
      method: 'POST',
      body: formData
    });
    return handleResponse(res);
  },

  // Analytics
  async getAnalytics(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/analytics`);
    return handleResponse(res);
  }
};
