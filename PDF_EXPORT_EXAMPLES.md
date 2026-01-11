# PDF Export - Complete Transformation Examples

## Example 1: Simple Study Notes

### Input Content
```markdown
## Introduction to Python

Python is a high-level programming language used for web development, data analysis, and automation.
Visit https://www.python.org for official documentation.

### Key Features
- **Easy to learn** with simple *syntax*
- Supports multiple programming paradigms
- Has a vast ecosystem of libraries
- See https://pypi.org for packages

### Important Note[1]
> "Python's philosophy is simplicity and readability" - Guido van Rossum

### Example Code
| Feature | Difficulty |
|---------|-----------|
| *Basics* | **Easy** |
| Classes | **Medium** |
```

### Processing Steps

**Step 1: URL Removal**
```
Input:  "Visit https://www.python.org for official documentation."
Output: "Visit  for official documentation."
        → "Visit for official documentation." (after cleanup)

Input:  "See https://pypi.org for packages"
Output: "See  for packages"
        → "See for packages" (after cleanup)
```

**Step 2: Title Extraction**
```
Pattern: ^##\s+(.+?)$
Match: "## Introduction to Python"
Result: docTitle = "Introduction to Python"
```

**Step 3: Intro Extraction**
```
Lines to filter:
  - "## Introduction to Python" → Skipped (starts with #)
  - "Python is a high-level..." → ✓ Selected (first valid line)
  - "Visit https://www.python.org..." → Not evaluated (already selected)

Result: introParagraph = "Python is a high-level programming language used for web development, data analysis, and automation."
```

**Step 4: HTML Sanitization**
```
Conversions:
  & → &amp;
  < → &lt;
  > → &gt; (important for blockquotes)

Result (excerpt):
"&gt; "Python's philosophy is simplicity and readability" - Guido van Rossum"
```

**Step 5: Heading Conversion**
```
Before:
## Introduction to Python
### Key Features
### Important Note[1]

After:
<h2>Introduction to Python</h2>
<h3>Key Features</h3>
<h3>Important Note[1]</h3>
```

**Step 6: Text Formatting**
```
Before:
- **Easy to learn** with simple *syntax*
- Important Note[1]
| *Basics* | **Easy** |

After:
- <strong>Easy to learn</strong> with simple <em>syntax</em>
- Important Note<sup>1</sup>
| <em>Basics</em> | <strong>Easy</strong> |
```

**Step 7: Blockquote Conversion**
```
Before (after sanitization):
&gt; "Python's philosophy is simplicity and readability" - Guido van Rossum

After:
<blockquote>"Python's philosophy is simplicity and readability" - Guido van Rossum</blockquote>
```

**Step 8: List Conversion**
```
Before:
- **Easy to learn** with simple <em>syntax</em>
- Supports multiple programming paradigms
- Has a vast ecosystem of libraries

After:
<ul>
<li><strong>Easy to learn</strong> with simple <em>syntax</em></li>
<li>Supports multiple programming paradigms</li>
<li>Has a vast ecosystem of libraries</li>
</ul>
```

**Step 9: Table Conversion**
```
Before:
| Feature | Difficulty |
|---------|-----------|
| *Basics* | **Easy** |
| Classes | **Medium** |

After:
<table><tbody>
<tr><th>Feature</th><th>Difficulty</th></tr>
<tr><td><em>Basics</em></td><td><strong>Easy</strong></td></tr>
<tr><td>Classes</td><td><strong>Medium</strong></td></tr>
</tbody></table>
```

### Final HTML Output
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Introduction to Python</title>
  <style>
    /* 300+ lines of CSS */
  </style>
