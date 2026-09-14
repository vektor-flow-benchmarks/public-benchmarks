# Vektor Flow public benchmarks

This repository runs the public Vektor Flow performance contract on standard
GitHub-hosted Linux x64, Windows x64, and macOS ARM64 runners.

It intentionally contains no Vektor Flow compiler implementation source.
Workflows consume checksum-locked compiler candidate binaries, public benchmark
workloads, and the public benchmark harness. Numeric reports are uploaded as
workflow artifacts.

## Acceptance contract

- Native stage 1: 10 measured raw-runtime samples per workload.
- Native workloads: Spectral norm, Fannkuch-redux, N-body, combined serial, and
  combined parallel.
- Native peers: C++, Rust, and Zig on the same host.
- Every native stage-1 ratio must be strictly below `0.5x`.
- Combined parallel uses exactly two compute threads.
- Browser stage 1: Chrome, Firefox, and Safari on macOS, each strictly below
  `2x` the same-host native Vektor Flow result.
- Stage 2: 100 measured samples for correctness and stability after stage 1
  passes; it has no performance threshold.

## Candidate bundles

The native workflow reads these assets from a candidate release in this
repository:

- `benchmark-suite.tar.gz`
- `vkf-benchmark-driver-linux-x64.tar.gz`
- `vkf-benchmark-driver-windows-x64.tar.gz`
- `vkf-benchmark-driver-macos-arm64.tar.gz`
- one adjacent `.sha256` file for every archive

Compiler candidates are executable artifacts only. The workflows never clone
or receive the private implementation repository.

Vektor Flow documentation and downloads: <https://vektorflow.org>
