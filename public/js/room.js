const urlParams = new URLSearchParams(window.location.search);
let roomId = urlParams.get("roomId");
let channelId = urlParams.get("channelId");

const socket = io.connect("http://10.8.3.7:3000/");

// user info
let user = JSON.parse(localStorage.getItem("info"));

let roomsData = JSON.parse(localStorage.getItem("rooms"));

window.onload = async () => {
  // //render room side bar
  let roomPosition = document.querySelector(".room-position");
  roomsData.forEach((room) => {
    let roomDiv = createRoomfn(room);
    roomPosition.append(roomDiv);
  });
  enableRooms();
  if (!roomId) return;
  let room = await (
    await fetch(`/api/rooms/details?roomId=${roomId}&userId=${user.id}`, {
      method: "GET",
      headers: {
        "content-type": "application/json",
      },
    })
  ).json();
  socket.emit("connect-room", channelId);
  // render room name
  let roomNameDiv = document.querySelector(".room-name p");
  roomNameDiv.innerHTML = room.name;

  // render channels
  let channels = room.channels;
  let channelsDiv = document.querySelector(".channels");
  channels.forEach((channel) => {
    let channelDiv = document.createElement("div");
    channelDiv.classList.add("channel");
    channelDiv.innerHTML = channel.name;
    channelDiv.dataset.channelId = channel.id;
    channelDiv.addEventListener("click", () => {
      window.location.href = `/room.html?roomId=${roomId}&channelId=${channel.id}`;
    });
    channelsDiv.append(channelDiv);
  });

  // render members
  let members = room.members;
  let membersDiv = document.querySelector(".members");
  members.forEach((member) => {
    let memberDiv = document.createElement("div");
    memberDiv.classList.add("member");
    // user thumbnail
    let thumbnailDiv = document.createElement("div");
    thumbnailDiv.classList.add("member-user-thumbnail");
    thumbnailDiv.style.backgroundImage = member.picture
      ? `url('${member.picture}')`
      : `url('https://s2.coinmarketcap.com/static/img/coins/200x200/14447.png')`;
    // user name
    let nameDiv = document.createElement("div");
    nameDiv.classList.add("member-user-name");
    nameDiv.innerHTML = member.name;
    // user online
    let onlineDiv = document.createElement("div");
    onlineDiv.classList.add("member-user-online");
    onlineDiv.innerHTML = member.online ? "online" : "offline";
    memberDiv.append(thumbnailDiv, nameDiv, onlineDiv);
    membersDiv.append(memberDiv);
  });

  // get channel content
  let channel = await (
    await fetch(`/api/channels/details?channelId=${channelId}`, {
      method: "GET",
      headers: {
        "content-type": "application/json",
      },
    })
  ).json();
  let channelName = document.querySelector(".channel-name");
  channelName.innerHTML = channel.name || "";
  let messages = channel.messages;
  let messagesDiv = document.querySelector(".messages");
  messages.forEach((message) => {
    let messageDiv = createMessage(message);
    if (messageDiv) {
      messagesDiv.append(messageDiv);
    }
  });
  messagesDiv.scrollTop = messagesDiv.scrollHeight - messagesDiv.clientHeight;
};

// room link
function enableRooms() {
  let rooms = document.querySelectorAll(".room");
  rooms.forEach((room) => {
    room.addEventListener("click", (e) => {
      let roomId = e.target.id;
      let channelId = e.target.dataset.channel;
      if (channelId) {
        window.location.href = `/room.html?roomId=${roomId}&channelId=${channelId}`;
      } else {
        window.location.href = `/room.html?roomId=${roomId}`;
      }
    });
  });
}

// enter message
let msgInput = document.querySelector(".enter-message");
msgInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && e.target.value !== "") {
    let description = e.target.value;
    let time = Date.now();
    let message = {
      userId: user.id,
      type: "text",
      channelId: channelId,
      description: description,
      time: time,
      name: user.name,
      picture: user.picture,
    };
    let messagesDiv = document.querySelector(".messages");
    let messageDiv = createMessage(message);
    if (messageDiv) {
      messagesDiv.append(messageDiv);
    }
    e.target.value = "";
    messagesDiv.scrollTop = messagesDiv.scrollHeight - messagesDiv.clientHeight;

    // send message to other people
    socket.emit("message", message);
  }
});

