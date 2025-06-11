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
import { formatValue } from '@/lib/utils';
import AllowanceButton from './AllowanceButton';
import { useTransactionMonitor } from '@/hooks/useTransactionMonitor';
import { getPondTimingStates } from '@/lib/timeUtils';

interface CoinTossButtonProps {
  amount: string;
  numberOfTosses: number;
  pondInfo: PondComprehensiveInfo;
  disabled?: boolean;
  onTransactionSuccess?: () => void;
  canToss?: boolean;
  maxTossAmount?: string;
}

export default function CoinTossButton({
  amount,
  numberOfTosses,
  pondInfo,
  disabled = false,
  onTransactionSuccess,
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

  // Calculate timing states using UTC-based timing (not contract endTime)
  // This ensures frontend handles winner selection timing correctly
  const timingStates = getPondTimingStates(pondInfo.period, Number(pondInfo.endTime));
  const {
    isInFirstSecondsAfterStart,
    isInFirstSecondsAfterEnd,
    isPondDisabled
  } = timingStates;

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

  // Handle the toss action
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
      // Proceed with the toss
      await tossCoin(selectedPond, amount, pondInfo.tokenType, selectedToken, pondInfo);
    } catch (error) {
      // Error is handled by the tossCoin function
      console.error('Error tossing coin:', error);
    }
  }, [selectedPond, pondInfo, showAnimation, tossCoin, amount, selectedToken]);

  // Get pond name for display - memoized to prevent recalculation
  const displayPondName = useMemo(() => {
    const pondName = pondInfo?.name.replace('ETH', '') || 'pond';
    return pondName.includes('Pond')
      ? pondName.replace('Pond', '').trim()
      : pondName;
  }, [pondInfo?.name]);

  // Get the button text based on connection, loading, and timing - memoized
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

    // Pond disabled during critical timing window
    if (isPondDisabled) {
      if (isInFirstSecondsAfterStart) {
        return (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> New pond starting...
          </>
        );
      } else if (isInFirstSecondsAfterEnd) {
        return (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Selecting Winner...
          </>
        );
      } else {
        return (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Closing Pond...
          </>
        );
      }
    }

    // Connected - show standard toss message
    return `Toss ${formatValue(amount, selectedToken?.decimals)} ${selectedToken.symbol} in ${displayPondName} pond`;
  }, [
    isConnected,
    isLoading,
    isPondDisabled,
    isInFirstSecondsAfterStart,
    isInFirstSecondsAfterEnd,
    amount,
    selectedToken?.symbol,
    selectedToken?.decimals,
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
          isPondDisabled));
  }, [
    disabled,
    isLoading,
    isConnected,
    selectedPond,
    amount,
    canToss,
    numberOfTosses,
    isPondDisabled,
  ]);

  // Simplified styling based on state - memoized
  const buttonStyling = useMemo(() => {
    if (isPondDisabled) {
      return 'bg-orange-600 text-white'; // Warning styling for disabled
    }
    return 'text-white animate-gradient bg-[linear-gradient(90deg,#F2E718_0%,#80E8A9_20%,#9353ED_50%,#ED5353_75%,#EDA553_100%)]'; // Default styling
  }, [isPondDisabled]);

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
