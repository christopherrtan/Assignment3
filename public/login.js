// Extract parameters from the URL and initialize the order array
let params = (new URL(document.location)).searchParams;
let order = [];

// For each product, push the value to the array
params.forEach((value, key) => {
    if (key.startsWith('prod')) {
        order.push(parseInt(value));
    }
});

// Retrieve and display error messages if present in the URL
let error = params.get('error');
if (error !== null && error !== '') {
    document.getElementById('errorMessages').innerHTML += `<div id="errorMessages" class="alert alert-danger">${error}</div>`;
}

// Get the username from the URL and make it sticky in the input field
let username = params.get('username');
document.getElementById('username').value = username;

// Set the value of the hidden input fields for order array
document.getElementById('orderInput').value = JSON.stringify(order);
document.getElementById('orderReg').value = JSON.stringify(order);
