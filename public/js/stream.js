const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("roomId");
const channelId = urlParams.get("channelId");

const roomSocket = io.connect("http://10.8.3.7:3000/room");
const videoSocket = io.connect("http://10.8.3.7:3000/video");

// user info
const user = JSON.parse(localStorage.getItem("info"));
const roomsData = JSON.parse(localStorage.getItem("rooms"));
const token = localStorage.getItem("token");

window.onload = async () => {
  document.querySelector("title").innerHTML = roomsData.find((room) => +room.id === +roomId).name;
  // render room side bar
  let roomPosition = document.querySelector(".room-position");
  roomsData.forEach((room) => {
    let roomDiv = createRoomfn(room);
    roomPosition.append(roomDiv);
  });
  enableRooms();
  if (!roomId) return;
  let roomInfo = await (
    await fetch(`/api/rooms/details?roomId=${roomId}&userId=${user.id}`, {
      method: "GET",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
  ).json();
  videoSocket.emit("connect-room", channelId, user.id);
  roomSocket.emit("connect-room", roomsData);
  // render room name
  let roomNameDiv = document.querySelector(".room-name p");
  roomNameDiv.innerHTML = `${roomInfo.name} #${roomId}`;

  // render channels
  let channels = roomInfo.channels;
  let channelsDiv = document.querySelector(".channels");

  channels.forEach((channel) => {
    let channelDiv = document.createElement("div");
    channelDiv.classList.add("channel");
    channelDiv.innerHTML = channel.name;
    channelDiv.dataset.channelId = channel.id;
    channelDiv.dataset.channelType = channel.type;
    channelDiv.addEventListener("click", (e) => {
      if (e.target.dataset.channelId === channelId) return;
      if (e.target.dataset.channelType === "text") {
        window.location.href = `/room.html?roomId=${roomId}&channelId=${e.target.dataset.channelId}`;
      } else if (e.target.dataset.channelType === "voice") {
        style.back;
        window.location.href = `/stream.html?roomId=${roomId}&channelId=${e.target.dataset.channelId}`;
      }
    });
    channelsDiv.append(channelDiv);
  });
  // render host info
  document.querySelector(".host-thumbnail").style.backgroundImage = `url("${user.picture}")`;
  document.querySelector(".host-online").style.backgroundColor = user.online
    ? "#00EE00"
    : "#CD0000";
  document.querySelector(".host-name").innerHTML = user.name;
  let hostSetting = document.querySelector(".host-setting");
  hostSetting.addEventListener("click", (e) => {
    if (e.target.classList.contains("cog")) {
      let mask = document.querySelector(".mask");
      mask.classList.add("enable");
      mask.innerHTML += `
      <div class="edit-host-info">
        <div class="edit-host-headline">編輯個人資訊</div>
        <div class="background-upload">
          <div class="host-background-edit">
            <input type="file" id="host-background-upload" accept=".png, .jpg, jpeg" />
            <label for="host-background-upload">
              <i class="plus icon"></i>
            </label>
          </div>
          <div class="host-background-preview">
            <div id="background-preview"></div>
          </div>
        </div>
        <div class="picture-upload">
          <div class="host-picture-edit">
            <input type="file" id="host-picture-upload" accept=".png, .jpg, jpeg" />
            <label for="host-picture-upload">
              <i class="plus icon"></i>
            </label>
          </div>
          <div class="host-picture-preview">
            <div id="picture-preview"></div>
          </div>
        </div>
        <div class="edit-host-name"  contenteditable="true"></div>
        <textarea
          class="edit-host-introduction"
          cols="30"
          rows="10"
          placeholder="關於我"
        ></textarea>
        <button class="edit-host-btn">儲存</button>
      </div>
      `;

      let backgroundInput = mask.querySelector("#host-background-upload");
      let backgroundPreview = mask.querySelector("#background-preview");
      backgroundPreview.style.backgroundImage = `url("${user.background}")`;
      backgroundInput.addEventListener("change", function () {
        readURL(this, "#background-preview");
      });

      let pictureInput = mask.querySelector("#host-picture-upload");
      let picturePreview = mask.querySelector("#picture-preview");
      picturePreview.style.backgroundImage = `url("${user.picture}")`;
      pictureInput.addEventListener("change", function () {
        readURL(this, "#picture-preview");
      });

      let editName = mask.querySelector(".edit-host-name");
      editName.innerHTML = user.name;
      let userIntroduction = mask.querySelector(".edit-host-introduction");
      userIntroduction.innerHTML = user.introduction;

      let saveBtn = mask.querySelector(".edit-host-btn");
      saveBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        let name = editName.innerHTML;
        let introduction = userIntroduction.value;

        let body = new FormData();
        if (pictureInput.files[0]) {
          body.append("picture", pictureInput.files[0]);
        }
        if (backgroundInput.files[0]) {
          body.append("background", backgroundInput.files[0]);
        }
        body.append("name", name);
        body.append("introduction", introduction);
        let userData = await (
          await fetch("/api/users", {
            method: "PUT",
            body,
            headers: { Authorization: `Bearer ${token}` },
          })
        ).json();
        localStorage.setItem("info", JSON.stringify(userData.info));
        localStorage.setItem("token", userData.access_token);
        history.go(0);
        return;
      });
    }
  });

  // when user is room host, show setting icon
  let roomSetting = document.createElement("li");
  roomSetting.classList.add("room-settings");
  roomSetting.innerHTML = `<i class="cog icon"></i>`;
  let currentRoom = roomsData.find((room) => +room.id === +roomId);
  let toolList = document.querySelector(".tools");
  if (currentRoom.host_id === user.id) {
    toolList.prepend(roomSetting);
  }

  // when click room setting, show setting page
  roomSetting.addEventListener("click", (e) => {
    let mask = document.querySelector(".mask");
    let room = roomsData.find((room) => (room.id = roomId));
    mask.classList.add("enable");
    mask.innerHTML = `
    <div class="edit-room-box">
      <h2>編輯房間</h2>
      <div class="room-upload">
        <div class="room-edit">
          <input type="file" id="edit-room-upload" accept=".png, .jpg, .jpeg" />
          <label for="edit-room-upload">
            <i class="plus icon"></i>
          </label>
        </div>
        <div class="room-preview">
          <div id="edit-room-preview"></div>
        </div>
      </div>
      <input type="text" class="edit-room-name" />
      <button class="save-room-btn">儲存</button>
    </div>
    `;

    let preview = mask.querySelector("#edit-room-preview");
    preview.style.backgroundImage = `url("${room.picture}")`;
    let picInput = mask.querySelector("#edit-room-upload");
    picInput.addEventListener("change", function (e) {
      readURL(this, "#edit-room-preview");
    });
    let nameInput = mask.querySelector(".edit-room-name");
    nameInput.value = room.name;
    let saveBtn = mask.querySelector(".save-room-btn");
    saveBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      let body = new FormData();
      body.append("id", room.id);
      let newName = nameInput.value;
      if (picInput.files[0]) {
        body.append("picture", picInput.files[0]);
      }
      if (newName !== room.name) {
        body.append("name", newName);
      }
      body.append("original_name", room.name);
      body.append("original_picture", room.picture);

      let roomInfo = await (
        await fetch("/api/rooms", {
          method: "PUT",
          body,
          headers: { Authorization: `Bearer ${token}` },
        })
      ).json();
      let index = roomsData.indexOf(room);
      roomInfo.host_id = room.host_id;
      roomInfo.channel_id = room.channel_id;
      roomsData[index] = roomInfo;
      localStorage.setItem("rooms", JSON.stringify(roomsData));
      history.go(0);
    });
  });

  if (!channelId) return;

  // render channel-name
  let channelName = document.querySelector(".channel-name");
  channelName.innerHTML = channels.find((channel) => +channel.id === +channelId).name;
};

