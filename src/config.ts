import 'dotenv/config';

export const config = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN!,
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID!,
  DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID!,
  OFFICER_ROLE_IDS: (process.env.OFFICER_ROLE_IDS || '').split(',').map(s => s.trim()).filter(Boolean),
  SPREADSHEET_ID: process.env.SPREADSHEET_ID!,
  SPREADSHEET_SHEET_NAME: process.env.SPREADSHEET_SHEET_NAME || 'Sheet1',
  COLUMN_NAME: process.env.COLUMN_NAME || 'A',
  COLUMN_STATUS: process.env.COLUMN_STATUS || 'B',
  COLUMN_DKP: process.env.COLUMN_DKP || 'F',
  DB_PATH: process.env.DB_PATH || 'data/auctioneer.db',
} as const;
