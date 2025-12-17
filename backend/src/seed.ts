import { db, initDb } from "./db.js";
import { v4 as uuidv4 } from "uuid";

// Initialize database schema
initDb();

// Clear existing data
db.exec("DELETE FROM messages");
db.exec("DELETE FROM conversations");

// Create sample conversations
const conv1Id = uuidv4();
const conv2Id = uuidv4();
const conv3Id = uuidv4();

const insertConv = db.prepare(`
  INSERT INTO conversations (id, title, created_at, updated_at)
  VALUES (?, ?, datetime('now', ?), datetime('now', ?))
`);

insertConv.run(conv1Id, "Project Specifications Review", "-2 hours", "-1 hour");
insertConv.run(conv2Id, "Bid Comparison Analysis", "-1 day", "-1 day");
insertConv.run(conv3Id, null, "-3 days", "-3 days"); // Untitled conversation

// Create sample messages
const insertMsg = db.prepare(`
  INSERT INTO messages (id, conversation_id, role, content, status, created_at)
  VALUES (?, ?, ?, ?, 'sent', datetime('now', ?))
`);

// Conversation 1 messages
insertMsg.run(
  uuidv4(),
  conv1Id,
  "user",
  "What are the key electrical requirements in the specs?",
  "-2 hours",
);
insertMsg.run(
  uuidv4(),
  conv1Id,
  "assistant",
  `Based on my analysis of the electrical specifications, the key requirements include:

1. **Main Service**: 400A, 480V/277V 3-phase service
2. **Emergency Power**: Generator backup for critical systems
3. **Lighting**: LED fixtures with 0-10V dimming capability
4. **Data Infrastructure**: CAT6A cabling throughout

Would you like me to elaborate on any of these points?`,
  "-2 hours",
);
insertMsg.run(
  uuidv4(),
  conv1Id,
  "user",
  "Yes, tell me more about the emergency power requirements",
  "-1 hour",
);
insertMsg.run(
  uuidv4(),
  conv1Id,
  "assistant",
  `The emergency power requirements specify:

- **Generator Capacity**: Minimum 150kW diesel generator
- **Transfer Time**: Automatic transfer switch (ATS) with <10 second transfer
- **Runtime**: 24-hour fuel capacity at full load
- **Covered Systems**: Fire alarm, emergency lighting, elevators, and data center

Note that the specs also require weekly testing with logged results.`,
  "-1 hour",
);

// Conversation 2 messages
insertMsg.run(
  uuidv4(),
  conv2Id,
  "user",
  "Compare the pricing from the three electrical bids",
  "-1 day",
);
insertMsg.run(
  uuidv4(),
  conv2Id,
  "assistant",
  `Here's a comparison of the three electrical bids:

| Contractor | Base Bid | Alternates | Total |
|------------|----------|------------|-------|
| Acme Electric | $245,000 | $32,000 | $277,000 |
| PowerPro | $258,000 | $28,000 | $286,000 |
| City Electric | $239,000 | $41,000 | $280,000 |

City Electric has the lowest base bid but highest alternates. Acme appears to offer the best overall value.`,
  "-1 day",
);

// Conversation 3 - just one message, no response yet
insertMsg.run(
  uuidv4(),
  conv3Id,
  "user",
  "Can you summarize the HVAC scope?",
  "-3 days",
);

console.log("Database seeded successfully!");
console.log(`Created ${3} conversations with sample messages`);
