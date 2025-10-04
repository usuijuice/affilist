import { highlightSearchText } from '../utils/helpers';

interface HighlightedTextProps {
  text: string;
  searchQuery: string;
  className?: string;
}

export function HighlightedText({
  text,
  searchQuery,
  className = '',
}: HighlightedTextProps) {
  const highlightedText = highlightSearchText(text, searchQuery);

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: highlightedText }}
    />
  );
}
