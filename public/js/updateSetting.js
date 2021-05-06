//updateData
import axios from "axios";
import { showAlert } from "./alert";

// export const updateSeting = async (name, email) => {
//   console.log(name, email);
//   try {
//     const res = await axios({
//       method: "PATCH",
//       url: "http://localhost:3000/api/v1/users/updateMe",
//       data: {
//         name,
//         email,
//       },
//     });
//     if (res.data.sucess === "success") {
//       showAlert("success", "Data updated successfully");
//       window.setTimeout(() => {
//         location.reload()
//       }, 1000);

//     }
//   } catch (error) {
//     showAlert("error", error.response.data.message);
//   }
// };
// type is password or data
export const updateSetings = async (data, type) => {
  console.log(name, email);
  try {
    const url =
      type === "password"
        ? "http://localhost:3000/api/v1/users/updateMyPassword"
        : "http://localhost:3000/api/v1/users/updateMe";
    const res = await axios({
      method: "PATCH",
      url,
      data,
    });
    if (res.data.sucess === "success") {
      showAlert("success", `${type.toUpperCase()} updated successfully`);
      window.setTimeout(() => {
        location.reload();
      }, 1000);
    }
  } catch (error) {
    showAlert("error", error.response.data.message);
  }
};
