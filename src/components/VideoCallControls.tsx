import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../config/theme';

interface VideoCallControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onSwitchCamera: () => void;
  onHangUp: () => void;
  onEndCall: () => void;
}

interface ControlButtonProps {
  icon: string;
  onPress: () => void;
  active?: boolean;
  danger?: boolean;
  label?: string;
}

const ControlButton: React.FC<ControlButtonProps> = ({ icon, onPress, active = true, danger, label }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.buttonWrapper}>
    <View
      style={[
        styles.button,
        !active && styles.buttonInactive,
        danger && styles.buttonDanger,
      ]}
    >
      <Text style={[styles.buttonIcon, !active && styles.buttonIconInactive, danger && styles.buttonIconDanger]}>
        {icon}
      </Text>
    </View>
    {label && <Text style={styles.buttonLabel}>{label}</Text>}
  </TouchableOpacity>
);

const VideoCallControls: React.FC<VideoCallControlsProps> = ({
  isMuted,
  isVideoOff,
  onToggleMute,
  onToggleVideo,
  onSwitchCamera,
  onHangUp,
  onEndCall,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.controlsRow}>
        <ControlButton
          icon={isMuted ? '🔇' : '🎤'}
          onPress={onToggleMute}
          active={!isMuted}
          label="Mute"
        />
        <ControlButton
          icon={isVideoOff ? '📷' : '📹'}
          onPress={onToggleVideo}
          active={isVideoOff}
          label="Video"
        />
        <ControlButton
          icon="🔄"
          onPress={onSwitchCamera}
          label="Flip"
        />
        <ControlButton
          icon="📞"
          onPress={onHangUp}
          danger
          label="Hang Up"
        />
        <ControlButton
          icon="✕"
          onPress={onEndCall}
          danger
          label="End"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: SIZES.radiusLarge,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...SHADOWS.large,
  },
  buttonWrapper: {
    alignItems: 'center',
    gap: 4,
  },
  button: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonInactive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  buttonDanger: {
    backgroundColor: COLORS.error,
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  buttonIcon: {
    fontSize: 22,
  },
  buttonIconInactive: {
    opacity: 0.5,
  },
  buttonIconDanger: {
    fontSize: 24,
  },
  buttonLabel: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '500',
    opacity: 0.8,
  },
});

export default VideoCallControls;
