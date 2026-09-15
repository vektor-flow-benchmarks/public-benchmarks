# Vektor Flow public benchmarks

This repository runs the public Vektor Flow performance contract on standard
GitHub-hosted Linux x64, Windows x64, and macOS ARM64 runners.

It intentionally contains no Vektor Flow compiler implementation source. A
workflow checks out a requested private compiler commit into an ephemeral
GitHub-hosted runner, builds it, executes the public benchmark contract, and
uploads numeric reports only. Neither the checkout nor the standard-library
sources are published as artifacts.

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

## Candidate execution

The native workflow accepts a private branch or full commit SHA. Each selected
operating system builds that exact revision once and then runs all five
workloads on the same host. The public result contains only JSON and Markdown
reports.

The private deploy key is read-only and credentials are not persisted after
checkout. Workflow artifact paths explicitly include reports only.

Vektor Flow documentation and downloads: <https://vektorflow.org>
