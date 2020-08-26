/* eslint-disable no-console */
import socketIO from 'socket.io-client';
import generateUrl from '../api/generator';

let socket: SocketIOClient.Socket;

export const connect = (roomId: string) => {
  socket = socketIO(generateUrl(), {
    query: {
      roomId,
    },
    forceNew: true,
  });
  console.log('socket in utils', socket);
  return socket;
};

export const getSocket = () => socket;
