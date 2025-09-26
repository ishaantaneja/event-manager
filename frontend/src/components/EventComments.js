import React from 'react';

const EventComments = ({ comments }) => {
  if (!comments || comments.length === 0) {
    return <p className="text-gray-500">No comments yet. Be the first to comment!</p>;
  }

  return (
    <div className="space-y-4">
      {comments.map((comment, index) => (
        <div key={comment._id || index} className="border-b pb-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold">{comment.user?.name || 'Anonymous'}</p>
              <p className="text-gray-700 mt-1">{comment.content}</p>
            </div>
            <span className="text-xs text-gray-500">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EventComments;
