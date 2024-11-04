<?php
require 'vendor/autoload.php'; // Include this if using Composer for JWT library

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// Load configuration from .env.json
$configFile = '.env.json';
if (!file_exists($configFile)) {
    die("Configuration file .env.json not found.");
}

$config = json_decode(file_get_contents($configFile), true);
if ($config === null) {
    die("Error parsing .env.json file.");
}

// Extract DB and JWT configurations
$dbConfig = $config['db'];
$jwtConfig = $config['jwt'];

// Database configuration
$dbHost = $dbConfig['host'];
$dbUser = $dbConfig['user'];
$dbPass = $dbConfig['pass'];
$dbName = $dbConfig['db'];

// JWT configuration
$secretKey = $jwtConfig['key'];
$algorithm = "HS256";

// Connect to MySQL
$conn = new mysqli($dbHost, $dbUser, $dbPass, $dbName);
if ($conn->connect_error) {
    die("Database connection failed: " . $conn->connect_error);
}

// Get credentials from POST data
$username = $_POST['username'] ?? null;
$password = $_POST['password'] ?? null;

if (!$username || !$password) {
    http_response_code(400);
    echo json_encode(['error' => 'Username and password are required']);
    exit();
}

// Hash the password
$hashedPassword = hash('sha256', $password);

// Query to check the user's credentials
$stmt = $conn->prepare("SELECT username FROM users WHERE username = ? AND password = ?");
$stmt->bind_param("ss", $username, $hashedPassword);
$stmt->execute();
$result = $stmt->get_result();

// Verify user credentials
if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();

    // Create JWT token payload
    $payload = [
        "sub" => $user['username'],
        "iat" => time(),
        "exp" => time() + (60 * 60) // Token expires in 1 hour
    ];

    // Encode JWT
    $jwt = JWT::encode($payload, $secretKey, $algorithm);

    // Respond with token
    echo json_encode(["access_token" => $jwt, "token_type" => "bearer"]);
} else {
    http_response_code(401);
    echo json_encode(["error" => "Invalid credentials"]);
}

// Close database connection
$stmt->close();
$conn->close();
?>
