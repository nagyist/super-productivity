import { AppDataComplete } from '../../imex/sync/sync.model';

export type AllowedDBKeys = keyof AppDataComplete | 'SUP_COMPLETE_BACKUP';

// INDEXEDDB
export enum DB {
  BACKUP = 'SUP_COMPLETE_BACKUP',
  LOCAL_NON_SYNC = 'LOCAL_NON_SYNC',
  LOCAL_LAST_SYNC_MODEL_CHANGE = 'LOCAL_LAST_SYNC_MODEL_CHANGE',
  LOCAL_LAST_ARCHIVE_CHANGE = 'LOCAL_LAST_ARCHIVE_CHANGE',
  // and lots of non hard-coded AppDataComplete keys
}

// REAL LS
export enum LS {
  LAST_LOCAL_SYNC_MODEL_CHANGE = 'SUP_LAST_LOCAL_SYNC_MODEL_CHANGE',
  LOCAL_UI_HELPER = 'SUP_UI_HELPER',

  ACTION_LOG = 'SUP_ACTION_LOG',
  ACTION_BEFORE_LAST_ERROR_LOG = 'SUP_LAST_ERROR_ACTION_LOG',
  CHECK_STRAY_PERSISTENCE_BACKUP = 'SUP_CHECK_STRAY_PERSISTENCE_BACKUP',
  IS_PROJECT_LIST_EXPANDED = 'SUP_IS_PROJECT_LIST_EXPANDED',
  IS_TAG_LIST_EXPANDED = 'SUP_IS_TAG_LIST_EXPANDED',

  WAS_SCHEDULE_INITIAL_DIALOG_SHOWN = 'SUP_WAS_SCHEDULE_INITIAL_DIALOG_SHOWN',

  CAL_EVENTS_CACHE = 'SUP_CAL_EVENTS_CACHE',
  CALENDER_EVENTS_SKIPPED_TODAY = 'SUP_CALENDER_EVENTS_SKIPPED_TODAY',
  CALENDER_EVENTS_LAST_SKIP_DAY = 'SUP_CALENDER_EVENTS_LAST_SKIP_DAY',

  IS_SHOW_TOUR = 'SUP_IS_SHOW_TOUR',

  LAST_FULLSCREEN_EDIT_VIEW_MODE = 'SUP_LAST_FULLSCREEN_EDIT_VIEW_MODE',

  WEB_APP_INSTALL = 'WEB_APP_INSTALL',

  IS_ADD_TO_BOTTOM = 'SUP_IS_ADD_TO_BOTTOM',

  FOCUS_MODE_MODE = 'FOCUS_MODE_MODE',
}

// SESSION STORAGE
export enum SS {
  NOTE_TMP = 'NOTE_TMP_EDIT',
  PROJECT_TMP = 'PROJECT_TMP_EDIT',
  JIRA_WONKY_COOKIE = 'JIRA_WONKY_COOKIE',
  TODO_TMP = 'TODO_TMP_EDIT',
}

// LEGACY KEYS
export const DB_LEGACY_PROJECT_PREFIX = 'SUP_P_';
