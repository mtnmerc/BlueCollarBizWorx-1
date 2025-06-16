#!/bin/bash
echo "Starting BizWorx Development Server..."
cd /home/runner/workspace
export NODE_ENV=development
export PORT=5000
exec npx tsx server/index.ts