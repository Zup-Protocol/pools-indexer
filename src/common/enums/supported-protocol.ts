import { V2PositionManagerAddress } from "../../v2-pools/common/v2-position-manager-address";
import { V3PositionManagerAddress } from "../../v3-pools/common/v3-position-manager-address";
import { V4PositionManagerAddress } from "../../v4-pools/common/v4-position-manager-address";
import { V4StateViewAddress } from "../../v4-pools/common/v4-state-view-address";
import { Permit2Address } from "../permit2-address";
import { IndexerNetwork } from "./indexer-network";

export enum SupportedProtocol {
  UNISWAP_V2 = "uniswap-v2",
  AERODROME_V3 = "aerodrome-v3",
  ALIENBASE_V3 = "alienbase-v3",
  BASESWAP_V3 = "baseswap-v3",
  HONEYPOP_V3 = "honeypop-v3",
  OKU_TRADE_V3 = "oku-trade-v3",
  PANCAKE_SWAP_V3 = "pancakeswap-v3",
  SUSHI_SWAP_V3 = "sushi-swap-v3",
  UNISWAP_V3 = "uniswap-v3",
  VELODROME_V3 = "velodrome-v3",
  ZEBRA_V3 = "zebra-v3",
  PANCAKESWAP_INFINITY_CL = "pancakeswap-infinity-cl",
  UNISWAP_V4 = "uniswap-v4",
  GLIQUID_ALGEBRA = "gliquid-v3",
  HYPER_SWAP_V3 = "hyperswap-v3",
  PROJECT_X_V3 = "projectx-v3",
  HYBRA_V3 = "hybra-v3",
  KITTENSWAP_ALGEBRA = "kittenswap-v3",
  ULTRASOLID_V3 = "ultrasolid-v3",
}

export namespace SupportedProtocol {
  export function getName(protocol: SupportedProtocol): string {
    switch (protocol) {
      case SupportedProtocol.UNISWAP_V2:
        return "Uniswap V2";
      case SupportedProtocol.AERODROME_V3:
        return "Aerodrome V3";
      case SupportedProtocol.ALIENBASE_V3:
        return "Alien Base V3";
      case SupportedProtocol.BASESWAP_V3:
        return "BaseSwap V3";
      case SupportedProtocol.HONEYPOP_V3:
        return "Honeypop V3";
      case SupportedProtocol.OKU_TRADE_V3:
        return "Oku V3";
      case SupportedProtocol.PANCAKE_SWAP_V3:
        return "PancakeSwap V3";
      case SupportedProtocol.SUSHI_SWAP_V3:
        return "SushiSwap V3";
      case SupportedProtocol.UNISWAP_V3:
        return "Uniswap V3";
      case SupportedProtocol.VELODROME_V3:
        return "Velodrome V3";
      case SupportedProtocol.ZEBRA_V3:
        return "Zebra V3";
      case SupportedProtocol.PANCAKESWAP_INFINITY_CL:
        return "PancakeSwap Infinity CL";
      case SupportedProtocol.UNISWAP_V4:
        return "Uniswap V4";
      case SupportedProtocol.GLIQUID_ALGEBRA:
        return "Gliquid Algebra";
      case SupportedProtocol.HYPER_SWAP_V3:
        return "HyperSwap V3";
      case SupportedProtocol.PROJECT_X_V3:
        return "Project X V3";
      case SupportedProtocol.HYBRA_V3:
        return "Hybra V3";
      case SupportedProtocol.KITTENSWAP_ALGEBRA:
        return "Kittenswap Algebra";
      case SupportedProtocol.ULTRASOLID_V3:
        return "UltraSolid V3";
    }
  }

