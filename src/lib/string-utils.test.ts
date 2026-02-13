import { describe, expect, it } from "vitest";
import { String } from "./string-utils";

describe("String.truncateToBytes", () => {
  it("should return the original string if byte length is within limit", () => {
    const str = "Hello";
    expect(String.truncateToBytes(str, 10)).toBe("Hello");
  });

  it("should truncate string to fit byte limit (ascii)", () => {
    const str = "Hello World";
    expect(String.truncateToBytes(str, 5)).toBe("Hello");
  });

  it("should not cut in the middle of a multi-byte character (2 bytes)", () => {
    const str = "São Paulo";
    // 'ã' is 2 bytes (0xC3 0xA3)
    // S (1) + ã (2) = 3 bytes.
    // truncate to 2 bytes -> should return "S"
    expect(String.truncateToBytes(str, 2)).toBe("S");
    // truncate to 3 bytes -> should return "Sã"
    expect(String.truncateToBytes(str, 3)).toBe("Sã");
  });

  it("should not cut in the middle of a multi-byte character (3 bytes / Emoji)", () => {
    const str = "A😊B";
    // A (1) + 😊 (4 bytes: F0 9F 98 8A) + B (1)
    // Total 6 bytes.

    // truncate to 1 -> "A"
    expect(String.truncateToBytes(str, 1)).toBe("A");

    // truncate to 2 -> "A" (cant fit emoji)
    expect(String.truncateToBytes(str, 2)).toBe("A");

    // truncate to 4 -> "A" (needs 1+4=5)
    expect(String.truncateToBytes(str, 4)).toBe("A");

    // truncate to 5 -> "A😊"
    expect(String.truncateToBytes(str, 5)).toBe("A😊");
  });

  it("should handle cutting at the exact boundary", () => {
    const str = "😊"; // 4 bytes
    expect(String.truncateToBytes(str, 4)).toBe("😊");
  });

  it("should handle zero limit", () => {
    expect(String.truncateToBytes("Hello", 0)).toBe("");
  });

  it("should handle very large input", () => {
    const longStr = "a".repeat(10000);
    expect(String.truncateToBytes(longStr, 8191).length).toBe(8191);
  });

  it("should handle ZWJ sequence gracefully (cutting it validly but breaking the composite)", () => {
    // Family: 👨‍👩‍👧  (Man + ZWJ + Woman + ZWJ + Girl)
    // Man: F0 9F 91 86 (4)
    // ZWJ: E2 80 8D (3)
    // Woman: F0 9F 91 86 (4)
    // ZWJ: (3)
    // Girl: (4)
    // Total bytes = 4 + 3 + 4 + 3 + 4 = 18 bytes.

    const family = "👨‍👩‍👧";
    // truncate to 4 -> Man
    expect(String.truncateToBytes(family, 4)).toBe("👨");

    // truncate to 7 -> Man + ZWJ
    // Visually it might look like Man, but bytes are there.
    const result = String.truncateToBytes(family, 7);
    expect(Buffer.byteLength(result)).toBe(7);
    // The ZWJ at end is invisible but valid UTF8.
  });

  it("should always result in valid JSON when stringified", () => {
    // 4 byte emoji: 🦀
    // 3 byte character: ã
    const str = "test 🦀 ã end";

    // Iterate through EVERY possible split point to ensure we never create invalid JSON
    const maxLen = Buffer.byteLength(str);
    for (let i = 1; i <= maxLen; i++) {
      const truncated = String.truncateToBytes(str, i);

      // Should be valid UTF-8
      expect(Buffer.from(truncated).toString("utf-8")).toBe(truncated);

      // Should be capable of being part of a JSON object without error
      const json = JSON.stringify({ data: truncated });
      expect(() => JSON.parse(json)).not.toThrow();
    }
  });

  it("should handle mixed complex characters correctly", () => {
    // A string with mix of 1, 2, 3, 4 byte characters
    // A (1) + ñ (2) + ❄️ (3) + 🚀 (4)
    // ❄️ is often 3 bytes (E2 9D 84) + FE0F (variation selector) sometimes, but let's stick to standard chars
    // '❄' (snowflake) is E2 9D 84 (3 bytes)
    // 🚀 is F0 9F 9A 80 (4 bytes)

    const str = "Añ❄🚀";
    // Lengths: 1, 2, 3, 4. Offsets: 0, 1, 3, 6, 10.

    // Cut at 1 -> "A"
    expect(String.truncateToBytes(str, 1)).toBe("A");

    // Cut at 2 -> "A" (ñ needs 2 bytes, we have 1 remaining space after A)
    // "A" is 1 byte. "ñ" is 2 bytes. Total 3 bytes needed for "Añ".
    // If limit is 2: "A" (1) ... next is "ñ" (2). 1+2 = 3 > 2. So "ñ" is dropped.
    expect(String.truncateToBytes(str, 2)).toBe("A");

    // Cut at 3 -> "Añ"
    expect(String.truncateToBytes(str, 3)).toBe("Añ");

    // Cut at 5 -> "Añ" (Need 6 for snowflake)
    expect(String.truncateToBytes(str, 5)).toBe("Añ");

    // Cut at 6 -> "Añ❄"
    expect(String.truncateToBytes(str, 6)).toBe("Añ❄");

    // Cut at 9 -> "Añ❄" (Need 10 for rocket)
    expect(String.truncateToBytes(str, 9)).toBe("Añ❄");

    // Cut at 10 -> "Añ❄🚀"
    expect(String.truncateToBytes(str, 10)).toBe("Añ❄🚀");
  });
});
