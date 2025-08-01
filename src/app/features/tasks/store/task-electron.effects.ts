import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { setCurrentTask, unsetCurrentTask } from './task.actions';
import { select, Store } from '@ngrx/store';
import { filter, startWith, take, tap, withLatestFrom } from 'rxjs/operators';
import { selectCurrentTask } from './task.selectors';
import { GlobalConfigService } from '../../config/global-config.service';
import { selectIsFocusOverlayShown } from '../../focus-mode/store/focus-mode.selectors';
import { PomodoroService } from '../../pomodoro/pomodoro.service';
import { TimeTrackingActions } from '../../time-tracking/store/time-tracking.actions';
import { FocusModeService } from '../../focus-mode/focus-mode.service';
import {
  cancelFocusSession,
  focusSessionDone,
  hideFocusOverlay,
  pauseFocusSession,
  showFocusOverlay,
  startFocusSession,
  unPauseFocusSession,
} from '../../focus-mode/store/focus-mode.actions';
import { IPC } from '../../../../../electron/shared-with-frontend/ipc-events.const';
import { ipcAddTaskFromAppUri$ } from '../../../core/ipc-events';
import { TaskService } from '../task.service';

// TODO send message to electron when current task changes here

@Injectable()
export class TaskElectronEffects {
  private _actions$ = inject(Actions);
  private _store$ = inject<Store<any>>(Store);
  private _configService = inject(GlobalConfigService);
  private _pomodoroService = inject(PomodoroService);
  private _focusModeService = inject(FocusModeService);
  private _taskService = inject(TaskService);

  // -----------------------------------------------------------------------------------
  // NOTE: IS_ELECTRON checks not necessary, since we check before importing this module
  // -----------------------------------------------------------------------------------

  constructor() {
    // Listen for overlay request and send current task state
    window.ea.on(IPC.REQUEST_CURRENT_TASK_FOR_OVERLAY, () => {
      this._store$
        .pipe(
          select(selectCurrentTask),
          withLatestFrom(
            this._pomodoroService.isEnabled$,
            this._pomodoroService.currentSessionTime$,
            this._store$.pipe(select(selectIsFocusOverlayShown)),
            this._focusModeService.currentSessionTime$,
          ),
          // Only take the first value and complete
          take(1),
        )
        .subscribe(
          ([
            current,
            isPomodoroEnabled,
            currentPomodoroSessionTime,
            isFocusModeEnabled,
            currentFocusSessionTime,
          ]) => {
            window.ea.updateCurrentTask(
              current,
              isPomodoroEnabled,
              currentPomodoroSessionTime,
              isFocusModeEnabled,
              currentFocusSessionTime,
            );
          },
        );
    });
  }

  taskChangeElectron$: any = createEffect(
    () =>
      this._actions$.pipe(
        ofType(
          setCurrentTask,
          unsetCurrentTask,
          TimeTrackingActions.addTimeSpent,
          showFocusOverlay,
          hideFocusOverlay,
          startFocusSession,
          cancelFocusSession,
          pauseFocusSession,
          unPauseFocusSession,
          focusSessionDone,
        ),

        withLatestFrom(
          this._store$.pipe(select(selectCurrentTask)),
          this._pomodoroService.isEnabled$,
          this._pomodoroService.currentSessionTime$,
          this._store$.pipe(select(selectIsFocusOverlayShown)),
          this._focusModeService.currentSessionTime$.pipe(startWith(0)),
        ),
        tap(
          ([
            action,
            current,
            isPomodoroEnabled,
            currentPomodoroSessionTime,
            isFocusModeEnabled,
            currentFocusSessionTime,
          ]) => {
            window.ea.updateCurrentTask(
              current,
              isPomodoroEnabled,
              currentPomodoroSessionTime,
              isFocusModeEnabled,
              currentFocusSessionTime,
            );
          },
        ),
      ),
    { dispatch: false },
  );

  setTaskBarNoProgress$ = createEffect(
    () =>
      this._actions$.pipe(
        ofType(setCurrentTask),
        tap(({ id }) => {
          if (!id) {
            window.ea.setProgressBar({
              progress: 0,
              progressBarMode: 'pause',
            });
          }
        }),
      ),
    { dispatch: false },
  );

  setTaskBarProgress$: any = createEffect(
    () =>
      this._actions$.pipe(
        ofType(TimeTrackingActions.addTimeSpent),
        withLatestFrom(
          this._configService.cfg$,
          this._store$.select(selectIsFocusOverlayShown),
        ),
        // we display pomodoro progress for pomodoro
        filter(
          ([a, cfg, isFocusSessionRunning]) =>
            !isFocusSessionRunning && (!cfg || !cfg.pomodoro.isEnabled),
        ),
        tap(([{ task }]) => {
          const progress = task.timeSpent / task.timeEstimate;
          window.ea.setProgressBar({
            progress,
            progressBarMode: 'normal',
          });
        }),
      ),
    { dispatch: false },
  );

  handleAddTaskFromProtocol$ = createEffect(
    () =>
      ipcAddTaskFromAppUri$.pipe(
        tap((data) => {
          this._taskService.add(data.title);
        }),
      ),
    { dispatch: false },
  );
}