  export function getUrl(protocol: SupportedProtocol): string {
    switch (protocol) {
      case SupportedProtocol.UNISWAP_V2:
        return "https://uniswap.org/";
      case SupportedProtocol.AERODROME_V3:
        return "https://aerodrome.finance";
      case SupportedProtocol.ALIENBASE_V3:
        return "https://app.alienbase.xyz/";
      case SupportedProtocol.BASESWAP_V3:
        return "https://baseswap.fi/";
      case SupportedProtocol.HONEYPOP_V3:
        return "https://honeypop.app/";
      case SupportedProtocol.OKU_TRADE_V3:
        return "https://oku.trade/";
      case SupportedProtocol.PANCAKE_SWAP_V3:
        return "https://pancakeswap.finance/";
      case SupportedProtocol.SUSHI_SWAP_V3:
        return "https://sushi.com/";
      case SupportedProtocol.UNISWAP_V3:
        return "https://uniswap.org/";
      case SupportedProtocol.VELODROME_V3:
        return "https://velodrome.finance/";
      case SupportedProtocol.ZEBRA_V3:
        return "https://zebra.xyz/";
      case SupportedProtocol.PANCAKESWAP_INFINITY_CL:
        return "https://pancakeswap.finance/";
      case SupportedProtocol.UNISWAP_V4:
        return "https://uniswap.org/";
      case SupportedProtocol.GLIQUID_ALGEBRA:
        return "https://gliquid.xyz/";
      case SupportedProtocol.HYPER_SWAP_V3:
        return "https://hyperswap.exchange/";
      case SupportedProtocol.PROJECT_X_V3:
        return "https://prjx.com/";
      case SupportedProtocol.HYBRA_V3:
        return "https://hybra.finance/";
      case SupportedProtocol.KITTENSWAP_ALGEBRA:
        return "https://kittenswap.finance/";
      case SupportedProtocol.ULTRASOLID_V3:
        return "https://ultrasolid.xyz/";
    }
  }

  export function getLogoUrl(protocol: SupportedProtocol): string {
    switch (protocol) {
      case SupportedProtocol.UNISWAP_V2:
        return "https://assets-cdn.trustwallet.com/dapps/app.uniswap.org.png";
      case SupportedProtocol.AERODROME_V3:
        return "https://assets-cdn.trustwallet.com/dapps/aerodrome.finance.png";
      case SupportedProtocol.ALIENBASE_V3:
        return "https://s2.coinmarketcap.com/static/img/coins/200x200/30543.png";
      case SupportedProtocol.BASESWAP_V3:
        return "https://s2.coinmarketcap.com/static/img/coins/200x200/27764.png";
      case SupportedProtocol.HONEYPOP_V3:
        return "https://icons.llamao.fi/icons/protocols/honeypop-dex";
      case SupportedProtocol.OKU_TRADE_V3:
        return "https://oku.trade/favicon.ico";
      case SupportedProtocol.PANCAKE_SWAP_V3:
        return "https://assets-cdn.trustwallet.com/dapps/pancakeswap.finance.png";
      case SupportedProtocol.SUSHI_SWAP_V3:
        return "https://assets-cdn.trustwallet.com/dapps/app.sushi.com.png";
      case SupportedProtocol.UNISWAP_V3:
        return "https://assets-cdn.trustwallet.com/dapps/app.uniswap.org.png";
      case SupportedProtocol.VELODROME_V3:
        return "https://icons.llamao.fi/icons/protocols/velodrome";
      case SupportedProtocol.ZEBRA_V3:
        return "https://icons.llamao.fi/icons/protocols/zebra";
      case SupportedProtocol.PANCAKESWAP_INFINITY_CL:
        return "https://assets-cdn.trustwallet.com/dapps/pancakeswap.finance.png";
      case SupportedProtocol.UNISWAP_V4:
        return "https://assets-cdn.trustwallet.com/dapps/app.uniswap.org.png";
      case SupportedProtocol.GLIQUID_ALGEBRA:
        return "https://icons.llamao.fi/icons/protocols/gliquid";
      case SupportedProtocol.HYPER_SWAP_V3:
        return "https://icons.llamao.fi/icons/protocols/hyperswap";
      case SupportedProtocol.PROJECT_X_V3:
        return "https://icons.llamao.fi/icons/protocols/project-x";
      case SupportedProtocol.HYBRA_V3:
        return "https://icons.llamao.fi/icons/protocols/hybra";
      case SupportedProtocol.KITTENSWAP_ALGEBRA:
        return "https://icons.llamao.fi/icons/protocols/kittenswap-algebra";
      case SupportedProtocol.ULTRASOLID_V3:
        return "https://icons.llamao.fi/icons/protocols/ultrasolid";
    }
  }

