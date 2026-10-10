import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cpu, Database, Camera, Server, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { api, SystemStatus } from '../services/api';

interface SettingsPageProps {
  systemStatus: SystemStatus | null;
  isConnected: boolean;
  onRefreshStatus: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  systemStatus,
  isConnected,
  onRefreshStatus
}) => {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  useEffect(() => {
    // Test browser camera capability
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          const hasVid = devices.some(d => d.kind === 'videoinput');
          setHasCameraPermission(hasVid);
        })
        .catch(() => setHasCameraPermission(false));
    } else {
      setHasCameraPermission(false);
    }
  }, []);

  return (
    <div>
      <Header
        title="Settings & System Diagnostics"
        subtitle="System health, hardware diagnostics, and ML model configuration."
        actions={
          <button className="btn btn-secondary" onClick={onRefreshStatus}>
            <RefreshCw size={14} />
            <span>Check Diagnostics</span>
          </button>
        }
      />

      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* System Health Summary Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Server size={20} />
            </div>
            <div>
              <h3 className="card-title">Backend API Connection</h3>
              <p className="card-subtitle">FastAPI REST Server Status</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div style={{ padding: 12, backgroundColor: 'var(--surface-secondary)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Status</span>
              <div style={{ marginTop: 4 }}>
                <StatusBadge status={isConnected ? 'online' : 'offline'} />
              </div>
            </div>
            <div style={{ padding: 12, backgroundColor: 'var(--surface-secondary)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>API Base Endpoint</span>
              <div style={{ marginTop: 4, fontFamily: 'monospace', fontWeight: 600, fontSize: 13 }}>
                http://127.0.0.1:8000
              </div>
            </div>
            <div style={{ padding: 12, backgroundColor: 'var(--surface-secondary)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Application Version</span>
              <div style={{ marginTop: 4, fontWeight: 600, fontSize: 13 }}>
                ClassSync AI v1.0.0
              </div>
            </div>
          </div>
        </div>

        <div className="grid-2">
          {/* ML Model Diagnostics */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Cpu size={20} />
              </div>
              <div>
                <h3 className="card-title">Face Recognition Engine</h3>
                <p className="card-subtitle">InsightFace (buffalo_l) Model</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Model Loaded State</span>
                <span style={{ fontWeight: 600, color: systemStatus?.model_status?.loaded ? 'var(--success)' : 'var(--danger)' }}>
                  {systemStatus?.model_status?.loaded ? 'Model Loaded & Active' : 'Not Loaded'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Detection Algorithm</span>
                <span style={{ fontWeight: 600 }}>ONNX / InsightFace ResNet</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Execution Provider</span>
                <span style={{ fontWeight: 600 }}>CPUExecutionProvider</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Recognition Threshold</span>
                <span style={{ fontWeight: 600 }}>Cosine Similarity ≥ 0.50</span>
              </div>
            </div>
          </div>

          {/* Dataset & Embeddings */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Database size={20} />
              </div>
              <div>
                <h3 className="card-title">Dataset & Vector Store</h3>
                <p className="card-subtitle">Embeddings & CSV Databases</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Registered Student Profiles</span>
                <span style={{ fontWeight: 600 }}>{systemStatus?.dataset_status?.registered_students || 0} students</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Student Embedding Vectors</span>
                <span style={{ fontWeight: 600 }}>{systemStatus?.dataset_status?.student_embeddings || 0} enrolled</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Faculty Embedding Vectors</span>
                <span style={{ fontWeight: 600 }}>{systemStatus?.dataset_status?.faculty_embeddings || 0} enrolled</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Attendance History</span>
                <span style={{ fontWeight: 600 }}>{systemStatus?.dataset_status?.total_attendance_records || 0} records</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
