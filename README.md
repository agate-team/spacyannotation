# Spacy NER annotation tool

A lightweight, browser-based tool for hand-labeling text spans and exporting them as
[spaCy](https://spacy.io/) NER training data — no backend, no build step, no install.
Open `index.html` and start annotating.

## Features

- **Custom entity labels** — define any number of labels (e.g. `PERSON`, `ORG`, `DATE`), each
  auto-assigned a random color chip.
- **Keyboard shortcuts for labels** — the first 26 labels you create are auto-assigned a letter,
  `a` through `z`, in order (shown as a small keycap on the chip). Select text in the sentence
  box and press the letter to tag it — no need to reach for the mouse. Labels beyond the 26th
  simply have no shortcut. Removing a label re-numbers the rest so the sequence stays gap-free.
- **Click-to-tag annotation** — select a span of text in the current sentence and click a label
  chip (or press its shortcut key) to tag it. Double-click a tagged span, or use the × next to its
  entry, to undo a tag.
- **Raw data queue** — paste text (one sentence per line) directly into the queue, or upload a
  `.txt` file. Sentences are annotated one at a time, in order, with a live progress bar and
  "sentence X of Y" indicator.
- **Completed annotations panel** — finished sentences accumulate here in spaCy's training tuple
  format. Copy them to the clipboard or download them as a `.txt` file at any point — you don't
  have to finish the whole batch first.
- **Local, persistent, and safe to walk away from** — everything (labels, queue, in-progress and
  completed annotations) is saved to the browser's `localStorage` as you work. You can close the
  tab or browser at any time and resume later on the same device/browser with nothing lost. An
  in-app note reminds users of this and can be dismissed permanently.
- **Light/dark theme** — follows your system preference by default, with a manual toggle that's
  remembered across visits.

## Usage

1. Open `index.html` in a browser (works as a static file, or served via a local server such as
   XAMPP/Apache).
2. Under **Entity labels**, add the labels you want to annotate with (e.g. `PERSON`, `LOCATION`).
3. Under **Raw data queue**, paste your text (one sentence per line) or click **Upload .txt** to
   load a file. The sample count and progress bar are calculated from this queue.
4. The first sentence appears under **Annotate sentence**. Select a span of text, then either
   click a label chip or press its shortcut key to tag it as that entity. Repeat for every entity
   in the sentence — tagged spans and their `(start, end, "LABEL")` positions appear under
   **Annotated entities**.
5. Click **Mark as completed** to commit the sentence to the **Completed annotations** panel and
   advance to the next sentence in the queue.
6. Use **Copy** or **Download .txt** at any time to export what's been completed so far.

## Output format

Each completed sentence is stored as a Python tuple in spaCy's standard NER training format:

```python
("Barack Obama was born in Hawaii", {"entities": [(0, 12, "PERSON"), (25, 31, "LOCATION")]}),
```

The full downloaded/copied file is a sequence of these tuples, ready to drop into a spaCy
training script (e.g. as the contents of a `TRAIN_DATA` list).

## Data & privacy

All data lives in the browser's `localStorage` for this page's origin — nothing is uploaded or
sent anywhere. That means:

- Progress persists across tab/browser closures on the **same device and browser**.
- Clearing browser data (or using a different browser/device) will lose anything not yet
  copied/downloaded.
- Use **Copy** or **Download .txt** whenever you want a durable backup of your completed work.

## Project structure

```
index.html          Single-page application markup
css/main.css         Design tokens, layout, and component styles (light/dark theme)
js/main.js           Core annotation logic (labels, tagging, queue, import/export)
js/theme.js          Light/dark theme toggle
images/agate_logo.png  Brand mark used in the header
```

## Tech stack

Plain HTML, CSS, and JavaScript (jQuery for DOM handling). No build tooling, package manager, or
server-side component required — it's a static site that can be hosted anywhere or opened
directly from disk.
