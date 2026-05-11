const BASE_URL = (import.meta as any).env?.VITE_API_URL ?? "https://api.echosys.orbitclan.cloud";

const getToken = () => localStorage.getItem("accessToken");

async function request(method: string, path: string, body?: unknown) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${getToken()}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export const api = {
  get:   (path: string)            => request("GET",   path),
  patch: (path: string, body: unknown) => request("PATCH", path, body),
  post:  (path: string, body: unknown) => request("POST",  path, body),
};

// ─── Zones & hiérarchie géographique ─────────────────────────────────────────

export const zonesApi = {
  listCUs:       ()           => api.get("/zones/cu"),
  listCommunes:  ()           => api.get("/zones/communes"),
  districtStats: (id: number) => api.get(`/zones/stats/quartier/${id}`),
  communeStats:  (id: number) => api.get(`/zones/stats/commune/${id}`),
  cuStats:       (id: number) => api.get(`/zones/stats/cu/${id}`),
};
