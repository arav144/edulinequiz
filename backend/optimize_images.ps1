Add-Type -AssemblyName System.Drawing

function Optimize-Jpeg {
    param(
        [string]$Path,
        [int]$MaxWidth = 1920,
        [long]$Quality = 80
    )
    if (-not (Test-Path $Path)) { return }
    $origBytes = [System.IO.File]::ReadAllBytes($Path)
    $ms = New-Object System.IO.MemoryStream(,$origBytes)
    $img = [System.Drawing.Image]::FromStream($ms)
    
    $origWidth = $img.Width
    $origHeight = $img.Height
    
    # Calculate new dimensions
    $newWidth = $origWidth
    $newHeight = $origHeight
    if ($origWidth -gt $MaxWidth) {
        $ratio = $MaxWidth / $origWidth
        $newWidth = $MaxWidth
        $newHeight = [int]($origHeight * $ratio)
    }
    
    $bmp = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
    $gfx = [System.Drawing.Graphics]::FromImage($bmp)
    $gfx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gfx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gfx.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gfx.DrawImage($img, 0, 0, $newWidth, $newHeight)
    
    # JPEG Encoder & Quality
    $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, $Quality)
    
    $tempPath = $Path + ".tmp"
    $bmp.Save($tempPath, $codec, $encoderParams)
    
    $gfx.Dispose()
    $bmp.Dispose()
    $img.Dispose()
    $ms.Dispose()
    
    $origSize = (Get-Item $Path).Length
    $newSize = (Get-Item $tempPath).Length
    
    if ($newSize -lt $origSize) {
        Remove-Item $Path -Force
        Move-Item $tempPath $Path -Force
        Write-Output ("Optimized: " + (Split-Path $Path -Leaf) + " (" + [math]::Round($origSize/1KB) + " KB -> " + [math]::Round($newSize/1KB) + " KB)")
    } else {
        Remove-Item $tempPath -Force
        Write-Output ("Kept original: " + (Split-Path $Path -Leaf))
    }
}

function Optimize-Png {
    param(
        [string]$Path,
        [int]$MaxWidth = 600
    )
    if (-not (Test-Path $Path)) { return }
    $origBytes = [System.IO.File]::ReadAllBytes($Path)
    $ms = New-Object System.IO.MemoryStream(,$origBytes)
    $img = [System.Drawing.Image]::FromStream($ms)
    
    $origWidth = $img.Width
    $origHeight = $img.Height
    
    if ($origWidth -le $MaxWidth) {
        $img.Dispose()
        $ms.Dispose()
        return
    }
    
    $ratio = $MaxWidth / $origWidth
    $newWidth = $MaxWidth
    $newHeight = [int]($origHeight * $ratio)
    
    $bmp = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
    $gfx = [System.Drawing.Graphics]::FromImage($bmp)
    $gfx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gfx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gfx.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gfx.DrawImage($img, 0, 0, $newWidth, $newHeight)
    
    $tempPath = $Path + ".tmp"
    $bmp.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $gfx.Dispose()
    $bmp.Dispose()
    $img.Dispose()
    $ms.Dispose()
    
    $origSize = (Get-Item $Path).Length
    $newSize = (Get-Item $tempPath).Length
    
    if ($newSize -lt $origSize) {
        Remove-Item $Path -Force
        Move-Item $tempPath $Path -Force
        Write-Output ("Optimized PNG: " + (Split-Path $Path -Leaf) + " (" + [math]::Round($origSize/1KB) + " KB -> " + [math]::Round($newSize/1KB) + " KB)")
    } else {
        Remove-Item $tempPath -Force
    }
}

Get-ChildItem "backend\public\uploads\*.jpg" | ForEach-Object { Optimize-Jpeg $_.FullName 1920 80 }
Get-ChildItem "backend\public\uploads\*.png" | ForEach-Object { Optimize-Png $_.FullName 600 }
Get-ChildItem "frontend\public\img\polygon_bg.jpg" | ForEach-Object { Optimize-Jpeg $_.FullName 1400 80 }
