import {
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  viewChild,
  inject,
  effect,
  afterNextRender,
  signal,
} from '@angular/core';
import { SimulationService } from '../services/simulation.service';
import { WebLlmService } from '../services/web-llm.service';
import { ControlPanelComponent } from '../control-panel/control-panel.component';
import { InspectorComponent } from '../inspector/inspector.component';
import { ThoughtStreamComponent } from '../thought-stream/thought-stream.component';
import { BioBit } from '../models/biobit.model';
import { NUTRIENT_CONFIG } from '../models/nutrient.model';

@Component({
  selector: 'app-abyss',
  standalone: true,
  imports: [ControlPanelComponent, InspectorComponent, ThoughtStreamComponent],
  template: `
    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; background: #0a0a0f;">
      
      <!-- MAIN AREA -->
      <div style="flex: 1; display: flex; overflow: hidden;">
        
        <!-- AQUARIUM -->
        <div #aquarium style="flex: 1; position: relative; overflow: hidden;">
          <canvas #canvas 
            [style.display]="'block'" 
            [style.cursor]="getCursorStyle()"
            (click)="onCanvasClick($event)"></canvas>

          @if (!webLlm.isReady()) {
            <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: #0a0a0f; z-index: 50;">
              <div class="text-center max-w-md px-8">
                <div class="mb-8">
                  <div class="text-6xl mb-4 animate-pulse">🧬</div>
                  <h1 class="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">BioBit AI</h1>
                  <p class="text-gray-500 mt-2">The Abyss awaits...</p>
                </div>

                @if (webLlm.isLoading()) {
                  <div class="space-y-4">
                    <div class="text-sm text-purple-400">Initializing neural consciousness...</div>
                    <div class="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                      <div class="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 transition-all duration-300 animate-shimmer" [style.width.%]="webLlm.loadProgress() * 100"></div>
                    </div>
                    <div class="text-lg font-mono text-white">{{ (webLlm.loadProgress() * 100).toFixed(0) }}%</div>
                    <div class="text-xs text-gray-600 mt-4">Loading SmolLM2-360M model (~580 MB)</div>
                  </div>
                } @else if (webLlm.error()) {
                  <div class="bg-red-900/30 border border-red-800 rounded-lg p-4">
                    <div class="text-red-400 font-semibold mb-2">Failed to load AI</div>
                    <div class="text-red-300 text-sm">{{ webLlm.error() }}</div>
                    <button (click)="retryLoadModel()" class="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm transition">Retry</button>
                  </div>
                } @else {
                  <div class="text-gray-400">
                    <div class="animate-spin inline-block w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                    <div class="mt-2">Preparing...</div>
                  </div>
                }

                <div class="mt-12 text-xs text-gray-700">Requires WebGPU-compatible browser (Chrome 113+, Edge 113+)</div>
              </div>
            </div>
          }

          @if (webLlm.isReady()) {
            <!-- Stats overlay top-left (collapsible) -->
            <div style="position: absolute; top: 12px; left: 12px; z-index: 10; background: rgba(0,0,0,0.8); border-radius: 8px; overflow: hidden;">
              <button 
                (click)="statsExpanded.set(!statsExpanded())"
                style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; border: none; background: transparent; color: #9ca3af; cursor: pointer; font-size: 12px; width: 100%;"
              >
                <span style="color: #22c55e;">🤖 AI</span>
                <span>{{ statsExpanded() ? '▼' : '▶' }}</span>
                @if (!statsExpanded()) {
                  <span style="color: #6b7280;">{{ simulation.aliveBiobits().length }} alive</span>
                }
              </button>
              @if (statsExpanded()) {
                <div style="display: flex; gap: 16px; padding: 8px 12px; border-top: 1px solid #374151; font-size: 12px; color: #9ca3af;">
                  <span>🧬 {{ simulation.aliveBiobits().length }}</span>
                  <span>💀 {{ simulation.totalDeaths() }}</span>
                  <span>🍃 {{ simulation.nutrients().length }}</span>
                  <span>⚔️ {{ simulation.totalInteractions() }}</span>
                </div>
              }
            </div>
          }
        </div>

        <!-- SIDE PANEL -->
        <div style="width: 320px; display: flex; flex-direction: column; background: #0d0d14; border-left: 1px solid #1f2937; overflow: hidden;">
          @if (webLlm.isReady()) {
            <!-- Inspector (if selected) - scrollable -->
            @if (simulation.selectedBiobit()) {
              <div style="max-height: 60%; overflow-y: auto; border-bottom: 1px solid #1f2937;">
                <app-inspector [biobit]="simulation.selectedBiobit()!" (close)="simulation.selectBiobit(null)" />
              </div>
            }
            
            <!-- Thought Stream -->
            <div style="flex: 1; overflow-y: auto; min-height: 0;">
              <app-thought-stream />
            </div>
          } @else {
            <div style="flex: 1; display: flex; align-items: center; justify-content: center;" class="text-gray-600 text-sm">
              Loading AI model...
            </div>
          }
        </div>
      </div>

      <!-- BOTTOM TOOLBAR -->
      @if (webLlm.isReady()) {
        <app-control-panel />
      }
    </div>
  `,
  styles: `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .animate-shimmer {
      background-size: 200% 100%;
      animation: shimmer 2s linear infinite;
    }
  `,
})
export class AbyssComponent implements OnInit, OnDestroy {
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly aquariumRef = viewChild.required<ElementRef<HTMLDivElement>>('aquarium');

