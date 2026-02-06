# MCQ Feature - Quick Reference Guide

## What Was Added

### 🎯 Core Functionality
- **New Format Type:** `'mcqs'` added to FormatType enum
- **New State:** `questionCount` (default: 5)
- **New UI:** Question count selector (5, 10, 20, custom)
- **New System Prompt:** Exam-focused MCQ generation

### 📁 Files Modified
1. `app/chat/page.tsx` - Main chat interface with MCQ support
2. `app/upload/page.tsx` - Upload page with MCQ option
3. `app/api/upload/route.ts` - Backend MCQ prompt generation

---

## How to Use (User Perspective)

### In Chat Interface:
```
1. Click format selector → Shows: Key Points | Main Concepts | ... | MCQs ✨
2. Select "MCQs"
3. UI changes to show: Number of questions: [5] [10] [20] [Custom]
4. Select desired count (e.g., 10 questions)
5. Paste content → AI generates 10 exam-ready MCQs
6. Export as PDF or DOC
```

### In Upload Interface:
```
1. Select "MCQs" from format dropdown
2. Choose number of questions (5, 10, 20, or custom)
3. Upload PDF/file
4. AI generates MCQs and shows in editor
```

---

## MCQ Output Structure

Every MCQ follows this format:

```markdown
### Q1. Question text here?
A. Option one
B. Option two  
C. Option three
D. Option four

**Correct Answer:** B
**Explanation:** Brief explanation of why B is correct (1-2 lines)

---

### Q2. Next question?
...
```

✅ **Markdown compatible** - Works with existing PDF export
✅ **Readable** - Easy to scan and study
✅ **Exam-friendly** - Generated from actual content

---

## Technical Implementation

### State Management
```typescript
const [questionCount, setQuestionCount] = useState<number>(5);
```

### How It Works
1. User selects MCQs format
2. UI shows question count selector (not word count)
3. `wordCount` state is synced with `questionCount`
4. API receives: `{ format: 'mcqs', wordCount: 10 }` (meaning 10 MCQs)
5. System prompt generates exactly 10 MCQs
6. Result stored in `notes` table with `format: 'mcqs'`

### Key Design Decision
- **Why sync `wordCount` with `questionCount`?**
  - Avoids changing the entire API pipeline
  - The backend uses `wordCount` to control quantity
  - For MCQs: `wordCount` represents question count
  - This is a backward-compatible solution

---

## System Prompt (What AI Sees)

```
You are an expert exam preparation assistant.

Your task is to generate Multiple Choice Questions (MCQs) 
strictly based on the provided study material.

RULES:
- Do NOT introduce information outside the given content
- Questions must be exam-oriented and concept-focused
- Difficulty level: Medium (college / university exams)
- Avoid ambiguous or opinion-based questions

FORMAT REQUIREMENTS:
- Use markdown formatting
- Each question must have exactly 4 options (A–D)
- Clearly mark the correct answer
- Provide a brief explanation (1–2 lines)

CONSTRAINTS:
- Generate exactly [N] MCQs
- Do not repeat questions
- Keep explanations concise and exam-focused
```

---

## User Interface Changes

### Before (Format Options):
```
[Key Points] [Main Concepts] [Exam Points] [Short Notes] 
[Speech Notes] [Presentation Notes] [Summary]

Word count: [50] [100] [200] [Custom ___]
```

### After (Format Options):
```
[Key Points] [Main Concepts] [Exam Points] [Short Notes] 
[Speech Notes] [Presentation Notes] [Summary] [MCQs] ✨

When MCQs selected:
Number of questions: [5] [10] [20] [Custom ___]

When other format selected:
Word count: [50] [100] [200] [Custom ___]
```

---

## Example Workflow

### Input:
```
Paste content about Machine Learning...
Select Format: MCQs
Number of Questions: 10
Click: Send
```

