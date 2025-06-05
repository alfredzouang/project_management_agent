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

// Example: generic request for other endpoints
export async function apiRequest(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, options);
  return handleResponse(res);
}
