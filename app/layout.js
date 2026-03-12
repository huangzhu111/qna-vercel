export const metadata = {
  title: '记忆故事问答',
  description: '认知训练应用',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
