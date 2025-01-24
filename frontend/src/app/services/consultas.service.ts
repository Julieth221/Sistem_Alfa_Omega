import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConsultasService {
  private apiUrl = `${environment.apiUrl}/novedades`;

  constructor(private http: HttpClient) {}

  getNovedades() {
    return this.http.get(`${this.apiUrl}/consulta`);
  }

  getProductosNovedad(novedadId: number) {
    return this.http.get(`${this.apiUrl}/${novedadId}/productos`);
  }

  actualizarNovedad(id: number, novedad: any) {
    return this.http.put(`${this.apiUrl}/${id}`, novedad);
  }

  eliminarNovedad(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  agregarObservacion(novedadId: number, observacion: string) {
    return this.http.post(`${this.apiUrl}/${novedadId}/observaciones`, { observacion });
  }
} 