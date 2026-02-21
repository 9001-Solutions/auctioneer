import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import type { Auction, Bid, CreateAuctionData, PlaceBidData } from './types';

const dbDir = path.dirname(config.DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(config.DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS auctions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    thread_id TEXT,
    message_id TEXT,
    type TEXT NOT NULL CHECK(type IN ('dkp','gil')),
    item_name TEXT NOT NULL,
    image_url TEXT,
    starting_bid INTEGER,
    current_bid INTEGER,
    current_bidder_id TEXT,
    duration_hours REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    closes_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed','cancelled')),
    winner_id TEXT,
    winner_name TEXT,
    winning_value TEXT
  );

  CREATE TABLE IF NOT EXISTS bids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    auction_id INTEGER NOT NULL REFERENCES auctions(id),
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    amount INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_bids_dkp_unique
    ON bids(auction_id, user_id) WHERE amount IS NULL;
`);

try {
  db.exec(`ALTER TABLE auctions ADD COLUMN dkp_column TEXT`);
} catch {
  // Column already exists
}

try {
  db.exec(`ALTER TABLE auctions ADD COLUMN min_increment INTEGER`);
} catch {
  // Column already exists
}

export function createAuction(data: CreateAuctionData) {
  const stmt = db.prepare(`
    INSERT INTO auctions (guild_id, channel_id, thread_id, message_id, type, item_name, image_url, starting_bid, current_bid, current_bidder_id, duration_hours, closes_at, dkp_column, min_increment)
    VALUES (@guild_id, @channel_id, @thread_id, @message_id, @type, @item_name, @image_url, @starting_bid, @current_bid, @current_bidder_id, @duration_hours, @closes_at, @dkp_column, @min_increment)
  `);
  return stmt.run(data);
}

export function getAuction(id: number) {
  return db.prepare('SELECT * FROM auctions WHERE id = ?').get(id) as Auction | undefined;
}

export function getAuctionByThread(threadId: string) {
  return db.prepare('SELECT * FROM auctions WHERE thread_id = ? AND status = ?').get(threadId, 'open') as Auction | undefined;
}

export function getExpiredAuctions() {
  return db.prepare(`
    SELECT * FROM auctions WHERE status = 'open' AND closes_at <= datetime('now')
  `).all() as Auction[];
}

export function updateAuction(id: number, data: Partial<Auction>) {
  const sets = Object.keys(data).map(k => `${k} = @${k}`).join(', ');
  const stmt = db.prepare(`UPDATE auctions SET ${sets} WHERE id = @id`);
  return stmt.run({ id, ...data });
}

export function placeBid(data: PlaceBidData) {
  const stmt = db.prepare(`
    INSERT INTO bids (auction_id, user_id, user_name, amount)
    VALUES (@auction_id, @user_id, @user_name, @amount)
  `);
  return stmt.run(data);
}

export function getBidsForAuction(auctionId: number) {
  return db.prepare('SELECT * FROM bids WHERE auction_id = ? ORDER BY created_at ASC').all(auctionId) as Bid[];
}

export function getDkpBid(auctionId: number, userId: string) {
  return db.prepare('SELECT * FROM bids WHERE auction_id = ? AND user_id = ? AND amount IS NULL').get(auctionId, userId) as Bid | undefined;
}
