import WordCard from './WordCard';

export default function WordList({ words }) {
  return (
    <div>
      {words.map((w) => <WordCard key={w.id} word={w} />)}
    </div>
  );
}
