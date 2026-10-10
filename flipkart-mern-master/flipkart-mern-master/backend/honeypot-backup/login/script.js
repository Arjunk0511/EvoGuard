document.querySelector("form")
.addEventListener("submit", function(e) {

    e.preventDefault();

    alert("Invalid credentials");

});

console.log("Login honeypot loaded");