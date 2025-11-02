import { useState, useEffect } from 'react';
import { X, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface NpsFeedbackProps {
  searchId?: number;
  onComplete?: () => void;
}

export default function NpsFeedback({ searchId, onComplete }: NpsFeedbackProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Show the widget after 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    // Auto-dismiss after 60 seconds if not interacted
    const autoDismissTimer = setTimeout(() => {
      if (!isExpanded && !hasSubmitted) {
        setIsVisible(false);
      }
    }, 63000);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoDismissTimer);
    };
  }, [isExpanded, hasSubmitted]);

  const handleRatingSelect = (rating: number) => {
    setSelectedRating(rating);
  };

  const handleSubmit = async () => {
    if (selectedRating === null) return;

    setIsSubmitting(true);
    try {
      await apiRequest('POST', '/api/nps/submit', {
        searchId,
        rating: selectedRating,
        feedback: feedback.trim() || undefined,
      });

      setHasSubmitted(true);
      toast({
        title: 'Thank you for your feedback!',
        description: 'We appreciate you taking the time to share your experience.',
      });

      // Hide the widget after 2 seconds
      setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 2000);
    } catch (error) {
      console.error('Failed to submit NPS feedback:', error);
      toast({
        title: 'Submission failed',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onComplete?.();
  };

  if (!isVisible) return null;

  if (!isExpanded) {
    return (
      <div
        className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 md:bottom-6 md:right-6"
        data-testid="nps-widget-minimized"
      >
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center space-x-3 bg-white dark:bg-gray-800 shadow-xl rounded-full px-6 py-3 hover:shadow-2xl transition-shadow border border-gray-200 dark:border-gray-700"
          data-testid="button-expand-nps"
        >
          <MessageCircle className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-gray-900 dark:text-gray-100">Quick feedback?</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-6 md:right-6 left-6 md:left-auto right-6 z-50 animate-in slide-in-from-bottom-4"
      data-testid="nps-widget-expanded"
    >
      <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-6 w-full md:w-96 border border-gray-200 dark:border-gray-700">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          data-testid="button-close-nps"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>

        {hasSubmitted ? (
          <div className="text-center py-4" data-testid="nps-thank-you">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
              Thank you!
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your feedback helps us improve
            </p>
          </div>
        ) : (
          <>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 pr-6">
              How likely are you to recommend this tool?
            </h3>

            {/* Rating scale */}
            <div className="mb-4">
              <div className="flex justify-between items-center gap-2 mb-2">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleRatingSelect(rating)}
                    className={`h-10 w-10 rounded-full font-medium transition-all transform hover:scale-105 ${
                      selectedRating === rating
                        ? 'bg-blue-600 text-white shadow-lg scale-105'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    data-testid={`button-rating-${rating}`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Not likely</span>
                <span>Very likely</span>
              </div>
            </div>

            {/* Optional comment field (appears after rating) */}
            {selectedRating !== null && (
              <div className="mb-4 animate-in slide-in-from-top-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Any additional feedback? (optional)
                </label>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Tell us more about your experience..."
                  className="h-20 resize-none"
                  data-testid="input-feedback"
                />
              </div>
            )}

            {/* Submit button */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleDismiss}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                data-testid="button-maybe-later"
              >
                Maybe later
              </button>
              <Button
                onClick={handleSubmit}
                disabled={selectedRating === null || isSubmitting}
                className="px-6"
                data-testid="button-submit-nps"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
