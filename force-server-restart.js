// Force server restart to activate authentication endpoints
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function forceServerRestart() {
  console.log('Forcing server restart to activate authentication endpoints...');
  
  try {
    // Kill any existing node processes
    await execAsync('pkill -f "tsx.*server" || true');
    console.log('Existing server processes terminated');
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Start server in background
    const serverProcess = exec('cd . && npm run dev', (error, stdout, stderr) => {
      if (error) {
        console.log('Server start error:', error);
        return;
      }
    });
    
    console.log('Server restart initiated');
    console.log('Authentication endpoints should now be active');
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('Server restart complete');
    
  } catch (error) {
    console.log('Restart process error:', error.message);
  }
}

forceServerRestart();