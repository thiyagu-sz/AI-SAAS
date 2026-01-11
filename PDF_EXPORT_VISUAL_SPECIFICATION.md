# Professional PDF Export - Visual Design Specification

## Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  2.5cm MARGIN (all sides)                               │
│                                                          │
│              📚 (Logo)                                   │
│    [Gradient Purple Background]                         │
│                                                          │
│         DOCUMENT TITLE HERE                             │
│         Professional Study Notes                        │
│                                                          │
├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
│                                                          │
│  Introduction paragraph here. This is the first         │
│  paragraph extracted from your content. It provides     │
│  context for the entire document.                       │
│                                                          │
│  Generated: January 11, 2026                            │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ## Section Heading One                                 │
│  ___________________                                    │
│                                                          │
│  This is the main body text. It uses justified          │
│  alignment for a professional appearance. The text      │
│  fills evenly from left to right margins.               │
│                                                          │
│  ### Subsection                                         │
│                                                          │
│  More detailed content with proper spacing between      │
│  sections and subsections.                              │
│                                                          │
│  ## Section Heading Two                                 │
│  ___________________                                    │
│                                                          │
│  Tables are formatted professionally:                   │
│                                                          │
│  ┌──────────┬──────────┐                                │
│  │ Header 1 │ Header 2 │ (Gray background)             │
│  ├──────────┼──────────┤                                │
│  │ Data 1   │ Data 2   │ (White background)            │
│  │ Data 3   │ Data 4   │ (Light gray, alternating)     │
│  └──────────┴──────────┘                                │
│                                                          │
│  [PAGE BREAK - NEW PAGE STARTS HERE]                    │
│                                                          │
│  ## Section Heading Three                               │
│  ___________________                                    │
│                                                          │
│  Content continues across pages with proper spacing     │
│  and heading protection (no orphaned headings).         │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  This document was automatically generated and is       │
│  ready for publication.                                 │
│                                                          │
│  2.5cm MARGIN (bottom)                                  │
└─────────────────────────────────────────────────────────┘
```

## Typography Scale

```
HEADING HIERARCHY:

H1 (Title)
├─ Font: -apple-system, Helvetica Neue, Arial
├─ Size: 32pt
├─ Weight: Bold (700)
├─ Color: #000000 (black)
└─ Spacing: 20px below

H2 (Section)
├─ Font: -apple-system, Helvetica Neue, Arial
├─ Size: 20pt
├─ Weight: Bold (700)
├─ Color: #000000 (black)
├─ Border: 1px solid #e0e0e0 (bottom)
├─ Spacing: 1.5em above, 0.8em below
└─ Print: page-break-after: avoid

H3 (Subsection)
├─ Font: -apple-system, Helvetica Neue, Arial
├─ Size: 16pt
├─ Weight: Bold (700)
├─ Color: #1a1a1a (very dark gray)
├─ Spacing: 1em above, 0.6em below
└─ Print: page-break-after: avoid

Body Text
├─ Font: Georgia, Times New Roman, serif
├─ Size: 11pt
├─ Weight: Regular (400)
├─ Color: #000000 (black)
├─ Line Height: 1.6
├─ Alignment: Justified
└─ Spacing: 1em between paragraphs

Intro Text
├─ Font: Georgia, Times New Roman, serif
├─ Size: 11pt
├─ Weight: Regular (400)
├─ Color: #333333 (dark gray)
├─ Background: #f9f9f9 (very light gray)
├─ Border-left: 4px solid #667eea (purple)
└─ Padding: 15px

Subtitle
├─ Font: -apple-system, Helvetica Neue, Arial
├─ Size: 14pt
├─ Weight: Regular (400)
├─ Color: #666666 (medium gray)
├─ Style: Italic
└─ Spacing: 10px above

Superscript
├─ Font: Inherited
├─ Size: 0.7em (70% of parent)
├─ Position: Super (raised)
└─ Example: Text¹ here
```

## Color Palette

```
PRIMARY COLORS:
┌─────────────────────────────────────────┐
│ #667eea (Purple)                        │
│ └─ Logo background, accents, borders    │
│                                         │
│ #000000 (Black)                         │
│ └─ All text, headings, strong           │
│                                         │
│ #ffffff (White)                         │
│ └─ Background, page color               │
└─────────────────────────────────────────┘

