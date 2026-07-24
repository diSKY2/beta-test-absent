const fs = require('fs');
let code = fs.readFileSync('server/api.ts', 'utf8');

// Fix 1: subDepartmentId_old
code = code.replace(
  "apiRouter.get('/shift-exchanges/danru/:subDepartmentId_old', async (req, res) => {",
  "apiRouter.get('/shift-exchanges/danru/:subDepartmentId', async (req, res) => {"
);

// Fix 2: newEx status type
code = code.replace(
  "status: 'Pending_Replacer'",
  "status: 'Pending_Replacer' as const"
);

// Fix 3: pattern sequence logic
const oldPatternLogic = `        const cycleLength = pattern.workDays + pattern.offDays;
        const refDate = new Date(pattern.referenceDate || new Date());
        refDate.setHours(0,0,0,0);
        const diffTime = targetDate.getTime() - refDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
        
        if (diffDays >= 0) {
          const dayInCycle = diffDays % cycleLength;
          if (dayInCycle < pattern.workDays) {
            activeShift = sTypes.find(s => s.id === pattern.shiftTypeId);
          }
        }`;

const newPatternLogic = `        const sequence = Array.isArray(pattern.sequence) ? pattern.sequence : [];
        if (sequence.length > 0) {
          const cycleLength = sequence.length;
          const refDate = new Date(pattern.startDate);
          refDate.setHours(0,0,0,0);
          const diffTime = targetDate.getTime() - refDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
          
          if (diffDays >= 0) {
            const dayInCycle = diffDays % cycleLength;
            const shiftId = sequence[dayInCycle];
            if (shiftId && shiftId !== 'off') {
              activeShift = sTypes.find(s => s.id === shiftId);
            }
          }
        }`;

code = code.replace(oldPatternLogic, newPatternLogic);

fs.writeFileSync('server/api.ts', code);
