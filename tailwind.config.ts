import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'vercel-black': '#171717',
        'vercel-gray-600': '#4d4d4d',
        'vercel-gray-500': '#666666',
        'vercel-gray-400': '#808080',
        'vercel-gray-100': '#ebebeb',
        'vercel-gray-50': '#fafafa',
        'vercel-link': '#0072f5',
        'vercel-badge-bg': '#ebf5ff',
        'vercel-badge-text': '#0068d6',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'vercel-border': 'rgba(0,0,0,0.08) 0px 0px 0px 1px',
        'vercel-card': 'rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, #fafafa 0px 0px 0px 1px',
        'vercel-full': 'rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, rgba(0,0,0,0.04) 0px 8px 8px -8px, #fafafa 0px 0px 0px 1px',
      },
    },
  },
  // require() 避免部分环境下 ESM 插件未正确加载导致 @tailwind 工具类未生成
  plugins: [require('@tailwindcss/typography')],
};

export default config;
