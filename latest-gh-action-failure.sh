#!/bin/bash

# Get the repository in owner/repo format
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)

# Get the latest failed workflow run
LATEST_FAILURE=$(gh run list --repo "$REPO" --status failure --limit 1 --json databaseId,displayTitle,conclusion -q '.[0]')

if [ -z "$LATEST_FAILURE" ]; then
    echo "No failed workflow runs found"
    exit 1
fi

RUN_ID=$(echo "$LATEST_FAILURE" | jq -r '.databaseId')
RUN_TITLE=$(echo "$LATEST_FAILURE" | jq -r '.displayTitle')

echo "Found failed run: $RUN_TITLE (ID: $RUN_ID)"
echo "Fetching logs..."

# Get all job logs for the failed run
LOGS=$(gh run view "$RUN_ID" --repo "$REPO" --log-failed 2>/dev/null)

if [ -z "$LOGS" ]; then
    # If --log-failed doesn't work, try getting all logs
    LOGS=$(gh run view "$RUN_ID" --repo "$REPO" --log 2>/dev/null)
fi

# Create a formatted output with run details and logs
OUTPUT="GitHub Action Failure Report
Repository: $REPO
Run: $RUN_TITLE
Run ID: $RUN_ID
URL: https://github.com/$REPO/actions/runs/$RUN_ID

================================================================================
LOGS:
================================================================================

$LOGS"

echo "$OUTPUT"