---
trigger: always_on
---

# Pools Indexer Architecture

This document defines the structural integrity and engineering standards for the Pools Indexer. Adherence to these boundaries ensures scalability across multiple DEX protocols and networks.

---

## 1. Directory Structure Overview

All operational code resides in the `/src` directory. The root level is reserved for system configuration.

| Folder            | Responsibility                                                                 |
| :---------------- | :----------------------------------------------------------------------------- |
| **`/handlers`**   | Event Entry Points. Decodes raw blockchain events and delegates to processors. |
| **`/processors`** | Business Logic. Normalizes data (Swap, Mint, Burn) for the unified schema.     |
| **`/services`**   | Infrastructure. Manages external connections (DB, RPC, Pricing Oracles).       |
| **`/core`**       | System Backbone. Config constants, Network registries, and Global Types.       |
| **`/lib`**        | Utility Layer. Pure functions only (SafeMath, Time, String utils).             |

---

## 2. Handler & Processor Protocol

The indexer uses a "Thin Handler / Thick Processor" pattern to maintain decoupling.

### 2.1 Handlers (`/src/handlers`)

- **Single Responsibility:** Each file must handle exactly one event type (e.g., `Swap.ts`).
- **Consistency:** Having multiple unrelated handlers in a single file is strictly prohibited.
- **Exceptions:** Extremely coupled events sharing a factory (e.g., `PoolCreated` and `CustomPoolCreated`) may share a file to reduce boilerplate.
- **Non-Blocking:** Handlers should not process data or save to the DB; they must call a Processor.

### 2.2 Processors (`/src/processors`)

Processors are segmented into two tiers:

- **Global Processors:** Logic that applies to all liquidity pools (e.g., `swap-processor.ts`). These must be **Protocol Agnostic**, dealing only with universal concepts like token in/out and amounts.
- **Specific Processors:** Logic for specific pool types (V2, V3, V4). These transform protocol-specific data (like V3 ticks) before passing the result to a Global Processor.

---

## 3. Layer Boundaries & Dependencies

To prevent "spaghetti code," the following dependency rules are strictly enforced:

- **Core Isolation:** The `/core` folder is the backbone. It must not import from `handlers`, `processors`, or `services`.
- **Service Encapsulation:** Anything that connects to the "outer world" (RPCs, Database `.set` overrides) must live in `/services`. Do not place contract-call logic in processors.
- **Pool Type Separation:** Each pool type logic must be strictly separated by folder.
  - **Violation:** A V2 folder referencing V3 `Tick` logic is a heavy violation.
  - **Shared Code:** Use `processors/common` or `/lib` if two pool types must share custom logic.

---

## 4. Root & Peripheral Management

- **Root Files:** Limited to system configurations (`schema.graphql`, `config.yaml`, `.env`).
- **Peripheral Folders:** If a file is not directly related to the running indexer code (e.g., ABIs, deployment scripts, custom tools), it must live in a dedicated folder at the root level (e.g., `/abis`, `/scripts`).

---

## 5. Architectural Intent

This structure ensures that adding a new DEX protocol that has a supported pool type requires adding a new `handler` and a `specific processor` (if needs personalization). The `Global Processors` and `Core` setup remain untouched, ensuring the indexer grows without increasing complexity.
