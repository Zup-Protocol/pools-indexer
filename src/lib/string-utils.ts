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
};
