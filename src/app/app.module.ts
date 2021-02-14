import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import {
  BrowserModule,
  HammerGestureConfig,
  HammerModule,
  HAMMER_GESTURE_CONFIG,
} from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { IconModule } from '@app/modules/icon/icon.module';
import { TagState } from '@app/store/states/tag.state';
import { TechnologyState } from '@app/store/states/technology.state';
import { UserState } from '@app/store/states/user.state';
import { DialogModule } from '@ngneat/dialog';
import {
  popperVariation,
  TippyModule,
  tooltipVariation,
} from '@ngneat/helipopper';
import { TippyConfig } from '@ngneat/helipopper/lib/tippy.types';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { NgxsModule } from '@ngxs/store';
import { DIRECTION_ALL } from 'hammerjs';
import { ToastrModule } from 'ngx-toastr';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BookmarkFolderState } from './pages/dashboard/bookmarks/shared/store/states/bookmark-folders.state';
import { BookmarkState } from './pages/dashboard/bookmarks/shared/store/states/bookmarks.state';
import { HomeState } from './pages/dashboard/home/shared/store/states/home.state';
import { PackageFolderState } from './pages/dashboard/packages/store/states/package-folders.state';
import { PackageState } from './pages/dashboard/packages/store/states/package.state';
import { SnippetFolderState } from './pages/dashboard/snippets/store/states/snippet-folders.state';
import { SnippetState } from './pages/dashboard/snippets/store/states/snippets.state';
import { AuthInterceptor } from './shared/interceptors/auth.interceptor';
import { DelayApiInterceptor } from './shared/interceptors/delay-api.interceptor';

const tippyConfig: Partial<TippyConfig> = {
  defaultVariation: 'tooltip',
  variations: {
    tooltip: tooltipVariation,
    popper: popperVariation,
    menu: {
      ...popperVariation,
      role: 'dropdown',
      arrow: false,
      hideOnClick: true,
      zIndex: 99,
    },
  },
};

export class MyHammerConfig extends HammerGestureConfig {
  overrides = <any>{
    swipe: { direction: DIRECTION_ALL },
    pan: { direction: DIRECTION_ALL },
  };
}

const firebaseConfig = {
  apiKey: 'AIzaSyAgVpSqG91sy8ZZpYfTHjwlF5ydxZWUzJc',
  authDomain: 'cartella-2021.firebaseapp.com',
  projectId: 'cartella-2021',
  storageBucket: 'cartella-2021.appspot.com',
  messagingSenderId: '359576304939',
  appId: '1:359576304939:web:5db0dc5cb8013bfb87196e',
};
@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    IconModule,
    HammerModule,
    DialogModule.forRoot({
      windowClass: 'cartella-dialog',
    }),
    TippyModule.forRoot(),
    ToastrModule.forRoot({
      timeOut: 2000,
      positionClass: 'toast-bottom-right',
    }),
    TippyModule.forRoot(tippyConfig),
    NgxsModule.forRoot(
      [
        UserState,
        HomeState,
        TechnologyState,
        TagState,
        SnippetState,
        SnippetFolderState,
        BookmarkState,
        BookmarkFolderState,
        PackageState,
        PackageFolderState,
      ],
      { developmentMode: !environment.production }
    ),
    NgxsReduxDevtoolsPluginModule.forRoot(),
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
    }),
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: DelayApiInterceptor,
      multi: true,
    },
    {
      provide: HAMMER_GESTURE_CONFIG,
      useClass: MyHammerConfig,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
