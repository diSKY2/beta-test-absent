import { db } from './src/db';
import { locations } from './src/db/schema';
import { v4 } from 'uuid';

async function test() {
  try {
    await db.insert(locations).values({
      id: v4(),
      name: 'Lok 1',
      latitude: String(-6.2),
      longitude: String(106.8),
      radius: 100
    });
    console.log('Success String Decimals');
    
    await db.insert(locations).values({
      id: v4(),
      name: 'Lok 2',
      latitude: -6.2 as any,
      longitude: 106.8 as any,
      radius: 100
    });
    console.log('Success Number Decimals');
  } catch (e) {
    console.error(e);
  }
}
test();
