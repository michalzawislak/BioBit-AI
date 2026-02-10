import { Injectable, signal, computed } from '@angular/core';
import { BioBit, Personality, Position } from '../models/biobit.model';
import { Nutrient, createNutrient, updateNutrient, isNutrientDepleted, NUTRIENT_CONFIG } from '../models/nutrient.model';
import { SocialEvent, ChatMessage, createSocialEvent, formatSocialEvent } from '../models/social.model';
import { WebLlmService, LLMResponse } from './web-llm.service';

export interface DeathEvent {
  biobit: BioBit;
  time: number;
}

export interface FeedEvent {
  biobitId: string;
  nutrientType: string;
  energyGained: number;
  position: Position;
  time: number;
}

@Injectable({ providedIn: 'root' })
export class SimulationService {
  private readonly _biobits = signal<BioBit[]>([]);
  private readonly _nutrients = signal<Nutrient[]>([]);
  private readonly _entropy = signal(1);
  private readonly _abundance = signal(1);
  private readonly _selectedBiobit = signal<BioBit | null>(null);
  private readonly _isPaused = signal(false);
  private readonly _recentDeaths = signal<DeathEvent[]>([]);
  private readonly _recentFeeds = signal<FeedEvent[]>([]);
  private readonly _socialEvents = signal<SocialEvent[]>([]);
  private readonly _chatMessages = signal<ChatMessage[]>([]);
  private readonly _totalDeaths = signal(0);
  private readonly _totalFeeds = signal(0);
  private readonly _totalInteractions = signal(0);

  readonly biobits = this._biobits.asReadonly();
  readonly nutrients = this._nutrients.asReadonly();
  readonly entropy = this._entropy.asReadonly();
  readonly abundance = this._abundance.asReadonly();
  readonly selectedBiobit = this._selectedBiobit.asReadonly();
  readonly isPaused = this._isPaused.asReadonly();
  readonly recentDeaths = this._recentDeaths.asReadonly();
  readonly recentFeeds = this._recentFeeds.asReadonly();
  readonly socialEvents = this._socialEvents.asReadonly();
  readonly chatMessages = this._chatMessages.asReadonly();
  readonly totalDeaths = this._totalDeaths.asReadonly();
  readonly totalFeeds = this._totalFeeds.asReadonly();
  readonly totalInteractions = this._totalInteractions.asReadonly();

  readonly aliveBiobits = computed(() => this._biobits().filter((b) => b.isAlive()));
  readonly deadBiobits = computed(() => this._biobits().filter((b) => !b.isAlive()));
  readonly recentSocialLog = computed(() => 
    this._socialEvents()
      .slice(-10)
      .map(formatSocialEvent)
      .reverse()
  );

  private bounds = { width: 800, height: 600 };
  private animationFrameId: number | null = null;
  private lastThinkTime = 0;
  private lastUpdateTime = Date.now();
  private thinkInterval = 8000;
  private readonly CORPSE_DECAY_TIME = 15000;

  private _clickMode = signal<'select' | 'food' | 'lightning'>('select');
  readonly clickMode = this._clickMode.asReadonly();

  constructor(private webLlm: WebLlmService) {}

  setBounds(width: number, height: number): void {
    this.bounds = { width, height };
  }

  start(): void {
    if (this.animationFrameId) return;
    this.loop();
  }

  stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  togglePause(): void {
    this._isPaused.update((p) => !p);
  }

  private loop = (): void => {
    this.animationFrameId = requestAnimationFrame(this.loop);
    if (this._isPaused()) return;

    this.update();
  };

  private update(): void {
    const now = Date.now();
    const deltaTime = now - this.lastUpdateTime;
    this.lastUpdateTime = now;

    this.updateNutrients(deltaTime);
    this.updateBiobits(deltaTime);
    this.cleanupCorpses();
    this.cleanupOldEvents();

    if (Math.random() < 0.02 * this._abundance()) {
      this.spawnNutrient();
    }

    if (now - this.lastThinkTime > this.thinkInterval && this.webLlm.isReady()) {
      this.lastThinkTime = now;
      this.triggerThinking();
    }
  }

