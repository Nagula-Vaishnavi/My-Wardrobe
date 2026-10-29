const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080/api")
    .replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, { status = 0, path = "", fieldErrors = {} } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.path = path;
    this.fieldErrors = fieldErrors;
  }
}

async function readBody(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiRequest(path, options = {}) {
  const { auth = true, headers = {}, ...requestOptions } = options;
  const requestHeaders = new Headers(headers);
  const token = auth ? sessionStorage.getItem("token") : null;
  if (token && !requestHeaders.has("Authorization")) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...requestOptions,
      headers: requestHeaders,
    });
  } catch {
    throw new ApiError("Cannot connect to the backend. Check that Spring Boot is running and try again.", { path });
  }

  const body = await readBody(response);
  if (!response.ok) {
    if (response.status === 401 && auth && token) {
      sessionStorage.removeItem("token");
      window.dispatchEvent(new Event("mywardrobe:session-expired"));
    }
    const message = typeof body === "object" && body !== null
      ? body.message || body.detail
      : body;
    throw new ApiError(message || `Request failed (${response.status}).`, {
      status: response.status,
      path: typeof body === "object" && body !== null ? body.path || path : path,
      fieldErrors: typeof body === "object" && body !== null ? body.fieldErrors || {} : {},
    });
  }
  return body;
}

export function apiUrl(path = "") {
  return `${API_BASE_URL.replace(/\/api$/, "")}/${path.replace(/\\/g, "/").replace(/^\//, "")}`;
}
