import {
  SlashCommandBuilder, ChannelType, ModalBuilder,
  TextInputBuilder, TextInputStyle, ActionRowBuilder,
  type ChatInputCommandInteraction, type ModalSubmitInteraction,
  type GuildMember, type TextChannel,
} from 'discord.js';
import * as db from '../db';
import { isOfficer } from '../utils/permissions';
import { auctionEmbed } from '../utils/format';

export const data = new SlashCommandBuilder()
  .setName('auction')
  .setDescription('Create a new auction')
  .addStringOption(opt =>
    opt.setName('type').setDescription('Auction type').setRequired(true)
      .addChoices({ name: 'DKP', value: 'dkp' }, { name: 'Gil', value: 'gil' }));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!isOfficer(interaction.member as GuildMember)) {
    await interaction.reply({ content: 'Only officers can create auctions.', ephemeral: true });
    return;
  }

  const type = interaction.options.getString('type', true);

  const modal = new ModalBuilder()
    .setCustomId(`auction_modal_${type}`)
    .setTitle(`Create ${type.toUpperCase()} Auction`);

  const itemInput = new TextInputBuilder()
    .setCustomId('item_name')
    .setLabel('Item Name')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const durationInput = new TextInputBuilder()
    .setCustomId('duration')
    .setLabel('Duration (hours)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g. 24')
    .setRequired(true);

  const rows: ActionRowBuilder<TextInputBuilder>[] = [
    new ActionRowBuilder<TextInputBuilder>().addComponents(itemInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(durationInput),
  ];

  if (type === 'gil') {
    const startingBidInput = new TextInputBuilder()
      .setCustomId('starting_bid')
      .setLabel('Starting Bid (gil)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('e.g. 500000')
      .setRequired(true);
    rows.push(new ActionRowBuilder<TextInputBuilder>().addComponents(startingBidInput));
  }

  const imageInput = new TextInputBuilder()
    .setCustomId('image_url')
    .setLabel('Image URL (optional)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);
  rows.push(new ActionRowBuilder<TextInputBuilder>().addComponents(imageInput));

  modal.addComponents(...rows);
  await interaction.showModal(modal);
}

export async function handleModal(interaction: ModalSubmitInteraction): Promise<void> {
  const type = interaction.customId.replace('auction_modal_', '') as 'dkp' | 'gil';
  const itemName = interaction.fields.getTextInputValue('item_name').trim();
  const durationRaw = interaction.fields.getTextInputValue('duration').trim();
  const imageUrl = interaction.fields.getTextInputValue('image_url').trim() || null;

  const durationHours = parseFloat(durationRaw);
  if (isNaN(durationHours) || durationHours <= 0) {
    await interaction.reply({ content: 'Duration must be a positive number.', ephemeral: true });
    return;
  }

  let startingBid: number | null = null;
  if (type === 'gil') {
    const bidRaw = interaction.fields.getTextInputValue('starting_bid').trim();
    startingBid = parseInt(bidRaw.replace(/,/g, ''), 10);
    if (isNaN(startingBid) || startingBid <= 0) {
      await interaction.reply({ content: 'Starting bid must be a positive number.', ephemeral: true });
      return;
    }
  }

  await interaction.deferReply();

  const closesAt = new Date(Date.now() + durationHours * 3600000).toISOString().replace('T', ' ').slice(0, 19);
  const channel = interaction.channel as TextChannel;

  const thread = await channel.threads.create({
    name: `${type.toUpperCase()}: ${itemName}`,
    autoArchiveDuration: 1440,
    type: ChannelType.PublicThread,
    reason: `Auction for ${itemName}`,
  });

  const result = db.createAuction({
    guild_id: interaction.guildId!,
    channel_id: interaction.channelId!,
    thread_id: thread.id,
    message_id: null,
    type,
    item_name: itemName,
    image_url: imageUrl,
    starting_bid: startingBid,
    current_bid: startingBid,
    current_bidder_id: null,
    duration_hours: durationHours,
    closes_at: closesAt,
  });

  const auction = db.getAuction(result.lastInsertRowid as number)!;
  const embed = auctionEmbed(auction);

  const msg = await thread.send({ embeds: [embed] });
  db.updateAuction(auction.id, { message_id: msg.id });

  const instructions = type === 'dkp'
    ? 'Use `/bid` in this thread to register your interest. Winner determined by DKP priority.'
    : `Use \`/bid amount:<number>\` in this thread to place a bid. Minimum bid: **${startingBid!.toLocaleString()} gil**.`;

  await thread.send(instructions);
  await interaction.editReply(`Auction created: ${thread}`);
}
