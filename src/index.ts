import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { config } from './config';
import * as scheduler from './services/scheduler';
import * as auction from './commands/auction';
import * as bid from './commands/bid';
import * as cancel from './commands/cancel';
import * as close from './commands/close';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
});

const commands = new Collection<string, { execute: Function }>();
commands.set(auction.data.name, auction);
commands.set(bid.data.name, bid);
commands.set(cancel.data.name, cancel);
commands.set(close.data.name, close);

client.once('ready', () => {
  console.log(`Logged in as ${client.user!.tag}`);
  scheduler.start(client);
});

client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isModalSubmit() && interaction.customId.startsWith('auction_modal_')) {
      return await auction.handleModal(interaction);
    }

    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);
    if (!command) return;

    await command.execute(interaction);
  } catch (err) {
    console.error('Error handling interaction:', err);
    const reply = { content: 'Something went wrong.', ephemeral: true as const };
    if (interaction.isRepliable()) {
      if ('replied' in interaction && (interaction.replied || interaction.deferred)) {
        await interaction.followUp(reply).catch(() => {});
      } else {
        await interaction.reply(reply).catch(() => {});
      }
    }
  }
});

client.login(config.DISCORD_TOKEN);
