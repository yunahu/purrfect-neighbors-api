// Example data
let msgData = [
  {
    user: "User 1",
    messages: [
      {
        sender: "User 1",
        content: "Message 1",
        sendTime: "2024-01-01T10:00:00Z",
        read: true
      },
      {
        sender: "Me",
        content: "Message 2",
        sendTime: "2024-01-01T10:01:00Z",
        read: true
      },
      {
        sender: "User 1",
        content: "Message 3",
        sendTime: "2024-01-01T10:02:00Z",
        read: false
      }
    ]
  },
  {
    user: "User 2",
    messages: [
      {
        sender: "User 2",
        content: "Message 1",
        sendTime: "2024-01-01T10:00:00Z",
        read: false
      }
    ]
  }
];

// Simulate function calls
const fetchMessages = async () => {
  try {
    // Return a copy of the data
    return [...msgData];
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
};

const markAsRead = async (chatIndex) => {
  try {
    // Create a new copy of the data and update read status
    const updatedMessages = msgData.map((chat, index) => {
      if (index === chatIndex) {
        return {
          ...chat,
          messages: chat.messages.map((msg) => ({
            ...msg,
            read: true
          }))
        };
      }
      return chat;
    });

    // Return the updated data
    msgData = updatedMessages;
    return updatedMessages;
  } catch (error) {
    console.error("Error marking messages as read:", error);
    throw error;
  }
};

const updateMessages = async (chatIndex, inputValue) => {
  try {
    // Create a new copy of the data and add the new message
    const newMessages = msgData.map((chat, index) => {
      if (index === chatIndex) {
        console.log(chat);
        return {
          ...chat,
          messages: [
            ...chat.messages,
            {
              sender: "Me",
              content: inputValue,
              sendTime: new Date().toISOString(),
              read: true
            }
          ]
        };
      }
      return chat;
    });

    // Return the updated data
    msgData = newMessages;
    return newMessages;
  } catch (error) {
    console.error("Error updating messages:", error);
    throw error;
  }
};

export { fetchMessages, markAsRead, updateMessages };
