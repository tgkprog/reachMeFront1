#!/bin/bash
# Run ReachMe server without debugger, loading .env and .local.env overrides
cd "$(dirname "$0")"
NODE_ENV=development env=local node server.js
