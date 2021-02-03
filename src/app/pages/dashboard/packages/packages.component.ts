import { Component, OnDestroy, OnInit } from '@angular/core';
import { User } from '@app/interfaces/user.interface';
import { AuthService } from '@app/services/auth/auth.service';
import { DialogService } from '@ngneat/dialog';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { SubSink } from 'subsink';
import { PackagesAddFolderComponent } from './components/modals/packages-add-folder/packages-add-folder.component';
import { ALL_PACKAGES_FOLDER } from './shared/config/packages.config';
import { Package, PackageFolder } from './shared/interfaces/packages.interface';
import {
  GetPackageFolders,
  SetActivePackageFolder,
} from './store/actions/package-folders.action';
import { GetPackages } from './store/actions/package.action';
import { PackageFolderState } from './store/states/package-folders.state';
import { PackageState } from './store/states/package.state';

@Component({
  selector: 'app-packages',
  templateUrl: './packages.component.html',
  styleUrls: ['./packages.component.scss'],
})
export class PackagesComponent implements OnInit, OnDestroy {
  user: User;

  @Select(PackageState.getAllPackages)
  allPackages$: Observable<Package[]>;

  @Select(PackageState.getPackagesShown)
  packagesShown$: Observable<Package[]>;

  @Select(PackageState.getActivePackage)
  activePackage$: Observable<Package>;

  @Select(PackageFolderState.getPackageFoldersList)
  folders$: Observable<PackageFolder[]>;

  @Select(PackageFolderState.getActivePackageFolder)
  activeFolder$: Observable<PackageFolder>;

  private subs = new SubSink();
  constructor(
    private store: Store,
    private auth: AuthService,
    private dialog: DialogService
  ) {}

  ngOnInit(): void {
    this.getPackageFolders();
    this.getPackages();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  handleSelectFolder(folder: PackageFolder) {
    if (folder) {
      this.store.dispatch(new SetActivePackageFolder(folder));
      this.store.dispatch(new GetPackages(folder.id));
    }
  }

  handleEditFolder(folder: PackageFolder) {
    this.dialog.open(PackagesAddFolderComponent, {
      size: 'sm',
      data: {
        folder,
        owner: this.auth.user,
      },
      enableClose: false,
    });
  }
  handleCreateFolder() {
    this.dialog.open(PackagesAddFolderComponent, {
      size: 'sm',
      data: {
        owner: this.auth.user,
      },
      enableClose: false,
    });
  }

  private getPackages() {
    this.store.dispatch(new GetPackages(ALL_PACKAGES_FOLDER.id));
  }
  private getPackageFolders() {
    this.store.dispatch(new GetPackageFolders());
    this.store.dispatch(new SetActivePackageFolder(ALL_PACKAGES_FOLDER));
  }
}
