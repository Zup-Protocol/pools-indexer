import assert from "assert";
import { expect } from "chai";
import sinon from "sinon";
import * as viem from "viem";
import { IndexerNetwork } from "../../../src/common/enums/indexer-network";
import { ViemService } from "../../../src/common/services/viem-service";

describe("ViemService", () => {
  let sut: ViemService;

  beforeEach(() => {
    sut = new ViemService(viem);
  });

  it("should create an instance when calling 'shared' if it does not exist yet", () => {
    expect(ViemService.shared).to.be.instanceOf(ViemService);
  });

  it("should return a previously created instance when calling 'shared' and not create a new one", () => {
    let oldInstance = ViemService.shared;

    assert(ViemService.shared === oldInstance, "objects are different, maybe not singleton?");
  });

  it(`should return a cached client instance of viem for the passed network,
    if it has already been created before for the same network`, () => {
    const client = sut.getClient(IndexerNetwork.HYPER_EVM);

    assert(sut.getClient(IndexerNetwork.HYPER_EVM) === client, "clients are different, maybe not caching?");
  });

  it(`should create a new instance of viem for the passed network if there is no cached one,
    the instance should use the fallback and pass the free + paid rpc urls, with the correect
    config`, () => {
    const fakeClient: viem.PublicClient = {
      key: "test",
    } as viem.PublicClient;
    let receivedUrls: string[] = [];
    let receivedOptions: viem.FallbackTransportConfig = {};
    let receivedBatch: boolean[] = [];
    let expectedOptions: viem.FallbackTransportConfig = {
      rank: false,
      retryCount: 5,
      retryDelay: 10000,
    };

    const fakeViem = {
      createPublicClient: sinon.fake.returns(fakeClient),
      http: (url: string, { batch }: { batch: boolean }) => {
        receivedUrls.push(url);
        receivedBatch.push(batch);

        return {
          batch: batch,
          url: url,
        };
      },
      fallback: (urls: viem.Transport[], options: viem.FallbackTransportConfig) => {
        receivedOptions = options;

        return {
          urls,
          options,
        };
      },
    };

    sut = new ViemService(fakeViem as any);

    let createdClient = sut.getClient(IndexerNetwork.HYPER_EVM);
    console.log(createdClient);

    assert(createdClient === fakeClient, "client was not created");
    assert.deepEqual(receivedBatch, [true, true], "clients were not batched");
    assert.deepEqual(
      receivedUrls,
      [IndexerNetwork.getFreeRPCUrl(IndexerNetwork.HYPER_EVM), IndexerNetwork.getPaidRPCUrl(IndexerNetwork.HYPER_EVM)],
      "url was not correct"
    );

    assert.deepEqual(receivedOptions, expectedOptions, "options are not correct");
  });

  it(`should cache a new created instance, and return in new calls to getClient`, () => {
    let createdClient = sut.getClient(IndexerNetwork.HYPER_EVM);
    let cachedClient = sut.getClient(IndexerNetwork.HYPER_EVM);

    assert(cachedClient === createdClient, "client was not cached");
  });
});
