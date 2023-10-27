const io = require("socket.io")({
    cors : {
        origin : "*"
    }
});
const socketapi = { io: io };
module.exports.server = socketapi;
io.on("connection", function (client) {
    client.on('init', async function (data) {
        client.join(data.channelID);
    });
    client.on('join', (roomName) => {
        client.join(roomName);
        console.log(`User joined room: ${roomName}`);
    });
});
// Events endpoints
module.exports.onNewEvent = (channelID, reqData) => {
    io.emit(channelID, { event: 'onNewEvent', data : reqData });
};

