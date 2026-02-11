---
trigger: always_on
---

#Coding Style & Standards

This document defines the mandatory engineering and aesthetic standards for the this codebase. Adherence to these rules is non-negotiable to maintain long-term maintainability and readability.

---

## 1. Naming Conventions: Semantic Intent

Every identifier—whether a folder, file, function, or parameter—must reveal its purpose at a glance. We prioritize **intent over brevity**. If a name is too short to be descriptive, it is considered technical debt.

### 1.1 Files & Folders

- **Kebab-Case:** All directories and filenames must use `kebab-case`.
- **Functional Suffixes:** Use suffixes to categorize files immediately:
  - `-provider.tsx` (Context)
  - `-hook.ts` (React Hooks)
  - `-processor.ts` (Data Transformation)
  - `-service.ts` (API/External Business Logic)
- **Example:**
  - **Bad:** `utils/logic.ts`
  - **Good:** `auth/session-validation-service.ts`

### 1.2 Functions & Methods

- **Verb-Noun Pattern:** Function names must start with a verb indicating the action, followed by the subject.
- **No Abbreviations:** Avoid "lazy" shorthand that requires context-switching to decipher.
- **Example:**
  - **Bad:** `calc()`, `handle()`, `t()`
  - **Good:** `calculateTokenYield()`, `handleDepositSubmit()`, `formatTimestamp()`

### 1.3 Parameters & Variables

- **Contextual Clarity:** Parameters must describe the data they hold, not just the data type.
- **Strict Prohibition:** Single-letter parameters (e.g., `e`, `t`, `v`) and generic names (e.g., `data`, `val`, `item`) are **strictly prohibited**.
- **Example:**
  - **Bad:** `function save(t: string)`
  - **Good:** `function save(tokenAddress: string)`

---

## Naming Quick Reference

| Category      | Prohibited (Lazy) | Required (Semantic)                   |
| :------------ | :---------------- | :------------------------------------ |
| **File**      | `user/name.ts`    | `user/user-display-name-formatter.ts` |
| **Function**  | `get()`           | `getLiquidityPoolByAddress()`         |
| **Parameter** | `(p: number)`     | `(priceInUsd: number)`                |
| **Variable**  | `const list = []` | `const activePoolList = []`           |

---

## 2. The "No Junk" Comment Policy

Comments are often a sign of unclear code. Focus on making the logic **self-documenting**.

- **Why, not What:** Never use comments to explain _what_ the code is doing—the code itself should be readable enough to show that. Use comments only to explain **why** a specific, non-obvious decision or workaround was made.
- **Refactor Trigger:** If you feel a block of code needs a comment to be understood, extract that logic into a well-named private function instead.
- **Prohibited Comments:** Never use "separator" comments (e.g., `// --- HANDLERS --- //`). Use logical grouping and white space for separation.

## 3. Logical File Structure

To ensure consistency, every file must follow this structural sequence:

1.  **Imports:** External libraries first, internal project paths second.
2.  **Types & Interfaces:** Definitions local to the file.
3.  **Constants:** Static values.
4.  **Main Export:** The primary function or component.
5.  **Private Helpers:** Small, non-exported functions used by the main export.

---

## 4. Decision Log

For any complex architectural changes, briefly explain the "Why" behind your choice within the commit message or a localized `README.md` to maintain the project's long-term "Hierarchy of Truth."

## 6. Strict Type Safety & Nominal Integrity

TypeScript must be used to enforce business logic, not just to suppress compiler warnings. Avoid "Primitive Obsession" by ensuring that every value carries its own semantic type and intent through the mandatory use of **Enums** and **Branded Types**.

### 6.1 The "Enum-First" Mandate

Raw `string` and `number` types are strictly prohibited for values with a fixed set of options or high-stakes logic (e.g., Statuses, Chain IDs, Action Types).

- **Mandatory Enums:** All sets of related constants must be defined as Enums. This provides a single, named source of truth and enables robust IDE autocomplete and refactoring.
- **String Enums for Transparency:** Favor **String Enums** (e.g., `enum Status { Pending = 'PENDING', Active = 'ACTIVE' }`) for business-critical states. This ensures that logs, database entries, and API responses remain human-readable while maintaining strict type safety.
- **Numeric Enums for Protocols:** Use **Numeric Enums** only when the underlying protocol or smart contract requires direct integer mapping (e.g., specific internal status codes or byte values).
- **Rationale:** Relying on raw strings across files is a failure of architecture. If a value needs to change, it must be updated in exactly one place: the Enum definition.

