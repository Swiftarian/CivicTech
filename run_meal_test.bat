@echo off
chcp 65001
echo ==========================================
echo  Starting Meal Delivery System Logic Test
echo ==========================================
echo.

cd /d "%~dp0"
python tests\test_meal_delivery.py

echo.
if %ERRORLEVEL% EQU 0 (
    echo ✅ All tests passed!
) else (
    echo ❌ Some tests failed. Please check the output above.
)
echo.
pause
