import { Server } from "socket.io";

const userSockets = {};

const AUTHENTICATED_USER = 11; // TODO: AUTHENTICATED_USER -> socket.user.id

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:4000"
    }
  });

  io.on("connection", (socket) => {
    console.log(`User ${socket.id} is now connected`);

    if (!userSockets[AUTHENTICATED_USER]) {
      userSockets[AUTHENTICATED_USER] = [];
    }

    userSockets[AUTHENTICATED_USER].push(socket.id);

    socket.on("disconnect", () => {
      userSockets[AUTHENTICATED_USER] = userSockets[AUTHENTICATED_USER].filter(
        (x) => x != socket.id
      );

      console.log(`User ${socket.id} is now disconnected`);
      console.log("USERSOCKETS", userSockets);
    });

    socket.on("newMessage", (params) => {
      console.log("new message accepted");
      console.log(params);

      io.sockets
        .to([
          ...(userSockets[AUTHENTICATED_USER] ?? []),
          ...(userSockets[params.recipientId] ?? [])
        ])
        .emit("newMessage", { from: AUTHENTICATED_USER });
    });
  });
};
