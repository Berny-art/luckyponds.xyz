// src/components/CoinTossButtonImproved.tsx
'use client';

import { useCallback, useMemo } from 'react';
import { Button } from './ui/button';
import { useTossCoin } from '@/hooks/useTossCoin';
import { useAllowance } from '@/hooks/useAllowance';
import { useAppStore } from '@/stores/appStore';
import { Loader2, Wallet } from 'lucide-react';
import type { PondComprehensiveInfo } from '@/lib/types';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { toast } from 'sonner';
import { PondStatus } from '@/functions/getPondStatus';
import { formatValue } from '@/lib/utils';
import AllowanceButton from './AllowanceButton';
import { useTransactionMonitor } from '@/hooks/useTransactionMonitor';
import { usePondTimers } from '@/hooks/usePondTimers';
import { useWinnerSelection } from '@/hooks/useWinnerSelection';

interface CoinTossButtonProps {
  amount: string;
  numberOfTosses: number;
  pondInfo: PondComprehensiveInfo;
  disabled?: boolean;
  onTransactionSuccess?: () => void;
  timeRemaining?: number;
  isAboutToEnd?: boolean;
  canToss?: boolean;
  maxTossAmount?: string;
}

export default function CoinTossButton({
  amount,
  numberOfTosses,
  pondInfo,
  disabled = false,
  onTransactionSuccess,
  timeRemaining,
  isAboutToEnd,
  canToss = true,
  maxTossAmount,
}: CoinTossButtonProps) {
  const { address } = useAccount();
  const isConnected = !!address;
  const { openConnectModal } = useConnectModal();
  const { selectedPond, selectedToken, showAnimation } = useAppStore();

  // Use improved hooks
  const { tossCoin, isLoading: tossLoading, txHash } = useTossCoin();
  const { isApprovalNeeded } = useAllowance(selectedToken, maxTossAmount || amount, pondInfo);

  // Use React Query-based transaction monitoring
  const { isMonitoring } = useTransactionMonitor({
    txHash,
    onSuccess: onTransactionSuccess,
    enabled: !!txHash,
  });

  // Use React Query-based timer management
  const {
    isPondAboutToEnd,
    is5MinutePondInTimelock,
    isTimeLocked,
    pondStatus,
  } = usePondTimers({ pondInfo, isAboutToEnd });

  // Use React Query-based winner selection
  const { selectWinner, needsWinnerSelection } = useWinnerSelection({
    pondInfo,
    selectedPond,
    pondStatus,
    onTransactionSuccess,
  });

  // Combine all loading states
  const isLoading = tossLoading || isMonitoring;

  // Handle the connect wallet action with RainbowKit
  const handleConnect = useCallback((e: React.MouseEvent) => {
    const x = e.clientX;
    const y = e.clientY;
    if (x && y) {
      showAnimation({ x, y });
    }

    if (openConnectModal) {
      openConnectModal();
    } else {
      toast.error('Connection unavailable', {
        description: 'Wallet connection is not available right now',
      });
    }
  }, [showAnimation, openConnectModal]);

  // Handle the toss (with seamless winner selection if needed)
  const handleToss = useCallback(async (e: React.MouseEvent) => {
    if (!selectedPond || !pondInfo) {
      return;
    }

    const x = e.clientX;
    const y = e.clientY;
    if (x && y) {
      showAnimation({ x, y });
    }

    try {
      // If pond is ready for winner selection, do it silently
      if (needsWinnerSelection()) {
        toast.loading('Processing transaction...', { id: 'toss-loading' });
        try {
          // Silently trigger winner selection
          await selectWinner();
          // Small delay to ensure transactions are processed in order
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error: unknown) {
          toast.error('Transaction failed', {
            id: 'toss-loading',
          });
          return;
        }
      }

      // Proceed with the toss (standard or after selection)
      await tossCoin(selectedPond, amount, pondInfo.tokenType, selectedToken);
    } catch (error) {
      // Error is handled by the tossCoin function
      console.error('Error tossing coin:', error);
    }
  }, [selectedPond, pondInfo, showAnimation, selectWinner, tossCoin, amount, selectedToken, needsWinnerSelection]);

  // Get pond name for display - memoized to prevent recalculation
  const displayPondName = useMemo(() => {
    const pondName = pondInfo?.name.replace('ETH', '') || 'pond';
    return pondName.includes('Pond')
      ? pondName.replace('Pond', '').trim()
      : pondName;
  }, [pondInfo?.name]);

  // Get the button text based on connection, loading, and pond status - memoized
  const buttonText = useMemo(() => {
    // Not connected - show connect wallet button
    if (!isConnected) {
      return (
        <>
          <Wallet className="mr-2 h-5 w-5" /> Connect Wallet
        </>
      );
    }

    if (isLoading) {
      return (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
        </>
      );
    }

    if (isTimeLocked || is5MinutePondInTimelock) {
      return (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Selecting winner...
        </>
      );
    }

    // Pond about to end warning
    if (isPondAboutToEnd) {
      const secondsRemaining = timeRemaining
        ? Math.ceil(timeRemaining / 1000)
        : 0;
      return (
        <>
          {secondsRemaining > 0
            ? `Pond ending in ${secondsRemaining}s - Tosses disabled`
            : 'Pond ending soon - Tosses disabled'}
        </>
      );
    }

    // Connected - show standard toss message
    return `Toss ${formatValue(amount)} ${selectedToken.symbol} in ${displayPondName} pond`;
  }, [
    isConnected,
    isLoading,
    isTimeLocked,
    is5MinutePondInTimelock,
    isPondAboutToEnd,
    timeRemaining,
    amount,
    selectedToken?.symbol,
    displayPondName,
  ]);

  // Handle the click action based on connection status
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!isConnected) {
      handleConnect(e);
    } else {
      handleToss(e);
    }
  }, [isConnected, handleConnect, handleToss]);

  // Determine if button should be disabled - memoized
  const isButtonDisabled = useMemo(() => {
    return disabled ||
      isLoading ||
      (isConnected &&
        (!selectedPond ||
          amount === '0' ||
          !canToss ||
          numberOfTosses < 1 ||
          pondStatus === PondStatus.NotStarted ||
          pondStatus === PondStatus.Completed ||
          isPondAboutToEnd ||
          isTimeLocked ||
          is5MinutePondInTimelock));
  }, [
    disabled,
    isLoading,
    isConnected,
    selectedPond,
    amount,
    canToss,
    numberOfTosses,
    pondStatus,
    isPondAboutToEnd,
    isTimeLocked,
    is5MinutePondInTimelock,
  ]);

  // Enhanced styling based on state - memoized
  const buttonStyling = useMemo(() => {
    if (isPondAboutToEnd) {
      return 'bg-red-500 text-white hover:bg-red-500'; // Warning styling for ending soon
    }
    if (isTimeLocked || is5MinutePondInTimelock) {
      return 'bg-orange-500 text-white hover:bg-orange-500'; // Orange for timelock/selecting winner
    }
    return 'text-white animate-gradient bg-[linear-gradient(90deg,#F2E718_0%,#80E8A9_20%,#9353ED_50%,#ED5353_75%,#EDA553_100%)]'; // Default styling
  }, [isPondAboutToEnd, isTimeLocked, is5MinutePondInTimelock]);

  return (
    <>
      {/* Show allowance button if approval is needed */}
      {isApprovalNeeded && selectedToken && (
        <AllowanceButton
          token={selectedToken}
          amount={maxTossAmount || amount}
          disabled={disabled}
          pondInfo={pondInfo}
          onApprovalComplete={() => {
            // Refresh allowance check - the button will automatically hide when approval is complete
          }}
        />
      )}

      {/* Show toss button if approval is not needed or already given */}
      {!isApprovalNeeded && (
        <Button
          onClick={handleClick}
          disabled={isButtonDisabled}
          className={`w-full py-6 font-bold text-xl ${buttonStyling}`}
        >
          {buttonText}
        </Button>
      )}
    </>
  );
}
