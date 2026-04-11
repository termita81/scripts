#!/bin/bash

# https://piechowski.io/post/git-commands-before-reading-code/

# What Changes The Most
git log --format=format: --name-only --since="1 year ago" | sort | uniq -c | sort -nr | head -20

# Who Built This
git shortlog -sn --no-merges

# Where Do Bugs Cluster
git log -i -E --grep="fix|bug|broken" --name-only --format='' | sort | uniq -c | sort -nr | head -20

# Is This Project Accelerating or Dying
git log --format='%ad' --date=format:'%Y-%m' | sort | uniq -c

# How Often Is the Team Firefighting
git log --oneline --since="1 year ago" | grep -iE 'revert|hotfix|emergency|rollback'

