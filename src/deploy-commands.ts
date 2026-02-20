import { REST, Routes } from 'discord.js';
import { config } from './config';
import { data as auctionData } from './commands/auction';
import { data as bidData } from './commands/bid';
import { data as cancelData } from './commands/cancel';

const commands = [auctionData.toJSON(), bidData.toJSON(), cancelData.toJSON()];
const rest = new REST().setToken(config.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`Registering ${commands.length} slash commands...`);
    await rest.put(
      Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, config.DISCORD_GUILD_ID),
      { body: commands },
    );
    console.log('Slash commands registered successfully.');
  } catch (err) {
    console.error('Failed to register commands:', err);
  }
})();
