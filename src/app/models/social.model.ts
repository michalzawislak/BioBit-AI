import { Position } from './biobit.model';

export type SocialActionType = 'speak' | 'attack' | 'share' | 'flee' | 'befriend' | 'betray';

export interface SocialEvent {
  id: string;
  type: SocialActionType;
  actorId: string;
  actorName: string;
  targetId?: string;
  targetName?: string;
  message?: string;
  energyTransfer?: number;
  position: Position;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  isLie: boolean;
  trueIntention?: string;
  position: Position;
  timestamp: number;
}

export function createSocialEvent(
  type: SocialActionType,
  actor: { id: string; name: string; position: Position },
  target?: { id: string; name: string },
  extras?: { message?: string; energyTransfer?: number }
): SocialEvent {
  return {
    id: crypto.randomUUID(),
    type,
    actorId: actor.id,
    actorName: actor.name,
    targetId: target?.id,
    targetName: target?.name,
    message: extras?.message,
    energyTransfer: extras?.energyTransfer,
    position: actor.position,
    timestamp: Date.now(),
  };
}

export function formatSocialEvent(event: SocialEvent): string {
  switch (event.type) {
    case 'speak':
      return `${event.actorName}: "${event.message}"`;
    case 'attack':
      return `⚔️ ${event.actorName} attacked ${event.targetName} (${event.energyTransfer! > 0 ? '+' : ''}${event.energyTransfer} energy)`;
    case 'share':
      return `🤝 ${event.actorName} shared energy with ${event.targetName} (+${event.energyTransfer} energy)`;
    case 'flee':
      return `🏃 ${event.actorName} fled from ${event.targetName}`;
    case 'befriend':
      return `💜 ${event.actorName} befriended ${event.targetName}`;
    case 'betray':
      return `🗡️ ${event.actorName} betrayed ${event.targetName}!`;
    default:
      return `${event.actorName} did something`;
  }
}
