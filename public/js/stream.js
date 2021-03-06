if (!localStorage.length) {
  window.location.href = "/signin.html";
}
const urlParams = new URLSearchParams(window.location.search);
const roomId = +urlParams.get("roomId");
const channelId = +urlParams.get("channelId");

const roomSocket = io.connect("http://localhost:3000/room");
const camSocket = io.connect("http://localhost:3000/cam");

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
    if (channel.type === "text") {
      channelDiv.innerHTML = "<i class='hashtag icon'></i> " + channel.name;
    } else {
      channelDiv.innerHTML = "<i class='volume up icon'></i> " + channel.name;
    }
    channelDiv.dataset.channelId = channel.id;
    channelDiv.dataset.channelType = channel.type;
    channelDiv.addEventListener("click", (e) => {
      if (e.target.dataset.channelId === channelId) return;
      if (e.target.dataset.channelType === "text") {
        window.location.href = `/room.html?roomId=${roomId}&channelId=${e.target.dataset.channelId}`;
      } else if (e.target.dataset.channelType === "voice") {
        window.location.href = `/stream.html?roomId=${roomId}&channelId=${e.target.dataset.channelId}`;
      }
    });
    channelsDiv.append(channelDiv);
  });
  // render host info
  document.querySelector(".host-thumbnail").style.backgroundImage = `url("${user.picture}")`;
  document.querySelector(".host-online").style.backgroundColor = user.online ? "#00EE00" : "#8E8E8E";
  document.querySelector(".host-name").innerHTML = user.name;
  let hostSetting = document.querySelector(".host-setting");
  hostSetting.addEventListener("click", (e) => {
    if (e.target.classList.contains("cog")) {
      let mask = document.querySelector(".mask");
      mask.classList.add("enable");
      mask.innerHTML += `
      <div class="edit-host-info">
        <div class="edit-host-headline">??????????????????</div>
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
          placeholder="?????????"
        ></textarea>
        <button class="edit-host-btn">??????</button>
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
      editName.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
        }
      });
      let userIntroduction = mask.querySelector(".edit-host-introduction");
      userIntroduction.innerHTML = user.introduction;

      let saveBtn = mask.querySelector(".edit-host-btn");
      saveBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        if (e.target.innerHTML !== "??????") return;
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
        body.append("original_picture", user.picture);
        body.append("original_background", user.background);
        e.target.innerHTML = `<div class="ui active small inline loader"></div>`;
        let userData = await (
          await fetch("/api/users/info", {
            method: "PATCH",
            body,
            headers: { Authorization: `Bearer ${token}` },
          })
        ).json();
        if (userData.error) {
          e.target.innerHTML = `??????`;
          alert(userData.error);
          return;
        }
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
    let room = roomsData.find((room) => +room.id === +roomId);

    mask.classList.add("enable");
    mask.innerHTML = `
    <div class="edit-room-box">
      <h2>????????????</h2>
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
      <input type="text" class="edit-room-name" maxlength="15"/>
      <button class="save-room-btn">??????</button>
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
      if (e.target.innerHTML !== "??????") return;
      e.preventDefault();
      let body = new FormData();
      body.append("id", +room.id);
      let newName = nameInput.value;
      if (picInput.files[0]) {
        body.append("picture", picInput.files[0]);
      }
      if (newName !== room.name) {
        body.append("name", newName);
      }
      body.append("original_name", room.name);
      body.append("original_picture", room.picture);
      e.target.innerHTML = `<div class="ui active inline loader"></div>`;
      let roomInfo = await (
        await fetch("/api/rooms/info", {
          method: "PATCH",
          body,
          headers: { Authorization: `Bearer ${token}` },
        })
      ).json();
      if (roomInfo.error) {
        e.target.innerHTML = "??????";
        alert(roomInfo.error);
        return;
      }
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
  channelName.innerHTML = "<i class='volume up icon'></i> " + channels.find((channel) => +channel.id === +channelId).name;
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
    <h2>????????????</h2>
    <h3>????????????????????????????????????</h3>
    <div class="avatar-upload">
      <div class="avatar-edit">
        <input type="file" id="room-image-upload" accept=".png, .jpg, .jpeg" />
        <label for="room-image-upload"><i class="plus icon"></i></label>
      </div>
      <div class="avatar-preview">
        <div id="room-image-preview"></div>
      </div>
    </div>
    <input type="text" class="create-room-name" placeholder="??????????????????" />
    <button class="create-room-btn">????????????</button>
    <p>??? ????????????</p>
    </div>
    <div class="join-exist-room">
      <h2>????????????</h2>
      <h3>??????????????????????????????</h3>
      <input type="text" class="join-room-id" placeholder="????????????ID" value="" />
      <button class="join-room-btn">????????????</button>
      <p>??????</p>
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
    if (e.target.innerHTML !== "????????????") return;
    let name = createRoomName.value;
    name = name.replaceAll(" ", "");
    if (name === "") {
      alert("?????????????????????");
      return;
    }
    let userId = user.id;
    let body = new FormData();
    let imageInput = roomImage;
    if (imageInput.files[0]) {
      body.append("picture", imageInput.files[0]);
    }
    body.append("room_name", name);
    body.append("user_id", userId);
    e.target.innerHTML = `
    <div class="ui active inline loader"></div>
    `;
    let roomData = await (
      await fetch("/api/rooms/create", {
        method: "POST",
        body,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    ).json();
    if (roomData.error) {
      e.target.innerHTML = `????????????`;
      alert(roomData.error);
      return;
    }
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
    if (existRoomId.value === "" || e.target.innerHTML !== "????????????") return;
    let roomId = existRoomId.value;
    let userId = user.id;
    let body = {
      room_id: +roomId,
      user_id: userId,
    };
    e.target.innerHTML = `
    <div class="ui active inline loader"></div>
    `;
    let roomData = await (
      await fetch("/api/rooms/join", {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
    ).json();
    if (roomData.error) {
      e.target.innerHTML = "????????????";
      alert(roomData.error);
      return;
    }
    updateStorage("room", roomData);
    roomSocket.emit("join-room", { roomId: roomData.id, user });
    window.location.href = `/room.html?roomId=${roomData.id}`;
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
      <h3>????????????</h3>
    </div>
    <div class="create-text-channel">
      <i class="hashtag icon"></i>
      <h3>Text</h3>
      <h4>?????????????????????</h4>
    </div>
    <div class="create-voice-channel">
      <i class="volume up icon"></i>
      <h3>Voice</h3>
      <h4>??????????????????????????????????????????</h4>
    </div>
    <input type="text" class="create-channel-name" placeholder="?????????????????????" maxlength="20"/>
    <button type="button" class="create-channel-btn" data-type="text">????????????</button>
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
    if (createChannelInput.value !== "" && roomId && e.target.innerHTML === "????????????") {
      let channelType = e.target.dataset.type;
      let channelName = createChannelInput.value;
      let data = {
        channel_type: channelType,
        channel_name: channelName,
        room_id: roomId,
      };
      e.target.innerHTML = `
      <div class="ui active inline loader"></div>
      `;
      let channelDetail = await (
        await fetch("/api/channels", {
          method: "POST",
          body: JSON.stringify(data),
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })
      ).json();
      if (channelDetail.error) {
        e.target.innerHTML = "????????????";
        alert(channelDetail.error);
        return;
      }
      roomSocket.emit("create-channel", roomId, channelDetail);
      createChannelInput.value = "";
      maskDiv.classList.remove("enable");
      maskDiv.innerHTML = "";
      createChannelfn(channelDetail);
    } else {
      alert("?????????????????????");
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
      mailBoxHeadline.innerHTML = "?????????";

      let mailMessages = document.createElement("div");
      mailMessages.classList.add("mail-messages");
      mailMessagesBox.append(mailBoxHeadline, mailMessages);
      mail.append(mailMessagesBox);
      let nextPage = false;
      mailBoxHeadline.innerHTML += `<div class="ui active small inline loader"></div>`;

      let result = await (
        await fetch(`/api/messages/mail`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      ).json();
      mailBoxHeadline.innerHTML = "?????????";
      nextPage = result.next_paging;
      let messages = result.messages;
      if (messages.length !== 0) {
        function createMailChannel(message) {
          let mailChannel = document.createElement("div");
          mailChannel.classList.add("mail-channel");

          let mailChannelInfo = document.createElement("div");
          mailChannelInfo.classList.add("mail-channel-info");
          let roomThumbnail = document.createElement("div");
          roomThumbnail.classList.add("mail-room-thumbnail");
          roomThumbnail.style.backgroundImage = `url("${message.room_picture}"`;
          let mailChannelName = document.createElement("div");
          mailChannelName.classList.add("mail-channel-name");
          mailChannelName.innerHTML = message.channel_name;
          let mailRoomName = document.createElement("div");
          mailRoomName.classList.add("mail-room-name");
          mailRoomName.innerHTML = message.room_name || "";

          mailChannelInfo.append(roomThumbnail, mailChannelName, mailRoomName);
          mailChannel.append(mailChannelInfo);
          return mailChannel;
        }
        let channelId = messages[0].channel_id;
        let mailChannel = createMailChannel(messages[0]);
        mailMessages.append(mailChannel);

        messages.forEach((message) => {
          if (message.channel_id === channelId) {
            let messageBox = createMail(message);
            mailChannel.append(messageBox);
          } else {
            mailChannel = createMailChannel(message);
            channelId = message.channel_id;
            mailMessages.append(mailChannel);
            let messageBox = createMail(message);
            mailChannel.append(messageBox);
          }
        });
      }

      // when user scroll messages to bottom, show latest content
      let mailOptions = {
        rootMargin: "0px",
        threshold: 0.5,
      };

      const mailCallback = async (entries, observer) => {
        for (let entry of entries) {
          if (!entry.isIntersecting || !nextPage) return;
          let loader = document.createElement("div");
          loader.classList.add("ui", "active", "small", "inline", "loader");
          mailMessages.appendChild(loader);
          let result = await (
            await fetch(`/api/messages/mail?`, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
          ).json();
          loader.remove();
          if (!result.messages.length) return;
          nextPage = result.next_paging;
          let messages = result.messages;
          function createMailChannel(message) {
            let mailChannel = document.createElement("div");
            mailChannel.classList.add("mail-channel");

            let mailChannelInfo = document.createElement("div");
            mailChannelInfo.classList.add("mail-channel-info");
            let roomThumbnail = document.createElement("div");
            roomThumbnail.classList.add("mail-room-thumbnail");
            roomThumbnail.style.backgroundImage = `url("${message.room_picture}"`;
            let mailChannelName = document.createElement("div");
            mailChannelName.classList.add("mail-channel-name");
            mailChannelName.innerHTML = message.channel_name;
            let mailRoomName = document.createElement("div");
            mailRoomName.classList.add("mail-room-name");
            mailRoomName.innerHTML = message.room_name || "";

            mailChannelInfo.append(roomThumbnail, mailChannelName, mailRoomName);
            mailChannel.append(mailChannelInfo);
            return mailChannel;
          }
          let channelId = messages[0].channel_id;
          let mailChannel = createMailChannel(messages[0]);
          mailMessages.append(mailChannel);

          messages.forEach((message) => {
            if (+message.channel_id === +channelId) {
              let messageBox = createMail(message);
              mailChannel.append(messageBox);
            } else {
              mailChannel = createMailChannel(message);
              channelId = message.channel_id;
              mailMessages.append(mailChannel);
              let messageBox = createMail(message);
              mailChannel.append(messageBox);
            }
          });
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

// when not click mailbox, remove mailbox
document.addEventListener("mousedown", (e) => {
  let messagesBox = document.querySelector(".mail-messages-box");
  if (messagesBox && !messagesBox.contains(e.target) && !mail.contains(e.target)) {
    messagesBox.remove();
    document.querySelector(".tool-enable").classList.remove("tool-enable");
  }
});

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
  if (channel.type === "text") {
    channelDiv.innerHTML = "<i class='hashtag icon'></i> " + channel.name;
  } else {
    channelDiv.innerHTML = "<i class='volume up icon'></i> " + channel.name;
  }
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

// web rtc

// quit stream
let quit = document.querySelector(".stream-quit");
quit.addEventListener("click", (e) => {
  window.location.href = `/room.html?roomId=${roomId}`;
});

let peers = {};
let userStream;
const currParticipant = document.querySelector(`.participant[data-id="${user.id}"]`);
let currVideo = currParticipant.querySelector(".participant-video");

function callOtherUsers(otherUsers, stream) {
  otherUsers.forEach((userSocketIdToCall) => {
    camSocket.emit("offer user info", userSocketIdToCall, user);
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
  peer.onnegotiationneeded = () => (userSocketIdToCall ? handleNegotiationNeededEvent(peer, userSocketIdToCall) : null);
  peer.onicecandidate = handleICECandidateEvent;

  peer.ontrack = (e) => {
    let stream = e.streams[0];
    const participantBox = document.querySelector(".participant-box");
    let participant = participantBox.querySelector(`.participant[data-socket-id="${userSocketIdToCall}"]`);
    const video = participant.children[0];
    video.srcObject = stream;
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

  camSocket.emit("peer connection request", payload);
}

async function handleReceiveOffer({ sdp, callerId }, stream) {
  const peer = createPeer(callerId);
  peers[callerId] = peer;
  const desc = new RTCSessionDescription(sdp);
  await peer.setRemoteDescription(desc);

  stream.getTracks().forEach((track) => {
    peer.addTrack(track, stream);
  });

  let answer = await peer.createAnswer();
  let arr = answer.sdp.split("\r\n");
  arr.forEach((str, i) => {
    if (/^a=fmtp:\d*/.test(str)) {
      arr[i] = str + ";x-google-max-bitrate=10000;x-google-min-bitrate=0;x-google-start-bitrate=6000";
    } else if (/^a=mid:(1|video)/.test(str)) {
      arr[i] += "\r\nb=AS:10000";
    }
  });
  answer.sdp = arr.join("\r\n");
  await peer.setLocalDescription(answer);

  const payload = {
    userToAnswerTo: callerId,
    sdp: peer.localDescription,
  };
  camSocket.emit("connection answer", payload);
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
      camSocket.emit("ice-candidate", payload);
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
  camSocket.emit("answer user info", userSocketIdToAnswer, user);
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
  camera.style.backgroundColor = camera.style.backgroundColor === "rgb(255, 255, 255)" ? "#454545" : "#ffffff";
  camera.children[0].style.color = camera.children[0].style.color === "rgb(255, 255, 255)" ? "#454545" : "#ffffff";
  currVideo.style.display = currVideo.style.display === "block" ? "none" : "block";
  videoTrack.enabled = !videoTrack.enabled;

  if (currVideo.style.display === "none") {
    camSocket.emit("hide cam", channelId);
  } else {
    camSocket.emit("show cam", channelId);
  }
});

const voice = streamTools.querySelector(".stream-voice");
voice.style.backgroundColor = "rgb(255, 255, 255)";
currVideo.style.display = "block";
voice.children[0].style.color = "#454545";
voice.addEventListener("mousedown", (e) => {
  const audioTrack = userStream.getTracks().find((track) => track.kind === "audio");
  audioTrack.enabled = !audioTrack.enabled;

  voice.style.backgroundColor = voice.style.backgroundColor === "rgb(255, 255, 255)" ? "#454545" : "#ffffff";
  voice.children[0].style.color = voice.children[0].style.color === "rgb(255, 255, 255)" ? "#454545" : "#ffffff";
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
  document.querySelector(".main").srcObject = stream;
  document.querySelector(".main").muted = true;

  camSocket.emit("user joined room", +channelId, +user.id);

  camSocket.on("all other users", (otherUsers) => callOtherUsers(otherUsers, stream));

  camSocket.on("connection offer", (payload) => handleReceiveOffer(payload, stream));

  camSocket.on("connection answer", handleAnswer);

  camSocket.on("ice-candidate", handleReceiveIce);

  camSocket.on("offer user info", (userSocketIdToAnswer, user) => createOfferUserBox(userSocketIdToAnswer, user));

  camSocket.on("answer user info", (socketId, user) => createAnswerUserBox(socketId, user));

  camSocket.on("user disconnected", (userId) => handleDisconnect(userId));

  camSocket.on("hide cam", (socketId) => hideCam(socketId));

  camSocket.on("show cam", (socketId) => showCam(socketId));

  camSocket.on("server is full", () => alert("chat is full"));
}

init();

// disconnect socket when leave page
window.onbeforeunload = () => {
  peers = {};
  camSocket.close();
  roomSocket.close();
};
