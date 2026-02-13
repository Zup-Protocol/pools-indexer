import unidecode from "unidecode-plus";
import { EMOJI_REGEX } from "../core/constants";

export const String = {
  lowercasedEquals: (a: string, b: string): boolean => {
    if (a === b) return true;
    return a.toLowerCase() === b.toLowerCase();
  },

  sanitize: (value: string): string => value.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim(),

  truncateWithEllipsis: (value: string, maxLength: number): string => {
    if (value.length <= maxLength) return value;

    return value.slice(0, maxLength - 3) + "...";
  },

  truncateToBytes: (value: string, maxBytes: number): string => {
    let buffer = Buffer.from(value);
    if (buffer.length <= maxBytes) return value;

    buffer = buffer.subarray(0, maxBytes);

    let i = buffer.length - 1;
    while (i >= 0) {
      const byte = buffer[i]!;
      if ((byte & 0xc0) === 0x80) {
        i--;
        continue;
      }

      let charLength = 1;
      if ((byte & 0xe0) === 0xc0) charLength = 2;
      else if ((byte & 0xf0) === 0xe0) charLength = 3;
      else if ((byte & 0xf8) === 0xf0) charLength = 4;

      if (i + charLength > buffer.length) {
        return buffer.subarray(0, i).toString("utf-8");
      } else {
        return buffer.toString("utf-8");
      }
    }
    return buffer.toString("utf-8");
  },

  transliterate: (value: string, options: { ignoreEmojis?: boolean } = {}): string => {
    if (!value) return "";

    if (options.ignoreEmojis) {
      return value.split(EMOJI_REGEX).reduce((acc, part, i) => {
        const matches = value.match(EMOJI_REGEX) || [];

        const transliteratedPart = unidecode(part);

        const emoji = matches[i] || "";

        return acc + transliteratedPart + emoji;
      }, "");
    }

    return unidecode(value);
  },
};
