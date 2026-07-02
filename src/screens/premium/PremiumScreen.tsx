import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES, SHADOWS } from '../../config/theme';
import { SUBSCRIPTION_PLANS } from '../../config/constants';
import { databaseService } from '../../services/DatabaseService';
import { authService } from '../../services/AuthService';

type SubscriptionTier = 'free' | 'premium' | 'platinum';

interface PlanCardProps {
  tier: SubscriptionTier;
  isCurrent: boolean;
  onSubscribe: (tier: SubscriptionTier) => void;
  loading: boolean;
}

const PAYMENT_OPTIONS = [
  { id: 'apple_pay', label: 'Apple Pay' },
  { id: 'google_pay', label: 'Google Pay' },
  { id: 'credit_card', label: 'Credit Card' },
  { id: 'paypal', label: 'PayPal' },
];

const SubscriptionBadge: React.FC<{ tier: SubscriptionTier }> = ({ tier }) => {
  const colors: Record<SubscriptionTier, string> = {
    free: COLORS.free,
    premium: COLORS.gold,
    platinum: COLORS.platinum,
  };

  return (
    <View style={[styles.badge, { backgroundColor: colors[tier] }]}>
      <Text style={styles.badgeText}>
        {tier === 'free' ? 'FREE' : tier === 'premium' ? 'PREMIUM' : 'PLATINUM'}
      </Text>
    </View>
  );
};

const PlanCard: React.FC<PlanCardProps> = ({ tier, isCurrent, onSubscribe, loading }) => {
  const plan = SUBSCRIPTION_PLANS[tier];
  const isFree = tier === 'free';
  const isPremium = tier === 'premium';
  const isPlatinum = tier === 'platinum';
  const disabled = isFree || isCurrent || loading;

  const renderCardContent = () => (
    <>
      <View style={styles.cardHeader}>
        <Text style={[styles.tierName, isFree && styles.tierNameFree]}>
          {plan.name}
        </Text>
        {isCurrent && (
          <View style={styles.currentPlanBadge}>
            <Text style={styles.currentPlanText}>Current Plan</Text>
          </View>
        )}
      </View>

      <Text style={[styles.price, isFree && styles.priceFree]}>
        {plan.priceLabel}
        {!isFree && <Text style={styles.pricePeriod}>/mo</Text>}
      </Text>

      {isFree && (
        <Text style={styles.freeSubtext}>Basic access</Text>
      )}

      <View style={styles.featuresList}>
        {plan.features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={[styles.featureText, isFree && styles.featureTextFree]}>
              {feature}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.subscribeButton,
          isFree && styles.subscribeButtonFree,
          isCurrent && styles.subscribeButtonCurrent,
          loading && styles.subscribeButtonLoading,
        ]}
        disabled={disabled}
        onPress={() => onSubscribe(tier)}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <Text
            style={[
              styles.subscribeButtonText,
              (isFree || isCurrent) && styles.subscribeButtonTextDisabled,
            ]}
          >
            {isCurrent ? 'Current Plan' : isFree ? 'Free' : 'Subscribe'}
          </Text>
        )}
      </TouchableOpacity>
    </>
  );

  if (isPremium) {
    return (
      <LinearGradient
        colors={['#FFD700', '#FFA500', '#FFD700']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}
      >
        <View style={styles.cardPremiumInner}>
          {renderCardContent()}
        </View>
      </LinearGradient>
    );
  }

  if (isPlatinum) {
    return (
      <LinearGradient
        colors={['#E5E4E2', '#FFFFFF', '#C0C0C0', '#FFFFFF', '#E5E4E2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        style={[styles.gradientBorder, styles.platinumGlow]}
      >
        <View style={styles.cardPlatinumInner}>
          <View style={styles.shineOverlay}>
            <LinearGradient
              colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0)', 'rgba(255,255,255,0.4)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.shineBar}
            />
          </View>
          {renderCardContent()}
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.card, styles.cardFree]}>
      {renderCardContent()}
    </View>
  );
};

