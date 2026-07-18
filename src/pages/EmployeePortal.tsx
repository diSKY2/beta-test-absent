import { format } from 'date-fns';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { 
  Smartphone, Lock, MapPin, Camera, Calendar, FileText, User, 
  ArrowLeft, Clock, LogOut, CheckCircle2, AlertTriangle, Send, 
  Upload, Eye, EyeOff, Building, Users, CalendarDays, DollarSign,
  ChevronRight, Shield, RefreshCw, Compass, ShieldAlert, Sparkles, Check, HelpCircle, Flame, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://garudatrisulaperkasa.web.id";


// Interfaces matching PostgreSQL Schema
interface Employee {
  id: string;
  nik: string;
  name: string;
  role: string;
  locationId: string;
  departmentId: string;
  subDepartmentId: string;
  baseSalary: string;
  profilePicUrl?: string;
  status?: 'Aktif' | 'Resign' | 'Habis Kontrak' | 'Pensiun' | 'Sanksi';
}

interface Location {
  id: string;
  name: string;
  latitude: string;
  longitude: string;
  radius: number;
}

interface Attendance {
  id: string;
  employeeId: string;
  attendanceDate: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa';
  timeIn: string | null;
  timeOut: string | null;
  isLate: boolean;
  photoUrl: string | null;
}

interface LeaveRequest {
  id: string;
  employeeId: string;
  requestDate: string;
  type: 'Izin' | 'Sakit';
  reason: string;
  photoUrl: string | null;
  status: 'Pending' | 'Approved' | 'Rejected';
}

interface OvertimeRequest {
  id: string;
  employeeId: string;
  requestDate: string;
  reason: string;
  hours: number;
  status: 'Pending' | 'Approved' | 'Rejected';
}

interface WorkReport {
  id: string;
  employeeId: string;
  date: string;
  description: string;
  photoUrl: string | null;
}

interface Schedule {
  id: string;
  employeeId: string;
  date: string;
  shiftName: string;
  shiftStart: string;
  shiftEnd: string;
  isOffDay: boolean;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  mediaUrl?: string;
  isPopup?: boolean;
  createdAt: string;
}

export default function EmployeePortal() {
  const [activeTab, setActiveTab] = useState<'home' | 'izin' | 'lembur' | 'jadwal' | 'laporan' | 'absen_anggota'>('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nik, setNik] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  const [isSubmittingOvertime, setIsSubmittingOvertime] = useState(false);
  const [activeToast, setActiveToast] = useState<string | null>(null);
  
  // App States
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [officeLocation, setOfficeLocation] = useState<Location | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [attendancesHistory, setAttendancesHistory] = useState<Attendance[]>([]);
  const [leaveRequestsHistory, setLeaveRequestsHistory] = useState<LeaveRequest[]>([]);
  const [overtimeRequestsHistory, setOvertimeRequestsHistory] = useState<OvertimeRequest[]>([]);
  const [workReportsHistory, setWorkReportsHistory] = useState<WorkReport[]>([]);
  const [schedulesList, setSchedulesList] = useState<Schedule[]>([]);
  
  // Meta tables for lookups
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [allSubDeptEmployees, setAllSubDeptEmployees] = useState<Employee[]>([]);
  
  // Realtime clock
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Attendance Pop-up state
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceModalType, setAttendanceModalType] = useState<'masuk' | 'pulang' | 'lembur_masuk' | 'lembur_pulang'>('masuk');
  
  // Local Overtime Attendance state
  const [overtimeTimeIn, setOvertimeTimeIn] = useState<string | null>(null);
  const [overtimeTimeOut, setOvertimeTimeOut] = useState<string | null>(null);

  // Announcement Overlay Popup state
  const [activeAnnouncement, setActiveAnnouncement] = useState<Announcement | null>(null);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);

  // Feature states
  const [currentDistance, setCurrentDistance] = useState<number>(12); // Real-world distance or safe fallback
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [selectedGroupMemberId, setSelectedGroupMemberId] = useState<string>('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const staticDataFetched = useRef(false);

  const isKetua = !!(currentEmployee?.role && (
    currentEmployee.role.toLowerCase().includes('ketua') || 
    currentEmployee.role.toLowerCase().includes('leader') || 
    currentEmployee.role.toLowerCase().includes('danru')
  ));

  const handleResetAbsen = async (attendanceId: string) => {
    if (!confirm("Apakah Anda yakin ingin membatalkan/mereset absensi hari ini untuk anggota tersebut?")) return;
    setLoading(true);
    try {
      const payload = {
        action: 'deleteDoc',
        collection: 'attendances',
        docId: attendanceId
      };

      const res = await fetch(API_BASE_URL + '/api/sql/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        triggerToast(`Berhasil membatalkan absensi anggota.`);
        
        // Targeted local state update
        setTeamAttendances(prev => prev.filter((a: any) => a.id !== attendanceId));
        setAttendancesHistory(prev => prev.filter((a: any) => a.id !== attendanceId));
        if (todayAttendance?.id === attendanceId) {
           setTodayAttendance(null);
        }
      } else {
        const err = await res.json();
        alert('Gagal: ' + err.error);
      }
    } catch (e) {
      console.error(e);
      alert('Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  // Live Camera states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [teamAttendances, setTeamAttendances] = useState<Attendance[]>([]);
  
  // Forms
  const [leaveType, setLeaveType] = useState<'Izin' | 'Sakit'>('Izin');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveAttachment, setLeaveAttachment] = useState<string | null>(null);
  
  const [overtimeDate, setOvertimeDate] = useState('');
  const [overtimeHours, setOvertimeHours] = useState('2');
  const [overtimeReason, setOvertimeReason] = useState('');
  
  const [reportText, setReportText] = useState('');
  const [reportPhoto, setReportPhoto] = useState<string | null>(null);

  // Show customized floating toast
  const triggerToast = (msg: string) => {
    setActiveToast(msg);
    setTimeout(() => {
      setActiveToast(null);
    }, 3000);
  };

  // Initialize Capacitor notifications
  useEffect(() => {
    const initNotifications = async () => {
      if ((window as any).Capacitor?.isNativePlatform()) {
        try {
          const perm = await LocalNotifications.requestPermissions();
          if (perm.display === 'granted') {
             await LocalNotifications.schedule({
               notifications: [
                 {
                   id: 1,
                   title: "Waktunya Absen Masuk!",
                   body: "Jangan lupa absen masuk hari ini.",
                   schedule: { on: { hour: 7, minute: 45 }, allowWhileIdle: true }
                 },
                 {
                   id: 2,
                   title: "Waktunya Absen Pulang!",
                   body: "Jangan lupa absen pulang sebelum kembali.",
                   schedule: { on: { hour: 17, minute: 0 }, allowWhileIdle: true }
                 }
               ]
             });
          }
        } catch (e) {
          console.error("Local Notifications error:", e);
        }
      }
    };
    initNotifications();
  }, []);

  // Clock ticks
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Try parsing session on load
  useEffect(() => {
    const savedSession = localStorage.getItem('employeeSession');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed && parsed.id) {
          setCurrentEmployee(parsed);
          setIsLoggedIn(true);
        }
      } catch (e) {
        localStorage.removeItem('employeeSession');
      }
    }
    
    // Load local overtime attendance state if any
    const otIn = localStorage.getItem('gtp_overtime_time_in');
    const otOut = localStorage.getItem('gtp_overtime_time_out');
    if (otIn) setOvertimeTimeIn(otIn);
    if (otOut) setOvertimeTimeOut(otOut);
  }, []);

  const isNative = (window as any).Capacitor?.isNativePlatform();

  // Dynamically update GPS coordinates for geofencing
  useEffect(() => {
    if (showAttendanceModal && officeLocation) {
      const getPosition = async () => {
        try {
          if (isNative) {
             const perm = await Geolocation.requestPermissions();
             if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') {
                throw new Error('Location permission not granted');
             }
          }

          const position = await Geolocation.getCurrentPosition({
             enableHighAccuracy: true,
             timeout: 10000,
             maximumAge: 0
          });

          const lat1 = Number(officeLocation.latitude);
          const lon1 = Number(officeLocation.longitude);
          const lat2 = position.coords.latitude;
          const lon2 = position.coords.longitude;
          
          // Haversine formula to compute distance in meters
          const R = 6371e3; // Earth's radius in meters
          const phi1 = lat1 * Math.PI / 180;
          const phi2 = lat2 * Math.PI / 180;
          const deltaPhi = (lat2 - lat1) * Math.PI / 180;
          const deltaLambda = (lon2 - lon1) * Math.PI / 180;

          const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
                    Math.cos(phi1) * Math.cos(phi2) *
                    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          setCurrentDistance(Math.round(distance));
        } catch (err) {
           console.error("Gagal mendapatkan lokasi GPS:", err);
           // Fallback safe distance inside geofence if blocked/unsupported
           setCurrentDistance(12);
        }
      };
      getPosition();
    }
  }, [showAttendanceModal, officeLocation]);

  // Camera handler for genuine live selfie stream (Web Only)
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    
    const startCamera = async () => {
      // Don't start getUserMedia on Native to avoid WebView permission issues
      if (isNative) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } 
        });
        
        activeStream = stream;
        setCameraStream(stream);
        setCameraError(null);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setCameraError("Tidak dapat mengakses kamera aktif. Berikan izin akses kamera di peramban Anda.");
      }
    };

    if (showAttendanceModal && !selfiePreview) {
      startCamera();
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showAttendanceModal, selfiePreview]);

  const handleNativeCamera = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 50,
        width: 800,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        direction: 'FRONT' as any
      });
      if (image.dataUrl) {
         setSelfiePreview(image.dataUrl);
         setCameraError(null);
      }
    } catch (e: any) {
      console.error("Native camera error:", e);
      setCameraError("Gagal mengambil foto dari kamera sistem.");
    }
  };

  const captureSelfie = async () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setSelfiePreview(dataUrl);
        if (cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop());
          setCameraStream(null);
        }
      }
    }
  };

  // Fetch initial data once logged in
  useEffect(() => {
    if (isLoggedIn && currentEmployee) {
      fetchEmployeeResources();
    }
  }, [isLoggedIn, currentEmployee?.id]);

  const fetchEmployeeResources = async (isSoftRefresh = false) => {
    if (!currentEmployee) return;
    try {
      const shouldFetchStatic = !isSoftRefresh || !staticDataFetched.current;
      const isLeader = !!(currentEmployee.role && (currentEmployee.role.toLowerCase().includes('ketua') || currentEmployee.role.toLowerCase().includes('leader') || currentEmployee.role.toLowerCase().includes('danru')));

      const res = await fetch(API_BASE_URL + '/api/employee/dashboard-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: currentEmployee.id,
          subDepartmentId: currentEmployee.subDepartmentId,
          isLeader,
          isSoftRefresh: !shouldFetchStatic
        })
      });

      if (!res.ok) {
        if (res.status === 404) {
           setCurrentEmployee(null); // deactivated or deleted
           localStorage.removeItem('employeeSession');
        }
        return;
      }

      const data = await res.json();
      
      // 0. Refresh current logged-in employee status to detect deactivation instantly
      if (data.employee) {
        const freshEmp = data.employee;
        setCurrentEmployee(freshEmp);
        localStorage.setItem('employeeSession', JSON.stringify(freshEmp));
        if (freshEmp.status && freshEmp.status !== 'Aktif') {
          return;
        }
      }

      // 1. Fetch Locations to check geofence
      if (shouldFetchStatic && data.locations) {
        const locData = data.locations;
        setAllLocations(locData);
        const myLoc = locData.find((l: any) => l.id === currentEmployee.locationId);
        if (myLoc) setOfficeLocation(myLoc);
      }

      // 2. Compute dynamic 7-day schedule
      if (shouldFetchStatic) {
        let shiftTypes = data.shiftTypes || [];
        let pattern = data.shiftPatterns && data.shiftPatterns.length > 0 ? data.shiftPatterns[0] : null;
        let overrides = data.overrides || [];

        const formatTimeStr = (tStr: string) => {
          if (!tStr) return "08:00";
          if (tStr.includes('T')) {
            const parts = tStr.split('T')[1];
            if (parts) return parts.substring(0, 5);
          }
          return tStr.substring(0, 5);
        };

        // Generate 7 days starting from today (dynamic future schedule)
        const computedSchedules: Schedule[] = [];
        const today = new Date();

        for (let i = 0; i < 7; i++) {
          const targetDate = new Date();
          targetDate.setDate(today.getDate() + i);

          // Format as YYYY-MM-DD for checking overrides
          const yyyy = targetDate.getFullYear();
          const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
          const dd = String(targetDate.getDate()).padStart(2, '0');
          const dateStr = `${yyyy}-${mm}-${dd}`;

          // Find if there is an override for this date
          const override = overrides.find((o: any) => {
            const oDate = new Date(o.overrideDate);
            const oY = oDate.getFullYear();
            const oM = String(oDate.getMonth() + 1).padStart(2, '0');
            const oD = String(oDate.getDate()).padStart(2, '0');
            return `${oY}-${oM}-${oD}` === dateStr;
          });

          let activeShift: any = null;
          if (override) {
            activeShift = shiftTypes.find((s: any) => s.id === override.shiftTypeId);
          }

          // If no override, calculate from shift pattern
          if (!activeShift && pattern && pattern.sequence && pattern.sequence.length > 0) {
            const pDate = new Date(pattern.startDate);

            // Calculate difference in calendar days
            const tDateReset = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
            const pDateReset = new Date(pDate.getFullYear(), pDate.getMonth(), pDate.getDate());
            const diffTime = tDateReset.getTime() - pDateReset.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays >= 0) {
              const index = diffDays % pattern.sequence.length;
              const shiftId = pattern.sequence[index];
              activeShift = shiftTypes.find((s: any) => s.id === shiftId);
            }
          }

          // Fallback if no pattern or shift found
          if (!activeShift) {
            const defaultShifts = [
              { name: 'SHIFT PAGI', start: '08:00', end: '16:00', off: false },
              { name: 'SHIFT PAGI', start: '08:00', end: '16:00', off: false },
              { name: 'SHIFT SIANG', start: '16:00', end: '24:00', off: false },
              { name: 'SHIFT SIANG', start: '16:00', end: '24:00', off: false },
              { name: 'SHIFT MALAM', start: '00:00', end: '08:00', off: false },
              { name: 'SHIFT MALAM', start: '00:00', end: '08:00', off: false },
              { name: 'LIBUR MINGGUAN', start: 'Libur', end: 'Libur', off: true },
            ];
            const fallback = defaultShifts[i % 7];
            computedSchedules.push({
              id: `fallback-${dateStr}`,
              employeeId: currentEmployee.id,
              date: targetDate.toISOString(),
              shiftName: fallback.name,
              shiftStart: fallback.start,
              shiftEnd: fallback.end,
              isOffDay: fallback.off
            });
          } else {
            computedSchedules.push({
              id: `computed-${dateStr}`,
              employeeId: currentEmployee.id,
              date: targetDate.toISOString(),
              shiftName: activeShift.name,
              shiftStart: activeShift.isOffDay ? "Libur" : formatTimeStr(activeShift.startTime),
              shiftEnd: activeShift.isOffDay ? "Libur" : formatTimeStr(activeShift.endTime),
              isOffDay: activeShift.isOffDay
            });
          }
        }

        setSchedulesList(computedSchedules);
      }

      // 3. Fetch today's attendance state
      if (data.attendances) {
        const attData = data.attendances;
        setAttendancesHistory(attData);
        
        // Find today's date formatted using fully timezone-safe local year, month, and day matching
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth();
        const d = now.getDate();
        const todayAtt = attData.find((a: any) => {
          const aDate = new Date(a.attendanceDate);
          return aDate.getFullYear() === y && aDate.getMonth() === m && aDate.getDate() === d;
        });
        if (todayAtt) {
          setTodayAttendance(todayAtt);
        }
      }

      // 4. Fetch leave history
      if (data.leaveRequests) {
        setLeaveRequestsHistory(data.leaveRequests);
      }

      // 5. Fetch overtime history
      if (data.overtimeRequests) {
        setOvertimeRequestsHistory(data.overtimeRequests);
      }

      // 6. Fetch work reports history
      if (data.workReports) {
        setWorkReportsHistory(data.workReports);
      }

      // 7. Group Member Check for Leaders (Ketua Regu)
      if (isLeader) {
        if (shouldFetchStatic && data.teamEmployees) {
          const list = data.teamEmployees;
          setAllSubDeptEmployees(list.filter((e: any) => e.id !== currentEmployee.id));
        }

        // Fetch team attendances to show in Squad Command Panel
        if (data.teamAttendances) {
          // only show attendances for today
          const now = new Date();
          const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
          
          const todaysTeam = data.teamAttendances.filter((a: any) => {
            return new Date(a.attendanceDate).toISOString().split('T')[0] === todayStr && a.employeeId !== currentEmployee.id;
          });
          setTeamAttendances(todaysTeam);
        }
      }

      // 8. Fetch Announcements for Urgent Popup Modal
      if (shouldFetchStatic) {
        let fetchedAnnouncements: any[] = data.announcements || [];

        // If no announcements are found in database, seed a default fallback announcement for premium presentation
        if (fetchedAnnouncements.length === 0) {
          fetchedAnnouncements = [{
            id: 'default-command-sop-announcement',
            title: 'Instruksi Peningkatan Keamanan & Kesiapsiagaan Cuaca Ekstrem',
            content: 'Menyikapi perkembangan cuaca ekstrem saat ini, seluruh personel Gada Pratama diwajibkan meningkatkan intensitas patroli keliling di area rawan banjir, tiang listrik longsor, atau pohon tumbang minimal satu jam sekali. Pastikan senter operasional menyala dan geofencing GPS mobile Anda selalu aktif selama jam dinas komando berlangsung.',
            type: 'SOP Operasional',
            createdAt: new Date().toISOString()
          }];
        }

        // Find latest announcement
        if (fetchedAnnouncements.length > 0) {
          const latest = fetchedAnnouncements[0];
          const lastSeenId = localStorage.getItem('gtp_last_seen_announcement_id');
          if (lastSeenId !== latest.id) {
            setActiveAnnouncement(latest);
            setShowAnnouncementModal(true);
          }
        }
        
        staticDataFetched.current = true;
      }
    } catch (e) {
      console.error("Gagal memuat resource pegawai", e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const trimmedNik = nik.trim();
      const response = await fetch(API_BASE_URL + '/api/employee/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nik: trimmedNik, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setLoginError(data.error || 'Autentikasi gagal. Silakan periksa NIK dan password.');
        setLoading(false);
        return;
      }
      
      localStorage.setItem('employeeSession', JSON.stringify(data.user));
      setCurrentEmployee(data.user);
      setIsLoggedIn(true);
      triggerToast('Selamat Datang Kembali!');
    } catch (err: any) {
      setLoginError('Koneksi server gagal. Pastikan database backend Anda aktif.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('employeeSession');
    setCurrentEmployee(null);
    setIsLoggedIn(false);
    setActiveTab('home');
    setSelfiePreview(null);
    setNik('');
    setPassword('');
    triggerToast('Anda telah keluar.');
  };

  // Convert files to base64 easily
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
         const dataUrl = reader.result as string;
         const img = new Image();
         img.onload = () => {
             const canvas = document.createElement('canvas');
             let width = img.width;
             let height = img.height;
             const MAX = 1024;
             if (width > MAX) {
                 height = Math.round(height * MAX / width);
                 width = MAX;
             }
             canvas.width = width;
             canvas.height = height;
             const ctx = canvas.getContext('2d');
             if (ctx) {
                 ctx.drawImage(img, 0, 0, width, height);
                 setter(canvas.toDataURL('image/jpeg', 0.6));
                 triggerToast('Berkas foto berhasil diunggah!');
             } else {
                 setter(dataUrl);
             }
         };
         img.onerror = () => setter(dataUrl);
         img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCapturePhoto = async (setter: (val: string) => void) => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 50,
        width: 800,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        direction: 'REAR' as any
      });
      if (image.dataUrl) {
         setter(image.dataUrl);
         triggerToast('Foto berhasil ditangkap!');
      }
    } catch (e: any) {
      console.error("Camera error:", e);
      triggerToast('Gagal membuka kamera: ' + (e.message || 'Error'));
    }
  };

  // Absensi submission handler
  const triggerClockInOrOut = async () => {
    if (!currentEmployee) return;
    
    // Geofencing limit validation
    const maxRadius = officeLocation?.radius || 100;
    if (currentDistance > maxRadius) {
      alert(`Gagal Absen: Lokasi Anda berada di luar jangkauan area penugasan (${currentDistance}m). Radius maksimum yang diizinkan adalah ${maxRadius}m.`);
      return;
    }

    if (!selfiePreview) {
      alert('Gagal Absen: Silakan ambil foto selfie kehadiran terlebih dahulu.');
      return;
    }

    const targetEmployeeId = selectedGroupMemberId || currentEmployee.id;
    const isGroupAttendance = targetEmployeeId !== currentEmployee.id;

    // Enforce schedule timing validation for self-attendance
    if (!isGroupAttendance) {
      if (attendanceModalType === 'masuk') {
        const check = getAttendanceButtonState();
        if (!check.isEnabled) {
          alert(`Gagal Absen Masuk: ${check.reason}`);
          return;
        }
      } else if (attendanceModalType === 'pulang') {
        const check = getClockOutButtonState();
        if (!check.isEnabled) {
          alert(`Gagal Absen Pulang: ${check.reason}`);
          return;
        }
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const currentTimeStr = currentTime.toTimeString().split(' ')[0].substring(0, 5); // "HH:MM"

    // Calculate isLate automatically
    let calculatedIsLate = false;
    const schDetails = getTodayScheduleDetails();
    if (schDetails && schDetails.shiftStart) {
      const [startH, startM] = schDetails.shiftStart.split(':').map(Number);
      const shiftStartObj = new Date();
      shiftStartObj.setHours(startH, startM, 0, 0);
      calculatedIsLate = currentTime.getTime() > shiftStartObj.getTime();
    }

    if (attendanceModalType === 'masuk') {
      // Clock In
      const payload = {
        action: 'addDoc',
        collection: 'attendances',
        data: {
          employeeId: targetEmployeeId,
          attendanceDate: new Date(),
          status: 'Hadir',
          timeIn: currentTimeStr,
          timeOut: null,
          isLate: calculatedIsLate,
          photoUrl: selfiePreview,
        }
      };

      // --- OPTIMISTIC UI UPDATE ---
      const optimisticAtt = {
        id: 'temp-' + Date.now(),
        ...payload.data,
        attendanceDate: payload.data.attendanceDate.toISOString(),
      };
      
      if (!isGroupAttendance) {
        setTodayAttendance(optimisticAtt as any);
        setAttendancesHistory(prev => [optimisticAtt as any, ...prev]);
      } else {
        setTeamAttendances(prev => [optimisticAtt as any, ...prev]);
      }

      triggerToast(`Clock-In Berhasil jam ${currentTimeStr}!`);
      setSelfiePreview(null);
      setSelectedGroupMemberId('');
      setShowAttendanceModal(false);

      // Background sync
      fetch(API_BASE_URL + '/api/sql/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(async res => {
        if (!res.ok) throw new Error("Gagal sinkronisasi");
        const result = await res.json();
        // Update temporary ID with real ID from server
        if (!isGroupAttendance) {
          setAttendancesHistory(prev => prev.map(a => a.id === optimisticAtt.id ? { ...a, id: result.id } : a));
          setTodayAttendance(prev => prev && prev.id === optimisticAtt.id ? { ...prev, id: result.id } : prev);
        } else {
          setTeamAttendances(prev => prev.map(a => a.id === optimisticAtt.id ? { ...a, id: result.id } : a));
        }
      }).catch(err => {
        console.error(err);
        triggerToast('Koneksi terputus. Harap muat ulang untuk memastikan sinkronisasi.');
      });
    } 
    else if (attendanceModalType === 'pulang') {
      // Clock Out
      let targetAttId = todayAttendance?.id;
      
      // --- OPTIMISTIC UI UPDATE ---
      if (!isGroupAttendance && todayAttendance) {
        setTodayAttendance({
          ...todayAttendance,
          timeOut: currentTimeStr,
          photoUrl: selfiePreview || todayAttendance.photoUrl
        });
      }
      // Update history locally
      if (!isGroupAttendance) {
        setAttendancesHistory(prev => prev.map(a => 
          a.employeeId === targetEmployeeId && new Date(a.attendanceDate).toISOString().split('T')[0] === todayStr
            ? { ...a, timeOut: currentTimeStr, photoUrl: selfiePreview || a.photoUrl }
            : a
        ));
      } else {
        setTeamAttendances(prev => prev.map(a => 
          a.employeeId === targetEmployeeId && new Date(a.attendanceDate).toISOString().split('T')[0] === todayStr
            ? { ...a, timeOut: currentTimeStr, photoUrl: selfiePreview || a.photoUrl }
            : a
        ));
      }

      triggerToast(`Clock-Out Berhasil jam ${currentTimeStr}!`);
      setSelfiePreview(null);
      setSelectedGroupMemberId('');
      setShowAttendanceModal(false);

      // Background sync
      (async () => {
        try {
          if (isGroupAttendance) {
            const memberAttRes = await fetch(API_BASE_URL + '/api/sql/rpc', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'getDocs',
                collection: 'attendances',
                filters: [{ field: 'employeeId', operator: '==', value: targetEmployeeId }]
              })
            });
            if (memberAttRes.ok) {
              const history = await memberAttRes.json();
              const memberToday = history.find((a: any) => new Date(a.attendanceDate).toISOString().split('T')[0] === todayStr);
              targetAttId = memberToday?.id;
            }
          }

          if (targetAttId) {
            const payload = {
              action: 'updateDoc',
              collection: 'attendances',
              docId: targetAttId,
              data: {
                timeOut: currentTimeStr,
                photoUrl: selfiePreview
              }
            };
            const res = await fetch(API_BASE_URL + '/api/sql/rpc', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error("Gagal update absen pulang");
          } else {
            // fallback add
            const payload = {
              action: 'addDoc',
              collection: 'attendances',
              data: {
                employeeId: targetEmployeeId,
                attendanceDate: new Date(),
                status: 'Hadir',
                timeIn: currentTimeStr,
                timeOut: null,
                isLate: calculatedIsLate,
                photoUrl: selfiePreview,
              }
            };
            const res = await fetch(API_BASE_URL + '/api/sql/rpc', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error("Gagal fallback absen");
            
            const result = await res.json();
            // Update temporary ID with real ID
            if (!isGroupAttendance) {
              setAttendancesHistory(prev => prev.map(a => a.employeeId === targetEmployeeId && a.id.startsWith('temp-') ? { ...a, id: result.id } : a));
            } else {
              setTeamAttendances(prev => prev.map(a => a.employeeId === targetEmployeeId && a.id.startsWith('temp-') ? { ...a, id: result.id } : a));
            }
          }
        } catch (err) {
          console.error(err);
          triggerToast('Sinkronisasi latar belakang gagal. Akan dicoba lagi.');
        }
      })();
    }
    else if (attendanceModalType === 'lembur_masuk') {
      // Handle Overtime clock-in locally
      setOvertimeTimeIn(currentTimeStr);
      localStorage.setItem('gtp_overtime_time_in', currentTimeStr);
      triggerToast(`Absen Masuk Lembur Berhasil jam ${currentTimeStr}!`);
      setSelfiePreview(null);
      setShowAttendanceModal(false);
    }
    else if (attendanceModalType === 'lembur_pulang') {
      // Handle Overtime clock-out locally
      setOvertimeTimeOut(currentTimeStr);
      localStorage.setItem('gtp_overtime_time_out', currentTimeStr);
      triggerToast(`Absen Selesai Lembur Berhasil jam ${currentTimeStr}!`);
      setSelfiePreview(null);
      setShowAttendanceModal(false);
    }
  };

  // Leave Request Submission
  const submitLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmployee || !leaveReason || !leaveDate) {
      alert('Harap isi semua form cuti/izin.');
      return;
    }

    if (leaveType === 'Sakit' && !leaveAttachment) {
      alert('Mohon unggah surat dokter pendukung untuk pengajuan izin sakit.');
      return;
    }

    setIsSubmittingLeave(true);
    try {
      const payload = {
        action: 'addDoc',
        collection: 'leave_requests',
        data: {
          employeeId: currentEmployee.id,
          requestDate: new Date(leaveDate),
          type: leaveType,
          reason: leaveReason,
          photoUrl: leaveAttachment,
          status: 'Pending'
        }
      };

      const res = await fetch(API_BASE_URL + '/api/sql/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        triggerToast('Pengajuan cuti/izin dikirim!');
        const result = await res.json();
        
        // Targeted local state update
        const newLeave = {
          id: result.id || 'temp-' + Date.now(),
          ...payload.data,
          requestDate: payload.data.requestDate.toISOString()
        };
        setLeaveRequestsHistory(prev => [newLeave as any, ...prev]);

        setLeaveReason('');
        setLeaveDate('');
        setLeaveAttachment(null);
        setActiveTab('home');
      } else {
        const err = await res.json();
        alert('Gagal mengirim pengajuan: ' + err.error);
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  // Overtime Request Submission
  const submitOvertimeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmployee || !overtimeReason || !overtimeDate) {
      alert('Harap lengkapi semua data lembur.');
      return;
    }

    setIsSubmittingOvertime(true);
    try {
      const payload = {
        action: 'addDoc',
        collection: 'overtime_requests',
        data: {
          employeeId: currentEmployee.id,
          requestDate: new Date(overtimeDate),
          reason: overtimeReason,
          hours: Number(overtimeHours),
          status: 'Pending'
        }
      };

      const res = await fetch(API_BASE_URL + '/api/sql/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        triggerToast('Pengajuan lembur dikirim!');
        const result = await res.json();
        
        // Targeted local state update
        const newOvertime = {
          id: result.id || 'temp-' + Date.now(),
          ...payload.data,
          requestDate: payload.data.requestDate.toISOString()
        };
        setOvertimeRequestsHistory(prev => [newOvertime as any, ...prev]);

        setOvertimeReason('');
        setOvertimeDate('');
        setOvertimeHours('2');
        setActiveTab('home');
      } else {
        const err = await res.json();
        alert('Gagal mengajukan lembur: ' + err.error);
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setIsSubmittingOvertime(false);
    }
  };

  // Work Report Submission
  const submitWorkReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmployee || !reportText) {
      alert('Harap isi deskripsi laporan kerja Anda.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        action: 'addDoc',
        collection: 'work_reports',
        data: {
          employeeId: currentEmployee.id,
          date: new Date(),
          description: reportText,
          photoUrl: reportPhoto
        }
      };

      const res = await fetch(API_BASE_URL + '/api/sql/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        triggerToast('Laporan kerja terkirim!');
        const result = await res.json();
        
        // Targeted local state update
        const newReport = {
          id: result.id || 'temp-' + Date.now(),
          ...payload.data,
          date: payload.data.date.toISOString()
        };
        setWorkReportsHistory(prev => [newReport as any, ...prev]);

        setReportText('');
        setReportPhoto(null);
        setActiveTab('home');
      } else {
        const err = await res.json();
        alert('Gagal mengirim laporan: ' + err.error);
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };



  // Check if today is leave/sick or rest day
  const getTodayStatusInfo = () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    // Check if approved leave request is active today
    const hasApprovedLeave = leaveRequestsHistory.some(req => {
      if (req.status !== 'Approved') return false;
      const reqDateStr = typeof req.requestDate === 'string' 
          ? req.requestDate.split('T')[0] 
          : new Date(req.requestDate).toISOString().split('T')[0];
      return reqDateStr === todayStr;
    });

    // Check today's schedule off-day
    const todaySchedule = schedulesList.find(sch => sch.date === todayStr);
    
    const isTodayOffDay = todaySchedule?.isOffDay === true;

    return {
      isRestState: hasApprovedLeave || isTodayOffDay,
      hasClockedOut: todayAttendance?.timeOut !== null && todayAttendance?.timeOut !== undefined,
      isApprovedLeave: hasApprovedLeave
    };
  };

  // Dynamic time of day greetings with revised status messages
  const getGreeting = () => {
    const hours = currentTime.getHours();
    const statusInfo = getTodayStatusInfo();

    // 1. If leave, sick or off day:
    if (statusInfo.isRestState) {
      return {
        text: statusInfo.isApprovedLeave ? 'Sedang Cuti / Izin' : 'Waktu Istirahat 🏖️',
        sub: statusInfo.isApprovedLeave ? 'Pengajuan cuti/izin Anda hari ini disetujui.' : 'Selamat menikmati waktu istirahat anda.'
      };
    }

    // 2. If finished clocked out:
    if (statusInfo.hasClockedOut) {
      return {
        text: 'Tugas Selesai ✅',
        sub: 'Selamat beristirahat, hati-hati dijalan.'
      };
    }

    // 3. Normal shift active greetings
    if (hours >= 4 && hours < 11) {
      return { text: 'Selamat Pagi 🌅', sub: 'Semangat Siaga Pagi, Tetap Waspada!' };
    } else if (hours >= 11 && hours < 15) {
      return { text: 'Selamat Siang ☀️', sub: 'Jaga Kondisi Fisik, Tetap Terhidrasi!' };
    } else if (hours >= 15 && hours < 18.5) {
      return { text: 'Selamat Sore 🌇', sub: 'Persiapan Apel Sore & Serah Terima Tugas!' };
    } else {
      return { text: 'Selamat Malam 🌙', sub: 'Patroli Diperketat, Nyalakan Senter!' };
    }
  };

  // Attendance timing validation helpers
  const getTodayScheduleDetails = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();
    
    const sch = schedulesList.find(s => {
      const sDate = new Date(s.date);
      return sDate.getFullYear() === y && sDate.getMonth() === m && sDate.getDate() === d;
    });
    
    return {
      shiftStart: sch?.shiftStart || "08:00",
      shiftEnd: sch?.shiftEnd || "16:00",
      isOffDay: sch?.isOffDay || false,
      shiftName: sch?.shiftName || "Shift Reguler"
    };
  };

  const getAttendanceButtonState = () => {
    const sch = getTodayScheduleDetails();
    if (sch.isOffDay) {
      return { isEnabled: false, reason: "Hari ini adalah jadwal libur (Off Day)." };
    }

    const [startH, startM] = sch.shiftStart.split(':').map(Number);
    if (isNaN(startH)) return { isEnabled: false, reason: "Format jadwal salah atau sedang libur." };
    const startObj = new Date(currentTime.getTime());
    startObj.setHours(startH, startM, 0, 0);

    const [endH, endM] = sch.shiftEnd.split(':').map(Number);
    const endObj = new Date(currentTime.getTime());
    endObj.setHours(endH, endM, 0, 0);

    if (endObj.getTime() <= startObj.getTime()) {
       if (currentTime.getHours() < endH || (currentTime.getHours() === endH && currentTime.getMinutes() <= endM)) {
         startObj.setDate(startObj.getDate() - 1);
       } else {
         endObj.setDate(endObj.getDate() + 1);
       }
    }

    if (currentTime.getTime() >= endObj.getTime()) {
      return { 
        isEnabled: false, 
        reason: `Shift telah berakhir (${sch.shiftEnd}). Anda dihitung mangkir karena tidak absen masuk.` 
      };
    }

    const timeDiffMinutes = (startObj.getTime() - currentTime.getTime()) / (60 * 1000);
    if (timeDiffMinutes > 10) {
      return { 
        isEnabled: false, 
        reason: `Tombol hanya aktif mulai 10 menit sebelum jam masuk shift (${sch.shiftStart}).` 
      };
    }

    return { isEnabled: true, reason: "" };
  };

  const getClockOutButtonState = () => {
    const sch = getTodayScheduleDetails();
    if (sch.isOffDay) {
      return { isEnabled: false, reason: "Hari ini adalah jadwal libur (Off Day)." };
    }

    const [startH, startM] = sch.shiftStart.split(':').map(Number);
    if (isNaN(startH)) return { isEnabled: false, reason: "Format jadwal salah atau sedang libur." };
    const startObj = new Date(currentTime.getTime());
    startObj.setHours(startH, startM, 0, 0);

    const [endH, endM] = sch.shiftEnd.split(':').map(Number);
    const endObj = new Date(currentTime.getTime());
    endObj.setHours(endH, endM, 0, 0);

    if (endObj.getTime() <= startObj.getTime()) {
       if (currentTime.getHours() < endH || (currentTime.getHours() === endH && currentTime.getMinutes() <= endM)) {
         startObj.setDate(startObj.getDate() - 1);
       } else {
         endObj.setDate(endObj.getDate() + 1);
       }
    }

    const hasPassedShiftEnd = currentTime.getTime() >= endObj.getTime();

    if (!hasPassedShiftEnd) {
      return { 
        isEnabled: false, 
        reason: `Tombol hanya aktif setelah memasuki waktu pulang (${sch.shiftEnd}).` 
      };
    }

    return { isEnabled: true, reason: "" };
  };

  // Overtime validation
  const getApprovedOvertimeForToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();
    return overtimeRequestsHistory.find(req => {
      const reqDate = new Date(req.requestDate);
      return reqDate.getFullYear() === y && reqDate.getMonth() === m && reqDate.getDate() === d && req.status === 'Approved';
    });
  };

  const isOvertimeApproved = !!getApprovedOvertimeForToday();

  const getMemberTodayAttendance = (memberId: string) => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();
    return teamAttendances.find(a => {
      if (a.employeeId !== memberId) return false;
      const aDate = new Date(a.attendanceDate);
      return aDate.getFullYear() === y && aDate.getMonth() === m && aDate.getDate() === d;
    });
  };

  const handleOpenAttendanceModal = (type: 'masuk' | 'pulang' | 'lembur_masuk' | 'lembur_pulang') => {
    if (currentEmployee?.status && currentEmployee.status !== 'Aktif') {
      alert(`Gagal: Akun Anda tidak aktif (${currentEmployee.status})`);
      return;
    }
    if (type === 'masuk') {
      const authState = getAttendanceButtonState();
      if (!authState.isEnabled) {
        alert(authState.reason);
        return;
      }
    } 
    else if (type === 'pulang') {
      const authState = getClockOutButtonState();
      if (!authState.isEnabled) {
        alert(authState.reason);
        return;
      }
    }

    setSelfiePreview(null);
    setAttendanceModalType(type);
    setShowAttendanceModal(true);
  };

  const handleAcknowledgeAnnouncement = () => {
    if (activeAnnouncement) {
      localStorage.setItem('gtp_last_seen_announcement_id', activeAnnouncement.id);
      setShowAnnouncementModal(false);
      triggerToast('Komando diterima! Selamat bertugas.');
    }
  };

  const greetingObj = getGreeting();
  const scheduleDetails = getTodayScheduleDetails();

  // Show full history arrays to prevent logs from disappearing
  const filteredLeaveRequests = leaveRequestsHistory;
  const filteredOvertimeRequests = overtimeRequestsHistory;
  const filteredWorkReports = workReportsHistory;


  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current > 0 && window.scrollY <= 0) {
      const currentY = e.touches[0].clientY;
      const diff = currentY - touchStartY.current;
      if (diff > 0) {
        setPullY(Math.min(diff, 100));
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullY > 60 && !isRefreshing) {
      setIsRefreshing(true);
      if (currentEmployee) {
        await fetchEmployeeResources(true);
      }
      setIsRefreshing(false);
    }
    setPullY(0);
    touchStartY.current = 0;
  };

  return (
    <div className="h-screen max-h-screen bg-slate-100 flex justify-center font-sans selection:bg-[#0C2461]/20 text-slate-800 overflow-hidden">
      
      {/* Edge-to-Edge Fluid Responsive Mobile Wrapper (Centered Max-Width Container on Desktop) */}
      <div 
        className="w-full max-w-md bg-[#F8FAFC] h-full max-h-full flex flex-col relative shadow-lg md:border-x border-slate-200/50 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull to refresh visual */}
        <div 
          className="absolute top-0 left-0 w-full flex justify-center items-center overflow-hidden transition-all duration-200 z-50 bg-transparent"
          style={{ height: `${pullY}px` }}
        >
          <div className={`flex items-center gap-2 text-slate-500 ${isRefreshing ? 'animate-pulse' : ''}`}>
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullY * 2}deg)` }} />
            <span className="text-xs font-bold font-mono uppercase">{isRefreshing ? 'Memperbarui...' : pullY > 60 ? 'Lepaskan' : 'Tarik ke bawah'}</span>
          </div>
        </div>

        

        {/* Main Content Wrapper for PTR */}
        <div style={{ transform: `translateY(${pullY}px)`, transition: (pullY === 0 || isRefreshing) ? 'transform 0.2s' : 'none', height: '100%', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        {/* Toast Notification */}
        <AnimatePresence>
          {activeToast && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 16, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-950 text-white border border-slate-800 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-2.5 w-[90%] max-w-xs text-xs font-semibold backdrop-blur-md"
            >
              <div className="w-5 h-5 bg-[#14B8A6]/20 text-[#14B8A6] rounded-full flex items-center justify-center font-black">✓</div>
              <span>{activeToast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- APP HEADER --- */}
        <header className="bg-gradient-to-r from-[#0C2461] to-[#1E3A8A] text-white px-5 py-4 pb-5 border-b border-indigo-950/40 relative overflow-hidden shrink-0 z-10 flex justify-between items-center">
          <div className="absolute inset-0 bg-grid-white/[0.03] pointer-events-none" />
          
          <div className="flex items-center gap-2.5 relative z-10">
            <div className="w-9 h-9 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center font-black text-sm text-white shadow-inner border border-white/20">
              G
            </div>
            <div>
              <h1 className="text-sm font-black tracking-widest text-slate-100 flex items-center gap-1">
                GTP MOBILE
                <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              </h1>
              <p className="text-[9px] text-[#14B8A6] font-bold tracking-widest uppercase">Garuda Trisula Perkasa</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 relative z-10">
            {isLoggedIn && (
              <button 
                onClick={handleLogout}
                className="text-red-300 hover:text-white bg-red-500/10 hover:bg-red-500/30 border border-red-500/25 p-2 rounded-xl transition-all cursor-pointer"
                title="Keluar"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </header>

        {/* --- MAIN PAGE CONTENT --- */}
        <main className="flex-1 flex flex-col min-h-0 bg-[#F8FAFC] overflow-hidden relative">
          
          {!isLoggedIn ? (
            /* --- 1. AUTH / LOGIN SCREEN --- */
            <div className="flex-grow flex flex-col justify-center overflow-y-auto px-6 py-10 space-y-8 animate-fade-in relative">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-gradient-to-tr from-[#0C2461] to-[#1E3A8A] rounded-[28px] mx-auto flex items-center justify-center shadow-xl border-4 border-white ring-4 ring-slate-100">
                  <Smartphone className="w-10 h-10 text-[#14B8A6]" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-black tracking-tight text-[#0C2461] uppercase">Aplikasi Pegawai</h2>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Masuk ke portal operasional Gada Pratama. Gunakan NIK & password Anda.
                  </p>
                </div>
              </div>

              {loginError && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold flex items-start gap-2.5 shadow-sm">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#0C2461] font-mono">Nomor Induk Karyawan (NIK)</label>
                  <input 
                    required
                    type="text"
                    className="w-full bg-white border border-slate-200 focus:border-[#0C2461] focus:ring-2 focus:ring-[#0C2461]/20 rounded-xl px-4 py-3.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 font-mono font-semibold shadow-sm"
                    placeholder="Contoh: GT111"
                    value={nik}
                    onChange={(e) => setNik(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#0C2461] font-mono">Kata Sandi Akun</label>
                  <input 
                    required
                    type="password"
                    className="w-full bg-white border border-slate-200 focus:border-[#0C2461] focus:ring-2 focus:ring-[#0C2461]/20 rounded-xl px-4 py-3.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 font-semibold shadow-sm"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#0C2461] to-[#1E3A8A] hover:opacity-90 active:scale-95 text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md shadow-indigo-900/20 cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Memverifikasi...
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-[#14B8A6]" />
                      Masuk Aplikasi
                    </>
                  )}
                </button>
              </form>



            </div>
          ) : currentEmployee && currentEmployee.status && currentEmployee.status !== 'Aktif' ? (
            /* --- 3. BLOCKED INACTIVE ACCOUNT SCREEN --- */
            <div className="p-6 max-w-sm mx-auto text-center space-y-8 animate-fade-in my-8 bg-white border border-red-100 rounded-[32px] shadow-lg shadow-indigo-950/10">
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-100 shadow-inner animate-pulse">
                <ShieldAlert className="w-10 h-10" />
              </div>
              
              <div className="space-y-3">
                <h2 className="text-base font-black text-[#0C2461] uppercase tracking-tight">Akses Aplikasi Diblokir</h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Sistem mendeteksi bahwa status keanggotaan Anda saat ini dinyatakan <span className="font-bold text-red-600 uppercase font-mono">Tidak Aktif</span> oleh bagian HRD PT. GTP.
                </p>
              </div>

              <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 text-left space-y-3">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">Detail Penangguhan:</div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-200">
                    <span className="text-slate-500">Alasan Status:</span>
                    <span className="font-bold text-red-600 uppercase font-mono">
                      {currentEmployee.status}
                    </span>
                  </div>
                  <div className="space-y-1 py-1">
                    <span className="text-slate-500 block">Dampak Akses:</span>
                    <span className="text-slate-600 leading-relaxed text-[11px] block">
                      Seluruh fungsi pencatatan kehadiran (Absensi Geofencing), klaim lembur, pengajuan izin, dan laporan harian dinonaktifkan sepenuhnya demi alasan keamanan data perusahaan.
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 leading-relaxed">
                Jika Anda merasa ini adalah kesalahan administratif atau jika masa sanksi telah berakhir, silakan hubungi Admin HRD untuk mengaktifkan kembali akun Anda.
              </div>

              <button
                onClick={handleLogout}
                className="w-full bg-[#0C2461] hover:bg-[#1E3A8A] text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 cursor-pointer shadow-md"
              >
                Keluar dari Aplikasi
              </button>
            </div>
          ) : (
            /* --- 2. LOGGED IN PORTAL WORKSPACE --- */
            <div className="flex-grow flex flex-col min-h-0 relative overflow-hidden">
              
              {/* BACK TO HOME SHORTCUT COMPONENT */}
              {activeTab !== 'home' && (
                <div className="p-4.5 pb-0 flex-shrink-0">
                  <button 
                    onClick={() => { setActiveTab('home'); setSelfiePreview(null); }}
                    className="flex items-center gap-1.5 text-xs text-[#0C2461] hover:text-[#1E3A8A] font-extrabold transition-colors bg-white px-3.5 py-2 rounded-xl shadow-sm border border-slate-200/60 self-start cursor-pointer active:scale-95"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-red-600 stroke-[3px]" />
                    Kembali ke Beranda
                  </button>
                </div>
              )}

              {/* === TAB 1: HOME (MAIN DASHBOARD) === */}
              {activeTab === 'home' && (
                <div className="flex-1 overflow-y-auto p-4.5 pb-24 space-y-5 animate-fade-in no-scrollbar min-h-0">
                  
                  {/* MODERN PROFILE COMPACT DECK */}
                  <div className="bg-white border border-slate-100 p-4 rounded-3xl flex items-center gap-3.5 relative overflow-hidden shadow-sm shadow-indigo-900/5">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-tr from-[#0C2461]/5 to-[#14B8A6]/5 rounded-full blur-xl pointer-events-none" />
                    
                    <div className="relative shrink-0">
                      {currentEmployee?.profilePicUrl ? (
                        <img 
                          src={currentEmployee.profilePicUrl} 
                          alt="Profil" 
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-[#0C2461]/20 shadow-md shadow-indigo-900/10"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-gradient-to-br from-[#0C2461] to-[#1E3A8A] text-[#14B8A6] rounded-2xl flex items-center justify-center font-black text-xl border border-white/20 shadow-md">
                          {currentEmployee?.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                    </div>

                    <div className="flex-grow space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-black text-[#0C2461]">{currentEmployee?.name}</h3>
                        {currentEmployee?.role && currentEmployee.role.toLowerCase().includes('ketua') && (
                          <span className="px-2 py-0.5 bg-red-100 border border-red-200 text-red-600 rounded-full text-[8px] font-black uppercase tracking-wider font-mono shrink-0">
                            Ketua Regu
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono font-bold tracking-wider">{currentEmployee?.nik} • {currentEmployee?.role}</p>
                      
                      {officeLocation && (
                        <span className="text-[9px] text-[#14B8A6] flex items-center gap-1 font-extrabold uppercase tracking-wide">
                          <Building className="w-3 h-3 text-[#0C2461]" /> {officeLocation.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* DYNAMIC TIME & REALTIME CLOCK CARD */}
                  <div className="bg-gradient-to-b from-white to-slate-50 border border-slate-200/80 rounded-3xl p-5 text-center relative overflow-hidden shadow-sm shadow-indigo-900/5">
                    
                    {/* Floating active signal indicator */}
                    <div className="absolute top-0 left-0 w-2 h-2 bg-emerald-500 rounded-full m-3 animate-pulse" />
                    <div className="absolute top-0 right-0 w-2 h-2 bg-[#14B8A6] rounded-full m-3" />

                    <div className="space-y-1">
                      <span className="px-2.5 py-1 rounded-full bg-[#0C2461]/5 text-[#0C2461] text-[9px] font-black uppercase tracking-widest font-mono inline-block">
                        {greetingObj.text}
                      </span>
                      <p className="text-[11px] text-slate-600 font-black italic leading-tight">{greetingObj.sub}</p>
                    </div>

                    {/* Interactive digital clock */}
                    <div className="mt-4 py-2.5 bg-white rounded-2xl shadow-inner border border-slate-100 flex items-center justify-center gap-1.5">
                      <Clock className="w-4 h-4 text-red-600 animate-pulse" />
                      <h2 className="text-2xl font-black text-[#0C2461] tracking-tight font-mono">
                        {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        <span className="text-xs font-semibold text-slate-400 ml-1">WIB</span>
                      </h2>
                    </div>

                    <p className="text-[9px] text-slate-400 font-black tracking-widest uppercase font-mono mt-2">
                      {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>



                    {/* Shift Attendance Roster Summary */}
                    <div className="mt-4 pt-4 border-t border-slate-200/60 grid grid-cols-2 gap-4 text-left">
                      <div className="space-y-0.5 bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block font-mono">Clock In</span>
                        <strong className="text-xs text-slate-800 font-mono block">
                          {todayAttendance?.timeIn ? `${todayAttendance.timeIn} WIB` : '--:--'}
                        </strong>
                      </div>
                      <div className="space-y-0.5 bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block font-mono">Clock Out</span>
                        <strong className="text-xs text-slate-800 font-mono block">
                          {todayAttendance?.timeOut ? `${todayAttendance.timeOut} WIB` : '--:--'}
                        </strong>
                      </div>
                    </div>

                    {/* OVERTIME SHIFT RECORD (IF APPLICABLE) */}
                    {isOvertimeApproved && (
                      <div className="mt-3 pt-3 border-t border-dashed border-slate-200 grid grid-cols-2 gap-4 text-left bg-[#14B8A6]/5 p-2 rounded-xl">
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-black text-teal-700 uppercase tracking-widest block font-mono">Lembur In</span>
                          <strong className="text-xs text-teal-900 font-mono block">
                            {overtimeTimeIn ? `${overtimeTimeIn} WIB` : '--:--'}
                          </strong>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-black text-teal-700 uppercase tracking-widest block font-mono">Lembur Out</span>
                          <strong className="text-xs text-teal-900 font-mono block">
                            {overtimeTimeOut ? `${overtimeTimeOut} WIB` : '--:--'}
                          </strong>
                        </div>
                      </div>
                    )}

                    {/* DYNAMIC ATTENDANCE FLOW TRIGGER BUTTON */}
                    <div className="mt-4">
                      {getTodayStatusInfo().isRestState ? (
                        /* Case 1: Today is Off day or Approved Leave */
                        <div className="w-full bg-slate-100 text-slate-500 py-3.5 px-4 rounded-2xl text-xs font-black uppercase tracking-widest border border-slate-200 flex items-center justify-center gap-1.5">
                          <CalendarDays className="w-4 h-4 text-slate-400" />
                          <span>{getTodayStatusInfo().isApprovedLeave ? 'Sedang Cuti / Izin' : 'Hari Ini Libur (Jadwal)'}</span>
                        </div>
                      ) : !todayAttendance ? (
                        /* Case 2: Clock-In is needed */
                        <div className="space-y-2">
                          {getAttendanceButtonState().isEnabled ? (
                            <button
                              onClick={() => handleOpenAttendanceModal('masuk')}
                              className="w-full py-4 px-4 bg-[#14B8A6] hover:bg-[#14B8A6]/90 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md border-b-4 border-teal-700 active:scale-95"
                            >
                              <MapPin className="w-4.5 h-4.5 text-slate-950 animate-bounce" />
                              <span>Masuk Shift (Clock-In)</span>
                            </button>
                          ) : (
                            <div className="w-full bg-slate-100 border border-slate-200/60 p-4 rounded-2xl text-center space-y-1">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1.5 font-mono">
                                <Lock className="w-3.5 h-3.5 text-slate-400" />
                                Absen Masuk Belum Aktif
                              </span>
                              <p className="text-[10px] text-slate-500 font-bold">{getAttendanceButtonState().reason}</p>
                            </div>
                          )}
                        </div>
                      ) : !todayAttendance.timeOut ? (
                        /* Case 3: Clock-In is successful, waiting for Clock-Out */
                        <div className="space-y-2">
                          <div className="w-full bg-emerald-50 text-emerald-800 py-3.5 px-4 rounded-2xl text-xs font-black uppercase tracking-widest border border-emerald-100 flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Berhasil Absen Masuk</span>
                          </div>
                          
                          {getClockOutButtonState().isEnabled ? (
                            <button
                              onClick={() => handleOpenAttendanceModal('pulang')}
                              className="w-full py-4 px-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md border-b-4 border-red-800 active:scale-95"
                            >
                              <LogOut className="w-4.5 h-4.5 text-white" />
                              <span>Selesai Shift (Clock-Out)</span>
                            </button>
                          ) : (
                            <div className="w-full bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-center space-y-1">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1.5 font-mono">
                                <Lock className="w-3.5 h-3.5 text-slate-400" />
                                Absen Pulang Belum Aktif
                              </span>
                              <p className="text-[10px] text-slate-500 font-bold">{getClockOutButtonState().reason}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Case 4: Normal shift completed */
                        <div className="space-y-2.5">
                          <div className="w-full bg-slate-200 text-slate-500 py-3.5 px-4 rounded-2xl text-xs font-black uppercase tracking-widest border border-slate-300 flex items-center justify-center gap-2">
                            <Check className="w-4 h-4 text-slate-400" />
                            <span>Absensi Dinas Harian Lengkap</span>
                          </div>

                          {/* OVERTIME TRIGGERS: Show if approved overtime today */}
                          {isOvertimeApproved && (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 space-y-2">
                              <span className="text-[9px] font-black tracking-widest text-amber-800 uppercase font-mono block">Dinas Lembur Hari Ini Disetujui ✓</span>
                              
                              {!overtimeTimeIn ? (
                                <button
                                  onClick={() => handleOpenAttendanceModal('lembur_masuk')}
                                  className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
                                >
                                  <Flame className="w-4 h-4 text-slate-950 animate-pulse" />
                                  <span>Mulai Lembur (Clock-In Lembur)</span>
                                </button>
                              ) : !overtimeTimeOut ? (
                                <div className="space-y-2">
                                  <div className="w-full bg-emerald-50 text-emerald-800 py-2.5 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-emerald-100 flex items-center justify-center gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Sedang Bertugas Lembur</span>
                                  </div>
                                  <button
                                    onClick={() => handleOpenAttendanceModal('lembur_pulang')}
                                    className="w-full py-3 px-4 bg-[#0C2461] hover:bg-[#1E3A8A] text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
                                  >
                                    <LogOut className="w-4 h-4 text-[#14B8A6]" />
                                    <span>Selesai Lembur (Clock-Out Lembur)</span>
                                  </button>
                                </div>
                              ) : (
                                <div className="w-full bg-slate-100 text-slate-500 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider border border-slate-200 flex items-center justify-center gap-2">
                                  <Check className="w-4 h-4 text-slate-400" />
                                  <span>Seluruh Tugas Lembur Selesai</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* PANEL KOMANDO REGU (DANRU / KETUA REGU ONLY) */}
                  {currentEmployee?.role && (currentEmployee.role.toLowerCase().includes('ketua') || currentEmployee.role.toLowerCase().includes('leader') || currentEmployee.role.toLowerCase().includes('danru')) && allSubDeptEmployees.length > 0 && (
                    <div className="bg-gradient-to-br from-slate-900 to-[#0C2461] border border-indigo-950 text-white rounded-3xl p-5 space-y-4 shadow-xl relative overflow-hidden">
                      {/* Decorative background grid */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#14B8A6]/10 to-transparent rounded-full blur-xl pointer-events-none" />
                      
                      <div className="flex items-center justify-between border-b border-indigo-900/50 pb-2.5">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-[#14B8A6]" />
                          <span className="text-[10px] font-black tracking-widest uppercase font-mono text-[#14B8A6]">Panel Komando Regu</span>
                        </div>
                        <span className="px-2 py-0.5 bg-red-600/30 text-red-400 border border-red-500/20 rounded-full text-[8px] font-black uppercase tracking-wider font-mono">
                          Mode Danru
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-white">Kesiapan Personel Regu</h4>
                        <p className="text-[9px] text-slate-400 leading-snug">Absenkan anggota regu Anda yang bertugas di lapangan hari ini secara kolektif.</p>
                      </div>

                      <div className="space-y-3 mt-2 max-h-60 overflow-y-auto pr-1 no-scrollbar">
                        {allSubDeptEmployees.map((member) => {
                          const att = getMemberTodayAttendance(member.id);
                          return (
                            <div key={member.id} className="bg-slate-950/40 border border-indigo-950/50 p-3 rounded-2xl flex items-center justify-between gap-2.5">
                              <div className="flex items-center gap-2.5">
                                {member.profilePicUrl ? (
                                  <img 
                                    src={member.profilePicUrl} 
                                    alt={member.name} 
                                    className="w-9 h-9 rounded-xl object-cover border border-white/10"
                                  />
                                ) : (
                                  <div className="w-9 h-9 bg-indigo-900/50 text-indigo-200 rounded-xl flex items-center justify-center font-bold text-xs font-mono">
                                    {member.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <strong className="text-[11px] font-black text-slate-100 block">{member.name}</strong>
                                  <span className="text-[9px] text-slate-400 font-mono block">{member.nik} • {member.role}</span>
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-1.5">
                                {/* Status Badge */}
                                {!att ? (
                                  <span className="text-[8px] font-black px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/25 rounded-full uppercase tracking-wider font-mono">
                                    Belum Absen
                                  </span>
                                ) : !att.timeOut ? (
                                  <span className="text-[8px] font-black px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-full uppercase tracking-wider font-mono">
                                    Siaga ({att.timeIn})
                                  </span>
                                ) : (
                                  <span className="text-[8px] font-black px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 rounded-full uppercase tracking-wider font-mono">
                                    Selesai Shift ({att.timeIn}-{att.timeOut})
                                  </span>
                                )}

                                {/* Action Buttons */}
                                {!att ? (
                                  <button
                                    onClick={() => {
                                      setSelectedGroupMemberId(member.id);
                                      handleOpenAttendanceModal('masuk');
                                    }}
                                    className="px-2.5 py-1 bg-[#14B8A6] hover:bg-[#14B8A6]/90 text-slate-950 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95 animate-pulse"
                                  >
                                    Absenkan Masuk
                                  </button>
                                ) : !att.timeOut ? (
                                  <button
                                    onClick={() => {
                                      setSelectedGroupMemberId(member.id);
                                      handleOpenAttendanceModal('pulang');
                                    }}
                                    className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
                                  >
                                    Absenkan Pulang
                                  </button>
                                ) : (
                                  <span className="text-[8px] text-slate-500 font-mono font-bold flex items-center gap-1">
                                    <Check className="w-3 h-3 text-[#14B8A6]" /> Lengkap
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* COGNITIVE CORE MENU GRID (WITHOUT SLIP GAJI) */}
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-black tracking-widest text-[#0C2461] uppercase font-mono">Pilar Menu Operasional</h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      
                      {/* Interactive Trigger Button for Absen Modal */}
                      <button 
                        onClick={() => {
                          if (getTodayStatusInfo().isRestState) {
                            alert("Hari ini Anda libur / sedang cuti.");
                            return;
                          }
                          if (todayAttendance?.timeIn && todayAttendance?.timeOut) {
                            if (isOvertimeApproved) {
                              if (!overtimeTimeIn) {
                                handleOpenAttendanceModal('lembur_masuk');
                              } else if (!overtimeTimeOut) {
                                handleOpenAttendanceModal('lembur_pulang');
                              } else {
                                alert("Absensi Anda hari ini sudah lengkap.");
                              }
                            } else {
                              alert("Absensi Anda hari ini sudah lengkap.");
                            }
                            return;
                          }
                          handleOpenAttendanceModal(!todayAttendance ? 'masuk' : 'pulang');
                        }}
                        className="bg-white hover:bg-slate-50 border border-slate-200/80 p-4 rounded-3xl text-left shadow-sm hover:border-[#14B8A6] transition-all group flex flex-col justify-between h-28 cursor-pointer relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-12 h-12 bg-teal-500/5 rounded-full translate-x-3 -translate-y-3" />
                        <div className="w-9 h-9 rounded-xl bg-teal-500/10 flex items-center justify-center text-[#14B8A6] group-hover:bg-[#14B8A6] group-hover:text-slate-950 transition-all border border-teal-500/15">
                          <MapPin className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <strong className="text-xs font-bold text-slate-950 block">Absensi GPS</strong>
                          <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider font-mono">Modal Pop-up</span>
                        </div>
                      </button>

                      <button 
                        onClick={() => setActiveTab('izin')}
                        className="bg-white hover:bg-slate-50 border border-slate-200/80 p-4 rounded-3xl text-left shadow-sm hover:border-indigo-500 transition-all group flex flex-col justify-between h-28 cursor-pointer relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-500/5 rounded-full translate-x-3 -translate-y-3" />
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all border border-indigo-500/15">
                          <FileText className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <strong className="text-xs font-bold text-slate-950 block">Izin & Cuti</strong>
                          <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider font-mono">Klaim Tidak Hadir</span>
                        </div>
                      </button>

                      <button 
                        onClick={() => setActiveTab('lembur')}
                        className="bg-white hover:bg-slate-50 border border-slate-200/80 p-4 rounded-3xl text-left shadow-sm hover:border-amber-500 transition-all group flex flex-col justify-between h-28 cursor-pointer relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/5 rounded-full translate-x-3 -translate-y-3" />
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-slate-950 transition-all border border-amber-500/15">
                          <Clock className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <strong className="text-xs font-bold text-slate-950 block">Kerja Lembur</strong>
                          <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider font-mono">Overtime Jam</span>
                        </div>
                      </button>

                      <button 
                        onClick={() => setActiveTab('jadwal')}
                        className="bg-white hover:bg-slate-50 border border-slate-200/80 p-4 rounded-3xl text-left shadow-sm hover:border-sky-500 transition-all group flex flex-col justify-between h-28 cursor-pointer relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-12 h-12 bg-sky-500/5 rounded-full translate-x-3 -translate-y-3" />
                        <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-all border border-sky-500/15">
                          <Calendar className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <strong className="text-xs font-bold text-slate-950 block">Jadwal Shift</strong>
                          <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider font-mono">Kalender Tugas</span>
                        </div>
                      </button>

                    </div>
                  </div>

                  {/* ACTIVE LIVE ANNOUNCEMENT COMMAND */}
                  <div className="bg-gradient-to-r from-red-50 to-rose-100/60 border border-red-200 rounded-3xl p-4.5 space-y-2 relative overflow-hidden">
                    <div className="absolute top-0 right-0 translate-x-3 -translate-y-2 text-red-500/10">
                      <ShieldAlert className="w-24 h-24 stroke-[4px]" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[8px] font-black uppercase tracking-widest font-mono">KOMANDO RESMI</span>
                      <Flame className="w-3.5 h-3.5 text-red-600 animate-bounce" />
                    </div>
                    <h4 className="text-xs font-black text-slate-950">{activeAnnouncement ? activeAnnouncement.title : 'Instruksi Pengamanan Patroli Malam'}</h4>
                    <p className="text-[10px] text-slate-700 leading-relaxed text-justify">
                      {activeAnnouncement ? activeAnnouncement.content : 'Seluruh personel Regu Gada Pratama diwajibkan mengaktifkan geofencing GPS mobile dan mengunggah laporan patroli berserta foto di pos titik rawan minimal 3 kali setiap shift malam berlangsung.'}
                    </p>
                  </div>

                </div>
              )}

              {/* === TAB 2: LEAVE / PERIZINAN === */}
              {activeTab === 'izin' && (
                <div className="flex-1 overflow-y-auto p-4.5 pb-28 space-y-5 animate-fade-in no-scrollbar min-h-0">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-[#0C2461] uppercase tracking-tight">Pengajuan Cuti & Sakit</h3>
                    <p className="text-xs text-slate-500">Setiap pengajuan sakit WAJIB melampirkan surat dokter resmi.</p>
                  </div>

                  <form onSubmit={submitLeaveRequest} className="space-y-4 bg-white border border-slate-200/80 p-4.5 rounded-3xl shadow-sm">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">Tipe Pengajuan</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setLeaveType('Izin')}
                          className={`py-3.5 rounded-xl border text-xs font-black transition-all cursor-pointer uppercase tracking-widest ${
                            leaveType === 'Izin' 
                              ? 'bg-[#0C2461]/10 border-[#0C2461] text-[#0C2461]' 
                              : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          Izin / Cuti
                        </button>
                        <button
                          type="button"
                          onClick={() => setLeaveType('Sakit')}
                          className={`py-3.5 rounded-xl border text-xs font-black transition-all cursor-pointer uppercase tracking-widest ${
                            leaveType === 'Sakit' 
                              ? 'bg-red-50 border-red-500 text-red-600' 
                              : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          Sakit Medis
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-[#0C2461] font-mono">Tanggal Mulai Absen</label>
                      <input 
                        required
                        type="date"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#0C2461] focus:ring-1 focus:ring-[#0C2461] rounded-xl px-4 py-3 text-xs text-slate-800 outline-none transition-all font-bold font-mono shadow-inner"
                        value={leaveDate}
                        onChange={(e) => setLeaveDate(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-[#0C2461] font-mono">Alasan Ketidakhadiran</label>
                      <textarea
                        required
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#0C2461] focus:ring-1 focus:ring-[#0C2461] rounded-xl px-4 py-3 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 leading-relaxed font-bold shadow-inner"
                        placeholder="Tulis alasan tidak bertugas secara mendetail..."
                        value={leaveReason}
                        onChange={(e) => setLeaveReason(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
                        {leaveType === 'Sakit' ? 'Surat Dokter (Wajib)' : 'Bukti Pendukung (Opsional)'}
                      </label>
                      
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => handleCapturePhoto(setLeaveAttachment)} className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all cursor-pointer flex items-center gap-2 shadow-sm">
  <Camera className="w-4 h-4 text-[#14B8A6]" />
  <span>Ambil Foto</span>
</button>
                        {leaveAttachment && <span className="text-[10px] text-emerald-600 font-black flex items-center gap-1">✓ Berkas Siap</span>}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingLeave}
                      className="w-full mt-2 py-3.5 bg-gradient-to-r from-[#0C2461] to-[#1E3A8A] hover:opacity-90 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-md cursor-pointer transition-all border-b-4 border-indigo-900"
                    >
                      {isSubmittingLeave ? 'Mengirim Data...' : 'Kirim Pengajuan Izin'}
                    </button>
                  </form>

                  {/* PREV REQS HISTORY */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black tracking-widest text-[#0C2461] uppercase font-mono">Riwayat Pengajuan Anda</h4>
                    
                    {filteredLeaveRequests.length === 0 ? (
                      <p className="text-[10px] text-slate-400 text-center py-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm font-bold">Belum ada riwayat perizinan.</p>
                    ) : (
                      <div className="space-y-2">
                        {filteredLeaveRequests.map((item) => (
                          <div key={item.id} className="bg-white border border-slate-100 p-3.5 rounded-2xl flex items-center justify-between shadow-sm">
                            <div className="space-y-1">
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider font-mono ${
                                item.type === 'Sakit' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                              }`}>
                                {item.type}
                              </span>
                              <strong className="text-xs text-slate-900 block mt-1 font-mono">
                                {new Date(item.requestDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                              </strong>
                              <p className="text-[10px] text-slate-500 max-w-[220px] leading-relaxed truncate">{item.reason}</p>
                            </div>

                            <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider font-mono ${
                              item.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' :
                              item.status === 'Rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {item.status === 'Approved' ? 'Disetujui' :
                               item.status === 'Rejected' ? 'Ditolak' : 'Menunggu'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* === TAB 3: OVERTIME / LEMBUR === */}
              {activeTab === 'lembur' && (
                <div className="flex-1 overflow-y-auto p-4.5 pb-28 space-y-5 animate-fade-in no-scrollbar min-h-0">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-[#0C2461] uppercase tracking-tight">Klaim Pengajuan Lembur</h3>
                    <p className="text-xs text-slate-500">Ajukan rincian jam dinas lembur luar jam dinas reguler.</p>
                  </div>

                  <form onSubmit={submitOvertimeRequest} className="space-y-4 bg-white border border-slate-200/80 p-4.5 rounded-3xl shadow-sm">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-[#0C2461] font-mono">Tanggal Lembur</label>
                      <input 
                        required
                        type="date"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#0C2461] focus:ring-1 focus:ring-[#0C2461] rounded-xl px-4 py-3 text-xs text-slate-800 outline-none transition-all font-bold font-mono shadow-inner"
                        value={overtimeDate}
                        onChange={(e) => setOvertimeDate(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-[#0C2461] font-mono">Rencana Durasi (Jam)</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#0C2461] focus:ring-1 focus:ring-[#0C2461] rounded-xl px-3 py-3 text-xs text-slate-800 outline-none transition-all font-bold cursor-pointer shadow-sm"
                        value={overtimeHours}
                        onChange={(e) => setOvertimeHours(e.target.value)}
                      >
                        <option value="1">1 Jam</option>
                        <option value="2">2 Jam</option>
                        <option value="3">3 Jam</option>
                        <option value="4">4 Jam</option>
                        <option value="5">5 Jam</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-[#0C2461] font-mono">Keperluan Tugas Lembur</label>
                      <textarea
                        required
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#0C2461] focus:ring-1 focus:ring-[#0C2461] rounded-xl px-4 py-3 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 leading-relaxed font-bold shadow-inner"
                        placeholder="Misal: Backup pengamanan VIP di area Gerbang Utara tambahan..."
                        value={overtimeReason}
                        onChange={(e) => setOvertimeReason(e.target.value)}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingOvertime}
                      className="w-full mt-2 py-3.5 bg-gradient-to-r from-[#0C2461] to-[#1E3A8A] hover:opacity-90 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-md transition-all border-b-4 border-indigo-900"
                    >
                      {isSubmittingOvertime ? 'Mengirim Data...' : 'Kirim Klaim Lembur'}
                    </button>
                  </form>

                  {/* OVERTIME REQS HISTORY */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black tracking-widest text-[#0C2461] uppercase font-mono">Riwayat Lemburan Anda</h4>
                    
                    {filteredOvertimeRequests.length === 0 ? (
                      <p className="text-[10px] text-slate-400 text-center py-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm font-bold">Belum ada riwayat lembur.</p>
                    ) : (
                      <div className="space-y-2">
                        {filteredOvertimeRequests.map((item) => (
                          <div key={item.id} className="bg-white border border-slate-100 p-3.5 rounded-2xl flex items-center justify-between shadow-sm">
                            <div className="space-y-0.5">
                              <strong className="text-xs text-slate-900 block font-mono">
                                {new Date(item.requestDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                              </strong>
                              <p className="text-[10px] text-slate-500 font-bold">Durasi: {item.hours} Jam • {item.reason}</p>
                            </div>

                            <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider font-mono ${
                              item.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' :
                              item.status === 'Rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {item.status === 'Approved' ? 'Disetujui' :
                               item.status === 'Rejected' ? 'Ditolak' : 'Menunggu'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* === TAB 4: JADWAL SHIFT === */}
              {activeTab === 'jadwal' && (
                <div className="flex-grow overflow-y-auto p-4.5 pb-24 space-y-5 animate-fade-in no-scrollbar min-h-0">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-[#0C2461] uppercase tracking-tight">Schedules & Shift Roster</h3>
                    <p className="text-xs text-slate-500">Berikut pembagian jadwal roster shift kerja Anda.</p>
                  </div>

                  {schedulesList.length === 0 ? (
                    <div className="p-8 text-center bg-white border border-slate-200 rounded-3xl shadow-sm">
                      <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-bold">Belum ada roster shift kerja dari HRD admin.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {schedulesList.map((sch) => {
                        const shiftColor = sch.isOffDay 
                          ? 'bg-red-50 border-red-100 text-red-600' 
                          : sch.shiftName?.toUpperCase().includes('PAGI') 
                            ? 'bg-amber-50 border-amber-100 text-amber-700' 
                            : sch.shiftName?.toUpperCase().includes('SIANG')
                              ? 'bg-sky-50 border-sky-100 text-[#0C2461]'
                              : 'bg-indigo-50 border-indigo-100 text-indigo-700';

                        return (
                          <div 
                            key={sch.id} 
                            className="border p-4.5 rounded-3xl flex justify-between items-center relative overflow-hidden shadow-sm bg-white"
                          >
                            <div className="space-y-1.5">
                              <span className="text-[9px] font-mono text-[#14B8A6] font-extrabold uppercase tracking-widest">
                                {new Date(sch.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                              </span>
                              <strong className="text-sm text-slate-900 block tracking-tight font-black">
                                {sch.isOffDay ? 'LIBUR MINGGUAN' : sch.shiftName || 'SHIFT DINAS'}
                              </strong>
                              {!sch.isOffDay && (
                                <span className="text-[10px] text-slate-500 font-mono font-bold block">
                                  Jam Tugas: {sch.shiftStart || '08:00'} s/d {sch.shiftEnd || '16:00'} WIB
                                </span>
                              )}
                            </div>

                            <span className={`px-2.5 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-wider font-mono border ${shiftColor}`}>
                              {sch.isOffDay ? 'OFF' : 'ON DUTY'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* === TAB 5: LAPORAN KERJA === */}
              {activeTab === 'laporan' && (
                <div className="flex-1 overflow-y-auto p-4.5 pb-28 space-y-5 animate-fade-in no-scrollbar min-h-0">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-[#0C2461] uppercase tracking-tight">Laporan Kerja Harian</h3>
                    <p className="text-xs text-slate-500">Unggah laporan patroli, temuan, atau aktivitas jurnal di pos jaga.</p>
                  </div>

                  <form onSubmit={submitWorkReport} className="space-y-4 bg-white border border-slate-200/80 p-4.5 rounded-3xl shadow-sm">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">Isi Laporan Aktivitas / Temuan</label>
                      <textarea
                        required
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#0C2461] focus:ring-1 focus:ring-[#0C2461] rounded-xl px-4 py-3 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 leading-relaxed font-bold shadow-inner"
                        placeholder="Patroli jam 23:00 di pagar barat aman, CCTV normal, gembok terkunci..."
                        value={reportText}
                        onChange={(e) => setReportText(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-[#0C2461] font-mono">Foto Dokumentasi Temuan Pos</label>
                      
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => handleCapturePhoto(setReportPhoto)} className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all cursor-pointer flex items-center gap-2 shadow-sm">
  <Camera className="w-4 h-4 text-[#14B8A6]" />
  <span>Ambil Foto</span>
</button>
                        {reportPhoto && <span className="text-[10px] text-emerald-600 font-black">✓ Foto Terunggah</span>}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 py-3.5 bg-gradient-to-r from-[#0C2461] to-[#1E3A8A] hover:opacity-90 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-md transition-all border-b-4 border-indigo-900 flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4 text-[#14B8A6]" />
                      Kirim Laporan Harian
                    </button>
                  </form>

                  {/* WORK REPORTS HISTORY */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black tracking-widest text-[#0C2461] uppercase font-mono">Riwayat Laporan Anda</h4>
                    
                    {filteredWorkReports.length === 0 ? (
                      <p className="text-[10px] text-slate-400 text-center py-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm font-bold">Belum ada riwayat laporan yang dikirim.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {filteredWorkReports.map((item) => (
                          <div key={item.id} className="bg-white border border-slate-100 p-4 rounded-2xl space-y-2 shadow-sm">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                              <span className="text-[9px] font-mono text-slate-400 font-bold">
                                {new Date(item.date).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="text-[8px] font-black text-emerald-600 font-mono uppercase tracking-widest">TERKIRIM ✓</span>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed text-justify font-bold">{item.description}</p>
                            {item.photoUrl && (
                              <img src={item.photoUrl} alt="Laporan" className="w-full max-h-32 object-cover rounded-xl border border-slate-200" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* === TAB 6: ABSEN REGU (FOR KETUA ONLY, BUT VISIBLE TO ALL) === */}
              {activeTab === 'absen_anggota' && (
                <div className="flex-grow flex flex-col p-4.5 pb-24 overflow-hidden space-y-4 animate-fade-in min-h-0">
                  <div className="space-y-1 flex-shrink-0">
                    <h3 className="text-sm font-black text-[#0C2461] uppercase tracking-tight">Kesiapan Regu & Absen Anggota</h3>
                    <p className="text-xs text-slate-500">Otorisasi khusus Ketua Regu untuk membantu pencatatan presensi anggota.</p>
                  </div>

                  {!isKetua ? (
                    <div className="bg-white border border-red-100 rounded-3xl p-8 text-center space-y-4 shadow-sm flex-shrink-0">
                      <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-100">
                        <Lock className="w-7 h-7" />
                      </div>
                      <div className="space-y-1.5 max-w-sm mx-auto">
                        <h4 className="text-xs font-black text-[#0C2461] uppercase tracking-wide">Akses Terbatas</h4>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-bold">
                          Fitur hanya tersedia untuk pegawai dengan role ketua.
                        </p>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          Anda terdaftar sebagai <span className="font-mono text-slate-500 font-bold">[{currentEmployee?.role || 'Anggota'}]</span>. Silakan gunakan menu absensi utama untuk mencatatkan kehadiran pribadi Anda.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-grow flex flex-col min-h-0 space-y-4 overflow-hidden">
                      {/* STATS HEADER */}
                      <div className="grid grid-cols-3 gap-2.5 flex-shrink-0">
                        <div className="bg-white border border-slate-200/80 p-3 rounded-2xl text-center space-y-1 shadow-sm">
                          <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider block">Total Regu</span>
                          <span className="text-base font-black text-[#0C2461] font-mono">{allSubDeptEmployees.length}</span>
                        </div>
                        <div className="bg-white border border-slate-200/80 p-3 rounded-2xl text-center space-y-1 shadow-sm">
                          <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider block">Selesai Absen</span>
                          <span className="text-base font-black text-emerald-600 font-mono">
                            {allSubDeptEmployees.filter(e => {
                              const att = getMemberTodayAttendance(e.id);
                              return att && att.timeOut;
                            }).length}
                          </span>
                        </div>
                        <div className="bg-white border border-slate-200/80 p-3 rounded-2xl text-center space-y-1 shadow-sm">
                          <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider block">Belum Selesai</span>
                          <span className="text-base font-black text-amber-500 font-mono">
                            {allSubDeptEmployees.filter(e => {
                              const att = getMemberTodayAttendance(e.id);
                              return !att || !att.timeOut;
                            }).length}
                          </span>
                        </div>
                      </div>

                      {/* SEARCH BAR */}
                      <div className="bg-white border border-slate-200/80 p-3 rounded-2xl shadow-sm flex items-center gap-2 flex-shrink-0">
                        <Search className="w-4 h-4 text-slate-400 shrink-0" />
                        <input 
                          type="text"
                          placeholder="Cari nama atau NIK anggota..."
                          className="w-full bg-transparent text-xs text-slate-800 font-bold outline-none placeholder:text-slate-400"
                          value={memberSearchQuery}
                          onChange={(e) => setMemberSearchQuery(e.target.value)}
                        />
                        {memberSearchQuery && (
                          <button onClick={() => setMemberSearchQuery('')} className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase cursor-pointer">Bersihkan</button>
                        )}
                      </div>

                      {/* MEMBER LIST */}
                      <div className="flex-grow overflow-y-auto pr-1 no-scrollbar space-y-2.5 min-h-0">
                        {allSubDeptEmployees.filter(e => {
                          if (!memberSearchQuery) return true;
                          const q = memberSearchQuery.toLowerCase();
                          return e.name.toLowerCase().includes(q) || e.nik.toLowerCase().includes(q);
                        }).length === 0 ? (
                          <p className="text-[10px] text-slate-400 text-center py-8 bg-white border border-slate-200/80 rounded-2xl">Tidak ada anggota yang ditemukan.</p>
                        ) : (
                          allSubDeptEmployees.filter(e => {
                            if (!memberSearchQuery) return true;
                            const q = memberSearchQuery.toLowerCase();
                            return e.name.toLowerCase().includes(q) || e.nik.toLowerCase().includes(q);
                          }).map((member) => {
                            const att = getMemberTodayAttendance(member.id);
                            return (
                              <div key={member.id} className="bg-white border border-slate-200/80 p-4 rounded-3xl flex items-center justify-between gap-4 shadow-sm">
                                <div className="flex items-center gap-3">
                                  {member.profilePicUrl ? (
                                    <img 
                                      src={member.profilePicUrl} 
                                      alt={member.name} 
                                      className="w-10 h-10 rounded-2xl object-cover border border-slate-100 shadow-sm"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 bg-indigo-50 text-[#0C2461] border border-indigo-100 rounded-2xl flex items-center justify-center font-black text-sm font-mono">
                                      {member.name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <div className="space-y-0.5">
                                    <h4 className="text-xs font-black text-slate-800 leading-tight">{member.name}</h4>
                                    <p className="text-[9px] text-slate-500 font-mono font-bold">{member.nik} • {member.role}</p>
                                    
                                    {/* Status Badge */}
                                    <div className="pt-0.5">
                                      {!att ? (
                                        <span className="text-[8px] font-black px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded-full uppercase tracking-wider font-mono">Belum Absen</span>
                                      ) : !att.timeOut ? (
                                        <span className="text-[8px] font-black px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full uppercase tracking-wider font-mono">Siaga (In: {att.timeIn})</span>
                                      ) : (
                                        <span className="text-[8px] font-black px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full uppercase tracking-wider font-mono">Hadir Selesai ({att.timeIn} - {att.timeOut})</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-col gap-1.5 shrink-0">
                                  {!att ? (
                                    <button
                                      disabled={loading}
                                      onClick={() => {
                                        setSelectedGroupMemberId(member.id);
                                        handleOpenAttendanceModal('masuk');
                                      }}
                                      className="px-3 py-1.5 bg-[#14B8A6] hover:bg-[#14B8A6]/90 disabled:opacity-50 text-slate-950 font-black rounded-xl text-[9px] uppercase tracking-wider cursor-pointer shadow-sm active:scale-95 transition-all text-center font-mono"
                                    >
                                      Absenkan Masuk
                                    </button>
                                  ) : !att.timeOut ? (
                                    <div className="flex flex-col gap-1">
                                      <button
                                        disabled={loading}
                                        onClick={() => {
                                          setSelectedGroupMemberId(member.id);
                                          handleOpenAttendanceModal('pulang');
                                        }}
                                        className="px-3 py-1.5 bg-[#0C2461] hover:bg-[#1E3A8A] disabled:opacity-50 text-white font-black rounded-xl text-[9px] uppercase tracking-wider cursor-pointer shadow-sm active:scale-95 transition-all text-center font-mono"
                                      >
                                        Absenkan Pulang
                                      </button>
                                      <button
                                        disabled={loading}
                                        onClick={() => handleResetAbsen(att.id)}
                                        className="px-3 py-1 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 font-black rounded-lg text-[8px] uppercase tracking-wider cursor-pointer transition-all text-center"
                                      >
                                        Reset
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-end gap-1">
                                      <span className="text-[9px] text-emerald-600 font-black flex items-center gap-1 font-mono">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> LENGKAP
                                      </span>
                                      <button
                                        disabled={loading}
                                        onClick={() => handleResetAbsen(att.id)}
                                        className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-500 hover:text-slate-800 font-bold rounded-md text-[8px] uppercase tracking-wider cursor-pointer transition-all"
                                      >
                                        Batal/Reset
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </main>

        {/* --- 3. BOTTOM FIXED NAVIGATION BAR (WITHOUT SLIP TAB) --- */}
        {isLoggedIn && (
          <nav className="absolute bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200/80 grid grid-cols-6 py-3 px-1 text-center z-40 select-none shadow-lg">
            
            <button 
              onClick={() => { setActiveTab('home'); setSelfiePreview(null); }}
              className={`flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-90 ${activeTab === 'home' ? 'text-[#0C2461] scale-105' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Smartphone className={`w-4.5 h-4.5 ${activeTab === 'home' ? 'text-red-600 stroke-[2.5px]' : ''}`} />
              <span className="text-[8px] font-black uppercase tracking-widest font-mono">Home</span>
            </button>

            <button 
              onClick={() => setActiveTab('izin')}
              className={`flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-90 ${activeTab === 'izin' ? 'text-[#0C2461] scale-105' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <FileText className={`w-4.5 h-4.5 ${activeTab === 'izin' ? 'text-red-600 stroke-[2.5px]' : ''}`} />
              <span className="text-[8px] font-black uppercase tracking-widest font-mono">Izin</span>
            </button>

            <button 
              onClick={() => setActiveTab('absen_anggota')}
              className={`flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-90 ${activeTab === 'absen_anggota' ? 'text-[#0C2461] scale-105' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Users className={`w-4.5 h-4.5 ${activeTab === 'absen_anggota' ? 'text-red-600 stroke-[2.5px]' : ''}`} />
              <span className="text-[8px] font-black uppercase tracking-widest font-mono">Absen Regu</span>
            </button>

            <button 
              onClick={() => setActiveTab('lembur')}
              className={`flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-90 ${activeTab === 'lembur' ? 'text-[#0C2461] scale-105' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Clock className={`w-4.5 h-4.5 ${activeTab === 'lembur' ? 'text-red-600 stroke-[2.5px]' : ''}`} />
              <span className="text-[8px] font-black uppercase tracking-widest font-mono">Lembur</span>
            </button>

            <button 
              onClick={() => setActiveTab('jadwal')}
              className={`flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-90 ${activeTab === 'jadwal' ? 'text-[#0C2461] scale-105' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Calendar className={`w-4.5 h-4.5 ${activeTab === 'jadwal' ? 'text-red-600 stroke-[2.5px]' : ''}`} />
              <span className="text-[8px] font-black uppercase tracking-widest font-mono">Jadwal</span>
            </button>

            <button 
              onClick={() => setActiveTab('laporan')}
              className={`flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-90 ${activeTab === 'laporan' ? 'text-[#0C2461] scale-105' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Send className={`w-4.5 h-4.5 ${activeTab === 'laporan' ? 'text-red-600 stroke-[2.5px]' : ''}`} />
              <span className="text-[8px] font-black uppercase tracking-widest font-mono">Lapor</span>
            </button>
          </nav>
        )}

      </div>

      {/* ========================================================================= */}
      {/* --- 4. HIGH-FIDELITY ATTENDANCE MODAL (POP-UP OVERLAY ON MAIN PAGE) --- */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showAttendanceModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[32px] border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]"
            >
              
              {/* Modal header */}
              <div className="bg-gradient-to-r from-[#0C2461] to-[#1E3A8A] text-white px-5 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#14B8A6]" />
                  <span className="text-xs font-black tracking-widest uppercase font-mono max-w-[240px] truncate">
                    {selectedGroupMemberId ? (
                      `Komando: ${allSubDeptEmployees.find(e => e.id === selectedGroupMemberId)?.name}`
                    ) : (
                      attendanceModalType === 'masuk' ? 'Absen Masuk Shift' :
                      attendanceModalType === 'pulang' ? 'Absen Pulang Shift' :
                      attendanceModalType === 'lembur_masuk' ? 'Absen Masuk Lembur' : 'Absen Selesai Lembur'
                    )}
                  </span>
                </div>
                <button 
                  onClick={() => { setShowAttendanceModal(false); setSelectedGroupMemberId(''); }}
                  className="w-7 h-7 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all font-bold cursor-pointer font-mono"
                >
                  ✕
                </button>
              </div>

              {/* Modal body (Scrollable content) */}
              <div className="p-5 overflow-y-auto space-y-4 no-scrollbar">
                
                {/* GEOFENCE RADAR */}
                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4.5 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Geofence GPS Radar</span>
                    <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-full ${currentDistance <= (officeLocation?.radius || 100) ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {currentDistance <= (officeLocation?.radius || 100) ? 'DI DALAM AREA ✓' : 'DI LUAR AREA ⚠'}
                    </span>
                  </div>

                  <div className="flex items-center justify-center py-2">
                    <div className={`w-24 h-24 rounded-full border-2 flex flex-col items-center justify-center relative ${currentDistance <= (officeLocation?.radius || 100) ? 'border-emerald-500 bg-emerald-500/5' : 'border-red-500 bg-red-500/5'}`}>
                      <div className="text-center">
                        <span className="text-[8px] font-bold uppercase text-slate-400 block">Jarak</span>
                        <strong className="text-lg font-mono font-black text-slate-900 block">{currentDistance}m</strong>
                        <span className="text-[7px] text-slate-400 block italic">Maks: {officeLocation?.radius || 100}m</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-[9px] text-slate-500 font-bold font-mono">
                    <span>GPS terdeteksi otomatis dari perangkat Anda</span>
                  </div>
                </div>

                {/* DANRU COMMANDER COLLABORATIVE DEPLOY */}
                {allSubDeptEmployees.length > 0 && (attendanceModalType === 'masuk' || attendanceModalType === 'pulang') && (
                  <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#14B8A6]" />
                      <span className="text-[9px] font-black tracking-widest text-[#0C2461] uppercase font-mono">Absenkan Anggota Regu (Danru)</span>
                    </div>
                    
                    <select
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-[#0C2461] transition-all font-bold cursor-pointer"
                      value={selectedGroupMemberId}
                      onChange={(e) => {
                        setSelectedGroupMemberId(e.target.value);
                        triggerToast(e.target.value ? 'Mode komando aktif untuk anggota!' : 'Kembali ke absen mandiri.');
                      }}
                    >
                      <option value="">-- PILIH ANGGOTA REGU (ABSEN MANDIRI) --</option>
                      {allSubDeptEmployees.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name} ({e.nik})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* SWAFOTO IDENTITAS (LIVE SELFIE) */}
                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 text-center space-y-3">
                  <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase font-mono block">Verifikasi Wajah / Swafoto Aktif</span>
                  
                  <div className="w-full max-w-[240px] h-48 mx-auto bg-slate-900 rounded-3xl overflow-hidden relative flex items-center justify-center border-2 border-[#0C2461]/20 shadow-md">
                    {selfiePreview ? (
                      <img 
                        src={selfiePreview} 
                        alt="Selfie" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="relative w-full h-full">
                        {isNative ? (
                           <div className="p-4 text-center space-y-4 h-full flex flex-col items-center justify-center">
                              <Camera className="w-12 h-12 text-[#14B8A6] mx-auto opacity-50" />
                              <p className="text-[10px] font-bold leading-relaxed text-slate-300">Kamera sistem akan digunakan untuk swafoto.</p>
                           </div>
                        ) : cameraError ? (
                          <div className="p-4 text-center space-y-1 text-slate-400 h-full flex flex-col items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-amber-500 animate-bounce" />
                            <p className="text-[9px] font-bold leading-relaxed">{cameraError}</p>
                          </div>
                        ) : (
                          <>
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className="w-full h-full object-cover"
                            />
                            {/* Scanning radar visual overlay */}
                            <div className="absolute inset-0 border-2 border-[#14B8A6]/40 rounded-3xl pointer-events-none animate-pulse" />
                            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#14B8A6]/60 animate-bounce pointer-events-none" />
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center gap-2">
                    {selfiePreview ? (
                      <button
                        type="button"
                        onClick={() => setSelfiePreview(null)}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-white" />
                        <span>Ulangi Swafoto</span>
                      </button>
                    ) : isNative ? (
                      <button
                        type="button"
                        onClick={handleNativeCamera}
                        className="px-5 py-2.5 bg-gradient-to-r from-[#0C2461] to-[#1E3A8A] text-white hover:opacity-90 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                      >
                        <Camera className="w-4 h-4 text-[#14B8A6] animate-pulse" />
                        <span>Buka Kamera</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={captureSelfie}
                        disabled={!!cameraError}
                        className="px-5 py-2.5 bg-gradient-to-r from-[#0C2461] to-[#1E3A8A] text-white hover:opacity-90 disabled:opacity-50 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                      >
                        <Camera className="w-4 h-4 text-[#14B8A6] animate-pulse" />
                        <span>Ambil Swafoto</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>

              {/* Modal footer (Actions) */}
              <div className="p-4 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowAttendanceModal(false); setSelectedGroupMemberId(''); }}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={triggerClockInOrOut}
                  disabled={loading || !selfiePreview}
                  className="flex-1 py-3 bg-gradient-to-r from-[#0C2461] to-[#1E3A8A] hover:opacity-95 disabled:opacity-50 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 border-b-2 border-indigo-900"
                >
                  {loading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-[#14B8A6]" />
                  )}
                  <span>Kirim Absen</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* --- 5. HIGH-PRIORITY EXECUTIVE COMMAND OVERLAY MODAL (ANNOUNCEMENT) --- */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showAnnouncementModal && activeAnnouncement && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="bg-slate-900 border-2 border-red-500 rounded-[36px] shadow-[0_0_50px_rgba(239,68,68,0.3)] w-full max-w-sm overflow-hidden flex flex-col max-h-[85vh] text-slate-100"
            >
              {/* Emergency beacon bar */}
              <div className="bg-red-600 text-white text-[10px] px-5 py-3 font-mono font-black tracking-widest text-center animate-pulse shrink-0">
                ⚠️ SURAT INSTRUKSI KOMANDO GADA PRATAMA
              </div>

              {/* Announcement body */}
              <div className="p-6 overflow-y-auto space-y-5 no-scrollbar flex-grow">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-red-500/10 border-2 border-red-500/50 text-red-500 rounded-full mx-auto flex items-center justify-center shadow-lg">
                    <ShieldAlert className="w-8 h-8 animate-bounce" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black tracking-widest text-red-500 uppercase font-mono block">Official Command Warning</span>
                    <h3 className="text-sm font-black text-white leading-snug mt-1">{activeAnnouncement.title}</h3>
                  </div>
                </div>

                {activeAnnouncement.mediaUrl && (
                  <div className="w-full h-40 bg-slate-950 rounded-2xl overflow-hidden relative shadow-inner">
                    {activeAnnouncement.mediaUrl.startsWith('data:video') || activeAnnouncement.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                      <video src={activeAnnouncement.mediaUrl} className="w-full h-full object-cover" controls autoPlay playsInline muted />
                    ) : (
                      <img src={activeAnnouncement.mediaUrl} className="w-full h-full object-cover" alt="Announcement Media" />
                    )}
                  </div>
                )}

                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl text-xs leading-relaxed text-slate-300 text-justify font-bold whitespace-pre-line shadow-inner max-h-56 overflow-y-auto">
                  {activeAnnouncement.content}
                </div>

                <div className="text-center border-t border-slate-800 pt-3 space-y-1">
                  <span className="text-[8px] font-mono text-slate-500 block">Diterbitkan oleh: HRD & Operational Command GTP</span>
                  <span className="text-[8px] font-mono text-slate-500 block">Waktu: {new Date(activeAnnouncement.createdAt).toLocaleString('id-ID')} WIB</span>
                </div>
              </div>

              {/* Execution action button */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={handleAcknowledgeAnnouncement}
                  className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-700 hover:opacity-95 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-red-950/50 flex items-center justify-center gap-2"
                >
                  <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>SAYA MENGERTI & SIAP MELAKSANAKAN TUGAS</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
