'use client';

import { Button } from './ui/button';
import { Loader2, Wallet } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { toast } from 'sonner';
import { useAppStore } from '@/stores/appStore';
import type { Token } from '@/stores/appStore';
import type { PondComprehensiveInfo } from '@/lib/types';
import { useAllowance } from '@/hooks/useAllowance';
import { useCallback } from 'react';

interface AllowanceButtonProps {
  token: Token;
  amount: string;
  disabled?: boolean;
  onApprovalComplete?: () => void;
  pondInfo?: PondComprehensiveInfo;
}

export default function AllowanceButton({
  token,
  amount,
  disabled = false,
  onApprovalComplete,
  pondInfo,
}: AllowanceButtonProps) {
  const { address } = useAccount();
  const isConnected = !!address;
  const { openConnectModal } = useConnectModal();
  const { showAnimation } = useAppStore();
  const { isApprovalNeeded, isApproving, approveToken } = useAllowance(token, amount, pondInfo);

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

  // Handle the approval action
  const handleApproval = useCallback(async (e: React.MouseEvent) => {
    const x = e.clientX;
    const y = e.clientY;
    if (x && y) {
      showAnimation({ x, y });
    }

    const result = await approveToken();
    if (result.success) {
      // Wait a moment for the approval to be processed, then trigger callback
      setTimeout(() => {
        onApprovalComplete?.();
      }, 1000);
    }
  }, [showAnimation, approveToken, onApprovalComplete]);

  // Get the button text based on connection and approval status
  const getButtonText = () => {
    if (!isConnected) {
      return (
        <>
          <Wallet className="mr-2 h-5 w-5" /> Connect Wallet
        </>
      );
    }

    if (isApproving) {
      return (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Approving token...
        </>
      );
    }

    return `Approve ${token.symbol} spend limit`;
  };

  // Handle the click action based on connection status
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!isConnected) {
      handleConnect(e);
    } else {
      handleApproval(e);
    }
  }, [isConnected, handleConnect, handleApproval]);

  // Don't render if approval is not needed
  if (!isApprovalNeeded) {
    return null;
  }

  // Determine if button should be disabled
  const isButtonDisabled = disabled || isApproving;

  return (
    <Button
      onClick={handleClick}
      disabled={isButtonDisabled}
      className="w-full py-6 font-bold text-xl text-white animate-gradient bg-[linear-gradient(90deg,#F2E718_0%,#80E8A9_20%,#9353ED_50%,#ED5353_75%,#EDA553_100%)]"
    >
      {getButtonText()}
    </Button>
  );
}
