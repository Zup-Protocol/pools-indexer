import { IndexerNetwork } from "../network";
import { SupportedProtocol } from "../protocol";

export const POSITION_MANAGER_ADDRESS: Record<SupportedProtocol, Partial<Record<IndexerNetwork, string>>> = {
  [SupportedProtocol.PANCAKESWAP_INFINITY_CL]: {
    [IndexerNetwork.BASE]: "0x55f4c8abA71A1e923edC303eb4fEfF14608cC226",
  },
  [SupportedProtocol.UNISWAP_V4]: {
    [IndexerNetwork.BASE]: "0x7c5f5a4bbd8fd63184577525326123b519429bdc",
    [IndexerNetwork.ETHEREUM]: "0xbD216513d74C8cf14cf4747E6AaA6420FF64ee9e",
    [IndexerNetwork.UNICHAIN]: "0x4529A01c7A0410167c5740C487A8DE60232617bf",
    [IndexerNetwork.MONAD]: "0x5b7eC4a94fF9beDb700fb82aB09d5846972F4016",
  },
  [SupportedProtocol.UNISWAP_V2]: {
    [IndexerNetwork.BASE]: "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24",
    [IndexerNetwork.ETHEREUM]: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    [IndexerNetwork.UNICHAIN]: "0x284f11109359a7e1306c3e447ef14d38400063ff",
    [IndexerNetwork.MONAD]: "0x4b2ab38dbf28d31d467aa8993f6c2585981d6804",
  },
  [SupportedProtocol.AERODROME_V3]: {
    [IndexerNetwork.BASE]: "0x827922686190790b37229fd06084350E74485b72",
  },
  [SupportedProtocol.UNISWAP_V3]: {
    [IndexerNetwork.BASE]: "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1",
    [IndexerNetwork.ETHEREUM]: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
    [IndexerNetwork.UNICHAIN]: "0x943e6e07a7e8e791dafc44083e54041d743c46e9",
    [IndexerNetwork.MONAD]: "0x7197e214c0b767cfb76fb734ab638e2c192f4e53",
  },
  [SupportedProtocol.PANCAKE_SWAP_V3]: {
    [IndexerNetwork.BASE]: "0x46A15B0b27311cedF172AB29E4f4766fbE7F4364",
    [IndexerNetwork.ETHEREUM]: "0x46A15B0b27311cedF172AB29E4f4766fbE7F4364",
    [IndexerNetwork.SCROLL]: "0x46A15B0b27311cedF172AB29E4f4766fbE7F4364",
    [IndexerNetwork.MONAD]: "0x46A15B0b27311cedF172AB29E4f4766fbE7F4364",
  },
  [SupportedProtocol.SUSHI_SWAP_V3]: {
    [IndexerNetwork.BASE]: "0x80C7DD17B01855a6D2347444a0FCC36136a314de",
    [IndexerNetwork.ETHEREUM]: "0x2214A42d8e2A1d20635c2cb0664422c528B6A432",
    [IndexerNetwork.SCROLL]: "0x0389879e0156033202C44BF784ac18fC02edeE4f",
  },
  [SupportedProtocol.ALIENBASE_V3]: {
    [IndexerNetwork.BASE]: "0xB7996D1ECD07fB227e8DcA8CD5214bDfb04534E5",
  },
  [SupportedProtocol.VELODROME_V3]: {
    [IndexerNetwork.UNICHAIN]: "0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702",
  },
  [SupportedProtocol.HONEYPOP_V3]: {
    [IndexerNetwork.SCROLL]: "0xB6F8D24e28bF5b8AdD2e7510f84F3b9ef03B3435",
  },
  [SupportedProtocol.HYPER_SWAP_V3]: {
    [IndexerNetwork.HYPER_EVM]: "0x6eDA206207c09e5428F281761DdC0D300851fBC8",
  },
  [SupportedProtocol.PROJECT_X_V3]: {
    [IndexerNetwork.HYPER_EVM]: "0xeaD19AE861c29bBb2101E834922B2FEee69B9091",
  },
  [SupportedProtocol.HYBRA_V3]: {
    [IndexerNetwork.HYPER_EVM]: "0x934C4f47B2D3FfcA0156A45DEb3A436202aF1efa",
  },
  [SupportedProtocol.HYBRA_SLIPSTREAM]: {
    [IndexerNetwork.HYPER_EVM]: "0xcc9E3991360229Fd13694022b9456D371f1a2568",
  },
  [SupportedProtocol.KITTENSWAP_ALGEBRA]: {
    [IndexerNetwork.HYPER_EVM]: "0x9ea4459c8DefBF561495d95414b9CF1E2242a3E2",
  },
  [SupportedProtocol.ULTRASOLID_V3]: {
    [IndexerNetwork.HYPER_EVM]: "0xE7ffA0ee20Deb1613489556062Fa8cec690C3c02",
  },
  [SupportedProtocol.UPHEAVAL_V3]: {
    [IndexerNetwork.HYPER_EVM]: "0xC8352A2EbA29F4d9BD4221c07D3461BaCc779088",
  },
  [SupportedProtocol.ATLANTIS_ALGEBRA]: {
    [IndexerNetwork.MONAD]: "0x69D57B9D705eaD73a5d2f2476C30c55bD755cc2F",
  },
  [SupportedProtocol.RAMSES_V3]: {
    [IndexerNetwork.HYPER_EVM]: "0xB3F77C5134D643483253D22E0Ca24627aE42ED51",
  },
  [SupportedProtocol.OCTOSWAP_CL]: {
    [IndexerNetwork.MONAD]: "0x16eb676BbBe51EB6E4E9DDF57BfBEe0537aA4d7B",
  },
  [SupportedProtocol.PINOT_FINANCE_V3]: {
    [IndexerNetwork.MONAD]: "0xb8058cDbC6CdC4b0aA0Aa00A7Ecf7CAAF1441392",
  },
  [SupportedProtocol.OKU_TRADE_V3]: {
    [IndexerNetwork.PLASMA]: "0x743E03cceB4af2efA3CC76838f6E8B50B63F184c",
  },
  [SupportedProtocol.CAPRICORN_CL]: {
    [IndexerNetwork.MONAD]: "0x4C02af995BB1f574c9bf31F43ddc112414aE0Ac7",
  },
};
