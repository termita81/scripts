// ─── Default values (edit these when using in browser console) ───────────────
var DEFAULTS = {
  principal: 10000,
  rate: 5,       // annual rate in percent
  years: 10,
  monthly: 0,    // default contribution added each month
  overrides: {}, // per-month contribution overrides, e.g. { 4: 50, 8: 342 }
  verbose: false,
  json: false
};

// ─── Core calculation (monthly compounding) ───────────────────────────────────

function buildSchedule(principal, annualRatePercent, years, monthly, overrides) {
  var monthlyRate = annualRatePercent / 100 / 12;
  var totalMonths = years * 12;
  var schedule = [];
  var openingBalance = principal;
  var totalContributed = 0;

  for (var month = 1; month <= totalMonths; month++) {
    var contribution = overrides.hasOwnProperty(month) ? overrides[month] : monthly;
    var interest = openingBalance * monthlyRate;
    var closingBalance = openingBalance + interest + contribution;
    totalContributed += contribution;
    schedule.push({
      month: month,
      opening: openingBalance,
      interest: interest,
      contribution: contribution,
      closing: closingBalance,
      totalContributed: totalContributed,
      totalInterest: closingBalance - principal - totalContributed
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

// ─── Output: summary ─────────────────────────────────────────────────────────
function printSummary(principal, rate, years, monthly, overrides, schedule) {
  var last = schedule[schedule.length - 1];
  var apy = effectiveAPY(rate);
  var hasContributions = monthly > 0 || Object.keys(overrides).length > 0;

  var lines = [
    '',
    'Compound Interest Summary',
    '\u2500'.repeat(34),
    'Principal:    ' + pad(formatCurrency(principal), 14, true),
    'Rate:         ' + rate + '% annually',
    'Compounded:   monthly',
    'Duration:     ' + years + ' year' + (years !== 1 ? 's' : '')
  ];

  if (hasContributions) {
    lines.push('Contribution: ' + pad(formatCurrency(monthly) + '/mo', 14, true));
    var overrideKeys = Object.keys(overrides);
    if (overrideKeys.length > 0) {
      var overrideStr = overrideKeys.map(function(m) { return 'month ' + m + ': ' + formatCurrency(overrides[m]); }).join(', ');
      lines.push('Overrides:    ' + overrideStr);
    }
  }

  lines.push('');
  lines.push('Final Balance:      ' + pad(formatCurrency(last.closing), 14, true));
  if (hasContributions) {
    lines.push('  Principal:        ' + pad(formatCurrency(principal), 14, true));
    lines.push('  Contributions:    ' + pad(formatCurrency(last.totalContributed), 14, true));
    lines.push('  Interest earned:  ' + pad(formatCurrency(last.totalInterest), 14, true));
  } else {
    lines.push('Total Interest:     ' + pad(formatCurrency(last.totalInterest), 14, true));
  }
  // APY: effective annual return after compounding (always higher than nominal rate for monthly compounding)
  lines.push('Effective Annual Percentage Yield:      ' + pad(formatPercent(apy), 14, true));
  lines.push('');

  lines.forEach(function(l) { console.log(l); });
}

// ─── Output: verbose breakdown ────────────────────────────────────────────────
function printBreakdown(schedule) {
  var hasContributions = schedule.some(function(r) { return r.contribution !== 0; });
  var col = hasContributions ? [7, 14, 14, 14, 14, 14, 14] : [7, 14, 14, 14, 14, 14];
  var sepLen = col.reduce(function(a, b) { return a + b; }, 0) + (col.length - 1) * 3;
  var sep = '\u2500'.repeat(sepLen);

  console.log('Month-by-Month Breakdown');
  console.log(sep);

  var header = pad('Month', col[0]) + ' \u2502 ' +
    pad('Opening', col[1]) + ' \u2502 ' +
    pad('Interest', col[2]) + ' \u2502 ';
  if (hasContributions) header += pad('Deposit', col[3]) + ' \u2502 ';
  header += pad('Added', col[hasContributions ? 4 : 3]) + ' \u2502 ' +
    pad('Closing', col[hasContributions ? 5 : 4]) + ' \u2502 ' +
    pad('Total Interest', col[hasContributions ? 6 : 5]);
  console.log(header);
  console.log(sep);
  console.log(pad('Year 1', sepLen, true));
  console.log(sep);

  schedule.forEach(function(row) {
    if (row.month > 1 && (row.month - 1) % 12 === 0) {
      console.log(sep);
      console.log(pad('Year ' + Math.floor((row.month - 1) / 12 + 1), sepLen, true));
      console.log(sep);
    }
    var added = row.interest + row.contribution;
    var line = pad(row.month, col[0]) + ' \u2502 ' +
      pad(formatCurrency(row.opening), col[1]) + ' \u2502 ' +
      pad(formatCurrency(row.interest), col[2]) + ' \u2502 ';
    if (hasContributions) line += pad(formatCurrency(row.contribution), col[3]) + ' \u2502 ';
    line += pad(formatCurrency(added), col[hasContributions ? 4 : 3]) + ' \u2502 ' +
      pad(formatCurrency(row.closing), col[hasContributions ? 5 : 4]) + ' \u2502 ' +
      pad(formatCurrency(row.totalInterest), col[hasContributions ? 6 : 5]);
    console.log(line);
  });

  console.log('');
}

// ─── Output: JSON ─────────────────────────────────────────────────────────────
function printJSON(principal, rate, years, monthly, overrides, schedule) {
  var last = schedule[schedule.length - 1];
  var output = {
    params: {
      principal: principal,
      rate: rate,
      years: years,
      monthly: monthly,
      overrides: overrides
    },
    summary: {
      finalBalance: round2(last.closing),
      totalContributed: round2(last.totalContributed),
      totalInterest: round2(last.totalInterest),
      effectiveAPY: round2(effectiveAPY(rate))
    },
    schedule: schedule.map(function(row) {
      return {
        month: row.month,
        opening: round2(row.opening),
        interest: round2(row.interest),
        contribution: round2(row.contribution),
        closing: round2(row.closing),
        totalContributed: round2(row.totalContributed),
        totalInterest: round2(row.totalInterest)
      };
    })
  };
  console.log(JSON.stringify(output, null, 2));
}

// ─── Output: CSV ──────────────────────────────────────────────────────────────
function printCSV(schedule) {
  var hasContributions = schedule.some(function(r) { return r.contribution !== 0; });
  var headers = ['month', 'opening', 'interest'];
  if (hasContributions) headers.push('deposit');
  headers.push('added', 'closing', 'total_interest');
  console.log(headers.join(','));
  schedule.forEach(function(row) {
    var added = row.interest + row.contribution;
    var cols = [row.month, round2(row.opening), round2(row.interest)];
    if (hasContributions) cols.push(round2(row.contribution));
    cols.push(round2(added), round2(row.closing), round2(row.totalInterest));
    console.log(cols.join(','));
  });
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

// ─── Help ─────────────────────────────────────────────────────────────────────
function printHelp(isCLI) {
  var lines = [''];

  if (isCLI) {
    lines = lines.concat([
      'Usage: node interest-calculator.js [options]',
      '',
      'Options:',
      '  -p, --principal <n>       Starting balance            (default: ' + DEFAULTS.principal + ')',
      '  -r, --rate <n>            Annual interest rate in %   (default: ' + DEFAULTS.rate + ')',
      '  -y, --years <n>           Duration in years           (default: ' + DEFAULTS.years + ')',
      '  -m, --monthly <n>         Fixed deposit each month    (default: ' + DEFAULTS.monthly + ')',
      '  -o, --override "M:N,..."  Per-month deposit overrides (e.g. "4:50,8:342")',
      '  -v, --verbose             Show month-by-month breakdown table',
      '  -j, --json                Output results as JSON',
      '  -c, --csv                 Output schedule as CSV',
      '  -h, --help                Show this help message',
      '',
      'Examples:',
      '  node interest-calculator.js --principal 10000 --rate 5 --years 10',
      '  node interest-calculator.js --principal 5000 --rate 4.5 --years 5 --monthly 200 --verbose',
      '  node interest-calculator.js --principal 10000 --rate 5 --years 1 --monthly 100 --override "4:50,8:342" --json',
      '  node interest-calculator.js --principal 10000 --rate 5 --years 10 --csv > output.csv',
    ]);
  } else {
    lines = lines.concat([
      'interest-calculator.js — browser console usage',
      '',
      'Option 1: edit the DEFAULTS at the top of the file, then paste the whole thing again.',
      '',
      'Option 2: call main() directly with an args array:',
      '  main(["--principal", "10000", "--rate", "5", "--years", "10"])',
      '  main(["--principal", "5000", "--rate", "4.5", "--years", "5", "--monthly", "200", "--verbose"])',
      '  main(["--principal", "10000", "--rate", "5", "--years", "1", "--monthly", "100", "--override", "4:50,8:342"])',
      '',
      'Output flags: --verbose (month table)  --json  --csv',
    ]);
  }

  lines = lines.concat([
    '',
    'APY (Annual Percentage Yield): the effective annual return after compounding.',
    'Higher than the nominal rate because interest compounds each month.',
    ''
  ]);

  console.log(lines.join('\n'));
}

// ─── CLI argument parsing ─────────────────────────────────────────────────────
function parseArgs(argv) {
  var opts = {
    principal: DEFAULTS.principal,
    rate: DEFAULTS.rate,
    years: DEFAULTS.years,
    monthly: DEFAULTS.monthly,
    overrides: {},
    verbose: false,
    json: false,
    csv: false
  };

  var shorthands = { p: 'principal', r: 'rate', y: 'years', m: 'monthly', o: 'override', v: 'verbose', j: 'json', c: 'csv', h: 'help' };

  for (var i = 0; i < argv.length; i++) {
    var raw = argv[i];
    var key = raw.replace(/^-+/, '');
    if (/^-[a-z]$/.test(raw)) key = shorthands[key] || key;
    if (key === 'verbose' || key === 'json' || key === 'csv' || key === 'help') {
      if (key === 'verbose') opts.verbose = true;
      else if (key === 'json') opts.json = true;
      else if (key === 'csv') opts.csv = true;
      else if (key === 'help') { printHelp(); return null; }
    } else {
      var val = argv[i + 1];
      if (key === 'principal') opts.principal = parseFloat(val);
      else if (key === 'rate') opts.rate = parseFloat(val);
      else if (key === 'years') opts.years = parseInt(val, 10);
      else if (key === 'monthly') opts.monthly = parseFloat(val);
      else if (key === 'override') {
        val.split(',').forEach(function(pair) {
          var parts = pair.split(':');
          opts.overrides[parseInt(parts[0], 10)] = parseFloat(parts[1]);
        });
      } else { console.error('Unknown option: ' + raw); }
      i++;
    }
  }

  return opts;
}

// ─── Entry point ──────────────────────────────────────────────────────────────
function main(argv, isCLI) {
  if (!argv || argv.length === 0) {
    printHelp(isCLI); return;
  }
  if (argv.indexOf('--help') !== -1 || argv.indexOf('-h') !== -1) {
    printHelp(isCLI); return;
  }
  var opts = parseArgs(argv);
  if (!opts) return;

  var schedule = buildSchedule(opts.principal, opts.rate, opts.years, opts.monthly, opts.overrides);

  if (opts.json) {
    printJSON(opts.principal, opts.rate, opts.years, opts.monthly, opts.overrides, schedule);
  } else if (opts.csv) {
    printCSV(schedule);
  } else {
    printSummary(opts.principal, opts.rate, opts.years, opts.monthly, opts.overrides, schedule);
    if (opts.verbose) printBreakdown(schedule);
  }
}

// ─── Auto-run (works in Node/Bun and browser) ─────────────────────────────────
(function() {
  var isCLI = typeof process !== 'undefined' &&
              typeof process.argv !== 'undefined' &&
              process.argv.length > 1 &&
              process.argv[1] &&
              process.argv[1].indexOf('interest') !== -1;

  if (isCLI) {
    main(process.argv.slice(2), true);
  } else {
    main([], false);
  }
})();
