import { useState, type ChangeEvent, type FormEvent } from 'react';

interface RoomCodeScreenProps {
  onSubmit: (roomCode: string) => void;
}

const RoomCodeScreen = ({ onSubmit }: RoomCodeScreenProps) => {
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = roomCode.trim();
    if (!trimmed) {
      setError('Please enter the room code provided for this device.');
      return;
    }
    setError(null);
    onSubmit(trimmed);
  };

  return (
    <div className="app-shell">
      <div className="card">
        <h1>Join A Monitoring Room</h1>
        <p className="subtle-text">
          Enter the room code supplied by the operator to begin the camera capture sequence.
        </p>
        <form onSubmit={handleSubmit}>
          <label className="subtle-text" htmlFor="room-code-input">
            Room Code
          </label>
          <input
            id="room-code-input"
            className="text-input"
            value={roomCode}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setRoomCode(event.target.value)}
            placeholder="e.g. ALC-204"
            autoComplete="off"
            autoFocus
          />
          {error && <div className="error-banner">{error}</div>}
          <button type="submit" className="action-button">
            Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default RoomCodeScreen;
