import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, PieChart as PieIcon, Download } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { MetricCard } from '../components/ui/MetricCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { api } from '../services/api';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.getAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const COLORS = ['#52745B', '#A87932', '#B84E49', '#777C74'];

  return (
    <div>
      <Header
        title="Analytics & Reports"
        subtitle="Automated intelligence, attendance trends, and section distribution analytics."
        actions={
          <button className="btn btn-secondary" onClick={() => window.open(api.getExportUrl(), '_blank')}>
            <Download size={15} />
            <span>Download Analytics CSV</span>
          </button>
        }
      />

      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {loading ? (
          <LoadingSpinner label="Computing classroom analytics..." />
        ) : data ? (
          <>
            <div className="grid-3">
              <MetricCard
                title="Total System Students"
                value={data.total_students || 0}
                subtitle="Enrolled dataset size"
                icon={<Users size={18} />}
              />
              <MetricCard
                title="Total Attendance Sessions"
                value={data.total_records || 0}
                subtitle="Historical attendance logs"
                icon={<BarChart3 size={18} />}
              />
              <MetricCard
                title="Active Classroom Sections"
                value={data.section_distribution ? data.section_distribution.length : 0}
                subtitle="Monitored sections"
                icon={<PieIcon size={18} />}
              />
            </div>

            <div className="grid-2">
              {/* Daily Trend Chart */}
              <div className="card">
                <div style={{ marginBottom: 16 }}>
                  <h3 className="card-title">Daily Attendance Progression</h3>
                  <p className="card-subtitle">Students marked present per day</p>
                </div>

                {data.daily_trends && data.daily_trends.length > 0 ? (
                  <div style={{ height: 260, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.daily_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#52745B" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#52745B" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#777C74' }} stroke="#E6E7E1" />
                        <YAxis tick={{ fontSize: 11, fill: '#777C74' }} stroke="#E6E7E1" />
                        <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E6E7E1', borderRadius: 6, fontSize: 12 }} />
                        <Area type="monotone" dataKey="present" stroke="#52745B" strokeWidth={2} fillOpacity={1} fill="url(#analyticsGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState title="Insufficient historical data" description="More attendance sessions are required to generate progression trends." />
                )}
              </div>

              {/* Section Rate Comparison */}
              <div className="card">
                <div style={{ marginBottom: 16 }}>
                  <h3 className="card-title">Section Attendance Rate</h3>
                  <p className="card-subtitle">Percentage attendance rate per section</p>
                </div>

                {data.section_distribution && data.section_distribution.length > 0 ? (
                  <div style={{ height: 260, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.section_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="section" tick={{ fontSize: 11, fill: '#777C74' }} stroke="#E6E7E1" />
                        <YAxis tick={{ fontSize: 11, fill: '#777C74' }} stroke="#E6E7E1" unit="%" />
                        <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E6E7E1', borderRadius: 6, fontSize: 12 }} />
                        <Bar dataKey="rate" fill="#52745B" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState title="No section metrics" description="No section attendance records available." />
                )}
              </div>
            </div>
          </>
        ) : (
          <EmptyState title="Analytics unavailable" description="Could not load analytics dataset." />
        )}
      </div>
    </div>
  );
};
