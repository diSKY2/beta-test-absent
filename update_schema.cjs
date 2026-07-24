const fs = require('fs');
let code = fs.readFileSync('src/db/schema.ts', 'utf8');

const newTable = `
export const shiftExchangeStatusEnum = pgEnum('shift_exchange_status', ['Pending_Replacer', 'Pending_Danru', 'Approved', 'Rejected']);

export const shiftExchanges = pgTable('shift_exchanges', {
  id: varchar('id', { length: 50 }).primaryKey(),
  requesterId: varchar('requester_id', { length: 50 }).notNull().references(() => employees.id, { onDelete: 'cascade' }),
  replacerId: varchar('replacer_id', { length: 50 }).notNull().references(() => employees.id, { onDelete: 'cascade' }),
  dateToReplace: timestamp('date_to_replace').notNull(), // Tanggal dimana Requester digantikan oleh Replacer
  dateToPayback: timestamp('date_to_payback').notNull(), // Tanggal dimana Replacer digantikan oleh Requester (pelunasan)
  status: shiftExchangeStatusEnum('status').default('Pending_Replacer'),
  reason: text('reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
`;

code = code + newTable;
fs.writeFileSync('src/db/schema.ts', code);
