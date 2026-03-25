# =============================
# Azure React Deployment Script
# =============================
 
# Variables - change these
$resourceGroup = "SignApp"                # your Azure Resource Group
$appService   = "signapp-dtg2a4a8dca0evb8" # your Azure App Service name
$buildFolder  = "build"
$zipPath      = Join-Path $PSScriptRoot "reactapp.zip"

# 1. Build React App
Write-Host "Building React app..."
npm run build
 
# 2. Create web.config for React Router
Write-Host "Creating web.config..."
$webConfigContent = @"
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="ReactRoutes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
"@
 
$webConfigPath = Join-Path $buildFolder "web.config"
Set-Content -Path $webConfigPath -Value $webConfigContent
 
# 3. Zip the build folder
Write-Host "Creating deployment zip..."
if (Test-Path $zipPath) { Remove-Item $zipPath }
Compress-Archive -Path "$buildFolder\*" -DestinationPath $zipPath -Force
 
# 4. Deploy to Azure
Write-Host "Deploying to Azure App Service..."
az webapp deploy `
  --resource-group $resourceGroup `
  --name $appService `
  --src-path $zipPath `
  --type zip
 
Write-Host "Deployment complete!"
Write-Host "Visit: https://$appService.southindia-01.azurewebsites.net"
 
 