import React, { useEffect, useState } from "react";
import { apiFetch, createChat, fetchChats, fetchMessages } from "../api/client";
import { Conversation } from "../types.ts";
import { useNavigate, useParams } from "react-router-dom";
import { NewChatButton } from "./NewChatButton.tsx";
import { useMatch } from "react-router-dom";

type Props = {
  className?: string;
  onClickConversation: (convId: string) => void;
};

export default function ConversationList({
  className,
  onClickConversation,
}: Props) {
  const navigate = useNavigate();

  const [activeConversationId, setActiveConversationId] = useState<string>("");
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { id } = useParams<{ id: string }>();
  
  const loadConversations = async () => {
    if (loading) {
      return;
    }
    setError(null);
    setLoading(true);

    //TODO Vytas, this needs to be in the router to get the id, this is always undefined rightnow
    console.log(id)

    if (id) {
      setActiveConversationId(id)
    }
    try {
      const res = await fetchChats();
      setConversations(res);
    } catch (e: any) {
      if (e?.name !== "AbortError") setError("Failed to load conversations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  return (
    <div
      className={className}
      style={{
        width: 260,
        borderRight: "1px solid #e5e5e5",
        padding: 8,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <NewChatButton
        onNewChat={async () => {
          const conversation : Conversation = await createChat();
          setConversations(prev => [conversation, ...prev]);
          navigate(`/chats/${conversation.id}`);
        }}
      />
      {error && (
        <div style={{ marginBottom: 8, fontSize: 12, color: "#c00" }}>
          {error}{" "}
          <button
            onClick={() => loadConversations()}
            style={{
              border: "none",
              background: "transparent",
              color: "#c00",
              textDecoration: "underline",
              cursor: "pointer",
              padding: 0,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Retry
          </button>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ fontSize: 12, color: "#777", padding: "8px 4px" }}>
            Loading…
          </div>
        ) : conversations.length === 0 ? (
          <div style={{ fontSize: 12, color: "#777", padding: "8px 4px" }}>
            No conversations yet
          </div>
        ) : (
          conversations.map((c) => {
            return <ConversationButton
              key={c.id}
              conversation={c}
              active={c.id === activeConversationId}
              onClick={() => { 
                setActiveConversationId(c.id)
                onClickConversation(c.id)
              }}
            />;
          })
        )}
      </div>
    </div>
  );
}

type ConversationButtonProps = {
  conversation: Conversation;
  active: boolean;
  onClick: () => void;
};

class ConversationButton extends React.PureComponent<ConversationButtonProps> {
  render() {
    const { conversation, active, onClick } = this.props;
    return (
      <button
        onClick={onClick}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "8px 10px",
          marginBottom: 4,
          borderRadius: 6,
          border: "none",
          background: active ? "#f1f1f1" : "transparent",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: active ? 600 : 500,
        }}
      >
        {conversation.title || "New conversation"}
      </button>
    );
  }
}
