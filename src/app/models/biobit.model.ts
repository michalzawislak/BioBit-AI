import { signal, computed } from '@angular/core';

export type Intention = 'hunt' | 'flee' | 'socialize' | 'attack' | 'dying';
export type Personality = 'paranoid' | 'altruist' | 'manipulator' | 'neutral';
export type VisualEffect = 'eating' | 'starving' | 'thinking' | 'dying' | 'attacking' | 'sharing' | 'speaking' | null;
export type RelationType = 'friend' | 'enemy' | 'victim' | 'unknown';

export interface Memory {
  timestamp: number;
  event: string;
  targetId?: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface BioBitState {
  id: string;
  name: string;
  position: Position;
  energy: number;
  intention: Intention;
  personality: Personality;
  memories: Memory[];
  internalMonologue: string;
  lastPublicMessage: string;
  relations: Map<string, 'friend' | 'enemy' | 'victim' | 'unknown'>;
  deathTime: number | null;
  lastWords: string;
}

export class BioBit {
  readonly id: string;
  readonly name: string;
  readonly personality: Personality;

  private readonly _position = signal<Position>({ x: 0, y: 0 });
  private readonly _energy = signal(100);
  private readonly _intention = signal<Intention>('hunt');
  private readonly _memories = signal<Memory[]>([]);
  private readonly _internalMonologue = signal('...');
  private readonly _lastPublicMessage = signal('');
  private readonly _relations = signal<Map<string, RelationType>>(new Map());
  private readonly _visualEffect = signal<VisualEffect>(null);
  private readonly _deathTime = signal<number | null>(null);
  private readonly _lastWords = signal('');
  private readonly _currentTarget = signal<string | null>(null);
  private readonly _messageExpiry = signal<number>(0);

  readonly position = this._position.asReadonly();
  readonly energy = this._energy.asReadonly();
  readonly intention = this._intention.asReadonly();
  readonly memories = this._memories.asReadonly();
  readonly internalMonologue = this._internalMonologue.asReadonly();
  readonly lastPublicMessage = this._lastPublicMessage.asReadonly();
  readonly relations = this._relations.asReadonly();
  readonly visualEffect = this._visualEffect.asReadonly();
  readonly deathTime = this._deathTime.asReadonly();
  readonly lastWords = this._lastWords.asReadonly();
  readonly currentTarget = this._currentTarget.asReadonly();

  readonly hasActiveMessage = computed(() => {
    return this._lastPublicMessage() !== '' && Date.now() < this._messageExpiry();
  });

  readonly isAlive = computed(() => this._energy() > 0);
  readonly isStarving = computed(() => this._energy() < 20 && this._energy() > 0);
  readonly isDying = computed(() => this._energy() <= 0 && this._deathTime() !== null);

  readonly color = computed(() => {
    if (!this.isAlive()) return '#555555';
    if (this.isStarving()) return '#ff6b6b';
    switch (this._intention()) {
      case 'attack':
        return '#ef4444';
      case 'hunt':
        return '#22c55e';
      case 'socialize':
        return '#a855f7';
      case 'flee':
        return '#eab308';
      case 'dying':
        return '#666666';
    }
  });

  readonly glowIntensity = computed(() => {
    const energy = this._energy();
    if (energy <= 0) return 0.1;
    return 0.3 + (energy / 100) * 0.7;
  });

  constructor(config: { id: string; name: string; personality: Personality; position: Position }) {
    this.id = config.id;
    this.name = config.name;
    this.personality = config.personality;
    this._position.set(config.position);
  }

  move(dx: number, dy: number, bounds: { width: number; height: number }): void {
    const current = this._position();
    const newX = Math.max(0, Math.min(bounds.width, current.x + dx));
    const newY = Math.max(0, Math.min(bounds.height, current.y + dy));
    this._position.set({ x: newX, y: newY });
    this.consumeEnergy(0.1);
  }

  moveTo(target: Position, speed: number, bounds: { width: number; height: number }): void {
    const current = this._position();
    const dx = target.x - current.x;
    const dy = target.y - current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      const ratio = Math.min(speed, distance) / distance;
      this.move(dx * ratio, dy * ratio, bounds);
    }
  }

  setIntention(intention: Intention): void {
    this._intention.set(intention);
  }

  setMonologue(text: string): void {
    this._internalMonologue.set(text);
  }

  setPublicMessage(text: string, duration: number = 4000): void {
    this._lastPublicMessage.set(text);
    this._messageExpiry.set(Date.now() + duration);
    this._visualEffect.set('speaking');
    setTimeout(() => {
      if (this._visualEffect() === 'speaking') {
        this._visualEffect.set(null);
      }
    }, 1000);
  }

  setTarget(targetId: string | null): void {
    this._currentTarget.set(targetId);
  }

