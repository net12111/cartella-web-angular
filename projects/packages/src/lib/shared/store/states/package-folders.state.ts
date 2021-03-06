import { Injectable } from '@angular/core';
import { BaseStorageService } from '@cartella/ui/services';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { ALL_PACKAGES_FOLDER } from '../../config/packages.config';
import { PackageFolder } from '../../interfaces/packages.interface';
import { PackagesService } from '../../services/packages.service';
import {
  AddPackageFolder,
  DeletePackageFolder,
  GetPackageFolders,
  SetActivePackageFolder,
  UpdatePackageFolder,
} from '../actions/package-folders.action';

export class PackageFolderStateModel {
  packageFolders: PackageFolder[] = [];
  fetched: boolean = false;
  activePackageFolder: PackageFolder | null = null;
}
@State({
  name: 'packageFolders',
  defaults: {
    packageFolders: [],
    fetched: false,
    activePackageFolder: null,
  },
})
@Injectable()
export class PackageFolderState {
  constructor(private packageService: PackagesService, private storage: BaseStorageService<PackageFolder>) {}

  @Selector()
  static getAllPackageFolders(state: PackageFolderStateModel) {
    return state.packageFolders;
  }

  @Selector()
  static getActivePackageFolder(state: PackageFolderStateModel) {
    return state.activePackageFolder;
  }

  @Action(GetPackageFolders)
  getPackageFolders({ getState, setState, patchState }: StateContext<PackageFolderStateModel>) {
    const state = getState();
    if (state.fetched) {
      return this.storage.getItem('packages').pipe(
        switchMap((packageFolders) => {
          if (!packageFolders) {
            return this.packageService.getFolders().pipe(
              map(({ payload }) => payload),
              tap((result) => {
                patchState({
                  packageFolders: result,
                });
              }),
            );
          } else {
            patchState({
              packageFolders,
            });
            return of(packageFolders);
          }
        }),
      );
    } else {
      return this.packageService.getFolders().pipe(
        map(({ payload }) => payload),
        tap((result) => {
          setState({
            ...state,
            packageFolders: result,
            fetched: true,
            activePackageFolder: ALL_PACKAGES_FOLDER,
          });
        }),
      );
    }
  }

  @Action(AddPackageFolder)
  addPackage({ getState, patchState }: StateContext<PackageFolderStateModel>, { payload }: AddPackageFolder) {
    return this.packageService.createNewFolder(payload).pipe(
      tap((result) => {
        const state = getState();
        patchState({
          packageFolders: [...state.packageFolders, result],
          activePackageFolder: result,
        });
      }),
    );
  }

  @Action(UpdatePackageFolder)
  updatePackage({ getState, setState }: StateContext<PackageFolderStateModel>, { payload, id }: UpdatePackageFolder) {
    return this.packageService.updateFolder(id, payload).pipe(
      tap((result) => {
        const state = getState();
        const foldersList = [...state.packageFolders];
        const folderIndex = foldersList.findIndex((item) => item.id === id);
        foldersList[folderIndex] = result;
        setState({
          ...state,
          packageFolders: foldersList,
        });
      }),
    );
  }

  @Action(DeletePackageFolder)
  deletePackage({ getState, setState }: StateContext<PackageFolderStateModel>, { id }: DeletePackageFolder) {
    return this.packageService.deleteFolder(id).pipe(
      tap(() => {
        const state = getState();
        const filteredArray = state.packageFolders.filter((item) => item.id !== id);
        setState({
          ...state,
          packageFolders: filteredArray,
        });
      }),
    );
  }

  @Action(SetActivePackageFolder, { cancelUncompleted: true })
  setSelectedPackage(
    { getState, setState }: StateContext<PackageFolderStateModel>,
    { payload }: SetActivePackageFolder,
  ) {
    const state = getState();
    setState({
      ...state,
      activePackageFolder: payload,
    });
  }
}
