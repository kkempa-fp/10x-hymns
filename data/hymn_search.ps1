# hymn_search.ps1
# Find top 5 most similar hymns for a custom search text using cosine similarity on embeddings.

# --- CONFIGURATION ---
$csvPath = "./hymns.csv"           # Path to hymns CSV file
$searchText = "Cicha noc"          # Text to search for

# --- LOAD HYMNS AND EMBEDDINGS ---
$hymns = Import-Csv -Path $csvPath -Delimiter ";"

# --- GENERATE EMBEDDING FOR SEARCH TEXT ---
$apiKey = $env:GOOGLE_API_KEY
$embeddingModel = "models/gemini-embedding-001"
$endpoint = "https://generativelanguage.googleapis.com/v1beta/" + $embeddingModel + ":embedContent?key=$apiKey"

$body = [PSCustomObject]@{
    content = [PSCustomObject]@{
        parts = @([PSCustomObject]@{ text = $searchText })
    }
    output_dimensionality = 768
} | ConvertTo-Json -Depth 5

$response = Invoke-RestMethod -Uri $endpoint -Method Post -Body $body -ContentType "application/json"
$searchEmbedding = $response.embedding.values

# --- COSINE SIMILARITY FUNCTION ---
function Get-CosineSimilarity($vec1, $vec2) {
    $dot = 0.0
    $norm1 = 0.0
    $norm2 = 0.0
    for ($i = 0; $i -lt $vec1.Count; $i++) {
        $dot += [double]$vec1[$i] * [double]$vec2[$i]
        $norm1 += [double]$vec1[$i] * [double]$vec1[$i]
        $norm2 += [double]$vec2[$i] * [double]$vec2[$i]
    }
    if ($norm1 -eq 0 -or $norm2 -eq 0) { return 0 }
    return $dot / ([Math]::Sqrt($norm1) * [Math]::Sqrt($norm2))
}

# --- CALCULATE SIMILARITY FOR EACH HYMN ---
$results = @()
foreach ($hymn in $hymns) {
    if (-not $hymn.embedding) { continue }
    $embeddingArr = ($hymn.embedding -split ",") | ForEach-Object { [double]$_ }
    $similarity = Get-CosineSimilarity $searchEmbedding $embeddingArr
    $results += [PSCustomObject]@{
        number = $hymn.number
        category = $hymn.category
        name = $hymn.name
        text = $hymn.text
        similarity = $similarity
    }
}

# --- SHOW TOP 5 MOST SIMILAR HYMNS ---
$top = $results | Sort-Object -Property similarity -Descending | Select-Object -First 5
Write-Host "Top 5 most similar hymns for: '$searchText'" -ForegroundColor Cyan
$top | Format-Table number, name, category, similarity, text -AutoSize
