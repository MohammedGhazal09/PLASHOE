# Spike Conventions

Patterns and stack choices established across spike sessions. New spikes follow these unless the question requires otherwise.

## Stack

- Use Node.js scripts with the standard library for source-level checks that do not need app dependencies.
- Keep dependency-free spikes under `.planning/spikes/NNN-name/` so they can run from a fresh checkout.

## Structure

- Each spike directory should include a runnable script, a `README.md`, and generated result files when the spike is self-verifying.
- Machine-readable output should be written as JSON; human-readable output should be written as Markdown.

## Patterns

- Prefer self-verifying spikes for backend/frontend contract checks.
- Do not read local `.env` files from spike scripts.
- Keep recommendations separate from verified present-state findings.

## Tools & Libraries

- Node.js `fs`, `path`, and `url` are enough for the first contract-check spike.
