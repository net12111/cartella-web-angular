import { Inject, Injectable } from '@angular/core';
import {
  Bookmark,
  BookmarkFolder,
} from '@cartella/bookmarks/shared/interfaces/bookmarks.interface';
import { FeatureType } from '@cartella/interfaces/general.interface';
import {
  Package,
  PackageFolder,
} from '@cartella/packages/shared/interfaces/packages.interface';
import {
  Snippet,
  SnippetFolder,
} from '@cartella/snippets/shared/interfaces/snippets.interface';
import { FEATURE_TOKEN } from '@cartella/tokens/feature.token';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, mapTo } from 'rxjs/operators';
import { FolderAssortService } from '../folder-assort/folder-assort.service';
import { BaseStorageService } from '../storage/base-storage.service';
import { StorageFolders } from '../storage/storage.interface';

type Items = Bookmark | Snippet | Package;
type Folders = BookmarkFolder | SnippetFolder | PackageFolder;
type Entities = 'bookmarks' | 'snippets' | 'packages';

const IDB_FOLDER_NAMES = {
  [FeatureType.bookmark]: 'bookmarks',
  [FeatureType.snippet]: 'snippets',
  [FeatureType.package]: 'packages',
};

const IDB_COLLECTION_NAMES = {
  [FeatureType.bookmark]: StorageFolders.bookmarks,
  [FeatureType.snippet]: StorageFolders.snippets,
  [FeatureType.package]: StorageFolders.packages,
};

@Injectable()
export class IDBSyncService {
  constructor(
    private folderAssort: FolderAssortService,
    private storage: BaseStorageService,
    @Inject(FEATURE_TOKEN) private feature: FeatureType
  ) {}

  private get collectionName() {
    return IDB_COLLECTION_NAMES[this.feature];
  }

  private get folderName() {
    return IDB_FOLDER_NAMES[this.feature];
  }

  syncItems(items: Items[], folders: Folders[]): Observable<boolean> {
    if (items != null && folders != null) {
      const { own, shared, starred } = this.folderAssort.assort(items);
      const itemsGroupedByFolders = this.groupItemsInFolders(folders, own);
      return forkJoin([
        this.syncStarredItems(starred),
        this.syncSharedItems(shared),
        this.syncOwnItems(itemsGroupedByFolders),
      ]).pipe(
        mapTo(true),
        catchError((err) => {
          console.error(err);
          return of(false);
        })
      );
    }
    return of(false);
  }

  syncFolders(folders: Folders[]) {
    return this.storage.setItem('folders', folders).pipe(
      mapTo(true),
      catchError((err) => {
        console.error('Save Bookmark Folders', err);
        return of(false);
      })
    );
  }

  private syncOwnItems(itemsGroupedIntoFolders: { [key: string]: Items[] }) {
    const folders = Object.keys(itemsGroupedIntoFolders);
    if (folders?.length > 0) {
      const setOps$ = folders.map((key) =>
        this.storage.setItem(key, itemsGroupedIntoFolders[key])
      );
      return forkJoin(setOps$).pipe(
        mapTo(true),
        catchError((err) => {
          console.error('Save Bookmark Folders', err);
          return of(false);
        })
      );
    }
    return of(false);
  }

  private syncSharedItems(items: Items[]) {
    return this.storage.setItem('shared', items).pipe(
      mapTo(true),
      catchError((err) => {
        console.error('Save Starred Bookmarks', err);
        return of(false);
      })
    );
  }
  private syncStarredItems(items: Items[]) {
    return this.storage.setItem('starred', items).pipe(
      mapTo(true),
      catchError((err) => {
        console.error('Save Starred Bookmarks', err);
        return of(false);
      })
    );
  }

  /**
   * Group Items based on the folder
   *
   * ```json
   * 'id': [{
   *    '1234656267': []
   *  },{
   * '  83736372': []
   * }]
   * ```
   */
  private groupItemsInFolders = (folders: Folders[], items: Items[]) => {
    if (folders != null && folders?.length > 0) {
      return folders.reduce(
        (acc, { id }) => ({
          ...acc,
          [id]:
            items?.length > 0
              ? items.filter(({ folder: { id: folderId } }) => folderId === id)
              : [],
        }),
        {}
      );
    }
    return [];
  };
}
