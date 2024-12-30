import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-novedades',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="novedades">
      <h2>Registro de Novedades</h2>
      <!-- Aquí irá el contenido del formulario de novedades -->
    </div>
  `
})
export class NovedadesComponent {} 