SECONDARY COLORS:
┌─────────────────────────────────────────┐
│ #333333 (Dark Gray)                     │
│ └─ Intro text, secondary text           │
│                                         │
│ #666666 (Medium Gray)                   │
│ └─ Subtitle, labels                     │
│                                         │
│ #999999 (Light Gray)                    │
│ └─ Footer text, secondary info          │
│                                         │
│ #f9f9f9 (Lightest Gray)                 │
│ └─ Background for intro section         │
│                                         │
│ #e0e0e0 (Light Gray Borders)            │
│ └─ Heading underlines, borders          │
│                                         │
│ #f0f0f0 (Table Header Background)       │
│ └─ Table header cells                   │
│                                         │
│ #cccccc (Table Borders)                 │
│ └─ Table cell borders                   │
│                                         │
│ #555555 (Blockquote Text)               │
│ └─ Emphasized text in blockquotes       │
└─────────────────────────────────────────┘
```

## Spacing Reference

```
VERTICAL SPACING:

Document Header:
  [Logo] 20px gap
  [Title] 10px gap
  [Subtitle] padding 10px
  ═══════════════════════════ 20px border-bottom
                              margin-bottom: 2.5cm

Intro Section:
  [Intro Text] margin: 0.5em
  [Date] margin: 0.5em
  padding: 15px all sides
  border-left: 4px purple

Content:
  margin-top: 2em before content start

Section (H2):
  margin-top: 1.5em
  margin-bottom: 0.8em
  padding-bottom: 8px
  border-bottom: 1px

Subsection (H3):
  margin-top: 1em
  margin-bottom: 0.6em

Paragraph:
  margin-bottom: 1em

List Item:
  margin-bottom: 0.5em

Table:
  margin: 1.5em 0

Blockquote:
  margin: 1.5em 0
  padding-left: 1.5em

Footer:
  margin-top: 3em
  padding-top: 1em
  border-top: 1px
```

## Component Styles

### Header Section
```
┌─────────────────────────────────────┐
│        📚                           │  60x60px logo
│    [Gradient Purple Bg]            │  Position: center
│        0 auto 20px                 │
│                                     │
│  DOCUMENT TITLE                     │  32pt, bold, black
│                                     │  margin-bottom: 10px
│                                     │
│  Professional Study Notes           │  14pt, italic, gray
│                                     │  margin-top: 10px
│                                     │
├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤  2px solid #000
│ margin-bottom: 2.5cm               │  padding-bottom: 20px
└─────────────────────────────────────┘
```

### Intro Section
```
┌─────────────────────────────────────┐
│ ▌ Introduction paragraph here       │  4px left border
│   describing the document and its   │  #667eea purple
│   purpose for the reader...         │
│                                     │  Background: #f9f9f9
│   Generated: January 11, 2026       │  Padding: 15px all
│                                     │  margin-bottom: 2em
│                                     │  border-left: 4px
└─────────────────────────────────────┘
```

### Section Heading
```
## Section Heading Name
─────────────────────────────────────

