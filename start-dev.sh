#!/bin/bash
cd /home/runner/workspace
export NODE_ENV=development
exec tsx server/index.ts