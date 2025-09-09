
#!/bin/bash

# Create GitHub Upload Package
echo "🚀 Creating GitHub upload package..."

# Create temporary directory for clean files
mkdir -p github-upload-temp

# Copy source code
echo "📁 Copying source files..."
cp -r client github-upload-temp/
cp -r server github-upload-temp/
cp -r shared github-upload-temp/
cp -r migrations github-upload-temp/

# Copy configuration files
echo "⚙️ Copying configuration files..."
cp package.json github-upload-temp/
cp tsconfig.json github-upload-temp/
cp tailwind.config.ts github-upload-temp/
cp drizzle.config.ts github-upload-temp/
cp vite.config.ts github-upload-temp/
cp components.json github-upload-temp/
cp postcss.config.js github-upload-temp/
cp .gitignore github-upload-temp/
cp .env.example github-upload-temp/

# Copy documentation
echo "📚 Copying documentation..."
cp README.md github-upload-temp/
cp API_DOCUMENTATION.md github-upload-temp/
cp COVERAGE_MAPS_API_DOCUMENTATION.md github-upload-temp/
cp CONTRIBUTING.md github-upload-temp/
cp GITHUB_SETUP.md github-upload-temp/
cp GITHUB_UPLOAD_CHECKLIST.md github-upload-temp/
cp SECURITY_ANALYSIS.md github-upload-temp/
cp SECURITY_AUDIT_REPORT.md github-upload-temp/
cp SENSITIVE_DATA_REMOVAL_GUIDE.md github-upload-temp/
cp LICENSE github-upload-temp/

# Copy policy files
echo "📄 Copying policy files..."
cp DOTM_Device_Compatibility_Policy.html github-upload-temp/
cp generate-pdf.js github-upload-temp/

# Copy test files
echo "🧪 Copying test files..."
cp test-*.js github-upload-temp/

# Remove sensitive files and directories from temp
echo "🔒 Removing sensitive files..."
rm -rf github-upload-temp/server/.env
rm -rf github-upload-temp/**/*.env
rm -rf github-upload-temp/**/node_modules
rm -rf github-upload-temp/**/.cache
rm -rf github-upload-temp/**/dist
rm -rf github-upload-temp/**/build

# Create tar.gz archive
echo "📦 Creating tar.gz archive..."
cd github-upload-temp
tar --exclude="*.log" --exclude="*.tmp" --exclude="*/.DS_Store" --exclude="*/Thumbs.db" -czf ../DeviceInsights-GitHub-Upload.tar.gz .
cd ..

# Clean up temp directory
rm -rf github-upload-temp

# Show file info
echo "✅ Archive created: DeviceInsights-GitHub-Upload.tar.gz"
echo "📊 File size: $(du -h DeviceInsights-GitHub-Upload.tar.gz | cut -f1)"
echo "📋 Contents:"
tar -tzf DeviceInsights-GitHub-Upload.tar.gz | head -20
echo ""
echo "🎯 Ready for GitHub upload!"
