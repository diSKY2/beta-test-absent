import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db } from "./src/db";
import { admins, employees } from "./src/db/schema";
import { eq } from "drizzle-orm";
import cors from "cors";
import { apiRouter } from "./server/api";
import { genericDbRouter } from "./server/firestoreAdapter";

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.use('/api', apiRouter);
  app.use('/api/sql', genericDbRouter);

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Cloud SQL Backend is running" });
  });

  // API for Mobile App - Employee Login
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
