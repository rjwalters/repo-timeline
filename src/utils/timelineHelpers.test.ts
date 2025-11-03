import { describe, it, expect } from 'vitest';
import { getCurrentIndex } from './timelineHelpers';
import type { CommitData } from '../types';

describe('getCurrentIndex', () => {
  it('should return 0 for empty commits array', () => {
    const result = getCurrentIndex([], Date.now());
    expect(result).toBe(0);
  });

  it('should return 0 when time is before first commit', () => {
    const commits: CommitData[] = [
      {
        sha: '123',
        message: 'First commit',
        author: 'Test Author',
        date: new Date('2024-01-02'),
        files: [],
      },
      {
        sha: '456',
        message: 'Second commit',
        author: 'Test Author',
        date: new Date('2024-01-03'),
        files: [],
      },
    ];

    const time = new Date('2024-01-01').getTime();
    const result = getCurrentIndex(commits, time);
    expect(result).toBe(0);
  });

  it('should return correct index for time matching a commit', () => {
    const commits: CommitData[] = [
      {
        sha: '123',
        message: 'First commit',
        author: 'Test Author',
        date: new Date('2024-01-02'),
        files: [],
      },
      {
        sha: '456',
        message: 'Second commit',
        author: 'Test Author',
        date: new Date('2024-01-03'),
        files: [],
      },
      {
        sha: '789',
        message: 'Third commit',
        author: 'Test Author',
        date: new Date('2024-01-04'),
        files: [],
      },
    ];

    const time = new Date('2024-01-03').getTime();
    const result = getCurrentIndex(commits, time);
    expect(result).toBe(1);
  });

  it('should return correct index for time between commits', () => {
    const commits: CommitData[] = [
      {
        sha: '123',
        message: 'First commit',
        author: 'Test Author',
        date: new Date('2024-01-02T10:00:00'),
        files: [],
      },
      {
        sha: '456',
        message: 'Second commit',
        author: 'Test Author',
        date: new Date('2024-01-03T10:00:00'),
        files: [],
      },
      {
        sha: '789',
        message: 'Third commit',
        author: 'Test Author',
        date: new Date('2024-01-04T10:00:00'),
        files: [],
      },
    ];

    // Time between second and third commit should return second commit's index
    const time = new Date('2024-01-03T15:00:00').getTime();
    const result = getCurrentIndex(commits, time);
    expect(result).toBe(1);
  });

  it('should return last index when time is after all commits', () => {
    const commits: CommitData[] = [
      {
        sha: '123',
        message: 'First commit',
        author: 'Test Author',
        date: new Date('2024-01-02'),
        files: [],
      },
      {
        sha: '456',
        message: 'Second commit',
        author: 'Test Author',
        date: new Date('2024-01-03'),
        files: [],
      },
    ];

    const time = new Date('2024-01-05').getTime();
    const result = getCurrentIndex(commits, time);
    expect(result).toBe(1);
  });
});
