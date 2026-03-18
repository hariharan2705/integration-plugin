import { apiClient } from "./apiClient.js";

/**
 * Main payment entry
 */
export const createPayment = async (data) => {

  const client = apiClient();

  const res = await client.post("/payments", data);

  const payment = res.data;

  if (payment.gatewayType === "RAZORPAY") {
    return await openRazorpay(payment);
  }

  if (payment.gatewayType === "STRIPE") {
    return await openStripe(payment);
  }

};
export const refundPayment = async (paymentId) => {

  const client = apiClient();

  const res = await client.post(
    `/payments/refund?paymentId=${paymentId}`
  );

  const data = res.data;

  console.log("Refund response:", data);

  return data;
};

/**
 * Load external script
 */
const loadScript = (src) => {
  return new Promise((resolve) => {

    const script = document.createElement("script");
    script.src = src;

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
};


/**
 * Razorpay checkout
 */
const openRazorpay = async (payment) => {

  // 🔥 Load Razorpay script
  const loaded = await loadScript("https://checkout.razorpay.com/v1/checkout.js");

  if (!loaded) {
    throw new Error("Razorpay SDK failed to load");
  }

  return new Promise((resolve, reject) => {

    const options = {
      key: payment.keyId,
      amount: payment.amount,
      currency: payment.currency,
      order_id: payment.paymentId,

      handler: function (response) {

        const result = {
          gateway: "RAZORPAY",
          status: "SUCCESS",
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
          signature: response.razorpay_signature
        };

        resolve(result);
      },

      modal: {
        ondismiss: function () {
          reject({
            gateway: "RAZORPAY",
            status: "CANCELLED"
          });
        }
      }
    };

    const rzp = new window.Razorpay(options);

    console.log("Opening Razorpay..."); // debug

    rzp.open(); // 🔥 this will now work

  });
};

/**
 * Stripe payment UI
 */
const openStripe = async (payment) => {

  return new Promise(async (resolve, reject) => {

    const loaded = await loadScript("https://js.stripe.com/v3/");

    if (!loaded) {
      reject({
        gateway: "STRIPE",
        status: "FAILED",
        message: "Stripe SDK failed to load"
      });
      return;
    }

    const stripe = window.Stripe(payment.publishableKey);

    const elements = stripe.elements();
    const card = elements.create("card");

    // create container
    const container = document.createElement("div");
    container.id = "stripe-container";

    container.innerHTML = `
      <div style="
        position:fixed;
        top:0;
        left:0;
        width:100%;
        height:100%;
        background:#00000080;
        display:flex;
        justify-content:center;
        align-items:center;
        z-index:9999;
      ">
        <div style="background:white;padding:20px;width:400px">
          <h3>Stripe Payment</h3>
          <div id="card-element"></div>
          <br/>
          <button id="stripe-pay-btn">Pay</button>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    card.mount("#card-element");

    document
      .getElementById("stripe-pay-btn")
      .addEventListener("click", async () => {

        const result = await stripe.confirmCardPayment(payment.clientSecret, {
          payment_method: {
            card: card
          }
        });

        if (result.error) {

          reject({
            gateway: "STRIPE",
            status: "FAILED",
            message: result.error.message
          });

        } else {

          const intent = result.paymentIntent;

          resolve({
            gateway: "STRIPE",
            status: intent.status,
            paymentId: intent.id,
            amount: intent.amount,
            currency: intent.currency
          });

        }

        document.getElementById("stripe-container").remove();

      });

  });
};