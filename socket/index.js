const { CONNECTION, MESSAGE, JOIN } = require('../contants/socketEventTypes');

module.exports = io => {
  io.on(CONNECTION, socket => {
    socket.on(JOIN, ({ roomId }) => {
      console.log('CONNECTION');
      socket.join(roomId);
    });

    socket.on(MESSAGE, ({ roomId, userId, message }) => {
      console.log(roomId);
      io.to(roomId).emit(MESSAGE, { userId, message });
    });

    socket.on(MESSAGE, roomId => {
      socket.leave(roomId);
    });
  });
};