  export function getPermit2Address(protocol: SupportedProtocol, network: IndexerNetwork): string {
    switch (protocol) {
      case SupportedProtocol.UNISWAP_V2:
        return Permit2Address.uniswap(network);
      case SupportedProtocol.AERODROME_V3:
        throw Error(`Permit2 is not available for Aerodrome V3`);
      case SupportedProtocol.ALIENBASE_V3:
        throw Error(`Permit2 is not available for AlienBase V3`);
      case SupportedProtocol.BASESWAP_V3:
        throw Error(`Permit2 is not available for BaseSwap V3`);
      case SupportedProtocol.HONEYPOP_V3:
        throw Error(`Permit2 is not available for Honeypop V3`);
      case SupportedProtocol.OKU_TRADE_V3:
        return Permit2Address.uniswap(network);
      case SupportedProtocol.PANCAKE_SWAP_V3:
        return Permit2Address.pancakeSwap(network);
      case SupportedProtocol.SUSHI_SWAP_V3:
        throw Error(`Permit2 is not available for SushiSwap V3`);
      case SupportedProtocol.UNISWAP_V3:
        return Permit2Address.uniswap(network);
      case SupportedProtocol.VELODROME_V3:
        throw Error(`Permit2 is not available for Velodrome V3`);
      case SupportedProtocol.ZEBRA_V3:
        throw Error(`Permit2 is not available for Zebra V3`);
      case SupportedProtocol.PANCAKESWAP_INFINITY_CL:
        return Permit2Address.pancakeSwap(network);
      case SupportedProtocol.UNISWAP_V4:
        return Permit2Address.uniswap(network);
      case SupportedProtocol.GLIQUID_ALGEBRA:
        throw Error(`Permit2 is not available for Gliquid V3`);
      case SupportedProtocol.HYPER_SWAP_V3:
        throw Error(`Permit2 is not available for HyperSwap`);
      case SupportedProtocol.PROJECT_X_V3:
        throw Error(`Permit2 is not available for ProjectX V3`);
      case SupportedProtocol.HYBRA_V3:
        throw Error(`Permit2 is not available for Hybra V3`);
      case SupportedProtocol.KITTENSWAP_ALGEBRA:
        throw Error(`Permit2 is not available for KittenSwap V3`);
      case SupportedProtocol.ULTRASOLID_V3:
        throw Error(`Permit2 is not available for UltraSolid V3`);
    }
  }

  export function getV4PositionManager(protocol: SupportedProtocol, network: IndexerNetwork): string {
    switch (protocol) {
      case SupportedProtocol.UNISWAP_V2:
        throw Error(`V4 position manager is not available for Uniswap V2`);
      case SupportedProtocol.AERODROME_V3:
        throw Error(`V4 position manager is not available for Aerodrome V3`);
      case SupportedProtocol.ALIENBASE_V3:
        throw Error(`V4 position manager is not available for AlienBase V3`);
      case SupportedProtocol.BASESWAP_V3:
        throw Error(`V4 position manager is not available for BaseSwap V3`);
      case SupportedProtocol.HONEYPOP_V3:
        throw Error(`V4 position manager is not available for Honeypop V3`);
      case SupportedProtocol.OKU_TRADE_V3:
        throw Error(`V4 position manager is not available for Oku V3`);
      case SupportedProtocol.PANCAKE_SWAP_V3:
        throw Error(`V4 position manager is not available for PancakeSwap V3`);
      case SupportedProtocol.SUSHI_SWAP_V3:
        throw Error(`V4 position manager is not available for SushiSwap V3`);
      case SupportedProtocol.UNISWAP_V3:
        throw Error(`V4 position manager is not available for Uniswap V3`);
      case SupportedProtocol.VELODROME_V3:
        throw Error(`V4 position manager is not available for Velodrome V3`);
      case SupportedProtocol.ZEBRA_V3:
        throw Error(`V4 position manager is not available for Zebra V3`);
      case SupportedProtocol.PANCAKESWAP_INFINITY_CL:
        return V4PositionManagerAddress.pancakeSwap(network);
      case SupportedProtocol.UNISWAP_V4:
        return V4PositionManagerAddress.uniswap(network);
      case SupportedProtocol.GLIQUID_ALGEBRA:
        throw Error(`V4 position manager is not available for Gliquid V3`);
      case SupportedProtocol.HYPER_SWAP_V3:
        throw Error(`V4 position manager is not available for HyperSwap`);
      case SupportedProtocol.PROJECT_X_V3:
        throw Error(`V4 position manager is not available for ProjectX V3`);
      case SupportedProtocol.HYBRA_V3:
        throw Error(`V4 position manager is not available for Hybra V3`);
      case SupportedProtocol.KITTENSWAP_ALGEBRA:
        throw Error(`V4 position manager is not available for KittenSwap V3`);
      case SupportedProtocol.ULTRASOLID_V3:
        throw Error(`V4 position manager is not available for UltraSolid V3`);
    }
  }

