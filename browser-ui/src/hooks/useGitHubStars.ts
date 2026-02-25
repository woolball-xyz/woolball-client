import { useEffect, useState } from 'react';

const GITHUB_REPO_API = 'https://api.github.com/repos/woolball-xyz/woolball-server';
const POLL_INTERVAL_MS = 5 * 60 * 1000;

export function useGitHubStars(): number | null {
  const [repoStars, setRepoStars] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchRepoStars() {
      try {
        const response = await fetch(GITHUB_REPO_API, { signal: controller.signal });
        if (response.ok) {
          const data = await response.json();
          setRepoStars(data.stargazers_count);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        console.error('Error fetching repo stars:', error);
      }
    }

    fetchRepoStars();
    const interval = setInterval(fetchRepoStars, POLL_INTERVAL_MS);
    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, []);

  return repoStars;
}
