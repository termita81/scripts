#!/usr/bin/env node
/**
 * sync-local-models.mjs
 *
 * Synchronize the model lists for local Ollama / Omlx (OMLX) endpoints into
 * pi's ~/.pi/agent/models.json.
 *
 * It discovers the live model catalog from each running service, then updates
 * the `models` array of the four local providers (ollama / docker-ollama /
 * omlx / docker-omlx). Provider config (baseUrl, api, apiKey, compat) and the
 * `inception` provider are left untouched.
 *
 * The script tries each service's endpoints in order (localhost, then
 * host.docker.internal) and uses the first one that responds, so it works both
 * on the host and inside the Docker sandbox. If a service is unreachable the
 * script aborts WITHOUT writing, so it never clobbers models.json with a stale
 * or empty list.
 *
 * Usage:
 *   node sync-local-models.mjs [--models PATH] [--dry-run]
 *
 * Options:
 *   --models PATH   Path to models.json (default: ~/.pi/agent/models.json)
 *   --dry-run       Fetch and print what would change without writing.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

const DEFAULT_MODELS = path.join(homedir(), ".pi", "agent", "models.json");

// Service name -> (provider names to update, candidate endpoints)
// Endpoints are probed in order; first reachable wins.
const SERVICES = {
  ollama: {
    providers: ["ollama", "docker-ollama"],
    endpoints: [
      "http://localhost:11434/v1/models",
      "http://host.docker.internal:11434/v1/models",
    ],
    apiKey: "ollama",
  },
  omlx: {
    providers: ["omlx", "docker-omlx"],
    endpoints: [
      "http://localhost:8642/v1/models",
      "http://host.docker.internal:8642/v1/models",
    ],
    apiKey: "aaaaaa00",
  },
};

/** Fetch sorted model IDs from an endpoint, or null on any failure. */
async function fetchModels(endpoint, apiKey) {
  try {
    const res = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const ids = (data.data || [])
      .map((m) => m && m.id)
      .filter(Boolean);
    return [...new Set(ids)].sort();
  } catch {
    return null;
  }
}

function parseArgs(argv) {
  const args = { models: DEFAULT_MODELS, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--models") args.models = argv[++i];
    else {
      console.error(`error: unknown argument: ${a}`);
      process.exit(1);
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  let cfg;
  try {
    cfg = JSON.parse(readFileSync(args.models, "utf8"));
  } catch (err) {
    console.error(`error: cannot read models.json (${args.models}): ${err.message}`);
    process.exit(1);
  }

  const providers = cfg.providers || {};
  const updates = {};       // provider name -> [model ids]
  const usedEndpoints = {}; // service -> endpoint used

  for (const [service, spec] of Object.entries(SERVICES)) {
    let newIds = null;
    for (const ep of spec.endpoints) {
      const ids = await fetchModels(ep, spec.apiKey);
      if (ids !== null) {
        newIds = ids;
        usedEndpoints[service] = ep;
        break;
      }
    }
    if (newIds === null) {
      console.error(
        `error: cannot reach ${service} (tried all endpoints); aborting without writing`
      );
      process.exit(1);
    }
    for (const prov of spec.providers) updates[prov] = newIds;
    console.log(`  ${service}: fetched ${newIds.length} models via ${usedEndpoints[service]}`);
  }

  const newProviders = { ...providers };
  for (const [prov, ids] of Object.entries(updates)) {
    if (!(prov in newProviders)) {
      console.warn(`warning: provider ${prov} not present in models.json; skipping`);
      continue;
    }
    newProviders[prov] = {
      ...newProviders[prov],
      models: ids.map((id) => ({ id })),
    };
  }

  if (args.dryRun) {
    console.log("\n(dry-run) would write these models:");
    for (const [prov, ids] of Object.entries(updates)) {
      console.log(`  ${prov}: ${JSON.stringify(ids)}`);
    }
    return;
  }

  const newCfg = { ...cfg, providers: newProviders };
  // Validate before writing to avoid corrupting the file.
  JSON.stringify(newCfg);

  writeFileSync(args.models, JSON.stringify(newCfg, null, 2) + "\n");

  console.log(`\nwrote ${args.models}`);
  for (const [prov, ids] of Object.entries(updates)) {
    console.log(`  ${prov}: ${ids.length} models`);
  }
}

main().catch((err) => {
  console.error(`error: ${err.message}`);
  process.exit(1);
});
