import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
  RTCView,
  MediaStream,
  MediaStreamTrack,
} from 'react-native-webrtc';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SIZES, SHADOWS, FREE_TIER_LIMITS, PREMIUM_TIER_LIMITS } from '../../config/theme';
import { databaseService } from '../../services/DatabaseService';
import { authService } from '../../services/AuthService';
import { RootStackParamList } from '../../types';
import VideoCallControls from '../../components/VideoCallControls';

type VideoCallScreenNavigationProp = StackNavigationProp<RootStackParamList, 'VideoCall'>;
type VideoCallScreenRouteProp = RouteProp<RootStackParamList, 'VideoCall'>;

interface VideoCallScreenProps {
  navigation: VideoCallScreenNavigationProp;
  route: VideoCallScreenRouteProp;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const VideoCallScreen: React.FC<VideoCallScreenProps> = ({ navigation, route }) => {
  const { roomUrl, matchId } = route.params;

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [callStatus, setCallStatus] = useState<'connecting' | 'active' | 'ended'>('connecting');
  const [incomingCall, setIncomingCall] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [callId, setCallId] = useState<string | null>(null);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const currentUser = authService.getCurrentUser();

  const startTimer = useCallback(() => {
    timerInterval.current = setInterval(() => {
      setCallTimer(prev => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getLocalStream = useCallback(async () => {
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: {
          facingMode: isFrontCamera ? 'user' : 'environment',
          width: { ideal: 720 },
          height: { ideal: 1280 },
        },
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Error getting local stream:', error);
      Alert.alert('Camera Error', 'Unable to access camera or microphone.');
      throw error;
    }
  }, [isFrontCamera]);

  const createPeerConnection = useCallback(async (stream: MediaStream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnection.current = pc;

    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    const pcAny = pc as any;
    pcAny.onicecandidate = (event: any) => {
      if (event.candidate) {
        console.log('ICE candidate:', event.candidate);
      }
    };

    pcAny.ontrack = (event: any) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pcAny.oniceconnectionstatechange = () => {
      if (pcAny.iceConnectionState === 'disconnected' || pcAny.iceConnectionState === 'failed') {
        handleEndCall();
      }
    };

    return pc;
  }, []);

  const startCall = useCallback(async () => {
    try {
      setCallStatus('connecting');
      const stream = await getLocalStream();
      const pc = await createPeerConnection(stream);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // In a real app, send offer via signaling server
      console.log('Offer created, sending via signaling...');

      // Simulate signaling response
      setTimeout(async () => {
        setCallStatus('active');
        startTimer();

        if (currentUser && matchId) {
          const id = await databaseService.createVideoCall(
            matchId,
            currentUser.uid,
            '',
            roomUrl,
            `room_${matchId}`
          );
          setCallId(id);
        }
      }, 2000);
    } catch (error) {
      console.error('Error starting call:', error);
      setCallStatus('ended');
    }
  }, [getLocalStream, createPeerConnection, startTimer, currentUser, matchId, roomUrl]);

  const handleAnswerCall = useCallback(async () => {
    try {
      setIncomingCall(false);
      setCallStatus('connecting');
      const stream = await getLocalStream();
      const pc = await createPeerConnection(stream);

      // In a real app, receive offer from signaling and create answer
      setCallStatus('active');
      startTimer();
    } catch (error) {
      console.error('Error answering call:', error);
    }
  }, [getLocalStream, createPeerConnection, startTimer]);

  const handleEndCall = useCallback(async () => {
    stopTimer();

    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    setCallStatus('ended');

    try {
      const duration = Math.floor(callTimer);
      if (callId) {
        await databaseService.updateVideoCallStatus(callId, 'completed', duration);
      }
    } catch (error) {
      console.error('Error updating call status:', error);
    }

    navigation.goBack();
  }, [stopTimer, callTimer, callId, navigation]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  }, [isMuted]);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  }, [isVideoEnabled]);

  const switchCamera = useCallback(async () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        const newFacing = isFrontCamera ? 'environment' : 'user';
        try {
          const newStream = await mediaDevices.getUserMedia({
            audio: true,
            video: {
              facingMode: newFacing,
              width: { ideal: 720 },
              height: { ideal: 1280 },
            },
          });

          const oldTrack = localStreamRef.current.getVideoTracks()[0];
          localStreamRef.current.removeTrack(oldTrack);
          const newVideoTrack = newStream.getVideoTracks()[0];
          localStreamRef.current.addTrack(newVideoTrack);

          if (peerConnection.current) {
            const sender = peerConnection.current
              .getSenders()
              .find(s => s.track?.kind === 'video');
            if (sender) {
              await sender.replaceTrack(newVideoTrack);
            }
          }

          setLocalStream(localStreamRef.current);
          setIsFrontCamera(!isFrontCamera);

          newStream.getAudioTracks().forEach(t => t.stop());
        } catch (error) {
          console.error('Error switching camera:', error);
        }
      }
    }
  }, [isFrontCamera]);

  const handleDeclineCall = useCallback(() => {
    setIncomingCall(false);
    setCallStatus('ended');
    if (callId) {
      databaseService.updateVideoCallStatus(callId, 'rejected');
    }
    navigation.goBack();
  }, [callId, navigation]);

  useEffect(() => {
    const simulateIncoming = route.params?.roomUrl?.includes('incoming');
    if (simulateIncoming) {
      setIncomingCall(true);
    } else {
      startCall();
    }

    return () => {
      stopTimer();
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  if (incomingCall) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.incomingContainer}>
          <View style={styles.incomingContent}>
            <Icon name="person-circle-outline" size={100} color={COLORS.white} />
            <Text style={styles.incomingName}>User</Text>
            <Text style={styles.incomingStatus}>Incoming Video Call...</Text>
            <View style={styles.incomingActions}>
              <TouchableOpacity
                style={styles.declineButton}
                onPress={handleDeclineCall}
              >
                <Icon name="close-outline" size={36} color={COLORS.white} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={handleAnswerCall}
              >
                <Icon name="videocam-outline" size={36} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (callStatus === 'ended') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.endedContainer}>
          <Icon name="call-outline" size={64} color={COLORS.textLight} />
          <Text style={styles.endedText}>Call Ended</Text>
          <Text style={styles.endedDuration}>
            Duration: {formatTime(callTimer)}
          </Text>
          <TouchableOpacity
            style={styles.returnButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.returnButtonText}>Return to Chat</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.remoteVideoContainer}>
        {remoteStream ? (
          <RTCView
            streamURL={remoteStream.toURL()}
            style={styles.remoteVideo}
            objectFit="cover"
            mirror={false}
            zOrder={0}
          />
        ) : (
          <View style={styles.remoteVideoPlaceholder}>
            <Icon name="person-circle-outline" size={80} color={COLORS.textLight} />
            <Text style={styles.connectingText}>
              {callStatus === 'connecting' ? 'Connecting...' : 'Waiting for other user...'}
            </Text>
          </View>
        )}

        <View style={styles.topBar}>
          <View style={styles.callInfo}>
            <View
              style={[
                styles.callStatusDot,
                callStatus === 'active' ? styles.callActive : styles.callConnecting,
              ]}
            />
            <Text style={styles.callTimerText}>
              {callStatus === 'active' ? formatTime(callTimer) : 'Connecting...'}
            </Text>
          </View>
        </View>

        <View style={styles.localVideoContainer}>
          {localStream ? (
            <RTCView
              streamURL={localStream.toURL()}
              style={styles.localVideo}
              objectFit="cover"
              mirror={isFrontCamera}
              zOrder={1}
            />
          ) : (
            <View style={styles.localVideoPlaceholder}>
              <Icon name="person-outline" size={24} color={COLORS.textLight} />
            </View>
          )}
        </View>
      </View>

      <VideoCallControls
        isMuted={isMuted}
        isVideoOff={!isVideoEnabled}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onSwitchCamera={switchCamera}
        onHangUp={handleEndCall}
        onEndCall={handleEndCall}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  remoteVideoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteVideo: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteVideoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
  },
  connectingText: {
    fontSize: SIZES.fontLarge,
    color: COLORS.textLight,
    marginTop: SIZES.padding,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingHorizontal: SIZES.padding,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  callInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
    borderRadius: SIZES.radiusLarge,
    gap: SIZES.paddingSmall,
  },
  callStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  callActive: {
    backgroundColor: COLORS.success,
  },
  callConnecting: {
    backgroundColor: COLORS.accent,
  },
  callTimerText: {
    fontSize: SIZES.fontMedium,
    color: COLORS.white,
    fontWeight: '600',
  },
  localVideoContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 30,
    right: SIZES.padding,
    width: 120,
    height: 180,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...SHADOWS.large,
  },
  localVideo: {
    flex: 1,
    backgroundColor: '#000',
  },
  localVideoPlaceholder: {
    flex: 1,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  incomingContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  incomingContent: {
    alignItems: 'center',
    gap: SIZES.padding,
  },
  incomingName: {
    fontSize: SIZES.fontTitle,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: SIZES.padding,
  },
  incomingStatus: {
    fontSize: SIZES.fontLarge,
    color: COLORS.textLight,
  },
  incomingActions: {
    flexDirection: 'row',
    gap: SIZES.paddingLarge * 2,
    marginTop: SIZES.paddingLarge * 2,
  },
  declineButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SIZES.padding,
  },
  endedText: {
    fontSize: SIZES.fontXXLarge,
    fontWeight: 'bold',
    color: COLORS.textLight,
  },
  endedDuration: {
    fontSize: SIZES.fontLarge,
    color: COLORS.textLight,
    opacity: 0.7,
  },
  returnButton: {
    marginTop: SIZES.paddingLarge,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.paddingLarge * 2,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radiusLarge,
  },
  returnButtonText: {
    fontSize: SIZES.fontLarge,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default VideoCallScreen;
