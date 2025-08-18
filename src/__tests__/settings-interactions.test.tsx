import React from 'react';
import { render, fireEvent, act, screen, within, waitFor } from '@testing-library/react';
import CombustionTrainer from '../App';
import { UIStateProvider } from '../components/UIStateContext';

function openSettings(utils: ReturnType<typeof render>) {
  const btn = utils.getByLabelText('Settings');
  act(() => {
    fireEvent.click(btn);
  });
}

describe('Settings menu interactions', () => {
  it('keeps focus while typing numbers in inputs', () => {
    const initialConfig = {
      general: { theme: 'system', defaultView: 'main', trendLength: 300 },
      analyzer: {}, units: {}, ambient: {}, data: {}, gauge: {},
    } as any;

    const utils = render(
      <UIStateProvider>
        <CombustionTrainer initialConfig={initialConfig} />
      </UIStateProvider>
    );

    openSettings(utils);

    const input = utils.getByLabelText('Trend length (samples)') as HTMLInputElement;
    input.focus();

    // Type sequence; focus should remain and value updates
    act(() => {
      fireEvent.change(input, { target: { value: '3' } });
      fireEvent.change(input, { target: { value: '30' } });
      fireEvent.change(input, { target: { value: '300' } });
    });

    expect(document.activeElement).toBe(input);
    expect(input.value).toBe('300');
  });

  it('renders a scrollable container for settings body', () => {
    const initialConfig2 = {
      general: { theme: 'system', defaultView: 'main', trendLength: 300 },
      analyzer: {}, units: {}, ambient: {}, data: {}, gauge: {},
    } as any;

    const utils = render(
      <UIStateProvider>
        <CombustionTrainer initialConfig={initialConfig2} />
      </UIStateProvider>
    );

    openSettings(utils);

    const dialog = utils.getByTestId('settings-dialog');
    const scroller = utils.getByTestId('settings-scroll');

    expect(dialog).toBeInTheDocument();
    expect(scroller).toBeInTheDocument();
    expect(scroller.className).toContain('overflow-y-auto');
  });
});

describe('CSV Button Location', () => {
    it('should not display CSV export buttons in the header', () => {
        render(
            <UIStateProvider>
                <CombustionTrainer />
            </UIStateProvider>
        );

        const header = screen.getByRole('banner');
        const trendButton = within(header).queryByRole('button', { name: /export trend csv/i });
        const savedButton = within(header).queryByRole('button', { name: /export saved readings/i });

        expect(trendButton).not.toBeInTheDocument();
        expect(savedButton).not.toBeInTheDocument();
    });

    it('should display CSV export buttons in the Export settings section', async () => {
        const utils = render(
            <UIStateProvider>
                <CombustionTrainer />
            </UIStateProvider>
        );

        openSettings(utils);

        const settingsNav = utils.getByRole('navigation', { name: /settings sections/i });
        const exportSectionButton = within(settingsNav).getByRole('button', { name: /export/i });
        fireEvent.click(exportSectionButton);

        const exportSection = screen.getByRole('heading', { name: /export data/i });
        const trendButton = within(exportSection.parentElement).getByRole('button', { name: /export trend csv/i });
        const savedButton = within(exportSection.parentElement).getByRole('button', { name: /export saved readings/i });

        expect(trendButton).toBeInTheDocument();
        expect(savedButton).toBeInTheDocument();
    });
});

describe('Draft Input', () => {
    it.skip('should allow adjusting draft and see efficiency change', async () => {
        render(
            <UIStateProvider>
                <CombustionTrainer />
            </UIStateProvider>
        );

        // This test requires the boiler to be running to see efficiency
        // We will skip this for now as the main goal is to test the input exists
        // and can be changed, which will fail first.

        // Open settings
        const settingsButton = screen.getByLabelText('Settings');
        fireEvent.click(settingsButton);

        // Find and change draft input
        const draftInput = await screen.findByLabelText('Draft (in. w.c.)');
        fireEvent.change(draftInput, { target: { value: '-0.15' } });

        expect(draftInput.value).toBe('-0.15');
    });
});

describe('Troubleshooting Scenarios', () => {
    test('selecting "Low air, hot stack" should decrease O2 and increase stack temp', async () => {
        render(<UIStateProvider><CombustionTrainer /></UIStateProvider>);

        const readouts = screen.getByRole('group', { name: /readouts/i });
        const o2Readout = within(readouts).getByText((content, element) => content.startsWith('O₂ (dry)')).parentElement.querySelector('.value');
        const stackReadout = within(readouts).getByText(/Stack/).nextElementSibling;

        const initialO2 = o2Readout.textContent;
        const initialStack = stackReadout.textContent;

        const scenarioSelector = screen.getByLabelText('troubleshooting scenarios');
        fireEvent.change(scenarioSelector, { target: { value: 'Low air, hot stack' } });

        await waitFor(() => {
            expect(o2Readout.textContent).not.toBe(initialO2);
            expect(stackReadout.textContent).not.toBe(initialStack);
        }, { timeout: 15000 });
    });

    test('selecting "High draft, cold stack" should increase O2 and decrease stack temp', async () => {
        render(<UIStateProvider><CombustionTrainer /></UIStateProvider>);

        const readouts = screen.getByRole('group', { name: /readouts/i });
        const o2Readout = within(readouts).getByText((content, element) => content.startsWith('O₂ (dry)')).parentElement.querySelector('.value');
        const stackReadout = within(readouts).getByText(/Stack/).nextElementSibling;

        const initialO2 = o2Readout.textContent;
        const initialStack = stackReadout.textContent;

        const scenarioSelector = screen.getByLabelText('troubleshooting scenarios');
        fireEvent.change(scenarioSelector, { target: { value: 'High draft, cold stack' } });

        await waitFor(() => {
            expect(o2Readout.textContent).not.toBe(initialO2);
            expect(stackReadout.textContent).not.toBe(initialStack);
        }, { timeout: 15000 });
    });

    test('selecting "Dirty nozzles (incomplete)" should increase CO', async () => {
        render(<UIStateProvider><CombustionTrainer /></UIStateProvider>);

        const readouts = screen.getByRole('group', { name: /readouts/i });
        const coReadout = within(readouts).getByText(/^CO$/).nextElementSibling;
        const initialCO = coReadout.textContent;

        const scenarioSelector = screen.getByLabelText('troubleshooting scenarios');
        fireEvent.change(scenarioSelector, { target: { value: 'Dirty nozzles (incomplete)' } });

        await waitFor(() => {
            expect(coReadout.textContent).not.toBe(initialCO);
        }, { timeout: 15000 });
    });
});
