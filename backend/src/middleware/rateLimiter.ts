// Rate limiter implementation: Token bucket algorithm
// Burst: 4 requests, Steady: 2 requests/second
//
// NOTE: This simulates external API rate limiting behavior.
// DO NOT modify the rate limit values (4 burst, 2/sec steady)
// as they represent the constraints of the external API being simulated.
class RateLimiter {
  private tokens: number = 4; // Burst limit
  private maxTokens: number = 4;
  private refillRate: number = 2; // tokens per second
  private lastRefill: number = Date.now();

  canProcess(): boolean {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }

    return false;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000; // seconds
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  getRetryAfter(): number {
    this.refill();
    const tokensNeeded = 1 - this.tokens;
    return Math.ceil(tokensNeeded / this.refillRate);
  }

  reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
  }
}

export const rateLimiter = new RateLimiter();