</head>
<body>
  <div class="document-header">
    <div class="logo">📚</div>
    <h1>Introduction to Python</h1>
    <p class="document-subtitle">Professional Study Notes</p>
  </div>

  <div class="intro-section">
    <p class="intro-text">Python is a high-level programming language used for web development, data analysis, and automation.</p>
    <p class="intro-text"><strong>Generated:</strong> January 15, 2026</p>
  </div>

  <div class="content">
    <h2>Introduction to Python</h2>
    <p>Python is a high-level programming language used for web development, data analysis, and automation. Visit for official documentation.</p>

    <h3>Key Features</h3>
    <ul>
    <li><strong>Easy to learn</strong> with simple <em>syntax</em></li>
    <li>Supports multiple programming paradigms</li>
    <li>Has a vast ecosystem of libraries</li>
    </ul>

    <h3>Important Note<sup>1</sup></h3>
    <blockquote>"Python's philosophy is simplicity and readability" - Guido van Rossum</blockquote>

    <h3>Example Code</h3>
    <table><tbody>
    <tr><th>Feature</th><th>Difficulty</th></tr>
    <tr><td><em>Basics</em></td><td><strong>Easy</strong></td></tr>
    <tr><td>Classes</td><td><strong>Medium</strong></td></tr>
    </tbody></table>
  </div>

  <div class="document-footer">
    <p>This document was automatically generated and is ready for publication.</p>
  </div>
</body>
</html>
```

### Rendered in PDF
```
┌─────────────────────────────────────┐
│         📚 Document Header          │
│   Introduction to Python            │
│    Professional Study Notes         │
├─────────────────────────────────────┤
│ Python is a high-level programming  │
│ language used for web development,  │
│ data analysis, and automation.      │
│                                     │
│ Generated: January 15, 2026         │
├─────────────────────────────────────┤
│                                     │
│ Introduction to Python              │
│                                     │
│ Python is a high-level programming  │
│ language used for web development,  │
│ data analysis, and automation. Visit │
│ for official documentation.         │
│                                     │
│ Key Features                        │
│                                     │
│ • Easy to learn with simple syntax  │
│ • Supports multiple programming    │
│   paradigms                         │
│ • Has a vast ecosystem of libraries │
│ • See for packages                  │
│                                     │
│ Important Note¹                     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ "Python's philosophy is         │ │
│ │  simplicity and readability"    │ │
│ │                 - Guido van R.  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Example Code                        │
│                                     │
│ │ Feature     │ Difficulty         │ │
│ ├─────────────┼────────────────────┤ │
│ │ Basics      │ Easy               │ │
│ │ Classes     │ Medium             │ │
│                                     │
├─────────────────────────────────────┤
│ This document was automatically     │
│ generated and is ready for pub...   │
└─────────────────────────────────────┘
```

---

## Example 2: Complex Business Content

### Input Content
```markdown
## Ecommerce Platform Strategy 2026

Comprehensive guide for implementing modern ecommerce solutions. Read more at https://ecommerce-guide.example.com.

### Executive Summary
Our **strategy** focuses on *three core pillars*:
1. Customer experience (CX)
2. Data analytics
3. Operational efficiency

> "The best customer service is if the customer doesn't need to call you" - Steve Jobs

### Technical Stack

| Layer | Technology | *Status* |
|-------|-----------|---------|
| Frontend | **React** 18+ | Stable |
| Backend | Node.js | *Beta* |
| Database | PostgreSQL | Stable |

Visit https://tech-stack.dev for details.

### Key Metrics[1]
- Conversion rate: **2.5%** (target: 3%)
- Customer lifetime value: *$150*
- Average order value: **$45**

### Implementation Timeline
- **Q1**: Foundation setup
- **Q2**: Feature development
- **Q3**: Testing and optimization
- **Q4**: Production launch

