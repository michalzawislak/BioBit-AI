import { Component, input, output } from '@angular/core';
import { BioBit } from '../models/biobit.model';

@Component({
  selector: 'app-inspector',
  standalone: true,
  template: `
    <div style="background: #111827; border-radius: 12px; overflow: hidden;">
      
      <!-- Header -->
      <div style="padding: 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #374151;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <!-- Avatar -->
          <div style="width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px;"
               [style.background]="biobit().color() + '33'"
               [style.boxShadow]="'0 0 20px ' + biobit().color() + '66'">
            {{ getPersonalityIcon() }}
          </div>
          <div>
            <div style="font-size: 18px; font-weight: 700;" [style.color]="biobit().color()">
              {{ biobit().name }}
            </div>
            <div style="font-size: 12px; color: #9ca3af; display: flex; align-items: center; gap: 6px;">
              <span>{{ getPersonalityLabel() }}</span>
              <span style="color: #4b5563;">•</span>
              <span>{{ getPersonalityDescription() }}</span>
            </div>
          </div>
        </div>
        <button
          (click)="close.emit()"
          style="width: 32px; height: 32px; background: #1f2937; border: none; border-radius: 8px; color: #9ca3af; cursor: pointer; font-size: 16px;"
        >✕</button>
      </div>

      <!-- Dead State -->
      @if (!biobit().isAlive()) {
        <div style="margin: 16px; padding: 16px; background: linear-gradient(135deg, #450a0a, #7f1d1d); border-radius: 12px; border: 1px solid #991b1b;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
            <span style="font-size: 32px;">💀</span>
            <span style="font-size: 18px; font-weight: 700; color: #fca5a5;">DECEASED</span>
          </div>
          @if (biobit().lastWords()) {
            <div style="font-size: 13px; color: #fecaca; font-style: italic; padding-left: 44px;">
              "{{ biobit().lastWords() }}"
            </div>
          }
        </div>
      }

      <div style="padding: 16px; display: flex; flex-direction: column; gap: 16px;">
        
        <!-- Energy Bar -->
        <div style="background: #1f2937; border-radius: 12px; padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 14px; color: #9ca3af; font-weight: 600;">⚡ ENERGY</span>
            <span style="font-size: 24px; font-weight: 700;"
                  [style.color]="getEnergyColor()">
              {{ biobit().energy().toFixed(0) }}%
            </span>
          </div>
          <div style="height: 12px; background: #374151; border-radius: 6px; overflow: hidden;">
            <div style="height: 100%; border-radius: 6px; transition: width 0.5s;"
                 [style.width.%]="biobit().energy()"
                 [style.background]="getEnergyGradient()">
            </div>
          </div>
          @if (biobit().isStarving()) {
            <div style="margin-top: 12px; padding: 8px 12px; background: #7f1d1d; border-radius: 8px; display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 16px;">⚠️</span>
              <span style="font-size: 12px; color: #fca5a5; font-weight: 600;">CRITICAL - Desperately seeking food!</span>
            </div>
          }
        </div>

        <!-- Status Cards -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <!-- Current State -->
          <div style="background: #1f2937; border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-size: 32px; margin-bottom: 8px;">{{ getStatusEmoji() }}</div>
            <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Status</div>
            <div style="font-size: 14px; color: #e5e7eb; font-weight: 600; margin-top: 4px;">{{ getStatus() }}</div>
          </div>
          <!-- Intention -->
          <div style="border-radius: 12px; padding: 16px; text-align: center;"
               [style.background]="getIntentionBg()">
            <div style="font-size: 32px; margin-bottom: 8px;">{{ getIntentionEmoji() }}</div>
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px;"
                 [style.color]="getIntentionLabelColor()">Intent</div>
            <div style="font-size: 14px; font-weight: 600; margin-top: 4px;"
                 [style.color]="getIntentionColor()">{{ getIntentionLabel() }}</div>
          </div>
        </div>

        <!-- Mind X-Ray -->
        <div style="background: #1a1625; border: 1px solid #581c87; border-radius: 12px; overflow: hidden;">
          <div style="background: #581c87; padding: 10px 16px; display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 16px;">👁️</span>
            <span style="font-size: 12px; font-weight: 700; color: #e9d5ff; text-transform: uppercase; letter-spacing: 1px;">Mind X-Ray</span>
          </div>
          
          <div style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">
            <!-- Thinking -->
            <div style="background: #1f1f2e; border-radius: 8px; padding: 12px; border-left: 4px solid #6b7280;">
              <div style="font-size: 10px; color: #6b7280; text-transform: uppercase; margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">
                <span>💭</span> THINKING
              </div>
              <div style="font-size: 13px; color: #d1d5db; line-height: 1.5; font-style: italic;">
                "{{ biobit().internalMonologue() }}"
              </div>
            </div>

            <!-- Speaking -->
            @if (biobit().hasActiveMessage()) {
              <div style="border-radius: 8px; padding: 12px; border-left: 4px solid;"
                   [style.background]="isLying() ? '#2a1f1f' : '#1f2a1f'"
                   [style.borderColor]="isLying() ? '#ef4444' : '#22c55e'">
                <div style="font-size: 10px; text-transform: uppercase; margin-bottom: 6px; display: flex; align-items: center; gap: 4px;"
                     [style.color]="isLying() ? '#f87171' : '#4ade80'">
                  <span>{{ isLying() ? '🎭' : '💬' }}</span>
                  {{ isLying() ? 'LYING' : 'SAYING' }}
                </div>
                <div style="font-size: 13px; color: #f3f4f6; line-height: 1.5;">
                  "{{ biobit().lastPublicMessage() }}"
                </div>
                @if (isLying()) {
                  <div style="margin-top: 8px; padding: 8px; background: #450a0a; border-radius: 6px; font-size: 11px; color: #fca5a5;">
                    ⚠️ Intent ({{ biobit().intention() }}) contradicts statement
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Relations -->
        @if (biobit().relations().size > 0) {
          <div style="background: #1f2937; border-radius: 12px; padding: 16px;">
            <div style="font-size: 12px; color: #9ca3af; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
              <span>🔗</span> RELATIONSHIPS
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              @for (entry of getRelationsArray(); track entry[0]) {
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 8px;"
                     [style.background]="getRelationBg(entry[1])">
                  <span style="font-size: 13px; color: #e5e7eb;">{{ entry[0] }}</span>
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 16px;">{{ getRelationEmoji(entry[1]) }}</span>
                    <span style="font-size: 12px; font-weight: 600; text-transform: uppercase;"
                          [style.color]="getRelationColor(entry[1])">{{ entry[1] }}</span>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Traits -->
        <div style="background: #1f2937; border-radius: 12px; padding: 16px;">
          <div style="font-size: 12px; color: #9ca3af; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
            <span>🧬</span> PERSONALITY TRAITS
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            @for (trait of getPersonalityTraits(); track trait.name) {
              <div>
                <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
                  <span style="color: #9ca3af;">{{ trait.name }}</span>
                  <span style="font-weight: 600;" [style.color]="trait.color">{{ trait.value }}%</span>
                </div>
                <div style="height: 6px; background: #374151; border-radius: 3px; overflow: hidden;">
                  <div style="height: 100%; border-radius: 3px;"
                       [style.width.%]="trait.value"
                       [style.background]="trait.color">
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Recent Memory -->
        @if (biobit().memories().length > 0) {
          <div style="background: #1f2937; border-radius: 12px; padding: 16px;">
            <div style="font-size: 12px; color: #9ca3af; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
              <span>📜</span> RECENT MEMORY
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              @for (memory of biobit().memories().slice(-3).reverse(); track memory.timestamp) {
                <div style="display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; border-bottom: 1px solid #374151;">
                  <div style="width: 8px; height: 8px; border-radius: 50%; background: #4b5563; margin-top: 4px; flex-shrink: 0;"></div>
                  <div style="flex: 1;">
                    <div style="font-size: 12px; color: #d1d5db; line-height: 1.4;">{{ memory.event }}</div>
                    <div style="font-size: 10px; color: #6b7280; margin-top: 2px;">{{ formatTime(memory.timestamp) }}</div>
                  </div>
                </div>
              }
            </div>
          </div>
        }

      </div>
    </div>
  `,
})
export class InspectorComponent {
  biobit = input.required<BioBit>();
  close = output();

