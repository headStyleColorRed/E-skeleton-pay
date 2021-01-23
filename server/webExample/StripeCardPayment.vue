<template>
  <div class="stripeWrapper">
    <div class="sr-main">
      <form
        id="payment-form"
        class="sr-payment-form"
        ref="stripeForm"
        v-on:submit.prevent="pay()"
      >
        <div class="sr-combo-inputs-row">
          <div
            class="sr-input sr-card-element"
            id="card-element"
            ref="card"
          ></div>
        </div>
        <div class="sr-field-error" id="card-errors" role="alert"></div>
        <button id="submit">
          <div class="spinner hidden" id="spinner"></div>
          <span id="button-text">Pagar</span><span v-if="notLoading" id="order-amount"> {{ totalAmount }} </span>
        </button>
      </form>
    </div>
  </div>
</template>

<script>

// Things to do in order to use this file
// 1. Fill the publicKey
// 2. Pass the itemId
// 3. Total amount prop is optional

let publicKey = "YOUR PUBLIC KEY"
let stripe = Stripe(publicKey)
let elements = stripe.elements()
let card = undefined

export default {
  name: "StripeCardPayment",
  props: {
    itemId: String,
    totalAmount: String,
  },
  data() {
    return {
      stripe: null,
      style: {
        base: {
          color: "#32325d",
          fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
          fontSmoothing: "antialiased",
          fontSize: "16px",
          "::placeholder": {
            color: "#aab7c4",
          },
        },
        invalid: {
          color: "#fa755a",
          iconColor: "#fa755a",
        },
      },
      clientSecret: publicKey,
      orderData: {
        items: [{ id: this.itemId }],
        currency: "eur",
      },
      notLoading: true,
    };
  },
  mounted() {
    if (card) return;
    
    this.clientSecret = this.publicKey
    card = elements.create("card", this.style);
    card.mount(this.$refs.card);
  },
  methods: {
    changeLoadingState(isLoading) {
      if (isLoading) {
        this.notLoading = false
        document.querySelector("button").disabled = true;
        document.querySelector("#spinner").classList.remove("hidden");
        document.querySelector("#button-text").classList.add("hidden");
      } else {
        this.notLoading = true
        document.querySelector("button").disabled = false;
        document.querySelector("#spinner").classList.add("hidden");
        document.querySelector("#button-text").classList.remove("hidden");
      }
    },
    pay() {
      this.changeLoadingState(true);
      const This = this;

      stripe
        .createPaymentMethod("card", card)
        .then((result) => {
          if (result.error) {
            throw This.showError(result.error.message);
          } else {
            This.orderData.paymentMethodId = result.paymentMethod.id;

            return fetch("http://localhost:8894/pay", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(This.orderData),
            });
          }
        })
        .then((result) => {
          return result.json();
        })
        .then((response) => {
          if (response.error) {
            This.showError(response.error);
          } else if (response.requiresAction) {
            This.handleAction(response.clientSecret);
          } else {
            This.orderComplete(response.clientSecret);
          }
        })
        .catch((err) => {
          console.log("Error");
          console.log(err);
        });
    },
    showError(errorMsgText) {
      this.changeLoadingState(false);
      var errorMsg = document.querySelector(".sr-field-error");
      errorMsg.textContent = errorMsgText;
      setTimeout(function () {
        errorMsg.textContent = "";
      }, 4000);
    },
    handleAction(clientSecret) {
      let This = this;
      stripe.handleCardAction(clientSecret).then(function (data) {
        if (data.error) {
          This.showError("Your card was not authenticated, please try again");
        } else if (data.paymentIntent.status === "requires_confirmation") {
          fetch("http://localhost:8894/pay", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              paymentIntentId: data.paymentIntent.id,
            }),
          })
            .then(function (result) {
              return result.json();
            })
            .then(function (json) {
              if (json.error) {
                This.showError(json.error);
              } else {
                This.orderComplete(clientSecret);
              }
            });
        }
      });
    },
    orderComplete(clientSecret) {
      let This = this;

      stripe.retrievePaymentIntent(clientSecret).then((result) => {
        if (result.paymentIntent.status == "succeeded") {
          console.log("💰 Payment received!");
        } else {
          console.log("Error on order");
          console.log(result);
        }

        This.changeLoadingState(false);
      });
    },
  },
};
</script>

<style >
/* Variables */
:root {
  --body-color: rgb(247, 250, 252);
  --button-color: rgb(30, 166, 114);
  --accent-color: #0a721b;
  --link-color: #ffffff;
  --font-color: rgb(105, 115, 134);
  --body-font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  --radius: 6px;
  --form-width: 400px;
}