### 6.2 Nominal Typing (Branded Types)

For critical Web3 primitives like `Address`, `TransactionHash`, or `BigInt` amounts, use **Branded Types** (Opaque Types) to prevent logical cross-contamination between different types that share the same underlying primitive.

- **The Pattern:** Use intersection types (e.g., `type Address = string & { __brand: 'Address' }`) to ensure a standard string cannot be passed where a validated address is required.
- **Validation Requirement:** All branded types must be instantiated through a "Constructor" or "Guard" function that performs necessary validation (e.g., lowercase check, checksum check) before casting to the Branded Type.

### 6.3 Single Source of Truth

All Enums and shared types must be centralized in the `/src/lib` layer.

- **No Inline Logic:** Never check for a specific value using a raw string or number literal. You must always reference the Enum (e.g., `if (id === IndexerNetwork.Ethereum)`).
- **Maintenance:** By referencing the Enum rather than the raw value, updating a protocol name or a chain ID becomes a one-line change that safely propagates across the entire project via the compiler.

---

## Type Safety Summary

| Scenario       | Lazy Typing (Prohibited)   | Strict Safety (Required)              |
| :------------- | :------------------------- | :------------------------------------ |
| **User Role**  | `let role = "admin"`       | `enum UserRole { Admin = 'ADMIN' }`   |
| **Address**    | `function send(a: string)` | `function send(a: ValidAddress)`      |
| **Chain ID**   | `if (id === 1)`            | `if (id === IndexerNetwork.Ethereum)` |
| **Sync State** | `state = "syncing"`        | `state = IndexerState.Syncing`        |

---

## 7. Named Parameters via Object Destructuring

We prioritize **Call-Site Clarity**. A developer reading a function call should understand the meaning of every argument without having to "Peek Definition." Standard positional arguments become "Magic Arguments" that lead to logic errors and reduced maintainability.

### 7.1 The Mandatory Threshold

Named parameters (via object destructuring) are **mandatory** in the following scenarios:

- **3+ Parameters:** Any function accepting three or more arguments must use a single object parameter.
- **Boolean Flags:** If a function takes any `boolean` arguments, it must use named parameters. Raw `true`/`false` values at the call site are strictly prohibited as they provide zero context.
- **Ambiguous Types:** When multiple consecutive parameters share the same type (e.g., two strings or two numbers), named parameters must be used to prevent accidental swapping.

### 7.2 The "Unary" Exception

You may use standard positional parameters **only** for "Unary Functions" (single parameter) or well-known mathematical/utility functions where the context is unmistakable.

- **Allowed:** `sqrt(16)`, `slugify(title)`, `abs(value)`.
- **Prohibited:** `getUser(123, true, "active")`.
- **Correct:** `getUser({ id: 123, includeMetadata: true, status: "active" })`.

### 7.3 Implementation Standards

To keep the codebase clean and avoid signature bloat, follow these typing rules:

- **Inline Types (< 3 props):** If the parameter object has only 1 or 2 properties, you may type it inline.
- **Interfaces (> 3 props):** For 3 or more properties, you must define a dedicated interface named `[FunctionName]Params` to keep the function signature readable and reusable.

---

## Parameter Strategy Comparison

| Feature                | Positional Parameters (Prohibited for 3+)     | Named Parameters (Required)                           |
| :--------------------- | :-------------------------------------------- | :---------------------------------------------------- |
| **Readability**        | `createPool(addr, 500, true)`                 | `createPool({ address: addr, fee: 500, isV4: true })` |
| **Order Sensitivity**  | **Strict.** Swapping breaks logic.            | **Flexible.** Key-value mapping is order-independent. |
| **Optionality**        | Requires passing `undefined` for middle args. | Simply omit the key from the object.                  |
| **Self-Documentation** | Requires IDE hover or file navigation.        | Documentation is built directly into the call site.   |
