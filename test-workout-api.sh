#!/bin/bash

# Set the base URL
BASE_URL="http://localhost:3001"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
  echo -e "\n${BLUE}==== $1 ====${NC}\n"
}

# Function to handle API responses
handle_response() {
  if [ $1 -eq 0 ] && [ $2 -eq 200 -o $2 -eq 201 ]; then
    echo -e "${GREEN}Success: Status code $2${NC}"
    echo "$3" | jq .
    return 0
  else
    echo -e "${RED}Error: Status code $2${NC}"
    echo "$3" | jq .
    return 1
  fi
}

# Store tokens and IDs
ACCESS_TOKEN=""
USER_ID=""
WORKOUT_PLAN_ID=""
WORKOUT_DAY_ID=""
WORKOUT_LOG_ID=""
EXERCISE_ID=""

# 1. Register a new user
print_header "REGISTERING A NEW USER"
REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "workout_test@example.com",
    "password": "Password123!",
    "firstName": "Workout",
    "lastName": "Tester"
  }')

HTTP_STATUS=$(echo "$REGISTER_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$REGISTER_RESPONSE" | sed '$d')

if handle_response 0 $HTTP_STATUS "$RESPONSE_BODY"; then
  USER_ID=$(echo "$RESPONSE_BODY" | jq -r '.id')
  echo "User ID: $USER_ID"
else
  echo "Registration failed, trying to login instead..."
fi

# 2. Login to get access token
print_header "LOGGING IN"
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "workout_test@example.com",
    "password": "Password123!"
  }')

HTTP_STATUS=$(echo "$LOGIN_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')

if handle_response 0 $HTTP_STATUS "$RESPONSE_BODY"; then
  ACCESS_TOKEN=$(echo "$RESPONSE_BODY" | jq -r '.access_token')
  echo "Access Token: ${ACCESS_TOKEN:0:20}..."
else
  echo "Login failed. Exiting."
  exit 1
fi

# 3. Add user health data
print_header "ADDING USER HEALTH DATA"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/user-data" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "height": 180,
    "weight": 80,
    "age": 30,
    "gender": "MALE",
    "activityLevel": "moderate",
    "fitnessGoals": "build muscle and lose weight",
    "workoutLocation": "gym",
    "additionalNotes": "No injuries or health conditions",
    "availableEquipment": ["dumbbells", "barbell", "bench"]
  }')

HTTP_STATUS=$(echo "$HEALTH_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$HEALTH_RESPONSE" | sed '$d')

handle_response 0 $HTTP_STATUS "$RESPONSE_BODY"

# 4. Generate a workout plan
print_header "GENERATING A WORKOUT PLAN"
GENERATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/workouts/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "name": "My AI Workout Plan",
    "goal": "strength",
    "frequency": "medium",
    "split": "push_pull_legs",
    "durationWeeks": 4,
    "additionalNotes": "Focus on compound movements"
  }')

HTTP_STATUS=$(echo "$GENERATE_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$GENERATE_RESPONSE" | sed '$d')

if handle_response 0 $HTTP_STATUS "$RESPONSE_BODY"; then
  WORKOUT_PLAN_ID=$(echo "$RESPONSE_BODY" | jq -r '.id')
  echo "Workout Plan ID: $WORKOUT_PLAN_ID"
else
  echo "Failed to generate workout plan. Exiting."
  exit 1
fi

# 5. Get all workout plans
print_header "GETTING ALL WORKOUT PLANS"
PLANS_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/workouts/plans" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

HTTP_STATUS=$(echo "$PLANS_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$PLANS_RESPONSE" | sed '$d')

if handle_response 0 $HTTP_STATUS "$RESPONSE_BODY"; then
  # Get the first workout day ID
  WORKOUT_DAY_ID=$(echo "$RESPONSE_BODY" | jq -r '.[0].workoutDays[0].id')
  echo "Workout Day ID: $WORKOUT_DAY_ID"
  
  # Get the first exercise ID from the first workout day
  EXERCISE_ID=$(echo "$RESPONSE_BODY" | jq -r '.[0].workoutDays[0].exercises[0].exercise.id')
  echo "Exercise ID: $EXERCISE_ID"
  
  # If no exercise ID was found, use a default UUID
  if [ "$EXERCISE_ID" = "null" ] || [ -z "$EXERCISE_ID" ]; then
    EXERCISE_ID="00000000-0000-0000-0000-000000000001"
    echo "Using default Exercise ID: $EXERCISE_ID"
  fi
else
  echo "Failed to get workout plans. Exiting."
  exit 1
