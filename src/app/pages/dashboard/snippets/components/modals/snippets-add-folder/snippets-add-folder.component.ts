import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ToastService } from '@app/services/toast/toast.service';
import { DialogRef } from '@ngneat/dialog';
import { Store } from '@ngxs/store';
import { has } from 'lodash-es';
import { SubSink } from 'subsink';
import {
  SnippetFolder,
  SnippetFolderRequest,
} from '../../../shared/interfaces/snippets.interface';
import { SnippetsService } from '../../../shared/services/snippet/snippets.service';
import {
  AddSnippetFolder,
  DeleteSnippetFolder,
  UpdateSnippetFolder,
} from '../../../store/actions/snippets-folders.action';

@Component({
  selector: 'app-snippets-add-folder',
  templateUrl: './snippets-add-folder.component.html',
  styleUrls: ['./snippets-add-folder.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnippetsAddFolderComponent
  implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('folderNameRef') folderNameRef: ElementRef;
  folderName = new FormControl('', [Validators.required]);

  private subs = new SubSink();
  constructor(
    public ref: DialogRef,
    private toaster: ToastService,
    private store: Store,
    private snippetService: SnippetsService
  ) {}

  ngOnInit(): void {
    if (this.ref?.data) {
      const { folder } = this.ref.data;
      this.folderName.setValue(folder?.name);
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  ngAfterViewInit() {
    if (this.folderNameRef) {
      this.folderNameRef?.nativeElement?.focus();
    }
  }

  createOrUpdateFolder(folder: SnippetFolderRequest) {
    if (folder) {
      this.updateFolder(folder);
    } else {
      this.createFolder();
    }
  }

  async updateFolder(folder: Partial<SnippetFolder>) {
    try {
      this.store.dispatch(
        new UpdateSnippetFolder(folder.id, {
          name: this.folderName.value,
          metadata: {},
          private: true,
          share: {},
        })
      );
    } catch (error) {
      this.toaster.showErrorToast('Failed to update folder');
    }
  }

  async createFolder() {
    this.store
      .dispatch(
        new AddSnippetFolder({
          name: this.folderName.value,
          metadata: {},
          private: true,
          share: {},
        })
      )
      .subscribe(
        () => {
          this.ref.close();
        },
        (err) => {
          if (has(err, 'error.message')) {
            this.toaster.showErrorToast(err.error.message);
          } else {
            this.toaster.showErrorToast('Folder was not created!');
          }
        }
      );
  }

  async deleteFolder(folder: SnippetFolder) {
    this.store.dispatch(new DeleteSnippetFolder(folder.id)).subscribe(
      () => {
        this.toaster.showSuccessToast('Folder deleted successfully!');
        this.ref.close();
      },
      (err) => {
        if (has(err, 'error.message')) {
          this.toaster.showErrorToast(err.error.message);
        } else {
          this.toaster.showErrorToast('Folder was not deleted!');
        }
      }
    );
  }

  close() {
    this.ref.close();
  }
}
