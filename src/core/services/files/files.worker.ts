import { Dir, Dirent } from 'fs';
import { lstat, opendir, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import EventEmitter from 'events';
import { WorkerMessage, WorkerScanOptions } from './files.worker.service.js';
import { join } from 'path';
import { MessagePort, parentPort } from 'node:worker_threads';
import { EVENTS, MAX_PROCS } from '../../../constants/workers.constants.js';

enum ETaskOperation {
  'explore',
  'getFolderSize',
  'getFolderSizeChild',
}

interface Task {
  operation: ETaskOperation;
  path: string;
  sizeCollector?: {
    total: number;
    pending: number;
    onComplete: (total: number) => void;
  };
}

(() => {
  let id = 0;
  let fileWalker: FileWalker;
  let tunnel: MessagePort;

  if (parentPort === null) {
    throw new Error('Worker must be spawned from a parent thread.');
  }

  parentPort.on('message', (message: WorkerMessage) => {
    if (message?.type === EVENTS.startup) {
      id = message.value.id;
      tunnel = message.value.channel;
      fileWalker = new FileWalker();
      initTunnelListeners();
      initFileWalkerListeners();
      notifyWorkerReady();
    }
  });

  function notifyWorkerReady(): void {
    tunnel.postMessage({
      type: EVENTS.alive,
      value: null,
    });
  }

  function initTunnelListeners(): void {
    tunnel.on('message', (message: WorkerMessage) => {
      if (message?.type === EVENTS.exploreConfig) {
        fileWalker.setSearchConfig(message.value);
      }

      if (message?.type === EVENTS.explore) {
        fileWalker.enqueueTask(message.value.path, ETaskOperation.explore);
      }

      if (message?.type === EVENTS.getFolderSize) {
        fileWalker.enqueueTask(
          message.value.path,
          ETaskOperation.getFolderSize,
          true,
        );
      }

      if (message?.type === EVENTS.stop) {
        fileWalker.stop();
      }
    });
  }

  function initFileWalkerListeners(): void {
    fileWalker.events.on('newResult', ({ results }) => {
      tunnel.postMessage({
        type: EVENTS.scanResult,
        value: { results, workerId: id, pending: fileWalker.pendingJobs },
      });
    });

    fileWalker.events.on(
      'folderSizeResult',
      (result: { path: string; size: number }) => {
        tunnel.postMessage({
          type: EVENTS.GetSizeResult,
          value: {
            results: result,
            workerId: id,
            pending: fileWalker.pendingJobs,
          },
        });
      },
    );
  }
})();

class FileWalker {
  readonly events = new EventEmitter();
  private searchConfig: WorkerScanOptions = {
    rootPath: '',
    targets: [''],
    exclude: [],
  };

  private readonly taskQueue: Task[] = [];
  private completedTasks = 0;
  private procs = 0;
  private shouldStop = false;

  setSearchConfig(params: WorkerScanOptions): void {
    this.searchConfig = params;
  }

  stop(): void {
    this.shouldStop = true;
  }

  enqueueTask(
    path: string,
    operation: ETaskOperation,
    priorize: boolean = false,
    sizeCollector?: Task['sizeCollector'],
  ): void {
    if (this.shouldStop) {
      return;
    }

    const task: Task = { path, operation };
    if (sizeCollector) {
      task.sizeCollector = sizeCollector;
    }

    if (priorize) {
      this.taskQueue.unshift(task);
    } else {
      this.taskQueue.push(task);
    }

    this.processQueue();
  }

  private async run(path: string): Promise<void> {
    this.updateProcs(1);

    try {
      const dir = await opendir(path);
      await this.analizeDir(path, dir);
    } catch {
      this.completeTask();
    }
  }

  private async analizeDir(path: string, dir: Dir): Promise<void> {
    const results = [];
    let entry: Dirent | null = null;
    while ((entry = await dir.read().catch(() => null)) != null) {
      this.newDirEntry(path, entry, results);
    }

    this.events.emit('newResult', { results });
    await dir.close();
    this.completeTask();

    if (this.taskQueue.length === 0 && this.procs === 0) {
      this.completeAll();
    }
  }

  private async runGetFolderSize(path: string): Promise<void> {
    this.updateProcs(1);

    const collector = {
      total: 0,
      pending: 1,
      onComplete: (finalSize: number) => {
        this.events.emit('folderSizeResult', { path, size: finalSize });
      },
    };

    this.enqueueTask(path, ETaskOperation.getFolderSizeChild, false, collector);
    this.completeTask();
  }

  private async runGetFolderSizeChild(
    path: string,
    collector: Task['sizeCollector'],
  ): Promise<void> {
    if (!collector) {
      // Should not happen with proper initiation, but safe.
      this.completeTask();
      return;
    }

    this.updateProcs(1);

    try {
      const entries = await readdir(path, { withFileTypes: true });
      let currentLevelSize = 0;
      const directoriesToProcess: string[] = [];

      await Promise.all(
        entries.map(async (entry) => {
          const fullPath = join(path, entry.name);
          try {
            if (entry.isSymbolicLink()) {
              return;
            }

            const stats = await lstat(fullPath);
            const size =
              typeof stats.blocks === 'number'
                ? stats.blocks * 512
                : stats.size;

            currentLevelSize += size;

            if (stats.isDirectory()) {
              directoriesToProcess.push(fullPath);
            }
          } catch {
            // Ignore permissions errors.
          }
        }),
      );

      collector.total += currentLevelSize;
      collector.pending += directoriesToProcess.length;

      for (const dirPath of directoriesToProcess) {
        this.enqueueTask(
          dirPath,
          ETaskOperation.getFolderSizeChild,
          false,
          collector,
        );
      }
    } catch {
      // Ignore permissions errors.
    } finally {
      collector.pending -= 1;

      if (collector.pending === 0) {
        collector.onComplete(collector.total);
      }

      this.completeTask();
    }
  }

  private newDirEntry(
    path: string,
    entry: Dirent,
    results: { path: string; isTarget: boolean }[],
  ): void {
    const subpath = join(path, entry.name);
    const shouldSkip = !entry.isDirectory() || this.isExcluded(subpath);
    if (shouldSkip) {
      return;
    }

    // Enhanced Python virtual environment detection
    const isTarget = this.isPythonVirtualEnv(subpath, entry.name);

    results.push({
      path: subpath,
      isTarget: isTarget,
    });
  }

  private isExcluded(path: string): boolean {
    if (this.searchConfig.exclude == null) {
      return false;
    }
    return this.searchConfig.exclude.some((ex) => path.includes(ex));
  }

  private isTargetFolder(path: string): boolean {
    return this.searchConfig.targets.includes(path);
  }

  private isPythonVirtualEnv(dirPath: string, dirName: string): boolean {
    // Check if directory name matches common virtual environment names
    if (!this.searchConfig.targets.includes(dirName)) {
      return false;
    }

    try {
      // Check for pyvenv.cfg file (primary indicator)
      const pyvenvPath = join(dirPath, 'pyvenv.cfg');
      if (existsSync(pyvenvPath)) {
        return true;
      }

      // Check for activate script (backup indicator)
      const activateUnix = join(dirPath, 'bin', 'activate');
      const activateWin = join(dirPath, 'Scripts', 'activate.bat');
      if (existsSync(activateUnix) || existsSync(activateWin)) {
        return true;
      }

      // Check for Python interpreter
      const pythonUnix = join(dirPath, 'bin', 'python');
      const pythonWin = join(dirPath, 'Scripts', 'python.exe');
      if (existsSync(pythonUnix) || existsSync(pythonWin)) {
        return true;
      }
    } catch {
      // If we can't access the directory, assume it's not a virtual env
      return false;
    }

    return false;
  }

  private completeTask(): void {
    this.updateProcs(-1);
    this.processQueue();
    this.completedTasks++;
  }

  private updateProcs(value: number): void {
    this.procs += value;
  }

  private processQueue(): void {
    while (
      this.procs < MAX_PROCS &&
      this.taskQueue.length > 0 &&
      !this.shouldStop
    ) {
      const task = this.taskQueue.shift();
      if (!task?.path) {
        continue;
      }

      switch (task.operation) {
        case ETaskOperation.explore:
          this.run(task.path).catch(() => {
            this.completeTask();
          });
          break;
        case ETaskOperation.getFolderSize:
          this.runGetFolderSize(task.path).catch(() => {});
          break;
        case ETaskOperation.getFolderSizeChild:
          this.runGetFolderSizeChild(task.path, task.sizeCollector).catch(
            () => {
              if (task.sizeCollector == null) {
                return;
              }

              task.sizeCollector.pending -= 1;
              if (task.sizeCollector.pending === 0) {
                task.sizeCollector.onComplete(task.sizeCollector.total);
              }
            },
          );
          break;
      }
    }
  }

  private completeAll(): void {
    // Any future action.
  }

  /*  get stats(): WorkerStats {
    return {
      pendingSearchTasks: this.taskQueue.length,
      completedSearchTasks: this.completedTasks,
      procs: this.procs,
    };
  } */

  get pendingJobs(): number {
    return this.taskQueue.length;
  }
}
