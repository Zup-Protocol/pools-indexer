import { ONE_DAY_IN_SECONDS } from "../constants";
import type { TokenMetadata } from "../types";
import { NetworkToken } from "./network-token";

export enum IndexerNetwork {
  ETHEREUM = 1,
  SCROLL = 534352,
  UNICHAIN = 130,
  BASE = 8453,
  SEPOLIA = 11155111,
  HYPER_EVM = 999,
  PLASMA = 9745,
  MONAD = 143,
}

export namespace IndexerNetwork {
  export const freeRPCUrl: Record<IndexerNetwork, string> = {
    [IndexerNetwork.ETHEREUM]: "https://mainnet.gateway.tenderly.co",
    [IndexerNetwork.BASE]: "https://mainnet.base.org",
    [IndexerNetwork.SCROLL]: "https://rpc.scroll.io",
    [IndexerNetwork.UNICHAIN]: "https://mainnet.unichain.org",
    [IndexerNetwork.SEPOLIA]: "https://sepolia.gateway.tenderly.co",
    [IndexerNetwork.HYPER_EVM]: "https://hyperliquid.drpc.org",
    [IndexerNetwork.PLASMA]: "https://rpc.plasma.to",
    [IndexerNetwork.MONAD]: "https://rpc-mainnet.monadinfra.com",
  };

  export const paidRPCUrl: Record<IndexerNetwork, string> = {
    [IndexerNetwork.ETHEREUM]: process.env.ENVIO_PAID_ETHEREUM_RPC_URL!,
    [IndexerNetwork.BASE]: process.env.ENVIO_PAID_BASE_RPC_URL!,
    [IndexerNetwork.SCROLL]: process.env.ENVIO_PAID_SCROLL_RPC_URL!,
    [IndexerNetwork.UNICHAIN]: process.env.ENVIO_PAID_UNICHAIN_RPC_URL!,
    [IndexerNetwork.SEPOLIA]: process.env.ENVIO_PAID_SEPOLIA_RPC_URL!,
    [IndexerNetwork.HYPER_EVM]: process.env.ENVIO_PAID_HYPER_EVM_RPC_URL!,
    [IndexerNetwork.PLASMA]: process.env.ENVIO_PAID_PLASMA_RPC_URL!,
    [IndexerNetwork.MONAD]: process.env.ENVIO_PAID_MONAD_RPC_URL!,
  };

  export const nativeToken: Record<IndexerNetwork, TokenMetadata> = {
    [IndexerNetwork.BASE]: NetworkToken.metadata[NetworkToken.ETH],
    [IndexerNetwork.ETHEREUM]: NetworkToken.metadata[NetworkToken.ETH],
    [IndexerNetwork.UNICHAIN]: NetworkToken.metadata[NetworkToken.ETH],
    [IndexerNetwork.SCROLL]: NetworkToken.metadata[NetworkToken.ETH],
    [IndexerNetwork.SEPOLIA]: NetworkToken.metadata[NetworkToken.ETH],
    [IndexerNetwork.HYPER_EVM]: NetworkToken.metadata[NetworkToken.HYPE],
    [IndexerNetwork.PLASMA]: NetworkToken.metadata[NetworkToken.XPL],
    [IndexerNetwork.MONAD]: NetworkToken.metadata[NetworkToken.MON],
  };

