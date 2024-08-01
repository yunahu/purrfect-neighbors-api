import {
  getChat,
  getChatsForUser,
  getMessages,
  mapChat,
  mapMessage,
  mapMessageShort,
  sendNewMessage,
  updateLastSeen
} from "./apiChats.js";
import { newMessage } from "./socket.js";

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

const resolvers = {
  Chat: {
    messages: async (_, args, context) => {
      const result = await getMessages(context.req.user.id, args.recipientId);
      const final = await result.map((x) => mapMessage(x));
      return final;
    }
  },
  Query: {
    chats: async (_, _args, context) => {
      const response = await getChatsForUser(context.req.user.id);
      const mapped = await response.map((x) => mapChat(x));
      return mapped;
    },
    chat: async (_, args, context) => {
      const response = await getChat(context.req.user.id, args.recipientId);
      const mapped = await mapChat(response);
      return mapped;
    }
  },
  Mutation: {
    sendNewMessage: async (_, args, context) => {
      const response = await sendNewMessage(
        context.req.user.id,
        args.recipientId,
        args.content
      );
      const mapped = await mapMessageShort(response[0]);
      newMessage(mapped, context.req.user.id, args.recipientId);
      return;
    },
    updateLastSeen: (_, args, context) =>
      updateLastSeen(context.req.user.id, args.recipientId)
  }
};

export { typeDefs, resolvers };
