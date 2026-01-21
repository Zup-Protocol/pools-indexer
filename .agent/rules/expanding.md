---
trigger: always_on
---

# Indexer Expansion Rules

This document defines the mandatory workflow for extending the coverage of the Pools Indexer. As the primary engine, consistency during expansion is non-negotiable.

---

## 1. Expansion Mission

The goal of expansion is to increase the indexer's coverage while maintaining absolute schema consistency. Every new addition must be "plug-and-play" with the existing **Global Token** and **Global Processor** architecture.

## 2. New Network Onboarding Workflow

When adding a new blockchain network, you must execute these steps in the exact sequence defined:

1.  **Chain Registration (`config.yaml`):** Append the network with its `id` (Chain ID), `start_block`, and `max_reorg_depth`.
2.  **Enum Update:** Add the network to the `IndexerNetwork` enum in `src/core/network/indexer-network.ts`.
3.  **Core Constants:** Define RPC URLs, Stablecoins, and Native Wrapped addresses in the `IndexerNetwork` namespace.
4.  **Peripheral Mapping:** Update address registries for Position Managers, Permit2, and (if V4) the State View.

## 3. Protocol Integration Standards

Choose the appropriate template based on the DEX architecture. **Do not reinvent logic** for standard clones.

### 3.1 Standard Clones (Uniswap V3 / Slipstream)

- **ABI Usage:** Use existing factory ABIs from `./abis/factories/`.
- **Handlers:** Create a thin factory handler that registers the `PoolCreated` event and delegates logic to the existing `v3-processors`.

### 3.2 Custom/Modified DEXs (Algebra / Custom V3)

- **New ABIs:** Place new Factory and Pool ABIs in the respective `/abis` folders.
- **Dynamic Registration:** Use `contractRegister` in the handler to ensure every new pool address is added to the indexing queue.
- **Specific Processors:** If the math differs (e.g., custom fee logic), create a protocol-specific processor in `src/processors/` that eventually calls the `GlobalProcessor`.

## 4. Documentation & Rule Maintenance

As the **Pools Indexer Agent**, you have a dual responsibility regarding the project's metadata:

- **Self-Evolving Rules:** You are responsible for updating this `expanding.md` file whenever a new integration pattern is discovered or the workflow is optimized.
- **Change Log:** If the expansion workflow changes (e.g., a new required file in `src/core`), you must update both files (readme and this rule) to prevent future "context rot."

## 5. Expansion Verification Checklist

Before finishing an expansion task, you must verify:

- [ ] Does the new network ID in `config.yaml` match the `IndexerNetwork` enum?
- [ ] Are the stablecoin and native addresses correctly mapped for the new chain?
- [ ] Does the new handlers call the correct generic `processor`?
- [ ] Are the indexer without errors?
