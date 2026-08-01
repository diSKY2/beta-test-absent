const fs = require('fs');
let code = fs.readFileSync('server/api.ts', 'utf8');

const oldQueries = `    const queries = [
      db.select().from(locations),
      db.select().from(departments),
      db.select().from(subDepartments),
      db.select().from(employees),
      db.select().from(attendances).where(
        and(
          gte(attendances.attendanceDate, fromDate),
          lte(attendances.attendanceDate, toDate)
        )
      )
    ];

    const results = await Promise.all(queries);

    res.json({
      locations: results[0],
      departments: results[1],
      subDepartments: results[2],
      employees: results[3],
      attendances: results[4]
    });`;

const newQueries = `    const queries = [
      db.select().from(locations),
      db.select().from(departments),
      db.select().from(subDepartments),
      db.select().from(employees),
      db.select().from(attendances).where(
        and(
          gte(attendances.attendanceDate, fromDate),
          lte(attendances.attendanceDate, toDate)
        )
      ),
      db.select().from(schedules).where(
        and(
          gte(schedules.date, fromDate),
          lte(schedules.date, toDate)
        )
      )
    ];

    const results = await Promise.all(queries);

    res.json({
      locations: results[0],
      departments: results[1],
      subDepartments: results[2],
      employees: results[3],
      attendances: results[4],
      schedules: results[5] || []
    });`;

code = code.replace(oldQueries, newQueries);
fs.writeFileSync('server/api.ts', code);
