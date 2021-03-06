import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CARTELLA_ENDPOINTS } from '@cartella/config/endpoints.config';
import { environment } from '@cartella/env/environment';
import { BookmarkMetaData } from '../interfaces/bookmarks.interface';

@Injectable({
  providedIn: 'root',
})
export class MetaExtractorService {
  private readonly apiUrl = `${environment.api}/${CARTELLA_ENDPOINTS.metaExtractor}`;
  constructor(private http: HttpClient) {}

  getMetaData(url: string) {
    return this.http.post<BookmarkMetaData>(this.apiUrl, { url });
  }
}
