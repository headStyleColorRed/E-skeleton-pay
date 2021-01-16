const express = require("express")
const app = express();
const port = 8894;
const bodyParser = require("body-parser")
const Cors = require("cors")
const stripe = require('stripe')('YOUR PRIVATE KEY');
const mongoose = require("mongoose")
const environment = process.env.NODE_ENV
var dbLink = new String()
const Validation = require("./tools/validation");

// Modules
const Product = require("./mongoDB/productModel.js")

// Set environment
if (environment == "production")
	dbLink = "mongodb://payment_DB:27017/payment"
else
	dbLink = "mongodb://localhost:27017/payment"

// Middlewares
app.use(Cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))


// Open port
app.listen(port, () => console.log("Listening on port " + port))

// DataBase connection
let timeOut = setInterval(() => {
	mongoose.connect(dbLink, { useNewUrlParser: true }, (err) => {
		if (err) {
			console.log("Encountered an error in Db Connection")
		} else {
			console.log("Succesfully connected with DB");
			clearInterval(timeOut)
		}
	})
}, 5000);

// ++++++++++++++++ HTTP METHODS +++++++++++++++++++ //

app.get("/", (req, res) => {
	res.send("E-skeleton-pay is up and running! :D")
})

app.post("/add-product", async (req, res) => {
	let body = req.body;
	let isError = false;

	// Validation
	let validationResult = Validation.validateDataFields(body, ["id", "currency", "product_data", "unit_amount"], "creating product");
	if (validationResult.isError) {
		res.status(200).send({ code: validationResult.error, status: validationResult.message });
		return;
	}

	// Create Product
	const product = new Product({
		id: body.id,
		currency: body.currency,
		product_data: body.product_data,
		unit_amount: body.unit_amount
	});

	// Save Product
	await product.save().catch((err) => {
		if (err.code == 11000)
			res.status(200).send({
				code: "400",
				status: "Product already exists",
			});
		else res.status(200).send({ code: "400", status: err });
		isError = true;
		console.log(err);
	});
	if (isError) {
		return;
	}

	res.status(200).send({ code: "200", status: "Product Added Succesfully" });
});

app.post("/delete-product", async (req, res) => {
	let body = req.body;
	let isError = false;

	// Validation
	let validationResult = Validation.validateDataFields(body, ["id"], "deleting product");
	if (validationResult.isError) {
		res.status(200).send({ code: validationResult.error, status: validationResult.message });
		return;
	}

	await Product.deleteOne({ id: body.id }).catch((err) => {
		res.status(200).send({ code: "400", status: err });
		isError = true;
		console.log(err);
	});
	if (isError) return;

	res.status(200).send({ code: "200", status: "Product deleted Succesfully" });
});

app.post('/checkout-product', async (req, res) => {
	let body = req.body
	let isError = false;

	// Validation
	let validationResult = Validation.validateDataFields(body, ["id", "quantity", "successUrl", "cancelUrl"], "deleting product");
	if (validationResult.isError) {
		res.status(200).send({ code: validationResult.error, status: validationResult.message });
		return;
	}

	let item = await Product.findOne({ id: body.id })
		.then((res) => {
			return res
		})
		.catch((err) => {
			res.status(200).send({ code: "400", status: err });
			isError = true;
			console.log(err);
		});
	if (isError || item.length == 0) {
		return;
	}

	let itemModel = {
		price_data: {
			currency: item.currency,
			product_data: item.product_data,
			unit_amount: item.unit_amount,
		},
		quantity: body.quantity
	}
	try {

		const session = await stripe.checkout.sessions.create({
			payment_method_types: ['card'],
			line_items: [itemModel],
			mode: 'payment',
			success_url: body.successUrl,
			cancel_url: body.cancelUrl,
		});
		res.json({ id: session.id });
	} catch (err) {
		res.send(err)
	}

});

app.post("/check-session-status", async(req, res) => {
	let body = req.body
	const session = await stripe.checkout.sessions.retrieve(body.sessionId);
	res.send(session.payment_status)
})


app.get("/products", async (req, res) => {					//	 B O R R A R
	const products = await Product.find();					//	 B O R R A R
	res.json(products);										//	 B O R R A R
})

app.get("/delete-all", async (req, res) => {				//	 B O R R A R
	await Product.deleteMany();								//	 B O R R A R
	res.send("products deleted")							//	 B O R R A R
})