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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-[#667eea] rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-black border-b border-[#667eea]/30 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-[#667eea]" />
            <h2 className="text-2xl font-bold text-white">Share Your Feedback</h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Status Messages */}
          {submitStatus.type && (
            <div
              className={`flex items-start gap-3 p-4 rounded-lg border ${
                submitStatus.type === 'success'
                  ? 'bg-green-500/10 border-green-500/30 text-green-200'
                  : 'bg-red-500/10 border-red-500/30 text-red-200'
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
            <label className="block text-white font-semibold mb-3">
              How would you rate your experience?
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, rating: num }))}
                  className={`w-12 h-12 rounded-lg font-bold text-lg transition-all ${
                    formData.rating === num
                      ? 'bg-[#667eea] text-white scale-110'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">1 = Poor, 5 = Excellent</p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-white font-semibold mb-3">
              Feedback Category <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.category}
              onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-[#667eea] transition-colors"
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
              <label className="block text-white font-semibold mb-3">
                Which feature has the issue? <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {FEATURE_OPTIONS.map(feature => (
                  <button
                    key={feature}
                    type="button"
                    onClick={() => toggleFeature(feature)}
                    className={`p-3 rounded-lg border transition-all text-sm font-medium ${
                      formData.features?.includes(feature)
                        ? 'bg-[#667eea] border-[#667eea] text-white'
                        : 'bg-gray-900 border-gray-700 text-gray-300 hover:border-[#667eea]'
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
              <label className="block text-white font-semibold mb-3">
                What could be improved? <span className="text-red-400">*</span>
              </label>
              <textarea
                value={formData.improvements || ''}
                onChange={e => setFormData(prev => ({ ...prev, improvements: e.target.value }))}
                placeholder="Describe your improvement idea..."
                className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-[#667eea] transition-colors min-h-24 resize-none"
              />
              {errors.improvements && (
                <p className="text-red-400 text-sm mt-1">{errors.improvements}</p>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-white font-semibold mb-3">
              Feedback Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Brief summary of your feedback"
              maxLength={100}
              className={`w-full bg-gray-900 text-white border rounded-lg p-3 focus:outline-none transition-colors ${
                errors.title ? 'border-red-500' : 'border-gray-700 focus:border-[#667eea]'
              }`}
            />
            <div className="flex justify-between items-center mt-2">
              {errors.title && <p className="text-red-400 text-sm">{errors.title}</p>}
              <p className="text-xs text-gray-400 ml-auto">
                {formData.title.length}/100
              </p>
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-white font-semibold mb-3">
              Detailed Feedback <span className="text-red-400">*</span>
            </label>
            <textarea
              value={formData.message}
              onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Please provide detailed feedback. What went well? What could be improved?"
              maxLength={2000}
              className={`w-full bg-gray-900 text-white border rounded-lg p-3 focus:outline-none transition-colors min-h-32 resize-none ${
                errors.message ? 'border-red-500' : 'border-gray-700 focus:border-[#667eea]'
              }`}
            />
            <div className="flex justify-between items-center mt-2">
              {errors.message && <p className="text-red-400 text-sm">{errors.message}</p>}
              <p className="text-xs text-gray-400 ml-auto">
                {formData.message.length}/2000
              </p>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-white font-semibold mb-3">
              Email Address <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="your@email.com"
              className={`w-full bg-gray-900 text-white border rounded-lg p-3 focus:outline-none transition-colors ${
                errors.email ? 'border-red-500' : 'border-gray-700 focus:border-[#667eea]'
              }`}
            />
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
            <p className="text-xs text-gray-400 mt-1">
              We'll use this to follow up on your feedback if needed
            </p>
          </div>

          {/* Recommendation */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.wouldRecommend}
                onChange={e => setFormData(prev => ({ ...prev, wouldRecommend: e.target.checked }))}
                className="w-5 h-5 rounded bg-gray-900 border border-gray-700 cursor-pointer accent-[#667eea]"
              />
              <span className="text-white font-medium">
                I would recommend this app to others
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-[#667eea] hover:bg-[#667eea]/80 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Feedback
                </>
              )}
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-6 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
