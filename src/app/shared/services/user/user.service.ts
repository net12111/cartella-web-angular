import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { CARTELLA_ENDPOINTS } from '../../config/endpoints.config';
import { User } from '../../interfaces/user.interface';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  apiUrl = `${environment.api}/${CARTELLA_ENDPOINTS.users}`;
  constructor(private http: HttpClient) {}

  updateUser(id: string, data: Partial<User>) {
    return this.http.put<User>(`${this.apiUrl}/${id}`, data);
  }
}
