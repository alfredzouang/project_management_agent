/**
 * API utility for backend RESTful calls.
 * Adjust BASE_URL as needed for your backend.
 */
const BASE_URL = "/api"; // Change to your backend base path if needed

// Helper for handling JSON responses and errors
async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "API error");
  }
  return response.json();
}

// Get all projects
export async function getProjects() {
  const res = await fetch(`${BASE_URL}/projects`);
  return handleResponse(res);
}

// Get a single project by ID
export async function getProject(id) {
  const res = await fetch(`${BASE_URL}/projects/${id}`);
  return handleResponse(res);
}

// Create a new project
export async function createProject(data) {
  const res = await fetch(`${BASE_URL}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// Update an existing project
export async function updateProject(id, data) {
  const res = await fetch(`${BASE_URL}/projects/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// Delete a project
export async function deleteProject(id) {
  const res = await fetch(`${BASE_URL}/projects/${id}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

/**
 * Send chat messages to /project/create endpoint.
 * @param {string[]} messages - List of chat messages.
 * @returns {Promise<Object>} - Response JSON with { project: ... }
 */
export async function sendChatMessages(messages) {
  // Use absolute URL for local dev, relative for production
  let url = "/project/create";
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ) {
    url = "http://localhost:8000/project/create";
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  return handleResponse(res);
}

// Example: generic request for other endpoints
export async function apiRequest(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, options);
  return handleResponse(res);
}
