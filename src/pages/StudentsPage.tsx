import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Users, CheckCircle, Upload, AlertCircle } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Dialog } from '../components/ui/Dialog';
import { api, StudentRecord } from '../services/api';

export const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState('all');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form fields
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [section, setSection] = useState('CSE-A');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await api.getStudents(searchQuery, sectionFilter);
      setStudents(data.students || []);
      setTotalCount(data.total_registered || 0);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [searchQuery, sectionFilter]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!studentId.trim() || !name.trim() || !rollNo.trim() || !section.trim()) {
      setFormError('Please fill in all required student details.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('student_id', studentId.trim());
      formData.append('name', name.trim());
      formData.append('roll_no', rollNo.trim());
      formData.append('section', section.trim().toUpperCase());
      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      await api.createStudent(formData);
      setIsAddModalOpen(false);
      resetForm();
      fetchStudents();
    } catch (err: any) {
      setFormError(err.message || 'Failed to register student.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStudentId('');
    setName('');
    setRollNo('');
    setSection('CSE-A');
    setSelectedFile(null);
    setFormError(null);
  };

  return (
    <div>
      <Header
        title="Student Directory"
        subtitle="Manage student registrations and face embeddings."
        actions={
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <UserPlus size={15} />
            <span>Add Student</span>
          </button>
        }
      />

      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Filters and Search Bar */}
        <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 260 }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-secondary)' }} />
              <input
                type="text"
                className="input"
                style={{ paddingLeft: 36 }}
                placeholder="Search by student name, ID or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="select"
              style={{ width: 140 }}
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
            >
              <option value="all">All Sections</option>
              <option value="CSE-A">CSE-A</option>
              <option value="CSE-B">CSE-B</option>
            </select>
          </div>

          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Showing <strong>{students.length}</strong> of <strong>{totalCount}</strong> students
          </div>
        </div>

        {/* Students Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <LoadingSpinner label="Fetching student directory..." />
          ) : students.length > 0 ? (
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Student Name</th>
                    <th>Roll Number</th>
                    <th>Section</th>
                    <th>Face Registration Status</th>
                    <th>Embeddings Count</th>
                    <th>Attendance Records</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((st) => (
                    <tr key={st.student_id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{st.student_id}</td>
                      <td style={{ fontWeight: 600 }}>{st.name}</td>
                      <td>{st.roll_no}</td>
                      <td>{st.section}</td>
                      <td>
                        <StatusBadge status={st.registration_status} />
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {st.embeddings_count} face vector(s)
                      </td>
                      <td style={{ fontWeight: 500 }}>
                        {st.attendance_count} session(s)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No students found"
              description="No student records match your filter criteria or search query."
              action={
                <button className="btn btn-secondary" onClick={() => { setSearchQuery(''); setSectionFilter('all'); }}>
                  Clear Search Filters
                </button>
              }
            />
          )}
        </div>
      </div>

      {/* Add Student Dialog Modal */}
      <Dialog
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); resetForm(); }}
        title="Register New Student"
        subtitle="Add student details and upload face image for embedding generation."
      >
        <form onSubmit={handleCreateStudent} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {formError && (
            <div style={{ padding: 10, backgroundColor: '#FDF2F2', border: '1px solid #F8D7DA', borderRadius: 6, color: 'var(--danger)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="label">Student ID *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. S004"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Student Full Name *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">Roll Number *</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. 2510030195"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Section *</label>
              <select className="select" value={section} onChange={(e) => setSection(e.target.value)}>
                <option value="CSE-A">CSE-A</option>
                <option value="CSE-B">CSE-B</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Face Image (Optional for AI Embedding)</label>
            <input
              type="file"
              accept="image/*"
              className="input"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, display: 'block' }}>
              InsightFace model will extract 512-d embeddings automatically upon submission.
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => { setIsAddModalOpen(false); resetForm(); }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Registering...' : 'Save & Register Student'}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
