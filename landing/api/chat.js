import { SYSTEM_PROMPT } from "../src/chatbot/knowledge.js";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 8;
const MAX_MESSAGES = 10;
const MAX_MESSAGE_LENGTH = 2_000;
const clients = new Map();

function getClientIp(request) {
  return String(request.headers["x-forwarded-for"] || request.socket?.remoteAddress || "unknown")
    .split(",")[0]
    .trim();
}

function isRateLimited(ip) {
  const now = Date.now();
  for (const [key, value] of clients) {
    if (value.resetAt <= now) clients.delete(key);
  }
  const current = clients.get(ip);
  if (!current || current.resetAt <= now) {
    clients.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > MAX_REQUESTS;
}

function cleanMessages(input) {
  if (!Array.isArray(input)) return null;
  const messages = input.slice(-MAX_MESSAGES).map((message) => ({
    role: message?.role === "assistant" ? "assistant" : "user",
    content: typeof message?.content === "string" ? message.content.trim() : "",
  }));
  if (
    messages.length === 0 ||
    messages.some((message) => !message.content || message.content.length > MAX_MESSAGE_LENGTH)
  ) return null;
  return messages;
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed." });
  }
  const origin = request.headers.origin;
  if (origin && origin !== "https://www.youpeak.in" && !/^http:\/\/localhost:\d+$/.test(origin)) {
    return response.status(403).json({ error: "Origin not allowed." });
  }
  if (isRateLimited(getClientIp(request))) {
    response.setHeader("Retry-After", "60");
    return response.status(429).json({ error: "Too many chat requests. Please try again in a minute." });
  }
  if (!process.env.GROQ_API_KEY) {
    return response.status(503).json({ error: "The assistant is not configured. Please email support@youpeak.in." });
  }

  let body;
  try {
    body = typeof request.body === "string" ? JSON.parse(request.body) : request.body;
  } catch {
    return response.status(400).json({ error: "Invalid JSON request." });
  }
  if (JSON.stringify(body).length > 25_000) {
    return response.status(413).json({ error: "Chat request is too large." });
  }
  const messages = cleanMessages(body?.messages);
  if (!messages) return response.status(400).json({ error: "Invalid chat request." });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  let upstream;
  try {
    upstream = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
        temperature: 0.3,
        max_completion_tokens: 700,
      }),
      signal: controller.signal,
    });
  } catch {
    clearTimeout(timeout);
    return response.status(502).json({ error: "The assistant could not be reached." });
  }

  if (!upstream.ok || !upstream.body) {
    clearTimeout(timeout);
    return response.status(upstream.status === 429 ? 429 : 502).json({
      error: upstream.status === 429 ? "The assistant is busy. Please try again shortly." : "The assistant is temporarily unavailable.",
    });
  }

  response.statusCode = 200;
  response.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  response.setHeader("Connection", "keep-alive");
  response.flushHeaders?.();
  const reader = upstream.body.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      response.write(Buffer.from(value));
    }
  } finally {
    clearTimeout(timeout);
    response.end();
  }
}

export const config = { maxDuration: 30 };
