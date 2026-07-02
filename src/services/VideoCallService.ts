import { VIDEO_CALL_PROVIDER, DAILY_API_KEY } from '../config/constants';

const DAILY_API_BASE = 'https://api.daily.co/v1';

interface DailyRoomResponse {
  url: string;
  name: string;
  id: string;
  created_at: string;
}

interface DailyErrorResponse {
  error?: string;
  message?: string;
}

class VideoCallService {
  private headers: Record<string, string>;

  constructor() {
    this.headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DAILY_API_KEY}`,
    };
  }

  /**
   * Creates a new Daily.co video call room.
   * @returns The room URL and name
   */
  async createRoom(): Promise<{ url: string; name: string }> {
    if (!DAILY_API_KEY) {
      throw new Error('Daily API key is not configured. Set DAILY_API_KEY in constants.');
    }
    if (VIDEO_CALL_PROVIDER !== 'daily') {
      throw new Error(`Unsupported video call provider: ${VIDEO_CALL_PROVIDER}`);
    }

    try {
      const response = await fetch(`${DAILY_API_BASE}/rooms`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          properties: {
            enable_prejoin_ui: false,
            enable_network_ui: true,
            enable_screenshare: false,
            start_audio_off: true,
            start_video_off: true,
          },
        }),
      });

      if (!response.ok) {
        const errorBody: DailyErrorResponse = await response.json();
        throw new Error(
          `Failed to create Daily room: ${errorBody.error || errorBody.message || response.statusText}`
        );
      }

      const data: DailyRoomResponse = await response.json();
      return {
        url: data.url,
        name: data.name,
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`VideoCallService.createRoom: ${error.message}`);
      }
      throw new Error('VideoCallService.createRoom: An unexpected error occurred');
    }
  }

  /**
   * Joins an existing Daily.co video call room.
   * @param roomUrl - The URL of the room to join
   */
  async joinRoom(roomUrl: string): Promise<void> {
    if (!roomUrl) {
      throw new Error('Room URL is required to join a video call.');
    }

    try {
      const response = await fetch(`${DAILY_API_BASE}/rooms`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch available rooms: ${response.statusText}`);
      }

      const data = await response.json();
      const rooms: DailyRoomResponse[] = data.data || [];
      const roomExists = rooms.some((room) => room.url === roomUrl);

      if (!roomExists) {
        throw new Error(`Room not found: ${roomUrl}`);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`VideoCallService.joinRoom: ${error.message}`);
      }
      throw new Error('VideoCallService.joinRoom: An unexpected error occurred');
    }
  }

  /**
   * Leaves/deletes a Daily.co video call room.
   * @param roomUrl - The URL of the room to leave
   */
  async leaveRoom(roomUrl: string): Promise<void> {
    if (!roomUrl) {
      throw new Error('Room URL is required to leave a video call.');
    }

    const roomName = this.extractRoomName(roomUrl);

    try {
      const response = await fetch(`${DAILY_API_BASE}/rooms/${roomName}`, {
        method: 'DELETE',
        headers: this.headers,
      });

      if (!response.ok && response.status !== 404) {
        const errorBody: DailyErrorResponse = await response.json();
        throw new Error(
          `Failed to delete Daily room: ${errorBody.error || errorBody.message || response.statusText}`
        );
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`VideoCallService.leaveRoom: ${error.message}`);
      }
      throw new Error('VideoCallService.leaveRoom: An unexpected error occurred');
    }
  }

  /**
   * Checks if the user can initiate a video call based on their tier's daily minute limit.
   * @param userTier - The subscription tier of the user
   * @param minutesUsedToday - Minutes of video calls already used today
   * @returns Whether the user can make a call
   */
  checkCallLimits(userTier: 'free' | 'premium' | 'platinum', minutesUsedToday: number): boolean {
    const limits: Record<string, number> = {
      free: 5,
      premium: 30,
      platinum: Infinity,
    };

    const maxMinutes = limits[userTier];

    if (maxMinutes === undefined) {
      console.warn(`Unknown user tier: ${userTier}. Defaulting to free limits.`);
      return minutesUsedToday < limits.free;
    }

    return minutesUsedToday < maxMinutes;
  }

  /**
   * Extracts the room name from a Daily.co room URL.
   * @param roomUrl - Full Daily.co room URL
   * @returns The room name segment
   */
  private extractRoomName(roomUrl: string): string {
    const parts = roomUrl.replace(/\/$/, '').split('/');
    return parts[parts.length - 1] || roomUrl;
  }
}

export const videoCallService = new VideoCallService();
