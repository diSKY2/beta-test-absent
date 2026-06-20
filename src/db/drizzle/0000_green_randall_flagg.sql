CREATE TYPE "public"."attendance_status" AS ENUM('Hadir', 'Izin', 'Sakit', 'Alpa');--> statement-breakpoint
CREATE TYPE "public"."leave_request_type" AS ENUM('Izin', 'Sakit');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('Pending', 'Approved', 'Rejected');--> statement-breakpoint
CREATE TABLE "admins" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255),
	"name" varchar(255),
	"role" varchar(50) DEFAULT 'admin',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"type" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendances" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"employee_id" varchar(50) NOT NULL,
	"attendance_date" timestamp NOT NULL,
	"status" "attendance_status" NOT NULL,
	"time_in" time,
	"time_out" time,
	"is_late" boolean DEFAULT false,
	"photo_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_info" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"config_key" varchar(100) NOT NULL,
	"content" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "company_info_config_key_unique" UNIQUE("config_key")
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"location_id" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_allowances" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"employee_id" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"amount" numeric(15, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_deductions" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"employee_id" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"amount" numeric(15, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"nik" varchar(50),
	"name" varchar(255) NOT NULL,
	"password" varchar(100),
	"location_id" varchar(50) NOT NULL,
	"department_id" varchar(50) NOT NULL,
	"sub_department_id" varchar(50) NOT NULL,
	"base_salary" numeric(15, 2) NOT NULL,
	"role" varchar(100) NOT NULL,
	"profile_pic_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "galleries" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"media_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"employee_id" varchar(50) NOT NULL,
	"request_date" timestamp NOT NULL,
	"type" "leave_request_type" NOT NULL,
	"reason" text NOT NULL,
	"photo_url" text,
	"status" "request_status" DEFAULT 'Pending',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"latitude" numeric(20, 8) NOT NULL,
	"longitude" numeric(20, 8) NOT NULL,
	"radius" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "overtime_requests" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"employee_id" varchar(50) NOT NULL,
	"request_date" timestamp NOT NULL,
	"reason" text NOT NULL,
	"hours" integer NOT NULL,
	"status" "request_status" DEFAULT 'Pending',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedules" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"employee_id" varchar(50) NOT NULL,
	"sub_department_id" varchar(50) NOT NULL,
	"date" timestamp NOT NULL,
	"shift_type_id" varchar(50),
	"shift_name" varchar(100),
	"shift_start" varchar(10),
	"shift_end" varchar(10),
	"is_off_day" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_patterns" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"sub_department_id" varchar(50) NOT NULL,
	"start_date" timestamp NOT NULL,
	"sequence" json NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shift_patterns_sub_department_id_unique" UNIQUE("sub_department_id")
);
--> statement-breakpoint
CREATE TABLE "shift_types" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"sub_department_id" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"is_cross_day" boolean DEFAULT false,
	"is_off_day" boolean DEFAULT false,
	"color" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sub_departments" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"department_id" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subdept_schedule_overrides" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"sub_department_id" varchar(50) NOT NULL,
	"override_date" timestamp NOT NULL,
	"shift_type_id" varchar(50),
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_reports" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"employee_id" varchar(50) NOT NULL,
	"date" timestamp NOT NULL,
	"description" text NOT NULL,
	"photo_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_allowances" ADD CONSTRAINT "employee_allowances_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_deductions" ADD CONSTRAINT "employee_deductions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_sub_department_id_sub_departments_id_fk" FOREIGN KEY ("sub_department_id") REFERENCES "public"."sub_departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overtime_requests" ADD CONSTRAINT "overtime_requests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_sub_department_id_sub_departments_id_fk" FOREIGN KEY ("sub_department_id") REFERENCES "public"."sub_departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_patterns" ADD CONSTRAINT "shift_patterns_sub_department_id_sub_departments_id_fk" FOREIGN KEY ("sub_department_id") REFERENCES "public"."sub_departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_types" ADD CONSTRAINT "shift_types_sub_department_id_sub_departments_id_fk" FOREIGN KEY ("sub_department_id") REFERENCES "public"."sub_departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_departments" ADD CONSTRAINT "sub_departments_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subdept_schedule_overrides" ADD CONSTRAINT "subdept_schedule_overrides_sub_department_id_sub_departments_id_fk" FOREIGN KEY ("sub_department_id") REFERENCES "public"."sub_departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subdept_schedule_overrides" ADD CONSTRAINT "subdept_schedule_overrides_shift_type_id_shift_types_id_fk" FOREIGN KEY ("shift_type_id") REFERENCES "public"."shift_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_reports" ADD CONSTRAINT "work_reports_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;