import { useState } from 'react';

interface ShareLinkProps {
  roomId: string;
}

export default function ShareLink({ roomId }: ShareLinkProps) {
  const [copied, setCopied] = useState(false);
  
  // Generate the full URL to the auction room
  const auctionUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/auctions/${roomId}`
    : `/auctions/${roomId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(auctionUrl);
      setCopied(true);
      
      // Reset the copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-medium text-gray-800 mb-2">Share Auction Link</h3>
      <p className="text-sm text-gray-600 mb-3">
        Share this link with participants so they can join your auction.
      </p>
      
      <div className="flex">
        <input
          type="text"
          value={auctionUrl}
          readOnly
          className="flex-grow px-3 py-2 bg-white border border-gray-300 rounded-l-md text-sm focus:outline-none"
        />
        <button
          onClick={handleCopy}
          className={`px-4 py-2 rounded-r-md text-white text-sm font-medium ${
            copied ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}