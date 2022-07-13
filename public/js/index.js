if (!localStorage.length) {
  window.location.href = "/signin.html";
}
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("roomId");
const channelId = urlParams.get("channelId");
const friendName = urlParams.get("friend");

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
  // if (!roomId) return;

  channelSocket.emit("connect-room", channelId);
  roomSocket.emit("connect-room", roomsData);

  // render friend requests
  let data = await (
    await fetch("/api/friends/requests", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  ).json();
  let users = data.users;
  let pendingFriends = document.querySelector(".pending-friends");
  users.forEach((user) => {
    let requestDiv = createRequestFriend(user);
    pendingFriends.append(requestDiv);
  });

  // render friends
  let friendsData = await (
    await fetch("/api/friends", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  ).json();
  let friends = friendsData.friends;
  let friendsDiv = document.querySelector(".friends");
  friends.forEach((friend) => {
    let friendDiv = createFriend(friend);
    friendsDiv.append(friendDiv);
  });

  // render host info
  document.querySelector(".host-thumbnail").style.backgroundImage = `url("${user.picture}")`;
  document.querySelector(".host-online").style.backgroundColor = user.online
    ? "#00EE00"
    : "#8E8E8E";
  document.querySelector(".host-name").innerHTML = user.name;
  document.querySelector(".host-id").innerHTML += user.id;
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
        let name = editName.innerHTML;
        if (name.length > 20) {
          alert("名稱限制20個字元");
          return;
        }
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
        let userData = await (
          await fetch("/api/users/info", {
            method: "PATCH",
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

  if (!channelId) return;
  // render channel name
  document.querySelector(".channel-name").innerHTML = "<i class='hashtag icon'></i> " + friendName;

  let nextPage;
  let prevPage;
  let readSession;
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
  readSession = result.read_session || null;
  let messages = result.messages;
  let messagesDiv = document.querySelector(".messages");
  let sessions = createSession(messages);
  sessions.forEach((session) => {
    messagesDiv.append(session);
  });

  // when user scroll messages to top, show oldest content
  let nextOptions = {
    rootMargin: "0px 0px 0px 0px",
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
      let sessions = createSession(messages);
      let temp = messagesDiv.children[0];
      sessions.reverse().forEach((session) => {
        messagesDiv.prepend(session);
      });
      messagesDiv.scrollTop = temp.offsetTop - 15;
      observer.unobserve(entry.target);
    }
    if (!nextPage) return;
    observer.observe(messagesDiv.querySelectorAll(".message-description")[0]);
  };

  const nextObserver = new IntersectionObserver(nextCallback, nextOptions);
  const firstDesc = document.querySelectorAll(".message-description");
  if (firstDesc[0] && nextPage) {
    nextObserver.observe(firstDesc[0]);
  }

  // when user scroll messages to bottom, show latest content
  let prevOptions = {
    rootMargin: "100px 0px 0px 0px",
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
      let sessions = createSession(messages);
      sessions.forEach((session) => {
        messagesDiv.append(session);
      });

      observer.unobserve(entry.target);
      let descs = messagesDiv.querySelectorAll(".message-description");
      if (entry.target === descs[descs.length - 1]) return;
    }
    let descs = messagesDiv.querySelectorAll(".message-description");
    observer.observe(descs[descs.length - 1]);
  };

  const prevObserver = new IntersectionObserver(prevCallback, prevOptions);
  const lastDesc = document.querySelectorAll(".message-description");
  if (lastDesc[lastDesc.length - 1] && prevPage) {
    prevObserver.observe(lastDesc[lastDesc.length - 1]);
  }

  if (readSession) {
    let div = document.querySelector(`.message[data-session='${readSession}']`);
    messagesDiv.scrollTop = messagesDiv.scrollHeight - messagesDiv.clientHeight;
    div.scrollIntoView({ behavior: "smooth", block: "center" });
    if (div.nextSibling) {
      div.style.borderTop = "1px solid red";
    }
  } else {
    messagesDiv.scrollTop = messagesDiv.scrollHeight - messagesDiv.clientHeight;
  }
};

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
      window.location.href = `/room.html?roomId=${rId}`;
    });
  });
}

// enter message
if (!channelId || !roomId) {
  let input = document.querySelector(".enter-message");
  input.disabled = true;
  input.setAttribute("placeholder", "請先加入對話");
}

