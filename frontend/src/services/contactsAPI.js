import api from "./api"; // your axios instance

export const contactsAPI = {
  getContacts: () => api.get("/contacts").then(res => res.data),
  searchContacts: (q) => api.get(`/contacts/search?q=${q}`).then(res => res.data),
  createContact: (data) => api.post("/contacts", data).then(res => res.data),
  updateContact: (id, data) => api.put(`/contacts/${id}`, data).then(res => res.data),
  deleteContact: (id) => api.delete(`/contacts/${id}`).then(res => res.data),
  toggleFavorite: (id) => api.patch(`/contacts/${id}/favorite`).then(res => res.data),
};