  getRelation(targetId: string): RelationType {
    return this._relations().get(targetId) ?? 'unknown';
  }

  attackTarget(target: BioBit, damage: number): number {
    const stolen = Math.min(target.energy(), damage);
    target.consumeEnergy(stolen);
    this.gainEnergy(stolen * 0.8);
    
    this._visualEffect.set('attacking');
    this.updateRelation(target.id, 'victim');
    target.updateRelation(this.id, 'enemy');
    
    this.addMemory(`Attacked ${target.name}, stole ${stolen.toFixed(0)} energy`, target.id);
    target.addMemory(`Was attacked by ${this.name}, lost ${stolen.toFixed(0)} energy`, this.id);
    
    setTimeout(() => {
      if (this._visualEffect() === 'attacking') {
        this._visualEffect.set(null);
      }
    }, 500);
    
    return stolen;
  }

  shareEnergy(target: BioBit, amount: number): number {
    const shared = Math.min(this.energy() - 10, amount);
    if (shared <= 0) return 0;
    
    this.consumeEnergy(shared);
    target.gainEnergy(shared);
    
    this._visualEffect.set('sharing');
    this.updateRelation(target.id, 'friend');
    target.updateRelation(this.id, 'friend');
    
    this.addMemory(`Shared ${shared.toFixed(0)} energy with ${target.name}`, target.id);
    target.addMemory(`Received ${shared.toFixed(0)} energy from ${this.name}`, this.id);
    
    setTimeout(() => {
      if (this._visualEffect() === 'sharing') {
        this._visualEffect.set(null);
      }
    }, 500);
    
    return shared;
  }

  addMemory(event: string, targetId?: string): void {
    const memories = this._memories();
    const newMemory: Memory = { timestamp: Date.now(), event, targetId };
    const updated = [...memories, newMemory].slice(-5);
    this._memories.set(updated);
  }

  consumeEnergy(amount: number): void {
    const wasAlive = this._energy() > 0;
    this._energy.update((e) => Math.max(0, e - amount));

    if (wasAlive && this._energy() <= 0) {
      this.die();
    }

    if (this._energy() < 20 && this._energy() > 0) {
      this._visualEffect.set('starving');
    }
  }

  gainEnergy(amount: number): void {
    this._energy.update((e) => Math.min(100, e + amount));
    this._visualEffect.set('eating');
    setTimeout(() => {
      if (this._visualEffect() === 'eating') {
        this._visualEffect.set(null);
      }
    }, 500);
  }

  consumeThinkingEnergy(): void {
    this.consumeEnergy(2);
    this._visualEffect.set('thinking');
    setTimeout(() => {
      if (this._visualEffect() === 'thinking') {
        this._visualEffect.set(null);
      }
    }, 1000);
  }

  private die(): void {
    this._deathTime.set(Date.now());
    this._intention.set('dying');
    this._visualEffect.set('dying');
    this._lastWords.set(this.generateLastWords());
    this.addMemory('I have died.');
  }

  private generateLastWords(): string {
    const phrases: Record<Personality, string[]> = {
      paranoid: ['I knew they would get me...', 'Trust no one...', 'They were all against me...'],
      altruist: ['I hope I helped someone...', 'Be kind to each other...', 'The light fades...'],
      manipulator: ['My plans... unfinished...', 'I almost had it all...', 'Betrayed by fate...'],
      neutral: ['So this is the end...', 'Energy depleted...', 'Goodbye, world...'],
    };
    const options = phrases[this.personality];
    return options[Math.floor(Math.random() * options.length)];
  }

  setVisualEffect(effect: VisualEffect): void {
    this._visualEffect.set(effect);
  }

  updateRelation(targetId: string, relation: RelationType): void {
    this._relations.update((r) => {
      const newMap = new Map(r);
      newMap.set(targetId, relation);
      return newMap;
    });
  }

  fleeFrom(target: Position, speed: number, bounds: { width: number; height: number }): void {
    const current = this._position();
    const dx = current.x - target.x;
    const dy = current.y - target.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      const ratio = speed / distance;
      this.move(dx * ratio, dy * ratio, bounds);
    }
  }

  setPosition(pos: Position): void {
    this._position.set(pos);
  }

  getState(): BioBitState {
    return {
      id: this.id,
      name: this.name,
      position: this._position(),
      energy: this._energy(),
      intention: this._intention(),
      personality: this.personality,
      memories: this._memories(),
      internalMonologue: this._internalMonologue(),
      lastPublicMessage: this._lastPublicMessage(),
      relations: this._relations(),
      deathTime: this._deathTime(),
      lastWords: this._lastWords(),
    };
  }

  getTimeSinceDeath(): number {
    const deathTime = this._deathTime();
    if (!deathTime) return 0;
    return Date.now() - deathTime;
  }
}
