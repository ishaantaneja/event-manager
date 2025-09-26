import React from "react";

export default function SocialShare({ url, title }) {
  return (
    <div className="flex gap-2 mt-2">
      <a href={`https://twitter.com/intent/tweet?url=${url}&text=${title}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Twitter</a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${url}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Facebook</a>
      <a href={`https://www.linkedin.com/shareArticle?url=${url}&title=${title}`} target="_blank" rel="noopener noreferrer" className="text-blue-800 hover:underline">LinkedIn</a>
    </div>
  );
}
