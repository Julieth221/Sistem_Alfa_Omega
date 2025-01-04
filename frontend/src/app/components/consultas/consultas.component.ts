import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-consultas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="consultas">
      <h2>Consulta de Formatos</h2>
      <!-- Aquí irá el contenido de consultas -->
    </div>
  `
})
export class ConsultasComponent {} 