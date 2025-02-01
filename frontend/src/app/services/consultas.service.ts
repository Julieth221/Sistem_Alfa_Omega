import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConsultasService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getNovedades(remision_factura?: string): Observable<any> {
    let url = `${this.apiUrl}/consultas-novedades/consulta`;
    if (remision_factura) {
      url += `?remision_factura=${remision_factura}`;
    }
    console.log('URL de consulta:', url);
    return this.http.get(url).pipe(
      catchError(error => {
        console.error('Error en la consulta:', error);
        throw error;
      })
    );
  }

  getNovedad(id: number): Observable<any> {
    const url = `${this.apiUrl}/consultas-novedades/${id}`;
    console.log('URL de novedad específica:', url);
    return this.http.get(url).pipe(
      catchError(error => {
        console.error('Error al obtener novedad:', error);
        throw error;
      })
    );
  }

  getProductosNovedad(novedadId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/consultas-novedades/${novedadId}/productos`);
  }

  actualizarNovedad(id: number, datos: any): Observable<any> {
    console.log('Enviando actualización al backend:', datos);
    return this.http.put(`${this.apiUrl}/consultas-novedades/${id}`, datos)
      .pipe(
        tap(response => console.log('Respuesta del backend:', response))
      );
  }

  eliminarNovedad(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/consultas-novedades/${id}`);
  }

  getObservaciones(novedadId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/consultas-novedades/${novedadId}/observaciones`);
  }

  agregarObservacion(novedadId: number, observacion: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/consultas-novedades/${novedadId}/observaciones`, { observacion });
  }

  actualizarObservacion(observacionId: number, observacion: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/consultas-novedades/observaciones/${observacionId}`, { observacion });
  }

  enviarCorreo(novedadId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/consultas-novedades/${novedadId}/enviar-correo`, {});
  }

  eliminarImagen(novedadId: number, tipo: string, imagenId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/consultas-novedades/novedades/${novedadId}/imagenes/${tipo}/${imagenId}`);
  }

  enviarCorreoActualizacion(id: number): Observable<any> {
    console.log('Enviando solicitud de correo para novedad:', id);
    return this.http.post(`${this.apiUrl}/consultas-novedades/${id}/enviar-correo`, {})
      .pipe(
        tap(response => console.log('Respuesta del envío de correo:', response))
      );
  }
} 