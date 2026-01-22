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
