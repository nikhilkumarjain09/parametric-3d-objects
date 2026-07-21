import { ImageResponse } from 'next/og';
import fs from 'fs';
import path from 'path';

// Route segment config
export const runtime = 'nodejs';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Image generation
export default async function Icon() {
  const iconPath = path.join(process.cwd(), 'public', 'parametric-icon.png');
  const iconData = fs.readFileSync(iconPath);
  const base64Icon = iconData.toString('base64');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
        }}
      >
        <img
          src={`data:image/png;base64,${base64Icon}`}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '6px', // 6px rounded corners
            objectFit: 'cover',
          }}
          alt="Logo"
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
