import { db } from "./mysql.js";

export const runTest = async () => {
  // TODO:
  // const result = await sendNewMessage(11, 12, "test");
  // console.log(result);
};

export const getChat = async (senderId, recipientId) => {
  const response = await db.query(
    `SELECT * 
		FROM chats 
		WHERE sender_id = ${senderId} 
		AND recipient_id = ${recipientId}`
  );

  return response[0];
};

export const mapChat = async (chat) => {
  const sen = await getUserById(chat.sender_id);
  const reci = await getUserById(chat.recipient_id);

  return {
    senderId: chat.sender_id,
    recipientId: chat.recipient_id,
    lastSeen: chat.last_seen / 1000,
    sender: {
      id: sen.id,
      name: sen.name
    },
    recipient: {
      id: reci.id,
      name: reci.name
    },
    unread: chat.unread
  };
};

export const getChatsForUser = async (userId) => {
  const response = await db.query(
    `select c.sender_id, c.recipient_id, COUNT(m.id) as unread
		FROM chats c
		LEFT JOIN messages m ON m.sender_id = c.recipient_id AND m.recipient_id = c.sender_id AND m.created_at > c.last_seen
		WHERE c.sender_id = ${userId}
		GROUP BY c.sender_id, c.recipient_id`
  );
  return response;
};

export const getUsers = () => db.query("SELECT * FROM users");

export const getUserById = async (userId) => {
  const response = await db.query(`SELECT * FROM users WHERE id = ${userId}`);
  return response[0];
};

export const getMessages = async (senderId, recipientId) => {
  const response = await db.query(`
		select * from messages m where m.sender_id = ${senderId} AND m.recipient_id = ${recipientId}
		union
		select * from messages m where m.recipient_id = ${senderId} AND m.sender_id = ${recipientId}
	`);
  return response;
};

export const mapMessage = async (message) => {
  const sen = await getUserById(message.sender_id);
  const reci = await getUserById(message.recipient_id);

  return {
    id: message.id,
    senderId: sen.id,
    sender: {
      id: sen.id,
      name: sen.name
    },
    recipientId: reci.id,
    recipient: {
      id: reci.id,
      name: reci.name
    },
    content: message.content,
    createdAt: message.created_at / 1000
  };
};

export const updateLastSeen = async (senderId, recipientId) => {
  const response = await db.query(`
		UPDATE chats c 
		SET last_seen = now()
		WHERE c.sender_id = ${senderId} 
			AND c.recipient_id = ${recipientId};
	`);
  return response;
};

export const sendNewMessage = async (senderId, recipientId, content) => {
  try {
    const response = await db.query(
      `
      INSERT INTO messages (sender_id, recipient_id, content, created_at)
      VALUES (?, ?, ?, now());
    `,
      [senderId, recipientId, content]
    );
    return response;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};
