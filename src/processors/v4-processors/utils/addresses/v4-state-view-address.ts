import { IndexerNetwork } from "../../../../core/network";
import { SupportedProtocol } from "../../../../core/protocol";

export const V4_STATE_VIEW_ADDRESS: Partial<Record<SupportedProtocol, Partial<Record<IndexerNetwork, string>>>> = {
  [SupportedProtocol.UNISWAP_V4]: {
    [IndexerNetwork.ETHEREUM]: "0x7ffe42c4a5deea5b0fec41c94c136cf115597227",
    [IndexerNetwork.BASE]: "0xa3c0c9b65bad0b08107aa264b0f3db444b867a71",
    [IndexerNetwork.UNICHAIN]: "0x86e8631a016f9068c3f085faf484ee3f5fdee8f2",
    [IndexerNetwork.MONAD]: "0x77395F3b2E73aE90843717371294fa97cC419D64",
  },
};