/* Base */
* {
  box-sizing: border-box;
}

body {
  font-family: var(--body-font-family);
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
}

/* Layout */
.sr-root {
  display: flex;
  flex-direction: row;
  width: 100%;
  max-width: 980px;
  padding: 48px;
  align-content: center;
  justify-content: center;
  height: auto;
  min-height: 100vh;
  margin: 0 auto;
}

.sr-main {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  align-self: center;
  padding: 75px 50px;
  background: var(--body-color);
  width: var(--form-width);
  border-radius: var(--radius);
  box-shadow: 0px 0px 0px 0.5px rgba(50, 50, 93, 0.1),
    0px 2px 5px 0px rgba(50, 50, 93, 0.1), 0px 1px 1.5px 0px rgba(0, 0, 0, 0.07);
}

.sr-field-error {
  color: var(--font-color);
  text-align: left;
  font-size: 13px;
  line-height: 17px;
  margin-top: 12px;
}

/* Inputs */
.sr-input,
input[type="text"] {
  border: 1px solid var(--gray-border);
  border-radius: var(--radius);
  padding: 5px 12px;
  height: 44px;
  width: 100%;
  transition: box-shadow 0.2s ease;
  background: white;
  -moz-appearance: none;
  -webkit-appearance: none;
  appearance: none;
}

.sr-input:focus,
input[type="text"]:focus,
button:focus,
.focused {
  box-shadow: 0 0 0 1px rgba(50, 151, 211, 0.3), 0 1px 1px 0 rgba(0, 0, 0, 0.07),
    0 0 0 4px rgba(50, 151, 211, 0.3);
  outline: none;
  z-index: 9;
}

.sr-input::placeholder,
input[type="text"]::placeholder {
  color: var(--gray-light);
}

.sr-result {
  height: 44px;
  -webkit-transition: height 1s ease;
  -moz-transition: height 1s ease;
  -o-transition: height 1s ease;
  transition: height 1s ease;
  color: var(--font-color);
  overflow: auto;
}

.sr-result code {
  overflow: scroll;
}

.sr-result.expand {
  height: 350px;
}

.sr-combo-inputs-row {
  box-shadow: 0px 0px 0px 0.5px rgba(50, 50, 93, 0.1),
    0px 2px 5px 0px rgba(50, 50, 93, 0.1), 0px 1px 1.5px 0px rgba(0, 0, 0, 0.07);
  border-radius: 7px;
}

/* Buttons and links */
button {
  background: var(--accent-color);
  border-radius: var(--radius);
  color: white;
  border: 0;
  padding: 12px 16px;
  margin-top: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: block;
  box-shadow: 0px 4px 5.5px 0px rgba(0, 0, 0, 0.07);
  width: 100%;
}

button:hover {
  filter: contrast(115%);
}

button:active {
  transform: translateY(0px) scale(0.98);
  filter: brightness(0.9);
}

button:disabled {
  opacity: 0.5;
  cursor: none;
}

a {
  color: var(--link-color);
  text-decoration: none;
  transition: all 0.2s ease;
}

a:hover {
  filter: brightness(0.8);
}

a:active {
  filter: brightness(0.5);
}

/* Code block */
code,
pre {
  font-family: "SF Mono", "IBM Plex Mono", "Menlo", monospace;
  font-size: 12px;
}

/* Stripe Element placeholder */
.sr-card-element {
  padding-top: 12px;
}

/* Responsiveness */
@media (max-width: 720px) {
  .sr-root {
    flex-direction: column;
    justify-content: flex-start;
    padding: 48px 20px;
    min-width: 320px;
  }

  .sr-header__logo {
    background-position: center;
  }

  .sr-payment-summary {
    text-align: center;
  }

  .sr-content {
    display: none;
  }

  .sr-main {
    width: 100%;
    height: 305px;
    background: rgb(247, 250, 252);
    box-shadow: 0px 0px 0px 0.5px rgba(50, 50, 93, 0.1),
      0px 2px 5px 0px rgba(50, 50, 93, 0.1),
      0px 1px 1.5px 0px rgba(0, 0, 0, 0.07);
    border-radius: 6px;
  }
}

/* todo: spinner/processing state, errors, animations */

.spinner,
.spinner:before,
.spinner:after {
  border-radius: 50%;
}

.spinner {
  color: #ffffff;
  font-size: 22px;
  text-indent: -99999px;
  margin: 0px auto;
  position: relative;
  width: 20px;
  height: 20px;
  box-shadow: inset 0 0 0 2px;
  -webkit-transform: translateZ(0);
  -ms-transform: translateZ(0);
  transform: translateZ(0);
}

