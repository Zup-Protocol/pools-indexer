import { assert } from "console";

describe("String extension", () => {
  it("should remove invalid/weird characters when calling sanitize", () => {
    const invalidString =
      "ABC ↑’👍™!@#$%^&*()-_=+[]{}|;:,./<>?\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\u0008\t\n\u000b\u000c\r\u000e\u000f\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019\u001a\u001b\u001c\u001d\u001e\u001f";

    const sanitizedString = invalidString.sanitize();
    assert(sanitizedString === "ABC");
  });

  it("it should return if two strings are equal, ignoring case", () => {
    const string1 = "HelLOOO";
    const string2 = "heLlooOo";
    assert(string1.lowercasedEquals(string2));
  });
});
