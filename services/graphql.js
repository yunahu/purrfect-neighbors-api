import { fetchMessages, markAsRead, updateMessages } from "./apiMessages.js";

const typeDefs = `#graphql
  type Query {
    messages: [Chat]
  }

  type Chat {
    user: String
    messages: [Message]
  }

  type Message {
    sender: String
    content: String
    sendTime: String
    read: Boolean
  }

  type Mutation {
    markAsRead(chatIndex: Int): [Chat]
    updateMessages(chatIndex: Int, inputValue: String): [Chat]
  }
`;

const resolvers = {
  Query: {
    messages: async () => {
      return await fetchMessages();
    }
  },
  Mutation: {
    markAsRead: async (_, { chatIndex }) => {
      console.log(chatIndex);
      return await markAsRead(chatIndex);
    },
    updateMessages: async (_, { chatIndex, inputValue }) => {
      console.log(chatIndex, inputValue);
      return await updateMessages(chatIndex, inputValue);
    }
  }
};

export { typeDefs, resolvers };
