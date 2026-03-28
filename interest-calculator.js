#!/usr/bin/env node

/**
 * Deposit Interest Calculator
 * Calculates compound interest with tiered rates and variable monthly deposits
 * Outputs JSON with monthly breakdown
 */

const fs = require('fs');

/**
 * Parse command line arguments
 */
function parseArgs() {
    const args = process.argv.slice(2);
    
    const config = {
        initialDeposit: parseFloat(args[0]) || 0,
        monthlyDeposit: parseFloat(args[1]) || 0,
        months: parseInt(args[2]) || 12,
        tieredRates: JSON.parse(args[3] || '[]'),
        variableDeposits: JSON.parse(args[4] || '{}')
    };
    
    return config;
}

/**
 * Calculate interest for a given balance using tiered rates
 * @param {number} balance - Current account balance
 * @param {number} monthlyRate - Monthly interest rate (as decimal)
 * @returns {number} Interest earned for this month
 */
function calculateTieredInterest(balance, monthlyRate) {
    let interest = 0;
    let remainingBalance = balance;
    
    for (const tier of monthlyRate) {
        if (remainingBalance <= 0) break;
        
        const tierAmount = Math.min(remainingBalance, tier.limit);
        const tierInterest = tierAmount * tier.rate;
        interest += tierInterest;
        remainingBalance -= tierAmount;
    }
    
    return interest;
}

/**
 * Main calculation function
 * @param {Object} config - Configuration object
 * @returns {Object} Calculation results
 */
function calculate(config) {
    const { initialDeposit, monthlyDeposit, months, tieredRates, variableDeposits } = config;
    
    // Convert tiered rates from annual to monthly
    const monthlyRate = tieredRates.map(tier => ({
        ...tier,
        rate: tier.rate / 100 / 12
    }));
    
    // Initialize account state
    let balance = initialDeposit;
    let totalInterest = 0;
    
    // Monthly breakdown
    const monthlyBreakdown = [];
    
    // Process each month
    for (let month = 1; month <= months; month++) {
        // Add variable deposit if specified for this month
        if (variableDeposits[month]) {
            balance += variableDeposits[month];
        } else {
            balance += monthlyDeposit;
        }
        
        // Calculate interest for this month
        const interest = calculateTieredInterest(balance, monthlyRate);
        totalInterest += interest;
        
        // Record monthly state
        monthlyBreakdown.push({
            month,
            deposit: variableDeposits[month] || monthlyDeposit,
            interest,
            balance
        });
    }
    
    return {
        config: {
            initialDeposit,
            monthlyDeposit,
            months,
            tieredRates,
            variableDeposits
        },
        summary: {
            finalBalance: balance,
            totalInterest,
            totalDeposited: initialDeposit + (monthlyDeposit * months) + Object.values(variableDeposits).reduce((a, b) => a + b, 0)
        },
        monthlyBreakdown
    };
}

/**
 * Main entry point
 */
function main() {
    const config = parseArgs();
    const results = calculate(config);
    
    // Output as JSON
    console.log(JSON.stringify(results, null, 2));
}

// Run if executed directly
if (require.main === module) {
    main();
}

module.exports = { calculate, parseArgs, calculateTieredInterest };
