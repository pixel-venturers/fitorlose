// Renders a JSON-LD structured-data <script>. Data is our own config (no user
// input); `<` is still escaped to prevent any `</script>` breakout.
export function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
