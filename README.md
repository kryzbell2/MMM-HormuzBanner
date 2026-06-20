# MMM-HormuzBanner

MagicMirror module diagnostic checkpoint.

This version intentionally tests only a single server-side fetch:

```text
HORMUZ: fetched
```

It has no timers, no scraping, and no CSS. Use this checkpoint to prove that `node_helper.js` can fetch the source page without preventing later modules in `config.js` from loading.

## Install

Clone or copy this module into your MagicMirror modules directory:

```bash
cd ~/MagicMirror/modules
git clone <your-repo-url> MMM-HormuzBanner
```

No npm install step is required.

## Configuration

Add the module to `~/MagicMirror/config/config.js`:

```js
{
	module: "MMM-HormuzBanner",
	position: "top_bar",
	config: {
		sourceUrl: "https://hormuzstraitmonitor.com/",
		title: "HORMUZ",
		message: "TEST"
	}
}
```

## Options

| Option | Default | Description |
| --- | --- | --- |
| `sourceUrl` | `https://hormuzstraitmonitor.com/` | URL fetched once by `node_helper.js`. |
| `title` | `HORMUZ` | Text before the colon. |
| `message` | `TEST` | Temporary text shown before helper data arrives. |

## Test Plan

1. Put this module before several known-good modules in `config.js`.
2. Restart MagicMirror.
3. Confirm that `HORMUZ: fetched` appears.
4. Confirm that modules listed after `MMM-HormuzBanner` also appear.
5. If the mirror stops after this module, the problem is in helper-side network fetching, not scraping or CSS.

## Test

From the module directory, run:

```bash
node --check MMM-HormuzBanner.js
node --check node_helper.js
git diff --check
```
