import passport from "passport";
import { Server } from "socket.io";

const userSockets = {};

export let io;

const allowedOrigin = process.env.FRONTEND_URI || "http://localhost:4000";

export const initSocket = (httpServer, sessionMiddleware) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.allowedOrigin,
      credentials: true
    }
  });

  function onlyForHandshake(middleware) {
    return (req, res, next) => {
      const isHandshake = req._query.sid === undefined;
      if (isHandshake) {
        middleware(req, res, next);
      } else {
        next();
      }
    };
  }

  io.engine.use(onlyForHandshake(sessionMiddleware));
  io.engine.use(onlyForHandshake(passport.session()));
  io.engine.use(
    onlyForHandshake((req, res, next) => {
      if (req.user) {
        next();
      } else {
        res.writeHead(401);
        res.end();
      }
    })
  );

  io.on("connection", (socket) => {
    console.log(
      `User ${socket.request.user.id} is now connected: ${socket.id}`
    );

    if (!userSockets[socket.request.user.id]) {
      userSockets[socket.request.user.id] = [];
    }

    userSockets[socket.request.user.id].push(socket.id);

    socket.on("disconnect", () => {
      userSockets[socket.request.user.id] = userSockets[
        socket.request.user.id
      ].filter((x) => x != socket.id);

      console.log(`User ${socket.id} is now disconnected`);
      console.log("USERSOCKETS", userSockets);
    });
  });
};

export const newMessage = (msg, senderId, recipientId) => {
  if (userSockets[senderId]) {
    io.sockets.to([...userSockets[senderId]]).emit("newMessage", msg);
  }
  if (userSockets[recipientId]) {
    io.sockets.to([...userSockets[recipientId]]).emit("newMessage", msg);
  }
};

export const newChats = (senderId, recipientId, toSender, toReci) => {
  if (userSockets[senderId]) {
    io.sockets.to([...userSockets[senderId]]).emit("newChat", toSender);
  }
  if (userSockets[recipientId]) {
    io.sockets.to([...userSockets[recipientId]]).emit("newChat", toReci);
  }
};