  private readonly personalityIcons: Record<string, string> = {
    altruist: '😇',
    manipulator: '😈',
    paranoid: '😰',
    neutral: '😐',
  };

  getPersonalityIcon(): string {
    return this.personalityIcons[this.biobit().personality] || '🧬';
  }

  getPersonalityLabel(): string {
    const labels: Record<string, string> = {
      altruist: '😇 Altruist',
      manipulator: '😈 Manipulator',
      paranoid: '😰 Paranoid',
      neutral: '😐 Neutral',
    };
    return labels[this.biobit().personality] || this.biobit().personality;
  }

  getPersonalityDescription(): string {
    const desc: Record<string, string> = {
      paranoid: 'Trusts no one',
      altruist: 'Helps others',
      manipulator: 'Deceives for gain',
      neutral: 'Balanced',
    };
    return desc[this.biobit().personality] || '';
  }

  getEnergyColor(): string {
    const energy = this.biobit().energy();
    if (energy > 60) return '#4ade80';
    if (energy > 30) return '#facc15';
    return '#f87171';
  }

  getEnergyGradient(): string {
    const energy = this.biobit().energy();
    if (energy > 60) return 'linear-gradient(90deg, #22c55e, #4ade80)';
    if (energy > 30) return 'linear-gradient(90deg, #ca8a04, #facc15)';
    return 'linear-gradient(90deg, #dc2626, #f87171)';
  }

