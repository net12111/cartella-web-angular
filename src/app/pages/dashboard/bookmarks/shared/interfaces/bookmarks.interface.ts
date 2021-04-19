import {
  FolderBaseRequest,
  FolderBaseResponse,
} from '@app/interfaces/folder.interface';
import { ModalOperationType } from '@app/interfaces/general.interface';
import { SharedWith } from '@app/interfaces/share.interface';

export type BookmarkFolderRequest = FolderBaseRequest;
export type BookmarkFolder = FolderBaseResponse;

export interface BookmarkBase {
  name: string;
  url: string;
  image: string | null;
  description: string | null;
  private: boolean;
  metadata: any;
  site?: string;
  favicon?: string;
  favorite: boolean;
  domain: string | null;
}

export interface BookmarkRequest extends BookmarkBase {
  tags?: string[];
  folderId: string;
}

export interface Bookmark extends BookmarkBase {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  tags: any[];
  folder: BookmarkResponseFolder;
  owner: BookmarkResponseOwner;
  share: SharedWith[];
}

export interface BookmarkResponseFolder {
  id: string;
  name: string;
}

export interface BookmarkResponseOwner {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
}

export interface BookmarkMetaData {
  title: string;
  image: string;
  description: string;
  twitter?: string;
  favicon?: string;
  domain?: string;
  site?: string;
}

export enum BookmarkCardEventType {
  favorite,
  edit,
  delete,
  share,
  move,
}
export interface BookmarkCardEvent {
  type: BookmarkCardEventType;
  bookmark: Bookmark;
}

export interface BookmarkAddModalPayload {
  folder: BookmarkFolder;
  bookmark?: Bookmark;
  allFolders?: BookmarkFolder[];
  type: ModalOperationType;
}

export interface BookmarkFolderAddModalPayload {
  folder?: BookmarkFolder;
  type: ModalOperationType;
}
