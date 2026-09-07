import type { Metadata } from 'next';
import './globals.css';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
export const metadata: Metadata={title:'乌鸦喝水 · 小小语文探险',description:'陪小乌鸦找线索、放石子、读课文，再讲出自己的故事。',icons:{icon:`${basePath}/favicon.svg`}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>}
