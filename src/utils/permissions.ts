import { GuildMember, type APIInteractionGuildMember } from 'discord.js';
import { config } from '../config';

export function isOfficer(member: GuildMember | APIInteractionGuildMember | null): boolean {
  if (!member || config.OFFICER_ROLE_IDS.length === 0) return false;
  if (member instanceof GuildMember) {
    return config.OFFICER_ROLE_IDS.some(id => member.roles.cache.has(id));
  }
  // APIInteractionGuildMember has roles as a string array
  return config.OFFICER_ROLE_IDS.some(id => member.roles.includes(id));
}
