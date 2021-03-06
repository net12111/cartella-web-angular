import {
  EntityFolder,
  EntityGeneral,
  EntityOwner,
  EntityShare,
} from '@cartella/interfaces/entity.interface';
import {
  FolderBaseRequest,
  FolderBaseResponse,
} from '@cartella/interfaces/folder.interface';
import { ModalOperationType } from '@cartella/interfaces/general.interface';
import { PackageLinks, packageScore } from './package-details.interface';

export type PackageFolderRequest = FolderBaseRequest;
export type PackageFolder = FolderBaseResponse;

export interface PackageBase {
  name: string;
  image: string;
  description: string;
  metadata: any;
  repo: any;
  private: boolean;
  favorite: boolean;
}

export interface PackageRequest extends PackageBase {
  tags?: string[];
  folderId: string;
}

export interface Package
  extends PackageBase,
    EntityGeneral,
    EntityShare,
    EntityOwner,
    EntityFolder {
  tags: any[];
}

export interface PackageAddModalPayload {
  folder: PackageFolder;
  bookmark?: Package;
  allFolders?: PackageFolder[];
  type: ModalOperationType;
}

export interface PackageFolderAddModalPayload {
  folder?: PackageFolder;
  type: ModalOperationType;
}

export interface PackageMetaData {
  name: string;
  version: string;
  image: string;
  description: string;
  links: PackageLinks;
  license: string;
  github: {
    starsCount: number;
    issues: {
      total: number;
      open: number;
    };
  };
  npm: {
    downloadsCount: number;
  };
  score: packageScore;
}

export interface PackageCardEvent {
  type: PackageCardEventType;
  package: Package;
}

export enum PackageCardEventType {
  favorite,
  edit,
  delete,
  share,
  move,
}
