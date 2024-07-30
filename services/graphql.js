import { fetchMessages, markAsRead, updateMessages } from "./apiMessages.js";
import { searchPets, searchProducts } from "./apiSearch.js";
import client from "./redis.js";

const typeDefs = `#graphql
  input Geolocation {
    latitude: Float
    longitude: Float
    radius: Float
  }
  
  input Filter {
    selection: String
    type: String
    breed: String
  }

  type Query {
    messages: [Chat]
    search(
      term: String,
      geolocation: Geolocation,
      filter: Filter
    ): SearchResult
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
    pet_name: String
    pet_type: String
    breed: String
    pet_address: String
    latitude: Float
    longitude: Float
    image: String
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
    search: async (_, { term, geolocation, filter }) => {
      const { latitude, longitude, radius } = geolocation;
      const { selection, type, breed } = filter;

      const cacheKey = `search:${selection}:${term}:${latitude}:${longitude}:${radius}:${type}:${breed}`;
      const cachedResult = await client.get(cacheKey);
      if (cachedResult) {
        return JSON.parse(cachedResult);
      }

      let SearchResult = {};
      if (!selection || selection === "pets") {
        SearchResult.searchPets = await searchPets(
          term,
          latitude,
          longitude,
          radius,
          type,
          breed
        );
      }
      if (!selection || selection === "products") {
        SearchResult.searchProducts = await searchProducts(
          term,
          latitude,
          longitude,
          radius
        );
      }
      await client.set(cacheKey, JSON.stringify(SearchResult), "EX", 60 * 5);
      return SearchResult;
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