  readonly simulation = inject(SimulationService);
  readonly webLlm = inject(WebLlmService);
  
  readonly statsExpanded = signal(true);

  private ctx: CanvasRenderingContext2D | null = null;
  private metaballCtx: CanvasRenderingContext2D | null = null;
  private metaballCanvas: HTMLCanvasElement | null = null;
  private renderFrameId: number | null = null;

  private simulationStarted = false;

  constructor() {
    afterNextRender(() => {
      this.initCanvas();
      this.startRenderLoop();
    });

    effect(() => {
      if (this.webLlm.isReady() && !this.simulationStarted) {
        this.startSimulation();
      }
    });
  }

  ngOnInit(): void {
    this.webLlm.initialize();
  }

  private startSimulation(): void {
    this.simulationStarted = true;

    this.simulation.spawnBiobit('Alpha');
    this.simulation.spawnBiobit('Beta');
    this.simulation.spawnBiobit('Gamma');

    for (let i = 0; i < 8; i++) {
      this.simulation.spawnNutrient();
    }

    this.simulation.start();
  }

  retryLoadModel(): void {
    this.webLlm.initialize();
  }

  private resizeObserver: ResizeObserver | null = null;

  ngOnDestroy(): void {
    this.simulation.stop();
    if (this.renderFrameId) {
      cancelAnimationFrame(this.renderFrameId);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private updateCanvasSize(): void {
    const aquarium = this.aquariumRef()?.nativeElement;
    const canvas = this.canvasRef()?.nativeElement;
    if (!aquarium || !canvas) return;

    const width = aquarium.clientWidth;
    const height = aquarium.clientHeight;

    if (width === 0 || height === 0) return;

    canvas.width = width;
    canvas.height = height;
    if (this.metaballCanvas) {
      this.metaballCanvas.width = width;
      this.metaballCanvas.height = height;
    }
    this.simulation.setBounds(width, height);
  }

  private initCanvas(): void {
    const canvas = this.canvasRef().nativeElement;
    const aquarium = this.aquariumRef().nativeElement;
    this.ctx = canvas.getContext('2d');

    this.metaballCanvas = document.createElement('canvas');
    this.metaballCtx = this.metaballCanvas.getContext('2d');

    this.resizeObserver = new ResizeObserver(() => this.updateCanvasSize());
    this.resizeObserver.observe(aquarium);

    this.updateCanvasSize();
  }

  private startRenderLoop(): void {
    const render = () => {
      this.renderFrameId = requestAnimationFrame(render);
      this.draw();
    };
    render();
  }

  private draw(): void {
    if (!this.ctx) return;
    const canvas = this.canvasRef().nativeElement;
    const ctx = this.ctx;

    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    this.drawAmbientParticles(ctx, canvas.width, canvas.height);
    this.drawMetaballs(ctx);
    this.drawNutrients(ctx);
    this.drawDeadBiobits(ctx);
    this.drawSocialConnections(ctx);
    this.drawAliveBiobits(ctx);
    this.drawFeedEffects(ctx);
    this.drawChatBubbles(ctx);
    this.drawSocialEffects(ctx);
  }

  private drawAmbientParticles(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const time = Date.now() / 1000;
    ctx.save();

    for (let i = 0; i < 30; i++) {
      const x = ((Math.sin(time * 0.1 + i * 0.5) + 1) / 2) * width;
      const y = ((Math.cos(time * 0.08 + i * 0.7) + 1) / 2) * height;
      const alpha = 0.02 + Math.sin(time + i) * 0.01;
      const size = 2 + Math.sin(time * 2 + i) * 1;

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(168, 85, 247, ${alpha})`;
      ctx.fill();
    }

    ctx.restore();
  }

  private drawMetaballs(ctx: CanvasRenderingContext2D): void {
    if (!this.metaballCtx || !this.metaballCanvas) return;
    const metaCtx = this.metaballCtx;
    const biobits = this.simulation.aliveBiobits();

    if (biobits.length === 0) return;

    metaCtx.clearRect(0, 0, this.metaballCanvas.width, this.metaballCanvas.height);

    biobits.forEach((biobit) => {
      const pos = biobit.position();
      const energy = biobit.energy();
      const color = biobit.color();
      const baseRadius = 30 + (energy / 100) * 25;

      const gradient = metaCtx.createRadialGradient(
        pos.x, pos.y, 0,
        pos.x, pos.y, baseRadius
      );

      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);

      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.6)`);
      gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.3)`);
      gradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, 0.1)`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      metaCtx.beginPath();
      metaCtx.arc(pos.x, pos.y, baseRadius, 0, Math.PI * 2);
      metaCtx.fillStyle = gradient;
      metaCtx.fill();
    });