.spinner:before,
.spinner:after {
  position: absolute;
  content: "";
}

.spinner:before {
  width: 10.4px;
  height: 20.4px;
  background: var(--accent-color);
  border-radius: 20.4px 0 0 20.4px;
  top: -0.2px;
  left: -0.2px;
  -webkit-transform-origin: 10.4px 10.2px;
  transform-origin: 10.4px 10.2px;
  -webkit-animation: loading 2s infinite ease 1.5s;
  animation: loading 2s infinite ease 1.5s;
}

.spinner:after {
  width: 10.4px;
  height: 10.2px;
  background: var(--accent-color);
  border-radius: 0 10.2px 10.2px 0;
  top: -0.1px;
  left: 10.2px;
  -webkit-transform-origin: 0px 10.2px;
  transform-origin: 0px 10.2px;
  -webkit-animation: loading 2s infinite ease;
  animation: loading 2s infinite ease;
}

@-webkit-keyframes loading {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }

  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}

@keyframes loading {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }

  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}

/* Animated form */

.sr-root {
  animation: 0.4s form-in;
  animation-fill-mode: both;
  animation-timing-function: ease;
}

.hidden {
  display: none;
}

@keyframes field-in {
  0% {
    opacity: 0;
    transform: translateY(8px) scale(0.95);
  }

  100% {
    opacity: 1;
    transform: translateY(0px) scale(1);
  }
}

@keyframes form-in {
  0% {
    opacity: 0;
    transform: scale(0.98);
  }

  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/*   ========================================================================== */

html {
  line-height: 1.15;
  /* 1 */
  -webkit-text-size-adjust: 100%;
  /* 2 */
}

body {
  margin: 0;
}

/**
   * Render the `main` element consistently in IE.
   */

main {
  display: block;
}

h1 {
  font-size: 2em;
  margin: 0.67em 0;
}

hr {
  box-sizing: content-box;
  /* 1 */
  height: 0;
  /* 1 */
  overflow: visible;
  /* 2 */
}

pre {
  font-family: monospace, monospace;
  /* 1 */
  font-size: 1em;
  /* 2 */
}

a {
  background-color: transparent;
}

abbr[title] {
  border-bottom: none;
  /* 1 */
  text-decoration: underline;
  /* 2 */
  text-decoration: underline dotted;
  /* 2 */
}

b,
strong {
  font-weight: bolder;
}

code,
kbd,
samp {
  font-family: monospace, monospace;
  /* 1 */
  font-size: 1em;
  /* 2 */
}

small {
  font-size: 80%;
}

sub,
sup {
  font-size: 75%;
  line-height: 0;
  position: relative;
  vertical-align: baseline;
}

sub {
  bottom: -0.25em;
}

sup {
  top: -0.5em;
}

img {
  border-style: none;
}

button,
input,
optgroup,
select,
textarea {
  font-family: inherit;
  font-size: 100%;
  line-height: 1.15;
  margin: 0;
}

button,
input {
  overflow: visible;
}

button,
select {
  text-transform: none;
}

button,
[type="button"],
[type="reset"],
[type="submit"] {
  -webkit-appearance: button;
}

button::-moz-focus-inner,
[type="button"]::-moz-focus-inner,
[type="reset"]::-moz-focus-inner,
[type="submit"]::-moz-focus-inner {
  border-style: none;
  padding: 0;
}

button:-moz-focusring,
[type="button"]:-moz-focusring,
[type="reset"]:-moz-focusring,
[type="submit"]:-moz-focusring {
  outline: 1px dotted ButtonText;
}

fieldset {
  padding: 0.35em 0.75em 0.625em;
}

legend {
  box-sizing: border-box;
  color: inherit;
  display: table;
  max-width: 100%;
  padding: 0;
  white-space: normal;
}

progress {
  vertical-align: baseline;
}

textarea {
  overflow: auto;
}

[type="checkbox"],
[type="radio"] {
  box-sizing: border-box;
  padding: 0;
}

[type="number"]::-webkit-inner-spin-button,
[type="number"]::-webkit-outer-spin-button {
  height: auto;
}

[type="search"] {
  -webkit-appearance: textfield;
  outline-offset: -2px;
}

[type="search"]::-webkit-search-decoration {
  -webkit-appearance: none;
}

::-webkit-file-upload-button {
  -webkit-appearance: button;
  font: inherit;
}

details {
  display: block;
}

summary {
  display: list-item;
}

template {
  display: none;
}

[hidden] {
  display: none;
}
</style>
