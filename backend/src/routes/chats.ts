import { Router } from "express";
import { db } from "../db.js";
import { v4 as uuidv4 } from "uuid";
import {
  createAIStream,
  type Message as OpenAIMessage,
} from "../openai-stream.js";
import { Response, Request } from "express";
import { Message } from "../types.js";

const router = Router();

/**
 * GET /api/chats
 * List all conversations, ordered by most recent first
 */
router.get("/", async (req, res) => {
  try {
    const rows = await db
      .prepare(`SELECT * FROM conversations ORDER BY updated_at DESC`)
      .all();
    res.json(rows);
  } catch (err) {
    console.error("Failed to fetch conversations:", err);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

/**
 * POST /api/chats
 * Create a new conversation
 * Body: { title?: string }
 */
router.post("/", async (req, res) => {
  try {
    const convId = uuidv4();
    await db
      .prepare(
        `
      INSERT INTO conversations (id, title)
      VALUES (?, ?)
    `,
      )
      .run(convId, req.body.title);

    const conversation = db.prepare(`
      SELECT *
      FROM conversations
      WHERE id = ?
    `).get(convId);

    res.json(conversation);
  } catch (err) {
    console.error("Failed to create conversation", err);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

/**
 * GET /api/chats/:id
 * Get a single conversation by ID
 */
router.get("/:id", (req, res) => {
  try {
    const rows = db
      .prepare(
        `
      SELECT *
      FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `,
      )
      .all(req.params.id);
    res.json(rows);
  } catch (err) {
    console.error("Failed to create conversation", err);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

/**
 * PATCH /api/chats/:id
 * Update conversation (e.g., title)
 * Body: { title: string }
 */
router.patch("/:id", (req, res) => {
  const { id } = req.params;
  const title = (req.body?.title ?? "").toString().trim();

  if (!id) {
    return res.status(400).json({ error: "Missing chat id" });
  }

  if (!title) {
    return res.status(400).json({ error: "Missing title" });
  }

  const result = db
    .prepare(
      `
      UPDATE conversations
      SET title = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    )
    .run(title, id);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Chat not found" });
  }

  return res.status(200).json({
    id,
    title,
  });
});

/**
 * DELETE /api/chats/:id
 * Delete a conversation and all its messages
 */
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  const result = db.prepare("DELETE FROM conversations WHERE id = ?").run(id);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Chat not found" });
  }

  return res.status(204).send();
});

/**
 * GET /api/chats/:id/messages
 * Get all messages for a conversation
 */
router.get("/:id/messages", (req, res) => {
  try {
    const conv = db
      .prepare(
        `
      SELECT *
      FROM conversations
      WHERE id = ?
      ORDER BY created_at ASC
      LIMIT 1
    `,)
      .get(req.params.id);

    if (!conv) {
      throw new Error("No conversation exists")
    }
    const rows = db
      .prepare(
        `
      SELECT *
      FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `,
      )
      .all(req.params.id);
    res.json(rows);
  } catch (err) {
    console.error("Failed to create conversation", err);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

/**
 * POST /api/chats/:id/retry
 * Retry last message
 */
router.post("/:id/retry", (req, res) => {
  try {
    const latest_msg_query = db.prepare<[string], Message>(`
      SELECT *
      FROM messages
      WHERE conversation_id = ? AND role = 'assistant'
      ORDER BY created_at DESC
      LIMIT 1
    `);

    const latest_msg = latest_msg_query.get(req.params.id);
    if (!latest_msg || latest_msg.status != "failed") {
      throw new Error("No assistant row");
    }

    const latest_user_msg_query = db.prepare<[string], Message>(`
      SELECT *
      FROM messages
      WHERE conversation_id = ? AND role = 'user'
      ORDER BY created_at DESC
      LIMIT 1
    `);
    const latest_user_msg = latest_user_msg_query.get(req.params.id);

    if (!latest_user_msg || !latest_user_msg.content) {
      throw new Error("No user row");
    }

    sendMessage(res, req, latest_user_msg?.content, req.params.id);
  } catch (error) {
    const err = error instanceof Error ? error : new Error("Unknown error");
    console.error("Retry error:", err.message);

    if (err.message.includes("No user row")) {
      console.error("Failed to retry conversation", err);
      res.status(500).json({ error: err.message });
    } else if (err.message.includes("No assistant row")) {
      console.error("Failed to retry conversation", err);
      res.status(500).json({ error: err.message });
    } else {
      console.error("Failed to retry conversation", err);
      res.status(500).json({ error: "Failed to retry conversation" });
    }
  }
});

type HistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

async function sendMessage(
  res: Response,
  req: Request,
  content: string,
  conversationId: string,
) {
  if (!content) {
    return res.status(400).json({ error: "Missing content" });
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();
  res.write(`: connected\n\n`);
  const ping = setInterval(() => {
    res.write(`connected\n\n`);
  }, 10000);
  await new Promise((r) => setImmediate(r));

  const userMessageId = uuidv4();
  const assistantMessageId = uuidv4();

  let fullResponse = "";
  let closed = false;

  const send = (event: string, data: any) => {
    if (closed) return;
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // 1) Get history
  const history = db
    .prepare<[string], HistoryMessage>(
      `
    SELECT role, content
    FROM messages
    WHERE conversation_id = ?
    ORDER BY created_at ASC
  `,
    )
    .all(conversationId);

  // 2) insert user message
  db.prepare(
    `
    INSERT INTO messages (id, conversation_id, role, content, status)
    VALUES (?, ?, 'user', ?, 'sent')
  `,
  ).run(userMessageId, conversationId, content);

  // 3) insert placeholder assistant message
  db.prepare(
    `
    INSERT INTO messages (id, conversation_id, role, content, status)
    VALUES (?, ?, 'assistant', '', 'sending')
  `,
  ).run(assistantMessageId, conversationId);

  const cleanup = createAIStream(
    content,
    (chunk: string) => {
      fullResponse += chunk;
      send("chunk", { content: chunk });
    },
    (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Streaming error";
      db.prepare(
        `
        UPDATE messages
        SET status = 'failed', error_message = ?, content = ?
        WHERE id = ?
      `,
      ).run(msg, fullResponse, assistantMessageId);

      send("error", { error: msg });
      res.end();
    },
    (finalText: string) => {
      const finalContent = finalText || fullResponse;

      db.prepare(
        `
        UPDATE messages
        SET status = 'sent', error_message = NULL, content = ?
        WHERE id = ?
      `,
      ).run(finalContent, assistantMessageId);

      send("done", {
        messageId: assistantMessageId,
        content: finalContent,
      });
      clearInterval(ping);
      res.end();
    },
    { conversationHistory: history },
  );

  // client disconnect
  req.on("close", () => {
    closed = true;
    console.log("CLOSED");
    cleanup?.();
    clearInterval(ping);

    db.prepare(
      `
      UPDATE messages
      SET status = 'failed', error_message = 'Client disconnected', content = ?
      WHERE id = ? AND status = 'sending'
    `,
    ).run(fullResponse, assistantMessageId);
  });
}

router.post("/:id/messages", (req, res) => {
  const conversationId = req.params.id;
  const content = (req.body?.content ?? "").toString().trim();
  sendMessage(res, req, content, conversationId);
});

export default router;
