import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useSelector } from "react-redux";

export default function EventComments({ eventId }) {
  const { token } = useSelector(state => state.auth);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  const fetchComments = useCallback(async () => {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/events/${eventId}/comments`);
    setComments(res.data.comments);
  }, [eventId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async () => {
    if (!newComment) return;
    await axios.post(
      `${process.env.REACT_APP_API_URL}/events/${eventId}/comments`,
      { content: newComment },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setNewComment("");
    fetchComments();
  };

  return (
    <div className="mt-4">
      <h3 className="font-bold mb-2">Comments</h3>
      <div className="mb-2">
        <input
          type="text"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Add a comment"
          className="border p-2 rounded w-full"
        />
        <button
          onClick={handleSubmit}
          className="bg-blue-500 text-white p-2 rounded mt-2 hover:bg-blue-600"
        >
          Post
        </button>
      </div>
      <div>
        {comments.map(c => (
          <div key={c._id} className="border p-2 rounded mb-2">
            <strong>{c.user?.name || "Unknown"}</strong>: {c.content}
          </div>
        ))}
      </div>
    </div>
  );
}