document.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && e.target.value !== "" && e.target.classList.contains("enter-message")) {
    let description = e.target.value;
    description = description.replaceAll(" ", "");
    if (description === "") {
      e.target.value = "";
      return;
    }

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
    channelSocket.emit("message", message);
    messagesDiv.scrollTop = messagesDiv.scrollHeight - messagesDiv.clientHeight;
    let friends = document.querySelector(".friends");
    let currFriend = document.querySelector(".friend-enable");
    console.log(currFriend);
    insertToFirst(friends, currFriend);
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
    <input type="text" class="create-room-name" placeholder="輸入房間名稱" maxlength="15"/>
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
    let name = createRoomName.value;
    name = name.replaceAll(" ", "");
    if (name === "") {
      alert("請輸入房間名稱");
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
          Authorization: `Bearer ${token}`,
        },
      })
    ).json();
    if (roomData.error) {
      alert(roomData.error);
      return;
    }
    updateStorage("room", roomData);
    roomSocket.emit("join-room", { roomId: roomData.id, user });
    if (roomData.channelId) {
      window.location.href = `/room.html?roomId=${roomData.id}&channelId=${roomData.channel_id}`;
    } else {
      window.location.href = `/room.html?roomId=${roomData.id}`;
    }
  });
});

// when click add friend, show add friend form
let addFriendBtn = document.querySelector(".add-friend-btn");
addFriendBtn.addEventListener("mousedown", showAddFriend);