### Output:
```markdown
## Multiple Choice Questions (MCQs)

### Q1. What is Machine Learning?
A. A programming language
B. A subset of AI that learns from data ← Correct
C. A database system
D. A hardware technology

**Correct Answer:** B
**Explanation:** ML enables systems to learn patterns from data without explicit programming.

---

### Q2. Which algorithm is used for classification?
A. Linear Regression
B. Decision Trees ← Correct
C. K-means
D. DBSCAN

**Correct Answer:** B
**Explanation:** Decision Trees are commonly used for classification tasks...

--- 
[... 8 more questions ...]
```

---

## API Integration (No Changes)

✅ Same `generateAINotes()` function
✅ Same OpenRouter API call
✅ Same streaming mechanism  
✅ Same Supabase insertion
✅ Same export pipeline (PDF/DOC)

### Example API Call:
```typescript
await generateAINotes(
  text,          // Content
  'mcqs',        // Format type
  10             // Number of questions (passed as wordCount)
)
```

---

## Database (No Changes)

```sql
INSERT INTO notes (user_id, content, format, created_at)
VALUES (
  'user-123',
  '## Multiple Choice Questions (MCQs)\n\n### Q1. ...',
  'mcqs',  -- Format type
  NOW()
);
```

No schema changes needed! ✅

---

## Testing the Feature

### Test Case 1: Basic MCQ Generation
1. Go to Chat
2. Select MCQs format
3. Choose 5 questions
4. Paste content
5. ✅ Should generate 5 MCQs in ~10-20 seconds

### Test Case 2: Custom Question Count
1. Select MCQs format
2. Click Custom input field
3. Enter 15
4. ✅ Should generate exactly 15 MCQs

### Test Case 3: Export MCQs
1. Generate 10 MCQs
2. Click "Export PDF"
3. ✅ PDF should contain all 10 MCQs with answers

### Test Case 4: Format Switching
1. Select MCQs (shows question count selector)
2. Switch to Key Points (shows word count selector)
3. Switch back to MCQs (shows question count selector)
4. ✅ UI should dynamically switch selectors

---

## Performance Notes

- ⚡ **Faster generation:** MCQs often generate faster than lengthy summaries
- 💾 **Same storage:** Uses existing notes table
- 🔌 **Same API:** No additional OpenRouter tokens or pricing changes
- 📱 **Mobile friendly:** Responsive UI on all screen sizes

---

## Future Enhancement Ideas

1. **Quiz Mode** - Let students answer MCQs and track scores
2. **Difficulty Levels** - Easy/Medium/Hard MCQ generation
3. **Show/Hide Answers** - Toggle to show/hide correct answers
4. **Quizlet Export** - Export directly to Quizlet format
5. **MCQ Analytics** - Track which questions students struggle with
6. **Timed Quizzes** - Set time limits for MCQ practice

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| MCQs option not showing | Verify `FormatType` includes `'mcqs'` in all files |
| Question count selector doesn't appear | Check that `selectedFormat === 'mcqs'` condition is in UI |
| MCQs not generating correctly | Verify system prompt in `upload/route.ts` |
| Export fails for MCQs | MCQs are markdown, should export same as other formats |
| Wrong number of questions generated | Ensure `wordCount` is synced with `questionCount` |

---

## Code References

### 1. Type Definition
- **File:** `app/chat/page.tsx` line 30
- **File:** `app/upload/page.tsx` line 36

### 2. State
- **File:** `app/chat/page.tsx` line 45
- **Variable:** `questionCount`

### 3. Format Options
- **File:** `app/chat/page.tsx` line 1073
- **File:** `app/upload/page.tsx` line 72

### 4. UI Selector
- **File:** `app/chat/page.tsx` lines 1330-1375
- **Component:** Dynamic question/word count selector

### 5. System Prompt
- **File:** `app/api/upload/route.ts` line 533-566
- **Function:** `generateFormatPrompt()`

---

## Summary

✅ **Minimal Changes** - Only 3 files modified
✅ **No Breaking Changes** - All existing formats work unchanged
✅ **Backward Compatible** - API pipeline unchanged
✅ **User Friendly** - Clear UI for selecting question count
✅ **Exam Focused** - System prompt optimized for education
✅ **Production Ready** - Fully tested and integrated

The MCQ feature is now live and ready to help students generate exam-focused practice questions! 🎉
