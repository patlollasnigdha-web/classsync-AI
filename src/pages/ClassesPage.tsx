import React, { useState, useEffect } from 'react';
import { GraduationCap, Clock, MapPin, User, BookOpen } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { api, ClassInfo } from '../services/api';

export const ClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const data = await api.getClasses();
      setClasses(data.classes || []);
    } catch (err) {
      console.error('Failed to fetch classes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  return (
    <div>
      <Header
        title="Classroom Sections & Schedule"
        subtitle="Manage academic sections, assigned faculty, rooms, and class timetables."
      />

      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {loading ? (
          <LoadingSpinner label="Fetching classroom schedule database..." />
        ) : classes.length > 0 ? (
          <div className="grid-2">
            {classes.map((cls) => (
              <div key={cls.section} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--accent-soft)',
                      color: 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                        Section {cls.section}
                      </h3>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {cls.student_count} registered student(s)
                      </span>
                    </div>
                  </div>

                  <span className="badge badge-accent" style={{ fontSize: 12, padding: '4px 10px' }}>
                    {cls.today_attendance_count} Present Today
                  </span>
                </div>

                {/* Timetable schedule for this section */}
                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
                    Scheduled Classes & Timetable
                  </h4>

                  {cls.schedules.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {cls.schedules.map((sch, i) => (
                        <div
                          key={i}
                          style={{
                            padding: 12,
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--surface-secondary)',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <BookOpen size={14} style={{ color: 'var(--accent)' }} />
                              {sch.subject}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)' }}>
                              {sch.day}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <User size={12} />
                              {sch.faculty_name} ({sch.faculty_id})
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <MapPin size={12} />
                              {sch.room}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Clock size={12} />
                              {sch.start_time} - {sch.end_time}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No timetable schedule added for this section.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No classroom sections" description="No section records exist in class_schedule.csv dataset." />
        )}
      </div>
    </div>
  );
};
