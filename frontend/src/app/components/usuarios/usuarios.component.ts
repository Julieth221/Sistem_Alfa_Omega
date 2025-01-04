import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="usuarios">
      <h2>Gestión de Usuarios</h2>
      <!-- Aquí irá el contenido de gestión de usuarios -->
    </div>
  `
})
export class UsuariosComponent {} 