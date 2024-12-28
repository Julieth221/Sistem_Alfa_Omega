import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="home">
      <header class="hero">
        <div class="logo-container">
          <img src="assets/images/logo.png" alt="ALFA Y OMEGA ENCHAPES Y ACABADOS S.A.S." class="logo">
        </div>
        <h1>ALFA Y OMEGA</h1>
        <h2>ENCHAPES Y ACABADOS S.A.S.</h2>
      </header>

      <section class="services">
        <h2>Nuestros Servicios</h2>
        <div class="services-grid">
          <div class="service-card">
            <i class="fas fa-tools"></i>
            <h3>Enchapes</h3>
            <p>Instalación profesional de enchapes para pisos y paredes</p>
          </div>
          <div class="service-card">
            <i class="fas fa-home"></i>
            <h3>Acabados</h3>
            <p>Acabados de alta calidad para su hogar o negocio</p>
          </div>
          <div class="service-card">
            <i class="fas fa-ruler-combined"></i>
            <h3>Asesoría</h3>
            <p>Asesoramiento experto en selección de materiales</p>
          </div>
        </div>
      </section>
    </div>
  `
})
export class HomeComponent {} 