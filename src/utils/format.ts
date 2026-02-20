import { EmbedBuilder } from 'discord.js';
import type { Auction } from '../types';

export function formatGil(amount: number): string {
  return `${amount.toLocaleString()} gil`;
}

export function auctionEmbed(auction: Auction): EmbedBuilder {
  const closesAtUnix = Math.floor(new Date(auction.closes_at + 'Z').getTime() / 1000);
  const typeLabel = auction.type === 'dkp' ? 'DKP (Priority)' : 'Gil (Highest Bid)';

  const embed = new EmbedBuilder()
    .setTitle(`Auction: ${auction.item_name}`)
    .setColor(auction.type === 'dkp' ? 0x5865F2 : 0xF0B232)
    .addFields(
      { name: 'Type', value: typeLabel, inline: true },
      { name: 'Closes', value: `<t:${closesAtUnix}:R>`, inline: true },
    );

  if (auction.type === 'gil') {
    embed.addFields({
      name: 'Current Bid',
      value: auction.current_bid ? formatGil(auction.current_bid) : 'No bids yet',
      inline: true,
    });
  }

  if (auction.image_url) {
    embed.setImage(auction.image_url);
  }

  return embed;
}

export function winnerEmbed(auction: Auction): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`Auction Closed: ${auction.item_name}`)
    .setColor(0x57F287);

  if (auction.winner_name) {
    embed.setDescription(`Winner: **${auction.winner_name}**`);
    if (auction.type === 'gil' && auction.winning_value) {
      embed.addFields({ name: 'Winning Bid', value: formatGil(parseInt(auction.winning_value)), inline: true });
    }
    if (auction.type === 'dkp' && auction.winning_value) {
      embed.addFields({ name: 'DKP', value: auction.winning_value, inline: true });
    }
  } else {
    embed.setDescription('No eligible bidders.');
    embed.setColor(0xED4245);
  }

  return embed;
}

export function cancelledEmbed(auction: Auction): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(`Auction Cancelled: ${auction.item_name}`)
    .setColor(0xED4245)
    .setDescription('This auction has been cancelled by an officer. No winner.');
}

interface TiedMember {
  name: string;
  dkp: number;
}

export function tieEmbed(auction: Auction, tiedMembers: TiedMember[]): EmbedBuilder {
  const names = tiedMembers.map(m => `- **${m.name}** (${m.dkp} DKP)`).join('\n');
  return new EmbedBuilder()
    .setTitle(`Auction Tie: ${auction.item_name}`)
    .setColor(0xFEE75C)
    .setDescription(`The following members are tied. An officer must decide the winner.\n\n${names}`);
}
