# Ajar — Design plan

Brief (Ino, 2026-11-12): **Apple-like, minimalistic. No glow.** Clean and neat.
Subject: a private deadline board for one ambitious student — hundreds of opportunities, and the job of the UI is "what do I need to act on next, and is it worth it?"

## Tokens

| Role | Light | Dark |
|---|---|---|
| Canvas | `#FFFFFF` | `#000000` |
| Grouped surface (filters, inset groups) | `#F5F5F7` | `#1C1C1E` |
| Label | `#1D1D1F` | `#F5F5F7` |
| Secondary label | `#6E6E73` | `#98989D` |
| Hairline | `#D2D2D7` | `#38383A` |
| Tint (links, primary action, today marker) | `#0071E3` | `#2997FF` |
| Urgent (≤ 3 days) | `#D70015` | `#FF453A` |

Category = small 8px dot in an Apple system color + plain text name. Color never carries meaning alone.

Type: one family — the Apple system stack (`-apple-system, "SF Pro Text", "PingFang TC", "Noto Sans TC", system-ui`). Scale: page title 34/40 semibold (−0.02em), section 21/28 semibold, body 15/22, secondary 13/18. Tabular numerals for dates and scores. Sentence case everywhere; no all-caps labels.

## Layout

```
┌──────────────────────── nav 44px, translucent, hairline ───────────────────────┐
│ Ajar        機會   月曆   個人檔案                                   Ino ▾     │
└────────────────────────────────────────────────────────────────────────────────┘
  max-width 980, left-aligned

  接下來 14 天                                                (page title)
  ├──●────●●──────●──────────●──────●●●───────●────────────┤   ← the one bold element:
  今天  11/14                     11/20                    11/26     a 14-day ruler; dots = deadlines

  追蹤中 (3)                                                  (only if non-empty)
  ─────────────────────────────────────────────────────────
  [ 搜尋…          ] [類別 ▾] [適合度 ▾] [範圍: 重點 / 全部]    (grouped surface bar)

  11 月                                                       (month group header)
  ─────────────────────────────────────────────────────────
  14   和泰 AI 黑客松                          ● 黑客松   86   有興趣
  週五 和泰汽車 · 台北
  ─────────────────────────────────────────────────────────
```

Rows, not cards. The date sits in a fixed left column (day number + weekday) so the eye scans time vertically, like Calendar's list view. Mobile: same rows, right-side metadata wraps under the title.

## Principles
- Quiet by default; the 14-day ruler is the only expressive element.
- Hierarchy through size and weight, not color or boxes. One radius per tier: controls 8px, grouped surfaces 12px, primary button pill.
- No shadows on content. Popovers only get a faint neutral shadow. **No glow, no gradients, no colored shadows.**
- Motion only as feedback to an action (status change, menu open). Respect reduced motion.
- Copy names things by what the user does: 「標記為有興趣」, not 「更新狀態」.
- Focus is a visible 1px tint outline, never a halo.
