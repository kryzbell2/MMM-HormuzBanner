# MMM-HormuzBanner

Compact MagicMirror top banner for Strait of Hormuz shipping status from [hormuzstraitmonitor.com](https://hormuzstraitmonitor.com/).

Target display:

```text
HORMUZ: OPEN · 24H PASSED: 150+ · WAITING: Unknown
```

## Installation

Install under your MagicMirror modules directory:

```bash
cd ~/MagicMirror/modules
git clone <your-repo-url> MMM-HormuzBanner
```

Or copy this folder directly to:

```text
~/MagicMirror/modules/MMM-HormuzBanner
```

No browser-side fetches are used. The page is fetched by `node_helper.js`, parsed server-side, and sent to the module with socket notifications.

## Configuration

Add the module to `config/config.js`:

```js
{
  module: "MMM-HormuzBanner",
  position: "top_bar",
  config: {
    sourceUrl: "https://hormuzstraitmonitor.com/",
    updateInterval: 60 * 60 * 1000,
    title: "HORMUZ",
    labels: {
      status: "Status",
      passed24h: "24H Passed",
      waiting: "Waiting",
      updated: "Updated"
    },
    show: {
      status: true,
      passed24h: true,
      waiting: true,
      updated: false
    }
  }
}
```

## Options

| Option | Default | Description |
| --- | --- | --- |
| `sourceUrl` | `"https://hormuzstraitmonitor.com/"` | Page to fetch from the Node helper. |
| `updateInterval` | `60 * 60 * 1000` | Refresh interval in milliseconds. A 60 minute interval is recommended to avoid unnecessary scraping. |
| `title` | `"HORMUZ"` | Banner title shown before the status fields. |
| `labels` | See example | Custom labels for `passed24h`, `waiting`, and optional `updated`. |
| `show` | See example | Toggle visibility for `status`, `passed24h`, `waiting`, and `updated`. |

## Scraping Notes

This module scrapes text from a third-party web page. Scraping is inherently fragile: if the source page changes its markup or wording, one or more fields may become `Unknown`. The parser is defensive and falls back from exact 24-hour passed counts to nearby ships-transiting metrics, and from waiting vessels to stranded vessels when needed.

On fetch errors, the banner displays:

```text
HORMUZ: unavailable
```

Errors are also logged by MagicMirror.

## Testing

From the module directory:

```bash
node --check MMM-HormuzBanner.js
node --check node_helper.js
git diff --check
```
