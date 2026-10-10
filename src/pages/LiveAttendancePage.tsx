import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  CameraOff, 
  Upload, 
  Play, 
  Square, 
  CheckCircle2, 
  AlertTriangle, 
  UserCheck, 
  Users, 
  RefreshCw,
  FileImage,
  Info
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { api, RecognitionResult, ClassInfo } from '../services/api';

export const LiveAttendancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  
  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // Active session state
  const [session, setSession] = useState<any>({ active: false });
  const [facultyName, setFacultyName] = useState<string | null>(null);
  const [classesList, setClassesList] = useState<ClassInfo[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('F001');
  
  // Recognition results & counts
  const [recognitionResults, setRecognitionResults] = useState<RecognitionResult[]>([]);
  const [processedCount, setProcessedCount] = useState(0);
  const [recognizedStudents, setRecognizedStudents] = useState<Set<string>>(new Set());
  
  // Image Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  
  // Refs for video & canvas
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<any>(null);

  // Camera Devices State
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  const loadCameraDevices = async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      setVideoDevices(videoInputs);
      
      // Auto-select integrated/laptop camera if not selected yet
      if (videoInputs.length > 0 && !selectedDeviceId) {
        const laptopCam = videoInputs.find(d => 
          d.label.toLowerCase().includes('integrated') || 
          d.label.toLowerCase().includes('laptop') || 
          d.label.toLowerCase().includes('internal') ||
          d.label.toLowerCase().includes('webcam')
        );
        setSelectedDeviceId(laptopCam ? laptopCam.deviceId : videoInputs[0].deviceId);
      }
    } catch (err) {
      console.error('Error listing camera devices:', err);
    }
  };

  // Fetch Session Info & Classes
  const fetchSessionData = async () => {
    try {
      const sessData = await api.getSessionInfo();
      setSession(sessData.session || { active: false });
      setFacultyName(sessData.faculty_name);

      const clsData = await api.getClasses();
      setClassesList(clsData.classes || []);
    } catch (err) {
      console.error('Error fetching session info:', err);
    }
  };

  useEffect(() => {
    fetchSessionData();
    loadCameraDevices();
    return () => {
      stopCamera();
    };
  }, []);

  // Camera Management
  const startCamera = async (overrideDeviceId?: string) => {
    setCameraError(null);
    const targetDeviceId = overrideDeviceId || selectedDeviceId;

    const videoConstraints: MediaTrackConstraints = targetDeviceId
      ? { deviceId: { exact: targetDeviceId } }
      : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' };

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints
      });

      streamRef.current = mediaStream;
      setIsCameraActive(true);

      // Refresh labels after permission grant
      loadCameraDevices();

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.warn('Video play interrupted:', e));
        };
      }
      
      // Start sending frames to backend ML pipeline every 1.2s
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        captureAndAnalyzeFrame();
      }, 1200);
    } catch (err: any) {
      console.error('Camera permission/access error:', err);
      setCameraError(err.message || 'Could not access selected camera. Please check permissions.');
      setIsCameraActive(false);
    }
  };

  const handleDeviceChange = (newDeviceId: string) => {
    setSelectedDeviceId(newDeviceId);
    if (isCameraActive) {
      startCamera(newDeviceId);
    }
  };

  const stopCamera = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Capture frame from webcam and call InsightFace ML API
  const captureAndAnalyzeFrame = async () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.paused || videoRef.current.ended) return;

    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    // Use offscreen canvas to capture JPEG frame for API
    const offscreen = document.createElement('canvas');
    offscreen.width = video.videoWidth;
    offscreen.height = video.videoHeight;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    offCtx.drawImage(video, 0, 0, offscreen.width, offscreen.height);
    const imageData = offscreen.toDataURL('image/jpeg', 0.85);

    // Prepare overlay canvas
    const overlay = canvasRef.current;
    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    try {
      const response = await api.recognizeFrame(imageData);
      
      // Clear overlay canvas so live video shows through
      ctx.clearRect(0, 0, overlay.width, overlay.height);

      if (response.results && response.results.length > 0) {
        response.results.forEach((res) => {
          const [x1, y1, x2, y2] = res.bbox;
          const w = x2 - x1;
          const h = y2 - y1;

          ctx.lineWidth = 3;
          if (res.type === 'faculty') {
            ctx.strokeStyle = '#3F7856'; // Green
          } else if (res.type === 'student') {
            ctx.strokeStyle = res.attendance_marked ? '#52745B' : '#A87932';
          } else {
            ctx.strokeStyle = '#B84E49'; // Red
          }

          ctx.strokeRect(x1, y1, w, h);

          // Label overlay box
          ctx.fillStyle = ctx.strokeStyle;
          ctx.fillRect(x1, Math.max(0, y1 - 24), Math.max(140, w), 24);

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 12px Inter, sans-serif';
          ctx.fillText(`${res.name} (${Math.round(res.score * 100)}%)`, x1 + 6, Math.max(16, y1 - 8));
        });

        // Update recognition results feed
        setRecognitionResults(prev => {
          const combined = [...response.results, ...prev];
          const unique = Array.from(new Map(combined.map(item => [item.person_id + item.status, item])).values());
          return unique.slice(0, 20);
        });

        // Update counts
        response.results.forEach(res => {
          if (res.type === 'student' && res.person_id !== 'UNKNOWN') {
            setRecognizedStudents(prev => new Set(prev).add(res.person_id));
          }
        });
        setProcessedCount(prev => prev + response.results.length);
      }

      // Update session if faculty triggered it
      if (response.active_session) {
        setSession(response.active_session);
      }
    } catch (err) {
      console.error('Frame analysis failed:', err);
    }
  };

  // Image Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG).');
      return;
    }

    setUploading(true);
    setUploadedPreview(URL.createObjectURL(file));

    try {
      const response = await api.recognizeFile(file);
      setRecognitionResults(response.results || []);
      setProcessedCount(response.faces_count || 0);

      response.results.forEach(res => {
        if (res.type === 'student' && res.person_id !== 'UNKNOWN') {
          setRecognizedStudents(prev => new Set(prev).add(res.person_id));
        }
      });

      if (response.active_session) {
        setSession(response.active_session);
      }
    } catch (err: any) {
      alert(`Image processing failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Session Control Handlers
  const handleStartSession = async () => {
    try {
      const res = await api.startSession(selectedFacultyId);
      setSession(res.session);
      await fetchSessionData();
    } catch (err: any) {
      alert(`Could not start session: ${err.message}`);
    }
  };

  const handleStopSession = async () => {
    try {
      const res = await api.stopSession();
      setSession(res.session);
      await fetchSessionData();
    } catch (err: any) {
      alert(`Could not stop session: ${err.message}`);
    }
  };

  return (
    <div>
      <Header
        title="Live Attendance"
        subtitle="Automated classroom attendance powered by InsightFace AI face recognition."
        actions={
          session.active ? (
            <button className="btn btn-danger" onClick={handleStopSession}>
              <Square size={14} />
              <span>Stop Active Session</span>
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <select
                className="select"
                style={{ width: 180 }}
                value={selectedFacultyId}
                onChange={(e) => setSelectedFacultyId(e.target.value)}
              >
                <option value="F001">Dr. Mousmi (F001)</option>
                <option value="F002">Dr. Rajesh (F002)</option>
              </select>
              <button className="btn btn-primary" onClick={handleStartSession}>
                <Play size={14} />
                <span>Start Session</span>
              </button>
            </div>
          )
        }
      />

      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          {/* LEFT SECTION: RECOGNITION WORKSPACE */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Mode Toggle Header */}
            <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className={`btn ${activeTab === 'camera' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    setActiveTab('camera');
                  }}
                >
                  <Camera size={15} />
                  <span>Live Webcam</span>
                </button>
                <button
                  className={`btn ${activeTab === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    stopCamera();
                    setActiveTab('upload');
                  }}
                >
                  <Upload size={15} />
                  <span>Upload Classroom Image</span>
                </button>
              </div>

              {activeTab === 'camera' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {videoDevices.length > 0 && (
                    <select
                      className="select"
                      style={{ width: 220, fontSize: 12 }}
                      value={selectedDeviceId}
                      onChange={(e) => handleDeviceChange(e.target.value)}
                    >
                      <option value="">Default / Integrated Webcam</option>
                      {videoDevices.map((dev, idx) => (
                        <option key={dev.deviceId || idx} value={dev.deviceId}>
                          {dev.label || `Camera ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  )}

                  {isCameraActive ? (
                    <button className="btn btn-secondary" onClick={stopCamera}>
                      <CameraOff size={14} />
                      <span>Stop Camera</span>
                    </button>
                  ) : (
                    <button className="btn btn-primary" onClick={() => startCamera()}>
                      <Camera size={14} />
                      <span>Start Camera</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Video / Canvas / Image Preview Container */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative', backgroundColor: '#1A1C18', minHeight: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {activeTab === 'camera' ? (
                <>
                  <video
                    ref={videoRef}
                    style={{ width: '100%', height: '100%', display: isCameraActive ? 'block' : 'none', maxHeight: 520, objectFit: 'contain' }}
                    autoPlay
                    playsInline
                    muted
                  />
                  <canvas
                    ref={canvasRef}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: isCameraActive ? 'block' : 'none',
                      pointerEvents: 'none'
                    }}
                  />

                  {!isCameraActive && (
                    <div style={{ padding: 40, textAlign: 'center', color: '#D1D4CC' }}>
                      {cameraError ? (
                        <div style={{ color: '#F8D7DA', maxWidth: 400, margin: '0 auto' }}>
                          <AlertTriangle size={36} style={{ margin: '0 auto 12px', display: 'block' }} />
                          <h4 style={{ color: '#FFFFFF', marginBottom: 6 }}>Camera Unavailable</h4>
                          <p style={{ fontSize: 13, marginBottom: 16 }}>{cameraError}</p>
                          <button className="btn btn-secondary" onClick={() => startCamera()}>
                            Retry Camera Permission
                          </button>
                        </div>
                      ) : (
                        <div>
                          <Camera size={48} strokeWidth={1.2} style={{ margin: '0 auto 16px', opacity: 0.6 }} />
                          <h4 style={{ color: '#FFFFFF', fontSize: 16, marginBottom: 6 }}>Live Classroom Camera Feed</h4>
                          <p style={{ fontSize: 13, color: '#979C94', maxWidth: 360, margin: '0 auto 20px' }}>
                            Click "Start Camera" to launch live face detection and recognition.
                          </p>
                          <button className="btn btn-primary" onClick={() => startCamera()}>
                            <Camera size={15} />
                            <span>Start Camera Feed</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: 30, textAlign: 'center', width: '100%' }}>
                  {uploadedPreview ? (
                    <div>
                      <img
                        src={uploadedPreview}
                        alt="Classroom preview"
                        style={{ maxWidth: '100%', maxHeight: 440, borderRadius: 6, border: '1px solid #333' }}
                      />
                      <div style={{ marginTop: 16 }}>
                        <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                          <Upload size={14} />
                          <span>Select Different Image</span>
                          <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div style={{ border: '2px dashed #444840', borderRadius: 8, padding: 40, maxWidth: 500, margin: '0 auto' }}>
                      <FileImage size={48} strokeWidth={1.2} style={{ color: '#777C74', margin: '0 auto 12px', display: 'block' }} />
                      <h4 style={{ color: '#FFFFFF', fontSize: 15, marginBottom: 6 }}>Upload Classroom Photo</h4>
                      <p style={{ fontSize: 12, color: '#979C94', marginBottom: 20 }}>
                        Upload a photo of the classroom to detect faces and mark attendance in batch. Supported formats: JPG, PNG.
                      </p>
                      <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
                        <Upload size={15} />
                        <span>Choose Image File</span>
                        <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                      </label>
                    </div>
                  )}
                  {uploading && <LoadingSpinner label="Running InsightFace Recognition..." />}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SECTION: SESSION & SUMMARY INFO */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Session Info Card */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 className="card-title">Session Information</h3>
                <StatusBadge status={session.active ? 'active' : 'closed'} label={session.active ? 'Session Active' : 'Session Closed'} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Faculty Instructor</span>
                  <span style={{ fontWeight: 600 }}>{facultyName || session.faculty_id || 'Not Assigned'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Class Subject</span>
                  <span style={{ fontWeight: 600 }}>{session.subject || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Assigned Section</span>
                  <span style={{ fontWeight: 600 }}>{session.section || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Classroom</span>
                  <span style={{ fontWeight: 600 }}>{session.room || '—'}</span>
                </div>
              </div>

              {!session.active && (
                <div style={{
                  marginTop: 16,
                  padding: 12,
                  backgroundColor: 'var(--surface-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8
                }}>
                  <Info size={16} style={{ flexShrink: 0, marginTop: 2, color: 'var(--accent)' }} />
                  <span>
                    When a faculty member is detected on camera during their scheduled class time, a session starts automatically. Or use "Start Session" above.
                  </span>
                </div>
              )}
            </div>

            {/* Recognition Live Stats */}
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: 14 }}>Recognition Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ backgroundColor: 'var(--surface-secondary)', padding: 12, borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Students Recognized</span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{recognizedStudents.size}</span>
                </div>
                <div style={{ backgroundColor: 'var(--surface-secondary)', padding: 12, borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block' }}>Faces Analyzed</span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{processedCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RECOGNITION RESULTS FEED TABLE */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 className="card-title">Recognition Stream</h3>
              <p className="card-subtitle">Real-time InsightFace identification and section verification output</p>
            </div>
            <button
              className="btn btn-secondary"
              style={{ fontSize: 12 }}
              onClick={() => {
                setRecognitionResults([]);
                setRecognizedStudents(new Set());
                setProcessedCount(0);
              }}
            >
              <RefreshCw size={13} />
              <span>Clear Stream</span>
            </button>
          </div>

          {recognitionResults.length > 0 ? (
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Person Name</th>
                    <th>Type</th>
                    <th>ID / Roll</th>
                    <th>Section</th>
                    <th>Confidence Score</th>
                    <th>Verification Status</th>
                    <th>Attendance Result</th>
                  </tr>
                </thead>
                <tbody>
                  {recognitionResults.map((res, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{res.name}</td>
                      <td>
                        <StatusBadge
                          status={res.type}
                          label={res.type === 'faculty' ? 'Faculty' : res.type === 'student' ? 'Student' : 'Unknown'}
                        />
                      </td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                        {res.person_id} {res.roll_no ? `(${res.roll_no})` : ''}
                      </td>
                      <td>{res.section || '—'}</td>
                      <td style={{ fontWeight: 500 }}>
                        {res.score > 0 ? `${Math.round(res.score * 100)}%` : '—'}
                      </td>
                      <td>
                        <StatusBadge status={res.status} />
                      </td>
                      <td style={{ fontSize: 12, color: res.attendance_marked ? 'var(--success)' : 'var(--text-secondary)' }}>
                        {res.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No faces detected yet"
              description="Start the live webcam feed or upload a classroom photo to begin face recognition."
            />
          )}
        </div>
      </div>
    </div>
  );
};
