import { GlobalConfigState } from './global-config.model';

const minute = 60 * 1000;
export const DEFAULT_GLOBAL_CONFIG: GlobalConfigState = {
  lang: {
    lng: null
  },
  misc: {
    isDarkMode: true,
    isConfirmBeforeExit: false,
    isNotifyWhenTimeEstimateExceeded: false,
    isAutMarkParentAsDone: false,
    isAutoStartNextTask: true,
    isTurnOffMarkdown: false,
    isAutoAddWorkedOnToToday: false,
    isDisableInitialDialog: false,
    defaultProjectId: null,
    firstDayOfWeek: 0,
  },
  evaluation: {
    isHideEvaluationSheet: false,
  },
  idle: {
    isOnlyOpenIdleWhenCurrentTask: false,
    isEnableIdleTimeTracking: true,
    minIdleTime: 5 * minute,
    isUnTrackedIdleResetsBreakTimer: true,
  },
  takeABreak: {
    isTakeABreakEnabled: false,
    isLockScreen: false,
    isFocusWindow: false,
    /* tslint:disable-next-line */
    takeABreakMessage: 'Take a break! You have been working for ${duration} without one. Go away from the computer! Take a short walk! Makes you more productive in the long run!',
    takeABreakMinWorkingTime: 60 * minute,
    motivationalImg: null,
  },
  pomodoro: {
    isEnabled: false,
    duration: 25 * minute,
    breakDuration: 5 * minute,
    longerBreakDuration: 15 * minute,
    cyclesBeforeLongerBreak: 4,
    isStopTrackingOnBreak: true,
    isStopTrackingOnLongBreak: true,
    isManualContinue: false,
    isPlaySound: true,
    isPlaySoundAfterBreak: false,
    // isGoToWorkView: false,
    isPlayTick: false,
  },
  keyboard: {
    globalShowHide: 'Ctrl+Shift+X',
    globalToggleTaskStart: null,
    globalAddNote: null,
    globalAddTask: null,
    addNewTask: 'Shift+A',
    addNewNote: 'n',
    openProjectNotes: 'Shift+N',
    openDistractionPanel: 'Shift+D',
    showHelp: '?',
    toggleBookmarks: 'Shift+V',
    toggleBacklog: 'b',
    goToWorkView: 'w',
    // goToDailyAgenda: null,
    // goToFocusMode: 'Shift+F',
    goToSettings: null,
    zoomIn: 'Ctrl++',
    zoomOut: 'Ctrl+-',
    zoomDefault: 'Ctrl+0',
    taskEditTitle: 'e',
    taskToggleAdditionalInfoOpen: 'i',
    taskOpenEstimationDialog: 't',
    taskSchedule: 's',
    taskToggleDone: 'd',
    taskAddSubTask: 'a',
    taskDelete: 'Delete',
    taskMoveToProject: null,
    selectPreviousTask: 'k',
    selectNextTask: 'j',
    moveTaskUp: 'Ctrl+Shift+ArrowUp',
    moveTaskDown: 'Ctrl+Shift+ArrowDown',
    moveToBacklog: 'Shift+B',
    moveToTodaysTasks: 'Shift+T',
    expandSubTasks: null,
    collapseSubTasks: null,
    togglePlay: 'y',
  },
  localBackup: {
    isEnabled: true,
  },
  sound: {
    volume: 75,
    isPlayDoneSound: true,
    isIncreaseDoneSoundPitch: true,
    doneSound: 'done2.mp3',
  },
  trackingReminder: {
    isEnabled: true,
    isShowOnMobile: false,
    minTime: minute * 2,
  },

  sync: {
    isEnabled: false,
    syncProvider: null,
    syncInterval: minute,
  },
  dropboxSync: {
    // TODO remove / migrate
    isEnabled: false,
    syncInterval: minute,

    authCode: null,
    accessToken: null,
    _backupDocId: null,
    // isCompressData: true,
  },
  googleDriveSync: {
    // TODO remove / migrate
    isEnabled: false,
    isAutoSyncToRemote: false,
    isNotifyOnSync: false,
    isLoadRemoteDataOnStartup: false,
    syncInterval: minute * 5,

    isAutoLogin: false,
    isCompressData: true,
    syncFileName: 'SUPER_PRODUCTIVITY_SYNC.json',
    _backupDocId: null,
  },
};
