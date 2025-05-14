import RoomCreation from '../components/room/RoomCreation';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Auction Platform
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Create and join real-time auctions with ease.
          </p>
        </div>
        
        <div className="mt-12">
          <RoomCreation />
        </div>
      </div>
    </div>
  );
}