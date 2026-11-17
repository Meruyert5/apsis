import type { ReactNode } from "react";

interface Props {
  index: string;
  label: string;
  title: ReactNode;
  lede: ReactNode;
  meta?: ReactNode;
  as?: "h1" | "h2";
}

export function ActHeader({ index, label, title, lede, meta, as = "h2" }: Props) {
  const Title = as;
  return (
    <header className="bio-head">
      <div>
        <p className="bio-eyebrow">
          <b>{index}</b> / {label} <i />
        </p>
        <Title className="bio-title">{title}</Title>
        <p className="bio-lede">{lede}</p>
      </div>
      {meta ? <div className="bio-headmeta">{meta}</div> : null}
    </header>
  );
}
