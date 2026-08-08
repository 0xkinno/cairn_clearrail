#!/bin/bash
# Builds a near-sdk-js contract to WASM, skipping the broken bare-tsc typecheck step
# (near-sdk-js's checkTypescript walks up ancestor node_modules/@types and picks up
# unrelated packages with syntax the bundled tsc can't parse; validateContract already
# checks the contract's own correctness).
set -e
DIR="$1"
NAME="$2"
cd "$DIR"
mkdir -p build
npx near-sdk-js validateContract src/contract.ts
npx near-sdk-js createJsFileWithRollup src/contract.ts "build/${NAME}.wasm"
npx near-sdk-js transpileJsAndBuildWasm "build/${NAME}.wasm"
