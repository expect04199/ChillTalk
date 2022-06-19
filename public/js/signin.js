const signUpBtn = document.getElementById("signUp");
const signInBtn = document.getElementById("signIn");
const container = document.querySelector(".container");

signUpBtn.addEventListener("click", () => {
  container.classList.add("right-panel-active");
});
signInBtn.addEventListener("click", () => {
  container.classList.remove("right-panel-active");
});

// user sign up
let userSignUp = document.querySelector("#user-sign-up");
userSignUp.addEventListener("click", async (e) => {
  e.preventDefault();
  let name = document.querySelector("#signup-name").value;
  let email = document.querySelector("#signup-email").value;
  let password = document.querySelector("#signup-password").value;
  if (name === "" || email.indexOf("@") === -1 || password === "") {
    alert("請輸入正確資料");
  }
  let body = {
    name,
    email,
    password,
  };
  let user = await (
    await fetch("/api/users/signup", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "content-type": "application/json",
      },
    })
  ).json();
  localStorage.setItem("token", user.access_token);
  localStorage.setItem("info", JSON.stringify(user.info));
  window.location.href = "/room.html";
});
