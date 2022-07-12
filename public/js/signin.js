const signUpBtn = document.getElementById("signUp");
const signInBtn = document.getElementById("signIn");
const container = document.querySelector(".container");

signUpBtn.addEventListener("click", () => {
  container.classList.add("right-panel-active");
});
signInBtn.addEventListener("click", () => {
  container.classList.remove("right-panel-active");
});

// user sign in
const userSignIn = document.querySelector("#user-sign-in");
userSignIn.addEventListener("click", async (e) => {
  e.preventDefault();
  const email = document.querySelector("#signin-email").value;
  const password = document.querySelector("#signin-password").value;
  if (!email || !password || email.indexOf("@") === -1) {
    alert("請輸入正確資料");
    return;
  }
  let body = {
    email,
    password,
  };
  const response = await fetch("/api/users/signin", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
  });
  const user = await response.json();
  if (user.error) {
    alert(user.error);
    return;
  }
  localStorage.setItem("token", user.access_token);
  localStorage.setItem("info", JSON.stringify(user.info));
  localStorage.setItem("rooms", JSON.stringify(user.rooms));
  window.location.href = "/index.html";
});

// user sign up
const userSignUp = document.querySelector("#user-sign-up");
userSignUp.addEventListener("click", async (e) => {
  e.preventDefault();
  const name = document.querySelector("#signup-name").value;
  const email = document.querySelector("#signup-email").value;
  const password = document.querySelector("#signup-password").value;
  if (name === "" || email.indexOf("@") === -1 || password === "") {
    alert("請輸入正確資料");
    return;
  }
  let body = {
    name,
    email,
    password,
  };
  const response = await fetch("/api/users/signup", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
  });
  const user = await response.json();
  if (user.error) {
    alert(user.error);
    return;
  }
  localStorage.setItem("token", user.access_token);
  localStorage.setItem("info", JSON.stringify(user.info));
  localStorage.setItem("rooms", JSON.stringify([]));
  window.location.href = "/index.html";
});
