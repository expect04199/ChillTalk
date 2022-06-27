const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("roomId");
const channelId = urlParams.get("channelId");

const channelSocket = io.connect("http://localhost:3000/channel");
const roomSocket = io.connect("http://localhost:3000/room");

// user info
const user = JSON.parse(localStorage.getItem("info"));
const roomsData = JSON.parse(localStorage.getItem("rooms"));
const token = localStorage.getItem("token");

window.onload = async () => {
  // render room side bar
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
  channelSocket.emit("connect-room", channelId);
  roomSocket.emit("connect-room", roomsData);
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
      ? `url("${member.picture}")`
      : `url("https://s2.coinmarketcap.com/static/img/coins/200x200/14447.png")`;
    // user name
    let nameDiv = document.createElement("div");
    nameDiv.classList.add("member-user-name");
    nameDiv.innerHTML = member.name;
    // user online
    let onlineDiv = document.createElement("div");
    onlineDiv.classList.add("member-user-online");
    onlineDiv.style.backgroundColor = member.online ? "#00EE00" : "#CD0000";
    let blackCircle = document.createElement("div");
    blackCircle.classList.add("black-circle");

    // append userId on memberDiv
    memberDiv.dataset.id = member.id;
    memberDiv.append(onlineDiv, blackCircle, thumbnailDiv, nameDiv);
    membersDiv.append(memberDiv);
  });

  // render channel-name
  let channelName = document.querySelector(".channel-name");
  let nextPage;
  let prevPage;
  channelName.innerHTML = channels.find((channel) => (channel.id = channelId)).name;
  // render messages
  let result = await (
    await fetch(`/api/messages?channelId=${channelId}&userId=${user.id}`, {
      method: "GET",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
  ).json();
  nextPage = result.next_paging;
  prevPage = result.prev_paging;
  let messages = result.messages;
  let messagesDiv = document.querySelector(".messages");
  messages.forEach((message) => {
    let messageDiv = createMessage(message, document);
    if (messageDiv) {
      messagesDiv.append(messageDiv);
    }
  });

  // when user scroll messages to top, show oldest content
  let nextOptions = {
    rootMargin: "0px",
    threshold: 1,
  };

  const nextCallback = async (entries, observer) => {
    for (let entry of entries) {
      if (!entry.isIntersecting || !nextPage) return;
      let result = await (
        await fetch(`/api/messages?channelId=${channelId}&paging=${nextPage}`, {
          method: "GET",
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })
      ).json();
      nextPage = result.next_paging;
      const messages = result.messages;
      let tempDiv = document.createElement("div");
      messages.forEach((message) => {
        let messageDiv = createMessage(message, tempDiv);
        if (messageDiv) {
          tempDiv.appendChild(messageDiv);
        }
      });
      let length = tempDiv.childNodes.length;
      for (let i = length; i > 0; i--) {
        messagesDiv.prepend(tempDiv.childNodes[i - 1]);
      }

      observer.unobserve(entry.target);
      if (entry.target === messagesDiv.querySelectorAll(".message-description")[0]) return;
    }

    observer.observe(messagesDiv.querySelectorAll(".message-description")[0]);
  };

  const nextObserver = new IntersectionObserver(nextCallback, nextOptions);
  const firstDesc = document.querySelectorAll(".message-description");
  if (firstDesc[0] && nextPage) {
    nextObserver.observe(firstDesc[0]);
  }

  // when user scroll messages to bottom, show latest content
  let prevOptions = {
    rootMargin: "0px",
    threshold: 1,
  };

  const prevCallback = async (entries, observer) => {
    for (let entry of entries) {
      if (!entry.isIntersecting || !prevPage) return;
      let result = await (
        await fetch(`/api/messages?channelId=${channelId}&paging=${prevPage}`, {
          method: "GET",
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })
      ).json();
      prevPage = result.prev_paging;
      const messages = result.messages;
      let tempDiv = document.createElement("div");
      // messages.forEach((message) => {
      //   let messageDiv = createMessage(message, tempDiv);
      //   if (messageDiv) {
      //     tempDiv.appendChild(messageDiv);
      //   }
      // });

      for (let message of messages) {
        let messageDiv = createMessage(message, tempDiv);
        if (messageDiv) {
          tempDiv.appendChild(messageDiv);
          if (message.id === 40) {
            console.log(messageDiv);
            console.log(tempDiv);
          }
        }
      }

      let length = tempDiv.children.length;
      for (let i = 0; i < length; i++) {
        messagesDiv.append(tempDiv.children[i]);
      }

      observer.unobserve(entry.target);
      let descs = messagesDiv.querySelectorAll(".message-description");
      if (entry.target === descs[descs.length - 1]) return;
    }
    let descs = messagesDiv.querySelectorAll(".message-description");
    observer.observe(descs[descs.length - 1]);
  };
  // messagesDiv.scrollTop = messagesDiv.scrollHeight - messagesDiv.clientHeight;

  const prevObserver = new IntersectionObserver(prevCallback, prevOptions);
  const lastDesc = document.querySelectorAll(".message-description");
  if (lastDesc[lastDesc.length - 1] && prevPage) {
    prevObserver.observe(lastDesc[lastDesc.length - 1]);
  }

  // let div = document.querySelector(".message-description[data-message-id='130']");

  // let x = div.offsetParent.offsetTop + div.offsetTop;
  // div.scrollIntoView({ behavior: "smooth", block: "center" });
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
document.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && e.target.value !== "" && e.target.classList.contains("enter-message")) {
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
    let enterReply = document.querySelector(".enter-reply");
    if (enterReply) {
      message.reply = {
        id: enterReply.dataset.replyId,
        name: enterReply.dataset.replyName,
        description: enterReply.dataset.replyDescription,
        picture: enterReply.dataset.replyPicture,
      };
      document.querySelector(".message-box").removeChild(enterReply);
    }
    let messagesDiv = document.querySelector(".messages");
    let messageDiv = createMessage(message, document);
    if (messageDiv) {
      messagesDiv.append(messageDiv);
    }
    e.target.value = "";

    // send message to other people
    if (message.reply) {
      message.reply = message.reply.id;
    }
    channelSocket.emit("message", message);
    messagesDiv.scrollTop = messagesDiv.scrollHeight - messagesDiv.clientHeight;
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
    roomSocket.emit("connect-room", [roomData.id]);
    window.location.href = `/room.html?roomId=${roomData.id}&channelId=${roomData.channel_id}`;
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
maskDiv.addEventListener("click", (e) => {
  if (e.target.classList.contains("mask")) {
    e.target.innerHTML = "";
    e.target.classList.remove("enable");
  }
});

// when user sign in, call server to update status
if (document.referrer.includes("signin.html")) {
  roomSocket.emit("self-signin", { userId: user.id, rooms: roomsData });
}

// when click channel pin message, render pin message box
let pin = document.querySelector(".room-pin");
pin.addEventListener("click", async (e) => {
  if (e.target.classList.contains("thumbtack")) {
    e.target.classList.toggle("tool-enable");
    let pinDiv = e.target.parentElement;
    let pinMessagesBox = pinDiv.querySelector(".pin-messages-box");
    if (!pinMessagesBox) {
      let data = await (
        await fetch(`/api/channels/details?channelId=${channelId}&pinned=true`)
      ).json();
      let messages = data.messages;

      // create pin messages box
      pinMessagesBox = document.createElement("div");
      pinMessagesBox.classList.add("pin-messages-box");
      pinDiv.append(pinMessagesBox);

      // create pin headline
      let pinHeadline = document.createElement("div");
      pinHeadline.classList.add("pin-box-headline");
      pinHeadline.innerHTML = messages ? "已釘選的訊息" : "目前暫無釘選訊息";

      // create messages
      let pinMessages = document.createElement("div");
      pinMessages.classList.add("pin-messages");

      pinMessagesBox.append(pinHeadline, pinMessages);

      if (!messages) {
        return;
      }
      // create message boxes
      messages.forEach((message) => {
        let pinMessageBox = createPinMessage(message);
        pinMessages.append(pinMessageBox);
      });
    } else {
      pinMessagesBox.remove();
    }
  }
});

// when click search box, show search options
let search = document.querySelector(".room-search input#search");
search.addEventListener("focusin", expandSearch);

function expandSearch(e) {
  e.stopPropagation();
  let searchInput = document.querySelector(".room-search input");
  searchInput.style.outline = "none";
  searchInput.style.transition = "width 0.3s";
  searchInput.style.width = "250px";

  // create search options div
  let searchOptionsDiv = document.createElement("div");
  searchOptionsDiv.classList.add("search-options");
  searchOptionsDiv.innerHTML = `
    <ul>
      <li class="from-user-name"><p>從：使用者</p><input type="text" placeholder="輸入名稱"/></li>
      <li class="in-channel"><p>在：頻道</p><input type="text" placeholder="輸入名稱"/></li>
      <li class="message-pinned"><p>已釘選</p></li>
    </ul>
  `;
  e.target.parentElement.appendChild(searchOptionsDiv);
  search = document.querySelector(".room-search input");
  search.focus();

  // add event listeners
  let pin = document.querySelector(".message-pinned");
  pin.style.cursor = "pointer";
  pin.addEventListener("click", (e) => {
    pin.querySelector("p").classList.toggle("red");
  });
}

document.addEventListener("click", shrinkSearch);
function shrinkSearch(e) {
  e.stopPropagation();
  let roomSearch = document.querySelector(".room-search");
  if (document.querySelector(".search-messages-box")) {
    document.querySelector(".search-messages-box").remove();
  }
  if (roomSearch.contains(e.target)) {
    return;
  }
  let searchInput = document.querySelector(".room-search input");
  searchInput.style.transition = "width 0.3s";
  searchInput.style.width = "100px";
  searchInput.value = "";
  if (document.querySelector(".search-options")) {
    document.querySelector(".search-options").remove();
  }
  document.removeEventListener("click", this);
}

// when enter search params, show result
document.addEventListener("keypress", async (e) => {
  let roomSearchInput = document.querySelector(".room-search input");
  if (e.key === "Enter" && roomSearchInput.parentElement.contains(e.target)) {
    let searchOptions = document.querySelector(".search-options");
    let fromUserInput = searchOptions.querySelector(".from-user-name input");
    let inChannelInput = searchOptions.querySelector(".in-channel input");
    let messagePinned = searchOptions.querySelector(".message-pinned p");
    if (document.querySelector(".search-options")) {
      document.querySelector(".search-options").remove();
    }
    let fromUser = fromUserInput.value;
    let inChannel = inChannelInput.value;
    let isPinned = messagePinned.classList.contains("red");
    let content = roomSearchInput.value;
    let data = await (
      await fetch(
        `/api/rooms/search?room_id=${roomId}&from_user=${fromUser}&channel_name=${inChannel}&pinned=${isPinned}&content=${content}`
      )
    ).json();
    let messages = data.messages;

    // create pin messages box
    let searchMessagesBox = document.createElement("div");
    searchMessagesBox.classList.add("search-messages-box");
    roomSearchInput.parentElement.append(searchMessagesBox);

    // create pin headline
    let searchHeadline = document.createElement("div");
    searchHeadline.classList.add("search-box-headline");
    searchHeadline.innerHTML = "搜尋結果";

    // create messages
    let searchMessages = document.createElement("div");
    searchMessages.classList.add("search-messages");

    searchMessagesBox.append(searchHeadline, searchMessages);
    if (!messages) {
      return;
    }
    // create message boxes
    messages.forEach((message) => {
      let searchMessageBox = createSearchMessage(message);
      searchMessages.append(searchMessageBox);
    });
  }
});

// when other people signin, update status
roomSocket.on("other-signin", (userId) => {
  let membersDiv = document.querySelectorAll(".member");
  membersDiv.forEach((memberDiv) => {
    if (+memberDiv.dataset.id === +userId) {
      memberDiv.querySelector(".member-user-online").style.backgroundColor = "#00EE00";
    }
  });
});

// when other people signout, update status
roomSocket.on("other-signout", (userId) => {
  let membersDiv = document.querySelectorAll(".member");
  membersDiv.forEach((memberDiv) => {
    if (+memberDiv.dataset.id === +userId) {
      memberDiv.querySelector(".member-user-online").style.backgroundColor = "#CD0000";
    }
  });
});

// listen to other people's message
channelSocket.on("message", (message) => {
  if (message.userId !== user.id) {
    let messagesDiv = document.querySelector(".messages");
    let messageDiv = createMessage(message, document);
    if (messageDiv) {
      messagesDiv.append(messageDiv);
    }
    messagesDiv.scrollTop = messagesDiv.scrollHeight - messagesDiv.clientHeight;
  } else {
    let descriptions = document.querySelectorAll(".message-description");
    descriptions.forEach((description) => {
      if (description.dataset.messageId === "undefined") {
        description.dataset.messageId = message.id;
      }
    });
  }
});

// listen to other people update message
channelSocket.on("update-message", (data) => {
  let descriptions = document.querySelectorAll(".message-description");
  descriptions.forEach((description) => {
    if (+description.dataset.messageId === +data.id) {
      description.querySelector("p").innerHTML = data.description;
      if (description.innerHTML.indexOf("(已編輯)") === -1) {
        let small = document.createElement("small");
        small.innerHTML = "(已編輯)";
        description.appendChild(small);
      }
    }
  });
});

// listen to other people delete message
channelSocket.on("delete-message", (messageId) => {
  let description = document.querySelector(`.message-description[data-message-id="${messageId}"]`);
  let messageDiv = description.parentElement.parentElement;
  if (messageDiv.querySelectorAll(".message-description").length === 1) {
    messageDiv.remove();
  } else {
    description.remove();
  }
});

// listen to other people pin message
channelSocket.on("pin-message", (messageId) => {
  let description = document.querySelector(`.message-description[data-message-id="${messageId}"]`);
  let pin = description.querySelector(".thumbtack");
  pin.classList.add("red");
});

channelSocket.on("unpin-message", (messageId) => {
  let description = document.querySelector(`.message-description[data-message-id="${messageId}"]`);
  let pin = description.querySelector(".thumbtack");
  pin.classList.remove("red");
});

// listen to thumbs up
channelSocket.on("thumbs-up", (messageId) => {
  let description = document.querySelector(`.message-description[data-message-id="${messageId}"]`);
  let thumbsUpDiv = description.querySelector(".thumbs-up");
  if (!thumbsUpDiv) {
    thumbsUpDiv = document.createElement("div");
    thumbsUpDiv.classList.add("thumbs-up");
    let thumbsUpEmoji = document.createElement("div");
    thumbsUpEmoji.classList.add("thumbs-up-emoji");
    thumbsUpEmoji.innerHTML = `&#128077; 1`;
    thumbsUpDiv.append(thumbsUpEmoji);
    description.append(thumbsUpDiv);
  } else {
    let thumbsUpEmoji = thumbsUpDiv.querySelector(".thumbs-up-emoji");
    let count = +thumbsUpEmoji.innerHTML.slice(2);
    count++;
    thumbsUpEmoji.innerHTML = `&#128077; ${count}`;
  }
});

channelSocket.on("not-thumbs-up", (messageId) => {
  let description = document.querySelector(`.message-description[data-message-id="${messageId}"]`);
  let thumbsUpDiv = description.querySelector(".thumbs-up");
  let thumbsUpEmoji = description.querySelector(".thumbs-up-emoji");
  let count = +thumbsUpEmoji.innerHTML.slice(2);
  if (count > 1) {
    count--;
    thumbsUpEmoji.innerHTML = `&#128077; ${count}`;
  } else {
    thumbsUpDiv.remove();
  }
});

// disconnect socket when leave page
window.addEventListener("beforeunload", async () => {
  channelSocket.close();
  roomSocket.close();
  let descriptions = document.querySelectorAll(".message-description");
  if (!descriptions) return;
  let latestId = descriptions[descriptions.length - 1].dataset.messageId;
  currentId = latestId;
  let body = {
    user_id: user.id,
    room_id: roomId,
    channel_id: channelId,
    message_id: latestId,
  };

  // await fetch("/api/messages/read", {
  //   method: "POST",
  //   body: JSON.stringify(body),
  //   headers: {
  //     "content-type": "application/json",
  //     Authorization: `Bearer ${token}`,
  //   },
  //   keepalive: true,
  // });
});

// log out button
let singOutDiv = document.querySelector(".sign-out");
singOutDiv.addEventListener("click", (e) => {
  localStorage.clear();
  roomSocket.emit("self-signout", { userId: user.id, rooms: roomsData });
  window.location.href = "/signin.html";
});

function createMessage(message, scope) {
  //if previous message is same name and sent in two minutes, append
  let latestMessage = scope.querySelectorAll(".message");
  latestMessage = latestMessage ? latestMessage[latestMessage.length - 1] : null;
  if (
    latestMessage &&
    message.name === latestMessage.dataset.name &&
    message.time < +latestMessage.dataset.time + 3000 &&
    !message.reply
  ) {
    let descDiv = document.createElement("div");
    descDiv.classList.add("message-description");
    descDiv.dataset.messageId = message.id;
    descDiv.dataset.name = message.name;
    descDiv.dataset.pinned = +message.pinned || 0;
    let content = document.createElement("p");
    content.innerHTML = message.description;
    descDiv.append(content);
    latestMessage.querySelector(".message-text").append(descDiv);
    if (message.is_edited) {
      content.dataset.isEdit = true;
      if (descDiv.innerHTML.indexOf("(已編輯)") === -1) {
        let small = document.createElement("small");
        small.innerHTML = "(已編輯)";
        descDiv.appendChild(small);
      }
    }

    if (message.thumbs) {
      thumbsUpDiv = document.createElement("div");
      thumbsUpDiv.classList.add("thumbs-up");
      let thumbsUpEmoji = document.createElement("div");
      thumbsUpEmoji.classList.add("thumbs-up-emoji");
      thumbsUpEmoji.innerHTML = `&#128077; ${message.thumbs.length}`;
      thumbsUpDiv.append(thumbsUpEmoji);
      descDiv.append(thumbsUpDiv);
      if (message.thumbs.includes(user.id)) {
        descDiv.dataset.isLiked = 1;
      }
    }

    enableMessageOptions(descDiv);
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

  // if message reply to some message, add reply div
  if (message.reply) {
    let reply = message.reply;
    textBox.innerHTML += `
    <div class="reply-to">
      <div class="reply-thumbnail"></div>
      <div class="reply-name">${reply.name}</div>
      <div class="reply-description">${reply.description}</div>
    </div>
    `;
    let replyThumbnail = textBox.querySelector(".reply-thumbnail");
    replyThumbnail.style.backgroundImage = `url("${reply.picture}")`;
    thumbnail.classList.add("reply");
  }

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
  description.dataset.messageId = message.id || -1;
  description.dataset.name = message.name;
  description.dataset.pinned = +message.pinned || 0;
  let content = document.createElement("p");
  content.innerHTML = message.description;
  description.append(content);
  if (message.is_edited) {
    content.dataset.isEdit = true;
    if (description.innerHTML.indexOf("(已編輯)") === -1) {
      let small = document.createElement("small");
      small.innerHTML = "(已編輯)";
      description.appendChild(small);
    }
  }
  if (message.thumbs) {
    thumbsUpDiv = document.createElement("div");
    thumbsUpDiv.classList.add("thumbs-up");
    let thumbsUpEmoji = document.createElement("div");
    thumbsUpEmoji.classList.add("thumbs-up-emoji");
    thumbsUpEmoji.innerHTML = `&#128077; ${message.thumbs.length}`;
    thumbsUpDiv.append(thumbsUpEmoji);
    description.append(thumbsUpDiv);
    if (message.thumbs.includes(user.id)) {
      description.dataset.isLiked = 1;
    }
  }
  textBox.append(infoBox, description);
  messageDiv.append(thumbnailBox, textBox);
  enableMessageOptions(description);

  return messageDiv;
}

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

function readURL(input, preview) {
  if (input.files && input.files[0]) {
    let reader = new FileReader();
    reader.onload = function (e) {
      document.querySelector(preview).style.backgroundImage = "url(" + e.target.result + ")";
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function enableMessageOptions(description) {
  let optionList = document.createElement("ul");
  optionList.classList.add("message-options");

  let thumbsUp = document.createElement("li");
  thumbsUp.classList.add("message-thumbs");
  thumbsUp.innerHTML = `<i class="thumbs up icon"></i>`;
  if (+description.dataset.isLiked) {
    thumbsUp.children[0].classList.add("yellow");
  }
  thumbsUp.addEventListener("click", showThumbsUp);

  let edit = document.createElement("li");
  edit.classList.add("message-edit");
  edit.innerHTML = `<i class="pencil alternate icon">`;
  edit.addEventListener("click", editMessage);

  let pin = document.createElement("li");
  pin.classList.add("message-pin");
  if (+description.dataset.pinned) {
    pin.innerHTML = `<i class="thumbtack icon red">`;
  } else {
    pin.innerHTML = `<i class="thumbtack icon">`;
  }
  pin.addEventListener("click", pinMessage);

  let reply = document.createElement("li");
  reply.classList.add("message-reply");
  reply.innerHTML = `<i class="reply icon">`;
  reply.addEventListener("click", replyMessage);

  let unread = document.createElement("li");
  unread.classList.add("message-unread");
  unread.innerHTML = `<i class="eraser icon">`;

  let del = document.createElement("li");
  del.classList.add("message-delete");
  del.innerHTML = `<i class="trash alternate icon">`;
  del.addEventListener("click", deletedescription);

  let postUserName = description.dataset.name;
  if (postUserName === user.name) {
    optionList.append(thumbsUp, edit, pin, reply, unread, del);
  } else {
    optionList.append(thumbsUp, pin, reply, unread);
  }

  description.append(optionList);

  async function showThumbsUp(e) {
    e.stopPropagation();
    let messageId = description.dataset.messageId;
    if (e.target.classList.contains("up")) {
      if (!e.target.classList.contains("yellow")) {
        e.target.classList.add("yellow");
        let thumbsUpDiv = description.querySelector(".thumbs-up");
        let body = {
          user_id: user.id,
          message_id: messageId,
        };
        await (
          await fetch("/api/messages/thumbs-up", {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
              "content-type": "application/json",
            },
          })
        ).json();
        if (!thumbsUpDiv) {
          thumbsUpDiv = document.createElement("div");
          thumbsUpDiv.classList.add("thumbs-up");
          let thumbsUpEmoji = document.createElement("div");
          thumbsUpEmoji.classList.add("thumbs-up-emoji");
          thumbsUpEmoji.innerHTML = `&#128077; 1`;
          thumbsUpDiv.append(thumbsUpEmoji);
          description.append(thumbsUpDiv);
        } else {
          let thumbsUpEmoji = thumbsUpDiv.querySelector(".thumbs-up-emoji");
          let count = +thumbsUpEmoji.innerHTML.slice(2);
          count++;
          thumbsUpEmoji.innerHTML = `&#128077; ${count}`;
        }
        channelSocket.emit("thumbs-up", { channelId, messageId });
      } else {
        e.target.classList.remove("yellow");
        let thumbsUpDiv = description.querySelector(".thumbs-up");
        let body = {
          user_id: user.id,
          message_id: description.dataset.messageId,
        };
        await (
          await fetch("/api/messages/thumbs-up", {
            method: "delete",
            body: JSON.stringify(body),
            headers: {
              "content-type": "application/json",
            },
          })
        ).json();
        let thumbsUpEmoji = thumbsUpDiv.querySelector(".thumbs-up-emoji");
        let count = +thumbsUpEmoji.innerHTML.slice(2);
        if (count > 1) {
          count--;
          thumbsUpEmoji.innerHTML = `&#128077; ${count}`;
        } else {
          thumbsUpDiv.remove();
        }
        channelSocket.emit("not-thumbs-up", { channelId, messageId });
      }
    }
  }

  async function deletedescription(e) {
    if (e.target.classList.contains("trash")) {
      e.stopPropagation();
      let messageDiv = description.parentElement.parentElement;

      if (messageDiv.querySelectorAll(".message-description").length === 1) {
        messageDiv.remove();
      } else {
        description.remove();
      }

      await fetch("/api/messages/delete", {
        method: "POST",
        body: JSON.stringify({ message_id: description.dataset.messageId }),
        headers: {
          "content-type": "application/json",
        },
      });
      let data = {
        messageId: description.dataset.messageId,
        channelId,
      };
      channelSocket.emit("delete-message", data);
    }
  }

  let content = description.querySelector("p");
  let current;
  async function editMessage(e) {
    e.stopPropagation();
    if (content.isContentEditable === true) {
      return;
    }
    content.setAttribute("contentEditable", true);
    content.focus();
    content.addEventListener("focusout", editFocusOut);

    current = content.innerHTML;
  }

  async function editFocusOut(e) {
    if (e.target.innerHTML === "") {
      e.target.innerHTML = current;
      return;
    }
    if (e.target.innerHTML !== current) {
      let body = {
        message_id: description.dataset.messageId,
        type: "text",
        description: e.target.innerHTML,
      };
      await fetch("/api/messages/update", {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "content-type": "application/json",
        },
      });
      e.target.dataset.isEdit = true;
      channelSocket.emit("update-message", {
        id: +description.dataset.messageId,
        channelId: channelId,
        description: e.target.innerHTML,
      });
    }
    e.target.setAttribute("contentEditable", false);
    e.target.removeEventListener("focusout", editFocusOut);
    if (
      e.target.parentElement.innerHTML.indexOf("(已編輯)") === -1 &&
      e.target.innerHTML !== current
    ) {
      let small = document.createElement("small");
      small.innerHTML = "(已編輯)";
      e.target.parentElement.appendChild(small);
    }
    return;
  }

  async function replyMessage(e) {
    if (document.querySelector(".enter-reply")) {
      return;
    }
    if (e.target.classList.contains("reply")) {
      e.stopPropagation();
      const messageDiv = description.parentElement.parentElement;
      let messageBox = document.querySelector(".message-box");
      let replyName = description.dataset.name;
      let messageId = description.dataset.messageId;
      let replyDesc = description.querySelector("p").textContent;
      let replyPic = messageDiv.querySelector(".message-user-thumbnail").style.backgroundImage;
      replyPic = replyPic.slice(5, replyPic.length - 2);
      messageBox.innerHTML += `
      <div class="enter-reply" data-reply-id="${messageId}" data-reply-name="${replyName}" data-reply-description="${replyDesc}" data-reply-picture="${replyPic}">
        <p>回覆 ${replyName}</p>
        <div class="reply-cancel">取消</div>
      </div>
      `;
      let cancel = document.querySelector(".reply-cancel");
      cancel.addEventListener("click", (e) => {
        e.target.parentElement.remove();
      });
    }
  }

  async function pinMessage(e) {
    if (e.target.classList.contains("thumbtack")) {
      let messageId = description.dataset.messageId;
      if (e.target.classList.contains("red")) {
        e.target.classList.remove("red");
        channelSocket.emit("unpin-message", { messageId, channelId });
        await fetch("/api/messages/unpin", {
          method: "POST",
          body: JSON.stringify({ message_id: messageId }),
          headers: {
            "content-type": "application/json",
          },
        });
      } else {
        e.target.classList.add("red");
        channelSocket.emit("pin-message", { messageId, channelId });
        await fetch("/api/messages/pin", {
          method: "POST",
          body: JSON.stringify({ message_id: messageId }),
          headers: {
            "content-type": "application/json",
          },
        });
      }
    }
  }
}

function createPinMessage(message) {
  // create message box
  let pinMessage = document.createElement("div");
  pinMessage.classList.add("pin-message-box");

  // create thumbnail box
  let thumbnail = document.createElement("div");
  thumbnail.classList.add("pin-thumbnail");
  thumbnail.style.backgroundImage = `url("${message.picture}")`;

  // create info box
  let info = document.createElement("div");
  info.classList.add("pin-info");

  // create name
  let name = document.createElement("div");
  name.classList.add("pin-name");
  name.innerHTML = message.name;

  // create time
  let time = document.createElement("div");
  time.classList.add("pin-time");
  time.innerHTML = timeTransform(message.time);

  info.append(name, time);

  // create description
  let description = document.createElement("div");
  description.classList.add("pin-description");
  description.innerHTML = message.description;

  pinMessage.append(thumbnail, info, description);
  return pinMessage;
}

function createSearchMessage(message) {
  // create message box
  let searchMessage = document.createElement("div");
  searchMessage.classList.add("search-message-box");

  // create thumbnail box
  let thumbnail = document.createElement("div");
  thumbnail.classList.add("search-thumbnail");
  thumbnail.style.backgroundImage = `url("${message.picture}")`;

  // create info box
  let info = document.createElement("div");
  info.classList.add("search-info");

  // create name
  let name = document.createElement("div");
  name.classList.add("search-name");
  name.innerHTML = message.name;

  // create time
  let time = document.createElement("div");
  time.classList.add("search-time");
  time.innerHTML = timeTransform(message.time);

  info.append(name, time);

  // create description
  let description = document.createElement("div");
  description.classList.add("search-description");
  description.innerHTML = message.description;

  searchMessage.append(thumbnail, info, description);
  return searchMessage;
}
