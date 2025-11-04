import assert from "assert";
import { IndexerNetwork } from "../../../src/common/enums/indexer-network";
import { SupportedProtocol } from "../../../src/common/enums/supported-protocol";
import { Permit2Address } from "../../../src/common/permit2-address";
import { V2PositionManagerAddress } from "../../../src/v2-pools/common/v2-position-manager-address";
import { V3PositionManagerAddress } from "../../../src/v3-pools/common/v3-position-manager-address";
import { V4PositionManagerAddress } from "../../../src/v4-pools/common/v4-position-manager-address";
import { V4StateViewAddress } from "../../../src/v4-pools/common/v4-state-view-address";

describe("SupportedProtocol enum values", () => {
  it("should return the correct protocol id for uniswap v2", () => {
    assert.equal(SupportedProtocol.UNISWAP_V2, "uniswap-v2");
  });
  it("should return the correct protocol id for aerodrome v3", () => {
    assert.equal(SupportedProtocol.AERODROME_V3, "aerodrome-v3");
  });
  it("should return the correct protocol id for alienbase v3", () => {
    assert.equal(SupportedProtocol.ALIENBASE_V3, "alienbase-v3");
  });
  it("should return the correct protocol id for baseswap v3", () => {
    assert.equal(SupportedProtocol.BASESWAP_V3, "baseswap-v3");
  });
  it("should return the correct protocol id for honeypop v3", () => {
    assert.equal(SupportedProtocol.HONEYPOP_V3, "honeypop-v3");
  });
  it("should return the correct protocol id for oku trade v3", () => {
    assert.equal(SupportedProtocol.OKU_TRADE_V3, "oku-trade-v3");
  });
  it("should return the correct protocol id for pancakeswap v3", () => {
    assert.equal(SupportedProtocol.PANCAKE_SWAP_V3, "pancakeswap-v3");
  });
  it("should return the correct protocol id for sushi swap v3", () => {
    assert.equal(SupportedProtocol.SUSHI_SWAP_V3, "sushi-swap-v3");
  });
  it("should return the correct protocol id for uniswap v3", () => {
    assert.equal(SupportedProtocol.UNISWAP_V3, "uniswap-v3");
  });
  it("should return the correct protocol id for velodrome v3", () => {
    assert.equal(SupportedProtocol.VELODROME_V3, "velodrome-v3");
  });
  it("should return the correct protocol id for zebra v3", () => {
    assert.equal(SupportedProtocol.ZEBRA_V3, "zebra-v3");
  });
  it("should return the correct protocol id for pancakeswap infinity cl", () => {
    assert.equal(SupportedProtocol.PANCAKESWAP_INFINITY_CL, "pancakeswap-infinity-cl");
  });
  it("should return the correct protocol id for uniswap v4", () => {
    assert.equal(SupportedProtocol.UNISWAP_V4, "uniswap-v4");
  });
  it("should return the correct protocol id for gliquid algebra", () => {
    assert.equal(SupportedProtocol.GLIQUID_ALGEBRA, "gliquid-v3");
  });
  it("should return the correct protocol id for hyperswap v3", () => {
    assert.equal(SupportedProtocol.HYPER_SWAP_V3, "hyperswap-v3");
  });
  it("should return the correct protocol id for project x v3", () => {
    assert.equal(SupportedProtocol.PROJECT_X_V3, "projectx-v3");
  });
  it("should return the correct protocol id for hybra v3", () => {
    assert.equal(SupportedProtocol.HYBRA_V3, "hybra-v3");
  });
  it("should return the correct protocol id for kittenswap algebra", () => {
    assert.equal(SupportedProtocol.KITTENSWAP_ALGEBRA, "kittenswap-v3");
  });

  it("should return the correct name for aerodrome v3", () => {
    assert.equal(SupportedProtocol.getName(SupportedProtocol.AERODROME_V3), "Aerodrome V3");
  });
  it("should return the correct name for alienbase v3", () => {
    assert.equal(SupportedProtocol.getName(SupportedProtocol.ALIENBASE_V3), "Alien Base V3");
  });
  it("should return the correct name for baseswap v3", () => {
    assert.equal(SupportedProtocol.getName(SupportedProtocol.BASESWAP_V3), "BaseSwap V3");
  });
  it("should return the correct name for honeypop v3", () => {
    assert.equal(SupportedProtocol.getName(SupportedProtocol.HONEYPOP_V3), "Honeypop V3");
  });
  it("should return the correct name for oku trade v3", () => {
    assert.equal(SupportedProtocol.getName(SupportedProtocol.OKU_TRADE_V3), "Oku V3");
  });
  it("should return the correct name for pancakeswap v3", () => {
    assert.equal(SupportedProtocol.getName(SupportedProtocol.PANCAKE_SWAP_V3), "PancakeSwap V3");
  });
  it("should return the correct name for sushi swap v3", () => {
    assert.equal(SupportedProtocol.getName(SupportedProtocol.SUSHI_SWAP_V3), "SushiSwap V3");
  });
  it("should return the correct name for uniswap v3", () => {
    assert.equal(SupportedProtocol.getName(SupportedProtocol.UNISWAP_V3), "Uniswap V3");
  });
  it("should return the correct name for velodrome v3", () => {
    assert.equal(SupportedProtocol.getName(SupportedProtocol.VELODROME_V3), "Velodrome V3");
  });
  it("should return the correct name for zebra v3", () => {
    assert.equal(SupportedProtocol.getName(SupportedProtocol.ZEBRA_V3), "Zebra V3");
  });
  it("should return the correct name for pancakeswap infinity cl", () => {
    assert.equal(SupportedProtocol.getName(SupportedProtocol.PANCAKESWAP_INFINITY_CL), "PancakeSwap Infinity CL");
  });
  it("should return the correct name for uniswap v4", () => {
    assert.equal(SupportedProtocol.getName(SupportedProtocol.UNISWAP_V4), "Uniswap V4");
  });
  it("should return the correct name for gliquid algebra", () => {
    assert.equal(SupportedProtocol.getName(SupportedProtocol.GLIQUID_ALGEBRA), "Gliquid Algebra");
  });
  it("should return the correct name for hyperswap v3", () => {
    assert.equal(SupportedProtocol.getName(SupportedProtocol.HYPER_SWAP_V3), "HyperSwap V3");
  });
  it("should return the correct name for project x v3", () => {
    assert.equal(SupportedProtocol.getName(SupportedProtocol.PROJECT_X_V3), "Project X V3");
  });
  it("should return the correct name for hybra v3", () => {
    assert.equal(SupportedProtocol.getName(SupportedProtocol.HYBRA_V3), "Hybra V3");
  });
  it("should return the correct name for kittenswap algebra", () => {
    assert.equal(SupportedProtocol.getName(SupportedProtocol.KITTENSWAP_ALGEBRA), "Kittenswap Algebra");
  });

  it("should return the correct url for uniswap v2", () => {
    assert.equal(SupportedProtocol.getUrl(SupportedProtocol.UNISWAP_V2), "https://uniswap.org/");
  });
  it("should return the correct url for aerodrome v3", () => {
    assert.equal(SupportedProtocol.getUrl(SupportedProtocol.AERODROME_V3), "https://aerodrome.finance");
  });
  it("should return the correct url for alienbase v3", () => {
    assert.equal(SupportedProtocol.getUrl(SupportedProtocol.ALIENBASE_V3), "https://app.alienbase.xyz/");
  });
  it("should return the correct url for baseswap v3", () => {
    assert.equal(SupportedProtocol.getUrl(SupportedProtocol.BASESWAP_V3), "https://baseswap.fi/");
  });
  it("should return the correct url for honeypop v3", () => {
    assert.equal(SupportedProtocol.getUrl(SupportedProtocol.HONEYPOP_V3), "https://honeypop.app/");
  });
  it("should return the correct url for oku trade v3", () => {
    assert.equal(SupportedProtocol.getUrl(SupportedProtocol.OKU_TRADE_V3), "https://oku.trade/");
  });
  it("should return the correct url for pancakeswap v3", () => {
    assert.equal(SupportedProtocol.getUrl(SupportedProtocol.PANCAKE_SWAP_V3), "https://pancakeswap.finance/");
  });
  it("should return the correct url for sushi swap v3", () => {
    assert.equal(SupportedProtocol.getUrl(SupportedProtocol.SUSHI_SWAP_V3), "https://sushi.com/");
  });
  it("should return the correct url for uniswap v3", () => {
    assert.equal(SupportedProtocol.getUrl(SupportedProtocol.UNISWAP_V3), "https://uniswap.org/");
  });
  it("should return the correct url for velodrome v3", () => {
    assert.equal(SupportedProtocol.getUrl(SupportedProtocol.VELODROME_V3), "https://velodrome.finance/");
  });
  it("should return the correct url for zebra v3", () => {
    assert.equal(SupportedProtocol.getUrl(SupportedProtocol.ZEBRA_V3), "https://zebra.xyz/");
  });
  it("should return the correct url for pancakeswap infinity cl", () => {
    assert.equal(SupportedProtocol.getUrl(SupportedProtocol.PANCAKESWAP_INFINITY_CL), "https://pancakeswap.finance/");
  });
  it("should return the correct url for uniswap v4", () => {
    assert.equal(SupportedProtocol.getUrl(SupportedProtocol.UNISWAP_V4), "https://uniswap.org/");
  });
  it("should return the correct url for gliquid algebra", () => {
    assert.equal(SupportedProtocol.getUrl(SupportedProtocol.GLIQUID_ALGEBRA), "https://gliquid.xyz/");
  });
  it("should return the correct url for hyperswap v3", () => {
    assert.equal(SupportedProtocol.getUrl(SupportedProtocol.HYPER_SWAP_V3), "https://hyperswap.exchange/");
  });
  it("should return the correct url for project x v3", () => {
    assert.equal(SupportedProtocol.getUrl(SupportedProtocol.PROJECT_X_V3), "https://prjx.com/");
  });
  it("should return the correct url for hybra v3", () => {
    assert.equal(SupportedProtocol.getUrl(SupportedProtocol.HYBRA_V3), "https://hybra.finance/");
  });
  it("should return the correct url for kittenswap algebra", () => {
    assert.equal(SupportedProtocol.getUrl(SupportedProtocol.KITTENSWAP_ALGEBRA), "https://kittenswap.finance/");
  });
  it("should return the correct logo url for uniswap v2", () => {
    assert.equal(
      SupportedProtocol.getLogoUrl(SupportedProtocol.UNISWAP_V2),
      "https://assets-cdn.trustwallet.com/dapps/app.uniswap.org.png"
    );
  });
  it("should return the correct logo url for aerodrome v3", () => {
    assert.equal(
      SupportedProtocol.getLogoUrl(SupportedProtocol.AERODROME_V3),
      "https://assets-cdn.trustwallet.com/dapps/aerodrome.finance.png"
    );
  });
  it("should return the correct logo url for alienbase v3", () => {
    assert.equal(
      SupportedProtocol.getLogoUrl(SupportedProtocol.ALIENBASE_V3),
      "https://s2.coinmarketcap.com/static/img/coins/200x200/30543.png"
    );
  });
  it("should return the correct logo url for baseswap v3", () => {
    assert.equal(
      SupportedProtocol.getLogoUrl(SupportedProtocol.BASESWAP_V3),
      "https://s2.coinmarketcap.com/static/img/coins/200x200/27764.png"
    );
  });
  it("should return the correct logo url for honeypop v3", () => {
    assert.equal(
      SupportedProtocol.getLogoUrl(SupportedProtocol.HONEYPOP_V3),
      "https://assets.coingecko.com/markets/images/22073/large/honeypop.jpg"
    );
  });
  it("should return the correct logo url for oku trade v3", () => {
    assert.equal(
      SupportedProtocol.getLogoUrl(SupportedProtocol.OKU_TRADE_V3),
      "https://img.cryptorank.io/exchanges/150x150.oku_plasma1759142972702.png"
    );
  });
  it("should return the correct logo url for pancakeswap v3", () => {
    assert.equal(
      SupportedProtocol.getLogoUrl(SupportedProtocol.PANCAKE_SWAP_V3),
      "https://assets-cdn.trustwallet.com/dapps/pancakeswap.finance.png"
    );
  });
  it("should return the correct logo url for sushi swap v3", () => {
    assert.equal(
      SupportedProtocol.getLogoUrl(SupportedProtocol.SUSHI_SWAP_V3),
      "https://assets-cdn.trustwallet.com/dapps/app.sushi.com.png"
    );
  });
  it("should return the correct logo url for uniswap v3", () => {
    assert.equal(
      SupportedProtocol.getLogoUrl(SupportedProtocol.UNISWAP_V3),
      "https://assets-cdn.trustwallet.com/dapps/app.uniswap.org.png"
    );
  });
  it("should return the correct logo url for velodrome v3", () => {
    assert.equal(
      SupportedProtocol.getLogoUrl(SupportedProtocol.VELODROME_V3),
      "https://img.cryptorank.io/coins/velodrome_finance1662552933961.png"
    );
  });
  it("should return the correct logo url for zebra v3", () => {
    assert.equal(
      SupportedProtocol.getLogoUrl(SupportedProtocol.ZEBRA_V3),
      "https://img.cryptorank.io/coins/zebra1717767206306.png"
    );
  });
  it("should return the correct logo url for pancakeswap infinity cl", () => {
    assert.equal(
      SupportedProtocol.getLogoUrl(SupportedProtocol.PANCAKESWAP_INFINITY_CL),
      "https://assets-cdn.trustwallet.com/dapps/pancakeswap.finance.png"
    );
  });
  it("should return the correct logo url for uniswap v4", () => {
    assert.equal(
      SupportedProtocol.getLogoUrl(SupportedProtocol.UNISWAP_V4),
      "https://assets-cdn.trustwallet.com/dapps/app.uniswap.org.png"
    );
  });
  it("should return the correct logo url for gliquid algebra", () => {
    assert.equal(
      SupportedProtocol.getLogoUrl(SupportedProtocol.GLIQUID_ALGEBRA),
      "https://assets.coingecko.com/markets/images/21975/large/GLiquid_PFP_%28New_Logo%29_%281%29.png"
    );
  });
  it("should return the correct logo url for hyperswap v3", () => {
    assert.equal(
      SupportedProtocol.getLogoUrl(SupportedProtocol.HYPER_SWAP_V3),
      "https://img.cryptorank.io/exchanges/150x150.hyper_swap_v_21740409894268.png"
    );
  });
  it("should return the correct logo url for project x v3", () => {
    assert.equal(
      SupportedProtocol.getLogoUrl(SupportedProtocol.PROJECT_X_V3),
      "https://img.cryptorank.io/exchanges/150x150.project_x1752845857616.png"
    );
  });
  it("should return the correct logo url for hybra v3", () => {
    assert.equal(
      SupportedProtocol.getLogoUrl(SupportedProtocol.HYBRA_V3),
      "https://img.cryptorank.io/exchanges/150x150.hybra_finance1752836948767.png"
    );
  });
  it("should return the correct logo url for kittenswap algebra", () => {
    assert.equal(
      SupportedProtocol.getLogoUrl(SupportedProtocol.KITTENSWAP_ALGEBRA),
      "https://img.cryptorank.io/exchanges/150x150.kittenswap1744291199109.png"
    );
  });
  it("should return the correct permit2 address for uniswap v2", () => {
    assert.equal(
      SupportedProtocol.getPermit2Address(SupportedProtocol.UNISWAP_V2, IndexerNetwork.BASE),
      Permit2Address.uniswap(IndexerNetwork.BASE)
    );
  });
  it("should throw for aerodrome v3", () => {
    assert.throws(
      () => SupportedProtocol.getPermit2Address(SupportedProtocol.AERODROME_V3, IndexerNetwork.BASE),
      /Permit2 is not available for Aerodrome V3/
    );
  });
  it("should throw for alienbase v3", () => {
    assert.throws(
      () => SupportedProtocol.getPermit2Address(SupportedProtocol.ALIENBASE_V3, IndexerNetwork.BASE),
      /Permit2 is not available for AlienBase V3/
    );
  });
  it("should throw for baseswap v3", () => {
    assert.throws(
      () => SupportedProtocol.getPermit2Address(SupportedProtocol.BASESWAP_V3, IndexerNetwork.BASE),
      /Permit2 is not available for BaseSwap V3/
    );
  });
  it("should throw for honeypop v3", () => {
    assert.throws(
      () => SupportedProtocol.getPermit2Address(SupportedProtocol.HONEYPOP_V3, IndexerNetwork.BASE),
      /Permit2 is not available for Honeypop V3/
    );
  });
  it("should return the correct permit2 address for oku trade v3", () => {
    assert.equal(
      SupportedProtocol.getPermit2Address(SupportedProtocol.OKU_TRADE_V3, IndexerNetwork.BASE),
      Permit2Address.uniswap(IndexerNetwork.BASE)
    );
  });
  it("should return the correct permit2 address for pancakeswap v3", () => {
    assert.equal(
      SupportedProtocol.getPermit2Address(SupportedProtocol.PANCAKE_SWAP_V3, IndexerNetwork.BASE),
      Permit2Address.pancakeSwap(IndexerNetwork.BASE)
    );
  });
  it("should throw for sushi swap v3", () => {
    assert.throws(
      () => SupportedProtocol.getPermit2Address(SupportedProtocol.SUSHI_SWAP_V3, IndexerNetwork.BASE),
      /Permit2 is not available for SushiSwap V3/
    );
  });
  it("should return the correct permit2 address for uniswap v3", () => {
    assert.equal(
      SupportedProtocol.getPermit2Address(SupportedProtocol.UNISWAP_V3, IndexerNetwork.BASE),
      Permit2Address.uniswap(IndexerNetwork.BASE)
    );
  });
  it("should throw for velodrome v3", () => {
    assert.throws(
      () => SupportedProtocol.getPermit2Address(SupportedProtocol.VELODROME_V3, IndexerNetwork.BASE),
      /Permit2 is not available for Velodrome V3/
    );
  });
  it("should throw for zebra v3", () => {
    assert.throws(
      () => SupportedProtocol.getPermit2Address(SupportedProtocol.ZEBRA_V3, IndexerNetwork.BASE),
      /Permit2 is not available for Zebra V3/
    );
  });
  it("should return the correct permit2 address for pancakeswap infinity cl", () => {
    assert.equal(
      SupportedProtocol.getPermit2Address(SupportedProtocol.PANCAKESWAP_INFINITY_CL, IndexerNetwork.BASE),
      Permit2Address.pancakeSwap(IndexerNetwork.BASE)
    );
  });
  it("should return the correct permit2 address for uniswap v4", () => {
    assert.equal(
      SupportedProtocol.getPermit2Address(SupportedProtocol.UNISWAP_V4, IndexerNetwork.BASE),
      Permit2Address.uniswap(IndexerNetwork.BASE)
    );
  });
  it("should throw for gliquid algebra", () => {
    assert.throws(
      () => SupportedProtocol.getPermit2Address(SupportedProtocol.GLIQUID_ALGEBRA, IndexerNetwork.BASE),
      /Permit2 is not available for Gliquid V3/
    );
  });
  it("should throw for hyperswap v3", () => {
    assert.throws(
      () => SupportedProtocol.getPermit2Address(SupportedProtocol.HYPER_SWAP_V3, IndexerNetwork.BASE),
      /Permit2 is not available for HyperSwap/
    );
  });
  it("should throw for project x v3", () => {
    assert.throws(
      () => SupportedProtocol.getPermit2Address(SupportedProtocol.PROJECT_X_V3, IndexerNetwork.BASE),
      /Permit2 is not available for ProjectX V3/
    );
  });
  it("should throw for hybra v3", () => {
    assert.throws(
      () => SupportedProtocol.getPermit2Address(SupportedProtocol.HYBRA_V3, IndexerNetwork.BASE),
      /Permit2 is not available for Hybra V3/
    );
  });
  it("should throw for kittenswap algebra", () => {
    assert.throws(
      () => SupportedProtocol.getPermit2Address(SupportedProtocol.KITTENSWAP_ALGEBRA, IndexerNetwork.BASE),
      /Permit2 is not available for KittenSwap V3/
    );
  });
  it("should throw for uniswap v2", () => {
    assert.throws(
      () => SupportedProtocol.getV4PositionManager(SupportedProtocol.UNISWAP_V2, IndexerNetwork.BASE),
      /V4 position manager is not available for Uniswap V2/
    );
  });
  it("should throw for aerodrome v3", () => {
    assert.throws(
      () => SupportedProtocol.getV4PositionManager(SupportedProtocol.AERODROME_V3, IndexerNetwork.BASE),
      /V4 position manager is not available for Aerodrome V3/
    );
  });
  it("should throw for alienbase v3", () => {
    assert.throws(
      () => SupportedProtocol.getV4PositionManager(SupportedProtocol.ALIENBASE_V3, IndexerNetwork.BASE),
      /V4 position manager is not available for AlienBase V3/
    );
  });
  it("should throw for baseswap v3", () => {
    assert.throws(
      () => SupportedProtocol.getV4PositionManager(SupportedProtocol.BASESWAP_V3, IndexerNetwork.BASE),
      /V4 position manager is not available for BaseSwap V3/
    );
  });
  it("should throw for honeypop v3", () => {
    assert.throws(
      () => SupportedProtocol.getV4PositionManager(SupportedProtocol.HONEYPOP_V3, IndexerNetwork.BASE),
      /V4 position manager is not available for Honeypop V3/
    );
  });
  it("should throw for oku trade v3", () => {
    assert.throws(
      () => SupportedProtocol.getV4PositionManager(SupportedProtocol.OKU_TRADE_V3, IndexerNetwork.BASE),
      /V4 position manager is not available for Oku V3/
    );
  });
  it("should throw for pancakeswap v3", () => {
    assert.throws(
      () => SupportedProtocol.getV4PositionManager(SupportedProtocol.PANCAKE_SWAP_V3, IndexerNetwork.BASE),
      /V4 position manager is not available for PancakeSwap V3/
    );
  });
  it("should throw for sushi swap v3", () => {
    assert.throws(
      () => SupportedProtocol.getV4PositionManager(SupportedProtocol.SUSHI_SWAP_V3, IndexerNetwork.BASE),
      /V4 position manager is not available for SushiSwap V3/
    );
  });
  it("should throw for uniswap v3", () => {
    assert.throws(
      () => SupportedProtocol.getV4PositionManager(SupportedProtocol.UNISWAP_V3, IndexerNetwork.BASE),
      /V4 position manager is not available for Uniswap V3/
    );
  });
  it("should throw for velodrome v3", () => {
    assert.throws(
      () => SupportedProtocol.getV4PositionManager(SupportedProtocol.VELODROME_V3, IndexerNetwork.BASE),
      /V4 position manager is not available for Velodrome V3/
    );
  });
  it("should throw for zebra v3", () => {
    assert.throws(
      () => SupportedProtocol.getV4PositionManager(SupportedProtocol.ZEBRA_V3, IndexerNetwork.BASE),
      /V4 position manager is not available for Zebra V3/
    );
  });
  it("should return the correct v4 position manager for pancakeswap infinity cl", () => {
    assert.equal(
      SupportedProtocol.getV4PositionManager(SupportedProtocol.PANCAKESWAP_INFINITY_CL, IndexerNetwork.BASE),
      V4PositionManagerAddress.pancakeSwap(IndexerNetwork.BASE)
    );
  });
  it("should return the correct v4 position manager for uniswap v4", () => {
    assert.equal(
      SupportedProtocol.getV4PositionManager(SupportedProtocol.UNISWAP_V4, IndexerNetwork.BASE),
      V4PositionManagerAddress.uniswap(IndexerNetwork.BASE)
    );
  });
  it("should throw for gliquid algebra", () => {
    assert.throws(
      () => SupportedProtocol.getV4PositionManager(SupportedProtocol.GLIQUID_ALGEBRA, IndexerNetwork.BASE),
      /V4 position manager is not available for Gliquid V3/
    );
  });
  it("should throw for hyperswap v3", () => {
    assert.throws(
      () => SupportedProtocol.getV4PositionManager(SupportedProtocol.HYPER_SWAP_V3, IndexerNetwork.BASE),
      /V4 position manager is not available for HyperSwap/
    );
  });
  it("should throw for project x v3", () => {
    assert.throws(
      () => SupportedProtocol.getV4PositionManager(SupportedProtocol.PROJECT_X_V3, IndexerNetwork.BASE),
      /V4 position manager is not available for ProjectX V3/
    );
  });
  it("should throw for hybra v3", () => {
    assert.throws(
      () => SupportedProtocol.getV4PositionManager(SupportedProtocol.HYBRA_V3, IndexerNetwork.BASE),
      /V4 position manager is not available for Hybra V3/
    );
  });
  it("should throw for kittenswap algebra", () => {
    assert.throws(
      () => SupportedProtocol.getV4PositionManager(SupportedProtocol.KITTENSWAP_ALGEBRA, IndexerNetwork.BASE),
      /V4 position manager is not available for KittenSwap V3/
    );
  });
  it("should throw for uniswap v2", () => {
    assert.throws(
      () => SupportedProtocol.getV4StateView(SupportedProtocol.UNISWAP_V2, IndexerNetwork.BASE),
      /V4 state view is not available for Uniswap V2/
    );
  });
  it("should throw for aerodrome v3", () => {
    assert.throws(
      () => SupportedProtocol.getV4StateView(SupportedProtocol.AERODROME_V3, IndexerNetwork.BASE),
      /V4 state view is not available for Aerodrome V3/
    );
  });
  it("should throw for alienbase v3", () => {
    assert.throws(
      () => SupportedProtocol.getV4StateView(SupportedProtocol.ALIENBASE_V3, IndexerNetwork.BASE),
      /V4 state view is not available for AlienBase V3/
    );
  });
  it("should throw for baseswap v3", () => {
    assert.throws(
      () => SupportedProtocol.getV4StateView(SupportedProtocol.BASESWAP_V3, IndexerNetwork.BASE),
      /V4 state view is not available for BaseSwap V3/
    );
  });
  it("should throw for honeypop v3", () => {
    assert.throws(
      () => SupportedProtocol.getV4StateView(SupportedProtocol.HONEYPOP_V3, IndexerNetwork.BASE),
      /V4 state view is not available for Honeypop V3/
    );
  });
  it("should throw for oku trade v3", () => {
    assert.throws(
      () => SupportedProtocol.getV4StateView(SupportedProtocol.OKU_TRADE_V3, IndexerNetwork.BASE),
      /V4 state view is not available for Oku V3/
    );
  });
  it("should throw for pancakeswap v3", () => {
    assert.throws(
      () => SupportedProtocol.getV4StateView(SupportedProtocol.PANCAKE_SWAP_V3, IndexerNetwork.BASE),
      /V4 state view is not available for PancakeSwap V3/
    );
  });
  it("should throw for sushi swap v3", () => {
    assert.throws(
      () => SupportedProtocol.getV4StateView(SupportedProtocol.SUSHI_SWAP_V3, IndexerNetwork.BASE),
      /V4 state view is not available for SushiSwap V3/
    );
  });
  it("should throw for uniswap v3", () => {
    assert.throws(
      () => SupportedProtocol.getV4StateView(SupportedProtocol.UNISWAP_V3, IndexerNetwork.BASE),
      /V4 state view is not available for Uniswap V3/
    );
  });
  it("should throw for velodrome v3", () => {
    assert.throws(
      () => SupportedProtocol.getV4StateView(SupportedProtocol.VELODROME_V3, IndexerNetwork.BASE),
      /V4 state view is not available for Velodrome V3/
    );
  });
  it("should throw for zebra v3", () => {
    assert.throws(
      () => SupportedProtocol.getV4StateView(SupportedProtocol.ZEBRA_V3, IndexerNetwork.BASE),
      /V4 state view is not available for Zebra V3/
    );
  });
  it("should return undefined for pancakeswap infinity cl", () => {
    assert.equal(
      SupportedProtocol.getV4StateView(SupportedProtocol.PANCAKESWAP_INFINITY_CL, IndexerNetwork.BASE),
      undefined
    );
  });
  it("should return the correct v4 state view for uniswap v4", () => {
    assert.equal(
      SupportedProtocol.getV4StateView(SupportedProtocol.UNISWAP_V4, IndexerNetwork.BASE),
      V4StateViewAddress.uniswap(IndexerNetwork.BASE)
    );
  });
  it("should throw for gliquid algebra", () => {
    assert.throws(
      () => SupportedProtocol.getV4StateView(SupportedProtocol.GLIQUID_ALGEBRA, IndexerNetwork.BASE),
      /V4 state view is not available for Gliquid V3/
    );
  });
  it("should throw for hyperswap v3", () => {
    assert.throws(
      () => SupportedProtocol.getV4StateView(SupportedProtocol.HYPER_SWAP_V3, IndexerNetwork.BASE),
      /V4 state view is not available for HyperSwap/
    );
  });
  it("should throw for project x v3", () => {
    assert.throws(
      () => SupportedProtocol.getV4StateView(SupportedProtocol.PROJECT_X_V3, IndexerNetwork.BASE),
      /V4 state view is not available for ProjectX V3/
    );
  });
  it("should throw for hybra v3", () => {
    assert.throws(
      () => SupportedProtocol.getV4StateView(SupportedProtocol.HYBRA_V3, IndexerNetwork.BASE),
      /V4 state view is not available for Hybra V3/
    );
  });
  it("should throw for kittenswap algebra", () => {
    assert.throws(
      () => SupportedProtocol.getV4StateView(SupportedProtocol.KITTENSWAP_ALGEBRA, IndexerNetwork.BASE),
      /V4 state view is not available for KittenSwap V3/
    );
  });
  it("should throw for uniswap v2 when calling getV3PositionManager", () => {
    assert.throws(
      () => SupportedProtocol.getV3PositionManager(SupportedProtocol.UNISWAP_V2, IndexerNetwork.BASE),
      /V3 position manager is not available for Uniswap V2/
    );
  });
  it("should return aerodrome address when calling getV3PositionManager", () => {
    assert.equal(
      SupportedProtocol.getV3PositionManager(SupportedProtocol.AERODROME_V3, IndexerNetwork.BASE),
      V3PositionManagerAddress.aerodrome(IndexerNetwork.BASE)
    );
  });
  it("should return alienbase address when calling getV3PositionManager", () => {
    assert.equal(
      SupportedProtocol.getV3PositionManager(SupportedProtocol.ALIENBASE_V3, IndexerNetwork.BASE),
      V3PositionManagerAddress.alienBase(IndexerNetwork.BASE)
    );
  });
  it("should return baseswap address when calling getV3PositionManager", () => {
    assert.equal(
      SupportedProtocol.getV3PositionManager(SupportedProtocol.BASESWAP_V3, IndexerNetwork.BASE),
      V3PositionManagerAddress.baseSwap(IndexerNetwork.BASE)
    );
  });
  it("should return honeypop address when calling getV3PositionManager", () => {
    assert.equal(
      SupportedProtocol.getV3PositionManager(SupportedProtocol.HONEYPOP_V3, IndexerNetwork.SCROLL),
      V3PositionManagerAddress.honeypop(IndexerNetwork.SCROLL)
    );
  });
  it("should return uniswap address for oku trade v3 when calling getV3PositionManager", () => {
    assert.equal(
      SupportedProtocol.getV3PositionManager(SupportedProtocol.OKU_TRADE_V3, IndexerNetwork.BASE),
      V3PositionManagerAddress.uniswap(IndexerNetwork.BASE)
    );
  });
  it("should return pancakeswap address when calling getV3PositionManager", () => {
    assert.equal(
      SupportedProtocol.getV3PositionManager(SupportedProtocol.PANCAKE_SWAP_V3, IndexerNetwork.BASE),
      V3PositionManagerAddress.pancakeSwap(IndexerNetwork.BASE)
    );
  });
  it("should return sushiswap address when calling getV3PositionManager", () => {
    assert.equal(
      SupportedProtocol.getV3PositionManager(SupportedProtocol.SUSHI_SWAP_V3, IndexerNetwork.BASE),
      V3PositionManagerAddress.sushiSwap(IndexerNetwork.BASE)
    );
  });
  it("should return uniswap address for uniswap v3 when calling getV3PositionManager", () => {
    assert.equal(
      SupportedProtocol.getV3PositionManager(SupportedProtocol.UNISWAP_V3, IndexerNetwork.BASE),
      V3PositionManagerAddress.uniswap(IndexerNetwork.BASE)
    );
  });
  it("should return velodrome address when calling getV3PositionManager", () => {
    assert.equal(
      SupportedProtocol.getV3PositionManager(SupportedProtocol.VELODROME_V3, IndexerNetwork.UNICHAIN),
      V3PositionManagerAddress.velodrome(IndexerNetwork.UNICHAIN)
    );
  });
  it("should return zebra address when calling getV3PositionManager", () => {
    assert.equal(
      SupportedProtocol.getV3PositionManager(SupportedProtocol.ZEBRA_V3, IndexerNetwork.SCROLL),
      V3PositionManagerAddress.zebra(IndexerNetwork.SCROLL)
    );
  });
  it("should throw for pancakeswap infinity cl when calling getV3PositionManager", () => {
    assert.throws(
      () => SupportedProtocol.getV3PositionManager(SupportedProtocol.PANCAKESWAP_INFINITY_CL, IndexerNetwork.BASE),
      /V3 position manager is not available for PancakeSwap Infinity CL/
    );
  });
  it("should throw for uniswap v4 when calling getV3PositionManager", () => {
    assert.throws(
      () => SupportedProtocol.getV3PositionManager(SupportedProtocol.UNISWAP_V4, IndexerNetwork.BASE),
      /V3 position manager is not available for Uniswap V4/
    );
  });
  it("should return gliquid address when calling getV3PositionManager", () => {
    assert.equal(
      SupportedProtocol.getV3PositionManager(SupportedProtocol.GLIQUID_ALGEBRA, IndexerNetwork.HYPER_EVM),
      V3PositionManagerAddress.gliquid(IndexerNetwork.HYPER_EVM)
    );
  });
  it("should return hyperswap address when calling getV3PositionManager", () => {
    assert.equal(
      SupportedProtocol.getV3PositionManager(SupportedProtocol.HYPER_SWAP_V3, IndexerNetwork.HYPER_EVM),
      V3PositionManagerAddress.hyperSwap(IndexerNetwork.HYPER_EVM)
    );
  });
  it("should return projectx address when calling getV3PositionManager", () => {
    assert.equal(
      SupportedProtocol.getV3PositionManager(SupportedProtocol.PROJECT_X_V3, IndexerNetwork.HYPER_EVM),
      V3PositionManagerAddress.projectX(IndexerNetwork.HYPER_EVM)
    );
  });
  it("should return hybra address when calling getV3PositionManager", () => {
    assert.equal(
      SupportedProtocol.getV3PositionManager(SupportedProtocol.HYBRA_V3, IndexerNetwork.HYPER_EVM),
      V3PositionManagerAddress.hybra(IndexerNetwork.HYPER_EVM)
    );
  });
  it("should return kittenswap address when calling getV3PositionManager", () => {
    assert.equal(
      SupportedProtocol.getV3PositionManager(SupportedProtocol.KITTENSWAP_ALGEBRA, IndexerNetwork.HYPER_EVM),
      V3PositionManagerAddress.kittenSwap(IndexerNetwork.HYPER_EVM)
    );
  });
  it("should return uniswap address when calling getV2PositionManager for uniswap v2", () => {
    assert.equal(
      SupportedProtocol.getV2PositionManager(SupportedProtocol.UNISWAP_V2, IndexerNetwork.BASE),
      V2PositionManagerAddress.uniswap(IndexerNetwork.BASE)
    );
  });
  it("should throw for aerodrome v3 when calling getV2PositionManager", () => {
    assert.throws(
      () => SupportedProtocol.getV2PositionManager(SupportedProtocol.AERODROME_V3, IndexerNetwork.BASE),
      /V2 position manager is not available for Aerodrome V3/
    );
  });
  it("should throw for alienbase v3 when calling getV2PositionManager", () => {
    assert.throws(
      () => SupportedProtocol.getV2PositionManager(SupportedProtocol.ALIENBASE_V3, IndexerNetwork.BASE),
      /V2 position manager is not available for AlienBase V3/
    );
  });
  it("should throw for baseswap v3 when calling getV2PositionManager", () => {
    assert.throws(
      () => SupportedProtocol.getV2PositionManager(SupportedProtocol.BASESWAP_V3, IndexerNetwork.BASE),
      /V2 position manager is not available for BaseSwap V3/
    );
  });
  it("should throw for honeypop v3 when calling getV2PositionManager", () => {
    assert.throws(
      () => SupportedProtocol.getV2PositionManager(SupportedProtocol.HONEYPOP_V3, IndexerNetwork.BASE),
      /V2 position manager is not available for Honeypop V3/
    );
  });
  it("should throw for oku trade v3 when calling getV2PositionManager", () => {
    assert.throws(
      () => SupportedProtocol.getV2PositionManager(SupportedProtocol.OKU_TRADE_V3, IndexerNetwork.BASE),
      /V2 position manager is not available for Oku V3/
    );
  });
  it("should throw for pancakeswap v3 when calling getV2PositionManager", () => {
    assert.throws(
      () => SupportedProtocol.getV2PositionManager(SupportedProtocol.PANCAKE_SWAP_V3, IndexerNetwork.BASE),
      /V2 position manager is not available for PancakeSwap V3/
    );
  });
  it("should throw for sushi swap v3 when calling getV2PositionManager", () => {
    assert.throws(
      () => SupportedProtocol.getV2PositionManager(SupportedProtocol.SUSHI_SWAP_V3, IndexerNetwork.BASE),
      /V2 position manager is not available for SushiSwap V3/
    );
  });
  it("should throw for uniswap v3 when calling getV2PositionManager", () => {
    assert.throws(
      () => SupportedProtocol.getV2PositionManager(SupportedProtocol.UNISWAP_V3, IndexerNetwork.BASE),
      /V2 position manager is not available for Uniswap V3/
    );
  });
  it("should throw for velodrome v3 when calling getV2PositionManager", () => {
    assert.throws(
      () => SupportedProtocol.getV2PositionManager(SupportedProtocol.VELODROME_V3, IndexerNetwork.BASE),
      /V2 position manager is not available for Velodrome V3/
    );
  });
  it("should throw for zebra v3 when calling getV2PositionManager", () => {
    assert.throws(
      () => SupportedProtocol.getV2PositionManager(SupportedProtocol.ZEBRA_V3, IndexerNetwork.BASE),
      /V2 position manager is not available for Zebra V3/
    );
  });
  it("should throw for pancakeswap infinity cl when calling getV2PositionManager", () => {
    assert.throws(
      () => SupportedProtocol.getV2PositionManager(SupportedProtocol.PANCAKESWAP_INFINITY_CL, IndexerNetwork.BASE),
      /V2 position manager is not available for PancakeSwap Infinity CL/
    );
  });
  it("should throw for uniswap v4 when calling getV2PositionManager", () => {
    assert.throws(
      () => SupportedProtocol.getV2PositionManager(SupportedProtocol.UNISWAP_V4, IndexerNetwork.BASE),
      /V2 position manager is not available for Uniswap V4/
    );
  });
  it("should throw for gliquid algebra when calling getV2PositionManager", () => {
    assert.throws(
      () => SupportedProtocol.getV2PositionManager(SupportedProtocol.GLIQUID_ALGEBRA, IndexerNetwork.BASE),
      /V2 position manager is not available for Gliquid V3/
    );
  });
  it("should throw for hyperswap v3 when calling getV2PositionManager", () => {
    assert.throws(
      () => SupportedProtocol.getV2PositionManager(SupportedProtocol.HYPER_SWAP_V3, IndexerNetwork.BASE),
      /V2 position manager is not available for HyperSwap/
    );
  });
  it("should throw for project x v3 when calling getV2PositionManager", () => {
    assert.throws(
      () => SupportedProtocol.getV2PositionManager(SupportedProtocol.PROJECT_X_V3, IndexerNetwork.BASE),
      /V2 position manager is not available for ProjectX V3/
    );
  });
  it("should throw for hybra v3 when calling getV2PositionManager", () => {
    assert.throws(
      () => SupportedProtocol.getV2PositionManager(SupportedProtocol.HYBRA_V3, IndexerNetwork.BASE),
      /V2 position manager is not available for Hybra V3/
    );
  });
  it("should throw for kittenswap algebra when calling getV2PositionManager", () => {
    assert.throws(
      () => SupportedProtocol.getV2PositionManager(SupportedProtocol.KITTENSWAP_ALGEBRA, IndexerNetwork.BASE),
      /V2 position manager is not available for KittenSwap V3/
    );
  });

  describe("Ultrasolid V3", () => {
    it("should return the correct id for ultrasolid v3", () => {
      assert.equal(SupportedProtocol.ULTRASOLID_V3, "ultrasolid-v3");
    });

    it("should return the correct name for ultrasolid v3", () => {
      assert.equal(SupportedProtocol.getName(SupportedProtocol.ULTRASOLID_V3), "UltraSolid V3");
    });

    it("should return the correct url for ultrasolid v3", () => {
      assert.equal(SupportedProtocol.getUrl(SupportedProtocol.ULTRASOLID_V3), "https://ultrasolid.xyz/");
    });

    it("should return the correct logo url for ultrasolid v3", () => {
      assert.equal(
        SupportedProtocol.getLogoUrl(SupportedProtocol.ULTRASOLID_V3),
        "https://img.cryptorank.io/exchanges/150x150.ultra_solid_v_31759320847099.png"
      );
    });

    it("should throw for ultrasolid v3 when calling getPermit2Address", () => {
      assert.throws(
        () => SupportedProtocol.getPermit2Address(SupportedProtocol.ULTRASOLID_V3, IndexerNetwork.BASE),
        /Permit2 is not available for UltraSolid V3/
      );
    });

    it("should throw for ultrasolid v3 when calling getV4PositionManager", () => {
      assert.throws(
        () => SupportedProtocol.getV4PositionManager(SupportedProtocol.ULTRASOLID_V3, IndexerNetwork.BASE),
        /V4 position manager is not available for UltraSolid V3/
      );
    });

    it("should throw for ultrasolid v3 when calling getV4StateView", () => {
      assert.throws(
        () => SupportedProtocol.getV4StateView(SupportedProtocol.ULTRASOLID_V3, IndexerNetwork.BASE),
        /V4 state view is not available for UltraSolid V3/
      );
    });

    it("should return the correct v3 position manager for ultrasolid v3 when calling getV3PositionManager", () => {
      assert.equal(
        SupportedProtocol.getV3PositionManager(SupportedProtocol.ULTRASOLID_V3, IndexerNetwork.HYPER_EVM),
        V3PositionManagerAddress.ultraSolid(IndexerNetwork.HYPER_EVM)
      );
    });

    it("should throw for ultrasolid v3 when calling getV2PositionManager", () => {
      assert.throws(
        () => SupportedProtocol.getV2PositionManager(SupportedProtocol.ULTRASOLID_V3, IndexerNetwork.BASE),
        /V2 position manager is not available for UltraSolid V3/
      );
    });
  });

  describe("Upheaval V3", () => {
    it("should return the correct id for upheaval v3", () => {
      assert.equal(SupportedProtocol.UPHEAVAL_V3, "upheaval-v3");
    });

    it("should return the correct name for upheaval v3", () => {
      assert.equal(SupportedProtocol.getName(SupportedProtocol.UPHEAVAL_V3), "Upheaval V3");
    });

    it("should return the correct url for upheaval v3", () => {
      assert.equal(SupportedProtocol.getUrl(SupportedProtocol.UPHEAVAL_V3), "https://upheaval.fi/");
    });

    it("should return the correct logo url for upheaval v3", () => {
      assert.equal(
        SupportedProtocol.getLogoUrl(SupportedProtocol.UPHEAVAL_V3),
        "https://assets.coingecko.com/markets/images/22071/large/upheaval-finance.jpg"
      );
    });

    it("should throw for upheaval v3 when calling getPermit2Address", () => {
      assert.throws(
        () => SupportedProtocol.getPermit2Address(SupportedProtocol.UPHEAVAL_V3, IndexerNetwork.BASE),
        /Permit2 is not available for Upheaval V3/
      );
    });

    it("should throw for upheaval v3 when calling getV4PositionManager", () => {
      assert.throws(
        () => SupportedProtocol.getV4PositionManager(SupportedProtocol.UPHEAVAL_V3, IndexerNetwork.BASE),
        /V4 position manager is not available for Upheaval V3/
      );
    });

    it("should throw for upheaval v3 when calling getV4StateView", () => {
      assert.throws(
        () => SupportedProtocol.getV4StateView(SupportedProtocol.UPHEAVAL_V3, IndexerNetwork.BASE),
        /V4 state view is not available for Upheaval V3/
      );
    });

    it("should return the correct v3 position manager for upheaval v3 when calling getV3PositionManager", () => {
      assert.equal(
        SupportedProtocol.getV3PositionManager(SupportedProtocol.UPHEAVAL_V3, IndexerNetwork.HYPER_EVM),
        V3PositionManagerAddress.upheaval(IndexerNetwork.HYPER_EVM)
      );
    });

    it("should throw for upheaval v3 when calling getV2PositionManager", () => {
      assert.throws(
        () => SupportedProtocol.getV2PositionManager(SupportedProtocol.UPHEAVAL_V3, IndexerNetwork.BASE),
        /V2 position manager is not available for Upheaval V3/
      );
    });
  });

  describe("HX Finance Algebra", () => {
    it("should return the correct id for hx finance algebra", () => {
      assert.equal(SupportedProtocol.HX_FINANCE_ALGEBRA, "hx-finance-algebra");
    });

    it("should return the correct name for hx finance algebra", () => {
      assert.equal(SupportedProtocol.getName(SupportedProtocol.HX_FINANCE_ALGEBRA), "HX Finance Algebra");
    });

    it("should return the correct url for hx finance algebra", () => {
      assert.equal(SupportedProtocol.getUrl(SupportedProtocol.HX_FINANCE_ALGEBRA), "https://hx.finance/");
    });

    it("should return the correct logo url for hx finance algebra", () => {
      assert.equal(
        SupportedProtocol.getLogoUrl(SupportedProtocol.HX_FINANCE_ALGEBRA),
        "https://assets.coingecko.com/markets/images/22066/large/hx_finance.png"
      );
    });

    it("should throw for hx finance algebra when calling getPermit2Address", () => {
      assert.throws(
        () => SupportedProtocol.getPermit2Address(SupportedProtocol.HX_FINANCE_ALGEBRA, IndexerNetwork.BASE),
        /Permit2 is not available for HX Finance Algebra/
      );
    });

    it("should throw for hx finance algebra when calling getV4PositionManager", () => {
      assert.throws(
        () => SupportedProtocol.getV4PositionManager(SupportedProtocol.HX_FINANCE_ALGEBRA, IndexerNetwork.BASE),
        /V4 position manager is not available for HX Finance Algebra/
      );
    });

    it("should throw for hx finance algebra when calling getV4StateView", () => {
      assert.throws(
        () => SupportedProtocol.getV4StateView(SupportedProtocol.HX_FINANCE_ALGEBRA, IndexerNetwork.BASE),
        /V4 state view is not available for HX Finance Algebra/
      );
    });

    it("should return the correct v3 position manager for hx finance algebra when calling getV3PositionManager", () => {
      assert.equal(
        SupportedProtocol.getV3PositionManager(SupportedProtocol.HX_FINANCE_ALGEBRA, IndexerNetwork.HYPER_EVM),
        V3PositionManagerAddress.hxFinance(IndexerNetwork.HYPER_EVM)
      );
    });

    it("should throw for hx finance algebra when calling getV2PositionManager", () => {
      assert.throws(
        () => SupportedProtocol.getV2PositionManager(SupportedProtocol.HX_FINANCE_ALGEBRA, IndexerNetwork.BASE),
        /V2 position manager is not available for HX Finance Algebra/
      );
    });
  });
});
