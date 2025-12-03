describe("TEststs", () => {
  it("should haha", () => {
    const positionFeeGrowthInside0LastX128 = 380276520617824316770152758329063117031089n;
    const positionFeeGrowthInside1LastX128 = 1072073882526421456482803526617666n;

    const poolFeeGrowthGlobal0x128 = 692347682693739513321956455789697882419924n;
    const poolFeeGrowthGlobal1x128 = 2000803746397799239414788734049273n;

    const poolLowerFeeGrowthOutside0X128 = 302754923352017688589352089797071090902160n;
    const poolLowerFeeGrowthOutside1X128 = 892230846146282279384573436096689n;

    const poolUpperFeeGrowthOutside0X128 = 0n;
    const poolUpperFeeGrowthOutside1X128 = 0n;

    const poolFeeGrowthInside0LastX128 =
      poolFeeGrowthGlobal0x128 - poolLowerFeeGrowthOutside0X128 - poolUpperFeeGrowthOutside0X128;
    const poolFeeGrowthInside1LastX128 =
      poolFeeGrowthGlobal1x128 - poolLowerFeeGrowthOutside1X128 - poolUpperFeeGrowthOutside1X128;

    const liquidity = 300146845423592n;

    const q128 = 0x100000000000000000000000000000000n;

    const amount0 = ((poolFeeGrowthInside0LastX128 - positionFeeGrowthInside0LastX128) * liquidity) / q128;
    const amount1 = ((poolFeeGrowthInside1LastX128 - positionFeeGrowthInside1LastX128) * liquidity) / q128;

    console.log("amount0", amount0);
    console.log("amount1", amount1);
  });
});
