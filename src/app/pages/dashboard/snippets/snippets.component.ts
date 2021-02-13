import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ALL_SNIPPETS_FOLDER } from '@app/config/snippets.config';
import { Technology } from '@app/interfaces/technology.interface';
import { User } from '@app/interfaces/user.interface';
import { TechnologyState } from '@app/store/states/technology.state';
import { DialogService } from '@ngneat/dialog';
import { Select, Store } from '@ngxs/store';
import { BehaviorSubject, Observable } from 'rxjs';
import { SubSink } from 'subsink';
import { SnippetsAddFolderComponent } from './components/modals/snippets-add-folder/snippets-add-folder.component';
import { Snippet, SnippetFolder } from './interfaces/snippets.interface';
import { CodeEditorService } from './services/code-editor/code-editor.service';
import {
  GetSnippetFolders,
  SetActiveSnippetFolder,
} from './store/actions/snippets-folders.action';
import { GetSnippets, SetActiveSnippet } from './store/actions/snippets.action';
import { SnippetFolderState } from './store/states/snippet-folders.state';
import { SnippetState } from './store/states/snippets.state';
@Component({
  selector: 'app-snippets',
  templateUrl: './snippets.component.html',
  styleUrls: ['./snippets.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnippetsComponent implements OnInit, OnDestroy {
  private subs = new SubSink();

  user: User;

  @Select(SnippetState.getAllSnippets)
  allSnippets$: Observable<Snippet[]>;

  @Select(SnippetState.getSnippetsShown)
  snippetsShown$: Observable<Snippet[]>;

  @Select(SnippetState.getActiveSnippet)
  activeSnippet$: Observable<Snippet>;

  @Select(SnippetFolderState.getSnippetFoldersList)
  folders$: Observable<SnippetFolder[]>;

  @Select(SnippetFolderState.getActiveSnippetFolder)
  activeFolder$: Observable<SnippetFolder>;

  @Select(TechnologyState.getTechnologiesList)
  technologies$: Observable<Technology[]>;

  @Select(SnippetState.getSnippetFetched)
  snippetsFetched$: Observable<boolean>;

  @Select(SnippetFolderState.getSnippetFolderFetched)
  snippetFolderFetched$: Observable<boolean>;

  private snippetFolderLoadingSubject = new BehaviorSubject(false);
  snippetFolderLoading$ = this.snippetFolderLoadingSubject.pipe();

  private snippetLoadingSubject = new BehaviorSubject(false);
  snippetLoading$ = this.snippetLoadingSubject.pipe();

  constructor(
    private editorService: CodeEditorService,
    private activatedRoute: ActivatedRoute,
    private store: Store,
    private dialog: DialogService
  ) {}

  ngOnInit(): void {
    this.getSnippetFolders();
    this.getSnippets();
  }
  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  get snippetSlug() {
    return this.activatedRoute.snapshot.paramMap.get('slug');
  }

  handleSelectFolder(folder: SnippetFolder) {
    if (folder) {
      this.snippetLoadingSubject.next(true);
      this.store.dispatch(new SetActiveSnippetFolder(folder));
      this.store.dispatch(new SetActiveSnippet(null));
      const sub = this.store.dispatch(new GetSnippets(folder.id)).subscribe(
        () => {
          this.snippetLoadingSubject.next(false);
        },
        () => {
          this.snippetLoadingSubject.next(false);
        }
      );
      this.subs.add(sub);
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

  handleCreateFolder() {
    this.dialog.open(SnippetsAddFolderComponent, {
      size: 'sm',
      enableClose: false,
      data: {
        type: 'CREATE',
      },
    });
  }

  private getSnippets() {
    this.snippetLoadingSubject.next(true);
    const folderState = this.store.selectSnapshot(
      (state) => state.snippetFolders
    );
    this.store
      .dispatch(new GetSnippets(folderState?.activeSnippetFolder?.id))
      .subscribe(
        () => {
          this.snippetLoadingSubject.next(false);
        },
        () => {
          this.snippetLoadingSubject.next(false);
        }
      );
  }
  private getSnippetFolders() {
    this.snippetFolderLoadingSubject.next(true);
    const sub = this.store.dispatch(new GetSnippetFolders()).subscribe(
      () => {
        this.snippetFolderLoadingSubject.next(false);
      },
      () => {
        this.snippetFolderLoadingSubject.next(false);
      }
    );
    this.subs.add(sub);
    this.store.dispatch(new SetActiveSnippetFolder(ALL_SNIPPETS_FOLDER));
  }
}
