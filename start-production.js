#!/usr/bin/env node

// Simple production startup script
process.env.NODE_ENV = 'production';

import('./server/index.ts').then(() => {
  console.log('Production server started successfully');
}).catch(err => {
  console.error('Failed to start production server:', err);
  process.exit(1);
});