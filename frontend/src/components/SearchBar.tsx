import React, { useEffect, useRef, useState } from "react";

type ChatInputProps = {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  onSend: (text: string) => void;
};

export default function SearchBar({
  value = "",
  placeholder = "Message…",
  disabled = false,
  onSend,
}: ChatInputProps) {
  const [text, setText] = useState(value);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-grow textarea (ChatGPT-like)
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 200) + "px"; // cap height
  }, [text]);

  const canSend = !disabled && text.trim().length > 0;

  const send = () => {
    if (!canSend) return;
    const trimmed = text.trim();
    onSend(trimmed);
    setText("");
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.bar}>
        <textarea
          ref={taRef}
          value={text}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          style={styles.textarea}
        />
        <button
          type="button"
          onClick={send}
          disabled={!canSend}
          aria-label="Send message"
          style={{
            ...styles.button,
            opacity: canSend ? 1 : 0.45,
            cursor: canSend ? "pointer" : "not-allowed",
          }}
        >
          {/* simple "send" icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 11.5L21 3l-8.5 18-2.5-7-7-2.5Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div style={styles.hint}>Enter to send • Shift+Enter for a new line</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    width: "100%",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    background: "transparent",
  },
  bar: {
    display: "flex",
    alignItems: "flex-end",
    gap: "10px",
    padding: "10px 12px",
    borderRadius: "14px",
    border: "1px solid rgba(0,0,0,0.12)",
    background: "rgba(255,255,255,0.9)",
    boxShadow: "0 1px 10px rgba(0,0,0,0.06)",
  },
  textarea: {
    flex: 1,
    resize: "none",
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "15px",
    lineHeight: "20px",
    maxHeight: "200px",
    overflowY: "auto",
    padding: "6px 4px",
  },
  button: {
    height: "36px",
    width: "36px",
    borderRadius: "10px",
    border: "1px solid rgba(0,0,0,0.12)",
    background: "white",
    display: "grid",
    placeItems: "center",
  },
  hint: {
    fontSize: "12px",
    opacity: 0.6,
    paddingLeft: "4px",
  },
};
