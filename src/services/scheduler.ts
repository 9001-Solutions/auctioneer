import { Client } from 'discord.js';
import * as db from '../db';
import { closeAuction } from './auctionManager';

const POLL_INTERVAL_MS = 15_000;
let intervalId: ReturnType<typeof setInterval> | null = null;

export function start(client: Client): void {
  if (intervalId) return;
  console.log('Scheduler started (polling every 15s)');

  intervalId = setInterval(async () => {
    try {
      const expired = db.getExpiredAuctions();
      for (const auction of expired) {
        console.log(`Closing auction #${auction.id}: ${auction.item_name}`);
        await closeAuction(auction, client);
      }
    } catch (err) {
      console.error('Scheduler error:', err);
    }
  }, POLL_INTERVAL_MS);
}

export function stop(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('Scheduler stopped');
  }
}
