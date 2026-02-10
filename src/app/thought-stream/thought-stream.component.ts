import { Component, inject, ElementRef, viewChild, effect, signal } from '@angular/core';
import { SimulationService } from '../services/simulation.service';

interface ThoughtEntry {
  id: string;
  biobitId: string;
  biobitName: string;
  biobitColor: string;
  personality: string;
  personalityIcon: string;
  intention: string;
  thought: string;
  publicMessage: string;
  targetName: string | null;
  isDeceptive: boolean;
  timestamp: number;
}

@Component({
  selector: 'app-thought-stream',
  standalone: true,
  template: `
    <div style="height: 100%; display: flex; flex-direction: column; background: #0d0d14;">
      
      <!-- Header (clickable) -->
      <button 
        (click)="expanded.set(!expanded())"
        style="padding: 12px 16px; border: none; border-bottom: 1px solid #1f2937; display: flex; align-items: center; justify-content: space-between; background: transparent; cursor: pointer; width: 100%;"
      >
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 18px;">🧠</span>
          <span style="font-size: 14px; font-weight: 600; color: #e5e7eb;">Mind Reader</span>
          <span style="font-size: 11px; color: #6b7280;">{{ expanded() ? '▼' : '▶' }}</span>
        </div>
        <span style="font-size: 11px; color: #6b7280;">{{ thoughts.length }} events</span>
      </button>
      
      <!-- Messages (collapsible) -->
      @if (expanded()) {
      <div #scrollContainer style="flex: 1; overflow-y: auto; padding: 8px 0;">
        @for (entry of thoughts; track entry.id) {
          <div style="padding: 12px 16px; border-bottom: 1px solid #1f2937; transition: background 0.15s;"
               [style.background]="getEntryBackground(entry.intention)">
            
            <!-- Who is acting -->
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <!-- Avatar -->
              <div style="width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px;"
                   [style.background]="entry.biobitColor + '33'">
                {{ entry.personalityIcon }}
              </div>
              
              <!-- Name & Intention -->
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-size: 13px; font-weight: 600;" [style.color]="entry.biobitColor">
                    {{ entry.biobitName }}
                  </span>
                  @if (entry.targetName) {
                    <span style="font-size: 11px; color: #6b7280;">→</span>
                    <span style="font-size: 12px; color: #9ca3af;">{{ entry.targetName }}</span>
                  }
                </div>
                <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
                  <span style="font-size: 10px; padding: 2px 8px; border-radius: 4px;"
                        [style.background]="getIntentionBg(entry.intention)"
                        [style.color]="getIntentionColor(entry.intention)">
                    {{ getIntentionLabel(entry.intention) }}
                  </span>
                  <span style="font-size: 10px; color: #4b5563;">{{ formatTime(entry.timestamp) }}</span>
                </div>
              </div>
            </div>

            <!-- Internal Thought (always shown) -->
            <div style="margin-left: 40px; padding: 8px 12px; background: #1a1a24; border-radius: 8px; border-left: 3px solid #6b7280;">
              <div style="font-size: 10px; color: #6b7280; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                <span>💭</span> THINKING
              </div>
              <div style="font-size: 12px; color: #d1d5db; line-height: 1.4; font-style: italic;">
                {{ entry.thought }}
              </div>
            </div>
            
            <!-- Public Message (if exists and different) -->
            @if (entry.publicMessage && entry.publicMessage !== '...' && entry.publicMessage !== entry.thought) {
              <div style="margin-left: 40px; margin-top: 8px; padding: 8px 12px; border-radius: 8px; border-left: 3px solid;"
                   [style.background]="entry.isDeceptive ? '#2d1f1f' : '#1f2d1f'"
                   [style.borderColor]="entry.isDeceptive ? '#ef4444' : '#22c55e'">
                <div style="font-size: 10px; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;"
                     [style.color]="entry.isDeceptive ? '#f87171' : '#4ade80'">
                  <span>{{ entry.isDeceptive ? '🎭' : '💬' }}</span>
                  {{ entry.isDeceptive ? 'LYING' : 'SAYS' }}
                </div>
                <div style="font-size: 12px; color: #f3f4f6; line-height: 1.4;">
                  "{{ entry.publicMessage }}"
                </div>
              </div>
            }
          </div>
        } @empty {
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 16px; color: #4b5563;">
            <div style="font-size: 48px; margin-bottom: 12px; opacity: 0.3;">🧠</div>
            <div style="font-size: 14px; color: #6b7280;">Waiting for activity...</div>
            <div style="font-size: 11px; color: #4b5563; margin-top: 4px;">BioBits are waking up</div>
          </div>
        }
      </div>
      }
    </div>
  `,
})
export class ThoughtStreamComponent {
  private readonly simulation = inject(SimulationService);
  private readonly scrollContainer = viewChild<ElementRef<HTMLDivElement>>('scrollContainer');
  
