# extract_hymns.ps1
# Extract, clean, and generate embeddings for hymns from all XML categories.
# The input XML file is taken directly from the church text display application.
# Embeddings are saved in CSV with dots as decimal separator and ; as delimiter.

$inputPath = "./hymns.xml"         # Input XML file
$outputPath = "./hymns.csv"        # Output CSV file
$batchSize = 20                    # Max hymns per API call

# --- LOAD DATA ---
[xml]$xml = Get-Content $inputPath -Encoding UTF8
$numberPrefix = $xml.utwory.spiewnik

# --- GEMINI EMBEDDING API CONFIG ---
$apiKey = $env:GOOGLE_API_KEY
$embeddingModel = "models/gemini-embedding-001"
$batchEndpoint = "https://generativelanguage.googleapis.com/v1beta/" + $embeddingModel + ":batchEmbedContents?key=$apiKey"

# --- MAIN PROCESSING LOOP ---
$firstBatch = -not (Test-Path $outputPath)
foreach ($group in $xml.utwory.grupa) {
    $category = $group.nazwa -replace '^.{3}', ''
    $hymnsInCategory = @()

    # --- EXTRACT AND CLEAN HYMNS ---
    foreach ($hymn in $group.utwor) {
        $rawName = $hymn.nazwa
        $number = "$numberPrefix-$($rawName.Substring(0,4))"
        $name = $rawName.Substring(5)

        # Clean and join all verses
        $verses = @()
        if ($hymn.elementy -and $hymn.elementy.strofa) {
            foreach ($stanza in $hymn.elementy.strofa) {
                foreach ($verse in $stanza.wers) {
                    $cleanVerse = $verse -replace '^[\s]*(\d+\.|ref\.)[\s]*', ''
                    $cleanVerse = $cleanVerse -replace '\([^)]*\)', ''
                    $verses += $cleanVerse
                }
            }
        }
        $text = ($verses -join ' ') -replace '\s+', ' '
        $text = $text.Trim()

        # Skip hymns with empty text
        if ($text -eq "") {
            continue
        }

        # Add hymn object to list
        $hymnsInCategory += [PSCustomObject]@{
            number   = $number
            category = $category
            name     = $name
            text     = $text
        }
    }

    # --- BATCH EMBEDDING & EXPORT ---
    $total = $hymnsInCategory.Count
    for ($offset = 0; $offset -lt $total; $offset += $batchSize) {
        # Get batch of hymns
        $batch = $hymnsInCategory[$offset..([Math]::Min($offset+$batchSize-1, $total-1))]
        $requests = @()
        foreach ($hymnObj in $batch) {
            $requests += [PSCustomObject]@{
                model = $embeddingModel
                content = [PSCustomObject]@{
                    parts = @([PSCustomObject]@{ text = $hymnObj.text })
                }
                output_dimensionality = 768
            }
        }

        # Convert request to JSON and call Gemini API (no retry)
        $body = [PSCustomObject]@{ requests = $requests } | ConvertTo-Json -Depth 5
        $response = Invoke-RestMethod -Uri $batchEndpoint -Method Post -Body $body -ContentType "application/json"
        $embeddings = $response.embeddings

        # Build result objects with embeddings
        $result = @()
        for ($i = 0; $i -lt $batch.Count; $i++) {
            if ($embeddings.Count -gt $i) {
                $embedding = '[' + (($embeddings[$i].values | ForEach-Object { $_.ToString().Replace(',', '.') }) -join ",") + ']'
            } else {
                $embedding = ""
            }
            $result += [PSCustomObject]@{
                number    = $batch[$i].number
                category  = $batch[$i].category
                name      = $batch[$i].name
                text      = $batch[$i].text
                embedding = $embedding
            }
        }

        # Export batch to CSV (header only for first batch)
        if ($firstBatch) {
            $result | Export-Csv -Path $outputPath -NoTypeInformation -Encoding UTF8 -Delimiter ";"
            $firstBatch = $false
        } else {
            $result | Export-Csv -Path $outputPath -NoTypeInformation -Encoding UTF8 -Delimiter ";" -Append
        }
    }
}

Write-Host "Saved to $outputPath (UTF-8, embeddings with dots as decimal separator)."
