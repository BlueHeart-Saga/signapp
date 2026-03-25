const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:9000";

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const contactAPI = {
  // CREATE contact
  createContact: async (data) => {
    const res = await fetch(`${API_BASE_URL}/contacts`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to create contact");
    }

    return res.json();
  },

  // GET all contacts
   getContacts: async () => {
    const res = await fetch(`${API_BASE_URL}/contacts`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Failed to load contacts");
    return res.json();
  },

  searchContacts: async (q) => {
    const res = await fetch(
      `${API_BASE_URL}/contacts/search?q=${encodeURIComponent(q)}`,
      { headers: authHeaders() }
    );
    if (!res.ok) throw new Error("Search failed");
    return res.json();
  },

  // TOGGLE favorite
  toggleFavorite: async (contactId) => {
    const res = await fetch(
      `${API_BASE_URL}/contacts/${contactId}/favorite`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
      }
    );

    if (!res.ok) throw new Error("Failed to update favorite");
    return res.json();
  },

  // UPDATE contact
  updateContact: async (contactId, data) => {
    const res = await fetch(`${API_BASE_URL}/contacts/${contactId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to update contact");
    return res.json();
  },

  // DELETE contact
  deleteContact: async (contactId) => {
    const res = await fetch(`${API_BASE_URL}/contacts/${contactId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!res.ok) throw new Error("Failed to delete contact");
    return res.json();
  },
};
