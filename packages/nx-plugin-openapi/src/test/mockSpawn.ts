import { spawn } from 'child_process';
import EventEmitter from 'node:events';
import { Mock, vi, vitest } from 'vitest';

const mock = vi.fn();
vi.mock('cross-spawn', async (importOriginal) => {
  const mod = await importOriginal<typeof import('cross-spawn')>();
  return {
    ...mod,
    // replace some exports
    spawn: mock,
  };
});

export function mockSpawn(
  ...invocations: { command: string; args: string[]; stdout?: string; stderr?: string; exitCode: number }[]
) {
  for (const invocation of invocations) {
    mock.mockImplementationOnce((command: string, args: string[], options: { stdio: 'ignore' | 'pipe' }) => {
      expect([command, ...args]).toEqual([invocation.command, ...invocation.args]);

      console.log('ran');

      const child: any = new EventEmitter();
      child.stdin = new EventEmitter();
      child.stdin.write = vitest.fn();
      child.stdin.end = vitest.fn();
      if (options.stdio !== 'ignore') {
        child.stdout = new EventEmitter();
        child.stderr = new EventEmitter();
      }

      if (child.stdout && invocation.stdout) {
        mockEmit(child.stdout, 'data', Buffer.from(invocation.stdout));
      }

      if (child.stderr && invocation.stderr) {
        mockEmit(child.stderr, 'data', Buffer.from(invocation.stderr));
      }

      mockEmit(child, 'exit', invocation.exitCode ?? 0);

      return child;
    });
  }

  return () => {
    expect(mock).toHaveBeenCalledTimes(invocations.length);
  };
}

function mockEmit(emitter: EventEmitter, event: string, data: any) {
  setImmediate(() => {
    emitter.emit(event, data);
  });
}
