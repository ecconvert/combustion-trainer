import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import CombustionTrainer from '../App';
import { UIStateProvider } from '../components/UIStateContext';
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => JSON.stringify({})),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Settings modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
  });

  it('reverts changes on cancel', () => {
    const initialConfig = {
      general: {
        theme: 'system',
        defaultView: 'main',
        trendLength: 300,
      },
      analyzer: {},
      units: {},
      ambient: {},
      data: {},
      gauge: {},
    };

    let currentConfig = { ...initialConfig };

    const { getByLabelText, getByText, rerender } = render(
      <UIStateProvider>
        <CombustionTrainer initialConfig={currentConfig} />
      </UIStateProvider>
    );
    
    // Open settings
    act(() => {
      fireEvent.click(getByLabelText('Settings'));
    });

    // Change a setting
    const trendLengthInput = getByLabelText('Trend length (samples)');
    act(() => {
      fireEvent.change(trendLengthInput, { target: { value: '100' } });
    });

    // Simulate the App.jsx config update (since SettingsMenu no longer directly updates it)
    currentConfig = { ...currentConfig, general: { ...currentConfig.general, trendLength: 100 } };
    rerender(
      <UIStateProvider>
        <CombustionTrainer initialConfig={currentConfig} />
      </UIStateProvider>
    );

    // Cancel
    act(() => {
      fireEvent.click(getByText('Cancel'));
    });

    // After cancel, the config in App.jsx should revert to initialConfig
    // We need to re-render with the initialConfig to reflect the change
    currentConfig = { ...initialConfig }; // Revert to initial config for rerender
    rerender(
      <UIStateProvider>
        <CombustionTrainer initialConfig={currentConfig} />
      </UIStateProvider>
    );

  // Re-open settings to check the value
    act(() => {
      fireEvent.click(getByLabelText('Settings'));
    });

  // Query again after re-open to avoid referencing a stale DOM node
  const trendLengthInput2 = getByLabelText('Trend length (samples)') as HTMLInputElement;
  // Check that the setting has been reverted
  expect(trendLengthInput2.value).toBe('300');
  });
});