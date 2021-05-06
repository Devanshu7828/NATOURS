// <script src="https://js.stripe.com/v3/"></script>
// add this script into html file in this case in tour.pug file

import axios from "axios";
import { showAlert } from "./alert";

const stripe = Stripe(
  "pk_test_51Io00FSAn4fTk3JYZb7DxdSWDr5wHX3XbzcDKgHtj3fYyueZtkdpv0tKsY7f5QflXF1KiPWKRD3802QRD5fWNDgt00J0uq8vEJ"
);

export const bookTour = async (tourId) => {
  try {
    //1) GET CHECKOUT SESSION FROM THE api
    const session = await axios(
      `/api/v1/bookings/checkout-session/${tourId}`
    );
    // console.log(session);
    //2) Create checkout form + chare credit card
      await stripe.redirectToCheckout({
          sessionId: session.data.session.id,
      })
  } catch (error) {
    console.log(error);
    showAlert("ERROR", error);
  }
};
