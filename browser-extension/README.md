# Evaka Assistant

A simple browser extension that enhances the Evaka daycare reservation system with projected monthly attendance hours.

## What it does

The extension automatically adds attendance projections to the monthly summary on evaka.turku.fi. For each child, it shows:

- **Monthly projection**: Total projected hours vs contracted hours
- **Over/under indication**: Whether you'll exceed or stay under your monthly allowance

## Example

The extension adds a line like this to each child's monthly summary:

```
Ennuste 154 h 45 min / 147 h (+7 h 45 min)
```

This shows the child is projected to use 154h 45min against their 147h contract, going 7h 45min over.

## How it works

- **Automatic**: No buttons or manual actions needed
- **Real-time**: Updates when you navigate between months
- **Smart**: Excludes days marked as absent from projections
- **Unobtrusive**: Integrates seamlessly with existing Evaka UI

## Installation

1. Load the extension in Firefox/Chrome developer mode
2. Navigate to evaka.turku.fi
3. The projections appear automatically in the monthly summary

## Files

- `manifest.json` - Extension configuration
- `content.js` - Main logic for date parsing, API calls, and UI enhancement

No popup, no background scripts, no stored data - just a simple content script that enhances the existing interface.
