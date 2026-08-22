const { format } = require('date-fns');
const dateFrom = '2026-08-10';
const start = new Date(dateFrom);
console.log(start.toISOString(), format(start, 'yyyy-MM-dd'));
