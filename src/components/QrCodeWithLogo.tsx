import React, { useRef, useEffect, useState } from 'react';

interface QrCodeWithLogoProps {
  albumUrl: string;
  logoUrl?: string;
  studioName: string;
  size?: number;
}

const QrCodeWithLogo: React.FC<QrCodeWithLogoProps> = ({
  albumUrl,
  logoUrl,
  studioName,
  size = 320,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const totalSize = size + 80; // Extra space for border
    canvas.width = totalSize;
    canvas.height = totalSize + 40; // Extra for studio name

    // Draw decorative border background
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.roundRect(0, 0, totalSize, totalSize + 40, 16);
    ctx.fill();

    // Draw golden border pattern
    const gradient = ctx.createLinearGradient(0, 0, totalSize, totalSize);
    gradient.addColorStop(0, '#D4AF37');
    gradient.addColorStop(0.5, '#F5D76E');
    gradient.addColorStop(1, '#D4AF37');
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(4, 4, totalSize - 8, totalSize + 32, 14);
    ctx.stroke();

    // Inner decorative border
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(12, 12, totalSize - 24, totalSize + 16, 10);
    ctx.stroke();

    // Corner decorations
    const cornerSize = 20;
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;

    // Top-left corner
    drawCorner(ctx, 16, 16, cornerSize, 'tl');
    // Top-right corner
    drawCorner(ctx, totalSize - 16, 16, cornerSize, 'tr');
    // Bottom-left corner
    drawCorner(ctx, 16, totalSize + 24, cornerSize, 'bl');
    // Bottom-right corner
    drawCorner(ctx, totalSize - 16, totalSize + 24, cornerSize, 'br');

    // Load QR code image
    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';
    const encodedUrl = encodeURIComponent(albumUrl);
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedUrl}&color=D4AF37&bgcolor=0a0a0a&margin=2`;

    qrImg.onload = () => {
      const qrX = (totalSize - size) / 2;
      const qrY = 30;

      // Draw QR code
      ctx.drawImage(qrImg, qrX, qrY, size, size);

      // Draw logo on top of QR if available
      if (logoUrl) {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.src = logoUrl;
        logoImg.onload = () => {
          const logoSize = size * 0.22;
          const logoX = qrX + (size - logoSize) / 2;
          const logoY = qrY + (size - logoSize) / 2;

          // White circle background for logo
          ctx.fillStyle = '#0a0a0a';
          ctx.beginPath();
          ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 6, 0, Math.PI * 2);
          ctx.fill();

          // Golden ring around logo
          ctx.strokeStyle = '#D4AF37';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 6, 0, Math.PI * 2);
          ctx.stroke();

          // Clip and draw logo
          ctx.save();
          ctx.beginPath();
          ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
          ctx.restore();

          drawStudioName(ctx, studioName, totalSize);
          setDataUrl(canvas.toDataURL('image/png'));
        };
        logoImg.onerror = () => {
          drawStudioName(ctx, studioName, totalSize);
          setDataUrl(canvas.toDataURL('image/png'));
        };
      } else {
        drawStudioName(ctx, studioName, totalSize);
        setDataUrl(canvas.toDataURL('image/png'));
      }
    };
  }, [albumUrl, logoUrl, studioName, size]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} className="hidden" />
      {dataUrl ? (
        <>
          <img src={dataUrl} alt="QR Code" className="w-72 h-auto rounded-xl" />
          <a href={dataUrl} download={`qr-${studioName.replace(/\s+/g, '-').toLowerCase()}.png`}>
            <button className="px-6 py-2 bg-amber-500 text-black font-semibold rounded-lg hover:bg-amber-400 transition-colors">
              Download QR Code
            </button>
          </a>
        </>
      ) : (
        <div className="w-72 h-72 bg-muted rounded-xl animate-pulse flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Generating QR...</span>
        </div>
      )}
    </div>
  );
};

function drawCorner(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, pos: string) {
  ctx.beginPath();
  if (pos === 'tl') {
    ctx.moveTo(x, y + s);
    ctx.lineTo(x, y);
    ctx.lineTo(x + s, y);
  } else if (pos === 'tr') {
    ctx.moveTo(x - s, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + s);
  } else if (pos === 'bl') {
    ctx.moveTo(x, y - s);
    ctx.lineTo(x, y);
    ctx.lineTo(x + s, y);
  } else if (pos === 'br') {
    ctx.moveTo(x - s, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y - s);
  }
  ctx.stroke();
}

function drawStudioName(ctx: CanvasRenderingContext2D, name: string, totalWidth: number) {
  const y = totalWidth + 26;
  ctx.fillStyle = '#D4AF37';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(name, totalWidth / 2, y);
}

export default QrCodeWithLogo;
