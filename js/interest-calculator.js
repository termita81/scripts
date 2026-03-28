// ─── Default values (edit these when using in browser console) ───────────────
var DEFAULTS = {
  principal: 10000,
  rate: 5,    // annual rate in percent
  years: 10
};

// ─── Core calculation (monthly compounding) ───────────────────────────────────

function buildSchedule(principal, annualRatePercent, years) {
  var monthlyRate = annualRatePercent / 100 / 12;
  var totalMonths = years * 12;
  var schedule = [];
  var openingBalance = principal;

  for (var month = 1; month <= totalMonths; month++) {
    var interest = openingBalance * monthlyRate;
    var closingBalance = openingBalance + interest;
    schedule.push({
      month: month,
      opening: openingBalance,
      interest: interest,
      closing: closingBalance,
      totalInterest: closingBalance - principal
    });
    openingBalance = closingBalance;
  }

  return schedule;
}

function effectiveAPY(annualRatePercent) {
  var r = annualRatePercent / 100;
  return (Math.pow(1 + r / 12, 12) - 1) * 100;
}

// ─── Formatting ───────────────────────────────────────────────────────────────
function formatCurrency(n) {
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatPercent(n) {
  return n.toFixed(3).replace(/\.?0+$/, '') + '%';
}

function pad(str, width, right) {
  str = String(str);
  while (str.length < width) str = right ? str + ' ' : ' ' + str;
  return str;
}

// ─── Output ───────────────────────────────────────────────────────────────────
function printSummary(principal, rate, years, schedule) {
  var last = schedule[schedule.length - 1];
  var apy = effectiveAPY(rate);

  var lines = [
    '',
    'Compound Interest Summary',
    '\u2500'.repeat(34),
    'Principal:    ' + pad(formatCurrency(principal), 14, true),
    'Rate:         ' + rate + '% annually',
    'Compounded:   monthly',
    'Duration:     ' + years + ' year' + (years !== 1 ? 's' : ''),
    '',
    'Final Balance:    ' + pad(formatCurrency(last.closing), 14, true),
    'Total Interest:   ' + pad(formatCurrency(last.totalInterest), 14, true),
    'Effective APY:    ' + pad(formatPercent(apy), 14, true),
    ''
  ];

  lines.forEach(function(l) { console.log(l); });
}

function printBreakdown(schedule) {
  var col = [7, 14, 14, 14, 14];
  var sep = '\u2500'.repeat(col[0] + col[1] + col[2] + col[3] + col[4] + 12);

  console.log('Month-by-Month Breakdown');
  console.log(sep);
  console.log(
    pad('Month', col[0]) + ' \u2502 ' +
    pad('Opening', col[1]) + ' \u2502 ' +
    pad('Interest', col[2]) + ' \u2502 ' +
    pad('Closing', col[3]) + ' \u2502 ' +
    pad('Total Interest', col[4])
  );
  console.log(sep);

  schedule.forEach(function(row) {
    console.log(
      pad(row.month, col[0]) + ' \u2502 ' +
      pad(formatCurrency(row.opening), col[1]) + ' \u2502 ' +
      pad(formatCurrency(row.interest), col[2]) + ' \u2502 ' +
      pad(formatCurrency(row.closing), col[3]) + ' \u2502 ' +
      pad(formatCurrency(row.totalInterest), col[4])
    );
  });

  console.log('');
}

// ─── CLI argument parsing ─────────────────────────────────────────────────────
function parseArgs(argv) {
  var opts = { principal: DEFAULTS.principal, rate: DEFAULTS.rate, years: DEFAULTS.years };

  for (var i = 0; i < argv.length; i += 2) {
    var key = argv[i].replace(/^--/, '');
    var val = argv[i + 1];
    if (key === 'principal') opts.principal = parseFloat(val);
    else if (key === 'rate') opts.rate = parseFloat(val);
    else if (key === 'years') opts.years = parseInt(val, 10);
    else { console.error('Unknown option: --' + key); }
  }

  return opts;
}

// ─── Entry point ──────────────────────────────────────────────────────────────
function main(argv) {
  var opts = (argv && argv.length > 0) ? parseArgs(argv) : { principal: DEFAULTS.principal, rate: DEFAULTS.rate, years: DEFAULTS.years };
  var schedule = buildSchedule(opts.principal, opts.rate, opts.years);
  printSummary(opts.principal, opts.rate, opts.years, schedule);
  printBreakdown(schedule);
}

// ─── Auto-run (works in Node/Bun and browser) ─────────────────────────────────
(function() {
  var isCLI = typeof process !== 'undefined' &&
              typeof process.argv !== 'undefined' &&
              process.argv.length > 1 &&
              process.argv[1] &&
              process.argv[1].indexOf('interest') !== -1;

  if (isCLI) {
    main(process.argv.slice(2));
  } else {
    main();
  }
})();
