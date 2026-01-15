'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import FeedbackForm from './FeedbackForm';

interface FeedbackButtonProps {
  userId?: string;
  userEmail?: string;
}

export default function FeedbackButton({ userId, userEmail }: FeedbackButtonProps) {
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <>
      {/* Floating Feedback Button */}
      <button
        onClick={() => setShowFeedback(true)}
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 bg-blue-600 hover:bg-blue-700 text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-xl transition-all z-40 group"
        title="Send Feedback"
        aria-label="Send Feedback"
      >
        <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
        <span className="hidden sm:block absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Send Feedback
        </span>
      </button>

      {/* Feedback Form Modal */}
      {showFeedback && (
        <FeedbackForm
          userId={userId}
          userEmail={userEmail}
          onClose={() => setShowFeedback(false)}
          onSubmitSuccess={() => setShowFeedback(false)}
        />
      )}
    </>
  );
}
