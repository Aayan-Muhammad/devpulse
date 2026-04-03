export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="dp-grid-bg min-h-screen bg-transparent text-zinc-200">{children}</div>;
}