import { SlashCommandBuilder, type ChatInputCommandInteraction, type TextChannel, type GuildMember } from 'discord.js';
import * as db from '../db';
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
  const eligible = auction.type === 'dkp'
    ? member && member.status.toLowerCase() === 'member'
    : member && ['member', 'trial'].includes(member.status.toLowerCase());

  if (!eligible) {
    await interaction.editReply('You are not eligible to bid in this auction.');
    return;
  }

  if (auction.type === 'dkp') {
    const existing = db.getDkpBid(auction.id, userId);
    if (existing) {
      await interaction.editReply('You have already registered interest in this auction.');
      return;
    }
    db.placeBid({ auction_id: auction.id, user_id: userId, user_name: userName, amount: null });
    await interaction.editReply('Interest registered. Good luck!');
    return;
  }

  const amount = interaction.options.getInteger('amount');
  if (!amount) {
    await interaction.editReply('Gil auctions require a bid amount. Use `/bid amount:<number>`.');
    return;
  }

  const minimumBid = auction.current_bid || auction.starting_bid || 0;
  if (amount <= minimumBid) {
    await interaction.editReply(`Your bid must exceed the current bid of **${formatGil(minimumBid)}**. Try a higher amount.`);
    return;
  }

  db.placeBid({ auction_id: auction.id, user_id: userId, user_name: userName, amount });
  db.updateAuction(auction.id, { current_bid: amount, current_bidder_id: userId });

  await interaction.editReply(`Bid of **${formatGil(amount)}** placed successfully!`);

  const thread = interaction.channel as TextChannel;
  await thread.send(`Current high bid: **${formatGil(amount)}**`);
}
