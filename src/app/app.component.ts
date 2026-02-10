import { Component } from '@angular/core';
import { AbyssComponent } from './abyss/abyss.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AbyssComponent],
  template: `
    <main class="w-screen h-screen relative">
      <app-abyss />
    </main>
  `,
})
export class AppComponent {}
