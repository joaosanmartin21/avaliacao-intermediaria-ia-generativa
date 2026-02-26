function getApiBaseUrl() {
  const configured = import.meta.env.VITE_ASSISTANT_API_URL;
  if (typeof configured === "string" && configured.trim()) {
    return configured.trim().replace(/\/+$/, "");
  }
  return "";
}

export async function requestShoppingReport({ context }) {
  const response = await fetch(`${getApiBaseUrl()}/api/reports/shopping`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      context,
    }),
  });

  if (!response.ok) {
    throw new Error(`Falha no endpoint de relatório (${response.status}).`);
  }

  return response.json();
}
