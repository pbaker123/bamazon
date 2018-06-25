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

// Connect to the database and run the manager menu
connection.connect(function (err) {
  if (err) throw err;
  supervisorMenu()
});
var idlist = [];

// Menu options
function supervisorMenu(res, stock) {
	reset()
	var options = ["View Product Sales by Department", "Create a new Department"];
	inquirer.prompt([{type: "list", message: "What would you like to do?", choices: options, name: "application"}]).then(function(data) {
			// switch
		switch (data.application) {
 	 		case options[0]: return departmentSales();
	  	case options[1]: return newDepartment(); 	
  	}
  })
}

// When a supervisor selects View Product Sales by Department, the app should display a summarized table in their terminal/bash window. Use the table below as a guide.
function departmentSales() {
  var query = "SELECT departments.*,sum(products.product_sales) FROM departments LEFT JOIN products ON departments.department_name = products.department_name GROUP BY departments.department_id"
  getStock(query, runAgain)
}

function newDepartment() {
  var query = "SELECT * FROM departments";
  getStock(query, addDepartment)
}

function addDepartment() {
  reset()
  console.log(idlist)
  console.log(idlist.indexOf(123))
  inquirer.prompt([
    {
      type: "input", 
      message: "Please enter the id for the new department.", 
      name: "department_id",
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
      message: "Please enter the department's name.", 
      name: "department_name"
    },
    {
      type: "input",
      message: "please enter the department's over head cost.",
      name: "over_head_costs"
    }
  ]).then(function(data) {
    console.log(data)
    connection.query(
          "INSERT INTO departments SET ?", data, function(err) {
            if (err) throw err;
            console.log("Your new item was created successfully!");
            // re-prompt the user for if they want to bid or post
            runAgain();
          }
        );
  })
}

function getStock(query, x) {
  reset()
  connection.query(query ,function(err, res) {
      if (err) throw err;
      printStock(res, x)
    });
}

// This uses cliui to display data in columns.  Also creates an array "stock" used by inquirer.  The passed callback is performed after printing occurs
function printStock(res, callback) {
  idlist = [];
  ui = require('cliui')();
  ui.div(
    {text: "Department ID",width: 12,padding: [0, 1, 0, 1]},
    {text: "Department Name",width: 25,padding: [0, 1, 0, 1]},
    {text: "Over Head Costs",align: "right",width: 13,padding: [0, 1, 0, 1]},
    {text: "Product Sales",align: "right",width:13,padding: [0, 1, 0, 1]},
    {text: "Total Profit",align: "right",width:13,padding: [0, 1, 0, 1]}
  )
  ui.div({text: "-------------------------------------------------------------------------------"})
  for (var i = 0; i < res.length; i++) {
    idlist.push(res[i].department_id)
    var totalSales = parseFloat(res[i]["sum(products.product_sales)"]) - parseFloat(res[i].over_head_costs);
    ui.div(
      {text: res[i].department_id,width: 12,padding: [0, 1, 0, 1]},

      {text: res[i].department_name,width: 25,padding: [0, 1, 0, 1]},
      {text: "$" + res[i].over_head_costs,align:"right",width: 13,padding: [0, 1, 0, 1]},
      {text: "$" + res[i]["sum(products.product_sales)"],align: "right",width:13,padding: [0, 1, 0, 1]},
      {text: "$" + totalSales,align:"right",width:13,padding: [0, 1, 0, 1]}
  )}
  console.log(ui.toString())
  callback(res) 
}

function runAgain() {
  inquirer.prompt([{type: "confirm", message: "Would you like to do anything else?", name: "confirm", default: true}]).then(function(data) {
    if (data.confirm) supervisorMenu();
    else {
      console.log("Thank you for using Bamazon Supervisor Portal")
      closeConnection()     
    }
  })
}

function reset() { 
  process.stdout.write('\033c') 
}

function closeConnection() {
  connection.end()
}