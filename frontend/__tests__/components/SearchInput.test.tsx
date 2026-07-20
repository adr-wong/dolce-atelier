import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import SearchInput from '@/components/SearchInput';

describe('SearchInput', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders an input with the default placeholder', () => {
    render(<SearchInput value="" onChange={jest.fn()} />);
    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument();
  });

  it('renders an input with a custom placeholder', () => {
    render(<SearchInput value="" onChange={jest.fn()} placeholder="Buscar usuario" />);
    const input = screen.getByPlaceholderText('Buscar usuario') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
  });

  it('does not call onChange before the debounce window elapses', () => {
    const onChange = jest.fn();
    render(<SearchInput value="" onChange={onChange} debounceMs={300} />);
    const input = screen.getByPlaceholderText('Buscar...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'hola' } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('fires onChange with the typed value after the debounce', () => {
    const onChange = jest.fn();
    render(<SearchInput value="" onChange={onChange} debounceMs={300} />);
    const input = screen.getByPlaceholderText('Buscar...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'hola' } });
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(onChange).toHaveBeenCalledWith('hola');
  });

  it('clears the value and calls onChange with empty string on Escape', () => {
    const onChange = jest.fn();
    render(<SearchInput value="abc" onChange={onChange} debounceMs={300} />);
    const input = screen.getByPlaceholderText('Buscar...');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onChange).toHaveBeenCalledWith('');
  });
});
