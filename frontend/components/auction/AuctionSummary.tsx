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
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6 bg-blue-500 text-white">
        <h2 className="text-2xl font-bold mb-2">Auction Summary</h2>
        <p className="text-white/80">
          {summary.roomName} | Host: {summary.hostUsername}
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b">
        <nav className="flex">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'overview'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'items'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Items ({summary.totalItems})
          </button>
          <button
            onClick={() => setActiveTab('participants')}
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'participants'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
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
                  <h3 className="text-sm font-medium text-gray-500">Auction Duration</h3>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {formatDuration(summary.duration)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Start Time</h3>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {formatDate(summary.startTime)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">End Time</h3>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {formatDate(summary.endTime)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Total Sales</h3>
                  <p className="mt-1 text-lg font-semibold text-green-600">
                    {formatCurrency(summary.totalSales)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Average Sale Price</h3>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {formatCurrency(summary.averageSalePrice)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Highest Sale</h3>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {formatCurrency(summary.highestSale)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Results Summary</h3>
              </div>
              <div className="bg-gray-100 rounded-lg p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow text-center">
                    <p className="text-sm font-medium text-gray-500">Total Items</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.totalItems}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow text-center">
                    <p className="text-sm font-medium text-gray-500">Sold Items</p>
                    <p className="text-2xl font-bold text-green-600">{summary.soldItems}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow text-center">
                    <p className="text-sm font-medium text-gray-500">Unsold Items</p>
                    <p className="text-2xl font-bold text-yellow-600">{summary.unsoldItems}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow text-center">
                    <p className="text-sm font-medium text-gray-500">Total Participants</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.participants}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow text-center">
                    <p className="text-sm font-medium text-gray-500">Sale Percentage</p>
                    <p className="text-2xl font-bold text-blue-600">
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
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Starting Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Final Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Winner
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bids
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {summary.itemResults.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatCurrency(item.startPrice)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.isSold ? (
                            <span className="font-semibold text-green-600">{formatCurrency(item.finalPrice)}</span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.isSold ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Sold
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Unsold
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.winner ? item.winner.username : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{item.bidCount}</div>
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
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Participant
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items Won
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Spent
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bids Placed
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {summary.participantStats.map((participant) => (
                    <tr key={participant.participantId}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {participant.username}
                          {participant.isHost && (
                            <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              Host
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{participant.itemsWon}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-semibold">
                          {formatCurrency(participant.totalSpent)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{participant.bidCount}</div>
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
                  <div key={`${participant.participantId}-details`} className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">
                      {participant.username}'s Winning Items
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {participant.wonItems.map(item => (
                        <div key={item.id} className="bg-white p-3 rounded shadow-sm">
                          <div className="text-sm font-medium">{item.name}</div>
                          <div className="text-sm text-green-600">{formatCurrency(item.price)}</div>
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