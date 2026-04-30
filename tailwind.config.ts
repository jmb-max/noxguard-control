import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0f1117',
        surface: '#1a1d27',
        'surface-high': '#22263a',
        border: '#2e3349',
        accent: '#1e6fff',
        'accent-glow': 'rgba(30,111,255,0.2)',
        danger: '#ff3b3b',
        success: '#00c07a',
        text: '#e8ecf5',
        'text-muted': '#6b7394',
        'text-dim': '#3d4466',
      },
      fontFamily: {
        mono: ['"DM Mono"', '"Courier New"', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
