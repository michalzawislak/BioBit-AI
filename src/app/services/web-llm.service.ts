import { Injectable, signal } from '@angular/core';
import { CreateMLCEngine, MLCEngine } from '@mlc-ai/web-llm';

export interface LLMResponse {
  intention: 'hunt' | 'flee' | 'socialize' | 'attack';
  internal_monologue: string;
  public_message: string;
  move_direction: { x: number; y: number };
}

const VALID_INTENTIONS = ['hunt', 'flee', 'socialize', 'attack'] as const;

@Injectable({ providedIn: 'root' })
export class WebLlmService {
  private engine: MLCEngine | null = null;

  private readonly _isLoading = signal(false);
  private readonly _loadProgress = signal(0);
  private readonly _isReady = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _generationCount = signal(0);
  private readonly _parseErrorCount = signal(0);

  readonly isLoading = this._isLoading.asReadonly();
  readonly loadProgress = this._loadProgress.asReadonly();
  readonly isReady = this._isReady.asReadonly();
  readonly error = this._error.asReadonly();
  readonly stats = {
    generations: this._generationCount.asReadonly(),
    parseErrors: this._parseErrorCount.asReadonly(),
  };

  async initialize(): Promise<void> {
    if (this._isReady() || this._isLoading()) return;

    this._isLoading.set(true);
    this._error.set(null);
    this._loadProgress.set(0);

    try {
      this.engine = await CreateMLCEngine('SmolLM2-360M-Instruct-q4f32_1-MLC', {
        initProgressCallback: (progress) => {
          this._loadProgress.set(progress.progress);
          console.log(`Loading model: ${(progress.progress * 100).toFixed(1)}%`);
        },
      });

      this._isReady.set(true);
      console.log('WebLLM ready!');
    } catch (err) {
      this._error.set(err instanceof Error ? err.message : 'Failed to load model');
      console.error('WebLLM init error:', err);
    } finally {
      this._isLoading.set(false);
    }
  }

  async generateDecision(prompt: string): Promise<LLMResponse | null> {
    if (!this.engine) return null;

    try {
      const systemPrompt = `You are a BioBit organism. Read the situation carefully and decide your action.

RULES:
1. If energy < 20%, you MUST choose "hunt" to survive
2. Your personality affects your choices
3. Output ONLY JSON, nothing else

JSON FORMAT:
{"intention":"hunt","internal_monologue":"I need food","public_message":"...","move_direction":{"x":0,"y":0}}

INTENTIONS:
- "hunt" = find food (PRIORITY when energy is low!)
- "attack" = steal energy from others
- "socialize" = be friendly, share energy
- "flee" = escape danger

PERSONALITY GUIDE:
- altruist: prefer socialize, help others
- manipulator: say nice things but attack (lie!)
- paranoid: flee from strangers, attack if threatened
- neutral: balanced decisions

Examples:
Low energy: {"intention":"hunt","internal_monologue":"I must find food or die","public_message":"...","move_direction":{"x":1,"y":0}}
Manipulator: {"intention":"attack","internal_monologue":"I will steal from them","public_message":"Hello friend!","move_direction":{"x":0,"y":1}}

Output ONLY valid JSON:`;

      const response = await this.engine.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt + '\n\nRespond with JSON only:' },
        ],
        temperature: 0.7,
        max_tokens: 120,
        top_p: 0.9,
      });

      this._generationCount.update((c) => c + 1);

      const content = response.choices[0]?.message?.content || '';
      return this.parseResponse(content);
    } catch (err) {
      console.error('LLM generation error:', err);
      this._parseErrorCount.update((c) => c + 1);
      return this.getFallbackResponse();
    }
  }

  private parseResponse(content: string): LLMResponse {
    const cleanContent = content
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .replace(/^[^{]*/, '')
      .replace(/[^}]*$/, '')
      .trim();

    const jsonMatch = cleanContent.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)?\}/);

    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return this.validateAndSanitize(parsed);
      } catch {
        return this.tryExtractFields(content);
      }
    }

    return this.tryExtractFields(content);
  }

  private tryExtractFields(content: string): LLMResponse {
    this._parseErrorCount.update((c) => c + 1);

    const intentionMatch = content.match(/intention["\s:]+["']?(hunt|flee|socialize|attack)["']?/i);
    const monologueMatch = content.match(/internal_monologue["\s:]+["']([^"']+)["']/i);
    const messageMatch = content.match(/public_message["\s:]+["']([^"']+)["']/i);

    if (intentionMatch) {
      return {
        intention: intentionMatch[1].toLowerCase() as LLMResponse['intention'],
        internal_monologue: monologueMatch?.[1] || 'Thinking...',
        public_message: messageMatch?.[1] || '...',
        move_direction: { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 },
      };
    }

    return this.getFallbackResponse();
  }

  private validateAndSanitize(parsed: Record<string, unknown>): LLMResponse {
    const intention = String(parsed['intention'] || '').toLowerCase();
    const validIntention = VALID_INTENTIONS.includes(intention as typeof VALID_INTENTIONS[number])
      ? (intention as LLMResponse['intention'])
      : VALID_INTENTIONS[Math.floor(Math.random() * VALID_INTENTIONS.length)];

    const monologue = String(parsed['internal_monologue'] || 'Thinking...').slice(0, 100);
    const message = String(parsed['public_message'] || '...').slice(0, 50);

    let moveDir = { x: 0, y: 0 };
    if (parsed['move_direction'] && typeof parsed['move_direction'] === 'object') {
      const dir = parsed['move_direction'] as Record<string, unknown>;
      moveDir = {
        x: Math.max(-1, Math.min(1, Number(dir['x']) || 0)),
        y: Math.max(-1, Math.min(1, Number(dir['y']) || 0)),
      };
    }

    return {
      intention: validIntention,
      internal_monologue: monologue,
      public_message: message,
      move_direction: moveDir,
    };
  }

  private getFallbackResponse(): LLMResponse {
    const intentions = VALID_INTENTIONS;
    return {
      intention: intentions[Math.floor(Math.random() * intentions.length)],
      internal_monologue: 'Processing...',
      public_message: '...',
      move_direction: {
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
      },
    };
  }
}
