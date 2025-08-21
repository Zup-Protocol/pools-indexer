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
    the instance should use the correct rpc url for the passed network and batch the calls`, () => {
    const fakeClient: viem.PublicClient = {
      key: "test",
    } as viem.PublicClient;
    let receivedUrl: string;
    let receivedBatch: boolean;

    const fakeViem = {
      createPublicClient: sinon.fake.returns(fakeClient),
      http: (url: string, { batch }: { batch: boolean }) => {
        receivedUrl = url;
        receivedBatch = batch;

        return {
          batch: batch,
          url: url,
        };
      },
    };

    sut = new ViemService(fakeViem as any);

    let createdClient = sut.getClient(IndexerNetwork.HYPER_EVM);
    console.log(createdClient);

    assert(createdClient === fakeClient, "client was not created");
    assert(receivedBatch!, "client was not batched");
    assert.equal(receivedUrl!, IndexerNetwork.getFreeRPCUrl(IndexerNetwork.HYPER_EVM), "url was not correct");
  });

  it(`should cache a new created instance, and return in new calls to getClient`, () => {
    let createdClient = sut.getClient(IndexerNetwork.HYPER_EVM);
    let cachedClient = sut.getClient(IndexerNetwork.HYPER_EVM);

    assert(cachedClient === createdClient, "client was not cached");
  });
});
