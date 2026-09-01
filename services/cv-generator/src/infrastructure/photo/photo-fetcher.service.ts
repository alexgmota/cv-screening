/**
 * Fetches a fresh candidate portrait photo from the RandomUser API on demand.
 */
export class PhotoFetcherService {
  private readonly timeoutMs: number;

  constructor(timeoutMs = 10_000) {
    this.timeoutMs = timeoutMs;
  }

  /**
   * Fetch a portrait photo for the given gender and return it as a raw image buffer.
   * Returns null immediately for any network or rate-limit failure without retrying.
   */
  async fetchPhoto(gender: 'male' | 'female' = 'male'): Promise<Buffer | null> {
    try {
      const profileResponse = await this.fetchJson(`https://randomuser.me/api/?gender=${gender}&nat=us`);
      const imageUrl = profileResponse?.results?.[0]?.picture?.thumbnail ?? profileResponse?.results?.[0]?.picture?.medium ?? profileResponse?.results?.[0]?.picture?.large;
      if (!imageUrl) {
        return null;
      }

      const imageResponse = await this.fetchBinary(imageUrl);
      if (!imageResponse) {
        return null;
      }

      return imageResponse.length > 0 ? imageResponse : null;
    } catch {
      return null;
    }
  }

  private async fetchJson(url: string): Promise<any> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'leadtech-cv-screening/1.0',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  private async fetchBinary(url: string): Promise<Buffer | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'leadtech-cv-screening/1.0',
        },
      });

      if (!response.ok) {
        return null;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      return buffer.length > 0 ? buffer : null;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}
