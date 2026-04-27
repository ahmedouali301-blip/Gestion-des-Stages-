$content = Get-Content 'd:\PFE\Projet2\Rapport\temp_docx\word\document.xml' -Raw
$text = $content -replace '<[^>]+>', ' '
$start = $text.IndexOf('Environnement matériel')
if ($start -ge 0) {
    Write-Output $text.Substring($start, 3000)
} else {
    Write-Output 'Section 2.4.1 not found'
}
