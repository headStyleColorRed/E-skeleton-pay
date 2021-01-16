# E-skeleton-pay

E-skeleton-pay is a docker project that will deploy in seconds a payment system with Stripe, Node.js and MongoDB so you can use it for your projects.

In order to acces this pay Api the endpoint should be:
- http://pay:8894

You can search more of my E-skeleton's docker projects and try to combine them in order to create a complete backend for your apps.
  - E-skeleton-chat
  - E-skeleton-login
  - E-skeleton-web


### API Use

Down here you have example code for the events that this server provides:

#### Add product

```js
function addProductToDB() { 
	let productData = {
        id: 'Random id',
        currency: 'eur', // usd - eur 
        product_data: {
            name: 'Product`s name',
            images: ['Array of product images'],
        },
        unit_amount: 100, // Price: 100 == 1€ ; 1000 == 10€
	}

	$ axios.post("https://yourNetworkPath:8894/add-product", productData)
            .then((res) => console.log(res))
            .catch((err) => console.log(err))
}
```

#### Delete product

```js
function deleteProductFromDB() { 
	let productData = {
        id: "random id"
	}

	$ axios.post("https://yourNetworkPath:8894/delete-product", productData)
            .then((res) => console.log(res))
            .catch((err) => console.log(err))
}
```

#### Checkout Product
In order to implement the checkout, you should first have a product created on the database, then call checkout-product
with the designated id, the quantity to purchase and the redirectioning paths.

Card number with different output:
*   Payment succeeds                    => 4242 4242 4242 4242
*   Payment requires authentication     => 4000 0025 0000 3155
*   Payment is declined                 => 4000 0000 0000 9995

```js
var stripe = Stripe("YOUR PUBLIC STRIPE KEY");

function checkoutProduct() { 
	let productData = {
        id: "random id",
        quantity: 1,
        successUrl: "Url where stripe should redirect the user once payment is done",
        cancelUrl: "Url where stripe should redirect in case the user cancel's the process"
	}

	$ axios.post("https://yourNetworkPath:8894/checkout-product", productData)
            .then((res) => {
                let sessionId = res.data.id
                return stripe.redirectToCheckout({ sessionId: sessionId });
            })
            .then((result) => {
                if (result.error) {
                    alert(result.error.message);
                }
            })
            .catch((error) => {
                console.error("Error:", error);
            });
}
```


#### Payment confirmation
Result from session verify can be either
*   paid
*   unpaid
*   no_payment_required

```js
var stripe = Stripe("YOUR PUBLIC STRIPE KEY");

function verifySession() { 
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const sessionId = urlParams.get('session_id')

	$ axios.post("https://yourNetworkPath:8894/check-session-status", sessionId)
            .then((res) => {
                console.log(res)
            })
            .catch((error) => { console.error(error); });
}
```

### Tech

E-skeleton-pay uses a number of open source projects to work properly:

* [stripe.js] - External party for online payment
* [node.js] - Evented I/O for the backend
* [Express] - Fast node.js network app framework 
* [MongoDB] - Classified as a NoSQL database program

### Installation
For personal environments you may want to run

```js
$ npm run dev
// Instead of :
$ npm start
```

### Todos

 - Add testing

License
----

MIT


**Free Software, Hell Yeah!**