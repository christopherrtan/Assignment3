// Importing required modules
const express = require('express');
const app = express();
const fs = require('fs');
const crypto = require('crypto');

// Setting up middleware for handling form data
app.use(express.urlencoded({ extended: true }));

// Setting up middleware for handling cookies
let cookieParser = require('cookie-parser');
app.use(cookieParser());

// Setting up session middleware for managing user sessions
let session = require('express-session');
app.use(session({ secret: "key", resave: true, saveUninitialized: true }));

// Setting up nodemailer for sending emails
const nodemailer = require('nodemailer');
let transporter = nodemailer.createTransport({
  host: "mail.hawaii.edu",
  port: 25,
  secure: false,
  tls: {
    rejectUnauthorized: false
  }
});

// Setting up filename and user registration data
let filename = __dirname + '/user_data.json';
let user_reg_data;

// Arrays to track logged-in users and login requests
let loginUsers = [];
let loginRequests = [];

// Checking if user_data.json file exists and loading data
if (fs.existsSync(filename)) {
  let data = fs.readFileSync(filename, 'utf-8');
  user_reg_data = JSON.parse(data);

  let stats = fs.statSync(filename);
  let fileSize = stats.size;
  console.log(`user_data.json has loaded with ${fileSize} characters`);
} else {
  console.log(`The filename ${filename} does not exist`);
}

// Loading product data and initializing total_sold property
let rawproducts = require(__dirname + '/products.json');
rawproducts.forEach((prod, i) => { prod.total_sold = 0 });

// Sorting products by type
let products = rawproducts.slice().sort((a, b) => {
  if (a.type < b.type) return -1;
  if (a.type > b.type) return 1;
  return 0;
});

// Endpoint for serving product data as JavaScript
app.get("/products.js", function (request, response, next) {
  response.type('.js');
  let products_str = `var products = ${JSON.stringify(products)};`;
  response.send(products_str);
});

// Endpoint for serving invoice page with session and cookie checks
app.get('/invoice.html', function (request, response) {
  let sessID = request.session.id;
  let username = request.cookies['username'];

  if (loginRequests.includes(sessID) && username !== '' && username !== null && username !== 'null') {
    response.sendFile(__dirname + '/public/invoice.html');
  } else {
    response.redirect(`/login.html`);
  }
});

// Serving static files from the public directory
app.use(express.static(__dirname + '/public'));

// Endpoint for handling user login
app.post('/login', function (request, response) {
  // Extracting login details from the form
  let username_input = request.body['username'];
  let password_input = request.body['password'];
  let orderParams = request.body['order'];
  let response_msg = '';
  let errors = false;
  let storedUserData;
  let url = generateProductURL(orderParams);

  // Checking if the user exists
  if (typeof user_reg_data[username_input.toLowerCase()] !== 'undefined') {
    storedUserData = user_reg_data[username_input.toLowerCase()];
    const passwordMatch = verifyPassword(password_input, storedUserData.salt, storedUserData.password);

    if (passwordMatch) {
      response_msg = `${storedUserData.username} is logged in`;
    } else {
      response_msg = 'Incorrect Password';
      errors = true;
    }
  } else {
    response_msg = `${username_input} does not exist`;
    errors = true;
  }

  // Handling login success or failure
  if (!errors) {
    if (!loginUsers.includes(username_input)) {
      loginUsers.push(username_input);
    }

    // Setting cookies and session variables
    response.cookie('username', `${username_input}`, { expires: new Date(Date.now() + 30 * 60000) });
    response.cookie('signIn', `true`, { expires: new Date(Date.now() + 30 * 60000) });
    response.cookie('fName', `${storedUserData.fullName}`, { expires: new Date(Date.now() + 30 * 60000) });
    request.session.username = username_input;
    request.session.fullName = storedUserData.fullName;
    loginRequests.push(request.session.id);

    // Redirecting to invoice page
    response.redirect(`/invoice.html?`);
  } else {
    // Redirecting to login page with an error message
    response.redirect(`/login.html?` + `&error=${response_msg}&username=${username_input}`);
  }
});

// Endpoint for redirecting to registration page with order details
app.post("/toRegister", function (request, response) {
  let orderParams = request.body['order'];
  let url = generateProductURL(orderParams);
  response.redirect(`/register.html?` + url);
});

// Endpoint for redirecting to login page with order details
app.post("/toLogin", function (request, response) {
  let orderParams = request.body['order'];
  let url = generateProductURL(orderParams);
  response.redirect(`/login.html?` + url);
});

