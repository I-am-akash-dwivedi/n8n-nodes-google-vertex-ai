import { config } from '@n8n/node-cli/eslint';

export default [
	...config,
	{
		// Test files and test helpers legitimately use `any` for mocks.
		files: ['**/*.test.ts', '**/test/**/*.ts'],
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
		},
	},
];
