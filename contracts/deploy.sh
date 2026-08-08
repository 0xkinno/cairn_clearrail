#!/bin/bash
# Deploys a built WASM contract to a NEAR testnet sub-account of the deployer account.
# Creates the sub-account (funded from the deployer) if it doesn't already exist, then deploys.
set -e

DEPLOYER_ACCOUNT="$1"      # e.g. cairn-deployer.testnet
DEPLOYER_KEY="$2"          # ed25519:...
SUBACCOUNT_PREFIX="$3"     # e.g. registry
WASM_PATH="$4"             # e.g. contracts/cairn-registry/build/cairn_registry.wasm
NODE_URL="${5:-https://rpc.testnet.near.org}"

SUBACCOUNT="${SUBACCOUNT_PREFIX}.${DEPLOYER_ACCOUNT}"

node "$(dirname "$0")/deploy.mjs" "$DEPLOYER_ACCOUNT" "$DEPLOYER_KEY" "$SUBACCOUNT" "$WASM_PATH" "$NODE_URL"
