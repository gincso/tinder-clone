import { SUBSCRIPTION_PLANS } from '../config/constants';

type Tier = 'free' | 'premium' | 'platinum';

interface PlanLimits {
  maxSwipesPerDay: number;
  maxSuperLikesPerDay: number;
  maxRewindsPerDay: number;
  maxVideoCallMinutes: number;
}

const PLAN_LIMITS: Record<Tier, PlanLimits> = {
  free: {
    maxSwipesPerDay: 25,
    maxSuperLikesPerDay: 1,
    maxRewindsPerDay: 3,
    maxVideoCallMinutes: 5,
  },
  premium: {
    maxSwipesPerDay: Infinity,
    maxSuperLikesPerDay: 5,
    maxRewindsPerDay: Infinity,
    maxVideoCallMinutes: 30,
  },
  platinum: {
    maxSwipesPerDay: Infinity,
    maxSuperLikesPerDay: 10,
    maxRewindsPerDay: Infinity,
    maxVideoCallMinutes: Infinity,
  },
};

class PremiumService {
  /**
   * Checks whether the user can perform a swipe based on their tier and daily usage.
   * @param tier - The user's subscription tier
   * @param swipesUsedToday - Number of swipes already used today
   * @returns Whether the user can swipe
   */
  canSwipe(tier: string, swipesUsedToday: number): boolean {
    const limit = this.getMaxSwipesPerDay(tier);
    return swipesUsedToday < limit;
  }

  /**
   * Checks whether the user can send a super like based on their tier and daily usage.
   * @param tier - The user's subscription tier
   * @param superLikesUsed - Number of super likes already used today
   * @returns Whether the user can super like
   */
  canSuperLike(tier: string, superLikesUsed: number): boolean {
    const limits = this.getPlanLimits(tier);
    return superLikesUsed < limits.maxSuperLikesPerDay;
  }

  /**
   * Checks whether the user can rewind based on their tier and daily usage.
   * @param tier - The user's subscription tier
   * @param rewindsUsed - Number of rewinds already used today
   * @returns Whether the user can rewind
   */
  canRewind(tier: string, rewindsUsed: number): boolean {
    const limit = this.getPlanLimits(tier).maxRewindsPerDay;
    return rewindsUsed < limit;
  }

  /**
   * Checks whether the user can start a video call based on their tier and daily usage.
   * @param tier - The user's subscription tier
   * @param minutesUsed - Minutes of video calls already used today
   * @returns Whether the user can start a video call
   */
  canVideoCall(tier: string, minutesUsed: number): boolean {
    const limit = this.getVideoCallLimitMinutes(tier);
    return minutesUsed < limit;
  }

  /**
   * Returns the full limit set for a given subscription tier.
   * Falls back to free tier limits if the tier is unknown.
   * @param tier - The subscription tier
   * @returns The plan limits object
   */
  getPlanLimits(tier: string): PlanLimits {
    const key = tier as Tier;
    if (PLAN_LIMITS[key]) {
      return { ...PLAN_LIMITS[key] };
    }
    console.warn(`Unknown tier "${tier}". Falling back to free plan limits.`);
    return { ...PLAN_LIMITS.free };
  }

  /**
   * Returns the maximum number of swipes allowed per day for a given tier.
   * Paid tiers return Infinity (unlimited).
   * @param tier - The subscription tier
   * @returns Max swipes per day
   */
  getMaxSwipesPerDay(tier: string): number {
    return this.getPlanLimits(tier).maxSwipesPerDay;
  }

  /**
   * Returns the maximum video call minutes allowed for a given tier.
   * Platinum returns Infinity (unlimited).
   * @param tier - The subscription tier
   * @returns Max video call minutes
   */
  getVideoCallLimitMinutes(tier: string): number {
    return this.getPlanLimits(tier).maxVideoCallMinutes;
  }

  /**
   * Returns the list of feature descriptions for a given subscription tier.
   * @param tier - The subscription tier
   * @returns Array of feature strings
   */
  getFeatures(tier: string): string[] {
    const plan = SUBSCRIPTION_PLANS[tier as Tier];
    if (!plan) {
      console.warn(`Unknown tier "${tier}". Returning free tier features.`);
      return [...SUBSCRIPTION_PLANS.free.features];
    }
    return [...plan.features];
  }

  /**
   * Checks whether a subscription object is still active based on its end date.
   * @param subscription - The subscription object to validate
   * @returns Whether the subscription is currently active
   */
  isSubscriptionActive(subscription: Record<string, unknown>): boolean {
    if (!subscription) {
      return false;
    }

    if (subscription.tier === 'free') {
      return true;
    }

    const endDate = subscription.endDate;
    if (!endDate) {
      return true;
    }

    const end = endDate instanceof Date ? endDate : new Date(endDate as string);
    return end.getTime() > Date.now();
  }
}

export const premiumService = new PremiumService();
