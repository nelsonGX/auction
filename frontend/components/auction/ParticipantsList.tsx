interface Participant {
  id: string;
  username: string;
  isHost: boolean;
}

interface ParticipantsListProps {
  participants: Participant[];
  currentUserId: string;
}

export default function ParticipantsList({ participants, currentUserId }: ParticipantsListProps) {
  // Sort participants: host first, then current user, then others alphabetically
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.isHost && !b.isHost) return -1;
    if (!a.isHost && b.isHost) return 1;
    if (a.id === currentUserId && b.id !== currentUserId) return -1;
    if (a.id !== currentUserId && b.id === currentUserId) return 1;
    return a.username.localeCompare(b.username);
  });

  return (
    <div className="w-full bg-zinc-800 rounded-lg shadow-md overflow-hidden">
      <div className="bg-zinc-800 p-4 border-b border-zinc-600">
        <h3 className="text-lg font-semibold text-white">
          Participants ({participants.length})
        </h3>
      </div>
      
      <div className="max-h-80 overflow-y-auto">
        <ul className="divide-y divide-zinc-700">
          {sortedParticipants.map((participant) => (
            <li 
              key={participant.id} 
              className={`flex items-center p-3 ${
                participant.id === currentUserId ? 'bg-yellow-950/50' : ''
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-green-500 mr-3" />
              <div className="flex-grow">
                <p className="text-white">
                  {participant.username}
                  {participant.id === currentUserId && ' (You)'}
                </p>
              </div>
              {participant.isHost && (
                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                  Host
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}