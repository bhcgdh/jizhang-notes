# Project Instructions

- When the user says "更新 Git", "更新 GitHub", "推送 Git", or "push GitHub", directly run:
  `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\push-github.ps1`
- Do not repeat the Git push procedure unless execution fails.
- The push script performs checks, creates a commit when needed, excludes data files, and pushes `main`.
