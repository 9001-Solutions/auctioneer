import { SlashCommandBuilder, type ChatInputCommandInteraction, type TextChannel, type GuildMember } from 'discord.js';
import * as db from '../db';
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

  if (auction.type === 'dkp') {
    const existing = db.getDkpBid(auction.id, userId);
    if (existing) {
      await interaction.reply({ content: 'You have already registered interest in this auction.', ephemeral: true });
      return;
    }
    db.placeBid({ auction_id: auction.id, user_id: userId, user_name: userName, amount: null });
    await interaction.reply({ content: 'Interest registered. Good luck!', ephemeral: true });
    return;
  }

  const amount = interaction.options.getInteger('amount');
  if (!amount) {
    await interaction.reply({ content: 'Gil auctions require a bid amount. Use `/bid amount:<number>`.', ephemeral: true });
    return;
  }

  const minimumBid = auction.current_bid || auction.starting_bid || 0;
  if (amount <= minimumBid) {
    await interaction.reply({
      content: `Your bid must exceed the current bid of **${formatGil(minimumBid)}**. Try a higher amount.`,
      ephemeral: true,
    });
    return;
  }

  db.placeBid({ auction_id: auction.id, user_id: userId, user_name: userName, amount });
  db.updateAuction(auction.id, { current_bid: amount, current_bidder_id: userId });

  await interaction.reply({ content: `Bid of **${formatGil(amount)}** placed successfully!`, ephemeral: true });

  const thread = interaction.channel as TextChannel;
  await thread.send(`Current high bid: **${formatGil(amount)}**`);
}
