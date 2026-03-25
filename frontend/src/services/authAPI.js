import API from "./api"; // your axios instance with token

export const getMe = async () => {
  const res = await API.get("/auth/me");
  return res.data;
};