  export function getV4StateView(protocol: SupportedProtocol, network: IndexerNetwork): string | undefined {
    switch (protocol) {
      case SupportedProtocol.UNISWAP_V2:
        throw Error(`V4 state view is not available for Uniswap V2`);
      case SupportedProtocol.AERODROME_V3:
        throw Error(`V4 state view is not available for Aerodrome V3`);
      case SupportedProtocol.ALIENBASE_V3:
        throw Error(`V4 state view is not available for AlienBase V3`);
      case SupportedProtocol.BASESWAP_V3:
        throw Error(`V4 state view is not available for BaseSwap V3`);
      case SupportedProtocol.HONEYPOP_V3:
        throw Error(`V4 state view is not available for Honeypop V3`);
      case SupportedProtocol.OKU_TRADE_V3:
        throw Error(`V4 state view is not available for Oku V3`);
      case SupportedProtocol.PANCAKE_SWAP_V3:
        throw Error(`V4 state view is not available for PancakeSwap V3`);
      case SupportedProtocol.SUSHI_SWAP_V3:
        throw Error(`V4 state view is not available for SushiSwap V3`);
      case SupportedProtocol.UNISWAP_V3:
        throw Error(`V4 state view is not available for Uniswap V3`);
      case SupportedProtocol.VELODROME_V3:
        throw Error(`V4 state view is not available for Velodrome V3`);
      case SupportedProtocol.ZEBRA_V3:
        throw Error(`V4 state view is not available for Zebra V3`);
      case SupportedProtocol.PANCAKESWAP_INFINITY_CL:
        return undefined; // A State view is expected for uniswap v4, but pancakeswap v4 has a different implementation without it
      case SupportedProtocol.UNISWAP_V4:
        return V4StateViewAddress.uniswap(network);
      case SupportedProtocol.GLIQUID_ALGEBRA:
        throw Error(`V4 state view is not available for Gliquid V3`);
      case SupportedProtocol.HYPER_SWAP_V3:
        throw Error(`V4 state view is not available for HyperSwap`);
      case SupportedProtocol.PROJECT_X_V3:
        throw Error(`V4 state view is not available for ProjectX V3`);
      case SupportedProtocol.HYBRA_V3:
        throw Error(`V4 state view is not available for Hybra V3`);
      case SupportedProtocol.KITTENSWAP_ALGEBRA:
        throw Error(`V4 state view is not available for KittenSwap V3`);
      case SupportedProtocol.ULTRASOLID_V3:
        throw Error(`V4 state view is not available for UltraSolid V3`);
    }
  }

