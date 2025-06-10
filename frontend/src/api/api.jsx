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
/**
 * Send chat messages to /project/create endpoint.
 * @param {string[]} messages - List of chat messages.
 * @param {File|null} file - Optional file to upload.
 * @returns {Promise<Object>} - Response JSON with { project: ... }
 */
export async function sendChatMessages(messages, file = null) {
  // Use absolute URL for local dev, relative for production
  let url = "/project/create";
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ) {
    url = "http://localhost:8000/project/create";
  }
  const formData = new FormData();
  formData.append("messages", JSON.stringify(messages));
  if (file) {
    console.log("Uploading file:", file);
    console.log("File name:", file.name, "File type:", file.type, "File size:", file.size);
    formData.append("file", file);
  }
  const res = await fetch(url, {
    method: "POST",
    body: formData,
  });
  return handleResponse(res);
}

/**
 * Subscribe to process status event stream (SSE or fetch/stream).
 * @param {string} processId - The process/run id to subscribe to.
 * @param {function} onEvent - Callback for each event ({step, status, state, extra}).
 * @returns {function} unsubscribe - Call to stop listening.
 */
export function subscribeToProcessStatus(processId, onEvent) {
  // Try EventSource (SSE)
  const url =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
      ? `http://localhost:8000/api/process/${processId}/status/stream`
      : `/api/process/${processId}/status/stream`;

  let stopped = false;
  let eventSource = null;

  if (window.EventSource) {
    eventSource = new window.EventSource(url);
    eventSource.onmessage = (event) => {
      try {
        // Some backends send single quotes, fix for JSON
        let data = event.data.replace(/'/g, '"');
        const parsed = JSON.parse(data);
        onEvent(parsed);
      } catch (e) {
        console.error("JSON parse error in subscribeToProcessStatus:", e, "Raw data:", event.data);
      }
    };
    eventSource.onerror = () => {
      if (!stopped) {
        eventSource.close();
      }
    };
    return () => {
      stopped = true;
      eventSource.close();
    };
  } else {
    // Fallback: fetch with ReadableStream (for older browsers)
    let controller = new AbortController();
    fetch(url, { signal: controller.signal }).then(async (res) => {
      const reader = res.body.getReader();
      let decoder = new TextDecoder();
      let buffer = "";
      while (!stopped) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let lines = buffer.split("\n");
        buffer = lines.pop();
for (let line of lines) {
  if (line.startsWith("data:")) {
    let data = line.slice(5).trim().replace(/'/g, '"');
    try {
      const parsed = JSON.parse(data);
      onEvent(parsed);
    } catch (e) {
      console.error("JSON parse error in subscribeToProcessStatus (fallback):", e, "Raw data:", data);
    }
  }
}
      }
    });
    return () => {
      stopped = true;
      controller.abort();
    };
  }
}

/**
 * Start a backend process and stream status updates (compatible with FastAPI backend).
 * @param {object} projectData - The project data to start the process with.
 * @param {function} onEvent - Callback for each event ({step, status, state, extra}).
 * @returns {Promise<function>} - Returns an unsubscribe function.
 */
export async function startProcessWithStatusStream(projectData, onEvent) {
  // Use absolute URL for local dev, relative for production
  let url = "/project/start";
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ) {
    url = "http://localhost:8000/project/start";
  }
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(projectData),
    });
  } catch (err) {
    onEvent({ step: "", status: "error", error: "Network error: " + err.message });
    throw err;
  }
  if (!res.body) {
    const errMsg = "No response body for streaming";
    onEvent({ step: "", status: "error", error: errMsg });
    throw new Error(errMsg);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let stopped = false;

  // Helper to parse Python dict string to JSON
  function parsePythonDictString(str) {
    try {
      // Replace single quotes with double quotes, handle None/null, True/False
      let jsonStr = str
        .replace(/'/g, '"')
        .replace(/\bNone\b/g, "null")
        .replace(/\bTrue\b/g, "true")
        .replace(/\bFalse\b/g, "false");
      return JSON.parse(jsonStr);
    } catch (e) {
      return { raw: str };
    }
  }

  (async () => {
    let buffer = "";
    try {
      while (!stopped) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let lines = buffer.split("\n");
        buffer = lines.pop();
        for (let line of lines) {
          if (line.startsWith("data:")) {
            let data = line.slice(5).trim();
            // Ignore empty, comment, or trivial lines
            if (
              !data ||
              data === "{}"
            )
              continue;
            // Ignore lines that are just ":" or whitespace
            if (/^[:\s]*$/.test(data)) continue;
            let parsed;
            try {
              parsed = parsePythonDictString(data);
              // Only push if parsed is a non-empty object
              if (
                typeof parsed === "object" &&
                parsed &&
                Object.keys(parsed).length > 0
              ) {
                onEvent(parsed);
              }
            } catch (e) {
              console.error("JSON parse error in startProcessWithStatusStream:", e, "Raw data:", data);
            }
          }
        }
      }
    } catch (err) {
      // Handle incomplete chunked encoding or network errors
      onEvent({
        step: "",
        status: "error",
        error: "Network or streaming error: " + (err.message || err.toString()),
      });
    }
  })();

  return () => {
    stopped = true;
    reader.cancel();
  };
}

// Example: generic request for other endpoints
export async function apiRequest(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, options);
  return handleResponse(res);
}
