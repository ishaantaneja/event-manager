import React from 'react';

const SocialShare = ({ event }) => {
  const shareUrl = window.location.href;
  const shareText = `Check out this event: ${event.name}`;

  const shareOnFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const shareOnTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const shareOnLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const shareOnWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
      '_blank'
    );
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Event link copied to clipboard!');
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={shareOnFacebook}
        className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 text-sm"
        title="Share on Facebook"
      >
        Facebook
      </button>
      <button
        onClick={shareOnTwitter}
        className="bg-blue-400 text-white px-4 py-2 rounded hover:bg-blue-500 text-sm"
        title="Share on Twitter"
      >
        Twitter
      </button>
      <button
        onClick={shareOnLinkedIn}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
        title="Share on LinkedIn"
      >
        LinkedIn
      </button>
      <button
        onClick={shareOnWhatsApp}
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-sm"
        title="Share on WhatsApp"
      >
        WhatsApp
      </button>
      <button
        onClick={copyToClipboard}
        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm"
        title="Copy link"
      >
        Copy Link
      </button>
    </div>
  );
};

export default SocialShare;
