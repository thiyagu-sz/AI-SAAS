@echo off
REM Feedback System Verification Script (Windows)

echo.
echo ============================================================
echo  FEEDBACK SYSTEM VERIFICATION
echo ============================================================
echo.

REM Check 1: Components
echo Checking Components...
if exist "app\components\FeedbackForm.tsx" (
    echo   [OK] FeedbackForm.tsx found
) else (
    echo   [FAIL] FeedbackForm.tsx NOT found
)

if exist "app\components\FeedbackAnalyticsDashboard.tsx" (
    echo   [OK] FeedbackAnalyticsDashboard.tsx found
) else (
    echo   [FAIL] FeedbackAnalyticsDashboard.tsx NOT found
)

REM Check 2: API
echo.
echo Checking API Route...
if exist "app\api\feedback\route.ts" (
    echo   [OK] API route found
) else (
    echo   [FAIL] API route NOT found
)

REM Check 3: Documentation
echo.
echo Checking Documentation...
if exist "SETUP_NOW.md" (
    echo   [OK] SETUP_NOW.md found
) else (
    echo   [FAIL] SETUP_NOW.md NOT found
)

if exist "FEEDBACK_SETUP_MINIMAL.sql" (
    echo   [OK] FEEDBACK_SETUP_MINIMAL.sql found
) else (
    echo   [FAIL] FEEDBACK_SETUP_MINIMAL.sql NOT found
)

echo.
echo ============================================================
echo  ACTION REQUIRED - DO THIS NOW!
echo ============================================================
echo.
echo 1. Open Supabase Dashboard: https://app.supabase.com
echo 2. Click SQL Editor
echo 3. Click "New Query"
echo 4. Open file: FEEDBACK_SETUP_MINIMAL.sql
echo 5. Copy ALL the SQL code
echo 6. Paste into Supabase SQL Editor
echo 7. Click RUN
echo 8. Restart dev server: npm run dev
echo 9. Test feedback form
echo.
echo IMPORTANT: Feedback will NOT save until the table is created!
echo.
pause
