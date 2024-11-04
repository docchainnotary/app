#!/bin/bash

# Display help text
display_help() {
    echo "Usage: $0 [options]"
    echo
    echo "Options:"
    echo "  -u, --username    Username for the new user"
    echo "  -p, --password    Password for the new user"
    echo "  -e, --email       Email address for the new user"
    echo "  -f, --full_name   Full name of the new user"
    echo "  -h, --help        Display this help message"
    exit 1
}

# Parse command-line arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        -u|--username) username="$2"; shift ;;
        -p|--password) password="$2"; shift ;;
        -e|--email) email="$2"; shift ;;
        -f|--full_name) full_name="$2"; shift ;;
        -h|--help) display_help ;;
        *) echo "Unknown parameter passed: $1"; display_help ;;
    esac
    shift
done

# Prompt for missing values
[[ -z "$username" ]] && read -p "Enter username: " username
[[ -z "$password" ]] && read -sp "Enter password: " password && echo
[[ -z "$email" ]] && read -p "Enter email: " email
[[ -z "$full_name" ]] && read -p "Enter full name: " full_name

# Send the registration request
response=$(curl -s -X POST "https://app.docchainnotary.com/api?x=register" \
-H "Content-Type: application/json" \
-d "{
  \"username\": \"$username\",
  \"password\": \"$password\",
  \"email\": \"$email\",
  \"full_name\": \"$full_name\"
}")

# Display response
echo "Server response: $response"

