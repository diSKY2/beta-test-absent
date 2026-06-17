import { db } from "./src/db/index";
import { admins } from "./src/db/schema";
import { v4 as uuidv4 } from "uuid";

async function main() {
  try {
    const adminId = uuidv4();
    await db.insert(admins).values({
      id: adminId,
      email: "admin@admin.com",
      password: "admin", // using plain text base on schema just having a comment
      name: "Super Admin",
      role: "admin",
    });
    console.log("Admin seeded successfully! email: admin@admin.com | password: admin");
    process.exit(0);
  } catch (error: any) {
    if (error.code === '23505') {
        console.log("Admin account with this email already exists.");
        process.exit(0);
    } else {
        console.error("Failed to seed admin:", error);
        process.exit(1);
    }
  }
}

main();
