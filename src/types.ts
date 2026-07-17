export interface Admin {
  id?: string;
  email: string;
  createdAt: number;
}

export interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  createdAt: number;
  updatedAt: number;
}

export interface Department {
  id: string;
  name: string;
  locationId: string;
  createdAt: number;
  updatedAt: number;
}

export interface SubDepartment {
  id: string;
  name: string;
  departmentId: string;
  createdAt: number;
  updatedAt: number;
}

export interface Employee {
  id: string;
  name: string;
  locationId: string;
  departmentId: string;
  subDepartmentId: string;
  baseSalary: number;
  role: string;
  status?: 'Aktif' | 'Resign' | 'Habis Kontrak' | 'Pensiun' | 'Sanksi';
  createdAt: number;
  updatedAt: number;
}

export interface Schedule {
  id: string;
  subDepartmentId: string;
  date: string; // YYYY-MM-DD
  shift: string; // Pagi, Siang, Malam, Libur
  createdAt: number;
  updatedAt: number;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa';
  timeIn: string;
  timeOut: string;
  isLate: boolean;
  photoUrl?: string; // for Izin/Sakit
  createdAt: number;
  updatedAt: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  date: string;
  type: 'Izin' | 'Sakit';
  reason: string;
  photoUrl: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: number;
  updatedAt: number;
}

export interface OvertimeRequest {
  id: string;
  employeeId: string;
  date: string;
  reason: string;
  hours: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: number;
  updatedAt: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  createdAt: number;
  updatedAt: number;
}

export interface CompanyInfo {
  id: string;
  key: string;
  content: string;
  updatedAt: number;
}
