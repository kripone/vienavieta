/** Strukturētie dati meklētājiem (schema.org JSON-LD). */
export function JsonLd({ data }: { data: unknown }) {
  // "<" aizvietojam, lai teksts nevarētu aizvērt <script>
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