  private updateNutrients(deltaTime: number): void {
    this._nutrients.update((nutrients) => {
      const updated = nutrients
        .map((n) => updateNutrient(n, deltaTime / 1000))
        .filter((n) => !isNutrientDepleted(n));
      return updated;
    });
  }

  private updateBiobits(deltaTime: number): void {
    const aliveBefore = new Set(this._biobits().filter((b) => b.isAlive()).map((b) => b.id));

    this._biobits().forEach((biobit) => {
      if (!biobit.isAlive()) return;

      const baseConsumption = 0.008 * this._entropy() * (deltaTime / 16);
      biobit.consumeEnergy(baseConsumption);

      if (!biobit.isAlive()) {
        this.recordDeath(biobit);
        return;
      }

      const nearestNutrient = this.findNearestNutrient(biobit);
      if (nearestNutrient) {
        const speed = biobit.isStarving() ? 0.8 : 0.5;
        biobit.moveTo({ x: nearestNutrient.x, y: nearestNutrient.y }, speed, this.bounds);

        const dist = this.distance(biobit.position(), nearestNutrient);
        if (dist < 20) {
          this.consumeNutrient(biobit, nearestNutrient);
        }
      } else {
        biobit.move(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          this.bounds
        );
      }
    });
  }

  private consumeNutrient(biobit: BioBit, nutrient: Nutrient): void {
    const config = NUTRIENT_CONFIG[nutrient.type];
    const energyGained = nutrient.energy;

    if (nutrient.type === 'toxic') {
      biobit.consumeEnergy(Math.abs(energyGained));
      biobit.addMemory(`Ate toxic food! Lost ${Math.abs(energyGained).toFixed(0)} energy`);
    } else {
      biobit.gainEnergy(energyGained);
      biobit.addMemory(`Consumed ${nutrient.type} nutrient (+${energyGained.toFixed(0)} energy)`);
    }

    this._recentFeeds.update((feeds) => [
      ...feeds,
      {
        biobitId: biobit.id,
        nutrientType: nutrient.type,
        energyGained,
        position: biobit.position(),
        time: Date.now(),
      },
    ]);
    this._totalFeeds.update((t) => t + 1);

    this.removeNutrient(nutrient.id);
  }

  private recordDeath(biobit: BioBit): void {
    this._recentDeaths.update((deaths) => [
      ...deaths,
      { biobit, time: Date.now() },
    ]);
    this._totalDeaths.update((t) => t + 1);
  }

  private cleanupCorpses(): void {
    this._biobits.update((biobits) =>
      biobits.filter((b) => {
        if (b.isAlive()) return true;
        return b.getTimeSinceDeath() < this.CORPSE_DECAY_TIME;
      })
    );
  }

  private cleanupOldEvents(): void {
    const now = Date.now();
    const maxAge = 5000;
    const socialMaxAge = 15000;

    this._recentDeaths.update((deaths) =>
      deaths.filter((d) => now - d.time < maxAge)
    );
    this._recentFeeds.update((feeds) =>
      feeds.filter((f) => now - f.time < maxAge)
    );
    this._socialEvents.update((events) =>
      events.filter((e) => now - e.timestamp < socialMaxAge)
    );
    this._chatMessages.update((msgs) =>
      msgs.filter((m) => now - m.timestamp < 6000)
    );
  }

  private async triggerThinking(): Promise<void> {
    const biobits = this._biobits().filter((b) => b.isAlive());
    if (biobits.length === 0) return;

    const biobit = biobits[Math.floor(Math.random() * biobits.length)];

    biobit.consumeThinkingEnergy();

    if (!biobit.isAlive()) {
      this.recordDeath(biobit);
      return;
    }

    const nearbyBiobits = this.findNearbyBiobits(biobit, 150);
    const prompt = this.buildPrompt(biobit, nearbyBiobits);

    const response = await this.webLlm.generateDecision(prompt);
    if (response) {
      biobit.setIntention(response.intention);
      biobit.setMonologue(response.internal_monologue);
      
      if (response.public_message && response.public_message !== '...') {
        this.handlePublicMessage(biobit, response);
      }

      this.executeAction(biobit, response, nearbyBiobits);
    }
  }

