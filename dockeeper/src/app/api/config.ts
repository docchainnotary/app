// API base URL - change this to match your PHP server
export const API_BASE_URL = 'http://localhost/your-php-path/api.php';

// Helper function for API calls
export async function fetchApi(action: string, params = {}) {
  const queryParams = new URLSearchParams({ x: action, ...params });
  const response = await fetch(`${API_BASE_URL}?${queryParams}`);
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }
  
  return response.json();
}
