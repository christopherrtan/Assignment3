let params = (new URL(document.location)).searchParams;
let order = [];

// For each product, push the value to the array
params.forEach((value, key) => {
    if (key.startsWith('prod')) {
        order.push(parseInt(value));
    }
});

// Gets the error from the URL and checks if it's empty or null; if not, fills in the error message
let error = params.get('error');
if (error !== null && error !== '') {
    document.getElementById('errorMessages').innerHTML += `<div id="errorMessages" class="alert alert-danger">${error}</div>`;
}

// Gets the parameters from the URL
let fullName = params.get('fullName');
let username = params.get('username');

// Makes values sticky
if (username !== null) {
    document.getElementById('email').value = username;
}

if (fullName !== null) {
    document.getElementById('fullName').value = fullName;
}

// Set the value of the hidden input field to the JSON representation of the order array
document.getElementById('orderParams').value = JSON.stringify(order);
document.getElementById('orderReg').value = JSON.stringify(order);