const PremiumScreen: React.FC = () => {
  const navigation = useNavigation();
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>('free');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [subscribeLoading, setSubscribeLoading] = useState<SubscriptionTier | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);

  useEffect(() => {
    loadCurrentSubscription();
  }, []);

  const loadCurrentSubscription = async () => {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        setPageLoading(false);
        return;
      }
      const subscription = await databaseService.getSubscription(user.uid);
      if (subscription) {
        setCurrentTier(subscription.tier as SubscriptionTier);
      }
    } catch (err) {
      console.error('Failed to load subscription:', err);
    } finally {
      setPageLoading(false);
    }
  };

  const handleSubscribe = useCallback((tier: SubscriptionTier) => {
    setSelectedTier(tier);
    setPaymentModalVisible(true);
  }, []);

  const handlePaymentSelect = async (paymentMethod: string) => {
    if (!selectedTier) return;
    setPaymentModalVisible(false);
    setSubscribeLoading(selectedTier);

    try {
      const user = authService.getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to subscribe.');
        return;
      }
      await databaseService.updateSubscription(user.uid, selectedTier);
      setCurrentTier(selectedTier);
      Alert.alert('Success', `You are now on the ${SUBSCRIPTION_PLANS[selectedTier].name} plan!`);
    } catch (err) {
      console.error('Subscription failed:', err);
      Alert.alert('Subscription Failed', 'Something went wrong. Please try again later.');
    } finally {
      setSubscribeLoading(null);
    }
  };

  const handleRestorePurchases = async () => {
    setLoading(true);
    try {
      Alert.alert('Restore Purchases', 'No previous purchases found to restore.');
    } catch (err) {
      console.error('Restore failed:', err);
      Alert.alert('Restore Failed', 'Unable to restore purchases.');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Upgrade Your Experience</Text>
        <Text style={styles.subtitle}>
          Choose the plan that's right for you
        </Text>

        <SubscriptionBadge tier={currentTier} />

        <View style={styles.cardsContainer}>
          <PlanCard
            tier="free"
            isCurrent={currentTier === 'free'}
            onSubscribe={handleSubscribe}
            loading={subscribeLoading === 'free'}
          />
          <PlanCard
            tier="premium"
            isCurrent={currentTier === 'premium'}
            onSubscribe={handleSubscribe}
            loading={subscribeLoading === 'premium'}
          />
          <PlanCard
            tier="platinum"
            isCurrent={currentTier === 'platinum'}
            onSubscribe={handleSubscribe}
            loading={subscribeLoading === 'platinum'}
          />
        </View>

        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestorePurchases}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.textSecondary} />
          ) : (
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          )}
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal
        visible={paymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPaymentModalVisible(false)}
        >
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHandle} />
            <Text style={styles.bottomSheetTitle}>
              Choose Payment Method
            </Text>
            <Text style={styles.bottomSheetSubtitle}>
              {selectedTier && SUBSCRIPTION_PLANS[selectedTier].name} —{' '}
              {selectedTier && SUBSCRIPTION_PLANS[selectedTier].priceLabel}/mo
            </Text>
            {PAYMENT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.paymentOption}
                onPress={() => handlePaymentSelect(option.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.paymentOptionText}>{option.label}</Text>
                <Text style={styles.paymentArrow}>→</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.cancelPaymentButton}
              onPress={() => setPaymentModalVisible(false)}
            >
              <Text style={styles.cancelPaymentText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: SIZES.padding,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.paddingSmall,
  },
  backButton: {
    padding: SIZES.paddingSmall,
  },
  backButtonText: {
    fontSize: SIZES.fontLarge,
    color: COLORS.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: SIZES.fontXXLarge,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginTop: SIZES.padding,
  },
  subtitle: {
    fontSize: SIZES.fontMedium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SIZES.paddingSmall,
    marginBottom: SIZES.paddingLarge,
  },
  badge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: SIZES.radiusSmall,
    marginBottom: SIZES.paddingLarge,
  },
  badgeText: {
    fontSize: SIZES.fontSmall,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 1,
  },
  cardsContainer: {
    gap: SIZES.padding,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.paddingLarge,
    ...SHADOWS.medium,
  },
  cardFree: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    opacity: 0.85,
  },
  gradientBorder: {
    borderRadius: SIZES.radiusLarge + 2,
    padding: 2,
  },
  cardPremiumInner: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.paddingLarge - 2,
  },
  cardPlatinumInner: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.paddingLarge - 2,
    overflow: 'hidden',
  },
  platinumGlow: {
    ...SHADOWS.large,
    shadowColor: '#C0C0C0',
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  shineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    overflow: 'hidden',
    borderTopLeftRadius: SIZES.radiusLarge,
    borderTopRightRadius: SIZES.radiusLarge,
  },
  shineBar: {
    width: '100%',
    height: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.paddingSmall,
  },
  tierName: {
    fontSize: SIZES.fontXLarge,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  tierNameFree: {
    color: COLORS.textSecondary,
  },
  currentPlanBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: SIZES.radiusSmall,
  },
  currentPlanText: {
    fontSize: SIZES.fontSmall - 1,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  price: {
    fontSize: SIZES.fontTitle,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  priceFree: {
    color: COLORS.textSecondary,
  },
  pricePeriod: {
    fontSize: SIZES.fontLarge,
    fontWeight: 'normal',
    color: COLORS.textSecondary,
  },
  freeSubtext: {
    fontSize: SIZES.fontSmall,
    color: COLORS.textLight,
    marginBottom: SIZES.padding,
  },
  featuresList: {
    marginTop: SIZES.padding,
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkmark: {
    fontSize: SIZES.fontLarge,
    color: COLORS.success,
    fontWeight: 'bold',
    width: 20,
    textAlign: 'center',
  },
  featureText: {
    fontSize: SIZES.fontMedium,
    color: COLORS.text,
    flex: 1,
  },
  featureTextFree: {
    color: COLORS.textSecondary,
  },
  subscribeButton: {
    marginTop: SIZES.paddingLarge,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: SIZES.radiusLarge,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  subscribeButtonFree: {
    backgroundColor: COLORS.border,
  },
  subscribeButtonCurrent: {
    backgroundColor: COLORS.success,
  },
  subscribeButtonLoading: {
    opacity: 0.7,
  },
  subscribeButtonText: {
    fontSize: SIZES.fontLarge,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  subscribeButtonTextDisabled: {
    color: COLORS.textLight,
  },
  restoreButton: {
    alignSelf: 'center',
    marginTop: SIZES.paddingLarge,
    paddingVertical: SIZES.paddingSmall,
    paddingHorizontal: SIZES.padding,
  },
  restoreButtonText: {
    fontSize: SIZES.fontMedium,
    color: COLORS.textSecondary,
    textDecorationLine: 'underline',
  },
  bottomPadding: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radiusLarge,
    borderTopRightRadius: SIZES.radiusLarge,
    paddingHorizontal: SIZES.paddingLarge,
    paddingBottom: Platform.OS === 'ios' ? 40 : SIZES.paddingLarge,
    paddingTop: SIZES.padding,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SIZES.padding,
  },
  bottomSheetTitle: {
    fontSize: SIZES.fontXLarge,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  bottomSheetSubtitle: {
    fontSize: SIZES.fontMedium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.paddingLarge,
  },
  paymentOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  paymentOptionText: {
    fontSize: SIZES.fontLarge,
    color: COLORS.text,
  },
  paymentArrow: {
    fontSize: SIZES.fontXLarge,
    color: COLORS.textSecondary,
  },
  cancelPaymentButton: {
    marginTop: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
    alignItems: 'center',
  },
  cancelPaymentText: {
    fontSize: SIZES.fontLarge,
    color: COLORS.textSecondary,
  },
});

export default PremiumScreen;
