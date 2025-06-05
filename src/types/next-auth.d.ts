declare module 'next-auth' {
	interface Session {
		address?: string;
	}
}

declare module 'next-auth/jwt' {
	interface JWT {
		address?: string;
	}
}
