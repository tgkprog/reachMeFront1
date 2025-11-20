#!/bin/bash
# Run ReachMe Web Client (Vue + Vite) on port 8087 without debugger
cd "$(dirname "$0")"
NODE_ENV=development npm run dev:8087
