import { boolean, decimal, integer, json, pgEnum, pgTable, text, time, timestamp, varchar } from 'drizzle-orm/pg-core';

export const admins = pgTable('admins', {
  id: varchar('id', { length: 50 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }), // stored hashed password
  name: varchar('name', { length: 255 }),
  role: varchar('role', { length: 50 }).default('admin'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const locations = pgTable('locations', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  latitude: decimal('latitude', { precision: 20, scale: 8 }).notNull(),
  longitude: decimal('longitude', { precision: 20, scale: 8 }).notNull(),
  radius: integer('radius').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const departments = pgTable('departments', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  locationId: varchar('location_id', { length: 50 }).notNull().references(() => locations.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const subDepartments = pgTable('sub_departments', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  departmentId: varchar('department_id', { length: 50 }).notNull().references(() => departments.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const employees = pgTable('employees', {
  id: varchar('id', { length: 50 }).primaryKey(),
  nik: varchar('nik', { length: 50 }),
  name: varchar('name', { length: 255 }).notNull(),
  password: varchar('password', { length: 100 }),
  locationId: varchar('location_id', { length: 50 }).notNull().references(() => locations.id, { onDelete: 'cascade' }),
  departmentId: varchar('department_id', { length: 50 }).notNull().references(() => departments.id, { onDelete: 'cascade' }),
  subDepartmentId: varchar('sub_department_id', { length: 50 }).notNull().references(() => subDepartments.id, { onDelete: 'cascade' }),
  baseSalary: decimal('base_salary', { precision: 15, scale: 2 }).notNull(),
  role: varchar('role', { length: 100 }).notNull(),
  profilePicUrl: text('profile_pic_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const employeeAllowances = pgTable('employee_allowances', {
  id: varchar('id', { length: 50 }).primaryKey(),
  employeeId: varchar('employee_id', { length: 50 }).notNull().references(() => employees.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
});

export const employeeDeductions = pgTable('employee_deductions', {
  id: varchar('id', { length: 50 }).primaryKey(),
  employeeId: varchar('employee_id', { length: 50 }).notNull().references(() => employees.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
});

export const shiftTypes = pgTable('shift_types', {
  id: varchar('id', { length: 50 }).primaryKey(),
  subDepartmentId: varchar('sub_department_id', { length: 50 }).notNull().references(() => subDepartments.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  isCrossDay: boolean('is_cross_day').default(false),
  isOffDay: boolean('is_off_day').default(false),
  color: varchar('color', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const shiftPatterns = pgTable('shift_patterns', {
  id: varchar('id', { length: 50 }).primaryKey(),
  subDepartmentId: varchar('sub_department_id', { length: 50 }).notNull().unique().references(() => subDepartments.id, { onDelete: 'cascade' }),
  startDate: timestamp('start_date').notNull(),
  sequence: json('sequence').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const subdeptScheduleOverrides = pgTable('subdept_schedule_overrides', {
  id: varchar('id', { length: 100 }).primaryKey(),
  subDepartmentId: varchar('sub_department_id', { length: 50 }).notNull().references(() => subDepartments.id, { onDelete: 'cascade' }),
  overrideDate: timestamp('override_date').notNull(),
  shiftTypeId: varchar('shift_type_id', { length: 50 }).references(() => shiftTypes.id, { onDelete: 'set null' }),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const schedules = pgTable('schedules', {
  id: varchar('id', { length: 50 }).primaryKey(),
  subDepartmentId: varchar('sub_department_id', { length: 50 }).notNull().references(() => subDepartments.id, { onDelete: 'cascade' }),
  scheduleDate: timestamp('schedule_date').notNull(),
  shift: varchar('shift', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const attendanceStatusEnum = pgEnum('attendance_status', ['Hadir', 'Izin', 'Sakit', 'Alpa']);
export const attendances = pgTable('attendances', {
  id: varchar('id', { length: 50 }).primaryKey(),
  employeeId: varchar('employee_id', { length: 50 }).notNull().references(() => employees.id, { onDelete: 'cascade' }),
  attendanceDate: timestamp('attendance_date').notNull(),
  status: attendanceStatusEnum('status').notNull(),
  timeIn: time('time_in'),
  timeOut: time('time_out'),
  isLate: boolean('is_late').default(false),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const leaveRequestTypeEnum = pgEnum('leave_request_type', ['Izin', 'Sakit']);
export const requestStatusEnum = pgEnum('request_status', ['Pending', 'Approved', 'Rejected']);

export const leaveRequests = pgTable('leave_requests', {
  id: varchar('id', { length: 50 }).primaryKey(),
  employeeId: varchar('employee_id', { length: 50 }).notNull().references(() => employees.id, { onDelete: 'cascade' }),
  requestDate: timestamp('request_date').notNull(),
  type: leaveRequestTypeEnum('type').notNull(),
  reason: text('reason').notNull(),
  photoUrl: text('photo_url'),
  status: requestStatusEnum('status').default('Pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const overtimeRequests = pgTable('overtime_requests', {
  id: varchar('id', { length: 50 }).primaryKey(),
  employeeId: varchar('employee_id', { length: 50 }).notNull().references(() => employees.id, { onDelete: 'cascade' }),
  requestDate: timestamp('request_date').notNull(),
  reason: text('reason').notNull(),
  hours: integer('hours').notNull(),
  status: requestStatusEnum('status').default('Pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const announcements = pgTable('announcements', {
  id: varchar('id', { length: 50 }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  type: varchar('type', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const companyInfo = pgTable('company_info', {
  id: varchar('id', { length: 50 }).primaryKey(),
  configKey: varchar('config_key', { length: 100 }).notNull().unique(),
  content: text('content').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const workReports = pgTable('work_reports', {
  id: varchar('id', { length: 50 }).primaryKey(),
  employeeId: varchar('employee_id', { length: 50 }).notNull().references(() => employees.id, { onDelete: 'cascade' }),
  date: timestamp('date').notNull(),
  description: text('description').notNull(),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const galleries = pgTable('galleries', {
  id: varchar('id', { length: 50 }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  mediaUrl: text('media_url').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
