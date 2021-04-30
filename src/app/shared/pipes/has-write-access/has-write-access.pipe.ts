import { Pipe, PipeTransform } from '@angular/core';
import { Bookmark } from '@cartella/bookmarks';
import { Access } from '@cartella/interfaces/share.interface';
import { Package } from '@cartella/packages';
import { Snippet } from '@cartella/snippets';
import { UserState } from '@cartella/store/states/user.state';
import { Store } from '@ngxs/store';

@Pipe({
  name: 'hasWriteAccess',
})
export class HasWriteAccessPipe implements PipeTransform {
  constructor(private store: Store) {}
  /**
   * Checks whether the current logged in user is the owner of the
   * entity
   *
   * @param owner - owner of the item
   * @returns whether the logged in user is the owner or not
   */
  transform(entity: Bookmark | Snippet | Package): boolean {
    const currentUser = this.store.selectSnapshot(UserState.getLoggedInUser);
    if (entity && entity.owner != null && currentUser != null) {
      if (entity.owner.id === currentUser.id) {
        return true;
      }
      return entity.share.find(({ email }) => email === currentUser.email).access === Access.write;
    }
    return false;
  }
}