  private handlePublicMessage(biobit: BioBit, response: LLMResponse): void {
    biobit.setPublicMessage(response.public_message);
    
    const isLie = response.intention === 'attack' && 
      !response.public_message.toLowerCase().includes('attack');
    
    this._chatMessages.update((msgs) => [
      ...msgs,
      {
        id: crypto.randomUUID(),
        senderId: biobit.id,
        senderName: biobit.name,
        message: response.public_message,
        isLie,
        trueIntention: isLie ? response.internal_monologue : undefined,
        position: biobit.position(),
        timestamp: Date.now(),
      },
    ]);
  }

  private executeAction(biobit: BioBit, response: LLMResponse, nearbyBiobits: BioBit[]): void {
    if (nearbyBiobits.length === 0) return;

    const nearestOther = nearbyBiobits[0];
    const dist = this.distance(biobit.position(), nearestOther.position());

    switch (response.intention) {
      case 'attack':
        if (dist < 40) {
          this.performAttack(biobit, nearestOther);
        } else {
          biobit.setTarget(nearestOther.id);
          biobit.moveTo(nearestOther.position(), 0.7, this.bounds);
        }
        break;

      case 'socialize':
        if (dist < 40 && biobit.energy() > 30) {
          this.performShare(biobit, nearestOther);
        } else if (dist > 30) {
          biobit.setTarget(nearestOther.id);
          biobit.moveTo(nearestOther.position(), 0.5, this.bounds);
        }
        break;

      case 'flee':
        biobit.fleeFrom(nearestOther.position(), 2, this.bounds);
        biobit.addMemory(`Fled from ${nearestOther.name}`, nearestOther.id);
        this.recordSocialEvent('flee', biobit, nearestOther);
        break;
    }
  }

  private performAttack(attacker: BioBit, target: BioBit): void {
    const damage = 10 + Math.random() * 15;
    const stolen = attacker.attackTarget(target, damage);
    
    this.recordSocialEvent('attack', attacker, target, { energyTransfer: -stolen });
    this._totalInteractions.update((t) => t + 1);

    if (!target.isAlive()) {
      this.recordDeath(target);
    }
  }

  private performShare(giver: BioBit, receiver: BioBit): void {
    const amount = 5 + Math.random() * 10;
    const shared = giver.shareEnergy(receiver, amount);
    
    if (shared > 0) {
      this.recordSocialEvent('share', giver, receiver, { energyTransfer: shared });
      this._totalInteractions.update((t) => t + 1);
    }
  }

  private recordSocialEvent(
    type: 'speak' | 'attack' | 'share' | 'flee' | 'befriend' | 'betray',
    actor: BioBit,
    target?: BioBit,
    extras?: { message?: string; energyTransfer?: number }
  ): void {
    const event = createSocialEvent(
      type,
      { id: actor.id, name: actor.name, position: actor.position() },
      target ? { id: target.id, name: target.name } : undefined,
      extras
    );
    this._socialEvents.update((events) => [...events, event]);
  }

  private findNearbyBiobits(biobit: BioBit, radius: number): BioBit[] {
    const pos = biobit.position();
    return this._biobits()
      .filter((b) => b.id !== biobit.id && b.isAlive())
      .filter((b) => this.distance(pos, b.position()) < radius)
      .sort((a, b) => this.distance(pos, a.position()) - this.distance(pos, b.position()));
  }

