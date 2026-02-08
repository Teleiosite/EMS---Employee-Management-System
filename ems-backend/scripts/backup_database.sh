#!/usr/bin/env bash
set -euo pipefail
pg_dump "$DATABASE_URL" > "backup_$(date +%Y%m%d_%H%M%S).sql"