    ctx.save();
    ctx.filter = 'blur(8px)';
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(this.metaballCanvas, 0, 0);
    ctx.filter = 'none';
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }

  private drawNutrients(ctx: CanvasRenderingContext2D): void {
    const time = Date.now() / 1000;

    this.simulation.nutrients().forEach((nutrient) => {
      const config = NUTRIENT_CONFIG[nutrient.type];
      const pulse = Math.sin(time * 3 + nutrient.pulsePhase) * 0.3 + 0.7;
      const baseRadius = nutrient.type === 'golden' ? 6 : nutrient.type === 'rich' ? 5 : 4;
      const radius = baseRadius + pulse * 4;

      ctx.save();

      if (nutrient.type === 'toxic') {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
          const r = i % 2 === 0 ? radius : radius * 0.5;
          const x = nutrient.x + Math.cos(angle) * r;
          const y = nutrient.y + Math.sin(angle) * r;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
      } else {
        ctx.beginPath();
        ctx.arc(nutrient.x, nutrient.y, radius, 0, Math.PI * 2);
      }

      ctx.fillStyle = config.color + Math.floor(pulse * 200).toString(16).padStart(2, '0');
      ctx.shadowColor = config.glow;
      ctx.shadowBlur = nutrient.type === 'golden' ? 30 : 20;
      ctx.fill();

      if (nutrient.type === 'golden') {
        ctx.beginPath();
        ctx.arc(nutrient.x, nutrient.y, radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.shadowBlur = 0;
        ctx.fill();
      }

      ctx.restore();
    });
  }

  private drawDeadBiobits(ctx: CanvasRenderingContext2D): void {
    this.simulation.deadBiobits().forEach((biobit) => {
      const pos = biobit.position();
      const timeSinceDeath = biobit.getTimeSinceDeath();
      const fadeProgress = Math.min(1, timeSinceDeath / 10000);
      const alpha = 0.5 * (1 - fadeProgress);

      if (alpha <= 0) return;

      ctx.save();
      ctx.globalAlpha = alpha;

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#333';
      ctx.fill();

      ctx.font = '10px Inter, system-ui';
      ctx.fillStyle = '#666';
      ctx.textAlign = 'center';
      ctx.fillText('💀', pos.x, pos.y + 4);

      if (timeSinceDeath < 3000) {
        const lastWords = biobit.lastWords();
        if (lastWords) {
          ctx.font = '10px Inter, system-ui';
          ctx.fillStyle = '#888';
          ctx.fillText(lastWords, pos.x, pos.y - 20);
        }
      }

      ctx.restore();
    });
  }

  private drawAliveBiobits(ctx: CanvasRenderingContext2D): void {
    const selectedId = this.simulation.selectedBiobit()?.id;
    
    this.simulation.aliveBiobits().forEach((biobit) => {
      const pos = biobit.position();
      const color = biobit.color();
      const energy = biobit.energy();
      const radius = 15 + (energy / 100) * 10;
      const isSelected = biobit.id === selectedId;
      const glowIntensity = biobit.glowIntensity();
      const effect = biobit.visualEffect();

      ctx.save();

      if (isSelected) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius + 8, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 20;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;
      }

      if (effect === 'eating') {
        ctx.shadowColor = '#4ade80';
        ctx.shadowBlur = 50;
      } else if (effect === 'attacking') {
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 60;
      } else if (effect === 'sharing') {
        ctx.shadowColor = '#60a5fa';
        ctx.shadowBlur = 50;
      } else if (effect === 'speaking') {
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 40;
      } else if (effect === 'starving' || biobit.isStarving()) {
        const blink = Math.sin(Date.now() / 100) > 0;
        if (blink) {
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 40;
        }
      } else if (effect === 'thinking') {
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 45;
      }

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = ctx.shadowColor || color;
      ctx.shadowBlur = ctx.shadowBlur || 30 * glowIntensity;
      ctx.globalAlpha = 0.5 + glowIntensity * 0.5;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.shadowBlur = 0;
      ctx.fill();

      this.drawEnergyBar(ctx, pos.x, pos.y, radius, energy);
      this.drawBiobitLabel(ctx, pos.x, pos.y, radius, biobit.name, biobit.personality, isSelected);

      if (effect === 'thinking') {
        this.drawThinkingIndicator(ctx, pos.x, pos.y, radius);
      }

      const monologue = biobit.internalMonologue();
      if (monologue && monologue !== '...' && monologue !== 'Processing...') {
        this.drawThoughtBubble(ctx, pos.x, pos.y, radius, monologue, biobit.isStarving());
      }

      ctx.restore();
    });
  }

  private readonly personalityIcons: Record<string, string> = {
    altruist: '😇',
    manipulator: '😈',
    paranoid: '😰',
    neutral: '😐',
  };

  private drawBiobitLabel(
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    radius: number, 
    name: string, 
    personality: string,
    isSelected: boolean
  ): void {
    const icon = this.personalityIcons[personality] || '🧬';
    const labelY = y + radius + 22;
    
    ctx.font = '12px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(255,255,255,0.8)';
    ctx.fillText(`${icon} ${name}`, x, labelY);
  }

  private drawEnergyBar(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, energy: number): void {
    const barWidth = radius * 2;
    const barHeight = 4;
    const barY = y + radius + 8;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(x - barWidth / 2, barY, barWidth, barHeight, 2);
    ctx.fill();

    let barColor: string;
    if (energy > 60) barColor = '#22c55e';
    else if (energy > 30) barColor = '#eab308';
    else barColor = '#ef4444';

    ctx.fillStyle = barColor;
    ctx.beginPath();
    ctx.roundRect(x - barWidth / 2, barY, (barWidth * energy) / 100, barHeight, 2);
    ctx.fill();
  }

  private drawThinkingIndicator(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
    const time = Date.now() / 300;
    for (let i = 0; i < 3; i++) {
      const angle = time + (i * Math.PI * 2) / 3;
      const dotX = x + Math.cos(angle) * (radius + 8);
      const dotY = y + Math.sin(angle) * (radius + 8);

      ctx.beginPath();
      ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#a855f7';
      ctx.fill();
    }
  }

  private drawThoughtBubble(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, text: string, isStarving: boolean): void {
    ctx.globalAlpha = 0.9;
    ctx.font = '11px Inter, system-ui';

    const displayText = text.length > 25 ? text.slice(0, 25) + '...' : text;
    const textWidth = ctx.measureText(displayText).width;

    const bgColor = isStarving ? 'rgba(127,29,29,0.8)' : 'rgba(0,0,0,0.7)';
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(x - textWidth / 2 - 8, y - radius - 35, textWidth + 16, 22, 8);
    ctx.fill();

    ctx.fillStyle = isStarving ? '#fca5a5' : '#fff';
    ctx.shadowBlur = 0;
    ctx.textAlign = 'center';
    ctx.fillText(displayText, x, y - radius - 19);
  }

  private drawFeedEffects(ctx: CanvasRenderingContext2D): void {
    const now = Date.now();

    this.simulation.recentFeeds().forEach((feed) => {
      const age = now - feed.time;
      if (age > 1000) return;

      const progress = age / 1000;
      const alpha = 1 - progress;
      const yOffset = -30 * progress;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 14px Inter, system-ui';
      ctx.textAlign = 'center';

      const color = feed.energyGained > 0 ? '#4ade80' : '#ef4444';
      const sign = feed.energyGained > 0 ? '+' : '';
      const text = `${sign}${feed.energyGained.toFixed(0)}`;

      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fillText(text, feed.position.x, feed.position.y + yOffset);

      ctx.restore();
    });
  }

  private drawSocialConnections(ctx: CanvasRenderingContext2D): void {
    const biobits = this.simulation.aliveBiobits();
    
    biobits.forEach((biobit) => {
      const targetId = biobit.currentTarget();
      if (!targetId) return;

      const target = biobits.find((b) => b.id === targetId);
      if (!target) return;

      const pos = biobit.position();
      const targetPos = target.position();
      const intention = biobit.intention();

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(targetPos.x, targetPos.y);

      if (intention === 'attack') {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
        ctx.setLineDash([5, 5]);
      } else if (intention === 'socialize') {
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
        ctx.setLineDash([3, 3]);
      } else {
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
        ctx.setLineDash([2, 4]);
      }

      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    });
  }

  private drawChatBubbles(ctx: CanvasRenderingContext2D): void {
    const now = Date.now();

    this.simulation.chatMessages().forEach((msg) => {
      const age = now - msg.timestamp;
      if (age > 5000) return;

      const alpha = Math.max(0, 1 - age / 5000);
      const yOffset = -50 - (age / 5000) * 20;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = '12px Inter, system-ui';

      const displayText = msg.message.length > 30 ? msg.message.slice(0, 30) + '...' : msg.message;
      const textWidth = ctx.measureText(displayText).width;

      const bgColor = msg.isLie ? 'rgba(127, 29, 29, 0.85)' : 'rgba(30, 30, 40, 0.85)';
      const borderColor = msg.isLie ? '#ef4444' : '#6366f1';

      ctx.fillStyle = bgColor;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(msg.position.x - textWidth / 2 - 12, msg.position.y + yOffset - 18, textWidth + 24, 28, 10);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(msg.position.x - 6, msg.position.y + yOffset + 10);
      ctx.lineTo(msg.position.x, msg.position.y + yOffset + 18);
      ctx.lineTo(msg.position.x + 6, msg.position.y + yOffset + 10);
      ctx.fillStyle = bgColor;
      ctx.fill();

      ctx.fillStyle = msg.isLie ? '#fca5a5' : '#e0e7ff';
      ctx.textAlign = 'center';
      ctx.fillText(displayText, msg.position.x, msg.position.y + yOffset);

      if (msg.isLie) {
        ctx.font = '10px Inter, system-ui';
        ctx.fillStyle = '#ef4444';
        ctx.fillText('🎭', msg.position.x + textWidth / 2 + 8, msg.position.y + yOffset);
      }

      ctx.restore();
    });
  }

  private drawSocialEffects(ctx: CanvasRenderingContext2D): void {
    const now = Date.now();

    this.simulation.socialEvents().forEach((event) => {
      const age = now - event.timestamp;
      if (age > 2000) return;

      const progress = age / 2000;
      const alpha = 1 - progress;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 16px Inter, system-ui';
      ctx.textAlign = 'center';

      let emoji = '';
      let color = '#fff';

      switch (event.type) {
        case 'attack':
          emoji = '⚔️';
          color = '#ef4444';
          break;
        case 'share':
          emoji = '💜';
          color = '#a855f7';
          break;
        case 'flee':
          emoji = '💨';
          color = '#eab308';
          break;
        case 'befriend':
          emoji = '🤝';
          color = '#22c55e';
          break;
        case 'betray':
          emoji = '🗡️';
          color = '#dc2626';
          break;
      }

      if (emoji) {
        const scale = 1 + progress * 0.5;
        const yOffset = -20 - progress * 30;

        ctx.font = `${16 * scale}px Inter, system-ui`;
        ctx.fillText(emoji, event.position.x, event.position.y + yOffset);

        if (event.energyTransfer) {
          ctx.font = 'bold 12px Inter, system-ui';
          ctx.fillStyle = color;
          const sign = event.energyTransfer > 0 ? '+' : '';
          ctx.fillText(`${sign}${event.energyTransfer.toFixed(0)}`, event.position.x + 20, event.position.y + yOffset);
        }
      }

      ctx.restore();
    });
  }

  getCursorStyle(): string {
    const mode = this.simulation.clickMode();
    switch (mode) {
      case 'food': return 'cell';
      case 'lightning': return 'crosshair';
      default: return 'pointer';
    }
  }

  onCanvasClick(event: MouseEvent): void {
    const rect = this.canvasRef().nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    this.simulation.handleCanvasClick(x, y);
  }
}
