# Onboarding Tour

The Combustion Trainer includes an interactive onboarding tour that introduces new users to all major features and guides them through a complete tuning workflow.

## What the Tour Covers

The tour walks users through these key areas:

1. **Fuel Selection** - Choose fuel type and understand O₂/CO targets
2. **Boiler Power Control** - Start the ignition sequence and reach RUN_AUTO
3. **Firing Rate Control** - Set the rheostat for different load levels  
4. **Pressure Regulation** - Adjust fuel pressure to control flow range
5. **Tuning Mode** - Enable manual fuel/air adjustment
6. **Cam Points** - Save tuned settings at 30% and 70% loads
7. **Combustion Analyzer** - Start analyzer, insert probe, save readings
8. **Live Trends** - Monitor O₂, CO, NOx, stack temp over time
9. **Troubleshooting Scenarios** - Simulate field problems
10. **Settings Menu** - Access configuration and restart tour

## Tour Behavior

- **First Visit**: Tour starts automatically when users first load the app
- **Local Storage**: Tour completion is saved to `localStorage` key `app_config_v1`
- **Skip Option**: Users can skip the tour at any time
- **Restart**: Tour can be replayed via Settings > General > Start Tour

## Tuning Walkthrough Integration

The tour content aligns with the tuning walkthrough model to teach best practices:

1. **Power On** - Explains purge cycle safety
2. **Set Load** - Emphasizes steady load for stable readings  
3. **Enable Tuning** - Shows manual fuel/air controls
4. **Save Cam Points** - Demonstrates saving at multiple loads
5. **Monitor Readings** - Teaches O₂/CO interpretation
6. **Export Data** - Shows CSV export for record keeping

## Student-Friendly Copy

All tour text follows these guidelines:

- **Short & Clear**: Steps kept under 140 characters when possible
- **Define Terms**: "Excess air = extra O₂ above stoichiometric" 
- **Practical Focus**: "Pick a fuel. Each fuel changes typical O₂/CO targets."
- **No Jargon**: Technical terms explained in 5-10 words

## Technical Implementation

- **React Joyride**: Core tour engine with step highlighting
- **Data Attributes**: Stable selectors via `data-tour="*"` attributes
- **TypeScript**: Tour specs and walkthrough models fully typed
- **localStorage**: First-visit detection and completion tracking
- **Global Method**: `window.startCombustionTour()` for manual restart

## Important Notes

> **Educational Simulation Only**  
> The tour teaches combustion principles using simplified models. Values and behaviors are designed for classroom learning, not field calibration or actual equipment tuning.

## Testing

E2E tests verify:
- Tour appears on first visit
- Steps progress correctly with Next/Skip
- localStorage tracks completion state  
- Manual restart works via Settings
- No tour on subsequent visits

Run tests locally:
```bash
npm run test:e2e
```

## Customization

To modify tour content:

1. **Steps**: Edit `src/tour/spec.ts` → `JOYRIDE_STEPS`
2. **Walkthrough**: Edit `src/tour/walkthrough.ts` → `TUNING_WALKTHROUGH`  
3. **Styling**: Modify styles in `src/tour/JoyrideHost.tsx`
4. **Selectors**: Add `data-tour` attributes to new UI elements

Future enhancements could include:
- Video embeds in tour steps
- Interactive practice exercises
- Multi-language support
- Progress tracking analytics