async function showAddFriend(e) {
  maskDiv.classList.add("enable");
  maskDiv.innerHTML += `
  <div class="add-friend-box">
    <h2>新增好友</h2>
    <input type="text" class="add-friend" placeholder="輸入使用者ID" />
    <button>傳送好友請求</button>
  </div>
  `;

  let requestBtn = maskDiv.querySelector(".add-friend-box button");
  requestBtn.addEventListener("click", async (e) => {
    let friendId = +maskDiv.querySelector(".add-friend").value;
    if (!isNumber(friendId) || friendId === 0) {
      alert("Please enter number");
      return;
    }
    let body = {
      user_id: friendId,
    };
    let result = await (
      await fetch("/api/friends/befriend", {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
    ).json();
    if (result.error) {
      alert(result.error);
      return;
    }
    roomSocket.emit("add-friend", friendId, user);
    maskDiv.innerHTML = "";
    maskDiv.classList.remove("enable");
  });
}

// when click mask, disable it
maskDiv.addEventListener("mousedown", (e) => {
  if (e.target.classList.contains("mask")) {
    e.target.innerHTML = "";
    e.target.classList.remove("enable");
  }
});

// when user sign in, call server to update status
if (document.referrer.includes("signin.html")) {
  roomSocket.emit("self-signin", { userId: user.id, rooms: roomsData });
}

// when user in a channel, show pin icon
let roomPin = document.createElement("li");
roomPin.classList.add("room-pin");
roomPin.innerHTML = `<i class="thumbtack icon"></i>`;
let toolList = document.querySelector(".tools");
if (channelId) {
  toolList.prepend(roomPin);
}

// when click channel pin message, render pin message box
roomPin.addEventListener("click", async (e) => {
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

// when not click pinbox, remove pinbox
document.addEventListener("mousedown", (e) => {
  let pinMessagesBox = document.querySelector(".pin-messages-box");
  if (pinMessagesBox && !pinMessagesBox.contains(e.target)) {
    pinMessagesBox.remove();
    document.querySelector(".tool-enable").classList.remove("tool-enable");
  }
});

// when click search box, show search options
let search = document.querySelector(".room-search input#search");
if (channelId) {
  search.addEventListener("focusin", expandSearch);
} else {
  search.disabled = true;
}

function expandSearch(e) {
  e.stopPropagation();
  if (document.querySelector(".search-options")) return;
  let searchInput = document.querySelector(".room-search input");
  searchInput.style.outline = "none";
  searchInput.style.transition = "width 0.3s";
  searchInput.style.width = "250px";
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
  document.removeEventListener("click", this);
}

// when enter search params, show result
document.addEventListener("keypress", async (e) => {
  let roomSearchInput = document.querySelector(".room-search input");
  if (e.key === "Enter" && roomSearchInput.parentElement.contains(e.target)) {
    let content = roomSearchInput.value;
    let data = await (
      await fetch(`/api/rooms/search?room_id=${roomId}&content=${content}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    ).json();
    let messages = data.messages;

    let searchBox = document.querySelector(".search-messages-box");
    if (searchBox) {
      searchBox.remove();
    }

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
        mailRoomName.innerHTML = roomName || "";

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
        threshold: 0.5,
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
          if (!result.messages.length) return;
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
          mailRoomName.innerHTML = roomName || "";

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

// when not click mailbox, remove mailbox
document.addEventListener("mousedown", (e) => {
  let messagesBox = document.querySelector(".mail-messages-box");
  if (messagesBox && !messagesBox.contains(e.target)) {
    messagesBox.remove();
    document.querySelector(".tool-enable").classList.remove("tool-enable");
  }
});

// when other people signin, update status
roomSocket.on("other-signin", (userId) => {
  let requestDiv = document.querySelector(`.friend-request[data-user-id="${userId}"]`);
  if (requestDiv) {
    requestDiv.querySelector(".request-online").style.backgroundColor = "#00EE00";
  }
  let friendDiv = document.querySelector(`.friend[data-user-id="${userId}"]`);
  if (friendDiv) {
    friendDiv.querySelector(".friend-online").style.backgroundColor = "#00EE00";
  }
});

// when other people signout, update status
roomSocket.on("other-signout", (userId) => {
  let requestDiv = document.querySelector(`.friend-request[data-user-id="${userId}"]`);
  if (requestDiv) {
    requestDiv.querySelector(".request-online").style.backgroundColor = "#8E8E8E";
  }
  let friendDiv = document.querySelector(`.friend[data-user-id="${userId}"]`);
  if (friendDiv) {
    friendDiv.querySelector(".friend-online").style.backgroundColor = "#8E8E8E";
  }
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
    let description = document.querySelector(`.message-description[data-message-id="-1"]`);
    if (description) {
      description.dataset.messageId = message.id;
    }
    let messageDiv = document.querySelector(`.message[data-message-id="-1"]`);
    if (messageDiv) {
      messageDiv.dataset.messageId = message.id;
    }
  }

  let friends = document.querySelector(".friends");
  let msgFriend = friends.querySelector(`.friend[data-user-id="${message.userId}"]`);
  if (msgFriend === friends.children[0]) return;
  insertToFirst(friends, msgFriend);
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

// listen to other add friend
roomSocket.on("add-friend", (friend, reqUser) => {
  if (+reqUser.id === +user.id || friend !== user.id) return;
  let pendingFriends = document.querySelector(".pending-friends");
  let requestDiv = createRequestFriend(reqUser);
  pendingFriends.append(requestDiv);
});

// listen to friend request accepted
roomSocket.on("befriend", (reqUser) => {
  if (reqUser.id === user.id) return;
  let friendsDiv = document.querySelector(".friends");
  let friendDiv = createFriend(reqUser);
  friendsDiv.prepend(friendDiv);
});

// listen to other member join room
roomSocket.on("join-room", (member) => {
  let memberDiv = document.createElement("div");
  memberDiv.classList.add("member");
  // user thumbnail
  let thumbnailDiv = document.createElement("div");
  thumbnailDiv.classList.add("member-user-thumbnail");
  thumbnailDiv.style.backgroundImage = `url("${member.picture}")`;
  // user name
  let nameDiv = document.createElement("div");
  nameDiv.classList.add("member-user-name");
  nameDiv.innerHTML = member.name;
  // user online
  let onlineDiv = document.createElement("div");
  onlineDiv.classList.add("member-user-online");
  onlineDiv.style.backgroundColor = member.online ? "#00EE00" : "#8E8E8E";
  let blackCircle = document.createElement("div");
  blackCircle.classList.add("black-circle");

  // append userId on memberDiv
  memberDiv.dataset.id = member.id;
  memberDiv.append(onlineDiv, blackCircle, thumbnailDiv, nameDiv);
  memberDiv.addEventListener("click", showUserInfo);
  document.querySelector(".members").append(memberDiv);
});

// disconnect socket when leave page
window.addEventListener("beforeunload", async () => {
  channelSocket.close();
  roomSocket.close();
  let descriptions = document.querySelectorAll(".message-description");
  if (!descriptions.length) return;
  let latestId = descriptions[descriptions.length - 1].dataset.messageId;
  currentId = latestId;
  let body = {
    user_id: user.id,
    room_id: roomId,
    channel_id: channelId,
    message_id: latestId,
  };

  await fetch("/api/messages/read", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    keepalive: true,
  });
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
    descDiv.dataset.messageId = message.id || -1;
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
  messageDiv.dataset.messageId = message.id || -1;

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

  let del = document.createElement("li");
  del.classList.add("message-delete");
  del.innerHTML = `<i class="trash alternate icon">`;
  del.addEventListener("click", deletedescription);

  let postUserName = description.dataset.name;
  if (postUserName === user.name) {
    optionList.append(thumbsUp, edit, pin, reply, del);
  } else {
    optionList.append(thumbsUp, pin, reply);
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
              Authorization: `Bearer ${token}`,
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
            method: "DELETE",
            body: JSON.stringify(body),
            headers: {
              "content-type": "application/json",
              Authorization: `Bearer ${token}`,
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

      await fetch("/api/messages", {
        method: "DELETE",
        body: JSON.stringify({ message_id: description.dataset.messageId }),
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${token}`,
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
    content.addEventListener("keypress", async (e) => {
      let keycode = e.charCode || e.keyCode;
      if (keycode == 13) {
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
          await fetch("/api/messages", {
            method: "PUT",
            body: JSON.stringify(body),
            headers: {
              "content-type": "application/json",
              Authorization: `Bearer ${token}`,
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
    });

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
      await fetch("/api/messages", {
        method: "PUT",
        body: JSON.stringify(body),
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${token}`,
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
            Authorization: `Bearer ${token}`,
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
            Authorization: `Bearer ${token}`,
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

function createSession(messages) {
  const result = [];
  messages.forEach((message) => {
    let sessionHead = result.find((r) => +r.dataset.session === +message.session);
    if (sessionHead) {
      let descDiv = document.createElement("div");
      descDiv.classList.add("message-description");
      descDiv.dataset.messageId = message.id;
      descDiv.dataset.name = message.name;
      descDiv.dataset.pinned = +message.pinned || 0;
      let content = document.createElement("p");
      content.innerHTML = message.description;
      descDiv.append(content);
      sessionHead.querySelector(".message-text").append(descDiv);
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
    messageDiv.dataset.session = message.session;

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

    result.push(messageDiv);
  });
  return result;
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

async function showUserInfo(e) {
  const userId = e.target.classList.contains("member")
    ? +e.target.dataset.id
    : e.target.parentElement.dataset.id;
  let userInfo = document.createElement("div");
  userInfo.classList.add("user-info");
  let mask = document.querySelector(".mask");
  mask.classList.add("enable");
  mask.append(userInfo);

  let data = await (
    await fetch(`/api/users/info?userId=${userId}`, {
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
  ).json();

  const info = data.info;
  const rooms = data.rooms;
  const friends = data.friends;

  let userBgd = document.createElement("div");
  userBgd.classList.add("user-background");
  userBgd.style.backgroundImage = `url("${info.background}")`;

  let userThumbnail = document.createElement("div");
  userThumbnail.classList.add("user-thumbnail");
  userThumbnail.style.backgroundImage = `url("${info.picture}")`;

  let userName = document.createElement("div");
  userName.classList.add("user-name");
  userName.innerHTML = info.name;

  let userInfoOptions = document.createElement("div");
  userInfoOptions.classList.add("user-info-options");

  let userOptionResult = document.createElement("div");
  userOptionResult.classList.add("user-option-result");
  userInfo.append(userBgd, userThumbnail, userName, userInfoOptions, userOptionResult);

  let userIntroTab = document.createElement("div");
  userIntroTab.classList.add("user-introduction-tab");
  userIntroTab.classList.add("info-option-enable");
  userIntroTab.innerHTML = `使用者資訊`;

  let userRoomTab = document.createElement("div");
  userRoomTab.classList.add("user-mutual-room-tab");
  userRoomTab.innerHTML = `共同的房間`;

  let userFriendTab = document.createElement("div");
  userFriendTab.classList.add("user-mutual-friends-tab");
  userFriendTab.innerHTML = `共同的朋友`;
  if (+userId === +user.id) {
    userInfoOptions.append(userIntroTab);
  } else {
    userInfoOptions.append(userIntroTab, userRoomTab, userFriendTab);
  }

  let content = document.createElement("p");
  content.classList.add("user-introduction");
  content.innerHTML = info.introduction;
  userOptionResult.appendChild(content);

  userIntroTab.addEventListener("click", (e) => {
    let enabledOpt = userInfoOptions.querySelector(".info-option-enable");
    if (enabledOpt) {
      enabledOpt.classList.remove("info-option-enable");
    }
    e.target.classList.add("info-option-enable");
    userOptionResult.innerHTML = "";
    let content = document.createElement("p");
    content.classList.add("user-introduction");
    content.innerHTML = info.introduction;
    userOptionResult.appendChild(content);
  });

  userRoomTab.addEventListener("click", (e) => {
    let enabledOpt = userInfoOptions.querySelector(".info-option-enable");
    if (enabledOpt) {
      enabledOpt.classList.remove("info-option-enable");
    }
    e.target.classList.add("info-option-enable");
    userOptionResult.innerHTML = "";

    rooms.forEach((room) => {
      let mutualRoom = document.createElement("div");
      mutualRoom.classList.add("mutual-room");

      let roomThumbnail = document.createElement("div");
      roomThumbnail.classList.add("mutual-room-thumbnail");
      roomThumbnail.style.backgroundImage = `url("${room.picture}")`;

      let roomName = document.createElement("div");
      roomName.classList.add("mutual-room-name");
      roomName.innerHTML = room.name;

      mutualRoom.append(roomThumbnail, roomName);
      userOptionResult.appendChild(mutualRoom);
    });
  });

  userFriendTab.addEventListener("click", (e) => {
    let enabledOpt = userInfoOptions.querySelector(".info-option-enable");
    if (enabledOpt) {
      enabledOpt.classList.remove("info-option-enable");
    }
    e.target.classList.add("info-option-enable");
    userOptionResult.innerHTML = "";

    friends.forEach((friend) => {
      let mutualFriend = document.createElement("div");
      mutualFriend.classList.add("mutual-friend");

      let friendThumbnail = document.createElement("div");
      friendThumbnail.classList.add("mutual-friend-thumbnail");
      friendThumbnail.style.backgroundImage = `url("${friend.picture}")`;

      let friendName = document.createElement("div");
      friendName.classList.add("mutual-friend-name");
      friendName.innerHTML = friend.name;

      mutualFriend.append(friendThumbnail, friendName);
      userOptionResult.appendChild(mutualFriend);
    });
  });
}

function createRequestFriend(reqUser) {
  let friendRequest = document.createElement("div");
  friendRequest.classList.add("friend-request");
  friendRequest.dataset.userId = reqUser.id;

  let thumbnail = document.createElement("div");
  thumbnail.classList.add("request-thumbnail");
  thumbnail.style.backgroundImage = `url("${reqUser.picture}")`;

  let name = document.createElement("div");
  name.classList.add("request-name");
  name.innerHTML = reqUser.name;

  let online = document.createElement("div");
  online.classList.add("request-online");
  online.style.backgroundColor = reqUser.online ? "#00EE00" : "#8E8E8E";

  let accept = document.createElement("div");
  accept.classList.add("request-accept");
  accept.innerHTML = `<i class="check icon"></i>`;
  accept.addEventListener("mousedown", async (e) => {
    let body = {
      user_id: reqUser.id,
    };
    let data = await (
      await fetch("/api/friends/requests", {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
    ).json();
    if (data.error) {
      alert(data.error);
      return;
    }
    reqUser.room_id = data.room_id;
    reqUser.channel_id = data.channel_id;
    let userInfo = user;
    userInfo.room_id = data.room_id;
    userInfo.channel_id = data.channel_id;
    roomSocket.emit("befriend", userInfo);

    let friendsDiv = document.querySelector(".friends");
    let friendDiv = createFriend(reqUser);
    friendsDiv.prepend(friendDiv);
    friendRequest.remove();
  });

  let reject = document.createElement("div");
  reject.classList.add("request-reject");
  reject.innerHTML = `<i class="close icon"></i>`;
  reject.addEventListener("click", async (e) => {
    let body = {
      user_id: reqUser.id,
    };
    await fetch("/api/friends/requests", {
      method: "DELETE",
      body: JSON.stringify(body),
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    friendRequest.remove();
  });

  friendRequest.append(thumbnail, name, online, accept, reject);
  return friendRequest;
}

function createFriend(friend) {
  let friendDiv = document.createElement("div");
  friendDiv.classList.add("friend");
  friendDiv.dataset.roomId = friend.room_id;
  friendDiv.dataset.channelId = friend.channel_id;
  friendDiv.dataset.lastMessageTime = friend.last_message_time;
  friendDiv.dataset.userId = friend.id;
  if (+friend.room_id === +roomId && +friend.channel_id === +channelId) {
    friendDiv.classList.add("friend-enable");
  }

  let thumbnail = document.createElement("div");
  thumbnail.classList.add("friend-thumbnail");
  thumbnail.style.backgroundImage = `url("${friend.picture}")`;

  let online = document.createElement("div");
  online.classList.add("friend-online");
  online.style.backgroundColor = friend.online ? "#00EE00" : "#8E8E8E";

  let name = document.createElement("div");
  name.classList.add("friend-name");
  name.innerHTML = friend.name;
  friendDiv.append(thumbnail, online, name);
  friendDiv.addEventListener("mousedown", (e) => {
    window.location.href = `/index.html?roomId=${friend.room_id}&channelId=${friend.channel_id}&friend=${friend.name}`;
  });
  return friendDiv;
}

function insertToFirst(parent, child) {
  if (parent.children.length === 1) return;
  let temp = child;
  child.remove();
  parent.prepend(temp);
}

function isNumber(n) {
  return Number(n) === n;
}
