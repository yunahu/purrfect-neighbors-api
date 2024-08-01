import { db } from "./mysql.js";

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

export const mapChatShort = async (chat) => {
  const sen = await getUserById(chat.sender_id);
  const reci = await getUserById(chat.recipient_id);

  return {
    recipient: {
      id: reci.id,
      name: reci.name
    },
    unread: chat.unread
  };
};

export const getChatsForUser = async (userId) => {
  const response = await db.query(
    `SELECT c.sender_id, c.recipient_id, COUNT(m.id) AS unread
		FROM chats c
		LEFT JOIN messages m ON m.sender_id = c.recipient_id AND m.recipient_id = c.sender_id AND m.created_at > c.last_seen
		WHERE c.sender_id = ${userId}
		GROUP BY c.sender_id, c.recipient_id`
  );
  return response;
};

export const getSingleChatForUser = async (senderId, recipientId) =>
  db.query(
    `SELECT c.sender_id, c.recipient_id, COUNT(m.id) AS unread
		FROM chats c
		LEFT JOIN messages m ON m.sender_id = ${recipientId} AND m.recipient_id = ${senderId} AND m.created_at > c.last_seen
		WHERE c.sender_id = ${senderId} AND c.recipient_id = ${recipientId}`
  );

export const getUsers = () => db.query("SELECT * FROM users");

export const getUserById = async (userId) => {
  const response = await db.query(`SELECT * FROM users WHERE id = ${userId}`);
  if (response) {
    return response[0];
  }
  return null;
};

export const getMessages = async (senderId, recipientId) => {
  const response = await db.query(`
		SELECT * FROM messages m WHERE m.sender_id = ${senderId} AND m.recipient_id = ${recipientId}
		UNION
		SELECT * FROM messages m WHERE m.recipient_id = ${senderId} AND m.sender_id = ${recipientId}
		ORDER BY created_at
	`);
  return response;
};

export const mapMessage = async (message) => {
  return {
    id: message.id,
    senderId: message.sender_id,
    recipientId: message.recipient_id,
    content: message.content,
    createdAt: message.created_at / 1000
  };
};

export const mapMessageShort = async (message) => {
  return {
    senderId: message.sender_id,
    recipientId: message.recipient_id,
    content: message.content,
    createdAt: message.created_at / 1000
  };
};

export const updateLastSeen = (senderId, recipientId) => {
  db.query(`
		UPDATE chats c 
		SET last_seen = now()
		WHERE c.sender_id = ${senderId} 
			AND c.recipient_id = ${recipientId};
	`);
  return 1;
};

export const sendNewMessage = async (senderId, recipientId, content) => {
  try {
    await db.query(
      `
      INSERT INTO messages (sender_id, recipient_id, content, created_at)
      VALUES (?, ?, ?, now());
    `,
      [senderId, recipientId, content]
    );
    return db.query(`SELECT * FROM messages WHERE id = LAST_INSERT_ID();`);
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const createNewChat = async (senderId, recipientId) =>
  await db.query(
    `
		INSERT INTO chats (sender_id, recipient_id, last_seen)
		VALUES
		(?, ?, NOW());
	`,
    [senderId, recipientId]
  );

export const alreadyExistsChat = async (senderId, recipientId) => {
  const response = await db.query(`
		SELECT * FROM chats WHERE sender_id = ${senderId} AND recipient_id = ${recipientId}
	`);
  return response?.length;
};

export const mapSingleChat = (chat) => ({
  senderId: chat.sender_id,
  recipientId: chat.recipient_id,
  lastSeen: chat.last_seen
});
