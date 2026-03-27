# LiveScore Widget — Frontend

A React component that displays live RCB vs SRH IPL match scores above the price chart on the Yeno trading platform.

## Installation

Copy `src/components/LiveScoreWidget.jsx` into your project.

```bash
# No extra dependencies required beyond React 17+
```

## Usage

```jsx
import LiveScoreWidget from './components/LiveScoreWidget';

// Above the price chart
function MarketPage() {
  return (
    <>
      <LiveScoreWidget
        apiBaseUrl="http://localhost:3001"   // your backend URL
        pollInterval={15000}                 // refresh every 15s (10s when live)
      />
      <PriceChart />
    </>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiBaseUrl` | string | `REACT_APP_LIVESCORE_API_URL` env or `http://localhost:3001` | Backend base URL |
| `pollInterval` | number | `15000` | Polling interval in ms |
| `className` | string | `''` | Extra CSS class on the container |

## Environment Variable

Set `REACT_APP_LIVESCORE_API_URL` in your `.env` to point to the backend:

```
REACT_APP_LIVESCORE_API_URL=https://your-backend.com
```

## Features

- ✅ Shows team logos, names, and live scores
- ✅ Match status badge (LIVE / UPCOMING / COMPLETED)
- ✅ Overs display for cricket
- ✅ Loading skeleton and error states
- ✅ Auto-polling (15s idle, 10s during live match)
- ✅ Falls back to cached data on API errors
- ✅ Responsive design, no external CSS dependencies
