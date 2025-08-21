import { TestBed } from '@angular/core/testing';
import { TaskRepeatCfgService } from './task-repeat-cfg.service';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { MatDialog } from '@angular/material/dialog';
import { TaskService } from '../tasks/task.service';
import { WorkContextService } from '../work-context/work-context.service';
import {
  addTaskRepeatCfgToTask,
  deleteTaskRepeatCfg,
  deleteTaskRepeatCfgs,
  updateTaskRepeatCfg,
  updateTaskRepeatCfgs,
  upsertTaskRepeatCfg,
} from './store/task-repeat-cfg.actions';
import { DEFAULT_TASK_REPEAT_CFG, TaskRepeatCfg } from './task-repeat-cfg.model';
import { of } from 'rxjs';
import { WorkContextType } from '../work-context/work-context.model';
import {
  selectAllUnprocessedTaskRepeatCfgs,
  selectTaskRepeatCfgsForExactDay,
} from './store/task-repeat-cfg.selectors';
import { DEFAULT_TASK, Task, TaskWithSubTasks } from '../tasks/task.model';
import { TaskSharedActions } from '../../root-store/meta/task-shared.actions';
import { getDbDateStr } from '../../util/get-db-date-str';
import { TODAY_TAG } from '../tag/tag.const';

describe('TaskRepeatCfgService', () => {
  let service: TaskRepeatCfgService;
  let store: MockStore;
  let matDialog: jasmine.SpyObj<MatDialog>;
  let taskService: jasmine.SpyObj<TaskService>;
  let dispatchSpy: jasmine.Spy;

  const mockTaskRepeatCfg: TaskRepeatCfg = {
    ...DEFAULT_TASK_REPEAT_CFG,
    id: 'test-cfg-id',
    title: 'Test Repeat Task',
    projectId: 'test-project',
    repeatCycle: 'DAILY',
    startDate: new Date().toISOString().split('T')[0], // Use today's date
    // eslint-disable-next-line no-mixed-operators
    lastTaskCreationDay: new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0], // Yesterday
    repeatEvery: 1,
    defaultEstimate: 3600000,
    notes: 'Test notes',
    tagIds: ['tag1', 'tag2', TODAY_TAG.id],
  };

  const mockTask: Task = {
    ...DEFAULT_TASK,
    id: 'test-task-id',
    title: 'Test Repeat Task',
    projectId: 'test-project',
  };

  const mockTaskWithSubTasks: TaskWithSubTasks = {
    ...mockTask,
    subTasks: [],
  };

  beforeEach(() => {
    const matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const taskServiceSpy = jasmine.createSpyObj('TaskService', [
      'createNewTaskWithDefaults',
      'getTasksWithSubTasksByRepeatCfgId$',
    ]);
    const workContextServiceSpy = jasmine.createSpyObj('WorkContextService', [], {
      activeWorkContextType: WorkContextType.PROJECT,
      activeWorkContextId: 'test-project',
    });

    TestBed.configureTestingModule({
      providers: [
        TaskRepeatCfgService,
        provideMockStore({
          initialState: {
            taskRepeatCfg: {
              ids: [],
              entities: {},
            },
          },
        }),
        { provide: MatDialog, useValue: matDialogSpy },
        { provide: TaskService, useValue: taskServiceSpy },
        { provide: WorkContextService, useValue: workContextServiceSpy },
      ],
    });

    service = TestBed.inject(TaskRepeatCfgService);
    store = TestBed.inject(MockStore);
    matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    taskService = TestBed.inject(TaskService) as jasmine.SpyObj<TaskService>;

    dispatchSpy = spyOn(store, 'dispatch');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('taskRepeatCfgs$', () => {
    it('should select all task repeat configs', (done) => {
      const mockConfigs = [mockTaskRepeatCfg];
      store.setState({
        taskRepeatCfg: {
          ids: ['test-cfg-id'],
          entities: {
            ['test-cfg-id']: mockTaskRepeatCfg,
          },
        },
      });

      service.taskRepeatCfgs$.subscribe((configs) => {
        expect(configs).toEqual(mockConfigs);
        done();
      });
    });
  });

  describe('getRepeatableTasksForExactDay$', () => {
    it('should return configs due for the specified day', (done) => {
      const dayDate = new Date(2022, 0, 10).getTime();
      const mockConfigs = [mockTaskRepeatCfg];

      // Mock the selector to return our test data
      store.overrideSelector(selectTaskRepeatCfgsForExactDay, mockConfigs);
      store.refreshState();

      service.getRepeatableTasksForExactDay$(dayDate).subscribe((configs) => {
        expect(configs).toEqual(mockConfigs);
        done();
      });
    });
  });

  describe('getTaskRepeatCfgById$', () => {
    it('should return config by id', (done) => {
      store.setState({
        taskRepeatCfg: {
          ids: ['test-cfg-id'],
          entities: {
            ['test-cfg-id']: mockTaskRepeatCfg,
          },
        },
      });

      service.getTaskRepeatCfgById$('test-cfg-id').subscribe((config) => {
        expect(config).toEqual(mockTaskRepeatCfg);
        done();
      });
    });
  });

  describe('addTaskRepeatCfgToTask', () => {
    it('should dispatch addTaskRepeatCfgToTask action', () => {
      const taskId = 'task-123';
      const projectId = 'project-123';
      const taskRepeatCfg = {
        title: 'New Repeat Task',
        repeatCycle: 'DAILY',
      };

      service.addTaskRepeatCfgToTask(taskId, projectId, taskRepeatCfg as any);

      expect(dispatchSpy).toHaveBeenCalledWith(
        jasmine.objectContaining({
          type: addTaskRepeatCfgToTask.type,
          taskId,
          taskRepeatCfg: jasmine.objectContaining({
            ...taskRepeatCfg,
            projectId,
            id: jasmine.any(String),
          }),
        }),
      );
    });
  });

  describe('deleteTaskRepeatCfg', () => {
    it('should dispatch deleteTaskRepeatCfg action', () => {
      const id = 'cfg-123';

      service.deleteTaskRepeatCfg(id);

      expect(dispatchSpy).toHaveBeenCalledWith(
        jasmine.objectContaining({
          type: deleteTaskRepeatCfg.type,
          id,
        }),
      );
    });
  });

  describe('deleteTaskRepeatCfgsNoTaskCleanup', () => {
    it('should dispatch deleteTaskRepeatCfgs action', () => {
      const ids = ['cfg-123', 'cfg-456'];

      service.deleteTaskRepeatCfgsNoTaskCleanup(ids);

      expect(dispatchSpy).toHaveBeenCalledWith(
        jasmine.objectContaining({
          type: deleteTaskRepeatCfgs.type,
          ids,
        }),
      );
    });
  });

  describe('updateTaskRepeatCfg', () => {
    it('should dispatch updateTaskRepeatCfg action', () => {
      const id = 'cfg-123';
      const changes = { title: 'Updated Title' };

      service.updateTaskRepeatCfg(id, changes);

      expect(dispatchSpy).toHaveBeenCalledWith(
        jasmine.objectContaining({
          type: updateTaskRepeatCfg.type,
          taskRepeatCfg: { id, changes },
          isAskToUpdateAllTaskInstances: false,
        }),
      );
    });

    it('should dispatch with isAskToUpdateAllTaskInstances when specified', () => {
      const id = 'cfg-123';
      const changes = { title: 'Updated Title' };

      service.updateTaskRepeatCfg(id, changes, true);

      expect(dispatchSpy).toHaveBeenCalledWith(
        jasmine.objectContaining({
          type: updateTaskRepeatCfg.type,
          taskRepeatCfg: { id, changes },
          isAskToUpdateAllTaskInstances: true,
        }),
      );
    });
  });

  describe('updateTaskRepeatCfgs', () => {
    it('should dispatch updateTaskRepeatCfgs action', () => {
      const ids = ['cfg-123', 'cfg-456'];
      const changes = { projectId: 'new-project' };

      service.updateTaskRepeatCfgs(ids, changes);

      expect(dispatchSpy).toHaveBeenCalledWith(
        jasmine.objectContaining({
          type: updateTaskRepeatCfgs.type,
          ids,
          changes,
        }),
      );
    });
  });

  describe('upsertTaskRepeatCfg', () => {
    it('should dispatch upsertTaskRepeatCfg action', () => {
      service.upsertTaskRepeatCfg(mockTaskRepeatCfg);

      expect(dispatchSpy).toHaveBeenCalledWith(
        jasmine.objectContaining({
          type: upsertTaskRepeatCfg.type,
          taskRepeatCfg: mockTaskRepeatCfg,
        }),
      );
    });
  });

  describe('deleteTaskRepeatCfgWithDialog', () => {
    it('should open dialog and delete on confirm', () => {
      const dialogRefSpy = jasmine.createSpyObj({ afterClosed: of(true) });
      matDialog.open.and.returnValue(dialogRefSpy);

      service.deleteTaskRepeatCfgWithDialog('cfg-123');

      expect(matDialog.open).toHaveBeenCalledWith(jasmine.anything(), {
        restoreFocus: true,
        data: jasmine.objectContaining({
          message: jasmine.any(String),
          okTxt: jasmine.any(String),
        }),
      });

      expect(dispatchSpy).toHaveBeenCalledWith(
        jasmine.objectContaining({
          type: deleteTaskRepeatCfg.type,
          id: 'cfg-123',
        }),
      );
    });

    it('should not delete when dialog is cancelled', () => {
      const dialogRefSpy = jasmine.createSpyObj({ afterClosed: of(false) });
      matDialog.open.and.returnValue(dialogRefSpy);

      service.deleteTaskRepeatCfgWithDialog('cfg-123');

      expect(matDialog.open).toHaveBeenCalled();
      expect(dispatchSpy).not.toHaveBeenCalled();
    });
  });

  describe('createRepeatableTask', () => {
    it('should create actions for a new repeatable task', async () => {
      const today = new Date();
      const targetDayDate = today.getTime();
      taskService.getTasksWithSubTasksByRepeatCfgId$.and.returnValue(of([]));
      taskService.createNewTaskWithDefaults.and.returnValue(mockTask);

      await service.createRepeatableTask(mockTaskRepeatCfg, targetDayDate);

      expect(dispatchSpy).toHaveBeenCalledTimes(2);

      // Check addTask action
      expect(dispatchSpy.calls.argsFor(0)[0]).toEqual(
        jasmine.objectContaining({
          type: TaskSharedActions.addTask.type,
          task: jasmine.objectContaining({
            title: mockTaskRepeatCfg.title,
            dueDay: getDbDateStr(new Date(targetDayDate)),
          }),
          workContextType: WorkContextType.PROJECT,
          workContextId: 'test-project',
          isAddToBacklog: false,
          isAddToBottom: false,
        }),
      );

      // Check updateTaskRepeatCfg action - should update both fields
      expect(dispatchSpy.calls.argsFor(1)[0]).toEqual(
        jasmine.objectContaining({
          type: updateTaskRepeatCfg.type,
          taskRepeatCfg: {
            id: mockTaskRepeatCfg.id,
            changes: {
              lastTaskCreation: jasmine.any(Number),
              lastTaskCreationDay: getDbDateStr(targetDayDate),
            },
          },
        }),
      );
    });

    it('should not create task if already exists for the day', async () => {
      const today = new Date();
      const targetDayDate = today.getTime();
      const existingTask = { ...mockTaskWithSubTasks, created: targetDayDate };
      taskService.getTasksWithSubTasksByRepeatCfgId$.and.returnValue(of([existingTask]));

      await service.createRepeatableTask(mockTaskRepeatCfg, targetDayDate);

      expect(dispatchSpy).not.toHaveBeenCalled();
    });

    it('should add task to bottom if order > 0', async () => {
      const cfgWithOrder = { ...mockTaskRepeatCfg, order: 1 };
      const today = new Date();
      const targetDayDate = today.getTime();
      taskService.getTasksWithSubTasksByRepeatCfgId$.and.returnValue(of([]));
      taskService.createNewTaskWithDefaults.and.returnValue(mockTask);

      await service.createRepeatableTask(cfgWithOrder, targetDayDate);

      expect(dispatchSpy.calls.argsFor(0)[0]).toEqual(
        jasmine.objectContaining({
          type: TaskSharedActions.addTask.type,
          isAddToBottom: true,
        }),
      );
    });

    it('should filter out TODAY_TAG from tagIds', async () => {
      const today = new Date();
      const targetDayDate = today.getTime();
      taskService.getTasksWithSubTasksByRepeatCfgId$.and.returnValue(of([]));
      taskService.createNewTaskWithDefaults.and.returnValue(mockTask);

      await service.createRepeatableTask(mockTaskRepeatCfg, targetDayDate);

      expect(taskService.createNewTaskWithDefaults).toHaveBeenCalledWith(
        jasmine.objectContaining({
          additional: jasmine.objectContaining({
            tagIds: ['tag1', 'tag2'], // TODAY_TAG.id should be filtered out
          }),
        }),
      );
    });
  });

  describe('getActionsForTaskRepeatCfg', () => {
    it('should return empty array if task already exists for day', async () => {
      const today = new Date();
      const targetDayDate = today.getTime();
      const existingTask = { ...mockTaskWithSubTasks, created: targetDayDate };
      taskService.getTasksWithSubTasksByRepeatCfgId$.and.returnValue(of([existingTask]));

      const actions = await service._getActionsForTaskRepeatCfg(
        mockTaskRepeatCfg,
        targetDayDate,
      );

      expect(actions).toEqual([]);
    });

    it('should include schedule action if startTime and remindAt are set', async () => {
      const cfgWithSchedule = {
        ...mockTaskRepeatCfg,
        startTime: '10:00',
        remindAt: 'AtStart',
      };
      const today = new Date();
      const targetDayDate = today.getTime();
      taskService.getTasksWithSubTasksByRepeatCfgId$.and.returnValue(of([]));
      taskService.createNewTaskWithDefaults.and.returnValue(mockTask);

      const actions = await service._getActionsForTaskRepeatCfg(
        cfgWithSchedule as any,
        targetDayDate,
      );

      expect(actions.length).toBe(3);
      expect(actions[2].type).toBe(TaskSharedActions.scheduleTaskWithTime.type);
    });

    it('should throw error if no id', async () => {
      const cfgWithoutId = { ...mockTaskRepeatCfg, id: null };
      taskService.getTasksWithSubTasksByRepeatCfgId$.and.returnValue(of([]));

      await expectAsync(
        service._getActionsForTaskRepeatCfg(cfgWithoutId as any),
      ).toBeRejectedWithError('No taskRepeatCfg.id');
    });

    it('should throw error if startDate is undefined', async () => {
      const cfgInvalid = { ...mockTaskRepeatCfg, startDate: undefined };
      taskService.getTasksWithSubTasksByRepeatCfgId$.and.returnValue(of([]));

      await expectAsync(
        service._getActionsForTaskRepeatCfg(cfgInvalid as any),
      ).toBeRejectedWithError('Repeat startDate needs to be defined');
    });

    it('should return empty array when due date is in the future', async () => {
      const futureDate = new Date(2025, 0, 1).toISOString();
      const cfgFutureStart = { ...mockTaskRepeatCfg, startDate: futureDate };
      const pastTargetDate = new Date(2022, 0, 1).getTime();
      taskService.getTasksWithSubTasksByRepeatCfgId$.and.returnValue(of([]));

      // Mock confirm to return false to prevent throwing
      const confirmSpy = window.confirm as jasmine.Spy;
      confirmSpy.and.returnValue(false);

      const result = await service._getActionsForTaskRepeatCfg(
        cfgFutureStart as any,
        pastTargetDate,
      );

      expect(result).toEqual([]);

      // Verify that confirm was called (devError will always call confirm)
      expect(confirmSpy).toHaveBeenCalledWith(
        'Throw an error for error? ––– No target creation date found for repeatable task',
      );

      // Restore default behavior
      confirmSpy.and.returnValue(true);
    });
  });

  describe('getAllUnprocessedRepeatableTasks$', () => {
    it('should return configs including overdue', (done) => {
      const dayDate = new Date(2022, 0, 10).getTime();
      const mockConfigs = [mockTaskRepeatCfg];

      // Mock the selector to return our test data
      store.overrideSelector(selectAllUnprocessedTaskRepeatCfgs, mockConfigs);
      store.refreshState();

      service.getAllUnprocessedRepeatableTasks$(dayDate).subscribe((configs) => {
        expect(configs).toEqual(mockConfigs);
        done();
      });
    });

    it('should use first() operator', () => {
      const dayDate = new Date(2022, 0, 10).getTime();
      spyOn(service['_store$'], 'select').and.returnValue({
        pipe: jasmine.createSpy('pipe').and.returnValue(of([])),
      } as any);

      service.getAllUnprocessedRepeatableTasks$(dayDate);

      expect(service['_store$'].select).toHaveBeenCalled();
    });
  });

  describe('getTaskRepeatCfgByIdAllowUndefined$', () => {
    it('should return config by id when exists', (done) => {
      store.setState({
        taskRepeatCfg: {
          ids: ['test-cfg-id'],
          entities: {
            ['test-cfg-id']: mockTaskRepeatCfg,
          },
        },
      });

      service.getTaskRepeatCfgByIdAllowUndefined$('test-cfg-id').subscribe((config) => {
        expect(config).toEqual(mockTaskRepeatCfg);
        done();
      });
    });

    it('should return undefined when config does not exist', (done) => {
      store.setState({
        taskRepeatCfg: {
          ids: [],
          entities: {},
        },
      });

      service.getTaskRepeatCfgByIdAllowUndefined$('non-existent').subscribe((config) => {
        expect(config).toBeUndefined();
        done();
      });
    });
  });

  describe('Backward Compatibility', () => {
    it('should update both lastTaskCreation and lastTaskCreationDay when creating task', async () => {
      // Use today's date for the target to ensure it's valid
      const today = new Date();
      today.setHours(10, 0, 0, 0);
      const targetDayDate = today.getTime();

      // Create a task repeat config with a start date in the past
      const testTaskRepeatCfg = {
        ...mockTaskRepeatCfg,
        // eslint-disable-next-line no-mixed-operators
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0], // 7 days ago
        // eslint-disable-next-line no-mixed-operators
        lastTaskCreationDay: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0], // 2 days ago
      };

      taskService.getTasksWithSubTasksByRepeatCfgId$.and.returnValue(of([]));
      taskService.createNewTaskWithDefaults.and.returnValue(mockTask);

      await service.createRepeatableTask(testTaskRepeatCfg, targetDayDate);

      // Verify both fields are set
      const updateAction = dispatchSpy.calls.argsFor(1)[0];
      expect(updateAction.type).toBe(updateTaskRepeatCfg.type);
      expect(updateAction.taskRepeatCfg.changes.lastTaskCreation).toBeDefined();
      expect(updateAction.taskRepeatCfg.changes.lastTaskCreationDay).toBeDefined();

      // Verify they represent the same date
      const actualTimestamp = updateAction.taskRepeatCfg.changes.lastTaskCreation;
      const actualDay = new Date(actualTimestamp).toISOString().split('T')[0];
      expect(actualDay).toBe(updateAction.taskRepeatCfg.changes.lastTaskCreationDay);
    });
  });

  describe('Timezone Edge Cases', () => {
    it('should correctly update lastTaskCreationDay for late night task creation', async () => {
      // Simulate creating a task at 11 PM
      const lateNightTime = new Date('2025-08-01T23:00:00');
      const targetDayDate = lateNightTime.getTime();

      // Set up a task repeat config with dates relative to the test date
      const testTaskRepeatCfg = {
        ...mockTaskRepeatCfg,
        startDate: '2025-07-01', // Start date a month before
        lastTaskCreationDay: '2025-07-31', // Last created day before Aug 1st
      };

      taskService.getTasksWithSubTasksByRepeatCfgId$.and.returnValue(of([]));
      taskService.createNewTaskWithDefaults.and.returnValue(mockTask);

      await service.createRepeatableTask(testTaskRepeatCfg, targetDayDate);

      // Verify that both fields are updated correctly
      // Note: lastTaskCreation will be set to noon (12:00) of the target day
      const updateAction = dispatchSpy.calls.argsFor(1)[0];
      expect(updateAction.type).toBe(updateTaskRepeatCfg.type);
      expect(updateAction.taskRepeatCfg.id).toBe(testTaskRepeatCfg.id);
      expect(updateAction.taskRepeatCfg.changes.lastTaskCreationDay).toBe('2025-08-01');
      // Verify timestamp is for the same day (at noon)
      const actualDate = new Date(updateAction.taskRepeatCfg.changes.lastTaskCreation);
      expect(actualDate.toISOString().split('T')[0]).toBe('2025-08-01');
    });

    it('should correctly handle task creation across day boundaries', async () => {
      // Test creating task just after midnight
      const earlyMorning = new Date('2025-08-02T00:30:00');
      const targetDayDate = earlyMorning.getTime();

      // Set up a task repeat config with dates relative to the test date
      const testTaskRepeatCfg = {
        ...mockTaskRepeatCfg,
        startDate: '2025-07-01', // Start date a month before
        lastTaskCreationDay: '2025-08-01', // Last created day before Aug 2nd
      };

      taskService.getTasksWithSubTasksByRepeatCfgId$.and.returnValue(of([]));
      taskService.createNewTaskWithDefaults.and.returnValue(mockTask);

      await service.createRepeatableTask(testTaskRepeatCfg, targetDayDate);

      // Verify both fields are updated correctly
      // Note: lastTaskCreation will be set to noon (12:00) of the target day
      const updateAction = dispatchSpy.calls.argsFor(1)[0];
      expect(updateAction.type).toBe(updateTaskRepeatCfg.type);
      expect(updateAction.taskRepeatCfg.id).toBe(testTaskRepeatCfg.id);
      expect(updateAction.taskRepeatCfg.changes.lastTaskCreationDay).toBe('2025-08-02');
      // Verify timestamp is for the same day (at noon)
      const actualDate = new Date(updateAction.taskRepeatCfg.changes.lastTaskCreation);
      expect(actualDate.toISOString().split('T')[0]).toBe('2025-08-02');
    });
  });
});
