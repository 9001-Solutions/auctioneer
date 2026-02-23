# Changelog

## 1.1.2 - 2026-02-23

### Fixed
- DKP values with thousands separators (e.g., "1,234") now parse correctly. Previously `parseFloat` stopped at the comma, causing values like 1,234 to display as 1.

## 1.1.1 - 2026-02-21

### Fixed
- DKP bid confirmation now shows "DKP" instead of the column letter when no label is configured (e.g., `COLUMN_DKP=AG` no longer displays "665.06 AG").

## 1.1.0 - 2026-02-21

### Added
- Multiple DKP column support — `COLUMN_DKP` now accepts a comma-separated list with labels (e.g., `F:Main DKP,H:Abyssea DKP`). When multiple columns are configured, officers pick which DKP pool to use when creating an auction.
- DKP bid confirmation now shows the bidder's DKP value and column label.
- Minimum bid increment for Gil auctions — officers set the increment when creating an auction (default 5,000 gil, range 1–100,000). Bids must exceed the current bid by at least this amount.
- Min increment displayed in Gil auction embeds and thread instructions.

### Fixed
- Multi-letter spreadsheet columns (e.g., `AA`, `AG`) now resolve to the correct index. Previously only single-letter columns (`A`–`Z`) worked.
