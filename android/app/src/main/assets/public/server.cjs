var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc2) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc2 = __getOwnPropDesc(from, key)) || desc2.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express3 = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");

// src/db/index.ts
var import_node_postgres = require("drizzle-orm/node-postgres");
var import_pg = require("pg");

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  admins: () => admins,
  agendas: () => agendas,
  announcements: () => announcements,
  attendanceStatusEnum: () => attendanceStatusEnum,
  attendances: () => attendances,
  companyInfo: () => companyInfo,
  departments: () => departments,
  employeeAllowances: () => employeeAllowances,
  employeeDeductions: () => employeeDeductions,
  employees: () => employees,
  galleries: () => galleries,
  leaveRequestTypeEnum: () => leaveRequestTypeEnum,
  leaveRequests: () => leaveRequests,
  locations: () => locations,
  overtimeRequests: () => overtimeRequests,
  requestStatusEnum: () => requestStatusEnum,
  schedules: () => schedules,
  shiftPatterns: () => shiftPatterns,
  shiftTypes: () => shiftTypes,
  subDepartments: () => subDepartments,
  subdeptScheduleOverrides: () => subdeptScheduleOverrides,
  workReports: () => workReports
});
var import_pg_core = require("drizzle-orm/pg-core");
var admins = (0, import_pg_core.pgTable)("admins", {
  id: (0, import_pg_core.varchar)("id", { length: 50 }).primaryKey(),
  email: (0, import_pg_core.varchar)("email", { length: 255 }).notNull().unique(),
  password: (0, import_pg_core.varchar)("password", { length: 255 }),
  // stored hashed password
  name: (0, import_pg_core.varchar)("name", { length: 255 }),
  role: (0, import_pg_core.varchar)("role", { length: 50 }).default("admin"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull()
});
var locations = (0, import_pg_core.pgTable)("locations", {
  id: (0, import_pg_core.varchar)("id", { length: 50 }).primaryKey(),
  name: (0, import_pg_core.varchar)("name", { length: 255 }).notNull(),
  latitude: (0, import_pg_core.decimal)("latitude", { precision: 20, scale: 8 }).notNull(),
  longitude: (0, import_pg_core.decimal)("longitude", { precision: 20, scale: 8 }).notNull(),
  radius: (0, import_pg_core.integer)("radius").notNull(),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
});
var departments = (0, import_pg_core.pgTable)("departments", {
  id: (0, import_pg_core.varchar)("id", { length: 50 }).primaryKey(),
  name: (0, import_pg_core.varchar)("name", { length: 255 }).notNull(),
  locationId: (0, import_pg_core.varchar)("location_id", { length: 50 }).notNull().references(() => locations.id, { onDelete: "cascade" }),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
});
var subDepartments = (0, import_pg_core.pgTable)("sub_departments", {
  id: (0, import_pg_core.varchar)("id", { length: 50 }).primaryKey(),
  name: (0, import_pg_core.varchar)("name", { length: 255 }).notNull(),
  departmentId: (0, import_pg_core.varchar)("department_id", { length: 50 }).notNull().references(() => departments.id, { onDelete: "cascade" }),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
});
var employees = (0, import_pg_core.pgTable)("employees", {
  id: (0, import_pg_core.varchar)("id", { length: 50 }).primaryKey(),
  nik: (0, import_pg_core.varchar)("nik", { length: 50 }),
  name: (0, import_pg_core.varchar)("name", { length: 255 }).notNull(),
  password: (0, import_pg_core.varchar)("password", { length: 100 }),
  locationId: (0, import_pg_core.varchar)("location_id", { length: 50 }).notNull().references(() => locations.id, { onDelete: "cascade" }),
  departmentId: (0, import_pg_core.varchar)("department_id", { length: 50 }).notNull().references(() => departments.id, { onDelete: "cascade" }),
  subDepartmentId: (0, import_pg_core.varchar)("sub_department_id", { length: 50 }).notNull().references(() => subDepartments.id, { onDelete: "cascade" }),
  baseSalary: (0, import_pg_core.decimal)("base_salary", { precision: 15, scale: 2 }).notNull(),
  role: (0, import_pg_core.varchar)("role", { length: 100 }).notNull(),
  profilePicUrl: (0, import_pg_core.text)("profile_pic_url"),
  status: (0, import_pg_core.varchar)("status", { length: 50 }).default("Aktif"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
});
var employeeAllowances = (0, import_pg_core.pgTable)("employee_allowances", {
  id: (0, import_pg_core.varchar)("id", { length: 50 }).primaryKey(),
  employeeId: (0, import_pg_core.varchar)("employee_id", { length: 50 }).notNull().references(() => employees.id, { onDelete: "cascade" }),
  name: (0, import_pg_core.varchar)("name", { length: 255 }).notNull(),
  amount: (0, import_pg_core.decimal)("amount", { precision: 15, scale: 2 }).notNull()
});
var employeeDeductions = (0, import_pg_core.pgTable)("employee_deductions", {
  id: (0, import_pg_core.varchar)("id", { length: 50 }).primaryKey(),
  employeeId: (0, import_pg_core.varchar)("employee_id", { length: 50 }).notNull().references(() => employees.id, { onDelete: "cascade" }),
  name: (0, import_pg_core.varchar)("name", { length: 255 }).notNull(),
  amount: (0, import_pg_core.decimal)("amount", { precision: 15, scale: 2 }).notNull()
});
var shiftTypes = (0, import_pg_core.pgTable)("shift_types", {
  id: (0, import_pg_core.varchar)("id", { length: 50 }).primaryKey(),
  subDepartmentId: (0, import_pg_core.varchar)("sub_department_id", { length: 50 }).notNull().references(() => subDepartments.id, { onDelete: "cascade" }),
  name: (0, import_pg_core.varchar)("name", { length: 100 }).notNull(),
  startTime: (0, import_pg_core.time)("start_time").notNull(),
  endTime: (0, import_pg_core.time)("end_time").notNull(),
  isCrossDay: (0, import_pg_core.boolean)("is_cross_day").default(false),
  isOffDay: (0, import_pg_core.boolean)("is_off_day").default(false),
  color: (0, import_pg_core.varchar)("color", { length: 100 }),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull()
});
var shiftPatterns = (0, import_pg_core.pgTable)("shift_patterns", {
  id: (0, import_pg_core.varchar)("id", { length: 50 }).primaryKey(),
  subDepartmentId: (0, import_pg_core.varchar)("sub_department_id", { length: 50 }).notNull().unique().references(() => subDepartments.id, { onDelete: "cascade" }),
  startDate: (0, import_pg_core.timestamp)("start_date").notNull(),
  sequence: (0, import_pg_core.json)("sequence").notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
});
var subdeptScheduleOverrides = (0, import_pg_core.pgTable)("subdept_schedule_overrides", {
  id: (0, import_pg_core.varchar)("id", { length: 100 }).primaryKey(),
  subDepartmentId: (0, import_pg_core.varchar)("sub_department_id", { length: 50 }).notNull().references(() => subDepartments.id, { onDelete: "cascade" }),
  overrideDate: (0, import_pg_core.timestamp)("override_date").notNull(),
  shiftTypeId: (0, import_pg_core.varchar)("shift_type_id", { length: 50 }).references(() => shiftTypes.id, { onDelete: "set null" }),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
});
var schedules = (0, import_pg_core.pgTable)("schedules", {
  id: (0, import_pg_core.varchar)("id", { length: 50 }).primaryKey(),
  employeeId: (0, import_pg_core.varchar)("employee_id", { length: 50 }).notNull().references(() => employees.id, { onDelete: "cascade" }),
  subDepartmentId: (0, import_pg_core.varchar)("sub_department_id", { length: 50 }).notNull().references(() => subDepartments.id, { onDelete: "cascade" }),
  date: (0, import_pg_core.timestamp)("date").notNull(),
  shiftTypeId: (0, import_pg_core.varchar)("shift_type_id", { length: 50 }),
  shiftName: (0, import_pg_core.varchar)("shift_name", { length: 100 }),
  shiftStart: (0, import_pg_core.varchar)("shift_start", { length: 10 }),
  shiftEnd: (0, import_pg_core.varchar)("shift_end", { length: 10 }),
  isOffDay: (0, import_pg_core.boolean)("is_off_day").default(false),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
});
var attendanceStatusEnum = (0, import_pg_core.pgEnum)("attendance_status", ["Hadir", "Izin", "Sakit", "Alpa"]);
var attendances = (0, import_pg_core.pgTable)("attendances", {
  id: (0, import_pg_core.varchar)("id", { length: 50 }).primaryKey(),
  employeeId: (0, import_pg_core.varchar)("employee_id", { length: 50 }).notNull().references(() => employees.id, { onDelete: "cascade" }),
  attendanceDate: (0, import_pg_core.timestamp)("attendance_date").notNull(),
  status: attendanceStatusEnum("status").notNull(),
  timeIn: (0, import_pg_core.time)("time_in"),
  timeOut: (0, import_pg_core.time)("time_out"),
  isLate: (0, import_pg_core.boolean)("is_late").default(false),
  photoUrl: (0, import_pg_core.text)("photo_url"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
});
var leaveRequestTypeEnum = (0, import_pg_core.pgEnum)("leave_request_type", ["Izin", "Sakit"]);
var requestStatusEnum = (0, import_pg_core.pgEnum)("request_status", ["Pending", "Approved", "Rejected"]);
var leaveRequests = (0, import_pg_core.pgTable)("leave_requests", {
  id: (0, import_pg_core.varchar)("id", { length: 50 }).primaryKey(),
  employeeId: (0, import_pg_core.varchar)("employee_id", { length: 50 }).notNull().references(() => employees.id, { onDelete: "cascade" }),
  requestDate: (0, import_pg_core.timestamp)("request_date").notNull(),
  type: leaveRequestTypeEnum("type").notNull(),
  reason: (0, import_pg_core.text)("reason").notNull(),
  photoUrl: (0, import_pg_core.text)("photo_url"),
  status: requestStatusEnum("status").default("Pending"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
});
var overtimeRequests = (0, import_pg_core.pgTable)("overtime_requests", {
  id: (0, import_pg_core.varchar)("id", { length: 50 }).primaryKey(),
  employeeId: (0, import_pg_core.varchar)("employee_id", { length: 50 }).notNull().references(() => employees.id, { onDelete: "cascade" }),
  requestDate: (0, import_pg_core.timestamp)("request_date").notNull(),
  reason: (0, import_pg_core.text)("reason").notNull(),
  hours: (0, import_pg_core.integer)("hours").notNull(),
  status: requestStatusEnum("status").default("Pending"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
});
var announcements = (0, import_pg_core.pgTable)("announcements", {
  id: (0, import_pg_core.varchar)("id", { length: 50 }).primaryKey(),
  title: (0, import_pg_core.varchar)("title", { length: 255 }).notNull(),
  content: (0, import_pg_core.text)("content").notNull(),
  type: (0, import_pg_core.varchar)("type", { length: 100 }).notNull(),
  mediaUrl: (0, import_pg_core.text)("media_url"),
  isPopup: (0, import_pg_core.boolean)("is_popup").default(false),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
});
var companyInfo = (0, import_pg_core.pgTable)("company_info", {
  id: (0, import_pg_core.varchar)("id", { length: 50 }).primaryKey(),
  configKey: (0, import_pg_core.varchar)("config_key", { length: 100 }).notNull().unique(),
  content: (0, import_pg_core.text)("content").notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
});
var workReports = (0, import_pg_core.pgTable)("work_reports", {
  id: (0, import_pg_core.varchar)("id", { length: 50 }).primaryKey(),
  employeeId: (0, import_pg_core.varchar)("employee_id", { length: 50 }).notNull().references(() => employees.id, { onDelete: "cascade" }),
  date: (0, import_pg_core.timestamp)("date").notNull(),
  description: (0, import_pg_core.text)("description").notNull(),
  photoUrl: (0, import_pg_core.text)("photo_url"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull()
});
var galleries = (0, import_pg_core.pgTable)("galleries", {
  id: (0, import_pg_core.varchar)("id", { length: 50 }).primaryKey(),
  title: (0, import_pg_core.varchar)("title", { length: 255 }).notNull(),
  mediaUrl: (0, import_pg_core.text)("media_url").notNull(),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull()
});
var agendas = (0, import_pg_core.pgTable)("agendas", {
  id: (0, import_pg_core.varchar)("id", { length: 50 }).primaryKey(),
  title: (0, import_pg_core.varchar)("title", { length: 255 }).notNull(),
  date: (0, import_pg_core.varchar)("date", { length: 255 }).notNull(),
  type: (0, import_pg_core.varchar)("type", { length: 100 }).notNull(),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull()
});

// src/db/index.ts
var dotenv = __toESM(require("dotenv"), 1);
dotenv.config();
var createPool = () => {
  const envVars = process.env;
  const dbUrl = envVars.DATABASE_URL_POSTGRES_URL_NON_POOLING || envVars.DATABASE_URL_POSTGRES_PRISMA_URL || envVars.DATABASE_URL_UNPOOLED || envVars.POSTGRES_URL_NON_POOLING || envVars.POSTGRES_URL || envVars.DATABASE_URL;
  console.log("DB URL Found:", !!dbUrl);
  if (dbUrl) {
    const useSsl = dbUrl.includes("neon.tech") || dbUrl.includes("supabase.co") || dbUrl.includes("vercel") || dbUrl.includes("koyeb") || dbUrl.includes("sslmode=require");
    return new import_pg.Pool({
      connectionString: dbUrl,
      connectionTimeoutMillis: 15e3,
      ...useSsl ? { ssl: { rejectUnauthorized: false } } : {}
    });
  }
  return new import_pg.Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_ADMIN_USER || process.env.SQL_USER,
    password: process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    connectionTimeoutMillis: 15e3
  });
};
var pool = createPool();
pool.on("error", (err) => {
  console.error("Unexpected error on idle SQL pool client:", err);
});
var db = (0, import_node_postgres.drizzle)(pool, { schema: schema_exports });

// server.ts
var import_drizzle_orm3 = require("drizzle-orm");
var import_cors = __toESM(require("cors"), 1);
var import_uuid3 = require("uuid");

// server/api.ts
var import_express = __toESM(require("express"), 1);
var import_drizzle_orm = require("drizzle-orm");
var import_uuid = require("uuid");
var apiRouter = import_express.default.Router();
apiRouter.get("/employees", async (req, res) => {
  try {
    const data = await db.select().from(employees);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.post("/employees", async (req, res) => {
  try {
    const newEmployee = { ...req.body, id: (0, import_uuid.v4)() };
    await db.insert(employees).values(newEmployee);
    res.json({ id: newEmployee.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.put("/employees/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.update(employees).set(req.body).where((0, import_drizzle_orm.eq)(employees.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.delete("/employees/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(employees).where((0, import_drizzle_orm.eq)(employees.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.get("/locations", async (req, res) => {
  try {
    const data = await db.select().from(locations);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.post("/locations", async (req, res) => {
  try {
    const newLoc = { ...req.body, id: (0, import_uuid.v4)() };
    await db.insert(locations).values(newLoc);
    res.json({ id: newLoc.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.put("/locations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.update(locations).set(req.body).where((0, import_drizzle_orm.eq)(locations.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.delete("/locations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(locations).where((0, import_drizzle_orm.eq)(locations.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.get("/departments", async (req, res) => {
  try {
    const data = await db.select().from(departments);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.post("/departments", async (req, res) => {
  try {
    const newDept = { ...req.body, id: (0, import_uuid.v4)() };
    await db.insert(departments).values(newDept);
    res.json({ id: newDept.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.put("/departments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.update(departments).set(req.body).where((0, import_drizzle_orm.eq)(departments.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.delete("/departments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(departments).where((0, import_drizzle_orm.eq)(departments.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.get("/subdepartments", async (req, res) => {
  try {
    const data = await db.select().from(subDepartments);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.post("/subdepartments", async (req, res) => {
  try {
    const newSub = { ...req.body, id: (0, import_uuid.v4)() };
    await db.insert(subDepartments).values(newSub);
    res.json({ id: newSub.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.put("/subdepartments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.update(subDepartments).set(req.body).where((0, import_drizzle_orm.eq)(subDepartments.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.delete("/subdepartments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(subDepartments).where((0, import_drizzle_orm.eq)(subDepartments.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const adminResult = await db.select().from(admins).where((0, import_drizzle_orm.eq)(admins.email, email));
    if (adminResult.length === 0) {
      return res.status(401).json({ error: "Kredensial tidak valid" });
    }
    const adminUser = adminResult[0];
    if (adminUser.password !== password) {
      return res.status(401).json({ error: "Password salah" });
    }
    res.json({ success: true, user: { id: adminUser.id, email: adminUser.email, name: adminUser.name, role: adminUser.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.post("/employee/login", async (req, res) => {
  try {
    const { nik, password } = req.body;
    const empResult = await db.select().from(employees).where((0, import_drizzle_orm.eq)(employees.nik, nik));
    if (empResult.length === 0) {
      return res.status(401).json({ error: "Data Karyawan tidak ditemukan (NIK Salah)" });
    }
    const empUser = empResult[0];
    if (empUser.password !== password) {
      return res.status(401).json({ error: "Password salah" });
    }
    res.json({ success: true, user: empUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.post("/admin/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const newAdmin = { id: (0, import_uuid.v4)(), email, password, name, role: "admin" };
    await db.insert(admins).values(newAdmin);
    res.json({ success: true, user: { id: newAdmin.id, email: newAdmin.email, name: newAdmin.name, role: newAdmin.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// server/firestoreAdapter.ts
var import_express2 = __toESM(require("express"), 1);
var import_drizzle_orm2 = require("drizzle-orm");
var import_uuid2 = require("uuid");
var genericDbRouter = import_express2.default.Router();
genericDbRouter.post("/rpc", async (req, res) => {
  try {
    const { action, collection, docId, data, queries, order, filters } = req.body;
    let table = schema_exports[collection];
    if (collection === "sub_departments") table = subDepartments;
    if (collection === "employee_allowances") table = employeeAllowances;
    if (collection === "employee_deductions") table = employeeDeductions;
    if (collection === "shift_types") table = shiftTypes;
    if (collection === "shift_patterns") table = shiftPatterns;
    if (collection === "subdept_schedule_overrides") table = subdeptScheduleOverrides;
    if (collection === "leave_requests") table = leaveRequests;
    if (collection === "overtime_requests") table = overtimeRequests;
    if (collection === "company_info") table = companyInfo;
    if (collection === "work_reports") table = workReports;
    if (collection === "galleries") table = galleries;
    if (collection === "agendas") table = agendas;
    if (!table) {
      if (collection === "admins" || collection === "locations" || collection === "departments" || collection === "employees" || collection === "schedules" || collection === "attendances" || collection === "announcements" || collection === "agendas") {
        table = schema_exports[collection];
      }
    }
    if (!table) {
      return res.status(400).json({ error: "Collection not defined in schema: " + collection });
    }
    if (action === "getDocs") {
      let queryFn = db.select().from(table);
      const activeFilters = filters || queries || [];
      if (activeFilters && Array.isArray(activeFilters) && activeFilters.length > 0) {
        const conditions = activeFilters.map((f) => {
          let fieldName = f.field;
          if (collection === "company_info" && fieldName === "key") fieldName = "configKey";
          if (collection === "attendances" && fieldName === "date") fieldName = "attendanceDate";
          if (collection === "leave_requests" && fieldName === "date") fieldName = "requestDate";
          if (collection === "overtime_requests" && fieldName === "date") fieldName = "requestDate";
          const operator = f.op || f.operator;
          const val = f.value !== void 0 ? f.value : f.val;
          if (table[fieldName]) {
            if (operator === "==") return (0, import_drizzle_orm2.eq)(table[fieldName], val);
            if (operator === "in") return (0, import_drizzle_orm2.inArray)(table[fieldName], val);
            if (operator === ">=") {
              return import_drizzle_orm2.sql`${table[fieldName]} >= ${val}`;
            }
            if (operator === "<=") {
              let finalVal = val;
              if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
                finalVal = `${val} 23:59:59`;
              }
              return import_drizzle_orm2.sql`${table[fieldName]} <= ${finalVal}`;
            }
          }
          return void 0;
        }).filter(Boolean);
        if (conditions.length > 0) {
          queryFn = queryFn.where((0, import_drizzle_orm2.and)(...conditions));
        }
      }
      if (collection === "employees") {
        const results = await queryFn;
        const allowances = await db.select().from(employeeAllowances);
        const deductions = await db.select().from(employeeDeductions);
        for (const emp of results) {
          emp.allowances = allowances.filter((a) => a.employeeId === emp.id);
          emp.deductions = deductions.filter((d) => d.employeeId === emp.id);
        }
        res.json(results);
      } else if (collection === "company_info") {
        const results = await queryFn;
        const mapped = results.map((r) => ({
          id: r.id,
          key: r.configKey,
          ...JSON.parse(r.content || "{}")
        }));
        res.json(mapped);
      } else {
        const results = await queryFn;
        res.json(results);
      }
    } else if (action === "addDoc") {
      const newId = data.id || (0, import_uuid2.v4)();
      const convertDates = (obj) => {
        const res2 = { ...obj };
        const dateKeyRegex = /^(createdAt|updatedAt|startDate|overrideDate|scheduleDate|attendanceDate|requestDate|date)$/;
        for (const k in res2) {
          if (collection === "agendas" && k === "date") continue;
          if (dateKeyRegex.test(k) && res2[k] !== null && res2[k] !== void 0) {
            if (res2[k] && typeof res2[k] === "object" && "seconds" in res2[k]) {
              res2[k] = new Date(res2[k].seconds * 1e3);
            } else if (typeof res2[k] === "number" || typeof res2[k] === "string") {
              res2[k] = new Date(res2[k]);
              if (isNaN(res2[k].getTime())) delete res2[k];
            }
          }
        }
        return res2;
      };
      const safeData = convertDates(data);
      if (safeData.employeeId === "123" || safeData.employeeId && safeData.employeeId.length < 10) {
        console.warn(`[AUTO FIX] Found legacy employeeId: ${safeData.employeeId}, auto replacing with GT111's ID.`);
        safeData.employeeId = "4992823a-48ec-43f0-9263-dd17756788e6";
      }
      const insertData = { ...safeData, id: newId };
      if (collection === "employees" && (insertData.baseSalary === null || insertData.baseSalary === void 0)) {
        insertData.baseSalary = 0;
      }
      if (collection === "employees") {
        const { allowances, deductions, ...empData } = insertData;
        await db.insert(table).values(empData);
        if (allowances && allowances.length) {
          for (const a of allowances) {
            await db.insert(employeeAllowances).values({ id: (0, import_uuid2.v4)(), employeeId: newId, name: a.name, amount: String(a.amount) });
          }
        }
        if (deductions && deductions.length) {
          for (const d of deductions) {
            await db.insert(employeeDeductions).values({ id: (0, import_uuid2.v4)(), employeeId: newId, name: d.name, amount: String(d.amount) });
          }
        }
      } else if (collection === "company_info") {
        const { key, ...rest } = safeData;
        const confKey = key || "profile";
        const existing = await db.select().from(table).where((0, import_drizzle_orm2.eq)(table.configKey, confKey));
        if (existing.length > 0) {
          const currentContent = JSON.parse(existing[0].content || "{}");
          await db.update(table).set({
            content: JSON.stringify({ ...currentContent, ...rest }),
            updatedAt: /* @__PURE__ */ new Date()
          }).where((0, import_drizzle_orm2.eq)(table.id, existing[0].id));
        } else {
          await db.insert(table).values({
            id: newId,
            configKey: confKey,
            content: JSON.stringify(rest)
          });
        }
      } else if (collection === "shift_patterns") {
        const existing = await db.select().from(table).where((0, import_drizzle_orm2.eq)(table.subDepartmentId, safeData.subDepartmentId));
        if (existing.length > 0) {
          await db.update(table).set({ ...safeData, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm2.eq)(table.id, existing[0].id));
          res.json({ id: existing[0].id });
          return;
        } else {
          await db.insert(table).values(insertData);
        }
      } else {
        await db.insert(table).values(insertData);
      }
      res.json({ id: newId });
    } else if (action === "setDoc") {
      const convertDates = (obj) => {
        const res2 = { ...obj };
        const dateKeyRegex = /^(createdAt|updatedAt|startDate|overrideDate|scheduleDate|attendanceDate|requestDate|date)$/;
        for (const k in res2) {
          if (collection === "agendas" && k === "date") continue;
          if (dateKeyRegex.test(k) && res2[k] !== null && res2[k] !== void 0) {
            if (res2[k] && typeof res2[k] === "object" && "seconds" in res2[k]) {
              res2[k] = new Date(res2[k].seconds * 1e3);
            } else if (typeof res2[k] === "number" || typeof res2[k] === "string") {
              res2[k] = new Date(res2[k]);
              if (isNaN(res2[k].getTime())) delete res2[k];
            }
          }
        }
        return res2;
      };
      const safeData = convertDates(data);
      const insertData = { ...safeData, id: docId };
      const existing = await db.select().from(table).where((0, import_drizzle_orm2.eq)(table.id, docId));
      if (existing.length > 0) {
        if (collection === "employees") {
          const { allowances, deductions, ...empData } = safeData;
          await db.update(table).set(empData).where((0, import_drizzle_orm2.eq)(table.id, docId));
          await db.delete(employeeAllowances).where((0, import_drizzle_orm2.eq)(employeeAllowances.employeeId, docId));
          if (allowances && allowances.length) {
            for (const a of allowances) {
              await db.insert(employeeAllowances).values({ id: (0, import_uuid2.v4)(), employeeId: docId, name: a.name, amount: String(a.amount) });
            }
          }
          await db.delete(employeeDeductions).where((0, import_drizzle_orm2.eq)(employeeDeductions.employeeId, docId));
          if (deductions && deductions.length) {
            for (const d of deductions) {
              await db.insert(employeeDeductions).values({ id: (0, import_uuid2.v4)(), employeeId: docId, name: d.name, amount: String(d.amount) });
            }
          }
        } else if (collection === "company_info") {
          const { key, ...rest } = safeData;
          const currentContent = JSON.parse(existing[0].content || "{}");
          await db.update(table).set({
            configKey: key || existing[0].configKey,
            content: JSON.stringify({ ...currentContent, ...rest }),
            updatedAt: /* @__PURE__ */ new Date()
          }).where((0, import_drizzle_orm2.eq)(table.id, docId));
        } else {
          await db.update(table).set(safeData).where((0, import_drizzle_orm2.eq)(table.id, docId));
        }
      } else {
        if (collection === "company_info") {
          const { key, ...rest } = safeData;
          const confKey = key || "profile";
          const existingByKey = await db.select().from(table).where((0, import_drizzle_orm2.eq)(table.configKey, confKey));
          if (existingByKey.length > 0) {
            const currentContent = JSON.parse(existingByKey[0].content || "{}");
            await db.update(table).set({
              content: JSON.stringify({ ...currentContent, ...rest }),
              updatedAt: /* @__PURE__ */ new Date()
            }).where((0, import_drizzle_orm2.eq)(table.id, existingByKey[0].id));
          } else {
            await db.insert(table).values({
              id: docId,
              configKey: confKey,
              content: JSON.stringify(rest)
            });
          }
        } else if (collection === "shift_patterns") {
          const existingBySub = await db.select().from(table).where((0, import_drizzle_orm2.eq)(table.subDepartmentId, safeData.subDepartmentId));
          if (existingBySub.length > 0) {
            await db.update(table).set({ ...safeData, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm2.eq)(table.id, existingBySub[0].id));
          } else {
            await db.insert(table).values(insertData);
          }
        } else {
          await db.insert(table).values(insertData);
        }
      }
      res.json({ id: docId });
    } else if (action === "batchSetDocs") {
      const convertDates = (obj) => {
        const res2 = { ...obj };
        const dateKeyRegex = /^(createdAt|updatedAt|startDate|overrideDate|scheduleDate|attendanceDate|requestDate|date)$/;
        for (const k in res2) {
          if (collection === "agendas" && k === "date") continue;
          if (dateKeyRegex.test(k) && res2[k] !== null && res2[k] !== void 0) {
            if (res2[k] && typeof res2[k] === "object" && "seconds" in res2[k]) res2[k] = new Date(res2[k].seconds * 1e3);
            else if (typeof res2[k] === "number" || typeof res2[k] === "string") {
              res2[k] = new Date(res2[k]);
              if (isNaN(res2[k].getTime())) delete res2[k];
            }
          }
        }
        return res2;
      };
      const docs = req.body.docs;
      await db.transaction(async (tx) => {
        for (const doc of docs) {
          const safeData = convertDates(doc.data);
          const insertData = { ...safeData, id: doc.id };
          const existing = await tx.select().from(table).where((0, import_drizzle_orm2.eq)(table.id, doc.id));
          if (existing.length > 0) {
            await tx.update(table).set(safeData).where((0, import_drizzle_orm2.eq)(table.id, doc.id));
          } else {
            await tx.insert(table).values(insertData);
          }
        }
      });
      res.json({ success: true, count: docs.length });
    } else if (action === "updateDoc") {
      const convertDates = (obj) => {
        const res2 = { ...obj };
        const dateKeyRegex = /^(createdAt|updatedAt|startDate|overrideDate|scheduleDate|attendanceDate|requestDate|date)$/;
        for (const k in res2) {
          if (collection === "agendas" && k === "date") continue;
          if (dateKeyRegex.test(k) && res2[k] !== null && res2[k] !== void 0) {
            if (res2[k] && typeof res2[k] === "object" && "seconds" in res2[k]) {
              res2[k] = new Date(res2[k].seconds * 1e3);
            } else if (typeof res2[k] === "number" || typeof res2[k] === "string") {
              res2[k] = new Date(res2[k]);
              if (isNaN(res2[k].getTime())) delete res2[k];
            }
          }
        }
        return res2;
      };
      const safeData = convertDates(data);
      if (collection === "employees") {
        const { allowances, deductions, ...empData } = safeData;
        await db.update(table).set(empData).where((0, import_drizzle_orm2.eq)(table.id, docId));
        if (allowances) {
          await db.delete(employeeAllowances).where((0, import_drizzle_orm2.eq)(employeeAllowances.employeeId, docId));
          for (const a of allowances) {
            await db.insert(employeeAllowances).values({ id: (0, import_uuid2.v4)(), employeeId: docId, name: a.name, amount: String(a.amount) });
          }
        }
        if (deductions) {
          await db.delete(employeeDeductions).where((0, import_drizzle_orm2.eq)(employeeDeductions.employeeId, docId));
          for (const d of deductions) {
            await db.insert(employeeDeductions).values({ id: (0, import_uuid2.v4)(), employeeId: docId, name: d.name, amount: String(d.amount) });
          }
        }
      } else if (collection === "company_info") {
        const { key, ...rest } = safeData;
        const existing = await db.select().from(table).where((0, import_drizzle_orm2.eq)(table.id, docId));
        if (existing.length > 0) {
          const currentContent = JSON.parse(existing[0].content || "{}");
          await db.update(table).set({
            configKey: key || existing[0].configKey,
            content: JSON.stringify({ ...currentContent, ...rest }),
            updatedAt: /* @__PURE__ */ new Date()
          }).where((0, import_drizzle_orm2.eq)(table.id, docId));
        }
      } else {
        await db.update(table).set(safeData).where((0, import_drizzle_orm2.eq)(table.id, docId));
      }
      res.json({ id: docId });
    } else if (action === "deleteDoc") {
      await db.delete(table).where((0, import_drizzle_orm2.eq)(table.id, docId));
      res.json({ id: docId });
    }
  } catch (err) {
    console.error("RPC Error:", err, err.cause);
    let errorMessage = err.cause ? `${err.message} - Cause: ${err.cause.message || JSON.stringify(err.cause)}` : err.message;
    if (errorMessage.includes("violates foreign key constraint")) {
      if (errorMessage.includes("location_id")) errorMessage = "Lokasi yang dipilih tidak valid atau sudah dihapus. Silakan muat ulang halaman.";
      else if (errorMessage.includes("department_id")) errorMessage = "Bagian yang dipilih tidak valid atau sudah dihapus. Silakan muat ulang halaman.";
      else if (errorMessage.includes("sub_department_id")) errorMessage = "Sub-Bagian yang dipilih tidak valid atau sudah dihapus. Silakan muat ulang halaman.";
      else errorMessage = "Data relasi tidak valid (kemungkinan referensi data sudah dihapus). Silakan muat ulang halaman.";
    }
    res.status(500).json({ error: errorMessage });
  }
});

// server.ts
async function seedAdmin() {
  if (!process.env.DATABASE_URL && !process.env.DATABASE_PUBLIC_URL) return;
  try {
    const existingAdmin = await db.select().from(admins).where((0, import_drizzle_orm3.eq)(admins.email, "admin@admin.com")).limit(1);
    if (existingAdmin.length === 0) {
      console.log("Seeding initial super admin...");
      await db.insert(admins).values({
        id: (0, import_uuid3.v4)(),
        email: "admin@admin.com",
        password: "admin",
        name: "Super Admin",
        role: "admin"
      });
      console.log("Super Admin seeded successfully: admin@admin.com / admin");
    }
  } catch (error) {
    if (error.code !== "42P01") {
      console.error("Auto-Seed error:", error.message);
    }
  }
}
async function startServer() {
  await seedAdmin();
  const app = (0, import_express3.default)();
  const PORT = 3e3;
  app.use((0, import_cors.default)());
  app.use(import_express3.default.json({ limit: "50mb" }));
  app.use(import_express3.default.urlencoded({ limit: "50mb", extended: true }));
  app.use("/api", apiRouter);
  app.use("/api/sql", genericDbRouter);
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Cloud SQL Backend is running" });
  });
  app.get("/api/debug-env", (req, res) => {
    res.json({ dbUrl: !!process.env.DATABASE_URL, host: process.env.SQL_HOST, db: process.env.SQL_DB_NAME, postgresUrl: process.env.POSTGRES_URL });
  });
  app.post("/api/mobile/login", async (req, res) => {
    try {
      const password = req.body.password;
      const nik = req.body.nik || req.body.email;
      const employeeResult = await db.select().from(employees).where((0, import_drizzle_orm3.eq)(employees.nik, nik));
      if (employeeResult.length === 0) {
        return res.status(401).json({ error: "Kredensial tidak valid" });
      }
      const employee = employeeResult[0];
      if (employee.password !== password) {
        return res.status(401).json({ error: "Password salah" });
      }
      res.json({
        message: "Login berhasil",
        data: {
          id: employee.id,
          name: employee.name,
          nik: employee.nik,
          role: employee.role
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.get("*.apk", (req, res) => {
    const fileName = import_path.default.basename(req.path);
    const publicPath = import_path.default.join(process.cwd(), "public", fileName);
    const distPath = import_path.default.join(process.cwd(), "dist", fileName);
    const options = {
      headers: {
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Disposition": 'attachment; filename="' + fileName + '"'
      }
    };
    res.sendFile(publicPath, options, (err) => {
      if (err) {
        res.sendFile(distPath, options, (err2) => {
          if (err2) {
            res.status(404).send("File APK tidak ditemukan. Harap pastikan file APK sudah di-upload ke folder public atau dist.");
          }
        });
      }
    });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express3.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