// create new room
let createRoom = document.querySelector(".create-room");
let maskDiv = document.querySelector(".mask");
createRoom.addEventListener("click", (e) => {
  e.preventDefault();
  maskDiv.classList.add("enable");
  maskDiv.innerHTML = `
  <div class="join-room-box">
  <div class="create-room-box">
    <h2>建立房間</h2>
    <h3>幫你的房間選個圖示及名稱</h3>
    <input type="file" class="create-room-image" placeholder="上傳房間圖片">
    <input type="text" class="create-room-name" placeholder="輸入房間名稱">
    <button class="create-room-btn">建立房間</button>
  </div>
  <div class="join-exist-room">
    <h3>加入房間</h3>
    <input type="text" class="join-room-id" placeholder="輸入房間ID" value="">
    <button class="join-room-btn">加入房間</button>
  </div>
</div>`;
  // create new room
  let createRoomName = document.querySelector(".create-room-name");
  let createRoomBtn = document.querySelector(".create-room-btn");
  createRoomBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (createRoomName.value === "") return;
    let name = createRoomName.value;
    let userId = user.id;
    let body = {
      room_name: name,
      user_id: userId,
    };
    let roomData = await (
      await fetch("/api/rooms/create", {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "content-type": "application/json",
        },
      })
    ).json();
    updateStorage("room", roomData);
    window.location.href = `/room.html?roomId=${roomData.id}`;
  });

  // join exist room
  let existRoomId = document.querySelector(".join-room-id");
  let joinRoomBtn = document.querySelector(".join-room-btn");
  joinRoomBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (existRoomId.value === "") return;
    let roomId = existRoomId.value;
    let userId = user.id;
    let body = {
      room_id: roomId,
      user_id: userId,
    };
    let roomData = await (
      await fetch("/api/rooms/join", {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "content-type": "application/json",
        },
      })
    ).json();
    updateStorage("room", roomData);
    window.location.href = `/room.html?roomId=${roomData.id}&channelId=${roomData.channel_id}`;
  });
});

// create new channel
let createChannel = document.querySelector(".channel-create-btn");
createChannel.addEventListener("click", (e) => {
  e.preventDefault();
  maskDiv.classList.add("enable");
  maskDiv.innerHTML = `<div class='create-channel-box '>
  <div class='create-channel-headline'>
    <h3>建立頻道</h3>
  </div>
  <div class='create-text-channel'>
    <h3>Text</h3>
    <h4>輸入訊息及文字</h4>
  </div>
  <div class='create-voice-channel'>
    <h3>Voice</h3>
    <h4>語音通話、視訊通話及畫面交流</h4>
  </div>
  <input type='text' class='create-channel-name' placeholder='請輸入頻道名稱'>
  <div class='create-channel-btns'>
    <button type='button' class='create-channel-cancel'>取消</button>
    <button type='button' class='create-channel-btn' data-type="text">建立頻道</button>
  </div>
</div>`;

  let createText = document.querySelector(".create-text-channel");
  let createVoice = document.querySelector(".create-voice-channel");
  let createChannelInput = document.querySelector(".create-channel-name");
  let createChannelBtn = document.querySelector(".create-channel-btn");
  let createChannelCancel = document.querySelector(".create-channel-cancel");
  createText.addEventListener("click", (e) => {
    createChannelBtn.dataset.type = "text";
  });
  createVoice.addEventListener("click", (e) => {
    createChannelBtn.dataset.type = "voice";
  });
  createChannelBtn.addEventListener("click", async (e) => {
    if (createChannelInput.value !== "" && roomId) {
      let channelType = e.target.dataset.type;
      let channelName = createChannelInput.value;
      let data = {
        channel_type: channelType,
        channel_name: channelName,
        room_id: roomId,
      };
      let channelDetail = await (
        await fetch("/api/channels/create", {
          method: "POST",
          body: JSON.stringify(data),
          headers: {
            "content-type": "application/json",
          },
        })
      ).json();
      createChannelInput.value = "";
      maskDiv.classList.remove("enable");
      maskDiv.innerHTML = "";
      createChannelfn(channelDetail);
    }
  });

  createChannelCancel.addEventListener("click", (e) => {
    createChannelInput.value = "";
    maskDiv.classList.remove("enable");
    maskDiv.innerHTML = "";
  });
});

