import { SlashCommandBuilder, type ChatInputCommandInteraction, type GuildMember } from 'discord.js';
import * as db from '../db';
import { isOfficer } from '../utils/permissions';
import { closeAuction } from '../services/auctionManager';

export const data = new SlashCommandBuilder()
  .setName('close')
  .setDescription('Close the auction early and announce the winner');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!isOfficer(interaction.member as GuildMember)) {
    await interaction.reply({ content: 'Only officers can close auctions.', ephemeral: true });
    return;
  }

  const auction = db.getAuctionByThread(interaction.channelId);
  if (!auction) {
    await interaction.reply({ content: 'No active auction found in this thread.', ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });
  await closeAuction(auction, interaction.client);
  await interaction.editReply('Auction closed.');
}
