import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DeletePromptComponent } from '@app/components/delete-prompt/delete-prompt.component';
import { MoveToFolderComponent } from '@app/components/move-to-folder/move-to-folder.component';
import { ALL_SNIPPETS_FOLDER } from '@app/config/snippets.config';
import { FeatureType } from '@app/interfaces/general.interface';
import { MoveToFolderModalPayload } from '@app/interfaces/move-to-folder.interface';
import { Technology } from '@app/interfaces/technology.interface';
import { User } from '@app/interfaces/user.interface';
import { IDBSyncService } from '@app/services/idb-sync-service/idb-sync.service';
import { MenuService } from '@app/services/menu/menu.service';
import { ToastService } from '@app/services/toast/toast.service';
import { WithDestroy } from '@app/services/with-destroy/with-destroy';
import { TechnologyState } from '@app/store/states/technology.state';
import { DialogService } from '@ngneat/dialog';
import { Select, Store } from '@ngxs/store';
import { has } from 'lodash-es';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import {
  filter,
  finalize,
  map,
  pluck,
  switchMap,
  take,
  tap,
} from 'rxjs/operators';
import {
  ExplorerSidebarEvent,
  ExplorerSidebarEventType,
} from '../shared/components/explorer-sidebar/explorer-sidebar.component';
import { SnippetsAddFolderComponent } from './components/modals/snippets-add-folder/snippets-add-folder.component';
import {
  Snippet,
  SnippetFolder,
  SnippetItemEvent,
  SnippetItemEventType,
  SnippetModes,
} from './shared/interfaces/snippets.interface';
import {
  DeleteSnippetFolder,
  GetSnippetFolders,
  SetActiveSnippetFolder,
} from './store/actions/snippets-folders.action';
import {
  DeleteSnippet,
  GetSnippets,
  SetActiveSnippet,
  SetActiveSnippetWithSlug,
  UpdateSnippet,
} from './store/actions/snippets.action';
import { SnippetFolderState } from './store/states/snippet-folders.state';
import { SnippetState } from './store/states/snippets.state';