let participantBox = document.querySelector(".participant-box");
let participant = createParticipant(user);
participant.dataset.muted = true;
participantBox.append(participant);

// when click home page, redirect to homepage
let home = document.querySelector(".home");
home.addEventListener("mousedown", () => {
  window.location.href = `/index.html`;
});

// when right click, show nothing
document.addEventListener("contextmenu", (e) => e.preventDefault());

// room link
function enableRooms() {
  let rooms = document.querySelectorAll(".room");
  rooms.forEach((room) => {
    room.addEventListener("click", (e) => {
      let rId = e.target.id;
      if (rId === roomId) return;
      let channelId = e.target.dataset.channel;
      if (channelId) {
        window.location.href = `/room.html?roomId=${rId}&channelId=${channelId}`;
      } else {
        window.location.href = `/room.html?roomId=${rId}`;
      }
    });
  });
}

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
    <div class="avatar-upload">
      <div class="avatar-edit">
        <input type="file" id="room-image-upload" accept=".png, .jpg, .jpeg" />
        <label for="room-image-upload"><i class="plus icon"></i></label>
      </div>
      <div class="avatar-preview">
        <div id="room-image-preview"></div>
      </div>
    </div>
    <input type="text" class="create-room-name" placeholder="輸入房間名稱" />
    <button class="create-room-btn">建立房間</button>
    <p>或 加入房間</p>
    </div>
    <div class="join-exist-room">
      <h2>加入房間</h2>
      <h3>和朋友們一起聊天吧！</h3>
      <input type="text" class="join-room-id" placeholder="輸入房間ID" value="" />
      <button class="join-room-btn">加入房間</button>
      <p>返回</p>
    </div>
  </div>`;

  // upload image
  let roomImage = document.querySelector("#room-image-upload");
  roomImage.addEventListener("change", function () {
    readURL(this, "#room-image-preview");
  });

  // create new room
  let createRoomName = document.querySelector(".create-room-name");
  let createRoomBtn = document.querySelector(".create-room-btn");
  createRoomBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (createRoomName.value === "") return;
    let name = createRoomName.value;
    let userId = user.id;
    let body = new FormData();
    let imageInput = roomImage;
    if (imageInput.files[0]) {
      body.append("picture", imageInput.files[0]);
    }
    body.append("room_name", name);
    body.append("user_id", userId);
    let roomData = await (
      await fetch("/api/rooms/create", {
        method: "POST",
        body,
      })
    ).json();
    updateStorage("room", roomData);
    roomSocket.emit("connect-room", [roomData.id]);
    window.location.href = `/room.html?roomId=${roomData.id}`;
  });

  // when click join room, show join room form
  let createRoomBox = document.querySelector(".create-room-box");
  let joinRoomLink = document.querySelector(".create-room-box p");

  let joinRoomBox = document.querySelector(".join-room-box");
  let joinExistRoom = document.querySelector(".join-exist-room");
  joinRoomLink.addEventListener("click", () => {
    createRoomBox.style.animation = "create-room-fadeout 0.1s forwards";
    joinRoomBox.style.animation = "join-room-box-small 0.3s forwards";
    joinExistRoom.style.animation = "exist-room-fadein 0.3s forwards";
  });

  // when click return, show create room form
  let createRoomLink = document.querySelector(".join-exist-room p");
  createRoomLink.addEventListener("click", () => {
    createRoomBox.style.animation = "create-room-fadein 0.3s forwards";
    joinRoomBox.style.animation = "join-room-box-big 0.3s forwards";
    joinExistRoom.style.animation = "exist-room-fadeout 0.1s forwards";
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
    roomSocket.emit("join-room", { roomId: roomData.id, user });
    if (roomData.channelId) {
      window.location.href = `/room.html?roomId=${roomData.id}&channelId=${roomData.channel_id}`;
    } else {
      window.location.href = `/room.html?roomId=${roomData.id}`;
    }
  });
});

// create new channel
let createChannel = document.querySelector(".channel-create-btn");
createChannel.addEventListener("click", (e) => {
  e.preventDefault();
  maskDiv.classList.add("enable");
  maskDiv.innerHTML = `
  <div class="create-channel-box">
    <div class="create-channel-headline">
      <h3>建立頻道</h3>
    </div>
    <div class="create-text-channel">
      <i class="hashtag icon"></i>
      <h3>Text</h3>
      <h4>輸入訊息及文字</h4>
    </div>
    <div class="create-voice-channel">
      <i class="volume up icon"></i>
      <h3>Voice</h3>
      <h4>語音通話、視訊通話及畫面交流</h4>
    </div>
    <input type="text" class="create-channel-name" placeholder="請輸入頻道名稱" />
    <button type="button" class="create-channel-btn" data-type="text">建立頻道</button>
  </div>`;

  let createText = document.querySelector(".create-text-channel");
  let createVoice = document.querySelector(".create-voice-channel");
  let createChannelInput = document.querySelector(".create-channel-name");
  let createChannelBtn = document.querySelector(".create-channel-btn");
  createText.addEventListener("click", (e) => {
    createText.style.backgroundColor = "rgb(26, 26, 26)";
    createVoice.style.backgroundColor = "rgb(45, 46, 46)";
    createChannelBtn.dataset.type = "text";
  });
  createVoice.addEventListener("click", (e) => {
    createVoice.style.backgroundColor = "rgb(26, 26, 26)";
    createText.style.backgroundColor = "rgb(45, 46, 46)";
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
});

// when click mask, disable it
maskDiv.addEventListener("mousedown", (e) => {
  if (e.target.classList.contains("mask")) {
    e.target.innerHTML = "";
    e.target.classList.remove("enable");
  }
});

// when click mail icon, show message box
let mail = document.querySelector(".mailbox");
mail.addEventListener("click", showMailBox);

async function showMailBox(e) {
  if (e.target.classList.contains("envelope")) {
    e.stopPropagation();
    e.target.classList.toggle("tool-enable");
    let mailMessagesBox = mail.querySelector(".mail-messages-box");
    if (!mailMessagesBox) {
      mailMessagesBox = document.createElement("div");
      mailMessagesBox.classList.add("mail-messages-box");

      let mailBoxHeadline = document.createElement("div");
      mailBoxHeadline.classList.add("mail-box-headline");
      mailBoxHeadline.innerHTML = "收件匣";

      let mailMessages = document.createElement("div");
      mailMessages.classList.add("mail-messages");
      mailMessagesBox.append(mailBoxHeadline, mailMessages);
      mail.append(mailMessagesBox);
      let nextPage = false;
      let result = await (
        await fetch(`/api/messages/mail`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      ).json();

      nextPage = result.next_paging;
      let messages = result.messages;
      if (messages.length !== 0) {
        let roomName = messages[0].room_name;
        let channelName = messages[0].channel_name;
        let roomPic = messages[0].room_picture;

        let mailChannel = document.createElement("div");
        mailChannel.classList.add("mail-channel");

        let mailChannelInfo = document.createElement("div");
        mailChannelInfo.classList.add("mail-channel-info");
        let roomThumbnail = document.createElement("div");
        roomThumbnail.classList.add("mail-room-thumbnail");
        roomThumbnail.style.backgroundImage = `url("${roomPic}"`;
        let mailChannelName = document.createElement("div");
        mailChannelName.classList.add("mail-channel-name");
        mailChannelName.innerHTML = channelName;
        let mailRoomName = document.createElement("div");
        mailRoomName.classList.add("mail-room-name");
        mailRoomName.innerHTML = roomName;

        mailChannelInfo.append(roomThumbnail, mailChannelName, mailRoomName);
        mailChannel.append(mailChannelInfo);

        messages.forEach((message) => {
          let messageBox = createMail(message);
          mailChannel.append(messageBox);
        });
        mailMessages.append(mailChannel);
      }

      // when user scroll messages to bottom, show latest content
      let mailOptions = {
        rootMargin: "0px",
        threshold: 1,
      };

      const mailCallback = async (entries, observer) => {
        for (let entry of entries) {
          if (!entry.isIntersecting || !nextPage) return;
          let result = await (
            await fetch(`/api/messages/mail?`, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
          ).json();
          nextPage = result.next_paging;
          let messages = result.messages;
          let roomName = messages[0].room_name;
          let channelName = messages[0].channel_name;
          let roomPic = messages[0].room_picture;

          let mailChannel = document.createElement("div");
          mailChannel.classList.add("mail-channel");

          let mailChannelInfo = document.createElement("div");
          mailChannelInfo.classList.add("mail-channel-info");
          let roomThumbnail = document.createElement("div");
          roomThumbnail.classList.add("mail-room-thumbnail");
          roomThumbnail.style.backgroundImage = `url("${roomPic}"`;
          let mailChannelName = document.createElement("div");
          mailChannelName.classList.add("mail-channel-name");
          mailChannelName.innerHTML = channelName;
          let mailRoomName = document.createElement("div");
          mailRoomName.classList.add("mail-room-name");
          mailRoomName.innerHTML = roomName;

          mailChannelInfo.append(roomThumbnail, mailChannelName, mailRoomName);
          mailChannel.append(mailChannelInfo);

          messages.forEach((message) => {
            let messageBox = createMail(message);
            mailChannel.append(messageBox);
          });
          mailMessages.append(mailChannel);

          observer.unobserve(entry.target);
          let messageBoxes = mailChannel.querySelectorAll(".mail-message-box");
          if (entry.target === messageBoxes[messageBoxes.length - 1] && !nextPage) return;
        }
        let messageBoxes = document.querySelectorAll(".mail-message-box");
        observer.observe(messageBoxes[messageBoxes.length - 1]);
      };

      const mailObserver = new IntersectionObserver(mailCallback, mailOptions);
      const lastMessage = mail.querySelectorAll(".mail-message-box");
      if (lastMessage[lastMessage.length - 1] && nextPage) {
        mailObserver.observe(lastMessage[lastMessage.length - 1]);
      }
    } else {
      mailMessagesBox.remove();
    }
  }
}

// log out button
let singOutDiv = document.querySelector(".sign-out");
singOutDiv.addEventListener("click", (e) => {
  localStorage.clear();
  roomSocket.emit("self-signout", { userId: user.id, rooms: roomsData });
  window.location.href = "/signin.html";
});

function timeTransform(timestamp) {
  let date = new Date(timestamp);
  moment.locale("zh-tw");
  let time = moment(date).fromNow();
  return time;
}

function createChannelfn(channel) {
  let channelsDiv = document.querySelector(".channels");
  let channelDiv = document.createElement("div");
  channelDiv.classList.add("channel");
  channelDiv.innerHTML = channel.name;
  channelDiv.dataset.channelId = channel.id;
  channelDiv.dataset.type = channel.type;
  channelDiv.addEventListener("click", () => {
    if (channel.type === "text") {
      window.location.href = `/room.html?roomId=${roomId}&channelId=${channel.id}`;
    } else if (channel.type === "voice") {
      window.location.href = `/stream.html?roomId=${roomId}&channelId=${channel.id}`;
    }
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

function readURL(input, preview) {
  if (input.files && input.files[0]) {
    let reader = new FileReader();
    reader.onload = function (e) {
      document.querySelector(preview).style.backgroundImage = "url(" + e.target.result + ")";
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function createMail(message) {
  let messageBox = document.createElement("div");
  messageBox.classList.add("mail-message-box");

  let thumbnail = document.createElement("div");
  thumbnail.classList.add("mail-thumbnail");
  thumbnail.style.backgroundImage = `url("${message.user_picture}")`;

  let messageInfo = document.createElement("div");
  messageInfo.classList.add("mail-message-info");

  let name = document.createElement("div");
  name.classList.add("mail-name");
  name.innerHTML = message.name;

  let time = document.createElement("div");
  time.classList.add("mail-time");
  time.innerHTML = timeTransform(message.time);
  messageInfo.append(name, time);

  let desc = document.createElement("div");
  desc.classList.add("mail-description");
  desc.innerHTML = message.description;

  messageBox.append(thumbnail, messageInfo, desc);
  return messageBox;
}

function createParticipant(par) {
  let participant = document.createElement("div");
  participant.classList.add("participant");
  participant.dataset.id = par.id;

  let video = document.createElement("video");
  video.classList.add("participant-video");
  video.autoplay = true;
  video.addEventListener("mousedown", (e) => {
    if (e.target.style.display === "none" || !video.srcObject) return;

    let mainVideo = document.querySelector(".stream-video video");
    if (mainVideo.srcObject === video.srcObject) {
      mainVideo.style.display = "none";
      mainVideo.srcObject = null;
    } else {
      mainVideo.style.display = "block";
      mainVideo.srcObject = video.srcObject;
      if (+par.id === +user.id) {
        mainVideo.muted = true;
      }
    }
  });

  let name = document.createElement("div");
  name.classList.add("participant-name");
  name.innerHTML = par.name;

  let thumbnail = document.createElement("div");
  thumbnail.classList.add("participant-thumbnail");
  thumbnail.style.backgroundImage = `url("${par.picture}")`;

  participant.append(video, name, thumbnail);
  return participant;
}

// // webrtc
// const config = {
//   iceServers: [
//     {
//       urls: ["stun:stun.l.google.com:19302"],
//     },
//   ],
// };

// const videoConstraints = {
//   audio: true,
//   video: {
//     width: 600,
//     height: 300,
//   },
// };

// const gdmOptions = {
//   video: {
//     cursor: "always",
//   },
//   audio: {
//     echoCancellation: true,
//     noiseSuppression: true,
//     sampleRate: 44100,
//   },
// };

// let videoPCs = {};
// let videoSrc;
// let videoTrack;
// let audioTrack;

// quit stream
let quit = document.querySelector(".stream-quit");
quit.addEventListener("click", (e) => {
  window.location.href = `/room.html?roomId=${roomId}`;
});

// // open camera
// const streamTools = document.querySelector(".stream-tools");
// const camera = streamTools.querySelector(".stream-camera");
// camera.addEventListener("mousedown", (e) => {
//   const currParticipant = document.querySelector(`.participant[data-id="${user.id}"]`);
//   let currVideo = currParticipant.querySelector(".participant-video");
//   if (!currVideo.srcObject) {
//     navigator.mediaDevices
//       .getUserMedia(videoConstraints)
//       .then((stream) => {
//         videoSrc = stream;
//         currVideo.srcObject = stream;
//         currVideo.style.display = "block";
//         currVideo.muted = true;

//         let pcs = Object.values(videoPCs);
//         pcs.forEach((pc) => {
//           const senders = pc.getSenders();
//           senders.forEach((sender) => pc.removeTrack(sender));
//           stream.getTracks().forEach((track) => {
//             pc.addTrack(track, stream);
//           });
//         });
//       })
//       .catch((error) => console.error(error));
//   } else {
//     videoSocket.emit("camera-off", channelId, user.id);
//     currVideo.srcObject.getTracks().forEach((track) => {
//       track.stop();
//     });
//     currVideo.style.display = "none";
//     currVideo.srcObject = null;
//   }
// });
// let screenSrc;
// // share screen
// const screen = streamTools.querySelector(".stream-share-screen");
// screen.addEventListener("mousedown", (e) => {
//   const currParticipants = document.querySelectorAll(`.participant[data-id="${user.id}"]`);
//   const participantBox = document.querySelector(".participant-box");
//   if (currParticipants.length < 2) {
//     let screenParticipant = createParticipant(user);
//     screenParticipant.dataset.type = "screen";
//     participantBox.insertBefore(screenParticipant, currParticipants[0]);
//   }
//   let screenBox = participantBox.querySelector(
//     `.participant[data-id="${user.id}"][data-type="screen"]`
//   );
//   let currVideo = screenBox.querySelector(".participant-video");
//   if (!currVideo.srcObject) {
//     navigator.mediaDevices
//       .getDisplayMedia(gdmOptions)
//       .then((stream) => {
//         screenSrc = stream;
//         currVideo.srcObject = stream;
//         currVideo.style.display = "block";
//       })
//       .catch((error) => console.error(error));
//   } else {
//     currVideo.srcObject.getTracks().forEach((track) => {
//       track.stop();
//     });
//     screenBox.remove();
//   }
// });

// // video sockets
// const ICEconfig = {
//   iceServers: [],
// };
// let videoSocketId;

// // video former side
// videoSocket.on("watch", (id, par) => {
//   console.log("watch");
//   const participantBox = document.querySelector(".participant-box");
//   const participant = createParticipant(par);
//   participantBox.append(participant);
//   const videoPC = new RTCPeerConnection(ICEconfig);
//   videoPCs[id] = videoPC;
//   let videoStream = videoSrc;
//   if (videoStream) {
//     videoStream.getTracks().forEach((track) => {
//       videoPC.addTrack(track, videoStream);
//     });
//   }

//   // event is called when receive an ICE candidate
//   videoPC.onicecandidate = (event) => {
//     if (event.candidate) {
//       videoSocket.emit("former-candidate", id, event.candidate);
//     }
//   };

//   videoPC
//     .createOffer()
//     .then((sdp) => videoPC.setLocalDescription(sdp))
//     .then(() => {
//       videoSocket.emit("offer", id, videoPC.localDescription, user);
//     })
//     .catch((e) => console.log(e));

//   videoPC.onnegotiationneeded = () => {
//     videoPC
//       .createOffer()
//       .then((sdp) => videoPC.setLocalDescription(sdp))
//       .then(() => {
//         videoSocket.emit("offer", id, videoPC.localDescription, user);
//       })
//       .catch((e) => console.log(e));
//   };
// });

// videoSocket.on("answer", (id, description) => {
//   const desc = new RTCSessionDescription(description);
//   videoPCs[id].setRemoteDescription(desc).catch((e) => console.log(e));
// });

// videoSocket.on("latter-candidate", (id, candidate) => {
//   videoPCs[id].addIceCandidate(new RTCIceCandidate(candidate));
// });

// videoSocket.on("disconnectPeer", (id, userId) => {
//   let userDivs = document.querySelectorAll(`.participant[data-id="${userId}"]`);
//   userDivs.forEach((userDiv) => userDiv.remove());
//   videoPCs[id].close();
//   delete videoPCs[id];
// });

// // video later side
// videoSocket.on("connect", () => {
//   videoSocket.emit("watch", channelId, user);
// });

// videoSocket.on("offer", (id, description, par) => {
//   const participantBox = document.querySelector(".participant-box");
//   let participant = participantBox.querySelector(`.participant[data-id="${par.id}"]`);
//   if (!participant) {
//     participant = createParticipant(par);
//     participantBox.append(participant);
//   }
//   const video = participant.children[0];

//   let videoPC = new RTCPeerConnection(ICEconfig);
//   videoPCs[id] = videoPC;
//   console.log(id);
//   videoPC.onnegotiationneeded = () => {
//     videoPC
//       .createOffer()
//       .then((sdp) => videoPC.setLocalDescription(sdp))
//       .then(() => {
//         videoSocket.emit("offer", id, videoPC.localDescription, user);
//       })
//       .catch((e) => console.log(e));
//   };

//   if (description) {
//     console.log("error");
//     videoPC
//       .setRemoteDescription(description)
//       .then(() => videoPC.createAnswer())
//       .then((sdp) => videoPC.setLocalDescription(sdp))
//       .then(() => {
//         videoSocket.emit("answer", id, videoPC.localDescription);
//       })
//       .catch((e) => console.log(e));
//   }

//   videoPC.ontrack = (event) => {
//     console.log(event.streams);
//     console.log(video);
//     video.srcObject = event.streams[0];
//     video.style.display = "block";
//   };

//   videoPC.onicecandidate = (event) => {
//     if (event.candidate) {
//       videoSocket.emit("latter-candidate", id, event.candidate);
//     }
//   };
// });

// videoSocket.on("former-candidate", (id, candidate) => {
//   videoPCs[id].addIceCandidate(new RTCIceCandidate(candidate)).catch((e) => console.error(e));
// });

// videoSocket.on("camera-off", (id, userId) => {
//   let participant = document.querySelector(`.participant[data-id="${userId}"]`);
//   const video = participant.children[0];
//   video.srcObject = null;
//   video.style.display = "none";
// });

// disconnect socket when leave page
window.onbeforeunload = () => {
  videoSocket.close();
  roomSocket.close();
};

const peers = {};
let userStream;
const currParticipant = document.querySelector(`.participant[data-id="${user.id}"]`);
let currVideo = currParticipant.querySelector(".participant-video");

function callOtherUsers(otherUsers, stream) {
  otherUsers.forEach((userSocketIdToCall) => {
    videoSocket.emit("offer user info", userSocketIdToCall, user);
    const peer = createPeer(userSocketIdToCall);
    peers[userSocketIdToCall] = peer;

    stream.getTracks().forEach((track) => {
      peer.addTrack(track, stream);
    });
  });
}

function createPeer(userSocketIdToCall) {
  const peer = new RTCPeerConnection({
    iceServers: [
      {
        urls: ["stun:stun.l.google.com:19302"],
      },
    ],
  });
  peer.onnegotiationneeded = () =>
    userSocketIdToCall ? handleNegotiationNeededEvent(peer, userSocketIdToCall) : null;
  peer.onicecandidate = handleICECandidateEvent;

  peer.ontrack = (e) => {
    const participantBox = document.querySelector(".participant-box");
    let participant = participantBox.querySelector(
      `.participant[data-socket-id="${userSocketIdToCall}"]`
    );
    const video = participant.children[0];
    video.srcObject = e.streams[0];
    video.autoplay = true;
    video.style.display = "block";
  };

  return peer;
}

async function handleNegotiationNeededEvent(peer, userSocketIdToCall) {
  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  const payload = {
    sdp: peer.localDescription,
    userSocketIdToCall,
  };

  videoSocket.emit("peer connection request", payload);
}

async function handleReceiveOffer({ sdp, callerId }, stream) {
  const peer = createPeer(callerId);
  peers[callerId] = peer;
  const desc = new RTCSessionDescription(sdp);
  await peer.setRemoteDescription(desc);

  stream.getTracks().forEach((track) => {
    peer.addTrack(track, stream);
  });

  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);

  const payload = {
    userToAnswerTo: callerId,
    sdp: peer.localDescription,
  };
  videoSocket.emit("connection answer", payload);
}

function handleAnswer({ sdp, answererId }) {
  const desc = new RTCSessionDescription(sdp);
  peers[answererId].setRemoteDescription(desc).catch((e) => console.log(e));
}

function handleICECandidateEvent(e) {
  if (e.candidate) {
    Object.keys(peers).forEach((id) => {
      const payload = {
        target: id,
        candidate: e.candidate,
      };
      videoSocket.emit("ice-candidate", payload);
    });
  }
}

function handleReceiveIce({ candidate, from }) {
  const inComingCandidate = new RTCIceCandidate(candidate);
  peers[from].addIceCandidate(inComingCandidate);
}

function createOfferUserBox(userSocketIdToAnswer, par) {
  const participantBox = document.querySelector(".participant-box");
  let participant = participantBox.querySelector(`.participant[data-id="${par.id}"]`);
  if (!participant) {
    participant = createParticipant(par, userSocketIdToAnswer);
    participant.dataset.socketId = userSocketIdToAnswer;
    participantBox.append(participant);
  }
  videoSocket.emit("answer user info", userSocketIdToAnswer, user);
}

function createAnswerUserBox(socketId, par) {
  const participantBox = document.querySelector(".participant-box");
  let participant = participantBox.querySelector(`.participant[data-id="${par.id}"]`);
  if (!participant) {
    participant = createParticipant(par);
    participant.dataset.socketId = socketId;
    participantBox.append(participant);
  }
}

function handleDisconnect(socketId) {
  peers[socketId].close();
  delete peers[socketId];
  const participantBox = document.querySelector(".participant-box");
  let participant = participantBox.querySelector(`.participant[data-socket-id="${socketId}"]`);
  participant.remove();
}

const streamTools = document.querySelector(".stream-tools");
const camera = streamTools.querySelector(".stream-camera");
camera.style.backgroundColor = "rgb(255, 255, 255)";
camera.children[0].style.color = "#454545";
currVideo.style.display = "block";
camera.addEventListener("mousedown", (e) => {
  const videoTrack = userStream.getTracks().find((track) => track.kind === "video");
  camera.style.backgroundColor =
    camera.style.backgroundColor === "rgb(255, 255, 255)" ? "#454545" : "#ffffff";
  camera.children[0].style.color =
    camera.children[0].style.color === "rgb(255, 255, 255)" ? "#454545" : "#ffffff";
  currVideo.style.display = currVideo.style.display === "block" ? "none" : "block";
  videoTrack.enabled = !videoTrack.enabled;

  if (currVideo.style.display === "none") {
    videoSocket.emit("hide cam", channelId);
  } else {
    videoSocket.emit("show cam", channelId);
  }
});

const voice = streamTools.querySelector(".stream-voice");
voice.style.backgroundColor = "rgb(255, 255, 255)";
currVideo.style.display = "block";
voice.children[0].style.color = "#454545";
voice.addEventListener("mousedown", (e) => {
  const audioTrack = userStream.getTracks().find((track) => track.kind === "audio");
  audioTrack.enabled = !audioTrack.enabled;

  voice.style.backgroundColor =
    voice.style.backgroundColor === "rgb(255, 255, 255)" ? "#454545" : "#ffffff";
  voice.children[0].style.color =
    voice.children[0].style.color === "rgb(255, 255, 255)" ? "#454545" : "#ffffff";
});

function hideCam(socketId) {
  const participantBox = document.querySelector(".participant-box");
  let participant = participantBox.querySelector(`.participant[data-socket-id="${socketId}"]`);
  const video = participant.children[0];
  video.style.display = "none";
}

function showCam(socketId) {
  const participantBox = document.querySelector(".participant-box");
  let participant = participantBox.querySelector(`.participant[data-socket-id="${socketId}"]`);
  const video = participant.children[0];
  video.style.display = "block";
}

async function init() {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: {
      width: 600,
      height: 300,
    },
  });
  userStream = stream;
  currVideo.srcObject = stream;
  currVideo.style.display = "block";
  currVideo.muted = true;

  videoSocket.emit("user joined room", +channelId, +user.id);

  videoSocket.on("all other users", (otherUsers) => callOtherUsers(otherUsers, stream));

  videoSocket.on("connection offer", (payload) => handleReceiveOffer(payload, stream));

  videoSocket.on("connection answer", handleAnswer);

  videoSocket.on("ice-candidate", handleReceiveIce);

  videoSocket.on("offer user info", (userSocketIdToAnswer, user) =>
    createOfferUserBox(userSocketIdToAnswer, user)
  );

  videoSocket.on("answer user info", (socketId, user) => createAnswerUserBox(socketId, user));

  videoSocket.on("user disconnected", (userId) => handleDisconnect(userId));

  videoSocket.on("hide cam", (socketId) => hideCam(socketId));

  videoSocket.on("show cam", (socketId) => showCam(socketId));

  videoSocket.on("server is full", () => alert("chat is full"));
}

init();
