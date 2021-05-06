import "@babel/polyfill";
import { login, logout } from "./login";
import { signup } from "./signup";
import { displayMap } from "./mapbox";
import { updateSetings } from "./updateSetting";
import { bookTour } from "./stripe";

// const locations = JSON.parse(document.getElementById("map").dataset.locations);

//DOM ELEMENTS
const loginForm = document.querySelector(".form--login");
const signupForm = document.querySelector(".form--signup");
const logoutBtn = document.querySelector(".nav__el.nav--logout");
const userDataForm = document.querySelector(".form.form.form-user-data");
const userPasswordForm = document.querySelector(".form-user-password");
const bookBtn = document.getElementById("book-tour");
//values

// displayMap(locations);

if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    login(email, password);
  });
}
if (signupForm) {
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    document.querySelector(".btn.btn--green").innerHTML = "Wait...";
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    signup(name,email, password,confirmPassword);
  });
}
if (userDataForm) {
  userDataForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append("name", document.getElementById("name").value);
    form.append("email", document.getElementById("email").value);
    form.append('photo', document.getElementById("photo").files[0]);
    updateSetings(form, "data");
  });
}
if (userPasswordForm) {
  userPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    document.querySelector(".btn--save-password").innerHTML = "Updating...";
    const passwordCurrent = document.getElementById("password-current").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("password-confirm").value;
    e.preventDefault();
    await updateSetings(
      { passwordCurrent, password, confirmPassword },
      "password"
    );
    document.querySelector(".btn--save-password").innerHTML = "Save Password";
    document.getElementById("password-current").value = "";
    document.getElementById("password-current").value = "";
    document.getElementById("password-confirm").value = "";
  });
}

if (logoutBtn) logoutBtn.addEventListener("click", logout);

if (bookBtn) bookBtn.addEventListener('click', e => {
  e.target.textContent = 'Processing...';
  const { tourId } = e.target.dataset;
  bookTour(tourId);

})