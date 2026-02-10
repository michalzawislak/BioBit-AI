import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SimulationService } from '../services/simulation.service';
import { Personality } from '../models/biobit.model';

@Component({
  selector: 'app-control-panel',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div style="
      width: 100%;
      background: #111827;
      border-top: 2px solid #374151;
      padding: 12px 24px;
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      align-items: center;
      gap: 24px;
      overflow-x: auto;
    ">
      
      <!-- Play/Pause -->
      <button 
        (click)="simulation.togglePause()"
        style="
          width: 56px;
          height: 56px;
          border-radius: 12px;
          font-size: 24px;
          border: none;
          cursor: pointer;
          flex-shrink: 0;
        "
        [style.background]="simulation.isPaused() ? '#22c55e' : '#eab308'"
        [style.color]="simulation.isPaused() ? 'white' : 'black'"
      >
        {{ simulation.isPaused() ? '▶' : '⏸' }}
      </button>

      <!-- Divider -->
      <div style="width: 1px; height: 48px; background: #374151; flex-shrink: 0;"></div>

      <!-- Click Mode -->
      <div style="flex-shrink: 0;">
        <div style="font-size: 10px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px; text-align: center;">Click Mode</div>
        <div style="display: flex; gap: 8px;">
          @for (mode of clickModes; track mode.id) {
            <button
              (click)="simulation.setClickMode(mode.id)"
              style="
                width: 56px;
                height: 48px;
                border-radius: 8px;
                border: none;
                cursor: pointer;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 2px;
              "
              [style.background]="simulation.clickMode() === mode.id ? mode.activeBg : '#1f2937'"
              [style.color]="simulation.clickMode() === mode.id ? 'white' : '#9ca3af'"
              [style.boxShadow]="simulation.clickMode() === mode.id ? '0 0 0 2px ' + mode.ringColor : 'none'"
              [title]="mode.hint"
            >
              <span style="font-size: 20px;">{{ mode.icon }}</span>
              <span style="font-size: 9px;">{{ mode.label }}</span>
            </button>
          }
        </div>
      </div>

      <!-- Divider -->
      <div style="width: 1px; height: 48px; background: #374151; flex-shrink: 0;"></div>

      <!-- Speed -->
      <div style="width: 120px; flex-shrink: 0;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
          <span style="color: #9ca3af;">⚡ Speed</span>
          <span style="color: #a855f7; font-family: monospace;">{{ simulation.entropy().toFixed(1) }}x</span>
        </div>
        <input type="range" min="0.2" max="3" step="0.1"
          [ngModel]="simulation.entropy()"
          (ngModelChange)="simulation.setEntropy($event)"
          style="width: 100%; accent-color: #a855f7;"
        />
      </div>

      <!-- Food Rate -->
      <div style="width: 120px; flex-shrink: 0;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
          <span style="color: #9ca3af;">🍃 Food</span>
          <span style="color: #22c55e; font-family: monospace;">{{ simulation.abundance().toFixed(1) }}x</span>
        </div>
        <input type="range" min="0.1" max="3" step="0.1"
          [ngModel]="simulation.abundance()"
          (ngModelChange)="simulation.setAbundance($event)"
          style="width: 100%; accent-color: #22c55e;"
        />
      </div>

      <!-- Divider -->
      <div style="width: 1px; height: 48px; background: #374151; flex-shrink: 0;"></div>

      <!-- Spawn -->
      <div style="flex-shrink: 0;">
        <div style="font-size: 10px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px; text-align: center;">Spawn</div>
        <div style="display: flex; gap: 8px;">
          <button (click)="simulation.spawnBiobit()"
            style="height: 48px; padding: 0 16px; background: #7c3aed; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 13px;">
            🧬 BioBit
          </button>
          <button (click)="spawnFood(5)"
            style="height: 48px; padding: 0 16px; background: #16a34a; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 13px;">
            🍃 +5
          </button>
        </div>
      </div>

      <!-- Divider -->
      <div style="width: 1px; height: 48px; background: #374151; flex-shrink: 0;"></div>

      <!-- Personalities -->
      <div style="flex-shrink: 0;">
        <div style="font-size: 10px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px; text-align: center;">Personality</div>
        <div style="display: flex; gap: 6px;">
          @for (p of personalities; track p.id) {
            <button (click)="spawnWithPersonality(p.id)"
              style="width: 48px; height: 48px; border-radius: 8px; border: none; cursor: pointer; font-size: 24px;"
              [style.background]="p.bg"
              [title]="p.label">
              {{ p.icon }}
            </button>
          }
        </div>
      </div>

      <!-- Divider -->
      <div style="width: 1px; height: 48px; background: #374151; flex-shrink: 0;"></div>

      <!-- Powers -->
      <div style="flex-shrink: 0;">
        <div style="font-size: 10px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px; text-align: center;">Powers</div>
        <div style="display: flex; gap: 6px;">
          @for (power of powers; track power.id) {
            <button (click)="power.action()"
              style="width: 48px; height: 48px; border-radius: 8px; border: none; cursor: pointer; font-size: 24px;"
              [style.background]="power.bg"
              [title]="power.label">
              {{ power.icon }}
            </button>
          }
        </div>
      </div>

    </div>
  `,
})
export class ControlPanelComponent {
  readonly simulation = inject(SimulationService);

  readonly clickModes = [
    { id: 'select' as const, icon: '👆', label: 'Select', hint: 'Click to inspect', activeBg: '#2563eb', ringColor: '#60a5fa' },
    { id: 'food' as const, icon: '🍃', label: 'Food', hint: 'Click to drop food', activeBg: '#16a34a', ringColor: '#4ade80' },
    { id: 'lightning' as const, icon: '⚡', label: 'Zap', hint: 'Click to damage', activeBg: '#ca8a04', ringColor: '#facc15' },
  ];

  readonly personalities = [
    { id: 'altruist' as Personality, icon: '😇', label: 'Spawn Altruist', bg: '#1d4ed8' },
    { id: 'manipulator' as Personality, icon: '😈', label: 'Spawn Manipulator', bg: '#b91c1c' },
    { id: 'paranoid' as Personality, icon: '😰', label: 'Spawn Paranoid', bg: '#7c3aed' },
    { id: 'neutral' as Personality, icon: '😐', label: 'Spawn Neutral', bg: '#4b5563' },
  ];

  readonly powers = [
    { id: 'freeze', icon: '❄️', label: 'Freeze all', bg: '#0e7490', action: () => this.simulation.triggerEvent('freeze') },
    { id: 'frenzy', icon: '🔥', label: 'Frenzy mode', bg: '#dc2626', action: () => this.simulation.triggerEvent('frenzy') },
    { id: 'rain', icon: '🌧️', label: 'Food rain', bg: '#15803d', action: () => this.foodRain() },
    { id: 'heal', icon: '💖', label: 'Heal all', bg: '#be185d', action: () => this.simulation.healAllBiobits(30) },
    { id: 'plague', icon: '☠️', label: 'Plague', bg: '#6b21a8', action: () => this.simulation.damageAllBiobits(20) },
    { id: 'chaos', icon: '🎲', label: 'Chaos shuffle', bg: '#a16207', action: () => this.simulation.shufflePositions() },
  ];

  spawnWithPersonality(personality: Personality): void {
    this.simulation.spawnBiobitWithPersonality(personality);
  }

  spawnFood(count: number): void {
    for (let i = 0; i < count; i++) {
      this.simulation.spawnNutrient();
    }
  }

  foodRain(): void {
    for (let i = 0; i < 15; i++) {
      this.simulation.spawnNutrient();
    }
  }
}
