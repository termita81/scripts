function calculateInterestRate() {
    const principal = parseFloat(prompt("Enter the principal amount: $"));
    const annualInterestRate = parseFloat(prompt("Enter the annual interest rate (in percent): "));

    const monthlyInterestRate = (annualInterestRate / 100) / 12;
    const numberOfMonths = parseInt(prompt("Enter the number of months:"));

    const interest = principal * monthlyInterestRate * numberOfMonths;

    console.log(`The total interest is: $${interest.toFixed(2)}`);
}

calculateInterestRate();