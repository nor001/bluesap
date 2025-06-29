#!/bin/bash

echo "🔍 Running pre-commit checks..."

# Run ESLint
echo "📝 Checking ESLint..."
npm run lint:strict
if [ $? -ne 0 ]; then
    echo "❌ ESLint errors found. Please fix them before committing."
    exit 1
fi

# Run TypeScript check
echo "🔧 Checking TypeScript..."
npm run type-check
if [ $? -ne 0 ]; then
    echo "❌ TypeScript errors found. Please fix them before committing."
    exit 1
fi

# Run Prettier check
echo "🎨 Checking code formatting..."
npm run format:check
if [ $? -ne 0 ]; then
    echo "❌ Code formatting issues found. Run 'npm run format' to fix them."
    exit 1
fi

echo "✅ All checks passed! Ready to commit."
exit 0 