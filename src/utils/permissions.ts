import { GuildMember } from 'discord.js';
import { config } from '../config';

export function isOfficer(member: GuildMember | null): boolean {
  if (!member || config.OFFICER_ROLE_IDS.length === 0) return false;
  return config.OFFICER_ROLE_IDS.some(id => member.roles.cache.has(id));
}