  getStatus(): string {
    if (!this.biobit().isAlive()) return 'Dead';
    if (this.biobit().isStarving()) return 'Starving';
    const effect = this.biobit().visualEffect();
    if (!effect) return 'Active';
    const statuses: Record<string, string> = {
      eating: 'Eating',
      thinking: 'Thinking',
      attacking: 'Attacking',
      sharing: 'Sharing',
      speaking: 'Speaking',
    };
    return statuses[effect] || 'Active';
  }

  getStatusEmoji(): string {
    if (!this.biobit().isAlive()) return '💀';
    if (this.biobit().isStarving()) return '😵';
    const effect = this.biobit().visualEffect();
    if (!effect) return '✨';
    const emojis: Record<string, string> = {
      eating: '🍽️',
      thinking: '💭',
      attacking: '⚔️',
      sharing: '💜',
      speaking: '💬',
    };
    return emojis[effect] || '✨';
  }

  getIntentionEmoji(): string {
    const emojis: Record<string, string> = {
      hunt: '🍃',
      attack: '⚔️',
      flee: '🏃',
      socialize: '💬',
      dying: '💀',
    };
    return emojis[this.biobit().intention()] || '❓';
  }

  getIntentionLabel(): string {
    const labels: Record<string, string> = {
      hunt: 'Hunting',
      attack: 'Attacking',
      flee: 'Fleeing',
      socialize: 'Socializing',
      dying: 'Dying',
    };
    return labels[this.biobit().intention()] || this.biobit().intention();
  }

  getIntentionBg(): string {
    const bgs: Record<string, string> = {
      hunt: '#14532d',
      attack: '#7f1d1d',
      flee: '#713f12',
      socialize: '#581c87',
      dying: '#1f2937',
    };
    return bgs[this.biobit().intention()] || '#1f2937';
  }

  getIntentionColor(): string {
    const colors: Record<string, string> = {
      hunt: '#4ade80',
      attack: '#f87171',
      flee: '#fcd34d',
      socialize: '#c4b5fd',
      dying: '#9ca3af',
    };
    return colors[this.biobit().intention()] || '#9ca3af';
  }

  getIntentionLabelColor(): string {
    const colors: Record<string, string> = {
      hunt: '#166534',
      attack: '#991b1b',
      flee: '#92400e',
      socialize: '#6b21a8',
      dying: '#4b5563',
    };
    return colors[this.biobit().intention()] || '#4b5563';
  }

  isLying(): boolean {
    const intention = this.biobit().intention();
    const message = this.biobit().lastPublicMessage()?.toLowerCase() || '';
    if (!message || message === '...') return false;
    if (intention === 'attack' && (message.includes('friend') || message.includes('help') || message.includes('trust'))) {
      return true;
    }
    if (intention === 'flee' && (message.includes('friend') || message.includes('stay'))) {
      return true;
    }
    return false;
  }

  getRelationsArray(): [string, string][] {
    return Array.from(this.biobit().relations().entries());
  }

  getRelationBg(relation: string): string {
    const bgs: Record<string, string> = {
      friend: '#14532d',
      enemy: '#7f1d1d',
      victim: '#713f12',
      unknown: '#374151',
    };
    return bgs[relation] || '#374151';
  }

  getRelationColor(relation: string): string {
    const colors: Record<string, string> = {
      friend: '#4ade80',
      enemy: '#f87171',
      victim: '#fcd34d',
      unknown: '#9ca3af',
    };
    return colors[relation] || '#9ca3af';
  }

  getRelationEmoji(relation: string): string {
    const emojis: Record<string, string> = {
      friend: '💚',
      enemy: '💔',
      victim: '🎯',
      unknown: '❓',
    };
    return emojis[relation] || '❓';
  }

  getPersonalityTraits(): { name: string; value: number; color: string }[] {
    const traits: Record<string, { name: string; value: number; color: string }[]> = {
      paranoid: [
        { name: 'Aggression', value: 70, color: '#ef4444' },
        { name: 'Trust', value: 15, color: '#22c55e' },
        { name: 'Cunning', value: 60, color: '#a855f7' },
        { name: 'Generosity', value: 20, color: '#3b82f6' },
      ],
      altruist: [
        { name: 'Aggression', value: 20, color: '#ef4444' },
        { name: 'Trust', value: 80, color: '#22c55e' },
        { name: 'Cunning', value: 30, color: '#a855f7' },
        { name: 'Generosity', value: 90, color: '#3b82f6' },
      ],
      manipulator: [
        { name: 'Aggression', value: 60, color: '#ef4444' },
        { name: 'Trust', value: 25, color: '#22c55e' },
        { name: 'Cunning', value: 95, color: '#a855f7' },
        { name: 'Generosity', value: 10, color: '#3b82f6' },
      ],
      neutral: [
        { name: 'Aggression', value: 50, color: '#ef4444' },
        { name: 'Trust', value: 50, color: '#22c55e' },
        { name: 'Cunning', value: 50, color: '#a855f7' },
        { name: 'Generosity', value: 50, color: '#3b82f6' },
      ],
    };
    return traits[this.biobit().personality] || traits['neutral'];
  }

  formatTime(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  }
}
