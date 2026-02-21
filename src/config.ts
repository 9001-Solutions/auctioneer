import 'dotenv/config';

export interface DkpColumn {
  column: string;
  label: string;
}

function parseDkpColumns(raw: string): DkpColumn[] {
  return raw.split(',').map(entry => {
    const colonIdx = entry.indexOf(':');
    if (colonIdx === -1) {
      const col = entry.trim();
      return { column: col, label: 'DKP' };
    }
    const col = entry.slice(0, colonIdx).trim();
    const label = entry.slice(colonIdx + 1).trim() || col;
    return { column: col, label };
  }).filter(e => e.column);
}

export const config = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN!,
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID!,
  DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID!,
  OFFICER_ROLE_IDS: (process.env.OFFICER_ROLE_IDS || '').split(',').map(s => s.trim()).filter(Boolean),
  SPREADSHEET_ID: process.env.SPREADSHEET_ID!,
  SPREADSHEET_SHEET_NAME: process.env.SPREADSHEET_SHEET_NAME || 'Sheet1',
  COLUMN_NAME: process.env.COLUMN_NAME || 'A',
  COLUMN_STATUS: process.env.COLUMN_STATUS || 'B',
  DKP_COLUMNS: parseDkpColumns(process.env.COLUMN_DKP || 'F'),
  DB_PATH: process.env.DB_PATH || 'data/auctioneer.db',
};