@Component({
  selector: 'app-snippets',
  templateUrl: './snippets.component.html',
  styleUrls: ['./snippets.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnippetsComponent extends WithDestroy implements OnInit {
  @Select(SnippetState.getAllSnippets)
  allSnippets$: Observable<Snippet[]>;

  @Select(SnippetFolderState.getAllSnippetFolders)
  allSnippetFolders$: Observable<SnippetFolder[]>;

  @Select(SnippetState.getSnippetsShown)
  snippetsShown$: Observable<Snippet[]>;

  @Select(SnippetState.getAllSnippets)
  snippets$: Observable<Snippet[]>;

  @Select(SnippetState.getActiveSnippet)
  activeSnippet$: Observable<Snippet>;

  @Select(SnippetFolderState.getAllSnippetFolders)
  folders$: Observable<SnippetFolder[]>;

  @Select(SnippetFolderState.getActiveSnippetFolder)
  activeFolder$: Observable<SnippetFolder>;

  @Select(TechnologyState.getTechnologiesList)
  technologies$: Observable<Technology[]>;

  @Select(SnippetState.getSnippetFetched)
  snippetsFetched$: Observable<boolean>;

  @Select(SnippetFolderState.getSnippetFolderFetched)
  snippetFolderFetched$: Observable<boolean>;

  user: User;
  isLargeScreen = true;
  isMenuOpen$: Observable<boolean>;

  private snippetFolderLoadingSubject = new BehaviorSubject(false);
  snippetFolderLoading$ = this.snippetFolderLoadingSubject.pipe();

  private snippetLoadingSubject = new BehaviorSubject(false);
  snippetLoading$ = this.snippetLoadingSubject.pipe();
  private isLargeScreenSubject = new BehaviorSubject(this.isLargeScreen);
  isLargeScreen$ = this.isLargeScreenSubject.pipe(
    tap((data) => (this.isLargeScreen = data))
  );

  private modeSubject = new BehaviorSubject(SnippetModes.explorer);
  mode$ = this.modeSubject.pipe();
  availableModes = SnippetModes;
  constructor(
    private activatedRoute: ActivatedRoute,
    private store: Store,
    private dialog: DialogService,
    private menu: MenuService,
    private toaster: ToastService,
    private breakpointObserver: BreakpointObserver,
    private syncService: IDBSyncService
  ) {
    super();
  }

  ngOnInit(): void {
    const sub = this.getDataFromAPI()
      .pipe(switchMap(() => this.updateSnippetsWhenActiveFolderChanges()))
      .subscribe(() => {
        this.store.dispatch(new SetActiveSnippet(null));
        this.updateSnippetFoldersInIDB();
        this.updateSnippetsInIDB();
      });
    this.observeLayoutChanges();
    this.isMenuOpen$ = this.menu.isMenuOpen$;
    this.allSnippets$
      .pipe(filter((snippets) => snippets && snippets.length > 0))
      .subscribe(() => this.setSlugBasedSnippet(this.snippetSlug));
    this.subs.add(sub);
  }

  get snippetSlug() {
    return this.activatedRoute.snapshot.paramMap.get('slug');
  }

  closeMenu() {
    this.menu.closeMenu();
  }

  toggleMenu() {
    this.menu.toggleMenu();
  }

  changeMode(mode: SnippetModes) {
    this.modeSubject.next(mode);
  }

  handleSidebarEvent({ type, data }: ExplorerSidebarEvent) {
    switch (type) {
      case ExplorerSidebarEventType.select:
        this.handleSelectFolder(data);
        break;
      case ExplorerSidebarEventType.edit:
        this.handleEditFolder(data);
        break;
      case ExplorerSidebarEventType.createFolder:
        this.handleCreateFolder();
        break;
      case ExplorerSidebarEventType.delete:
        this.handleDeleteFolder(data);
        break;
      case ExplorerSidebarEventType.closeMenu:
        this.closeMenu();
        break;
    }
  }

  handleSelectFolder(folder: SnippetFolder) {
    if (folder) {
      this.snippetLoadingSubject.next(true);
      this.store.dispatch(new SetActiveSnippetFolder(folder));
      this.store.dispatch(new SetActiveSnippet(null));
    }
  }

  handleEditFolder(folder: SnippetFolder) {
    this.dialog.open(SnippetsAddFolderComponent, {
      size: 'sm',
      data: {
        folder,
        type: 'UPDATE',
      },
      enableClose: false,
    });
  }

  handleDeleteFolder(folder: SnippetFolder) {
    const dialogRef = this.dialog.open(DeletePromptComponent, {
      size: 'sm',
      minHeight: 'unset',
    });
    this.subs.add(
      dialogRef.afterClosed$
        .pipe(
          filter((allowDelete) => allowDelete),
          switchMap(() =>
            this.store.dispatch(new DeleteSnippetFolder(folder.id))
          )
        )
        .subscribe(
          () => {
            this.toaster.showSuccessToast('Folder deleted successfully!');
          },
          (err) => {
            if (has(err, 'error.message')) {
              this.toaster.showErrorToast(err.error.message);
            } else {
              this.toaster.showErrorToast('Folder was not deleted!');
            }
          }
        )
    );
  }

  handleCreateFolder() {
    this.dialog.open(SnippetsAddFolderComponent, {
      size: 'sm',
      enableClose: false,
      data: {
        type: 'CREATE',
      },
    });
  }

  handleItemEvent({ type, snippet }: SnippetItemEvent) {
    switch (type) {
      case SnippetItemEventType.delete:
        this.handleDelete(snippet);
        break;
      case SnippetItemEventType.move:
        this.handleMoveToFolder(snippet);
        break;
      case SnippetItemEventType.share:
        break;

      default:
        break;
    }
  }

  private handleMoveToFolder(snippet: Snippet) {
    const dialogRef = this.dialog.open<MoveToFolderModalPayload>(
      MoveToFolderComponent,
      {
        size: 'sm',
        minHeight: 'unset',
        data: {
          type: FeatureType.snippet,
          action: UpdateSnippet,
          item: snippet,
          folders: this.folders$.pipe(
            map((folders) =>
              folders.filter(({ id }) => id !== snippet.folder.id)
            )
          ),
        },
        enableClose: false,
      }
    );
    this.subs.add(
      dialogRef.afterClosed$
        .pipe(
          switchMap(() => combineLatest([this.snippets$, this.folders$])),
          take(1),
          switchMap(([snippets, folders]) =>
            this.syncService.syncItems(snippets, folders)
          ),
          switchMap(() =>
            this.store.dispatch(
              new GetSnippets(
                this.store.selectSnapshot(
                  SnippetFolderState.getActiveSnippetFolder
                )?.id
              )
            )
          )
        )
        .subscribe()
    );
  }

  private handleDelete(snippet: Snippet) {
    const dialogRef = this.dialog.open(DeletePromptComponent, {
      size: 'sm',
      minHeight: 'unset',
    });
    this.subs.add(
      dialogRef.afterClosed$
        .pipe(
          tap((response) => {
            if (response) {
              this.store.dispatch(new DeleteSnippet(snippet.id));
            }
          })
        )
        .subscribe()
    );
  }

  private getDataFromAPI() {
    this.snippetLoadingSubject.next(true);
    return combineLatest([this.getSnippets(), this.getSnippetFolders()]).pipe(
      switchMap(([bookmarks, folders]) =>
        combineLatest([
          this.syncService.syncItems(bookmarks, folders),
          this.syncService.syncFolders(folders),
        ])
      ),
      finalize(() => {
        this.snippetLoadingSubject.next(false);
      })
    );
  }

  private getSnippets() {
    return (
      this.store
        .dispatch(new GetSnippets(ALL_SNIPPETS_FOLDER?.id))
        // Get snippets from state
        .pipe(pluck('snippets', 'allSnippets'))
    );
  }

  private setSlugBasedSnippet(slug: string) {
    if (slug) {
      this.store.dispatch(new SetActiveSnippetWithSlug(slug));
    }
  }

  private getSnippetFolders() {
    return this.store.dispatch(new GetSnippetFolders()).pipe(
      switchMap(() =>
        this.store.dispatch(new SetActiveSnippetFolder(ALL_SNIPPETS_FOLDER))
      ),
      // Get snippet folders from state
      pluck('snippetFolders', 'snippetFolders')
    );
  }

  private updateSnippetsWhenActiveFolderChanges() {
    return this.activeFolder$.pipe(
      pluck('id'),
      switchMap((folderId) => this.store.dispatch(new GetSnippets(folderId)))
    );
  }

  private observeLayoutChanges() {
    this.subs.add(
      this.breakpointObserver
        .observe(['(min-width: 768px)'])
        .subscribe((result) => {
          this.isLargeScreenSubject.next(result.matches);
        })
    );
  }

  private updateSnippetsInIDB() {
    const sub = combineLatest([
      this.allSnippets$,
      this.allSnippetFolders$.pipe(take(1)),
    ])
      .pipe(
        switchMap(([snippets, folders]) =>
          this.syncService.syncItems(snippets, folders)
        )
      )
      .subscribe();
    this.subs.add(sub);
  }

  private updateSnippetFoldersInIDB() {
    const sub = this.allSnippetFolders$
      .pipe(
        filter((res) => res.length > 0),
        switchMap((folders) => this.syncService.syncFolders(folders))
      )
      .subscribe();
    this.subs.add(sub);
  }
}
