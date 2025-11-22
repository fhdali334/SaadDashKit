# BigCommerce API Test Script using curl (PowerShell)
# This script tests the BigCommerce API endpoint directly using curl

# Configuration - Replace these with your actual values
# You can set these via environment variables or edit directly below
$STORE_HASH = if ($env:BIGCOMMERCE_STORE_HASH) { $env:BIGCOMMERCE_STORE_HASH } else { "store-gawl8tpcqr" }
$ACCESS_TOKEN = if ($env:BIGCOMMERCE_ACCESS_TOKEN) { $env:BIGCOMMERCE_ACCESS_TOKEN } else { "880np5jpxy9qkr1z6eu08l1erd7zemt" }

Write-Host "Testing BigCommerce API with curl..." -ForegroundColor Yellow
Write-Host ""

# Check if credentials are provided
if ($STORE_HASH -eq "your-store-hash" -or $ACCESS_TOKEN -eq "your-access-token") {
    Write-Host "Error: Please provide your BigCommerce credentials" -ForegroundColor Red
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  `$env:BIGCOMMERCE_STORE_HASH='your-store-hash'"
    Write-Host "  `$env:BIGCOMMERCE_ACCESS_TOKEN='your-access-token'"
    Write-Host "  .\test-bigcommerce-curl.ps1"
    Write-Host ""
    Write-Host "Or edit the script and set `$STORE_HASH and `$ACCESS_TOKEN directly"
    exit 1
}

# Build the API URL
$API_URL = "https://api.bigcommerce.com/stores/$STORE_HASH/v3/catalog/products?page=1&limit=10"

Write-Host "Request Details:" -ForegroundColor Yellow
Write-Host "  URL: $API_URL"
Write-Host "  Method: GET"
Write-Host "  Headers:"
$tokenPreview = if ($ACCESS_TOKEN.Length -gt 10) { $ACCESS_TOKEN.Substring(0, 10) + "..." } else { "***" }
Write-Host "    X-Auth-Token: $tokenPreview (hidden)"
Write-Host "    Accept: application/json"
Write-Host ""

# Make the curl request using Invoke-RestMethod
Write-Host "Making request..." -ForegroundColor Yellow
Write-Host ""

try {
    $headers = @{
        "Accept" = "application/json"
        "X-Auth-Token" = $ACCESS_TOKEN
    }
    
    $response = Invoke-RestMethod -Uri $API_URL -Method Get -Headers $headers -ErrorAction Stop
    
    Write-Host "Response Status: 200 OK" -ForegroundColor Green
    Write-Host ""
    Write-Host "Success!" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Response Summary:" -ForegroundColor Yellow
    if ($response.meta) {
        Write-Host "  Pagination:" -ForegroundColor Cyan
        Write-Host "    Current Page: $($response.meta.pagination.current_page)"
        Write-Host "    Per Page: $($response.meta.pagination.per_page)"
        Write-Host "    Total: $($response.meta.pagination.total)"
        Write-Host "    Total Pages: $($response.meta.pagination.total_pages)"
    }
    
    if ($response.data) {
        Write-Host "  Products returned: $($response.data.Count)" -ForegroundColor Green
        Write-Host ""
        Write-Host "First product (if available):" -ForegroundColor Yellow
        if ($response.data.Count -gt 0) {
            $firstProduct = $response.data[0]
            Write-Host "  ID: $($firstProduct.id)"
            Write-Host "  Name: $($firstProduct.name)"
            Write-Host "  SKU: $($firstProduct.sku)"
        }
    }
    
    Write-Host ""
    Write-Host "Full Response (JSON):" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 10
    
} catch {
    $statusCode = $null
    $errorMessage = $_.Exception.Message
    
    # Try to get status code from exception
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
    }
    
    Write-Host "Response Status: $statusCode" -ForegroundColor Red
    Write-Host ""
    
    if ($statusCode -eq 401) {
        Write-Host "Unauthorized (401)" -ForegroundColor Red
        Write-Host "  Check your ACCESS_TOKEN"
    } elseif ($statusCode -eq 403) {
        Write-Host "Forbidden (403)" -ForegroundColor Red
        Write-Host "  Your API token may not have the required scopes"
        Write-Host "  Required scopes:"
        Write-Host "    - store_v2_products_read_only (Products read-only)"
        Write-Host "    - store_v2_inventory_read_only (Store Inventory read-only) - may be required"
    } elseif ($statusCode -eq 404) {
        Write-Host "Not Found (404)" -ForegroundColor Red
        Write-Host "  Check your STORE_HASH"
    } else {
        Write-Host "Error ($statusCode)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Error Details:" -ForegroundColor Red
    Write-Host $errorMessage
    
    # Try to get response body if available
    try {
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host ""
            Write-Host "Response Body:" -ForegroundColor Yellow
            Write-Host $responseBody
        }
    } catch {
        # Response body not available
    }
}
