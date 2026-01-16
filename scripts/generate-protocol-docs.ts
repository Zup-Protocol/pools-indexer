import { SupportedProtocol } from "../src/core/protocol/supported-protocol";

const protocols = Object.values(SupportedProtocol).filter((v) => typeof v === "string");

const tableHeader = `| Protocol | Id | Website |
| :--- | :--- | :--- |`;

const tableRows = protocols
  .map((protocol) => {
    const metadata = SupportedProtocol.metadata[protocol as SupportedProtocol];
    if (!metadata) {
      console.warn(`Missing metadata for protocol: ${protocol}`);
      return `| ${protocol} | ${protocol} | - |`;
    }
    return `| ${metadata.name} | ${protocol} | ${metadata.url} |`;
  })
  .join("\n");

console.log(`${tableHeader}\n${tableRows}`);
