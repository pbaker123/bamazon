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
var idlist = [];

// Connect to the database and run the manager menu
connection.connect(function (err) {
  if (err) throw err;
  managerMenu()
});

// Menu options
function managerMenu(res, stock) {
	reset()
	var options = ["View Products for Sale", "View Low Inventory", "Add to Inventory", "Add New Product"];
	inquirer.prompt([{type: "list", message: "What would you like to do?", choices: options, name: "application"}]).then(function(data) {
			// switch
		switch (data.application) {
 	 		case options[0]: return viewProducts();
	  		case options[1]: return viewLowInventory();
	  		case options[2]: return addInventory();
	    	case options[3]: return newProduct();
  		}
  	})
}

// If a manager selects View Products for Sale, the app should list every available item: the item IDs, names, prices, and quantities.
function viewProducts() {
	reset()
	// run get stock passing the query and callback
	getStock("SELECT * FROM products", runAgain)
}

// If a manager selects View Low Inventory, then it should list all items with an inventory count lower than five.
function viewLowInventory() {
	reset()
	// run get stock passing the query and callback
	getStock("SELECT * FROM products WHERE stock_quantity<5", runAgain)
}

// If a manager selects Add to Inventory, your app should display a prompt that will let the manager "add more" of any item currently in the store.
function addInventory() {
	reset()
	// run get stock passing the query and callback
	getStock("SELECT * FROM products", increaseStock)
}


// If a manager selects Add New Product, it should allow the manager to add a completely new product to the store.  Run get stock first so we have res to compare id to make sure its unique
function newProduct() {
	reset()
	getStock("SELECT * FROM products", newItem)
}


// Reset the terminal window
function reset() { 
	process.stdout.write('\033c') 
}

// Close the db connection
function closeConnection() {
	connection.end()
}

// Query the db, the callback from originating function is passed to printStock
function getStock(query, x) {
	reset()
	connection.query(query ,function(err, res) {
	    if (err) throw err;
	    printStock(res, x)
  	});
}

// This uses cliui to display data in columns.  Also creates an array "stock" used by inquirer.  The passed callback is performed after printing occurs
function printStock(res, callback) {
	ui = require('cliui')();
	stock = [];
	idlist = [];
	ui.div(
		{text: "Product ID",width: 15},
		{text: "Product Name",width: 25},
		{text: "Department",width: 15},
		{text: "Price",align: "right",width:10},
		{text: "Stock",align: "right",width:10}
	)
	ui.div({text: "-------------------------------------------------------------------------------"})
	for (var i = 0; i < res.length; i++) {
		stock.push(res[i].product_name)
		idlist.push(res[i].item_id)
		ui.div(
			{text: res[i].item_id,width: 15},
			{text: res[i].product_name,width: 25},
			{text: res[i].department_name,width: 15},
			{text: "$" + res[i].price,align: "right",width:10},
			{text: res[i].stock_quantity,align:"right",width:10}
	)}
	console.log(ui.toString())
	callback(res)	
}

// Runs when a function completes its entire path.  Allows the user to start over or exit.
function runAgain() {
	inquirer.prompt([{type: "confirm", message: "Would you like to do anything else?", name: "confirm", default: true}]).then(function(data) {
		if (data.confirm) managerMenu();
		else {
			console.log("Thank you for using Bamazon Manager")
			closeConnection()			
		}
	})
}

// This gets called for restocking.  Uses stock to list all of the available items for restocking.  Passes the response from getStock and the data from the inquiry to restock()
function increaseStock(res) {
	inquirer.prompt([{type: "list", message: "Which item would you like to restock?", choices: stock, name: "restocker"},{type: "input", message: "how many units are being restocked?", name: "restockQuantity"}]).then(function(data) {
		restock(res, data)
	})
}

// Loops through res to match the name in data.  Then it updates the quantity based on id
function restock(res, data) {
	for (var i = 0; i < res.length; i++) {
        if (res[i].product_name === data.restocker) {
            var selectedItem = res[i];
        }
    }
    var newQuantity = selectedItem.stock_quantity + parseInt(data.restockQuantity);
    connection.query(
	    "UPDATE products SET ? WHERE ?",[{stock_quantity: newQuantity},{item_id: selectedItem.item_id}], function(error) {
	      if (error) throw err;
	      console.log("Congratulations, there are now " + newQuantity + " " + data.restocker + " in stock.");
	      runAgain()
	    }
	);
}

// Inquirer to collect item_id, 
function newItem() {
	inquirer.prompt([
		{
			type: "input", 
			message: "Please enter the item id for the new item.", 
			name: "item_id",
			validate: function(value) {
	          	if (isNaN(value) === false) {
              		if (idlist.indexOf(parseFloat(value)) !== -1) {
	            		console.log("\nThat number is already in use\n")
	            		return false;
	          		} else return true;
	          	}
	          	console.log("\n\nPlease enter numbers only\n")
	          	return false;
	        }
		},
		{
			type: "input", 
			message: "Please enter the product's name.", 
			name: "product_name"
		},
		{
			type: "input",
			message: "please enter the product's department.",
			name: "department_name"
		},
		{
			type: "input",
			message: "Please enter the product's price.",
			name: "price"
		},
		{
			type: "input",
			message: "Please input the initial purchase quantity",
			name: "stock_quantity"
		}
	]).then(function(data) {
		console.log(data)
		connection.query(
	        "INSERT INTO products SET ?", data, function(err) {
	          if (err) throw err;
	          console.log("Your new item was created successfully!");
	          // re-prompt the user for if they want to bid or post
	          runAgain();
	        }
      	);
	})


}


