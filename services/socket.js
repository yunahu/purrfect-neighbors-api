import passport from "passport";
import { Server } from "socket.io";

const userSockets = {};

export let io;

export const initSocket = (httpServer, sessionMiddleware) => {
  io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:4000",
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
  io.sockets
    .to([...(userSockets[senderId] ?? []), ...(userSockets[recipientId] ?? [])])
    .emit("newMessage", msg);
};
