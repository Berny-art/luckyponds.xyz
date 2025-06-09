// utils/discordWebhook.ts
import { formatAddress } from '@/lib/utils';
import type { Token } from '@/stores/appStore';

interface WebhookPayload {
  userAddress: string;
  amount: string;
  selectedToken: Token;
  pondName: string;
  pondSymbol: string;
  totalValue: string;
  txHash: string;
}

const WEBHOOK_URL = 'https://discord.com/api/webhooks/1381746457891176530/IzwIOIkxiJfPySJ30YnIT0LRhYaDDfuxMxo7P3_dbmb1UzGvnfOSvqz9MQ4WJmccQMJO';

/**
 * Sends a Discord webhook notification for a successful coin toss
 */
export async function sendDiscordWebhook(payload: WebhookPayload): Promise<void> {
  try {
    const formattedAddress = formatAddress(payload.userAddress);
    
    const embed = {
      title: `${formattedAddress} tossed ${payload.amount} ${payload.selectedToken.symbol} in ${payload.pondName}`,
      description: `Pond size increased to ${payload.totalValue} ${payload.pondSymbol}`,
      url: `https://luckyponds.xyz/ponds/${payload.selectedToken.symbol}`,
      color: 15138645,
      author: {
        name: `TX: ${payload.txHash.slice(0, 18)}...`,
        url: `https://hyperscan.com/tx/${payload.txHash}`
      },
      footer: {
        text: "On luckyponds.xyz"
      },
      timestamp: new Date().toISOString()
    };

    const webhookPayload = {
      content: null,
      embeds: [embed],
      attachments: []
    };

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!response.ok) {
      console.error('Discord webhook failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error sending Discord webhook:', error);
    // Don't throw error to prevent breaking the user experience
  }
}
