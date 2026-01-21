---
trigger: always_on
---

# Pools Indexer Standards

## 1. Indexer Mission & Scope

The **Pools Indexer** is a specialized [Envio HyperIndex](https://envio.dev) instance designed to serve as the definitive real-time data layer for DeFi Liquidity Pools.

- **Primary Goal:** Aggregate, normalize, and unify fragmented liquidity data from multiple DEX protocols into a single, queryable GraphQL schema.
- **Strict Boundary:** This indexer **must only** contain logic related to liquidity pools. Do not include lending markets (Aave, Compound), liquid staking (LSTs), or yield aggregators. If a protocol has multiple modules, only index the DEX/Pool module.

## 2. Multichain Architecture

This is a global indexer. To manage the complexity of multiple networks and versions (V2, V3, V4), follow these structural rules:

- **Unified Network Registry:** Each network in `config.yaml` must contain its full set of supported DEXs.
- **Collision Prevention:** To avoid entity ID conflicts across chains, all entity IDs must be namespaced with the Chain ID (e.g., `chainId-poolAddress`). This is critical for data integrity in a multichain environment.

## 3. The "Global Token" Singleton Pattern

One of the core value propositions of this indexer is the **Shared Token Entity**.

- **Centralized Metadata:** Any pool (regardless of DEX type or version) that interacts with a token should contribute to the `Token` entity.
- **Aggregated Metrics:** Use the `Token` entity to track global stats like `trackedLiquidityVolumeUsd`, `swapVolumeUsd`, and `usdPrice`.
- **Hierarchy of Update:** When multiple pools update the same token, ensure the handler logic uses `context.Token.set()` to upsert data without overwriting critical metadata (like name, symbol, and decimals).

## 4. Normalization vs. Customization

While we index diverse pool types (Uniswap V2/V3/V4, Algebra, Maverick), the output must be predictable.

- **Unified Schema:** Map protocol-specific events (e.g., `Mint`, `Burn`, `Swap`) to a common `Pool` interface in `schema.graphql`.
- **Version-Specific Logic:** While the _output_ is normalized, the _handlers_ must account for version differences. For example, V3/V4 pools must handle concentrated liquidity ranges (ticks), while V2 pools only track raw reserves.
- **The "Source of Truth" Rule:** If a conflict arises between our normalized data and a specific protocol’s logic, default to the raw contract event data as the ultimate source of truth.

## 5. Maintenance & Evolution

- **Schema First:** Any change to the indexing logic must start with a review of `schema.graphql`. If you add a new pool type, first verify that its unique properties can be housed within the existing entity structure.
- **Performance Tracking:** Because we deal with huge amounts of data, avoid "Full Table Scans" in GraphQL. Ensure that frequently queried fields (like `token0`, `token1`, `totalValueLocked`) are properly indexed in the schema.
