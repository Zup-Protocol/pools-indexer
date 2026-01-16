import { SupportedProtocol } from "../src/core/protocol/supported-protocol";

const protocols = Object.values(SupportedProtocol).filter((v) => typeof v === "string");

const tableHeader = `| Protocol | Id | Website |
| :--- | :--- | :--- |`;

const tableRows = protocols
  .map((protocol) => {
    const metadata = SupportedProtocol.metadata[protocol as SupportedProtocol];
    if (!metadata) {
      console.warn(`Missing metadata for protocol: ${protocol}`);
      return null;
    }
    return {
      name: metadata.name,
      id: protocol,
      url: metadata.url,
    };
  })
  .filter((item): item is NonNullable<typeof item> => item !== null)
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((item) => `| ${item.name} | ${item.id} | ${item.url} |`)
  .join("\n");

console.log(`${tableHeader}\n${tableRows}`);
