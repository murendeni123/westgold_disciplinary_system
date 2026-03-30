// Socket.io event types and handlers

export enum SocketEvents {
  // Connection events
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  CONNECT_ERROR = 'connect_error',

  // Notification events
  NOTIFICATION = 'notification',
  
  // Behaviour events
  INCIDENT_CREATED = 'incident_created',
  MERIT_AWARDED = 'merit_awarded',
  
  // Detention events
  DETENTION_ASSIGNED = 'detention_assigned',
  
  // Attendance events
  ATTENDANCE_UPDATED = 'attendance_updated',
  ATTENDANCE_ALERT = 'attendance_alert',
  
  // Message events
  MESSAGE = 'message',
  MESSAGE_READ = 'message_read',
  
  // Intervention events
  INTERVENTION_UPDATED = 'intervention_updated',
}

export interface SocketEventData {
  [SocketEvents.NOTIFICATION]: {
    id: number;
    type: string;
    title: string;
    message: string;
    created_at: string;
  };
  
  [SocketEvents.INCIDENT_CREATED]: {
    id: number;
    student_id: number;
    student_name: string;
    incident_type: string;
    severity: string;
    date: string;
  };
  
  [SocketEvents.MERIT_AWARDED]: {
    id: number;
    student_id: number;
    student_name: string;
    merit_type: string;
    points: number;
    date: string;
  };
  
  [SocketEvents.DETENTION_ASSIGNED]: {
    id: number;
    student_id: number;
    student_name: string;
    date: string;
    reason: string;
  };
  
  [SocketEvents.MESSAGE]: {
    id: number;
    sender_id: number;
    sender_name: string;
    subject: string;
    sent_at: string;
  };
}
