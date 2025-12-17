export interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id?: string;
  conversation_id?: string;
  role: "user" | "assistant";
  content: string;
  status: "sending" | "sent" | "failed";
  error_message?: string;
  created_at?: string;
}

export interface ApiError {
  error: string;
  details?: string;
}
