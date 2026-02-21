import { Client, type AnyThreadChannel } from 'discord.js';
import * as db from '../db';
import * as sheets from './sheets';
import { winnerEmbed, tieEmbed } from '../utils/format';
import type { Auction } from '../types';

export async function closeAuction(auction: Auction, client: Client): Promise<void> {
  if (auction.type === 'dkp') {
    await closeDkpAuction(auction, client);
  } else {
    await closeGilAuction(auction, client);
  }
}

async function closeDkpAuction(auction: Auction, client: Client): Promise<void> {
  const bids = db.getBidsForAuction(auction.id);
  const thread = await getThread(client, auction);
  if (!thread) return markClosed(auction);

  if (bids.length === 0) {
    db.updateAuction(auction.id, { status: 'closed' });
    const embed = winnerEmbed({ ...auction, winner_name: null });
    await thread.send({ content: '@everyone', embeds: [embed] });
    await thread.setArchived(true).catch(() => {});
    return;
  }

  try {
    const resolved = await sheets.resolveDkpBidders(
      bids.map(b => ({ user_id: b.user_id, user_name: b.user_name })),
      auction.dkp_column ?? undefined,
    );

    const eligible = resolved.filter(m => m.status.toLowerCase() === 'member');

    if (eligible.length === 0) {
      db.updateAuction(auction.id, { status: 'closed' });
      const embed = winnerEmbed({ ...auction, winner_name: null });
      await thread.send({ content: '@everyone', embeds: [embed] });
      await thread.setArchived(true).catch(() => {});
      return;
    }

    const topDkp = eligible[0].dkp;
    const tied = eligible.filter(m => m.dkp === topDkp);

    if (tied.length > 1) {
      db.updateAuction(auction.id, { status: 'closed' });
      const embed = tieEmbed(auction, tied.map(m => ({ name: m.userName, dkp: m.dkp })));
      await thread.send({ content: '@everyone', embeds: [embed] });
      return;
    }

    const winner = eligible[0];
    db.updateAuction(auction.id, {
      status: 'closed',
      winner_id: winner.userId,
      winner_name: winner.userName,
      winning_value: String(winner.dkp),
    });
    const embed = winnerEmbed({
      ...auction,
      winner_name: winner.userName,
      winning_value: String(winner.dkp),
    });
    await thread.send({ content: '@everyone', embeds: [embed] });
    await thread.setArchived(true).catch(() => {});
  } catch (err) {
    console.error(`Error closing DKP auction ${auction.id}:`, err);
    await thread.send('Error resolving DKP data. An officer should close this auction manually.').catch(() => {});
    db.updateAuction(auction.id, { status: 'closed' });
  }
}

async function closeGilAuction(auction: Auction, client: Client): Promise<void> {
  const thread = await getThread(client, auction);
  if (!thread) return markClosed(auction);

  if (!auction.current_bidder_id) {
    db.updateAuction(auction.id, { status: 'closed' });
    const embed = winnerEmbed({ ...auction, winner_name: null });
    await thread.send({ content: '@everyone', embeds: [embed] });
    await thread.setArchived(true).catch(() => {});
    return;
  }

  try {
    const guild = await client.guilds.fetch(auction.guild_id);
    const member = await guild.members.fetch(auction.current_bidder_id);
    const displayName = member.displayName;

    const sheetMember = await sheets.findMember(displayName);
    const eligible = sheetMember && ['member', 'trial'].includes(sheetMember.status.toLowerCase());

    if (!eligible) {
      db.updateAuction(auction.id, { status: 'closed' });
      const embed = winnerEmbed({ ...auction, winner_name: null });
      embed.setDescription(`Highest bidder (**${displayName}**) is not eligible. No winner.`);
      await thread.send({ content: '@everyone', embeds: [embed] });
      await thread.setArchived(true).catch(() => {});
      return;
    }

    db.updateAuction(auction.id, {
      status: 'closed',
      winner_id: auction.current_bidder_id,
      winner_name: displayName,
      winning_value: String(auction.current_bid),
    });
    const embed = winnerEmbed({
      ...auction,
      winner_name: displayName,
      winning_value: String(auction.current_bid),
    });
    await thread.send({ content: '@everyone', embeds: [embed] });
    await thread.setArchived(true).catch(() => {});
  } catch (err) {
    console.error(`Error closing Gil auction ${auction.id}:`, err);
    const bids = db.getBidsForAuction(auction.id);
    const lastBid = bids[bids.length - 1];
    const winnerName = lastBid ? lastBid.user_name : 'Unknown';
    db.updateAuction(auction.id, {
      status: 'closed',
      winner_id: auction.current_bidder_id,
      winner_name: winnerName,
      winning_value: String(auction.current_bid),
    });
    const embed = winnerEmbed({
      ...auction,
      winner_name: winnerName,
      winning_value: String(auction.current_bid),
    });
    await thread.send({ content: '@everyone', embeds: [embed] }).catch(() => {});
    await thread.setArchived(true).catch(() => {});
  }
}

async function getThread(client: Client, auction: Auction) {
  try {
    const channel = await client.channels.fetch(auction.thread_id!);
    return channel as AnyThreadChannel;
  } catch {
    console.error(`Could not fetch thread ${auction.thread_id} for auction ${auction.id}`);
    return null;
  }
}

function markClosed(auction: Auction): void {
  db.updateAuction(auction.id, { status: 'closed' });
}
