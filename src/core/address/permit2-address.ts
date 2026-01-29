import { IndexerNetwork } from "../network";
import { SupportedProtocol } from "../protocol";

export const PERMIT2_ADDRESS: Partial<Record<SupportedProtocol, Partial<Record<IndexerNetwork, string>>>> = {
  [SupportedProtocol.UNISWAP_V4]: {
    [IndexerNetwork.ETHEREUM]: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
    [IndexerNetwork.BASE]: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
    [IndexerNetwork.UNICHAIN]: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
    [IndexerNetwork.SCROLL]: "0xFcf5986450E4A014fFE7ad4Ae24921B589D039b5",
    [IndexerNetwork.MONAD]: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
  },
  [SupportedProtocol.PANCAKESWAP_INFINITY_CL]: {
    [IndexerNetwork.BASE]: "0x31c2F6fcFf4F8759b3Bd5Bf0e1084A055615c768",
  },
};
