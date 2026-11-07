/** Ievieto nemainīgu SVG ilustrāciju no src/lib/illustrations.ts (tikai mūsu pašu virknes, nekad lietotāja teksts). */
export function Ill({ svg, className }: { svg: string; className?: string }) {
  return <span className={`ill-wrap${className ? ` ${className}` : ""}`} dangerouslySetInnerHTML={{ __html: svg }} />;
}