  export function getV3PositionManager(protocol: SupportedProtocol, network: IndexerNetwork): string {
    switch (protocol) {
      case SupportedProtocol.UNISWAP_V2:
        throw Error(`V3 position manager is not available for Uniswap V2`);
      case SupportedProtocol.AERODROME_V3:
        return V3PositionManagerAddress.aerodrome(network);
      case SupportedProtocol.ALIENBASE_V3:
        return V3PositionManagerAddress.alienBase(network);
      case SupportedProtocol.BASESWAP_V3:
        return V3PositionManagerAddress.baseSwap(network);
      case SupportedProtocol.HONEYPOP_V3:
        return V3PositionManagerAddress.honeypop(network);
      case SupportedProtocol.OKU_TRADE_V3:
        return V3PositionManagerAddress.uniswap(network);
      case SupportedProtocol.PANCAKE_SWAP_V3:
        return V3PositionManagerAddress.pancakeSwap(network);
      case SupportedProtocol.SUSHI_SWAP_V3:
        return V3PositionManagerAddress.sushiSwap(network);
      case SupportedProtocol.UNISWAP_V3:
        return V3PositionManagerAddress.uniswap(network);
      case SupportedProtocol.VELODROME_V3:
        return V3PositionManagerAddress.velodrome(network);
      case SupportedProtocol.ZEBRA_V3:
        return V3PositionManagerAddress.zebra(network);
      case SupportedProtocol.PANCAKESWAP_INFINITY_CL:
        throw Error(`V3 position manager is not available for PancakeSwap Infinity CL`);
      case SupportedProtocol.UNISWAP_V4:
        throw Error(`V3 position manager is not available for Uniswap V4`);
      case SupportedProtocol.GLIQUID_ALGEBRA:
        return V3PositionManagerAddress.gliquid(network);
      case SupportedProtocol.HYPER_SWAP_V3:
        return V3PositionManagerAddress.hyperSwap(network);
      case SupportedProtocol.PROJECT_X_V3:
        return V3PositionManagerAddress.projectX(network);
      case SupportedProtocol.HYBRA_V3:
        return V3PositionManagerAddress.hybra(network);
      case SupportedProtocol.KITTENSWAP_ALGEBRA:
        return V3PositionManagerAddress.kittenSwap(network);
      case SupportedProtocol.ULTRASOLID_V3:
        return V3PositionManagerAddress.ultraSolid(network);
    }
  }

  export function getV2PositionManager(protocol: SupportedProtocol, network: IndexerNetwork): string {
    switch (protocol) {
      case SupportedProtocol.UNISWAP_V2:
        return V2PositionManagerAddress.uniswap(network);
      case SupportedProtocol.AERODROME_V3:
        throw Error(`V2 position manager is not available for Aerodrome V3`);
      case SupportedProtocol.ALIENBASE_V3:
        throw Error(`V2 position manager is not available for AlienBase V3`);
      case SupportedProtocol.BASESWAP_V3:
        throw Error(`V2 position manager is not available for BaseSwap V3`);
      case SupportedProtocol.HONEYPOP_V3:
        throw Error(`V2 position manager is not available for Honeypop V3`);
      case SupportedProtocol.OKU_TRADE_V3:
        throw Error(`V2 position manager is not available for Oku V3`);
      case SupportedProtocol.PANCAKE_SWAP_V3:
        throw Error(`V2 position manager is not available for PancakeSwap V3`);
      case SupportedProtocol.SUSHI_SWAP_V3:
        throw Error(`V2 position manager is not available for SushiSwap V3`);
      case SupportedProtocol.UNISWAP_V3:
        throw Error(`V2 position manager is not available for Uniswap V3`);
      case SupportedProtocol.VELODROME_V3:
        throw Error(`V2 position manager is not available for Velodrome V3`);
      case SupportedProtocol.ZEBRA_V3:
        throw Error(`V2 position manager is not available for Zebra V3`);
      case SupportedProtocol.PANCAKESWAP_INFINITY_CL:
        throw Error(`V2 position manager is not available for PancakeSwap Infinity CL`);
      case SupportedProtocol.UNISWAP_V4:
        throw Error(`V2 position manager is not available for Uniswap V4`);
      case SupportedProtocol.GLIQUID_ALGEBRA:
        throw Error(`V2 position manager is not available for Gliquid V3`);
      case SupportedProtocol.HYPER_SWAP_V3:
        throw Error(`V2 position manager is not available for HyperSwap`);
      case SupportedProtocol.PROJECT_X_V3:
        throw Error(`V2 position manager is not available for ProjectX V3`);
      case SupportedProtocol.HYBRA_V3:
        throw Error(`V2 position manager is not available for Hybra V3`);
      case SupportedProtocol.KITTENSWAP_ALGEBRA:
        throw Error(`V2 position manager is not available for KittenSwap V3`);
      case SupportedProtocol.ULTRASOLID_V3:
        throw Error(`V2 position manager is not available for UltraSolid V3`);
    }
  }
}
