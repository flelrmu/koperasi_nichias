import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const SOCKET_URL = 'http://localhost:5000';

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    console.log('🔄 Attempting to connect to WebSocket...');
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✅ Connected to WebSocket:', newSocket.id);
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ WebSocket Connection Error:', err.message);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('⚠️ WebSocket Disconnected:', reason);
    });

    newSocket.on('reconnect', (attempt) => {
      console.log(`🔄 WebSocket Reconnected after ${attempt} attempts`);
    });

    return () => {
      console.log('🔌 Closing WebSocket connection...');
      newSocket.close();
      socketRef.current = null;
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const socket = useContext(SocketContext);
  if (socket === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return socket;
}

export default SocketContext;
