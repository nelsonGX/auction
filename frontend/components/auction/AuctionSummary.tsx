import { useState } from 'react';
import { AuctionSummary as AuctionSummaryType } from '../../lib/types';

interface AuctionSummaryProps {
  summary: AuctionSummaryType;
}

export default function AuctionSummary({ summary }: AuctionSummaryProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'participants'>('overview');

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format duration
  const formatDuration = (milliseconds: number | null) => {
    if (!milliseconds) return 'N/A';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    const remainingMinutes = minutes % 60;
    const remainingSeconds = seconds % 60;
    
    let result = '';
    if (hours > 0) {
      result += `${hours}h `;
    }
    if (remainingMinutes > 0 || hours > 0) {
      result += `${remainingMinutes}m `;
    }
    result += `${remainingSeconds}s`;
    
    return result;
  };

  return (
    <div className="bg-zinc-900 rounded-lg shadow-lg overflow-hidden text-zinc-100">
      <div className="p-6 bg-zinc-800 text-zinc-100">
        <h2 className="text-2xl font-bold mb-2">Auction Summary</h2>
        <p className="text-zinc-400">
          {summary.roomName} | Host: {summary.hostUsername}
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-zinc-700">
        <nav className="flex">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'overview'
                ? 'border-b-2 border-indigo-500 text-indigo-400'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'items'
                ? 'border-b-2 border-indigo-500 text-indigo-400'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Items ({summary.totalItems})
          </button>
          <button
            onClick={() => setActiveTab('participants')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'participants'
                ? 'border-b-2 border-indigo-500 text-indigo-400'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Participants ({summary.participants})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-zinc-400">Auction Duration</h3>
                  <p className="mt-1 text-lg font-semibold text-zinc-100">
                    {formatDuration(summary.duration)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-zinc-400">Start Time</h3>
                  <p className="mt-1 text-lg font-semibold text-zinc-100">
                    {formatDate(summary.startTime)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-zinc-400">End Time</h3>
                  <p className="mt-1 text-lg font-semibold text-zinc-100">
                    {formatDate(summary.endTime)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-zinc-400">Total Sales</h3>
                  <p className="mt-1 text-lg font-semibold text-emerald-400">
                    {formatCurrency(summary.totalSales)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-zinc-400">Average Sale Price</h3>
                  <p className="mt-1 text-lg font-semibold text-zinc-100">
                    {formatCurrency(summary.averageSalePrice)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-zinc-400">Highest Sale</h3>
                  <p className="mt-1 text-lg font-semibold text-zinc-100">
                    {formatCurrency(summary.highestSale)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-zinc-100">Results Summary</h3>
              </div>
              <div className="bg-zinc-800 rounded-lg p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-zinc-700 p-4 rounded-lg shadow text-center">
                    <p className="text-sm font-medium text-zinc-400">Total Items</p>
                    <p className="text-2xl font-bold text-zinc-100">{summary.totalItems}</p>
                  </div>
                  <div className="bg-zinc-700 p-4 rounded-lg shadow text-center">
                    <p className="text-sm font-medium text-zinc-400">Sold Items</p>
                    <p className="text-2xl font-bold text-emerald-400">{summary.soldItems}</p>
                  </div>
                  <div className="bg-zinc-700 p-4 rounded-lg shadow text-center">
                    <p className="text-sm font-medium text-zinc-400">Unsold Items</p>
                    <p className="text-2xl font-bold text-amber-400">{summary.unsoldItems}</p>
                  </div>
                  <div className="bg-zinc-700 p-4 rounded-lg shadow text-center">
                    <p className="text-sm font-medium text-zinc-400">Total Participants</p>
                    <p className="text-2xl font-bold text-zinc-100">{summary.participants}</p>
                  </div>
                  <div className="bg-zinc-700 p-4 rounded-lg shadow text-center">
                    <p className="text-sm font-medium text-zinc-400">Sale Percentage</p>
                    <p className="text-2xl font-bold text-indigo-400">
                      {summary.totalItems ? Math.round((summary.soldItems / summary.totalItems) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Items Tab */}
        {activeTab === 'items' && (
          <div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-700">
                <thead className="bg-zinc-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Item
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Starting Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Final Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Winner
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Bids
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-zinc-900 divide-y divide-zinc-700">
                  {summary.itemResults.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-zinc-100">{item.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-zinc-400">{formatCurrency(item.startPrice)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          {item.isSold ? (
                            <span className="font-semibold text-emerald-400">{formatCurrency(item.finalPrice)}</span>
                          ) : (
                            <span className="text-zinc-500">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.isSold ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-900 text-emerald-300">
                            Sold
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-900 text-amber-300">
                            Unsold
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-zinc-100">
                          {item.winner ? item.winner.username : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-zinc-400">{item.bidCount}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Participants Tab */}
        {activeTab === 'participants' && (
          <div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-700">
                <thead className="bg-zinc-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Participant
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Items Won
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Total Spent
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Bids Placed
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-zinc-900 divide-y divide-zinc-700">
                  {summary.participantStats.map((participant) => (
                    <tr key={participant.participantId}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-zinc-100">
                          {participant.username}
                          {participant.isHost && (
                            <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-900 text-indigo-300">
                              Host
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-zinc-100">{participant.itemsWon}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-emerald-400 font-semibold">
                          {formatCurrency(participant.totalSpent)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-zinc-400">{participant.bidCount}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Detailed participant stats */}
            <div className="mt-8 space-y-6">
              {summary.participantStats
                .filter(p => p.itemsWon > 0)
                .map((participant) => (
                  <div key={`${participant.participantId}-details`} className="bg-zinc-800 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-zinc-100 mb-3">
                      {participant.username}&apos;s Winning Items
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {participant.wonItems.map(item => (
                        <div key={item.id} className="bg-zinc-700 p-3 rounded shadow-sm">
                          <div className="text-sm font-medium text-zinc-100">{item.name}</div>
                          <div className="text-sm text-emerald-400">{formatCurrency(item.price)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}