import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verifyMessage } from 'viem';
import { parseSiweMessage } from 'viem/siwe';

const authOptions: NextAuthOptions = {
	providers: [
		CredentialsProvider({
			name: 'credentials',
			credentials: {
				message: {
					label: 'Message',
					type: 'text',
				},
				signature: {
					label: 'Signature',
					type: 'text',
				},
			},
			async authorize(credentials) {
				try {
					if (!credentials?.message || !credentials?.signature) {
						console.error('Missing message or signature');
						return null;
					}

					// Parse the SIWE message using viem
					const message = parseSiweMessage(credentials.message);

					// Verify we have a valid address
					if (!message.address) {
						console.error('No address in SIWE message');
						return null;
					}

					// Verify domain matches
					const nextAuthUrl = new URL(
						process.env.NEXTAUTH_URL || 'http://localhost:3000',
					);
					if (message.domain !== nextAuthUrl.host) {
						console.error(
							'Domain mismatch:',
							message.domain,
							'vs',
							nextAuthUrl.host,
						);
						return null;
					}

					// Verify the signature using viem
					const isValid = await verifyMessage({
						address: message.address,
						message: credentials.message,
						signature: credentials.signature as `0x${string}`,
					});

					if (!isValid) {
						console.error('Invalid signature');
						return null;
					}

					return {
						id: message.address,
						address: message.address,
					};
				} catch (e) {
					console.error('SIWE verification failed:', e);
					return null;
				}
			},
		}),
	],
	session: { strategy: 'jwt' },
	secret: process.env.NEXTAUTH_SECRET,
	callbacks: {
		async session({ session, token }) {
			if (token.sub) {
				session.address = token.sub;
				session.user = session.user || {};
			}
			return session;
		},
		async jwt({ token, user }) {
			if (user) {
				token.sub = user.id;
			}
			return token;
		},
	},
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
