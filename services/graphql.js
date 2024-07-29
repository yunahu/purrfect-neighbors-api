import { fetchMessages, markAsRead, updateMessages } from "./apiMessages.js";
import { searchPets, searchProducts } from "./apiSearch.js";

const typeDefs = `#graphql
  type Query {
    messages: [Chat]
    search(term: String!): SearchResult
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

  type Pet {
    id: ID
    name: String
    type: String
    breed: String
    address: String
    latitude: Float
    longitude: Float
  }

  type Product {
    id: ID
    title: String
    content: String
    latitude: Float
    longitude: Float
  }
  
  type SearchResult {
    searchPets: [Pet]
    searchProducts: [Product]
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
    },
    search: async (_, { term }) => {
      const pets = await searchPets(term);
      const products = await searchProducts(term);
      return { searchPets: pets, searchProducts: products };
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
