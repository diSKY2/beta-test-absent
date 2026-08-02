const fs = require('fs');
let code = fs.readFileSync('server/api.ts', 'utf8');

const target = `    const exchanges = await db.select().from(shiftExchanges)
      .where(and(eq(shiftExchanges.status, 'Approved'), or(eq(shiftExchanges.requesterId, id), eq(shiftExchanges.replacerId, id))));`;

const replacement = `    const rawExchanges = await db.select().from(shiftExchanges)
      .where(and(eq(shiftExchanges.status, 'Approved'), or(eq(shiftExchanges.requesterId, id), eq(shiftExchanges.replacerId, id))));
    
    // Sort exchanges by createdAt descending so the latest exchange takes precedence
    const exchanges = rawExchanges.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('server/api.ts', code);
    console.log("Patched successfully");
} else {
    console.log("Target not found");
}
