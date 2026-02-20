import { config } from '../config';
import type { SheetMember, ResolvedBidder } from '../types';

const CSV_URL = `https://docs.google.com/spreadsheets/d/${config.SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(config.SPREADSHEET_SHEET_NAME)}`;

function colToIndex(letter: string): number {
  return letter.toUpperCase().charCodeAt(0) - 65;
}

const COL_NAME = colToIndex(config.COLUMN_NAME);
const COL_STATUS = colToIndex(config.COLUMN_STATUS);
const COL_DKP = colToIndex(config.COLUMN_DKP);

function parseCSVRow(row: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (inQuotes) {
      if (ch === '"' && row[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

export async function fetchMembers(): Promise<SheetMember[]> {
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`Failed to fetch spreadsheet: ${res.status}`);
  const text = await res.text();
  const lines = text.split('\n').filter(l => l.trim());
  return lines.slice(1).map(line => {
    const cols = parseCSVRow(line);
    return {
      name: (cols[COL_NAME] || '').trim(),
      status: (cols[COL_STATUS] || '').trim(),
      dkp: parseFloat(cols[COL_DKP]) || 0,
    };
  }).filter(m => m.name);
}

export async function findMember(displayName: string): Promise<SheetMember | null> {
  const members = await fetchMembers();
  const needle = displayName.toLowerCase();
  return members.find(m => m.name.toLowerCase() === needle) || null;
}

export async function resolveDkpBidders(bidders: { user_id: string; user_name: string }[]): Promise<ResolvedBidder[]> {
  const members = await fetchMembers();
  const memberMap = new Map(members.map(m => [m.name.toLowerCase(), m]));

  return bidders
    .map(b => {
      const member = memberMap.get(b.user_name.toLowerCase());
      return member
        ? { userId: b.user_id, userName: b.user_name, ...member }
        : null;
    })
    .filter((m): m is ResolvedBidder => m !== null)
    .sort((a, b) => b.dkp - a.dkp);
}
