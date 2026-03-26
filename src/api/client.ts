const BASE_URL = "http://192.168.1.106:3000";

const getToken = () => localStorage.getItem("accessToken");

export const api = {
  get: async (path: string) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    return res.json();
  },

  patch: async (path: string, body: any) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    return res.json();
  },

  post: async (path: string, body: any) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    return res.json();
  },
};