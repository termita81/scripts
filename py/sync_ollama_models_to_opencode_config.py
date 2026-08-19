#!/usr/bin/env python3
"""
Sync locally-pulled Ollama models into opencode.json's provider.ollama.models block.

opencode's auto-discovery for OpenAI-compatible local providers (Ollama, LM Studio)
isn't live in the current stable release (see anomalyco/opencode#12243) - models
have to be listed explicitly for them to show up in `/model`. This script queries
Ollama directly and updates the config for you, without touching anything else
(other providers, permissions, etc. are left as-is).

Usage:
    python3 sync_ollama_models.py                # update ~/.config/opencode/opencode.json
    python3 sync_ollama_models.py --dry-run       # preview changes without writing
    python3 sync_ollama_models.py --config PATH   # use a different config file
"""

import argparse
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

DEFAULT_CONFIG = Path.home() / ".config" / "opencode" / "opencode.json"
DEFAULT_OLLAMA_URL = "http://127.0.0.1:11434/v1/models"


def fetch_ollama_models(url: str) -> list[str]:
    try:
        with urllib.request.urlopen(url, timeout=5) as resp:
            data = json.load(resp)
    except urllib.error.URLError as e:
        sys.exit(f"Could not reach Ollama at {url}: {e}\nIs Ollama running? (ollama serve)")
    except json.JSONDecodeError as e:
        sys.exit(f"Ollama returned invalid JSON: {e}")

    models = [m["id"] for m in data.get("data", [])]
    if not models:
        sys.exit("Ollama returned no models. Pull one with `ollama pull <model>` first.")
    return sorted(models)


def update_config(config_path: Path, model_ids: list[str], dry_run: bool) -> None:
    if not config_path.exists():
        sys.exit(f"Config not found: {config_path}")

    config = json.loads(config_path.read_text())

    provider = config.setdefault("provider", {})
    ollama = provider.setdefault("ollama", {})
    ollama.setdefault("name", "Ollama")
    ollama.setdefault("npm", "@ai-sdk/openai-compatible")
    ollama.setdefault("options", {}).setdefault("baseURL", "http://127.0.0.1:11434/v1")

    existing_models = ollama.get("models", {})
    new_models = {}
    added, kept = [], []
    for model_id in model_ids:
        if model_id in existing_models:
            new_models[model_id] = existing_models[model_id]
            kept.append(model_id)
        else:
            new_models[model_id] = {}
            added.append(model_id)

    dropped = sorted(set(existing_models) - set(model_ids))
    ollama["models"] = new_models

    print(f"Models kept (existing per-model config preserved): {len(kept)}")
    print(f"Models added: {len(added)}")
    for m in added:
        print(f"  + {m}")
    if dropped:
        print(f"Models in config but no longer pulled in Ollama (removed): {len(dropped)}")
        for m in dropped:
            print(f"  - {m}")

    if dry_run:
        print("\n--dry-run: not writing file. Resulting ollama block:")
        print(json.dumps(ollama, indent=2))
        return

    config_path.write_text(json.dumps(config, indent=2) + "\n")
    print(f"\nUpdated {config_path}")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG, help="Path to opencode.json")
    parser.add_argument("--ollama-url", default=DEFAULT_OLLAMA_URL, help="Ollama's OpenAI-compatible models endpoint")
    parser.add_argument("--dry-run", action="store_true", help="Print the result without writing the file")
    args = parser.parse_args()

    model_ids = fetch_ollama_models(args.ollama_url)
    update_config(args.config, model_ids, args.dry_run)


if __name__ == "__main__":
    main()
