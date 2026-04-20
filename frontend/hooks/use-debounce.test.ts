import { renderHook, act } from '@testing-library/react';
import useDebounce from './use-debounce';

jest.useFakeTimers();

describe('useDebounce', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300));
    expect(result.current).toBe('hello');
  });

  it('does not update value before the delay has elapsed', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 300 },
    });

    rerender({ value: 'updated', delay: 300 });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(result.current).toBe('initial');
  });

  it('updates value after the delay has elapsed', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 300 },
    });

    rerender({ value: 'updated', delay: 300 });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe('updated');
  });

  it('resets the timer when value changes rapidly', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'a', delay: 300 },
    });

    rerender({ value: 'b', delay: 300 });
    act(() => { jest.advanceTimersByTime(100); });

    rerender({ value: 'c', delay: 300 });
    act(() => { jest.advanceTimersByTime(100); });

    // Only 200ms elapsed since last change — should still be 'a'
    expect(result.current).toBe('a');

    act(() => { jest.advanceTimersByTime(200); });

    expect(result.current).toBe('c');
  });
});