// when click mask, disable it
maskDiv.addEventListener("click", (e) => {
  if (e.target.classList.contains("mask")) {
    e.target.innerHTML = "";
    e.target.classList.remove("enable");
  }
});

// listen to other people's message
socket.on("message", (message) => {
  let messagesDiv = document.querySelector(".messages");
  let messageDiv = createMessage(message);
  if (messageDiv) {
    messagesDiv.append(messageDiv);
  }
  messagesDiv.scrollTop = messagesDiv.scrollHeight - messagesDiv.clientHeight;
});

// disconnect socket when leave page
window.onunload = window.onbeforeunload = () => {
  socket.close();
};

function createMessage(message) {
  //if previous message is same name and sent in two minutes, append
  let latestMessage = document.querySelectorAll(".message");
  latestMessage = latestMessage ? latestMessage[latestMessage.length - 1] : null;
  if (
    latestMessage &&
    message.name === latestMessage.dataset.name &&
    message.time < +latestMessage.dataset.time + 5000
  ) {
    let messageDiv = document.createElement("div");
    messageDiv.classList.add("message-description");
    messageDiv.innerHTML = message.description;
    latestMessage.querySelector(".message-text").append(messageDiv);
    return;
  }

  let messageDiv = document.createElement("div");
  messageDiv.classList.add("message");
  messageDiv.dataset.name = message.name;
  messageDiv.dataset.time = message.time;

  // render user thumbnail
  let thumbnailBox = document.createElement("div");
  thumbnailBox.classList.add("message-thumbnail-box");
  let thumbnail = document.createElement("div");
  thumbnail.classList.add("message-user-thumbnail");
  thumbnail.style.backgroundImage = message.picture
    ? `url('${message.picture}')`
    : `url('https://s2.coinmarketcap.com/static/img/coins/200x200/14447.png')`;
  thumbnailBox.append(thumbnail);

  // render user text
  let textBox = document.createElement("div");
  textBox.classList.add("message-text");

  // user info
  let infoBox = document.createElement("div");
  infoBox.classList.add("message-info");
  let name = document.createElement("div");
  name.classList.add("message-name");
  name.innerHTML = message.name;
  let time = document.createElement("div");
  time.classList.add("message-time");
  time.innerHTML = timeTransform(message.time);
  infoBox.append(name, time);

  // render description
  let description = document.createElement("div");
  description.classList.add("message-description");
  description.innerHTML = message.description;
  textBox.append(infoBox, description);

  messageDiv.append(thumbnailBox, textBox);
  return messageDiv;
}

function timeTransform(timestamp) {
  let date = new Date(timestamp);
  let time = date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate();
  return time;
}

function createChannelfn(channel) {
  let channelsDiv = document.querySelector(".channels");
  let channelDiv = document.createElement("div");
  channelDiv.classList.add("channel");
  channelDiv.innerHTML = channel.name;
  channelDiv.dataset.channelId = channel.id;
  channelDiv.addEventListener("click", () => {
    window.location.href = `/room.html?roomId=${roomId}&channelId=${channel.id}`;
  });
  channelsDiv.append(channelDiv);
  updateStorage("channel", channel);
}

function createRoomfn(room) {
  let roomDiv = document.createElement("div");
  roomDiv.classList.add("room");
  roomDiv.id = room.id;
  roomDiv.style.backgroundImage = `url('${room.picture}')`;
  if (room.channel_id) {
    roomDiv.dataset.channel = room.channel_id;
  }
  return roomDiv;
}

function updateStorage(scope, data) {
  if (scope === "room") {
    let rooms = JSON.parse(localStorage.getItem("rooms"));
    rooms.push(data);
    localStorage.setItem("rooms", JSON.stringify(rooms));
  } else if (scope === "channel") {
    let rooms = JSON.parse(localStorage.getItem("rooms"));
    let currentRoom = rooms.find((room) => +room.id === +roomId);
    currentRoom.channel_id = data.id;
    localStorage.setItem("rooms", JSON.stringify(rooms));
  }
}
