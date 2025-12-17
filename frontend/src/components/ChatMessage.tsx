import React from "react";

export type ChatMessageProps = {
  role: "user" | "assistant";
  content: string;

  isError?: boolean;
  isLast?: boolean;
  onRetry?: () => void;
};

export function ChatMessage({
  role,
  content,
  isError = false,
  isLast = false,
  onRetry,
}: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        padding: "8px 12px",
      }}
    >
      <div
        style={{
          maxWidth: 720,
          width: "fit-content",
          background: isError
            ? "#fdecec" // light red error bg
            : isUser
              ? "#e8f0fe" // light blue user bubble
              : "#ffffff", // assistant bubble
          color: isError ? "#7f1d1d" : "#1f2937",
          border: isError ? "1px solid #f5c2c2" : "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "10px 12px",
          lineHeight: 1.5,
          fontSize: 14,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <div>
        {!isError
          ? content || "Awaiting response… please come back later"
          : "Failed Response"}
      </div>

        {isError && isLast && (
          <button
            onClick={onRetry}
            style={{
              marginTop: 8,
              background: "#ffffff",
              color: "#7f1d1d",
              border: "1px solid #f5c2c2",
              borderRadius: 6,
              padding: "4px 8px",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
