# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Evaka Assistant is a browser extension that enhances the Evaka daycare reservation system (evaka.turku.fi) with attendance projections. It automatically adds projected monthly attendance hours vs contracted hours to the monthly summary interface.

## Development Commands

### Building and Development

```bash
cd browser-extension
npm run build          # Compile TypeScript to JavaScript in dist/
npm run dev            # Watch mode for development (tsc --watch)
npm run watch          # Same as dev - watch for changes and rebuild
```

### Testing Extension

1. Build the extension with `npm run build`
2. Load `browser-extension/` directory in Chrome/Firefox developer mode
3. Navigate to evaka.turku.fi to see the projections

## Architecture

### Core Structure
- **Modular TypeScript architecture**: Separate modules for different concerns
- **Content script only**: No background scripts, popups, or stored data
- **Real-time DOM manipulation**: Uses MutationObserver to watch for page changes
- **Namespace-based modules**: Uses TypeScript namespaces for browser compatibility

### Key Modules

1. **`types.ts`** - `EvakaTypes` namespace with comprehensive TypeScript interfaces:
   - `ReservationData` - Main API response structure
   - `Child`, `Day`, `MonthSummary` - Core entities
   - `ProjectionData` - Calculated projections

2. **`date-utils.ts`** - `DateUtils` namespace for date handling:
   - `parseDateRange()` - Parses Finnish date format "01.09. - 30.09.2025"
   - `getCurrentMonthRange()` - Gets current month date range
   - `getTodayDateString()` - Returns today's date string

3. **`api-client.ts`** - `EvakaApiClient` class for data management:
   - `fetchReservations()` - Calls `/api/citizen/reservations` endpoint
   - Manages reservation data state and current date range
   - Uses existing Evaka session cookies for authentication

4. **`projection-calculator.ts`** - `ProjectionCalculator` namespace for business logic:
   - `calculateProjectedAttendance()` computes projected vs contracted hours
   - Handles used service minutes and future reserved minutes
   - Excludes absent days from projections

5. **`ui-enhancer.ts`** - `UIEnhancer` class for DOM manipulation:
   - `enhanceMonthlyInfo()` - Injects projection elements into Evaka UI
   - `clearProjections()` - Removes existing projections
   - Targets elements via `data-qa` attributes (Evaka's test selectors)

6. **`main.ts`** - Main orchestration logic:
   - Instantiates API client and UI enhancer
   - `watchMonthlyTitle()` - Monitors for month changes and refetches data
   - Initialization and event handling

### Development Patterns

- **Namespace modules**: Uses TypeScript namespaces for browser extension compatibility
- **Single compiled output**: All modules compile to one `content.js` file
- **Dependency injection**: Classes are instantiated in main.ts and shared
- **Clean architecture**: Each module has single responsibility

### File Structure

```
browser-extension/
├── src/
│   ├── types.ts           # Type definitions (EvakaTypes namespace)
│   ├── date-utils.ts      # Date utilities (DateUtils namespace)
│   ├── api-client.ts      # API client class
│   ├── projection-calculator.ts # Business logic (ProjectionCalculator namespace)
│   ├── ui-enhancer.ts     # DOM manipulation class
│   └── main.ts           # Main orchestration logic
├── dist/content.js       # Single compiled output
├── manifest.json         # Extension configuration
├── package.json          # Build configuration
└── tsconfig.json         # TypeScript configuration with file ordering
```

The extension targets only evaka.turku.fi and requires no special permissions beyond host access.