Font: -apple-system, 20pt, bold, black
Underline: 1px solid #e0e0e0
margin-top: 1.5em
margin-bottom: 0.8em
padding-bottom: 8px
page-break-after: avoid (print)
```

### Table Example
```
┌──────────────────┬──────────────────┐
│ Header 1         │ Header 2         │  Gray background (#f0f0f0)
├──────────────────┼──────────────────┤  Black text, bold
│ Cell Data        │ Cell Data        │  1px borders (#cccccc)
├──────────────────┼──────────────────┤  
│ Cell Data        │ Cell Data        │  Alternating rows:
├──────────────────┼──────────────────┤  white and #f9f9f9
│ Cell Data        │ Cell Data        │  Padding: 10px 12px
└──────────────────┴──────────────────┘  Font-size: 10pt
```

### Blockquote
```
┌─────────────────────────────────────┐
│ ▌ This is a blockquote or           │  4px left border
│   emphasized section. It uses       │  #667eea purple
│   italic styling and a light        │
│   background to stand out.          │  Background: Light gray
│                                     │  Color: #555555 (gray text)
│                                     │  Font-style: italic
└─────────────────────────────────────┘  Padding: 1.5em
                                        margin: 1.5em 0
```

### Footer Section
```
┌─────────────────────────────────────┐
│                                     │  margin-top: 3em
├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤  border-top: 1px #e0e0e0
│  This document was automatically    │  padding-top: 1em
│  generated and is ready for         │  text-align: center
│  publication.                       │  font-size: 9pt
│                                     │  color: #999999
└─────────────────────────────────────┘  page-break-inside: avoid
```

## Print Specifications

```
PAPER:
- Size: A4 (210mm × 297mm)
- Orientation: Portrait (recommended)
- Color: White (#ffffff)

MARGINS:
- Top: 2.5cm
- Right: 2.5cm
- Bottom: 2.5cm
- Left: 2.5cm

PRINT SETTINGS:
- Background Graphics: Recommended (to show colors)
- Headers & Footers: Optional (browser can add page numbers)
- Scale: 100% (no scaling)
- Paper Quality: Standard or High

PAGE BREAKS:
- After H2 headings: avoid
- Inside paragraphs: avoid
- Inside lists: avoid
- Inside tables: avoid
- Inside blockquotes: avoid
- Minimum orphans/widows: 3 lines

FONTS:
- All fonts are system fonts (no external loading required)
- Substitution available on all browsers
```

## Responsive Behavior

### Screen Display (Before Printing)
```
Max-width: 210mm (A4 width)
Padding: 40px all sides
Readable on screen without zooming
```

### Print Output
```
Matches A4 paper exactly
No margins doubled
All spacing optimized for paper
Fonts render clearly at 11pt body text
```

## Accessibility Features

```
✓ Semantic HTML structure (h1, h2, h3, p, strong, em)
✓ Proper color contrast (black text on white background)
✓ Readable font sizes (11pt minimum)
✓ Proper heading hierarchy
✓ Table structure with proper th/td
✓ List structure with proper ul/li
✓ Print-friendly design (no gray text that fades)
```

## Visual Design Principles

1. **Hierarchy**
   - Clear visual distinction between headings
   - Proper spacing creates natural grouping
   - Font sizes guide reading order

2. **Readability**
   - 11pt serif font for body text
   - 1.6 line height for comfortable reading
   - Justified alignment for professional look
   - Adequate margin breathing room

3. **Professional Look**
   - Clean color scheme (purple + black + white)
   - Subtle borders and lines
   - Consistent spacing throughout
   - Modern system fonts

4. **Printability**
   - High contrast text
   - Proper page breaks
   - Widow/orphan control
   - Print-optimized colors

## Export Examples

### Simple Document
```
# My Study Notes

This is an introduction to my notes.

## Key Concepts
The main idea is important.

### Important Detail
This detail supports the main idea.

## Conclusion
Summary of what we learned.
```

### Complex Document with All Features
```
# Advanced Biology
Study notes for AP Biology final exam.

## Photosynthesis Overview
The process by which plants convert light energy¹ into 
chemical energy. This complex process occurs in two phases².

### Light Reactions
Occur in the thylakoid membrane.

**Important**: Water molecules are split.

### Calvin Cycle
Also called the *dark reactions*.

| Phase | Location | Output |
|-------|----------|--------|
| Light | Thylakoid | ATP, NADPH |
| Dark | Stroma | Glucose |

> Remember: Light reactions produce energy carriers that
> power the Calvin Cycle!

## Key Terms
- Chlorophyll: Green pigment
- Stroma: Fluid part of chloroplast
- Thylakoid: Disc-shaped structure

## Summary
Photosynthesis converts sunlight into chemical energy
through two main processes³.
```

---

## Design Consistency

**All elements maintain consistent:**
- Font family choices
- Color palette
- Spacing and alignment
- Typography scale
- Border styles
- Icon/logo usage
- Component styling

This ensures professional, cohesive appearance across all exported documents.
