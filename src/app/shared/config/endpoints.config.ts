export const AUTH_ENDPOINTS = {
  login: 'auth/login',
  signup: 'users/signup',
  loginWithGoogle: 'auth/google',
  loginWithGithub: 'auth/github',
  updateMethod: 'auth/methods',
};

export const CARTELLA_ENDPOINTS = {
  config: 'config',
  bff: 'bff',
  tags: 'tags',
  technology: 'technology',
  users: 'users',
  snippets: 'snippets',
  snippetFolders: 'snippet-folders',
  bookmarks: 'bookmarks',
  bookmarkFolders: 'bookmark-folders',
  packages: 'packages',
  packagesMeta: 'packages-meta',
  packageFolders: 'package-folders',
  metaExtractor: 'metadata',
};

export const EXTERNAL_ENDPOINTS = {
  packageSuggestions: 'https://api.npms.io/v2/search/suggestions',
};
