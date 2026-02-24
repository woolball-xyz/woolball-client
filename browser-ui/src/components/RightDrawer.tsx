import { GitHubLink } from './GitHubLink';

interface RightDrawerProps {
  isOpen: boolean;
  repoStars: number | null;
}

export function RightDrawer({ isOpen, repoStars }: RightDrawerProps) {
  return (
    <div className={`right-drawer ${isOpen ? 'open' : ''}`}>
      <div className="drawer-section">
        <h2 className="drawer-title">Links</h2>
        <div className="repo-links">
          <GitHubLink repoStars={repoStars} />
        </div>
      </div>
    </div>
  );
}
