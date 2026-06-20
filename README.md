# MMM-HormuzBanner

MagicMirror module diagnostic checkpoint.

This version intentionally renders only static text:

```text
HORMUZ: TEST
```

It has no `node_helper.js`, no network access, no timers, and no CSS. Use this checkpoint to prove that the module can be loaded without preventing later modules in `config.js` from loading.

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
		title: "HORMUZ",
		message: "TEST"
	}
}
```

## Options

| Option | Default | Description |
| --- | --- | --- |
| `title` | `HORMUZ` | Text before the colon. |
| `message` | `TEST` | Text after the colon. |

## Test Plan

1. Put this module before several known-good modules in `config.js`.
2. Restart MagicMirror.
3. Confirm that `HORMUZ: TEST` appears.
4. Confirm that modules listed after `MMM-HormuzBanner` also appear.
5. If the mirror still stops after this module, the problem is likely the module path, config syntax, file ownership, stale deployed files, or a MagicMirror runtime error outside the scraper/helper code.

## Test

From the module directory, run:

```bash
node --check MMM-HormuzBanner.js
git diff --check
```
