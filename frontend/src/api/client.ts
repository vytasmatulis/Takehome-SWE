import { Conversation } from "../types.ts"
import { Message } from "../types.ts";

const API_BASE = "/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Basic fetch wrapper with error handling
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new ApiError(response.status, error.error || "Request failed");
  }
  return response.json();
}

export async function fetchChats(): Promise<Conversation[]> {
  return await apiFetch<Conversation[]>("/chats");
}

export async function fetchMessages(convId: string): Promise<Message[]> {
  return await apiFetch<Message[]>("/chats/" + convId + "/messages");
}

export async function createChat(): Promise<Conversation> {
  return await apiFetch<Conversation>("/chats", { method: "POST" });
}

export async function sendMessage(convId: string): Promise<string> {
  return await apiFetch<string>("/chats/" + convId + "/messages", {
    method: "POST",
  });
}

/**
 * Helper for SSE (Server-Sent Events) connections
 *
 * Usage:
 *   const cleanup = subscribeToSSE('/chats/123/messages', {
 *     method: 'POST',
 *     body: JSON.stringify({ content: 'Hello' })
 *   }, {
 *     onChunk: (data) => console.log('Chunk:', data),
 *     onDone: (data) => console.log('Done:', data),
 *     onError: (error) => console.error('Error:', error)
 *   });
 *
 *   // Later: cleanup() to close connection
 */
export function subscribeToSSE(
  endpoint: string,
  fetchOptions: RequestInit,
  handlers: {
    onChunk?: (data: unknown) => void;
    onDone?: (data: unknown) => void;
    onError?: (error: Error) => void;
  },
): () => void {
  const controller = new AbortController();

  (async () => {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...fetchOptions,
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          ...fetchOptions.headers,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(error.error || "Request failed");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = "";
        console.log(lines)
        for (const line of lines) {
          if (line.startsWith("connected")) {
            console.log("received initial packet")
          }
          if (line.startsWith("event:")) {
            currentEvent = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            try {
              const data = JSON.parse(line.slice(5).trim());
              if (currentEvent === "chunk") handlers.onChunk?.(data);
              else if (currentEvent === "done") handlers.onDone?.(data);
              else if (currentEvent === "error")
                handlers.onError?.(new Error(data.error));
            } catch {
              // Ignore JSON parse errors for malformed data
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        handlers.onError?.(error);
      }
    }
  })();

  return () => controller.abort();
}
