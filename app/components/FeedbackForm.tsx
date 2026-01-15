'use client';

import { useState } from 'react';
import { MessageSquare, Send, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface FeedbackData {
  rating: number;
  category: string;
  title: string;
  message: string;
  email: string;
  features?: string[];
  improvements?: string;
  wouldRecommend: boolean;
}

interface FeedbackFormProps {
  userId?: string;
  userEmail?: string;
  onClose?: () => void;
  onSubmitSuccess?: () => void;
}

const FEEDBACK_CATEGORIES = [
  { value: 'bug', label: '🐛 Bug Report' },
  { value: 'feature', label: '💡 Feature Request' },
  { value: 'improvement', label: '⚡ Improvement Suggestion' },
  { value: 'experience', label: '😊 User Experience' },
  { value: 'performance', label: '⚙️ Performance' },
  { value: 'documentation', label: '📚 Documentation' },
  { value: 'other', label: '🤔 Other' },
];

const FEATURE_OPTIONS = [
  'PDF Export',
  'Note Taking',
  'Chat History',
  'Search Functionality',
  'Document Upload',
  'Formatting Options',
  'Mobile Experience',
  'Authentication',
];

export default function FeedbackForm({ userId, userEmail, onClose, onSubmitSuccess }: FeedbackFormProps) {
  const [formData, setFormData] = useState<FeedbackData>({
    rating: 5,
    category: 'feature',
    title: '',
    message: '',
    email: userEmail || '',
    features: [],
    improvements: '',
    wouldRecommend: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must not exceed 100 characters';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Feedback message is required';
    } else if (formData.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    } else if (formData.message.length > 2000) {
      newErrors.message = 'Message must not exceed 2000 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.category === 'improvement' && !formData.improvements?.trim()) {
      newErrors.improvements = 'Please specify your improvement suggestion';
    }

    if (formData.category === 'bug' && formData.features?.length === 0) {
      newErrors.features = 'Please select which feature has the issue';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle feature selection
  const toggleFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features?.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...(prev.features || []), feature],
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setSubmitStatus({
        type: 'error',
        message: 'Please fix the errors above before submitting.',
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setSubmitStatus({
        type: 'success',
        message: 'Thank you! Your feedback has been submitted successfully.',
      });

      // Reset form
      setFormData({
        rating: 5,
        category: 'feature',
        title: '',
        message: '',
        email: userEmail || '',
        features: [],
        improvements: '',
        wouldRecommend: true,
      });
      setErrors({});

      // Call success callback after 1.5 seconds
      setTimeout(() => {
        onSubmitSuccess?.();
      }, 1500);
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'Failed to submit feedback. Please try again later.',
      });
      console.error('Feedback submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white border border-gray-200 rounded-t-2xl sm:rounded-2xl shadow-xl max-w-2xl w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2 sm:gap-3">
            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Share Your Feedback</h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
            >
              ✕
            </button>
          )}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-6 overflow-y-auto flex-1">
          {/* Status Messages */}
          {submitStatus.type && (
            <div
              className={`flex items-start gap-3 p-4 rounded-lg border ${
                submitStatus.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {submitStatus.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <p className="text-sm">{submitStatus.message}</p>
            </div>
          )}

          {/* Rating */}
          <div>
            <label className="block text-gray-900 font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
              How would you rate your experience?
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, rating: num }))}
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg font-bold text-base sm:text-lg transition-all ${
                    formData.rating === num
                      ? 'bg-blue-600 text-white scale-110 shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">1 = Poor, 5 = Excellent</p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-gray-900 font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
              Feedback Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
            >
              {FEEDBACK_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Bug Report - Feature Selection */}
          {formData.category === 'bug' && (
            <div>
              <label className="block text-gray-900 font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                Which feature has the issue? <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {FEATURE_OPTIONS.map(feature => (
                  <button
                    key={feature}
                    type="button"
                    onClick={() => toggleFeature(feature)}
                    className={`p-2.5 sm:p-3 rounded-lg border transition-all text-xs sm:text-sm font-medium ${
                      formData.features?.includes(feature)
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    {feature}
                  </button>
                ))}
              </div>
              {errors.features && (
                <p className="text-red-400 text-sm mt-2">{errors.features}</p>
              )}
            </div>
          )}

          {/* Improvement Suggestion */}
          {formData.category === 'improvement' && (
            <div>
              <label className="block text-gray-900 font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                What could be improved? <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.improvements || ''}
                onChange={e => setFormData(prev => ({ ...prev, improvements: e.target.value }))}
                placeholder="Describe your improvement idea..."
                className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors min-h-20 sm:min-h-24 resize-none"
              />
              {errors.improvements && (
                <p className="text-red-400 text-sm mt-1">{errors.improvements}</p>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-gray-900 font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
              Feedback Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Brief summary of your feedback"
              maxLength={100}
              className={`w-full bg-white text-gray-900 border rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:outline-none focus:ring-2 transition-colors ${
                errors.title ? 'border-red-500 focus:ring-red-100' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
              }`}
            />
            <div className="flex justify-between items-center mt-2">
              {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
              <p className="text-xs text-gray-500 ml-auto">
                {formData.title.length}/100
              </p>
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-gray-900 font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
              Detailed Feedback <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.message}
              onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Please provide detailed feedback. What went well? What could be improved?"
              maxLength={2000}
              className={`w-full bg-white text-gray-900 border rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:outline-none focus:ring-2 transition-colors min-h-28 sm:min-h-32 resize-none ${
                errors.message ? 'border-red-500 focus:ring-red-100' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
              }`}
            />
            <div className="flex justify-between items-center mt-2">
              {errors.message && <p className="text-red-500 text-sm">{errors.message}</p>}
              <p className="text-xs text-gray-500 ml-auto">
                {formData.message.length}/2000
              </p>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-900 font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="your@email.com"
              className={`w-full bg-white text-gray-900 border rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:outline-none focus:ring-2 transition-colors ${
                errors.email ? 'border-red-500 focus:ring-red-100' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
              }`}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            <p className="text-xs text-gray-500 mt-1">
              We'll use this to follow up on your feedback if needed
            </p>
          </div>

          {/* Recommendation */}
          <div>
            <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.wouldRecommend}
                onChange={e => setFormData(prev => ({ ...prev, wouldRecommend: e.target.checked }))}
                className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-white border border-gray-300 cursor-pointer accent-blue-600"
              />
              <span className="text-gray-900 font-medium text-sm sm:text-base">
                I would recommend this app to others
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 sm:p-0 sm:bg-transparent sm:border-t-0 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 sm:px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 sm:py-3 rounded-lg transition-colors text-sm sm:text-base"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2.5 sm:py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm text-sm sm:text-base"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                  Submit Feedback
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
