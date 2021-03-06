import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ConfigurationService } from '../configuration/configuration.service';

@Injectable({
  providedIn: 'root',
})
export class DarkModeService {
  private isDarkMode = false;
  isDarkModeSubject = new BehaviorSubject<boolean>(this.isDarkMode);
  isDarkMode$ = this.isDarkModeSubject.pipe(tap((isDark) => (this.isDarkMode = isDark)));
  constructor(@Inject(DOCUMENT) private document: Document, private config: ConfigurationService) {
    if (
      (this.config.isFeatureEnabled('darkMode') && localStorage.getItem('theme') === 'dark') ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      this.enable();
    } else {
      this.disable();
    }
  }
  private get bodyElement() {
    return this.document.querySelector('body');
  }

  toggle() {
    if (this.isDarkMode) {
      this.disable();
    } else {
      this.enable();
    }
  }

  enable() {
    this.bodyElement?.classList.add(...['dark']);
    this.isDarkModeSubject.next(true);
    localStorage.setItem('theme', 'dark');
  }
  disable() {
    this.bodyElement?.classList.remove(...['dark']);
    this.isDarkModeSubject.next(false);
    localStorage.setItem('theme', 'light');
  }
}