  private buildPrompt(biobit: BioBit, nearbyBiobits: BioBit[]): string {
    const state = biobit.getState();
    const nearestNutrient = this.findNearestNutrient(biobit);
    const energyLevel = state.energy;

    let prompt = `=== YOUR IDENTITY ===\n`;
    prompt += `Name: ${biobit.name}\n`;
    prompt += `Personality: ${biobit.personality.toUpperCase()}\n`;
    
    if (biobit.personality === 'altruist') {
      prompt += `Core trait: You help others, share energy, and build friendships.\n`;
    } else if (biobit.personality === 'manipulator') {
      prompt += `Core trait: You deceive others. Say friendly things but plan to attack.\n`;
    } else if (biobit.personality === 'paranoid') {
      prompt += `Core trait: You trust no one. Flee from threats, attack if cornered.\n`;
    } else {
      prompt += `Core trait: You are balanced. Adapt based on situation.\n`;
    }

    prompt += `\n=== YOUR STATUS ===\n`;
    prompt += `Energy: ${energyLevel.toFixed(0)}%\n`;
    
    if (energyLevel < 20) {
      prompt += `⚠️ CRITICAL: You are STARVING! You must find food immediately or you will DIE.\n`;
      prompt += `PRIORITY: Set intention to "hunt" to find food!\n`;
    } else if (energyLevel < 40) {
      prompt += `⚠️ WARNING: Energy is low. Consider hunting for food.\n`;
    } else if (energyLevel > 80) {
      prompt += `✓ Energy is high. You can socialize or help others.\n`;
    }

    prompt += `\n=== WHAT YOU SEE ===\n`;
    
    if (nearestNutrient) {
      const dist = this.distance(state.position, nearestNutrient);
      const type = nearestNutrient.type;
      const typeDesc = type === 'toxic' ? '(TOXIC - avoid!)' : type === 'rich' ? '(RICH - extra energy!)' : '';
      prompt += `🍃 Food ${typeDesc}: ${dist.toFixed(0)} units away\n`;
    } else {
      prompt += `🍃 No food visible nearby\n`;
    }

    if (nearbyBiobits.length > 0) {
      prompt += `\n👥 Other organisms nearby:\n`;
      nearbyBiobits.slice(0, 3).forEach((other) => {
        const dist = this.distance(state.position, other.position());
        const relation = biobit.getRelation(other.id);
        const otherEnergy = other.energy();
        const powerDiff = otherEnergy - state.energy;
        
        let threatLevel = '';
        if (powerDiff > 20) threatLevel = '(STRONGER than you)';
        else if (powerDiff < -20) threatLevel = '(WEAKER than you)';
        else threatLevel = '(similar strength)';
        
        prompt += `  • ${other.name} [${other.personality}] - ${dist.toFixed(0)} units away\n`;
        prompt += `    Energy: ${otherEnergy.toFixed(0)}% ${threatLevel}\n`;
        
        if (relation !== 'unknown') {
          const emoji = relation === 'friend' ? '💚' : relation === 'enemy' ? '💔' : '🎯';
          prompt += `    Relationship: ${emoji} ${relation}\n`;
        }
        
        const otherMsg = other.lastPublicMessage();
        if (other.hasActiveMessage() && otherMsg && otherMsg !== '...') {
          prompt += `    Says: "${otherMsg}"\n`;
        }
      });
    } else {
      prompt += `👥 You are alone - no other organisms nearby\n`;
    }

    if (state.memories.length > 0) {
      prompt += `\n📜 Your recent memories:\n`;
      state.memories.slice(-3).forEach((m) => {
        prompt += `  • ${m.event}\n`;
      });
    }

    prompt += `\n=== DECIDE YOUR ACTION ===\n`;
    prompt += `Based on your ${biobit.personality} personality and current situation:\n`;
    prompt += `- "hunt" = search for food\n`;
    prompt += `- "attack" = steal energy from others (risky!)\n`;
    prompt += `- "socialize" = approach others peacefully, maybe share\n`;
    prompt += `- "flee" = run away from danger\n`;
    
    if (energyLevel < 20) {
      prompt += `\n⚠️ REMINDER: You are STARVING! "hunt" is strongly recommended!\n`;
    }

    return prompt;
  }

  private findNearestNutrient(biobit: BioBit): Nutrient | null {
    const nutrients = this._nutrients();
    if (nutrients.length === 0) return null;

    const pos = biobit.position();
    return nutrients.reduce((nearest, n) => {
      const distN = this.distance(pos, n);
      const distNearest = this.distance(pos, nearest);
      return distN < distNearest ? n : nearest;
    });
  }

