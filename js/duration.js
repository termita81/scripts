
#!/usr/bin/env node

function parseDuration(str) {
  const m = str.match(/^(\d+)h?(\d+)m?$/);
  if (!m) throw new Error(`Invalid duration: ${str}`);
  return {
    hours: Number(m[1]),
    minutes: Number(m[2]),
  };
}

function formatDuration(totalMinutes) {
  const total = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${hours}h${String(minutes).padStart(2, "0")}m`;
}

function addDurations(durations) {
  let totalMinutes = 0;
  for (const d of durations) {
    totalMinutes += parseDuration(d).hours * 60 + parseDuration(d).minutes;
  }
  return formatDuration(totalMinutes);
}

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Usage: node index.js <duration> <duration> ...");
  console.error("Example: node index.js 6h32m 34m 8h20m 29m");
  process.exit(1);
}

try {
  console.log(addDurations(args));
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
