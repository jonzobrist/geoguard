
# GeoGuard Core Requirements

## 1. Geo-IP Lookup
- **Function**: Must resolve IPv4 addresses to metadata (City, Country, ISP).
- **Service**: Uses `ipapi.co` (HTTPS).
- **Fallback**: Graceful error message if rate-limited or blocked.

## 2. Firewall Generation (UI)
- **Engines**: Must support `iptables` and `nftables`.
- **Logic**: Uses `services/geminiService.ts` to build the script.
- **AI Component**: Uses Gemini 3 Flash to generate a human-readable explanation of the generated script.

## 3. CLI API (/v1/generate)
- **Parity**: The raw text returned by `POST /v1/generate` MUST be identical to the "Script" tab in the UI (ignoring timestamps).
- **Pattern**: Must support `curl ... | bash` pattern.
- **Protocol**: Handled via Vite Middleware in development.

## 4. Testability
- **Diagnostics**: The app must include a self-test suite to verify IP lookup, Local Generation, and API parity.
