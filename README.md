# libmedia check: reports 69 and 70

A small kit to check, in Safari on a Mac, whether two defects reported to
[libmedia](https://github.com/zhaohappy/libmedia) are fixed on its master branch:

- **69**: AC-3 and E-AC-3 sound never starts through MSE (`undefined is not an object (evaluating 'r.numIndSub')`).
- **70**: an HDR10 film played through WebCodecs looks flat (little contrast and saturation).

It holds the 20 second test files from the reports (`media/`), libmedia 1.3.1 (where the defects were found)
and libmedia master 4bd0fdae (the fixes, plus one unrelated option of ours that is off by default), a
static server and one test page. `libmedia-master/` and `libmedia-1.3.1/` share their WebAssembly decoders
through symlinks to `shared/` (only `resample` differs), so clone on macOS or Linux, not on Windows.

## Run it

```
git clone --depth 1 --branch fc/verify-69-70 https://github.com/boyardnicolas/libmedia.git libmedia-verify
cd libmedia-verify && node server.mjs
```

Then open http://127.0.0.1:8769/ in Safari (another port: `node server.mjs 9000`). Needs node 18 or later, nothing to install.

Only Safari on a Mac or an iPhone reproduces both defects. Any browser whose MSE takes `ec-3`
(the first line of the page says: `MSE ec-3: true`) reproduces report 69. Chrome and Firefox take the WebCodecs
path here and show neither defect.

## What each button should show if the defect is fixed

Click one button at a time and wait about 20 seconds. The verdict is "plays" or "does not start after 15 s".

| Button | libmedia 1.3.1 (defect) | master (fixed) |
| --- | --- | --- |
| 69: E-AC-3 + HDR10 | does not start; `<video>` readyState 0; play() never settles | plays; readyState 3 or more, currentTime moving |
| 69: AC-3 + HDR10 | same | plays |
| 69: AAC control | plays | plays |
| 70: E-AC-3, WebCodecs forced (`checkUseMSE: () => false`) | plays, picture flat | plays, natural contrast and saturation |
| 70: DTS, default options | plays, picture flat | plays, natural contrast and saturation |

For report 70 use the "Play both" buttons: 1.3.1 on the left, master on the right, and compare the colours by eye.
The test picture is a synthetic pattern: look at how strong the colours are and how deep the blacks go.
In report 69 the page cannot see the MSE worker's error; the verdict and `readyState 0` tell it.

## What to copy back

The text of the "Report" box at the bottom of the page (button "Copy the whole report"), after clicking every button,
plus a word on how the two sides of each "Play both" look (flat or natural).
