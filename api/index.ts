import express from "express";
import cors from "cors";
import { apiRouter } from "../server/api";
import { genericDbRouter } from "../server/firestoreAdapter";
import { db } from "../src/db";
import { employees } from "../src/db/schema";
import { eq } from "drizzle-orm";

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Pasang router
app.use('/api/sql', genericDbRouter);
app.use('/api', apiRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Cloud SQL Backend is running on Vercel Serverless" });
});

// Login khusus mobile
app.post("/api/mobile/login", async (req, res) => {
  try {
    const { nik, password } = req.body;
    const employeeResult = await db.select().from(employees).where(eq(employees.nik, nik));
    
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
        role: employee.role,
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Penting untuk Vercel: Export aplikasi express
export default app;
