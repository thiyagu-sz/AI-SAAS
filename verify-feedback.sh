#!/bin/bash
# Feedback System Verification Script

echo "🔍 Feedback System Verification"
echo "================================"
echo ""

# Check 1: FeedbackForm component exists
echo "✓ Checking components..."
if [ -f "app/components/FeedbackForm.tsx" ]; then
    echo "  ✅ FeedbackForm.tsx found"
else
    echo "  ❌ FeedbackForm.tsx NOT found"
fi

if [ -f "app/components/FeedbackAnalyticsDashboard.tsx" ]; then
    echo "  ✅ FeedbackAnalyticsDashboard.tsx found"
else
    echo "  ❌ FeedbackAnalyticsDashboard.tsx NOT found"
fi

# Check 2: API route exists
echo ""
echo "✓ Checking API..."
if [ -f "app/api/feedback/route.ts" ]; then
    echo "  ✅ API route found"
else
    echo "  ❌ API route NOT found"
fi

# Check 3: Documentation exists
echo ""
echo "✓ Checking documentation..."
if [ -f "SETUP_NOW.md" ]; then
    echo "  ✅ SETUP_NOW.md found"
else
    echo "  ❌ SETUP_NOW.md NOT found"
fi

if [ -f "FEEDBACK_SETUP_MINIMAL.sql" ]; then
    echo "  ✅ FEEDBACK_SETUP_MINIMAL.sql found"
else
    echo "  ❌ FEEDBACK_SETUP_MINIMAL.sql NOT found"
fi

# Check 4: Environment variables
echo ""
echo "✓ Checking environment..."
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "  ⚠️  NEXT_PUBLIC_SUPABASE_URL not set"
else
    echo "  ✅ NEXT_PUBLIC_SUPABASE_URL is set"
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "  ⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY not set"
else
    echo "  ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY is set"
fi

echo ""
echo "================================"
echo "📋 NEXT STEPS:"
echo "1. Open Supabase SQL Editor"
echo "2. Copy contents of: FEEDBACK_SETUP_MINIMAL.sql"
echo "3. Run in Supabase"
echo "4. Restart dev server: npm run dev"
echo "5. Test feedback form"
echo ""
echo "✨ After that, feedback will save to database!"
