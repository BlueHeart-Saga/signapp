const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";

// 🔒 Safe token getter
const getToken = () => {
  const token = localStorage.getItem("token");
  return token && token !== "null" ? token : null;
};

// 🔒 Common headers
const getHeaders = (isJson = true) => {
  const headers = {};

  if (isJson) headers["Content-Type"] = "application/json";

  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  return headers;
};

// 🔥 Safe response handler
const handleResponse = async (res) => {
  const contentType = res.headers.get("content-type");

  if (!res.ok) {
    if (contentType && contentType.includes("application/json")) {
      const err = await res.json();
      throw new Error(err.detail || "API error");
    } else {
      const text = await res.text();
      throw new Error(`Non-JSON error: ${text.substring(0, 100)}`);
    }
  }

  if (contentType && contentType.includes("application/json")) {
    return res.json();
  }

  return null;
};

export const contactAPI = {
  createContact: async (data) => {
    const res = await fetch(`${API_BASE_URL}/contacts`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  getContacts: async () => {
    const res = await fetch(`${API_BASE_URL}/contacts`, {
      headers: getHeaders(false),
    });
    return handleResponse(res);
  },

  searchContacts: async (q) => {
    const res = await fetch(
      `${API_BASE_URL}/contacts/search?q=${encodeURIComponent(q)}`,
      { headers: getHeaders(false) }
    );
    return handleResponse(res);
  },

  toggleFavorite: async (contactId) => {
    const res = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/favorite`,
      {
        method: "PATCH",
        headers: getHeaders(),
      }
    );
    return handleResponse(res);
  },

  updateContact: async (contactId, data) => {
    const res = await fetch(`${API_BASE_URL}/contacts/${contactId}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  deleteContact: async (contactId) => {
    const res = await fetch(`${API_BASE_URL}/contacts/${contactId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};