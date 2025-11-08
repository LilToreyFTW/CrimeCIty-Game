@echo off
echo ========================================
echo GitHub Repository Push Script
echo ========================================
echo.

set /p REPO_URL="Enter your GitHub repository URL (e.g., https://github.com/username/repo-name.git): "

if "%REPO_URL%"=="" (
    echo No repository URL provided. Exiting.
    exit /b 1
)

echo Adding remote repository...
git remote add origin %REPO_URL%

echo Pushing to GitHub...
git branch -M main
git push -u origin main

echo.
echo Successfully pushed to GitHub!
echo Repository URL: %REPO_URL%
pause
