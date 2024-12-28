import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  //Vista previa del correo 
  previewEmail(novedadData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/novedades/preview-email`, novedadData);
  }

  // Enviar correo
  sendEmail(novedadData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/novedades/send-email`, novedadData);
  }
} 