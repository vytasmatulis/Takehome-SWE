import { useState } from "react";

type NewChatButtonProps = {
  onNewChat: () => Promise<void>;
};

export function NewChatButton({ onNewChat }: NewChatButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={loading}
        onClick={async () => {
          if (loading) return;
          setLoading(true);
          setError(null);
          try {
            await onNewChat();
          } catch {
            setError("Couldn’t start a new chat.");
          } finally {
            setLoading(false);
          }
        }}
        style={{
          padding: "6px 10px",
          borderRadius: 6,
          border: "1px solid #ccc",
          background: "white",
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: 12,
          fontWeight: 600,
        }}
        aria-busy={loading}
      >
        {loading ? "…" : "+ New chat"}
      </button>

      {error && (
        <div style={{ marginTop: 6, fontSize: 12, color: "#c00" }}>{error}</div>
      )}
    </div>
  );
}
