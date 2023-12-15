// Set up parameters from the URL, order array, and error value
let params = (new URL(document.location)).searchParams;
let error;

// Define the type for this page
let type = 'ulti';

// Get if there was an error before
error = params.get('error');

// Set the store name for redirect
let storeName = 'storeUlts';
document.getElementById('storeName').value += storeName;

// Get cookie parameters
let signin = decodeURIComponent(getCookieValue('signIn'));
let username = decodeURIComponent(getCookieValue('username'));
let fullName = decodeURIComponent(getCookieValue('fName'));

// Update the page based on user sign-in status
document.addEventListener("DOMContentLoaded", function() {
    if (signin == 'true') {
        // Replace the Sign In link with a sign-out form
        document.getElementById("loginPlaceholder").innerHTML = 
            `<form id="signOutForm" action="signOutKeepCart" method="POST">
            <button type="submit" class="text-button">Sign Out</button>
            </form>`;
    }
});

// Get more parameters, if null or 0, fill them in
let heirlooms = decodeURIComponent(getCookieValue('heirloom'));
let ability = decodeURIComponent(getCookieValue('ability'));
let ulti = decodeURIComponent(getCookieValue('ulti'));
console.log(heirlooms);
if(heirlooms == 'null'){
    console.log('cardsBad');
    heirlooms = '0,0,0,0,0,0';
}
if(ulti == 'null'){
    console.log('cardsBad');
    ulti = '0,0,0,0,0,0';
}
if(ability == 'null'){
    console.log('cardsBad');
    ability = '0,0,0,0,0,0';
}

console.log(heirlooms + ","+ ability);
console.log(ability);

// Append strings to create an array
let totalString = ulti + ","+heirlooms+","+ability;
let arrayString = totalString.split(",");
var order = arrayString.map(function(item) {
    return +item;
});
console.log(order);
var numInCart = order.reduce(function(accumulator, currentValue) {
    return accumulator + currentValue;
}, 0);

// Update the cart count on the page
document.getElementById('cartText').innerHTML = `View Cart (${numInCart})`;

// Get additional parameters from the URL
let totalOnline = params.get('totalOnline');

// Put the full name in the field
document.getElementById('fullNameHere').value = fullName;
document.getElementById('type').value = type;

// Check if username is not empty, if there is a username, populate it all and disable buttons
if(username !== null && fullName !== '' && fullName !== 'null' && signin=='true'){
    // Populate the welcome message and image based on user's name
    document.getElementById('WelcomeDiv').innerHTML += `<h3 class="text">Welcome ${fullName}!</h3>`;
    
    // Fill hidden value with username
    document.getElementById('usernameEntered').value = username;
}

// Check for overflow error and display it
overflow = decodeURIComponent(params.get('overflow'));
console.log(overflow)
console.log(overflow !== 'null' && overflow !== null && typeof(overflow) !== null);
if(error == 'true'){
    // Show an error message if there is an input error
    document.getElementById('errorDiv').innerHTML += `<h2 class="text-danger">Input Error - Please Fix!</h2><br>`;
}
if(overflow == '' || (overflow !== 'null' && overflow !== null && typeof(overflow) !== null)){
    console.log('here');
    document.getElementById('errorDiv').innerHTML += `<h2 class="text-danger">${overflow}</h2><br>`;
}

// Dynamically generate product cards based on the type
for (let i = 0; i < products.length; i++) {
    if(type == products[i]['type']){
        document.querySelector('.row').innerHTML += 
            `<div class="col-md-6 product_card mb-4">
            <div class="card">
                <div class="text-center">
                    <img src="${products[i].image}" class="card-img-top border-top imgUlts" alt="Product Image">
                </div>
                <div class="card-body">
                    <h5 class="card-title">${products[i].card}</h5>
                    <p class="card-text">
                        Price: $${(products[i].price).toFixed(2)}<br>
                        Available: ${products[i].qty_available}<br>
                        Total Sold: ${products[i].total_sold}<br>
                        In Cart: ${order[i]}
                    </p>
                    
                    <input type="text" placeholder="0" name="quantity_textbox" id="${[i]}" class="form-control mb-2" oninput="validateQuantity(this)" onload="validateQuantity(this)" style="border-color: black;">
                    <p id="invalidQuantity${[i]}" class="text-danger"></p>
                    <div class="d-flex justify-content-center">
                        <input type="submit" value="Add to Cart" class="btn btn-primary">
                    </div>
                </div>
            </div>
        </div>`
        validateQuantity(document.getElementById(`${[i]}`));
    }
 ;}

// Function to validate the quantity input
function validateQuantity(quantity) {
    let valMessage = '';
    let quantityNumber = Number(quantity.value);
    let inputElement = document.getElementById(quantity.id);
    inputElement.style.borderColor = "black";

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

    document.getElementById(`invalidQuantity${quantity.id}`).innerHTML = valMessage;
}

// Function to get the value of a cookie by name
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
