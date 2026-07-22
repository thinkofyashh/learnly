export function Reveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return <div className={className}>{children}</div>;
}

export function AnimatedNumber({ value }: { value: number }) {
  return <span>{value.toLocaleString()}</span>;
}
