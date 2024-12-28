#!/bin/bash

curl -X POST "https://app.docchainnotary.com/api?x=register" \
-H "Content-Type: application/json" \
-d '{
  "user": "testuser",
  "pw": "SecurePassword123",
  "email": "newuser@example.com",
  "full_name": "New User"
}'

