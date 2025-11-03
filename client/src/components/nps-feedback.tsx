import { useState, useEffect } from 'react';
import { X, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface NpsFeedbackProps {
  searchId?: number;
  onComplete?: () => void;
  inline?: boolean;
}

export default function NpsFeedback({ searchId, onComplete, inline = false }: NpsFeedbackProps) {
  const [isExpanded, setIsExpanded] = useState(inline); // Auto-expand if inline
  const [isVisible, setIsVisible] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (inline) {
      // For inline mode, show immediately
      setIsVisible(true);
    } else {
      // For floating widget, show after 3 seconds
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
    }
  }, [isExpanded, hasSubmitted, inline]);

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

  if (!isExpanded && !inline) {
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

  // Inline mode - appears in page flow
  if (inline) {
    return (
      <section className="py-8" data-testid="nps-inline-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-8 shadow-lg">
            {hasSubmitted ? (
              <div className="text-center py-4" data-testid="nps-thank-you">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-bold text-2xl text-gray-900 mb-2">
                  Thank you for your feedback!
                </h3>
                <p className="text-gray-600">
                  Your feedback helps us improve our service
                </p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Would you recommend this service?
                  </h3>
                  <p className="text-gray-600">
                    Help us improve by rating your experience
                  </p>
                </div>

                {/* Rating scale */}
                <div className="mb-6">
                  <div className="flex justify-center items-center gap-3 mb-3 flex-wrap">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => handleRatingSelect(rating)}
                        className={`h-12 w-12 md:h-14 md:w-14 rounded-full font-bold text-lg transition-all transform hover:scale-110 ${
                          selectedRating === rating
                            ? 'bg-blue-600 text-white shadow-xl scale-110 ring-4 ring-blue-200'
                            : 'bg-white text-gray-700 hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-300'
                        }`}
                        data-testid={`button-rating-${rating}`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-sm font-medium text-gray-600 max-w-2xl mx-auto">
                    <span>Not at all likely</span>
                    <span>Extremely likely</span>
                  </div>
                </div>

                {/* Optional comment field (appears after rating) */}
                {selectedRating !== null && (
                  <div className="mb-6 animate-in slide-in-from-top-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Care to share more? (optional)
                    </label>
                    <Textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="What did you like or what could we improve?"
                      className="h-24 resize-none text-base"
                      data-testid="input-feedback"
                    />
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex justify-center gap-4">
                  {selectedRating !== null && (
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 text-base font-semibold"
                      data-testid="button-submit-nps"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Floating widget mode (original)
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
