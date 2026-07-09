This simplifies the direction perfectly. A minimalist, hyper-contrasted **monochrome system** (pure black and pure white) is incredibly striking. When white is your *only* brand color, color is no longer used for decoration—it is reserved entirely for **utility, feedback, and function**.

Here is your revised design system based on a strict black-and-white core with a **4px geometric grid system**.

---

## 1. The Pure Monochrome Palette

Every core element is built using pure black, pure white, and carefully measured steps of gray to handle hierarchy without introducing any hue.

| Token | Value | Applied Design Role |
| --- | --- | --- |
| `bg-pure` | `#000000` | Canvas base layer (The abyss) |
| `bg-surface` | `#141414` | Elevated structural blocks (Cards, sidebars, containers) |
| `bg-control` | `#242424` | Form inputs, default button states, search bars |
| `text-primary` | `#FFFFFF` | Core typography, titles, primary active icons |
| `text-secondary` | `#A3A3A3` | Standard body paragraphs, descriptions, inactive menu labels |
| `text-muted` | `#525252` | Form placeholders, disabled text, structural metadata |
| `border-line` | `#282828` | Clean, razor-thin UI division lines |

---

## 2. Functional & Status Colors (The Exceptions)

Because the system is entirely black and white, these status alerts will carry massive visual weight when they appear. Use them sparingly so they don't break the clean aesthetic.

| Token | Value | Functional Usage |
| --- | --- | --- |
| `status-success` | `#10B981` | Successful operations, completed steps, green lights |
| `status-warning` | `#F59E0B` | Destructive alerts warning, pending states, attention needed |
| `status-error` | `#EF4444` | System failures, invalid form inputs, critical blockages |
| `status-info` | `#3B82F6` | System notices, neutral updates, tooltips |

---

## 3. Strict 4px Grid Spacing & Padding

Every single layout block, gap, margin, and internal padding is perfectly divisible by 4. **No odd numbers, no 10px or 15px steps.**

```
4px   →  Micro gaps (inline icon-to-text, tiny status dots)
8px   →  Compact gaps (tag paddings, tight list spacing, small inputs)
12px  →  Subtle spacing (inner component elements, card text blocks)
16px  →  Standard spacing (default button horizontal padding, standard component gaps)
24px  →  Generous spacing (inside structural cards, content blocks)
32px  →  Layout gutters (margins between major sections, dashboard containers)
48px  →  Deep page structural separation

```

### Direct Blueprint Examples:

* **Default Button Padding:** `12px` top/bottom, `24px` left/right.
* **Text Input Fields:** `12px` top/bottom, `16px` left/right.
* **Standard Layout Card:** Completely wrapped in `24px` or `32px` internal padding.

---

## 4. Element States (The Interaction Logic)

In a pure white-on-black system, you show state changes by **shifting luminance** (making things brighter) or flipping colors into high-contrast inversions.

```
[ Primary White Buttons ]
Default     →  Background: #FFFFFF  |  Text: #000000
Hover       →  Background: #E5E5E5  |  Text: #000000  (Slightly dimmed white)
Active      →  Background: #CCCCCC  |  Text: #000000  (Pressed state)
Focus       →  Outline: 4px solid #FFFFFF with a 4px black gap spacer separating it.

[ Secondary / Control Buttons & Inputs ]
Default     →  Background: #242424  |  Text: #FFFFFF
Hover       →  Background: #323232  |  Text: #FFFFFF  (Illuminated state)
Active      →  Background: #1A1A1A  |  Text: #FFFFFF  (Deep clicked state)
Focus       →  Border shifts directly from #282828 to sharp #FFFFFF.

[ Global Disabled State ]
Disabled    →  Opacity hard-dropped to 32% across the entire element. Cursor: not-allowed.

```

---

## 5. Sizing & Geometry

### Component Heights (Divisible by 4)

* **Small Controls:** `32px` (dense lists, utility badges)
* **Standard Controls:** `40px` (default input fields, main action buttons)
* **Large / Hero Controls:** `48px` (promotional CTAs)

### Corners (Border Radii)

To match a crisp monochrome aesthetic, you can choose either sharp geometric or softly rounded edges. Choose one pattern and stick to it:

* `radius-none` (`0px`) → Ultimate brutalist, ultra-sharp architectural feel.
* `radius-sm` (`4px`) → Subtle rounding for compact items (checkboxes, tags).
* `radius-md` (`8px`) → Standard rounding for your `40px` height buttons and inputs.
* `radius-lg` (`12px`) → Smooth rounding for content cards and application modals.