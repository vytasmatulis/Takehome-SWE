import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ChatMessage, ChatMessageProps } from "./ChatMessage.tsx";
import { fetchMessages, subscribeToSSE } from "../api/client.ts";
import { Message } from "../types.ts";
import SearchBar from "./SearchBar.tsx";
import { v4 as uuidv4 } from "uuid";

export function ChatMessagePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sendingConversation, setSendingConversation] = useState(false);

  const { id } = useParams<{ id: string }>();

  const loadConversation = async () => {
    if (id == undefined) {
      return;
    }
    if (loading) {
      return;
    }
    setCurrentMessage("");
    setSendingConversation(false);
    setError(null);
    setLoading(true);

    try {
      const newMessages = await fetchMessages(id);
      console.log(newMessages);

      setMessages(newMessages);
    } catch (e: any) {
      if (e?.name !== "AbortError") setError("Failed to load conversation.");
    } finally {
      setLoading(false);
    }
  };

  const onRetry = () => {
    subscribeToSSE(
      "/chats/" + id + "/retry",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
      },
      {
        onChunk: (data) => {
          const text = (data as any)?.content ?? "";
          setCurrentMessage((prev) => prev + text);
        },
        onDone: (data) => {
          setCurrentMessage("");
          const text = (data as any)?.content ?? "";
          const msg: Message = {
            content: text,
            role: "assistant",
            status: "sent",
          };
          setMessages((messages) => [...messages, msg]);
        },
        onError: (data) => {
          const msg: Message = {
            content: currentMessage,
            role: "assistant",
            status: "failed",
          };
          setMessages((messages) => [...messages, msg]);
        },
      },
    );
  };

  useEffect(() => {
    loadConversation();
  }, [id]);

  return (
    <div
      style={{
        flex: 1,
        width: "100%",
        overflowY: "auto",
        padding: "16px 0",
        display: "flex",
        flexDirection: "column",
        background: "#ffffffff",
      }}
    >
      <div>
        {messages.length != 0 &&
          messages.map((message, index) => {
            const isLast = index === messages.length - 1;
            const isError = message.status == "failed";
            return (
              <ChatMessage
                role={message.role}
                content={message.content}
                key={index}
                isError={message.status == "failed"}
                isLast={isLast}
                onRetry={isLast && isError ? onRetry : undefined}
              />
            );
          })}
        {currentMessage && (
          <ChatMessage role={"assistant"} content={currentMessage} />
        )}
      </div>
      {error && (
        <div
          style={{
            background: "#3a1d1d",
            color: "#ffb4b4",
            border: "1px solid #6b2a2a",
            padding: "10px 12px",
            borderRadius: 6,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}
      {!error && (
        <SearchBar
          disabled={sendingConversation}
          onSend={(userQuery) => {
            if (currentMessage != "" || sendingConversation) {
              return;
            }
            setSendingConversation(true);

            const msg: Message = {
              content: userQuery,
              role: "user",
              status: "sent",
            };
            setMessages((messages) => [...messages, msg]);
            subscribeToSSE(
              "/chats/" + id + "/messages",
              {
                method: "POST",
                body: JSON.stringify({
                  content: userQuery,
                }),
                headers: {
                  "Content-Type": "application/json",
                  Accept: "text/event-stream",
                },
              },
              {
                onChunk: (data) => {
                  const text = (data as any)?.content ?? "";
                  setCurrentMessage((prev) => prev + text);
                },
                onDone: (data) => {
                  setCurrentMessage("");
                  const text = (data as any)?.content ?? "";
                  const msg: Message = {
                    content: text,
                    role: "assistant",
                    status: "sent",
                  };
                  setMessages((messages) => [...messages, msg]);
                  setSendingConversation(false);
                },
                onError: (data) => {
                  const msg: Message = {
                    content: currentMessage,
                    role: "assistant",
                    status: "failed",
                  };
                  setMessages((messages) => [...messages, msg]);
                  setSendingConversation(false);
                },
              },
            );
          }}
        />
      )}
    </div>
  );
}
