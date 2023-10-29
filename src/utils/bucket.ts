import { delay } from "./delay.ts";

/** A Leaky Bucket.
 * Useful for rate limiting purposes.
 * This uses `performance.now()` instead of `Date.now()` for higher accuracy.
 *
 * NOTE: This bucket is lazy, means it only updates when a related method is called.
 */
export class LeakyBucket {
    /** How many tokens this bucket can hold. */
    max: number;
    /** Amount of tokens gained per interval.
     * If bigger than `max` it will be pressed to `max`.
     */
    refillAmount: number;
    /** Interval at which the bucket gains tokens. */
    refillInterval: number;

    /** Track of when the last refill of tokens was. */
    private lastRefill: number;
    /** State of whether currently it is allowed to acquire tokens. */
    private allowAcquire: boolean;
    /** Number of currently available tokens. */
    private tokensState: number;
    /** Array of promises necessary to guarantee no race conditions. */
    private waiting: Array<(_?: unknown) => void>;

    constructor(options: LeakyBucketOptions) {
        this.max = options.max;
        this.refillInterval = options.refillInterval;
        this.refillAmount = options.refillAmount > options.max ? options.max : options.refillAmount;
        this.lastRefill = performance.now();
        this.allowAcquire = true;

        this.tokensState = options.tokens ?? options.max;
        this.waiting = [];
    }

    /** Returns the number of milliseconds until the next refill. */
    get nextRefill() {
        // Since this bucket is lazy update the tokens before calculating the next refill.
        this.updateTokens();

        return this.refillInterval - performance.now() + this.lastRefill;
    }

    /** Current tokens in the bucket. */
    get tokens() {
        return this.updateTokens();
    }

    /** Acquire tokens from the bucket.
     * Resolves when the tokens are acquired and available.
     * @param highPriority Whether this acquire is should be done asap.
     */
    async acquire(amount: number, highPriority = false): Promise<void> {
        if (amount > this.max) throw new Error("Attempted to acquire more tokens than max allows");

        // To prevent the race condition of 2 acquires happening at once,
        // check whether its currently allowed to acquire.
        if (!this.allowAcquire) {
            // create, push, and wait until the current running acquiring is finished.
            await new Promise((resolve) => {
                if (highPriority) {
                    this.waiting.unshift(resolve);
                } else {
                    this.waiting.push(resolve);
                }
            });

            // Somehow another acquire has started,
            // so need to wait again.
            if (!this.allowAcquire) {
                return await this.acquire(amount);
            }
        }

        this.allowAcquire = false;
        // Since the bucket is lazy update the tokens now,
        // and also get the current amount of available tokens
        const currentTokens = this.updateTokens();

        // It's possible that more than available tokens have been acquired,
        // so calculate the amount of milliseconds to wait until this acquire is good to go.
        if (currentTokens < amount) {
            const tokensNeeded = amount - currentTokens;
            const refillsNeeded = Math.ceil(tokensNeeded / this.refillAmount);

            const waitTime = this.refillInterval * refillsNeeded;
            await delay(waitTime);

            // Update the tokens again to ensure nothing has been missed.
            this.updateTokens();
        }

        // In order to not subtract too much from the tokens,
        // calculate what is actually needed to subtract.
        const toSubtract = amount % this.refillAmount ?? amount;
        this.tokensState -= toSubtract;

        // Allow the next acquire to happen.
        this.allowAcquire = true;
        // If there is an acquire waiting, let it continue.
        this.waiting.shift()?.();
    }

    async acquireOne(): Promise<void> {
        return this.acquire(1);
    }

    /** Update the tokens of that bucket.
     * @returns {number} The amount of current available tokens.
     */
    private updateTokens(): number {
        const timePassed = performance.now() - this.lastRefill;
        const missedRefills = Math.floor(timePassed / this.refillInterval);

        // The refill shall not exceed the max amount of tokens.
        this.tokensState = Math.min(this.tokensState + this.refillAmount * missedRefills, this.max);
        this.lastRefill += this.refillInterval * missedRefills;

        return this.tokensState;
    }
}

export type LeakyBucketOptions = {
    /** How many tokens this bucket can hold. */
    max: number;
    /** Amount of tokens gained per interval.
     * If bigger than `max` it will be pressed to `max`.
     */
    refillAmount: number;
    /** Interval at which the bucket gains tokens. */
    refillInterval: number;
    /** Amount of tokes this bucket should start with. */
    tokens?: number;
};
