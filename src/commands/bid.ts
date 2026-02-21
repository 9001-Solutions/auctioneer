import { SlashCommandBuilder, type ChatInputCommandInteraction, type TextChannel, type GuildMember } from 'discord.js';
import * as db from '../db';
import { config } from '../config';
import * as sheets from '../services/sheets';
import { formatGil } from '../utils/format';

export const data = new SlashCommandBuilder()
  .setName('bid')
  .setDescription('Place a bid in the current auction thread')
  .addIntegerOption(opt =>
    opt.setName('amount').setDescription('Bid amount in gil (Gil auctions only)').setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const auction = db.getAuctionByThread(interaction.channelId);
  if (!auction) {
    await interaction.reply({ content: 'This command must be used inside an active auction thread.', ephemeral: true });
    return;
  }

  const userId = interaction.user.id;
  const userName = (interaction.member as GuildMember | null)?.displayName || interaction.user.username;

  await interaction.deferReply({ ephemeral: true });

  const member = await sheets.findMember(userName);

  if (auction.type === 'dkp') {
    const dkpMember = auction.dkp_column
      ? (await sheets.fetchMembers(auction.dkp_column)).find(m => m.name.toLowerCase() === userName.toLowerCase()) ?? null
      : member;
    const eligible = dkpMember && dkpMember.status.toLowerCase() === 'member';
    if (!eligible) {
      await interaction.editReply('You are not eligible to bid in this auction.');
      return;
    }
    const existing = db.getDkpBid(auction.id, userId);
    if (existing) {
      await interaction.editReply('You have already registered interest in this auction.');
      return;
    }
    db.placeBid({ auction_id: auction.id, user_id: userId, user_name: userName, amount: null });
    const colConfig = config.DKP_COLUMNS.find(c => c.column === auction.dkp_column);
    const label = colConfig?.label || 'DKP';
    await interaction.editReply(`Interest registered with **${dkpMember.dkp} ${label}**. Good luck!`);
    return;
  }

  const eligible = member && ['member', 'trial'].includes(member.status.toLowerCase());

  if (!eligible) {
    await interaction.editReply('You are not eligible to bid in this auction.');
    return;
  }

  const amount = interaction.options.getInteger('amount');
  if (!amount) {
    await interaction.editReply('Gil auctions require a bid amount. Use `/bid amount:<number>`.');
    return;
  }

  const currentBid = auction.current_bid || auction.starting_bid || 0;
  const increment = auction.min_increment || 5000;
  const minimumBid = currentBid + increment;
  if (amount < minimumBid) {
    await interaction.editReply(`Your bid must be at least **${formatGil(minimumBid)}** (current bid ${formatGil(currentBid)} + ${formatGil(increment)} increment).`);
    return;
  }

  db.placeBid({ auction_id: auction.id, user_id: userId, user_name: userName, amount });
  db.updateAuction(auction.id, { current_bid: amount, current_bidder_id: userId });

  await interaction.editReply(`Bid of **${formatGil(amount)}** placed successfully!`);

  const thread = interaction.channel as TextChannel;
  await thread.send(`Current high bid: **${formatGil(amount)}**`);
}
