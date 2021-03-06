import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Tag } from '@cartella/interfaces/tag.interface';
import { TagState } from '@cartella/store/states/tag.state';
import { ToastService, WithDestroy } from '@cartella/ui/services';
import { DialogRef } from '@ngneat/dialog';
import { TippyInstance } from '@ngneat/helipopper';
import { Select, Store } from '@ngxs/store';
import { has } from 'lodash-es';
import { BehaviorSubject, combineLatest, fromEvent, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { PackageSuggestions } from '../../../shared/interfaces/package-details.interface';
import { PackageAddModalPayload, PackageRequest } from '../../../shared/interfaces/packages.interface';
import { PackagesService } from '../../../shared/services/packages.service';
import { AddPackage } from '../../../shared/store/actions/package.action';

@Component({
  selector: 'app-packages-add',
  templateUrl: './packages-add.component.html',
  styleUrls: ['./packages-add.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PackagesAddComponent extends WithDestroy implements OnInit, AfterViewInit {
  packageName = new FormControl('');
  tagSearchInput = new FormControl([]);

  tagsSelected = new Set<Tag>();

  @ViewChild('packageNameRef') packageNameInputRef: TippyInstance | null = null;
  @ViewChild('tagNameRef') tagNameInputRef: TippyInstance | null = null;

  private tagSuggestionLoadingSubject = new BehaviorSubject<boolean>(false);
  tagSuggestionsLoading$ = this.tagSuggestionLoadingSubject.pipe();

  private searchSuggestionLoadingSubject = new BehaviorSubject<boolean>(false);
  searchSuggestionsLoading$ = this.searchSuggestionLoadingSubject.pipe();

  private savingSubject = new BehaviorSubject<boolean>(false);
  saving$ = this.savingSubject.pipe();

  private searchSuggestionSubject = new BehaviorSubject<PackageSuggestions[]>([]);
  searchSuggestions$ = this.searchSuggestionSubject.pipe();

  private tagSuggestionSubject = new BehaviorSubject<Tag[]>([]);
  tagSuggestions$ = this.tagSuggestionSubject.pipe();

  @Select(TagState.getTagsList)
  tags$!: Observable<Tag[]>;

  constructor(
    public ref: DialogRef<PackageAddModalPayload>,
    private packageService: PackagesService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
    private store: Store,
  ) {
    super();
  }

  ngOnInit(): void {}

  ngAfterViewInit() {
    this.listenToPackageNameInput();
    this.listenToTagsInput();
  }

  selectPackageFromSuggestion(selection: PackageSuggestions) {
    this.packageName.setValue(selection.name);
  }

  addTag(selection: Tag) {
    this.tagsSelected.add(selection);
    this.cdr.detectChanges();
    this.tagSearchInput.setValue('');
    if (this.tagNameInputRef) {
      const inputRef = (this.tagNameInputRef as any).host.nativeElement;
      inputRef.focus();
    }
  }

  addPackage() {
    const packageName = this.packageName.value;
    this.savingSubject.next(true);
    combineLatest([
      this.packageService.getPackageDetails(packageName),
      this.packageService.getPackageBundleDetails(packageName),
    ])
      .pipe(
        switchMap(([details, bundle]) => {
          const { name, description, github, license, links, image, npm, score, version } = details;
          const packageData: PackageRequest = {
            name,
            description,
            image,
            favorite: false,
            folderId: this.ref.data.folder.id,
            private: true,
            metadata: {
              license,
              links,
              bundle,
              npm,
              score,
              version,
            },
            repo: {
              url: links.repository,
              ...github,
            },
            tags: [...this.tagsSelected].map(({ id }) => id),
          };
          this.savingSubject.next(false);
          return this.store.dispatch(new AddPackage(packageData));
        }),
      )
      .subscribe(
        () => {
          this.ref.close();
        },
        (err) => {
          let message = 'Something went wrong!';
          if (has(err, 'error')) {
            message = err.error.message;
          }
          this.toast.showErrorToast(message);
          this.savingSubject.next(false);
        },
      );
  }

  removeTag(selection: Tag) {
    this.tagsSelected.delete(selection);
  }

  private listenToPackageNameInput() {
    if (this.packageNameInputRef) {
      const inputRef = (this.packageNameInputRef as any).host.nativeElement;
      inputRef.focus();
      const sub = fromEvent(inputRef, 'keyup')
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          tap(() => this.searchSuggestionLoadingSubject.next(true)),
          map(() => inputRef.value),
          switchMap((name) => {
            if (name) {
              return this.packageService.getPackageSuggestions(name);
            } else {
              return of([]);
            }
          }),
          tap((suggestions) => {
            this.packageNameInputRef?.show();
            this.searchSuggestionSubject.next(suggestions);
          }),
        )
        .subscribe(() => {
          this.searchSuggestionLoadingSubject.next(false);
        });
      this.subs.add(sub);
    }
  }

  private listenToTagsInput() {
    if (this.tagNameInputRef) {
      const inputRef = (this.tagNameInputRef as any).host.nativeElement;
      const sub = fromEvent(inputRef, 'keyup')
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          tap(() => this.searchSuggestionLoadingSubject.next(true)),
          map(() => inputRef.value),
          switchMap((name) => {
            if (name) {
              return this.filterOutTagNames(name);
            } else {
              return of([]);
            }
          }),
          tap((tags) => {
            this.tagNameInputRef?.show();
            this.tagSuggestionSubject.next(tags);
          }),
        )
        .subscribe(() => {
          this.searchSuggestionLoadingSubject.next(false);
        });
      this.subs.add(sub);
    }
  }

  private filterOutTagNames(query: string) {
    return this.tags$
      ? this.tags$.pipe(map((tags) => tags.filter(({ name }) => name.toLowerCase().includes(query.toLowerCase()))))
      : of([]);
  }
}
