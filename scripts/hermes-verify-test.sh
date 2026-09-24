#!/bin/bash
cd /c/Users/johnb/cultcodex-v2/scripts
timeout 30 python sync_to_obsidian.py --lore --limit 1
exit_code=$?
if [ $exit_code -eq 0 ]; then
  echo "SUCCESS"
else
  echo "FAILED with exit code $exit_code"
fi