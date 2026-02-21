# Auctioneer

Discord bot for running DKP and Gil auctions in a Final Fantasy linkshell. Bidding is anonymous (ephemeral replies), auctions run in threads, and DKP priority is pulled from a public Google Sheet.

## Auction Types

- **DKP** — Members register interest with `/bid`. Winner is determined by highest DKP on the Google Sheet. Ties are flagged for an officer to decide.
- **Gil** — Highest bid wins. Members bid with `/bid amount:<number>`. Current high bid is posted publicly (bidder stays anonymous). Officers set a minimum bid increment when creating the auction (default 5,000 gil, range 1–100,000).

## Setup

1. **Create a Discord bot** at the [Developer Portal](https://discord.com/developers/applications). Enable the **Message Content** privileged intent.

2. **Invite the bot** with scopes `bot` + `applications.commands`:
   ```
   https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=326417696768&scope=bot%20applications.commands
   ```

3. **Make your Google Sheet public** (Anyone with the link can view). The bot reads columns for name, status, and DKP totals by column letter (supports multi-letter columns like `AA`).

4. **Configure environment** — copy `.env.example` to `.env` and fill in your values:
   ```
   DISCORD_TOKEN=your-bot-token
   DISCORD_CLIENT_ID=your-app-id
   DISCORD_GUILD_ID=your-server-id
   OFFICER_ROLE_IDS=role-id-1,role-id-2
   SPREADSHEET_ID=your-spreadsheet-id
   SPREADSHEET_SHEET_NAME=Sheet1
   COLUMN_NAME=A
   COLUMN_STATUS=B
   COLUMN_DKP=F
   ```

   **Multiple DKP columns:** If your sheet tracks more than one DKP pool, list them comma-separated with labels:
   ```
   COLUMN_DKP=F:Main DKP,H:Abyssea DKP
   ```
   When multiple columns are configured, the `/auction` command gains a `dkp_column` dropdown so officers can pick which pool to use. A single value like `COLUMN_DKP=F` still works as before.

5. **Install and run:**
   ```sh
   npm install
   npm run deploy   # register slash commands
   npm run dev      # start the bot
   ```

## Commands

| Command | Who | Where | Description |
|---------|-----|-------|-------------|
| `/auction type [dkp_column]` | Officers | Any channel | Opens a form to create an auction. Creates a thread. `dkp_column` appears when multiple DKP columns are configured. |
| `/bid [amount]` | Anyone | Auction thread | DKP: registers interest (shows your DKP). Gil: places a bid (must meet minimum increment). |
| `/cancel` | Officers | Auction thread | Cancels the auction and archives the thread. |

## Scripts

- `npm run dev` — run with tsx (no build step)
- `npm run build` — compile TypeScript to `dist/`
- `npm start` — run compiled output
- `npm run deploy` — register slash commands with Discord

## Tech Stack

Node.js, TypeScript, discord.js v14, better-sqlite3
