#!/usr/bin/env bash
set -euo pipefail
python manage.py migrate
python manage.py collectstatic --noinput