  readonly expanded = signal(true);
  
  private readonly personalityIcons: Record<string, string> = {
    altruist: '😇',
    manipulator: '😈',
    paranoid: '😰',
    neutral: '😐',
  };

  thoughts: ThoughtEntry[] = [];
  private maxThoughts = 30;
  private lastThoughts = new Map<string, string>();

  constructor() {
    effect(() => {
      const biobits = this.simulation.aliveBiobits();
      
      biobits.forEach((biobit) => {
        const thought = biobit.internalMonologue();
        const lastThought = this.lastThoughts.get(biobit.id);
        
        if (thought && thought !== '...' && thought !== 'Processing...' && thought !== lastThought) {
          this.lastThoughts.set(biobit.id, thought);
          
          const targetName = this.extractTargetName(thought, biobit.name);
          
          this.addThought({
            id: crypto.randomUUID(),
            biobitId: biobit.id,
            biobitName: biobit.name,
            biobitColor: biobit.color(),
            personality: biobit.personality,
            personalityIcon: this.personalityIcons[biobit.personality] || '🧬',
            intention: biobit.intention(),
            thought,
            publicMessage: biobit.lastPublicMessage(),
            targetName,
            isDeceptive: this.checkDeception(biobit.intention(), biobit.lastPublicMessage()),
            timestamp: Date.now(),
          });
        }
      });
    });
  }

  private extractTargetName(thought: string, selfName: string): string | null {
    const biobits = this.simulation.aliveBiobits();
    for (const b of biobits) {
      if (b.name !== selfName && thought.toLowerCase().includes(b.name.toLowerCase())) {
        return b.name;
      }
    }
    return null;
  }

  private addThought(entry: ThoughtEntry): void {
    this.thoughts = [entry, ...this.thoughts].slice(0, this.maxThoughts);
    
    setTimeout(() => {
      const container = this.scrollContainer()?.nativeElement;
      if (container) {
        container.scrollTop = 0;
      }
    }, 10);
  }

  private checkDeception(intention: string, message: string): boolean {
    if (!message || message === '...') return false;
    const msg = message.toLowerCase();
    
    if (intention === 'attack' && (msg.includes('friend') || msg.includes('help') || msg.includes('share'))) {
      return true;
    }
    if (intention === 'flee' && (msg.includes('friend') || msg.includes('stay') || msg.includes('trust'))) {
      return true;
    }
    return false;
  }

  formatTime(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 5) return 'now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  }

  getEntryBackground(intention: string): string {
    const bgs: Record<string, string> = {
      attack: 'rgba(127, 29, 29, 0.1)',
      hunt: 'transparent',
      socialize: 'rgba(88, 28, 135, 0.1)',
      flee: 'rgba(113, 63, 18, 0.1)',
    };
    return bgs[intention] || 'transparent';
  }

  getIntentionBg(intention: string): string {
    const bgs: Record<string, string> = {
      attack: '#7f1d1d',
      hunt: '#14532d',
      socialize: '#581c87',
      flee: '#713f12',
    };
    return bgs[intention] || '#1f2937';
  }

  getIntentionColor(intention: string): string {
    const colors: Record<string, string> = {
      attack: '#fca5a5',
      hunt: '#86efac',
      socialize: '#c4b5fd',
      flee: '#fcd34d',
    };
    return colors[intention] || '#9ca3af';
  }

  getIntentionLabel(intention: string): string {
    const labels: Record<string, string> = {
      attack: '⚔️ ATTACKING',
      hunt: '🍃 HUNTING',
      socialize: '💬 SOCIALIZING',
      flee: '🏃 FLEEING',
    };
    return labels[intention] || intention.toUpperCase();
  }
}
