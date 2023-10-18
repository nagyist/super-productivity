import { createReducer, on } from '@ngrx/store';
import * as FocusModeActions from './focus-mode.actions';
import { FocusModePage } from '../focus-mode.const';

const DEFAULT_FOCUS_SESSION_DURATION = 25 * 60 * 1000;
export const FOCUS_MODE_FEATURE_KEY = 'focusMode';

export interface State {
  isFocusOverlayShown: boolean;
  isFocusSessionRunning: boolean;
  focusSessionDuration: number;
  focusSessionTimeToGo: number;
  focusSessionActivePage: FocusModePage;
}

export const initialState: State = {
  isFocusOverlayShown: false,
  isFocusSessionRunning: false,
  focusSessionDuration: DEFAULT_FOCUS_SESSION_DURATION,
  focusSessionTimeToGo: 0,
  focusSessionActivePage: FocusModePage.TaskSelection,
};

export const focusModeReducer = createReducer<State>(
  initialState,

  on(
    FocusModeActions.setFocusSessionActivePage,
    (state, { focusActivePage: focusSessionActivePage }) => ({
      ...state,
      focusSessionActivePage,
    }),
  ),
  on(FocusModeActions.setFocusSessionDuration, (state, { focusSessionDuration }) => ({
    ...state,
    focusSessionDuration,
  })),

  on(FocusModeActions.setFocusSessionTimeToGo, (state, { focusSessionTimeToGo }) => ({
    ...state,
    focusSessionTimeToGo,
  })),

  on(FocusModeActions.startFocusSession, (state) => ({
    ...state,
    isFocusSessionRunning: true,
    focusSessionTimeToGo: 0,
    focusSessionActivePage: FocusModePage.Main,
    focusSessionDuration:
      state.focusSessionDuration > 0
        ? state.focusSessionDuration
        : DEFAULT_FOCUS_SESSION_DURATION,
  })),
  on(FocusModeActions.focusSessionDone, (state) => ({
    ...state,
    isFocusSessionRunning: false,
    focusSessionDuration: state.focusSessionTimeToGo,
    focusSessionTimeToGo: 0,
    focusSessionActivePage: FocusModePage.TaskDone,
  })),

  on(FocusModeActions.showFocusOverlay, (state) => ({
    ...state,
    isFocusOverlayShown: true,
    isFocusSessionRunning: false,
  })),
  on(FocusModeActions.hideFocusOverlay, (state) => ({
    ...state,
    isFocusOverlayShown: false,
    isFocusSessionRunning: false,
  })),
  on(FocusModeActions.cancelFocusSession, (state) => ({
    ...state,
    isFocusOverlayShown: false,
    isFocusSessionRunning: false,
    focusSessionDuration: DEFAULT_FOCUS_SESSION_DURATION,
  })),
);
