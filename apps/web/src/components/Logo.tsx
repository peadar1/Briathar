import { Link } from 'react-router';

/** "Briathra" in Ogham (ᚁᚏᚔᚐᚈᚆᚏᚐ), shown as a decorative rule under the wordmark. */
const OGHAM = 'ᚁᚏᚔᚐᚈᚆᚏᚐ';

export function Logo() {
  return (
    <Link to="/" className="group flex flex-col leading-none" aria-label="Briathra, home">
      <span className="font-uncial text-2xl text-primary transition-colors group-hover:text-primary-hover">
        Briathra
      </span>
      <span aria-hidden className="mt-0.5 text-[0.7rem] tracking-[0.3em] text-accent">
        {OGHAM}
      </span>
    </Link>
  );
}
