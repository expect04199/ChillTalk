const urlParams = new URLSearchParams(window.location.search);
let roomId = urlParams.get("roomId");
let channelId = urlParams.get("channelId");
window.onload = async () => {
  let room = await (
    await fetch("/api/rooms/details?" + roomId, {
      method: "GET",
      headers: {
        "content-type": "application/json",
      },
    })
  ).json();
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
    thumbnailDiv.style.backgroundImage = `url('${member.picture}')`;
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
  let messages = channel.messages;
  let messagesDiv = document.querySelector(".messages");
  messages.forEach((message) => {
    let messageDiv = createMessage(message);
    if (messageDiv) {
      messagesDiv.append(messageDiv);
    }
  });
};

let user = {
  id: 123456789,
  name: "Test",
  email: "test123@test.com",
  picture:
    "https://i.epochtimes.com/assets/uploads/2021/08/id13156667-shutterstock_376153318-600x400.jpg",
  background:
    "https://i.epochtimes.com/assets/uploads/2021/08/id13156667-shutterstock_376153318-600x400.jpg",
  introduction: "This is a test account.",
  online: true,
};

// enter message
let msgInput = document.querySelector(".enter-message");
msgInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    let description = e.target.value;
    let time = Date.now();
    let message = {
      id: user.id,
      name: user.name,
      time: time,
      picture: user.picture,
      description: description,
    };
    let messagesDiv = document.querySelector(".messages");
    let messageDiv = createMessage(message);
    if (messageDiv) {
      messagesDiv.append(messageDiv);
    }
    e.target.value = "";
  }
});

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
  thumbnail.style.backgroundImage = `url('${message.picture}')`;
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
