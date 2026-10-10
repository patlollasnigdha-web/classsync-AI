import React, { useState, useEffect } from 'react';
import { Download, Search, Calendar, Filter, RefreshCw } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { api, AttendanceRecord } from '../services/api';

export const AttendanceRecordsPage: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await api.getAttendanceRecords({
        search,
        date: dateFilter,
        section: sectionFilter,
        status: statusFilter
      });
      setRecords(data.records || []);
    } catch (err) {
      console.error('Failed to fetch attendance history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [search, dateFilter, sectionFilter, statusFilter]);

  const handleExportCSV = () => {
    const exportUrl = api.getExportUrl(dateFilter, sectionFilter);
    window.open(exportUrl, '_blank');
  };

  return (
    <div>
      <Header
        title="Attendance History"
        subtitle="Complete log of student attendance records processed by face recognition."
        actions={
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        }
      />

      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Filters Card */}
        <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: 36 }}
              placeholder="Search student, ID, subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={15} style={{ color: 'var(--text-secondary)' }} />
            <input
              type="date"
              className="input"
              style={{ width: 150 }}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>

          <select
            className="select"
            style={{ width: 130 }}
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
          >
            <option value="all">All Sections</option>
            <option value="CSE-A">CSE-A</option>
            <option value="CSE-B">CSE-B</option>
          </select>

          <select
            className="select"
            style={{ width: 130 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
          </select>

          {(search || dateFilter || sectionFilter !== 'all' || statusFilter !== 'all') && (
            <button
              className="btn btn-secondary"
              style={{ fontSize: 12 }}
              onClick={() => {
                setSearch('');
                setDateFilter('');
                setSectionFilter('all');
                setStatusFilter('all');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Table Card */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              Historical Attendance Records ({records.length})
            </span>
            <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={fetchRecords} title="Refresh records">
              <RefreshCw size={13} />
            </button>
          </div>

          {loading ? (
            <LoadingSpinner label="Loading attendance logs..." />
          ) : records.length > 0 ? (
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Student ID</th>
                    <th>Student Name</th>
                    <th>Roll Number</th>
                    <th>Section</th>
                    <th>Subject</th>
                    <th>Faculty ID</th>
                    <th>Classroom</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {rec.date} {rec.time}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{rec.student_id}</td>
                      <td style={{ fontWeight: 600 }}>{rec.name}</td>
                      <td>{rec.roll_no}</td>
                      <td>{rec.section}</td>
                      <td>{rec.subject}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{rec.faculty_id}</td>
                      <td>{rec.room}</td>
                      <td>
                        <StatusBadge status={rec.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No attendance records match your filters"
              description="Try selecting a different date, section or clear the search criteria."
            />
          )}
        </div>
      </div>
    </div>
  );
};
