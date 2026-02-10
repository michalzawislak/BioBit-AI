import { Component, inject } from '@angular/core';
import { SimulationService } from '../services/simulation.service';

@Component({
  selector: 'app-social-log',
  template: `
    <div class="bg-black/60 backdrop-blur-md rounded-xl p-3 w-64 border border-gray-800 max-h-48 overflow-hidden">
      <h3 class="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-2">
        <span>📜 Social Log</span>
        <span class="text-purple-400">({{ simulation.totalInteractions() }})</span>
      </h3>

      @if (simulation.recentSocialLog().length === 0) {
        <div class="text-xs text-gray-600 italic">No interactions yet...</div>
      } @else {
        <ul class="space-y-1 text-xs overflow-y-auto max-h-32">
          @for (event of simulation.recentSocialLog(); track $index) {
            <li 
              class="text-gray-400 py-0.5 border-b border-gray-800/50 last:border-0"
              [class.text-red-400]="event.includes('⚔️') || event.includes('🗡️')"
              [class.text-purple-400]="event.includes('🤝') || event.includes('💜')"
              [class.text-yellow-400]="event.includes('🏃')"
            >
              {{ event }}
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class SocialLogComponent {
  readonly simulation = inject(SimulationService);
}
