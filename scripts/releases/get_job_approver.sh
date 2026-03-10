if [ -z "$CIRCLE_TOKEN" ]; then
  echo "Error: CIRCLE_TOKEN is not set" >&2
  exit 1
fi

if [ -z "$CIRCLE_WORKFLOW_ID" ]; then
  if [ -z "$CIRCLE_PIPELINE_ID" ]; then
    echo "Error: Neither CIRCLE_WORKFLOW_ID nor CIRCLE_PIPELINE_ID is set" >&2
    exit 1
  fi
  pipelineJson=$(curl -s -X GET "https://circleci.com/api/v2/pipeline/$CIRCLE_PIPELINE_ID/workflow" --header "Circle-Token: $CIRCLE_TOKEN")
  CIRCLE_WORKFLOW_ID=$(echo "$pipelineJson" | jq -r '.items[0].id // empty')
  if [ -z "$CIRCLE_WORKFLOW_ID" ]; then
    echo "Error: Failed to get workflow ID from pipeline" >&2
    exit 1
  fi
fi

response=$(curl -s -w "\n%{http_code}" -X GET "https://circleci.com/api/v2/workflow/$CIRCLE_WORKFLOW_ID/job" --header "Circle-Token: $CIRCLE_TOKEN")
http_code=$(echo "$response" | tail -n1)
jobsJson=$(echo "$response" | sed '$d')

if [ "$http_code" != "200" ]; then
  echo "Error: CircleCI API returned HTTP $http_code" >&2
  echo "Workflow ID: $CIRCLE_WORKFLOW_ID" >&2
  echo "Response: $jobsJson" >&2
  exit 1
fi

if [ -z "$jobsJson" ]; then
  echo "Error: Failed to fetch jobs from CircleCI API (empty response)" >&2
  exit 1
fi

if ! echo "$jobsJson" | jq -e '.items' > /dev/null 2>&1; then
  echo "Error: Invalid JSON response from CircleCI API" >&2
  echo "Response: $jobsJson" >&2
  exit 1
fi

job=$(jq '.items[] | select(.name == "hold_publish" or .name == "hold_slack_notification") | select(.approved_by != null)' <<< "$jobsJson")

if [ -z "$job" ] || [ "$job" == "null" ]; then
  echo "Error: Could not find approved job in workflow" >&2
  exit 1
fi

approver_id=$(jq '.approved_by' <<< "$job")

approver_id=$(tr -d '"' <<< "$approver_id")

user=$(curl -s -X GET "https://circleci.com/api/v2/user/$approver_id" --header "Circle-Token: $CIRCLE_TOKEN")

username=$(jq '.login' <<< "$user")

username=$(tr -d '"' <<< "$username")

slack_id=$(./scripts/releases/get_slack_id_from_username.sh "$username")

echo "$slack_id"