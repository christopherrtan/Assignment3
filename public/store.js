// Extract parameters from the URL, including error information and store type
let params = (new URL(document.location)).searchParams;
let error;

// Determine the type of store being displayed (e.g., 'heirloom')
let type = 'heirloom';

// Retrieve error information from URL parameters
error = params.get('error');

// Get the store name for redirection
let storeName = 'store';
document.getElementById('storeName').value += storeName;

// Retrieve user authentication information from cookies
let signin = decodeURIComponent(getCookieValue('signIn'));
let username = decodeURIComponent(getCookieValue('username'));
let fullName = decodeURIComponent(getCookieValue('fName'));

// Execute actions once the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function() {
    // Replace the Sign In link with a Sign Out button if the user is signed in
    if (signin == 'true') {
        document.getElementById("loginPlaceholder").innerHTML = 
            `<form id="signOutForm" action="signOutKeepCart" method="POST">
            <button type="submit" class="text-button">Sign Out</button>
            </form>`;
    }
});

// Retrieve product information from cookies or initialize with zeros if null
let heirlooms = decodeURIComponent(getCookieValue('heirloom'));
let ability = decodeURIComponent(getCookieValue('ability'));
let ulti = decodeURIComponent(getCookieValue('ulti'));

// Initialize product quantities if they are null
if (heirlooms == 'null') heirlooms = '0,0,0,0,0,0';
if (ulti == 'null') ulti = '0,0,0,0,0,0';
if (ability == 'null') ability = '0,0,0,0,0,0';

// Concatenate product quantities into a single string and create an array
let totalString = ulti + "," + heirlooms + "," + ability;
let arrayString = totalString.split(",");
var order = arrayString.map(function(item) {
    return +item;
});
var numInCart = order.reduce(function(accumulator, currentValue) {
    return accumulator + currentValue;
}, 0);

// Update the cart text with the total number of items in the cart
document.getElementById('cartText').innerHTML = `View Cart (${numInCart})`;

// Retrieve additional parameters from the URL
let totalOnline = params.get('totalOnline');

// Populate the fullName field and set the store type
document.getElementById('fullNameHere').value = fullName;
document.getElementById('type').value = type;

// Check if the username is not empty and the user is signed in, then populate and disable buttons
if (username !== null && fullName !== '' && fullName !== 'null' && signin == 'true') {
    // Disable buttons
    
    // Set the welcomeDiv and add the image and message depending on size 
    document.getElementById('WelcomeDiv').innerHTML += `<h3 class="text">Welcome ${fullName}!</h3>`;
    
    // Fill the hidden value
    document.getElementById('usernameEntered').value = username;
}

// Retrieve overflow information from URL parameters and display error messages
overflow = decodeURIComponent(params.get('overflow'));
if (error == 'true') {
    document.getElementById('errorDiv').innerHTML += `<h2 class="text-danger">Input Error - Please Fix!</h2><br>`;
}
if (overflow == '' || (overflow !== 'null' && overflow !== null && typeof(overflow) !== null)) {
    console.log('here');
    document.getElementById('errorDiv').innerHTML += `<h2 class="text-danger">${overflow}</h2><br>`;
}

// Iterate through each product in the 'products' array
for (let i = 0; i < products.length; i++) {
    // Check if the product type matches the specified 'type'
    if (type == products[i]['type']) {
        // Create and append a product card to the '.row' element
        document.querySelector('.row').innerHTML += 
            `<div class="col-md-6 product_card mb-4">
                <div class="card">
                    <div class="text-center">
                        <img src="${products[i].image}" class="card-img-top border-top" alt="Product Image">
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${products[i].card}</h5>
                        <p class="card-text">
                            Price: $${(products[i].price).toFixed(2)}<br>
                            Available: ${products[i].qty_available}<br>
                            Total Sold: ${products[i].total_sold}<br>
                            In Cart: ${order[i]}
                        </p>
                        
                        <!-- Input field for quantity with initial value of 0, linked to validation function -->
                        <input type="text" placeholder="0" name="quantity_textbox" id="${[i]}" class="form-control mb-2" oninput="validateQuantity(this)" onload="validateQuantity(this)" style="border-color: black;">
                        <!-- Display area for validation error messages -->
                        <p id="invalidQuantity${[i]}" class="text-danger"></p>
                        
                        <!-- Button to add the product to the cart -->
                        <div class="d-flex justify-content-center">
                            <input type="submit" value="Add to Cart" class="btn btn-primary">
                        </div>
                    </div>
                </div>
            </div>`;
        
        // Run the validation function for the current quantity input
        validateQuantity(document.getElementById(`${[i]}`));
    }
}


// Runs to generate a validation message for quantity input
function validateQuantity(quantity) {
    // Set variables and grab the number from the quantity and set it to a number
    let valMessage = '';
    let quantityNumber = Number(quantity.value);
    let inputElement = document.getElementById(quantity.id);

    // Reset the border color to black before performing validation
    inputElement.style.borderColor = "black";

    // Check for validation errors and set the border color to red if an error is found
    if (isNaN(quantityNumber)) {
        valMessage = "Please Enter a Number";
        inputElement.style.borderColor = "red";
    } else if (quantityNumber < 0 && !Number.isInteger(quantityNumber)) {
        valMessage = "Please Enter a Positive Integer";
        inputElement.style.borderColor = "red";
    } else if (quantityNumber < 0) {
        valMessage = "Please Enter a Positive Value";
        inputElement.style.borderColor = "red";
    } else if (!Number.isInteger(quantityNumber)) {
        valMessage = "Please Enter an Integer";
        inputElement.style.borderColor = "red";
    } else if (quantityNumber > products[quantity.id]['qty_available']) {
        valMessage = "We Do Not Have " + quantityNumber + " Available!";
        inputElement.style.borderColor = "red";
        inputElement.value = products[quantity.id]['qty_available'];
    } else {
        valMessage = '';
    }

    // Set the valMessage to the innerHTML of the section
    document.getElementById(`invalidQuantity${quantity.id}`).innerHTML = valMessage;
}

// Function to get the value of a specified cookie
function getCookieValue(cookieName){
    let cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++){
        let cookiePair = cookies[i].trim().split('=');
        if(cookiePair[0] === cookieName){
            return cookiePair[1]
        }
    }
    return null;
};
