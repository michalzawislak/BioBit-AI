import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-legend',
  standalone: true,
  template: `
    <div class="p-3">
      <button 
        (click)="expanded.set(!expanded())"
        class="w-full flex items-center justify-between text-xs text-gray-400 hover:text-gray-300 transition-colors"
      >
        <span class="font-medium uppercase tracking-wider">Legend</span>
        <span class="text-[10px]">{{ expanded() ? '▼' : '▶' }}</span>
      </button>
      
      @if (expanded()) {
        <!-- Personalities -->
        <div class="mt-3">
          <div class="text-[10px] text-gray-500 uppercase mb-1.5">Personalities</div>
          <div class="grid grid-cols-2 gap-1.5 text-[11px]">
            <div class="flex items-center gap-1.5">
              <span>😇</span>
              <span class="text-blue-400">Altruist</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span>😈</span>
              <span class="text-red-400">Manipulator</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span>😰</span>
              <span class="text-purple-400">Paranoid</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span>😐</span>
              <span class="text-gray-400">Neutral</span>
            </div>
          </div>
        </div>

        <!-- Intentions -->
        <div class="mt-3 pt-2 border-t border-gray-800">
          <div class="text-[10px] text-gray-500 uppercase mb-1.5">Intentions (glow color)</div>
          <div class="grid grid-cols-2 gap-1.5 text-[11px]">
            <div class="flex items-center gap-1.5">
              <div class="w-2.5 h-2.5 rounded-full bg-green-500"></div>
              <span class="text-gray-400">Hunt food</span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-2.5 h-2.5 rounded-full bg-red-500"></div>
              <span class="text-gray-400">Attack</span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
              <span class="text-gray-400">Socialize</span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
              <span class="text-gray-400">Flee</span>
            </div>
          </div>
        </div>
        
        <!-- Other symbols -->
        <div class="mt-3 pt-2 border-t border-gray-800">
          <div class="text-[10px] text-gray-500 uppercase mb-1.5">Symbols</div>
          <div class="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500">
            <span>🎭 Lying</span>
            <span>💭 Thinking</span>
            <span>💬 Speaking</span>
            <span>💀 Dead</span>
          </div>
        </div>
      } @else {
        <!-- Compact: show personalities only -->
        <div class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
          <span>😇 <span class="text-gray-500">Altruist</span></span>
          <span>😈 <span class="text-gray-500">Manipulator</span></span>
          <span>😰 <span class="text-gray-500">Paranoid</span></span>
          <span>😐 <span class="text-gray-500">Neutral</span></span>
        </div>
      }
    </div>
  `,
})
export class LegendComponent {
  expanded = signal(false);
}
