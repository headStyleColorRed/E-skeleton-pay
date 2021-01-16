const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
	id: {
        type: String,
        required: [true, "can't be blank"],
        unique: true,
	},
    currency: {
        type: String
	},
	product_data: {
		type: Object
	},
    unit_amount: {
        type: Number
	},
	
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;