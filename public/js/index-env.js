const urlParams = new URLSearchParams(window.location.search);
const roomId = +urlParams.get("roomId");
const channelId = +urlParams.get("channelId");
const friendName = urlParams.get("friendName");

const channelSocket = io.connect("http://10.8.3.7:3000/channel");
const roomSocket = io.connect("http://10.8.3.7:3000/room");
