#!/usr/bin/env bash
# Chrome cho các công cụ kiểm tra của taste-skill khi chạy bằng quyền root (máy Claude Code trên web):
#   CHROME_PATH=tools/chrome-nosandbox.sh node .claude/skills/design-taste-frontend/scripts/perf.mjs ...
exec "${CHROME_REAL:-/opt/pw-browsers/chromium}" --no-sandbox "$@"
