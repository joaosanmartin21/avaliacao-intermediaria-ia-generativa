function getApiBaseUrl() {
  const configured = import.meta.env.VITE_ASSISTANT_API_URL;
  if (typeof configured === "string" && configured.trim()) {
    return configured.trim().replace(/\/+$/, "");
  }
  return "";
}

export async function requestAssistantReply({ message, monthRef, context }) {
  const response = await fetch(`${getApiBaseUrl()}/api/assistant/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      monthRef,
      context,
    }),
  });

  if (!response.ok) {
    throw new Error(`Falha no endpoint de assistente (${response.status}).`);
  }

  return response.json();
}
