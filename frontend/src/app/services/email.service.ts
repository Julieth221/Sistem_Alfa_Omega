import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  constructor(private http: HttpClient) {}

  previewEmail(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/novedades/preview`, data);
  }
} 