// Endpoint for handling user registration
app.post('/register', function (request, response) {
  let errorString = '';
  username_input = request.body.username;
  let orderParams = request.body['order'];
  console.log(orderParams);
  let url = generateProductURL(orderParams);

  // Checking for validation errors in the registration form
  const existingEmail = Object.keys(user_reg_data).find(
    (email) => email.toLowerCase() === request.body.email.toLowerCase()
  );

  if (existingEmail) {
    errorString += 'Email Address Already Exists! ';
  }

  if (!/^[A-Za-z0-9_.]+@[A-Za-z0-9.]{2,}\.[A-Za-z]{2,3}$/.test(request.body.email)) {
    errorString += 'Invalid Email Address Format! ';
  }

  if (request.body.password !== request.body.repeat_password) {
    errorString += 'Passwords Do Not Match! ';
  }

  if (request.body.password.length < 10 || request.body.password.length > 16) {
    errorString += 'Password Length Should Be Between 10 and 16 Characters! ';
  }

  if (!/\d/.test(request.body.password) || !/[!@#$%^&*]/.test(request.body.password)) {
    errorString += 'Password must contain at least one number and one special character! ';
  }

  if (!/^[A-Za-z ]{2,30}$/.test(request.body.fullName)) {
    errorString += 'Invalid Full Name Format';
  }

  // Handling successful registration or redirecting with error message
  if (errorString === '') {
    const new_user = request.body.email.toLowerCase();
    const { salt, hash } = hashPassword(request.body.password);

    user_reg_data[new_user] = {
      password: hash,
      salt: salt,
      fullName: request.body.fullName,
    };
    loginUsers.push(new_user);

    fs.writeFileSync(filename, JSON.stringify(user_reg_data), 'utf-8');
    response.cookie('username', `${username_input}`, { expires: new Date(Date.now() + 30 * 60000) });
    response.cookie('signIn', `true`, { expires: new Date(Date.now() + 30 * 60000) });
    response.cookie('fName', `${request.body.fullName}`, { expires: new Date(Date.now() + 30 * 60000) });
    request.session.username = username_input;
    request.session.fullName = request.body.fullName;
    loginRequests.push(request.session.id);
    response.redirect(`/invoice.html/`);
  } else {
    response.redirect(`/register.html?` + `&error=${errorString}`);
  }
});

// Endpoint for signing out and redirecting to the index page
app.post("/signOutKeepCart", function (request, response) {
  logOut(request, response);
  response.redirect('/index.html')
});

// Endpoint for completing the purchase process
app.post("/complete_purchase", function (request, response) {
  let orderParams = request.body['order'];
  let orderArray = JSON.parse(orderParams);
  let invoice_str = generateHTMLInvoice(orderParams);
  console.log(invoice_str);

  // Updating product data based on the completed purchase
  for (i in orderArray) {
    products[i]['total_sold'] += orderArray[i];
    products[i]['qty_available'] -= orderArray[i];
  }

  // Preparing and sending email with the invoice
  let mailOptions = {
    from: 'crtan@hawaii.edu',
    to: `${request.cookies[`username`]}`,
    subject: `[Heirloom Harbor] May your choice in weaponry lead you to victory!`,
    html: invoice_str
  };

  // Clearing cookies, logging out, and sending email
  response.clearCookie('ability');
  response.clearCookie('ulti');
  response.clearCookie('heirloom');
  logOut(request, response);

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      invoice_str += '<br>There was an error and your invoice could not be emailed.';
    } else {
      invoice_str += `<br>Your invoice was mailed to ${request.cookies[`username`]}`;
    }
    response.send(invoice_str);
    response.redirect('/index.html?&thankYou=true');
  });
});

// Endpoint for updating the cart based on user input
app.post("/updateCart", function (request, response) {
  let order = request.body['position'];
  let type = request.body['type'];
  let amount = request.body['quantity_textbox'];
  let cookieItemArray = request.cookies[`${type}`].split(",");
  cookieItemArray[order] = amount;
  response.cookie(`${type}`, `${cookieItemArray}`);
  response.redirect('/invoice.html');
});

// Endpoint for processing the form submitted during checkout
app.post("/process_form", function (request, response) {
  let username = request.body[`username`];
  let qtys = request.body[`quantity_textbox`];
  let type = request.body['type'];
  let storeName = request.body['storeName'];
  let valid = true;
  let cartOverflow = '';
  let url = '';
  let soldArray = [];
  let quanSave = 0;
  let cookieItemArray = [];
  console.log(request.cookies[type]);

  // Initializing or retrieving the user's cart data
  if (!request.cookies[type]) {
    for (let i = 0; i < qtys.length; i++) {
      cookieItemArray.push(0);
    }
  } else {
    cookieItemArray = request.cookies[type].split(",");
  }

  // Validating product quantities and checking availability
  for (i in products) {
    if (type == products[i][`type`]) {
      let q = Number(qtys[quanSave]);
      let qCart = Number(qtys[quanSave]) + Number(cookieItemArray[quanSave]);

      if (validateQuantity(q) == '') {
        if ((products[i]['qty_available'] - Number(q)) < 0 || products[i]['qty_available'] - Number(qCart) < 0) {
          if (products[i]['qty_available'] - Number(qCart) < 0) {
            cartOverflow += `There is not enough ${products[i]['heirloom']}s to add to cart. `;
            console.log(cartOverflow);
          }
          valid = false;
          url += `&prod${i}=${q}`;
        } else {
          soldArray[quanSave] = Number(q);
          url += `&prod${i}=${q}`;
        }
      } else {
        valid = false;
        url += `&prod${i}=${q}`;
      }
      quanSave++;
    }
  }

  // Redirecting to the store page with errors or updating the cart
  if (valid == false) {
    response.redirect(`${storeName}.html?error=true` + `&overflow=${cartOverflow}`);
  } else {
    let resultArray = [];
    for (let i = 0; i < soldArray.length; i++) {
      resultArray[i] = Number(cookieItemArray[i]) + Number(soldArray[i]);
    }
    console.log(resultArray);
    response.cookie(`${type}`, `${resultArray}`);
    const sesID = request.session.id;

    if (loginRequests.includes(sesID)) {
      response.redirect(`${storeName}.html?`);
    } else {
      response.redirect('login.html?');
    }
  }
});

