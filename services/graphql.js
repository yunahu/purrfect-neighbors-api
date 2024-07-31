import {
  getChat,
  getChatsForUser,
  getMessages,
  mapChat,
  mapMessage,
  sendNewMessage,
  updateLastSeen
} from "./apiChats.js";

const typeDefs = `#graphql
  type User {
    id: Int
    name: String
  }

  type Message {
    id: Int
    senderId: Int
    sender: User
    recipientId: Int
    recipient: User
    content: String
    createdAt: Int
	}
		
	type Chat {
		senderId: Int
    sender: User
		recipientId: Int	
    recipient: User
		lastSeen: Int
		messages(recipientId: Int): [Message]
		unread: Int
	}
		
	type Query {
    chats: [Chat]
    chat(recipientId: Int): Chat
	}
		
	type Mutation {
    sendNewMessage(recipientId: Int, content: String): Boolean
    updateLastSeen(recipientId: Int): Boolean
	}
`;

// TODO: 11 -> context.req.user.id
const resolvers = {
  Chat: {
    messages: async (_, args, context) => {
      const result = await getMessages(11, args.recipientId);
      const final = await result.map((x) => mapMessage(x));
      return final;
    }
  },
  Query: {
    chats: async (_, _args, context) => {
      const response = await getChatsForUser(11);
      const mapped = await response.map((x) => mapChat(x));
      return mapped;
    },
    chat: async (_, args, context) => {
      const response = await getChat(11, args.recipientId);
      const mapped = await mapChat(response);
      return mapped;
    }
  },
  Mutation: {
    sendNewMessage: async (_, args, context) => {
      const response = await sendNewMessage(11, args.recipientId, args.content);
      return response ? 1 : 0;
    },
    updateLastSeen: async (_, args, context) => {
      const response = await updateLastSeen(11, args.recipientId);
      return response ? 1 : 0;
    }
  }
};

export { typeDefs, resolvers };
