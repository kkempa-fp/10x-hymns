# get_embedding.ps1
# Generate and print embedding for a custom search text (for DB vector search)

# --- CONFIGURATION ---
$searchText = "Cicha noc"  # Text to generate embedding for

# --- GEMINI EMBEDDING API CONFIG ---
$apiKey = $env:GOOGLE_API_KEY
$embeddingModel = "models/gemini-embedding-001"
$endpoint = "https://generativelanguage.googleapis.com/v1beta/" + $embeddingModel + ":embedContent?key=$apiKey"

# --- BUILD REQUEST BODY ---
$body = [PSCustomObject]@{
    content = [PSCustomObject]@{
        parts = @([PSCustomObject]@{ text = $searchText })
    }
    output_dimensionality = 768
} | ConvertTo-Json -Depth 5

# --- CALL GEMINI API ---
$response = Invoke-RestMethod -Uri $endpoint -Method Post -Body $body -ContentType "application/json"
$embedding = $response.embedding.values

# --- PRINT EMBEDDING IN POSTGRES VECTOR FORMAT ---
$embeddingStr = '[' + (($embedding | ForEach-Object { $_.ToString().Replace(',', '.') }) -join ",") + ']'
Write-Host "Embedding for: '$searchText'" -ForegroundColor Cyan
Write-Host $embeddingStr
