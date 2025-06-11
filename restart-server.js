// Force server restart
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Touch the main server file to trigger hot reload
const serverPath = path.join(__dirname, 'server', 'index.ts');
const content = fs.readFileSync(serverPath, 'utf8');
fs.writeFileSync(serverPath, content);

console.log('Server restart triggered');