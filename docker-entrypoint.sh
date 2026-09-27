#!/bin/sh
set -e

# Fix upload directory permissions at startup.
# Needed when the named volume was first initialized as root (existing production volumes).
mkdir -p /app/public/uploads
chown -R nextjs:nodejs /app/public/uploads 2>/dev/null || true

# Drop to nextjs user and exec the given command (CMD from Dockerfile)
exec su-exec nextjs "$@"
