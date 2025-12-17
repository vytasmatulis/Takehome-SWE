import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { apiFetch, createChat, fetchMessages } from "./api/client.ts";
import { NewChatButton } from "./components/NewChatButton.tsx";
import ConversationList from "./components/ConversationList.tsx";
import SearchBar from "./components/SearchBar.tsx";
import { Message } from "./types.ts";
import { ChatMessagePage } from "./components/ChatMessagePage.tsx";
import { ChatMessage } from "./components/ChatMessage.tsx";

/**
 * Main App Component
 *
 * TODO: Build out the chat interface with:
 * - Conversation list sidebar
 * - Message thread view
 * - Input for sending messages
 * - Streaming response display
 * - Error handling with retry
 */
function App() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#f5f5f5",
      }}
    >
      {/* TODO: Conversation sidebar */}
      <aside
        style={{
          width: 280,
          background: "#fff",
          borderRight: "1px solid #e0e0e0",
          padding: 16,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2 style={{ marginBottom: 16, fontSize: 18 }}>Conversations</h2>

        <ConversationList
          onClickConversation={async (convId) => {
            navigate(`/chats/${convId}`);
          }}
        />
      </aside>

      {/* TODO: Main chat area */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Routes>
          <Route
            path="/"
            element={
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#666",
                }}
              >
                Select a conversation or start a new one
              </div>
            }
          />
          <Route
            path="/chats/:id"
            element={
              <div style={{ flex: 1, padding: 16 }}>
                <ChatMessagePage />
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
