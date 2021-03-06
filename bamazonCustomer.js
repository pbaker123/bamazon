var mysql = require("mysql");
var inquirer = require("inquirer");
var ui = require('cliui')();
var connection = mysql.createConnection({
  host: "localhost",

  // Your port; if not 3306
  port: 3306,

  // Your username
  user: "root",

  // Your password
  password: "root",
  database: "bamazonDB"
});

var stock = [];
var productPurchase;

function reset() { 
	process.stdout.write('\033c') 
}

function getStock() {
	reset()
	connection.query("SELECT * FROM products WHERE stock_quantity > 0", function(err, res) {
	    if (err) throw err;
	    printStock(res)
  	});
}

function printStock(res) {
	
	ui.div(
		{text: "Product ID",width: 25},
		{text: "Product Name",width: 50},
		{text: "Price",align: "right"}
	)
	ui.div({text: "-------------------------------------------------------------------------------"})
	for (var i = 0; i < res.length; i++) {
		stock.push(res[i].product_name)
		ui.div(
		{text: res[i].item_id,width: 25},
		{text: res[i].product_name,width: 45},
		{text: "$" + res[i].price,align: "right"}
	)}
	console.log(ui.toString())
	sale(res, stock)
}

function sale(res, stock) {
	inquirer.prompt([{type: "list", message: "Which item would you like to buy?", choices: stock, name: "productPurchase"},{type: "input", message: "how many units of " + productPurchase + " would you like to buy?", name: "quantityPurchase"}]).then(function(data) {
		invoice(res, data)
	})
}

function invoice(res, data) {
	for (var i = 0; i < res.length; i++) {
        if (res[i].product_name === data.productPurchase) {
            var selectedItem = res[i];
        }
    }
    if (data.quantityPurchase > selectedItem.stock_quantity) {
		inquirer.prompt([{type: "confirm", message: "We only have " + selectedItem.stock_quantity + " in stock, would you like to purhcase this quantity instead?", name: "confirm", default: true}]).then(function(data) {
		if (data.confirm) {
			quantityPurchase = selectedItem.stock_quantity;
			total(selectedItem, quantityPurchase)
		} else buyAgain()
		})
	} else {
		total(selectedItem, data.quantityPurchase)
	}
}

function closeConnection() {
	connection.end()
}

function total(selectedItem, quantityPurchase) {
	reset()
	var newQuantity = selectedItem.stock_quantity - quantityPurchase;
	var price = (quantityPurchase * selectedItem.price).toFixed(2);
	var totalSales = selectedItem.product_sales + parseFloat(price);
	connection.query(
	    "UPDATE products SET ? WHERE ?",[{stock_quantity: newQuantity,product_sales: totalSales},{item_id: selectedItem.item_id}], function(error) {
	      if (error) throw err;
	      console.log("\nCongratulations, your purchase is approved.  \n\nYour account has been debited $" + price + "\n");
	      buyAgain()
	    }
	);
}

function buyAgain() {
	inquirer.prompt([{type: "confirm", message: "Would you like to buy anything else?", name: "confirm", default: true}]).then(function(data) {
		if (data.confirm) getStock();
		else {
			console.log("Thank you for shopping at Bamazon")
			closeConnection()			
		}
	})
}
connection.connect(function (err) {
  if (err) throw err;
  getStock()
});