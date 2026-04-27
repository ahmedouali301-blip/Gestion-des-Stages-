$content = Get-Content 'd:\PFE\Projet2\Rapport\temp_docx\word\document.xml' -Raw
$text = $content -replace '<[^>]+>', ' '
$start = $text.IndexOf('Table des matières')
if ($start -ge 0) {
    Write-Output $text.Substring($start, 4000)
} else {
    Write-Output 'TOC not found'
}
