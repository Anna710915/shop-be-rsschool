import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

console.log("Jest environment variables loaded:", process.env);
