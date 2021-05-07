import axios from "axios";
import { showAlert } from "./alert";

export const signup = async (name, email, password, confirmPassword) => {
  try {
    const res = await axios({
      method: "POST",
      url: "http://localhost:3000/api/v1/users/signup",
      data: {
        name,
        email,
        password,
        confirmPassword,
      },
    });
    if (res.data.sucess === "success") {
      showAlert("success", "Register Successfully");
      window.setTimeout(() => {
        location.assign("/login");
      }, 1000);
    }
  } catch (error) {
    showAlert("error", error.response.data.message);
  }
};
