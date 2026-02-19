import { db } from "../db/appDb";

function getNowIso() {
  return new Date().toISOString();
}

function createDefaultTitle() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");

  return `Conversa ${day}/${month} ${hour}:${minute}`;
}

export async function createConversation(title = "") {
  const now = getNowIso();
  const normalizedTitle = title.trim() || createDefaultTitle();

  return db.assistantConversations.add({
    title: normalizedTitle,
    createdAt: now,
    updatedAt: now,
  });
}

export async function listConversations() {
  const conversations = await db.assistantConversations.toArray();
  return conversations.sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt)
  );
}

function normalizeRole(role) {
  return role === "assistant" ? "assistant" : "user";
}

export async function addMessage({ conversationId, role, content }) {
  if (!Number.isFinite(conversationId)) {
    throw new Error("Conversa invalida.");
  }

  const normalizedContent = typeof content === "string" ? content.trim() : "";
  if (!normalizedContent) {
    throw new Error("Digite uma mensagem antes de enviar.");
  }

  const now = getNowIso();
  const messageId = await db.assistantMessages.add({
    conversationId,
    role: normalizeRole(role),
    content: normalizedContent,
    createdAt: now,
  });

  await db.assistantConversations.update(conversationId, { updatedAt: now });
  return messageId;
}

export async function listMessages(conversationId) {
  if (!Number.isFinite(conversationId)) {
    return [];
  }

  const messages = await db.assistantMessages
    .where("conversationId")
    .equals(conversationId)
    .toArray();

  return messages.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}