Learn more at www.implementation-guide.com.
```

### Processing Breakdown

**URL Removal:**
```
✗ https://ecommerce-guide.example.com    → removed
✗ https://tech-stack.dev                 → removed
✗ www.implementation-guide.com           → removed
```

**Title Extraction:**
```
Match: "## Ecommerce Platform Strategy 2026"
Result: docTitle = "Ecommerce Platform Strategy 2026"
```

**Intro Extraction:**
```
Selected: "Comprehensive guide for implementing modern ecommerce solutions. Read more at"
Cleaned: "Comprehensive guide for implementing modern ecommerce solutions. Read more at"
(after URL removal)
```

**Markdown Conversions:**
```
**strategy**                      → <strong>strategy</strong>
*three core pillars*             → <em>three core pillars</em>
[1]                              → <sup>1</sup>
> "The best customer service..." → <blockquote>...</blockquote>
| Layer | Technology | *Status* | → <table>...</table>
- Q1: Foundation setup            → <li>Q1: Foundation setup</li>
```

### Final PDF Features

**Visible Content:**
- Title: "Ecommerce Platform Strategy 2026"
- Intro: "Comprehensive guide for implementing modern ecommerce solutions. Read more at"
- Section headings: Clear hierarchy with borders
- Emphasis: Bold technical terms, italicized concepts
- Table: Professional formatting with alternating row colors
- Lists: Properly formatted bullet points
- Blockquotes: Left-bordered quotes
- No URLs visible anywhere

---

## Example 3: Academic Notes

### Input Content
```markdown
## Quantum Mechanics: Wave-Particle Duality

Understanding the fundamental nature of light and matter. Additional resources available at https://quantummechanics101.edu/wave-duality.

### Historical Context
The **double-slit experiment** demonstrated that particles exhibit *wave-like* behavior[1]. This groundbreaking discovery challenged classical physics.

Key researchers:
- *Albert Einstein* - photoelectric effect
- **Niels Bohr** - quantum model
- Erwin Schrödinger - wave equation

### Mathematical Foundation

| Concept | Formula | *Discovered* |
|---------|---------|-------------|
| Energy | **E = hf** | 1900 |
| Wavelength | *λ = h/p* | 1924 |
| Uncertainty | **Δx·Δp ≥ h/4π** | 1927 |

### Important Principle[2]
> "God does not play with dice" - Albert Einstein, regarding quantum randomness

### Key Equations
The **Schrödinger Equation**[3]:
```
iℏ ∂ψ/∂t = Ĥψ
```

This fundamental _equation_ describes particle behavior.

For more information, see www.physics.org.
```

### Transformations Summary

| Element | Input | Output |
|---------|-------|--------|
| URLs | https://quantummechanics101.edu/wave-duality | (removed) |
| Title | ## Quantum Mechanics: Wave-Particle Duality | <h1>Quantum Mechanics...</h1> |
| Bold | **double-slit experiment** | <strong>double-slit experiment</strong> |
| Italic | *wave-like* | <em>wave-like</em> |
| Superscript | [1] | <sup>1</sup> |
| Lists | - *Albert Einstein* | <ul><li><em>Albert Einstein</em>...</li></ul> |
| Table | \|Concept\|Formula\| | <table><thead><tr>... |
| Blockquote | > "God does not play..." | <blockquote>"God does not play..."</blockquote> |
| Underscores | _equation_ | equation |
| Backticks | `iℏ ∂ψ/∂t = Ĥψ` | iℏ ∂ψ/∂t = Ĥψ |

---

## Example 4: Edge Cases & Special Situations

### Situation A: Multiple URLs in Single Sentence
```
Input:  "Visit https://example.com, https://example.org and www.test.com for resources"
Output: "Visit ,  and  for resources"
Clean:  "Visit and for resources"
```

### Situation B: URLs with Query Parameters
```
Input:  "Check https://example.com/path?id=123&name=test for details"
Output: "Check  for details"
Result: "Check for details"
```

### Situation C: Nested Formatting
```
Input:  "***bold and italic***"
Step 1: "**_bold and italic_**" (after bold converts)
Step 2: "**bold and italic**" (after underscore removal)
Step 3: "<strong>bold and italic</strong>"
Output: <strong>bold and italic</strong>
```

### Situation D: Multiple Headings
```
Input:  "## Title 1
         ### Subsection
         ## Title 2"

