<?php
// Configuration
$tokenUrl = "http://localhost:8000/token";

// Function to prompt for user input if not provided in URL parameters
function prompt($prompt_msg) {
    echo $prompt_msg;
    $handle = fopen("php://stdin", "r");
    $line = fgets($handle);
    return trim($line);
}

// Get username and password from query parameters or prompt for them
$username = $_GET['username'] ?? prompt("Enter username: ");
$password = $_GET['password'] ?? prompt("Enter password: ");

// Prepare the data payload
$data = [
    'username' => $username,
    'password' => $password
];

// Initialize cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $tokenUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));

// Execute the request
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Handle response
if ($httpCode == 200) {
    $result = json_decode($response, true);
    echo "Access Token: " . $result['access_token'] . PHP_EOL;
} else {
    echo "Error: Unable to obtain token. Server responded with: " . $response . PHP_EOL;
}
?>
