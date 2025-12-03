import assert from "assert";
import sinon from "sinon";
import {
  isSecondsTimestampMoreThanDaysAgo,
  subtractDaysFromSecondsTimestamp,
  subtractHoursFromSecondsTimestamp,
} from "../../src/common/date-commons";

describe("DateCommons", () => {
  afterEach(() => {
    sinon.restore();
  });

  it("should subtract the passed hours from the passed timestamp", () => {
    const result = subtractHoursFromSecondsTimestamp(BigInt(1764630243), 3);

    assert.equal(result, BigInt(1764619443));
  });

  it("should subtract the passed days from the passed timestamp", () => {
    const result = subtractDaysFromSecondsTimestamp(BigInt(1764630309), 5);

    assert.equal(result, BigInt(1764198309));
  });

  it("should return true if the passed timestamp is more than the passed days ago", () => {
    sinon.useFakeTimers(1764198309000);
    const result = isSecondsTimestampMoreThanDaysAgo(BigInt(1762815909), 10);

    assert.equal(result, true);
  });

  it("should return false if the passed timestamp is less than the passed days ago", () => {
    sinon.useFakeTimers(1764198309000);
    const result = isSecondsTimestampMoreThanDaysAgo(BigInt(1764111909), 3);

    assert.equal(result, false);
  });
});
