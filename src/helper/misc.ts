export async function Wait(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function GenerateKey(length: number): string {
	return Math.random().toString(36).substring(2, length + 2);
}
