type JsonLdValue =
  | boolean
  | number
  | string
  | null
  | JsonLdValue[]
  | { [key: string]: JsonLdValue };

interface JsonLdScriptProps {
  data: JsonLdValue;
  id: string;
}

export default function JsonLdScript({ data, id }: JsonLdScriptProps) {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
      id={id}
      type="application/ld+json"
    />
  );
}
