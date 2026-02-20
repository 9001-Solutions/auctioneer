import { SlashCommandBuilder, type ChatInputCommandInteraction, type GuildMember } from 'discord.js';
import * as db from '../db';
import { isOfficer } from '../utils/permissions';

export const data = new SlashCommandBuilder()
  .setName('cancel')
  .setDescription('Cancel the auction in the current thread');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!isOfficer(interaction.member as GuildMember)) {
    await interaction.reply({ content: 'Only officers can cancel auctions.', ephemeral: true });
    return;
  }

  const auction = db.getAuctionByThread(interaction.channelId);
  if (!auction) {
    await interaction.reply({ content: 'No active auction found in this thread.', ephemeral: true });
    return;
  }

  db.updateAuction(auction.id, { status: 'cancelled' });

  await interaction.reply(`Auction for **${auction.item_name}** has been cancelled.`);

  const thread = interaction.channel;
  if (thread?.isThread()) {
    await thread.setArchived(true).catch(() => {});
  }
}
