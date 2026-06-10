<?php
header('Content-Type: application/json');

// -----------------------------------------------
// CONFIGURATION — replace with your Anthropic key
// -----------------------------------------------
define('ANTHROPIC_API_KEY', 'YOUR_ANTHROPIC_API_KEY_HERE');
define('MODEL', 'claude-haiku-4-5-20251001'); // swap to claude-sonnet-4-6 for higher quality

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Basic rate limiting via session (30 requests per hour per visitor)
@session_start();
if (!isset($_SESSION['chat_requests'])) $_SESSION['chat_requests'] = [];
$_SESSION['chat_requests'] = array_filter($_SESSION['chat_requests'], fn($t) => $t > time() - 3600);
if (count($_SESSION['chat_requests']) >= 30) {
    http_response_code(429);
    echo json_encode(['error' => 'Too many requests. Please try again later.']);
    exit;
}
$_SESSION['chat_requests'][] = time();

// Parse and validate input
$input = json_decode(file_get_contents('php://input'), true);
$messages = $input['messages'] ?? [];

if (empty($messages) || !is_array($messages)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request']);
    exit;
}

// Keep last 20 messages to control token usage
$messages = array_slice($messages, -20);

// Sanitize: only allow role/content keys, truncate long messages
$messages = array_map(function($m) {
    return [
        'role'    => in_array($m['role'] ?? '', ['user', 'assistant']) ? $m['role'] : 'user',
        'content' => substr($m['content'] ?? '', 0, 2000),
    ];
}, $messages);

// Load bio context
$bioFile = __DIR__ . '/bio.txt';
$bio = file_exists($bioFile) ? file_get_contents($bioFile) : '';

$systemPrompt = "YOUR_SYSTEM_PROMPT_HERE\n\n" . $bio;

// Call Anthropic API
$payload = [
    'model'      => MODEL,
    'max_tokens' => 1024,
    'system'     => $systemPrompt,
    'messages'   => $messages,
];

$ch = curl_init('https://api.anthropic.com/v1/messages');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode($payload),
    CURLOPT_TIMEOUT        => 30,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'x-api-key: ' . ANTHROPIC_API_KEY,
        'anthropic-version: 2023-06-01',
    ],
]);

$response  = curl_exec($ch);
$httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(500);
    echo json_encode(['error' => 'Network error contacting AI service.']);
    exit;
}

http_response_code($httpCode);
echo $response;
