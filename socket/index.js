const { CONNECTION, MESSAGE, JOIN, LEAVE } = require('../contants/socketEventTypes');

module.exports = io => {
  io.on(CONNECTION, socket => {
    socket.on(JOIN, ({ roomId }) => {
      console.log('CONNECTION');
      socket.join(roomId);
    });

    socket.on(MESSAGE, ({ roomId, userId, message }) => {
      io.to(roomId).emit(MESSAGE, { userId, message });
    });

    socket.on(LEAVE, roomId => {
      socket.leave(roomId);
    });
  });
};