  export const stablecoinsAddresses: Record<IndexerNetwork, string[]> = {
    [IndexerNetwork.ETHEREUM]: [
      "0xdac17f958d2ee523a2206206994597c13d831ec7", // USDT
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC
      "0xdC035D45d973E3EC169d2276DDab16f1e407384F", // USDS
      "0x4c9edd5852cd905f086c759e8383e09bff1e68b3", // USDE
      "0xc5f0f7b66764F6ec8C8Dff7BA683102295E16409", // FDUSD
      "0x6c3ea9036406852006290770bedfcaba0e23a0e8", // PYUSD
      "0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d", // USD1
      "0xe343167631d89B6Ffc58B88d6b7fB0228795491D", // USDG
      "0xc83e27f270cce0A3A3A29521173a83F402c1768b", // USDQ
      "0x7B43E3875440B44613DC3bC08E7763e6Da63C8f8", // USDR
      "0x8E870D67F660D95d5be530380D0eC0bd388289E1", // USDP
    ],
    [IndexerNetwork.SCROLL]: [
      "0xf55BEC9cafDbE8730f096Aa55dad6D22d44099Df", // USDT
      "0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4", // USDC
    ],
    [IndexerNetwork.UNICHAIN]: [
      "0x078D782b760474a361dDA0AF3839290b0EF57AD6", // USDC
      "0x9151434b16b9763660705744891fA906F660EcC5", // USDT0
      "0x588ce4f028d8e7b53b687865d6a67b3a54c75518", // USDT
      "0x80Eede496655FB9047dd39d9f418d5483ED600df", // frxUSD
      "0xaC025d055a6B633992dE1F796b97B97F004c06a7", // USDR
      "0x116EE4d63847fb295dD919aE57B768EA3B2f7Bb4", // USDS
      "0xf81B7485B4cB59645F74528D702c7f8CD72577FB", // LUSD
      "0xF7E6430137eF8087E0D472343f358e986De0FEFF", // USDP
      "0x2A22868610610199D43fE93A16661473A9f86f1E", // USDG
    ],
    [IndexerNetwork.BASE]: [
      "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC
      "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2", // USDT
      "0x820c137fa70c8691f0e44dc420a5e53c168921dc", // USDS
      "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA", // USDbC
      "0x368181499736d0c0CC614DBB145E2EC1AC86b8c6", // LUSD
    ],
    [IndexerNetwork.SEPOLIA]: [
      "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // USDC
    ],
    [IndexerNetwork.HYPER_EVM]: [
      "0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb", // USDT0
      "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34", // USDe
      "0xb50A96253aBDF803D85efcDce07Ad8becBc52BD5", // USDHL
      "0x9ab96A4668456896d45c301Bc3A15Cee76AA7B8D", // rUSDC
      "0x02c6a2fa58cc01a18b8d9e00ea48d65e4df26c70", // feUSD
      "0xb88339CB7199b77E23DB6E890353E22632Ba630f", // USDC
      "0x111111a1a0667d36bd57c0a9f569b98057111111", // USDH
    ],
    [IndexerNetwork.PLASMA]: [
      "0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb", // USDT0
      "0x5d3a1ff2b6bab83b63cd9ad0787074081a52ef34", // USDe
      "0x0a1a1a107e45b7ced86833863f482bc5f4ed82ef", // USDai
    ],
    [IndexerNetwork.MONAD]: [
      "0x754704Bc059F8C67012fEd69BC8A327a5aafb603", // USDC
      "0xe7cd86e13AC4309349F30B3435a9d337750fC82D", // USDT0
      "0xfd44b35139ae53fff7d8f2a9869c503d987f00d1", // LVUSD
      "0x00000000efe302beaa2b3e6e1b18d08d69a9012a", // AUSD
      "0x111111d2bf19e43C34263401e0CAd979eD1cdb61", // USD1
    ],
  };

  export const wrappedNativeAddress: Record<IndexerNetwork, string> = {
    [IndexerNetwork.ETHEREUM]: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    [IndexerNetwork.SCROLL]: "0x5300000000000000000000000000000000000004",
    [IndexerNetwork.UNICHAIN]: "0x4200000000000000000000000000000000000006",
    [IndexerNetwork.BASE]: "0x4200000000000000000000000000000000000006",
    [IndexerNetwork.SEPOLIA]: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
    [IndexerNetwork.HYPER_EVM]: "0x5555555555555555555555555555555555555555",
    [IndexerNetwork.PLASMA]: "0x6100e367285b01f48d07953803a2d8dca5d19873",
    [IndexerNetwork.MONAD]: "0x3bd359c1119da7da1d913d1c4d2b7c461115433a",
  };

  export const meanBlockTimeSeconds: Record<IndexerNetwork, number> = {
    [IndexerNetwork.ETHEREUM]: 12,
    [IndexerNetwork.SCROLL]: 1,
    [IndexerNetwork.UNICHAIN]: 1,
    [IndexerNetwork.BASE]: 2,
    [IndexerNetwork.SEPOLIA]: 12,
    [IndexerNetwork.HYPER_EVM]: 1,
    [IndexerNetwork.PLASMA]: 1,
    [IndexerNetwork.MONAD]: 0.4,
  };
  

  export const oneDayInBlocks: Record<IndexerNetwork, number> = {
    [IndexerNetwork.ETHEREUM]: ONE_DAY_IN_SECONDS / IndexerNetwork.meanBlockTimeSeconds[IndexerNetwork.ETHEREUM],
    [IndexerNetwork.SCROLL]: ONE_DAY_IN_SECONDS / IndexerNetwork.meanBlockTimeSeconds[IndexerNetwork.SCROLL],
    [IndexerNetwork.UNICHAIN]: ONE_DAY_IN_SECONDS / IndexerNetwork.meanBlockTimeSeconds[IndexerNetwork.UNICHAIN],
    [IndexerNetwork.BASE]: ONE_DAY_IN_SECONDS / IndexerNetwork.meanBlockTimeSeconds[IndexerNetwork.BASE],
    [IndexerNetwork.SEPOLIA]: ONE_DAY_IN_SECONDS / IndexerNetwork.meanBlockTimeSeconds[IndexerNetwork.SEPOLIA],
    [IndexerNetwork.HYPER_EVM]: ONE_DAY_IN_SECONDS / IndexerNetwork.meanBlockTimeSeconds[IndexerNetwork.HYPER_EVM],
    [IndexerNetwork.PLASMA]: ONE_DAY_IN_SECONDS / IndexerNetwork.meanBlockTimeSeconds[IndexerNetwork.PLASMA],
    [IndexerNetwork.MONAD]: ONE_DAY_IN_SECONDS / IndexerNetwork.meanBlockTimeSeconds[IndexerNetwork.MONAD],
  };
}
