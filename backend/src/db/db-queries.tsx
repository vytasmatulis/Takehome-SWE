const get_all_messages_for_conversation = `
      SELECT *
      FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `;
