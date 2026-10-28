import { describe, it, expect } from 'vitest';
import { formatBytes, formatDuration, getStatusLabel } from '../src/utils/format';

describe('Format Utilities Suite', () => {
  it('formats byte metrics correctly', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(1073741824)).toBe('1 GB');
  });

  it('formats seconds into readable timestamp durations', () => {
    expect(formatDuration(45)).toBe('0:45');
    expect(formatDuration(125)).toBe('2:05');
    expect(formatDuration(3665)).toBe('1:01:05');
  });

  it('provides readable status labels', () => {
    expect(getStatusLabel('downloading')).toBe('Downloading');
    expect(getStatusLabel('processing')).toBe('Processing');
    expect(getStatusLabel('completed')).toBe('Completed');
    expect(getStatusLabel('failed')).toBe('Failed');
  });
});
