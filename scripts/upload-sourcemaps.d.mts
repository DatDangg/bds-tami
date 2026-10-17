export function readUploadConfig(
  env: Record<string, string | undefined>,
): { authToken: string; url: string; org: string; project: string } | null;
export function listSourceMaps(dir: string): string[];