Extraction: Uses FIRST ## heading
Result:    docTitle = "Title 1"
```

### Situation E: No Markdown Formatting
```
Input:  "Just plain text with https://url.com in it"
Step 1: Remove URL → "Just plain text with  in it"
Step 2: Cleanup → "Just plain text with in it"
Output: Wrapped in <p> tags → "<p>Just plain text with in it</p>"
```

### Situation F: Only URLs
```
Input:  "https://example.com https://test.org www.site.com"
Output: "   " (all removed)
Result: Nothing to display (edge case)
```

### Situation G: Code Block with URLs
```
Input:  "Example:
        ```
        GET https://api.example.com/users
        ```"

Note: Code blocks with triple backticks are NOT specially handled.
The URL inside would be removed: "GET  /users"
```

### Situation H: Empty Lines and Whitespace
```
Input:  "Text 1


         Text 2"
        
After processing: "<p>Text 1</p><p>Text 2</p>"
Multiple newlines → paragraph break
```

---

## Complete Before/After Comparison

### Original (Raw Markdown)
```
## Web Development Essentials

Learn the fundamentals of modern web development. See https://webdev.example.com for comprehensive guides.

### Core Technologies
- **HTML** - Structure and semantics
- *CSS* - Styling and responsive design
- **JavaScript** - Interactivity and dynamics

### Best Practices[1]
> "Code is read much more often than it is written" - Guido van Rossum

### Performance Metrics
| Metric | Target | *Status* |
|--------|--------|---------|
| Lighthouse | **90+** | Green |
| Page Load | *< 2s* | Good |

Visit www.performance.guide for optimization tips.
```

### Generated PDF Shows
```
Web Development Essentials

Learn the fundamentals of modern web development. See for comprehensive guides.

Core Technologies
• HTML - Structure and semantics
• CSS - Styling and responsive design
• JavaScript - Interactivity and dynamics

Best Practices¹
┌─────────────────────────────────────┐
│ Code is read much more often than   │
│ it is written - Guido van Rossum    │
└─────────────────────────────────────┘

Performance Metrics
│ Metric      │ Target │ Status │
├─────────────┼────────┼────────┤
│ Lighthouse  │ 90+    │ Green  │
│ Page Load   │ < 2s   │ Good   │

Visit for optimization tips.

[Footer: This document was automatically generated...]
```

---

## Summary of Transformations

| Input Element | Output Element | Visible in PDF |
|---------------|----------------|----------------|
| `## Heading` | `<h2>Heading</h2>` | **Heading** (bold, larger) |
| `### Subheading` | `<h3>Subheading</h3>` | Subheading (bold, medium) |
| `**bold**` | `<strong>bold</strong>` | **bold** (formatted) |
| `*italic*` | `<em>italic</em>` | *italic* (formatted) |
| `[1]` | `<sup>1</sup>` | ¹ (superscript) |
| `> quote` | `<blockquote>quote</blockquote>` | (quoted block) |
| `- item` | `<li>item</li>` in `<ul>` | • item |
| `\| col1 \| col2 \|` | `<table><tr><td>` | (formatted table) |
| `https://...` | (removed) | (not visible) |
| `www.example.com` | (removed) | (not visible) |
| `_text_` | text (plain) | text |
| `` `code` `` | code (plain) | code |
| Multiple `\n\n` | `</p><p>` | (paragraph break) |

---

## Quality Checklist

When reviewing a PDF export, verify:

- ✅ No URLs visible (all removed)
- ✅ Title extracted from ## heading or uses default
- ✅ Intro paragraph displays correctly
- ✅ All bold/italic formatting preserved as HTML
- ✅ Headings properly formatted (h2, h3)
- ✅ Lists display as bullet points
- ✅ Tables have proper rows/columns
- ✅ Blockquotes have left border
- ✅ No markdown symbols visible (## **, *, etc.)
- ✅ Paragraph breaks where expected (double newlines)
- ✅ Professional header with logo
- ✅ Generation date included
- ✅ Professional footer present
- ✅ A4 page format (when printing to PDF)
- ✅ 2.5cm margins all sides