  private distance(a: Position, b: { x: number; y: number }): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  spawnBiobit(name?: string): void {
    const personalities: Personality[] = ['paranoid', 'altruist', 'manipulator', 'neutral'];
    const id = crypto.randomUUID();
    const biobit = new BioBit({
      id,
      name: name || `Bit_${this._biobits().length + 1}`,
      personality: personalities[Math.floor(Math.random() * personalities.length)],
      position: {
        x: Math.random() * this.bounds.width,
        y: Math.random() * this.bounds.height,
      },
    });

    this._biobits.update((list) => [...list, biobit]);
  }

  removeBiobit(id: string): void {
    this._biobits.update((list) => list.filter((b) => b.id !== id));
  }

  spawnNutrient(): void {
    const nutrient = createNutrient(
      Math.random() * this.bounds.width,
      Math.random() * this.bounds.height
    );
    this._nutrients.update((list) => [...list, nutrient]);
  }

  removeNutrient(id: string): void {
    this._nutrients.update((list) => list.filter((n) => n.id !== id));
  }

  setEntropy(value: number): void {
    this._entropy.set(Math.max(0.1, Math.min(3, value)));
  }

  setAbundance(value: number): void {
    this._abundance.set(Math.max(0.1, Math.min(3, value)));
  }

  selectBiobit(biobit: BioBit | null): void {
    this._selectedBiobit.set(biobit);
  }

  triggerEvent(event: 'freeze' | 'frenzy'): void {
    if (event === 'freeze') {
      this._entropy.set(0.2);
      setTimeout(() => this._entropy.set(1), 5000);
    } else if (event === 'frenzy') {
      this._biobits().forEach((b) => b.setIntention('attack'));
      setTimeout(() => {
        this._biobits().forEach((b) => b.setIntention('hunt'));
      }, 5000);
    }
  }

  setClickMode(mode: 'select' | 'food' | 'lightning'): void {
    this._clickMode.set(mode);
  }

  spawnBiobitWithPersonality(personality: Personality): void {
    const id = crypto.randomUUID();
    const biobit = new BioBit({
      id,
      name: `Bit_${this._biobits().length + 1}`,
      personality,
      position: {
        x: Math.random() * this.bounds.width,
        y: Math.random() * this.bounds.height,
      },
    });
    this._biobits.update((list) => [...list, biobit]);
  }

  spawnNutrientAt(x: number, y: number): void {
    const nutrient = createNutrient(x, y);
    this._nutrients.update((list) => [...list, nutrient]);
  }

  healAllBiobits(amount: number): void {
    this._biobits().forEach((b) => {
      b.gainEnergy(amount);
    });
  }

  damageAllBiobits(amount: number): void {
    this._biobits().forEach((b) => {
      b.consumeEnergy(amount);
    });
  }

  shufflePositions(): void {
    this._biobits().forEach((b) => {
      b.setPosition({
        x: Math.random() * this.bounds.width,
        y: Math.random() * this.bounds.height,
      });
    });
  }

  lightningStrike(x: number, y: number): BioBit | null {
    const biobits = this.aliveBiobits();
    for (const biobit of biobits) {
      const pos = biobit.position();
      const dist = Math.sqrt((pos.x - x) ** 2 + (pos.y - y) ** 2);
      if (dist < 50) {
        biobit.consumeEnergy(50);
        return biobit;
      }
    }
    return null;
  }

  handleCanvasClick(x: number, y: number): void {
    const mode = this._clickMode();
    
    if (mode === 'select') {
      const biobits = this.aliveBiobits();
      for (const biobit of biobits) {
        const pos = biobit.position();
        const dist = Math.sqrt((pos.x - x) ** 2 + (pos.y - y) ** 2);
        if (dist < 30) {
          this.selectBiobit(biobit);
          return;
        }
      }
      this.selectBiobit(null);
    } else if (mode === 'food') {
      this.spawnNutrientAt(x, y);
    } else if (mode === 'lightning') {
      this.lightningStrike(x, y);
    }
  }
}
