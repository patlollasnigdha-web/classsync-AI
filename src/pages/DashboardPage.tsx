import React, { useEffect, useState } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Percent, 
  Play, 
  ArrowRight, 
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { MetricCard } from '../components/ui/MetricCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { api, DashboardStats } from '../services/api';
import { NavTab } from '../components/layout/Sidebar';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';

interface DashboardPageProps {
  onNavigate: (tab: NavTab) => void;
  isConnected: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, isConnected }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle="Classroom attendance overview."
        actions={
          <button 
            className="btn btn-primary"
            onClick={() => onNavigate('live-attendance')}
          >
            <Play size={15} />
            <span>Start Attendance</span>
          </button>
        }
      />

      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Connection Error Banner */}
        {!isConnected && (
          <div style={{
            backgroundColor: '#FDF2F2',
            border: '1px solid #F8D7DA',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: 'var(--danger)',
            fontSize: 13
          }}>
            <AlertCircle size={18} />
            <span>
              Backend server is disconnected. Please ensure the Python FastAPI backend is running at <code>http://127.0.0.1:8000</code>.
            </span>
          </div>
        )}

        {/* Overview Metrics */}
        <div className="grid-4">
          <MetricCard
            title="Registered Students"
            value={stats ? stats.registered_students : '—'}
            subtitle="Total in database"
            icon={<Users size={18} />}
            loading={loading}
          />
          <MetricCard
            title="Students Present Today"
            value={stats ? stats.students_present_today : '—'}
            subtitle={`Date: ${stats ? stats.date : 'Today'}`}
            icon={<UserCheck size={18} />}
            badge={<StatusBadge status="present" />}
            loading={loading}
          />
          <MetricCard
            title="Students Absent Today"
            value={stats ? stats.students_absent_today : '—'}
            subtitle="Unmarked or absent"
            icon={<UserX size={18} />}
            badge={<StatusBadge status="absent" />}
            loading={loading}
          />
          <MetricCard
            title="Attendance Rate"
            value={stats ? `${stats.attendance_rate}%` : '—'}
            subtitle="Overall classroom rate"
            icon={<Percent size={18} />}
            loading={loading}
          />
        </div>

        {/* Charts & Analytics Section */}
        <div className="grid-2">
          {/* Attendance Trend Chart */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 className="card-title">Attendance Trend</h3>
                <p className="card-subtitle">Daily present count over recent dates</p>
              </div>
              <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
            </div>

            {loading ? (
              <LoadingSpinner label="Loading trend data..." />
            ) : stats && stats.daily_trend && stats.daily_trend.length > 0 ? (
              <div style={{ height: 220, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.daily_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#52745B" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#52745B" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#777C74' }} stroke="#E6E7E1" />
                    <YAxis tick={{ fontSize: 11, fill: '#777C74' }} stroke="#E6E7E1" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E6E7E1', borderRadius: 6, fontSize: 12 }}
                    />
                    <Area type="monotone" dataKey="present" stroke="#52745B" strokeWidth={2} fillOpacity={1} fill="url(#colorPresent)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState title="No trend data available" description="Attendance trends will appear as classroom sessions are conducted." />
            )}
          </div>

          {/* Section Attendance Comparison */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 className="card-title">Section Comparison</h3>
                <p className="card-subtitle">Attendance rate by classroom section</p>
              </div>
            </div>

            {loading ? (
              <LoadingSpinner label="Loading section data..." />
            ) : stats && stats.class_wise && stats.class_wise.length > 0 ? (
              <div style={{ height: 220, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.class_wise} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="section" tick={{ fontSize: 11, fill: '#777C74' }} stroke="#E6E7E1" />
                    <YAxis tick={{ fontSize: 11, fill: '#777C74' }} stroke="#E6E7E1" unit="%" />
                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E6E7E1', borderRadius: 6, fontSize: 12 }} />
                    <Bar dataKey="rate" fill="#52745B" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState title="No section data" description="No section attendance recorded today." />
            )}
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <h3 className="card-title">Recent Attendance Activity</h3>
              <p className="card-subtitle">Latest attendance entries verified by face recognition</p>
            </div>
            <button 
              className="btn btn-secondary" 
              style={{ fontSize: 12, padding: '4px 10px' }}
              onClick={() => onNavigate('records')}
            >
              <span>View All Records</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {loading ? (
            <LoadingSpinner label="Fetching records..." />
          ) : stats && stats.recent_activity && stats.recent_activity.length > 0 ? (
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Student ID</th>
                    <th>Roll No</th>
                    <th>Section</th>
                    <th>Subject</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_activity.map((rec, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{rec.name}</td>
                      <td style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{rec.student_id}</td>
                      <td>{rec.roll_no}</td>
                      <td>{rec.section}</td>
                      <td>{rec.subject}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{rec.date} {rec.time}</td>
                      <td><StatusBadge status={rec.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No attendance recorded today"
              description="Start a live classroom session to record student attendance automatically."
              action={
                <button className="btn btn-primary" onClick={() => onNavigate('live-attendance')}>
                  <Play size={14} />
                  <span>Launch Live Attendance Workspace</span>
                </button>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};
