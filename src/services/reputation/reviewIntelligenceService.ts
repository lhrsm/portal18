import { createClient } from '@/lib/supabase/client';
import { ReviewAggregate } from './types';

export const reviewIntelligenceService = {
  /**
   * Computes clean, moderated review statistics strictly excluding rejected/removed reviews.
   */
  async getReviewAggregate(advertiserId: string): Promise<ReviewAggregate> {
    const supabase = createClient();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('advertiser_reviews') as any)
        .select('rating_overall')
        .eq('advertiser_id', advertiserId)
        .eq('status', 'approved');

      if (error || !data || data.length === 0) {
        return {
          total: 0,
          average: 0,
          has_sufficient_sample: false,
          distribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
        };
      }

      const total = data.length;
      let sum = 0;
      const distribution = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };

      for (const r of data) {
        sum += r.rating_overall;
        const star = String(Math.min(5, Math.max(1, Math.round(r.rating_overall)))) as '1' | '2' | '3' | '4' | '5';
        distribution[star] = (distribution[star] || 0) + 1;
      }

      const avg = Number((sum / total).toFixed(1));

      return {
        total,
        average: avg,
        has_sufficient_sample: total >= 3,
        distribution,
      };
    } catch {
      return {
        total: 0,
        average: 0,
        has_sufficient_sample: false,
        distribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
      };
    }
  },

  /**
   * Computes Bayesian smoothed score for internal ranking calculations.
   * Formula: (sum_ratings + prior_avg * prior_count) / (count + prior_count)
   * This prevents a 1-review 5.0 profile from unfairly outranking a 100-review 4.8 profile.
   * Note: This is used ONLY for internal ranking ordering, NEVER shown as the public arithmetic average.
   */
  calculateBayesianSmoothedScore(
    actualAvg: number,
    actualCount: number,
    priorAvg = 4.5,
    priorCount = 5
  ): number {
    if (actualCount <= 0) return priorAvg;
    const smoothed = (actualAvg * actualCount + priorAvg * priorCount) / (actualCount + priorCount);
    return Number(smoothed.toFixed(2));
  },
};

