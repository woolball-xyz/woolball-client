import { TaskData, TaskResult } from '../../types';

export async function htmlToImage(data: TaskData): Promise<TaskResult> {
  const { input, width = 800, height = 600, format = 'png' } = data;
  
  // Render HTML via SVG foreignObject loaded as an <img> src.
  // This is inherently safe: browsers do not execute scripts or load
  // external resources when rendering SVG through <img> elements.
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  const svgData = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml">
          ${input}
        </div>
      </foreignObject>
    </svg>
  `;

  const img = new Image();
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0);

      const mimeType = format === 'jpg' || format === 'jpeg' ? 'image/jpeg' : 'image/png';
      const base64Image = canvas.toDataURL(mimeType);

      URL.revokeObjectURL(url);

      resolve({
        image: base64Image
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG image'));
    };

    img.src = url;
  });
}