// Middleware for all routes
app.all('*', function (request, response, next) {
  next();
});

// Setting up the server to listen on port 8080
app.listen(8080, () => console.log(`listening on port 8080`));

// Function for validating product quantity
function validateQuantity(quantity) {
  if (isNaN(quantity)) return "Not a Number";
  else if (quantity < 0 && !Number.isInteger(quantity)) return "Negative Inventory & Not an Integer";
  else if (quantity < 0) return "Negative Inventory";
  else if (!Number.isInteger(quantity)) return "Not an Integer";
  else return "";
}

// Function for generating a URL string from an order array
function generateProductURL(orderString) {
  let orderArray = JSON.parse(orderString);
  let orderURL = ``;
  for (i in orderArray) {
    orderURL += `&prod${i}=${orderArray[i]}`;
  }
  return orderURL;
}

// Function for logging out and clearing session and cookies
function logOut(request, response) {
  response.clearCookie('username');
  response.clearCookie('signIn');
  response.clearCookie('fName');
  loginUsers.pop(request.cookies['id']);
  request.session.destroy();
}

// Function for hashing a password
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

// Function for verifying a password
function verifyPassword(password, salt, storedHash) {
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === storedHash;
}

// Function for generating an HTML invoice from an order array
function generateHTMLInvoice(order) {
  // Initializing HTML string for the invoice table
  let html = "<table id='invoiceTable'><tr><th>Item</th><th>Quantity</th><th>Price</th><th>Extended Price</th></tr>";
  
  // Variables to track subtotal, tax, shipping, and product counts
  let subtotal = 0;
  let taxAmount = 0;
  let shipping = 0;
  let ultiCount = 0, abilityCount = 0, heirloomCount = 0;
  let hasErrors = false;

  // Parsing the order string into an array
  order = JSON.parse(order);

  // Looping through the products to create rows in the invoice table
  for (let i = 0; i < products.length; i++) {
    let item = products[i];
    let itemQuantity = Number(order[i]);
    let validationMessage = validateQuantity(itemQuantity);
    let originalPosition;

    // Determining the category of the product for positioning
    switch (item.type) {
      case 'ulti': originalPosition = ultiCount++; break;
      case 'heirloom': originalPosition = heirloomCount++; break;
      case 'ability': originalPosition = abilityCount++; break;
      default: originalPosition = -1;
    }

    // Checking for validation errors or non-positive quantities
    if (validationMessage !== "") {
      hasErrors = true;
    } else if (itemQuantity > 0) {
      // Calculating extended price and updating subtotal
      let extendedPrice = item.price * itemQuantity;
      subtotal += extendedPrice;
      
      // Adding a row to the invoice table
      html += `<tr><td>${item.card}</td><td>${itemQuantity}</td><td>$${item.price.toFixed(2)}</td><td>$${extendedPrice.toFixed(2)}</td></tr>`;
    }
  }

  // Calculating tax, shipping, and total
  taxAmount = subtotal * 0.0575;
  shipping = subtotal <= 50 ? 2 : (subtotal <= 100 ? 5 : subtotal * 0.05);
  let total = subtotal + taxAmount + shipping;

  // Adding subtotal, tax, shipping, and total rows to the invoice table
  html += `<tr><td colspan="3">Subtotal</td><td colspan="2">$${subtotal.toFixed(2)}</td></tr>`;
  html += `<tr><td colspan="3">Tax</td><td colspan="2">$${taxAmount.toFixed(2)}</td></tr>`;
  html += `<tr><td colspan="3">Shipping</td><td colspan="2">$${shipping.toFixed(2)}</td></tr>`;
  html += `<tr><td colspan="3">Total</td><td colspan="2">$${total.toFixed(2)}</td></tr>`;

  // Closing the invoice table
  html += "</table>";

  // Returning the generated HTML for the invoice
  return html;
}