fi

# 6. Get a specific workout plan
print_header "GETTING A SPECIFIC WORKOUT PLAN"
PLAN_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/workouts/plans/$WORKOUT_PLAN_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

HTTP_STATUS=$(echo "$PLAN_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$PLAN_RESPONSE" | sed '$d')

handle_response 0 $HTTP_STATUS "$RESPONSE_BODY"

# 7. Update a workout plan
print_header "UPDATING A WORKOUT PLAN"
UPDATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE_URL/workouts/plans/$WORKOUT_PLAN_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "name": "Updated Workout Plan",
    "description": "This plan has been updated"
  }')

HTTP_STATUS=$(echo "$UPDATE_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$UPDATE_RESPONSE" | sed '$d')

handle_response 0 $HTTP_STATUS "$RESPONSE_BODY"

# 8. Create a workout log
print_header "CREATING A WORKOUT LOG"
LOG_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/workouts/logs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "workoutDayId": "'$WORKOUT_DAY_ID'",
    "startTime": "2023-06-01T10:00:00Z",
    "endTime": "2023-06-01T11:00:00Z",
    "durationMinutes": 60,
    "notes": "Great workout!",
    "rating": 4,
    "feelingDescription": "Felt strong today",
    "exercises": [
      {
        "exerciseId": "'$EXERCISE_ID'",
        "order": 1,
        "notes": "Increased weight",
        "sets": [
          {
            "setNumber": 1,
            "type": "normal",
            "reps": 10,
            "weight": 50,
            "completed": true
          },
          {
            "setNumber": 2,
            "type": "normal",
            "reps": 8,
            "weight": 55,
            "completed": true
          }
        ]
      }
    ]
  }')

HTTP_STATUS=$(echo "$LOG_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$LOG_RESPONSE" | sed '$d')

if handle_response 0 $HTTP_STATUS "$RESPONSE_BODY"; then
  WORKOUT_LOG_ID=$(echo "$RESPONSE_BODY" | jq -r '.id')
  echo "Workout Log ID: $WORKOUT_LOG_ID"
else
  echo "Failed to create workout log."
fi

# 9. Get all workout logs
print_header "GETTING ALL WORKOUT LOGS"
LOGS_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/workouts/logs" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

HTTP_STATUS=$(echo "$LOGS_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$LOGS_RESPONSE" | sed '$d')

handle_response 0 $HTTP_STATUS "$RESPONSE_BODY"

# 10. Get a specific workout log
print_header "GETTING A SPECIFIC WORKOUT LOG"
LOG_DETAIL_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/workouts/logs/$WORKOUT_LOG_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

HTTP_STATUS=$(echo "$LOG_DETAIL_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$LOG_DETAIL_RESPONSE" | sed '$d')

handle_response 0 $HTTP_STATUS "$RESPONSE_BODY"

# 11. Get monthly analytics
print_header "GETTING MONTHLY ANALYTICS"
ANALYTICS_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/workouts/analytics?year=2023&month=6" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

HTTP_STATUS=$(echo "$ANALYTICS_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$ANALYTICS_RESPONSE" | sed '$d')

handle_response 0 $HTTP_STATUS "$RESPONSE_BODY" || echo "Analytics may not exist for this month yet."

# 12. Generate monthly report
print_header "GENERATING MONTHLY REPORT"
REPORT_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/workouts/analytics/report?year=2023&month=6" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

HTTP_STATUS=$(echo "$REPORT_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$REPORT_RESPONSE" | sed '$d')

handle_response 0 $HTTP_STATUS "$RESPONSE_BODY" || echo "Report may not exist for this month yet."

# 13. Delete a workout log
print_header "DELETING A WORKOUT LOG"
DELETE_LOG_RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/workouts/logs/$WORKOUT_LOG_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

HTTP_STATUS=$(echo "$DELETE_LOG_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$DELETE_LOG_RESPONSE" | sed '$d')

handle_response 0 $HTTP_STATUS "$RESPONSE_BODY" || echo "No content response is expected"

# 14. Delete a workout plan
print_header "DELETING A WORKOUT PLAN"
DELETE_PLAN_RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/workouts/plans/$WORKOUT_PLAN_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

HTTP_STATUS=$(echo "$DELETE_PLAN_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$DELETE_PLAN_RESPONSE" | sed '$d')

handle_response 0 $HTTP_STATUS "$RESPONSE_BODY" || echo "No content response is expected"

print_header "TEST COMPLETED"
echo "All workout module endpoints have been tested!" 