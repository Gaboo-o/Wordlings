import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

function popularitySpeed(upvotes = 0) {
  return Math.min(2.2, 0.9 + Math.log2(upvotes + 1) * 0.3);
}

export default function MeteorField({ words = [] }) {
  const [meteors, setMeteors] = useState([]);
  const pausedRef = useRef(false);

  useEffect(() => {
    const onVisibility = () => {
      pausedRef.current = document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const spawn = setInterval(() => {
      if (pausedRef.current || !words.length) return;

      const w = words[Math.floor(Math.random() * words.length)];

      setMeteors(m => [
        ...m,
        {
          id: crypto.randomUUID(),
          wordId: w.id,
          word: w.word,
          y: Math.random() * window.innerHeight * 0.8,
          speed: popularitySpeed(w.upvotes),
          direction: Math.random() > 0.5 ? 1 : -1,
        }
      ]);
    }, 1400);

    return () => clearInterval(spawn);
  }, [words]);

  return (
    <div className="meteor-field">
      {meteors.map(m => (
        <Meteor key={m.id} data={m} pausedRef={pausedRef} />
      ))}
    </div>
  );
}

function Meteor({ data, pausedRef }) {
  const navigate = useNavigate();
  const ref = useRef(null);

  const { word, wordId, speed, direction, y } = data;

  useEffect(() => {
    let x = 0;
    let raf;

    const animate = () => {
      if (!pausedRef.current && ref.current) {
        x += speed * direction;
        ref.current.style.transform = `translateX(${x}px) translateY(var(--meteor-y, 0))`;
      }
      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [speed, direction, pausedRef]);

  return (
    <div
      ref={ref}
      className="meteor"
      style={{
        top: y,
        left: direction === 1 ? "-220px" : "auto",
        right: direction === -1 ? "-220px" : "auto",
      }}
      onClick={() => navigate(`/word/${wordId}`)}
    >
      {word}
    </div>
  );
}