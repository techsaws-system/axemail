import type { Config } from "tailwindcss";
import { PluginAPI } from "tailwindcss/types/config";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
	content: [
		"./src/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/containers/**/*.{js,ts,jsx,tsx,mdx}",
	],

	theme: {
		extend: {
			colors: {
				background: "var(--background)",
				foreground: "var(--foreground)",

				heading: "var(--heading)",

				card: {
					DEFAULT: "var(--card)",
					foreground: "var(--card-foreground)",
				},

				popover: {
					DEFAULT: "var(--popover)",
					foreground: "var(--popover-foreground)",
				},

				primary: {
					DEFAULT: "var(--primary)",
					foreground: "var(--primary-foreground)",
					hover: "var(--primary-hover)",
				},

				muted: {
					DEFAULT: "var(--muted)",
					foreground: "var(--muted-foreground)",
					hover: "var(--muted-hover)",
				},

				accent: {
					DEFAULT: "var(--accent)",
					foreground: "var(--accent-foreground)",
				},

				destructive: {
					DEFAULT: "var(--destructive)",
					foreground: "var(--destructive-foreground)",
				},

				border: "var(--border)",
				input: "var(--input)",
				ring: "var(--ring)",

				sidebar: {
					DEFAULT: "var(--sidebar-background)",
					foreground: 'var(--sidebar-foreground)',

					primary: 'var(--sidebar-primary)',
					'primary-foreground': 'var(--sidebar-primary-foreground)',

					accent: 'var(--sidebar-accent)',
					'accent-foreground': 'var(--sidebar-accent-foreground)',

					border: 'var(--sidebar-border)',
					ring: 'var(--sidebar-ring)'
				}
			},

			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},

			screens: {
				xs: "360px",
				sm: "480px",
				md: "768px",
				lg: "1024px",
				xl: "1280px",
				"2xl": "1536px",
			},

			keyframes: {
				"accordion-down": {
					from: {
						height: "0",
					},
					to: {
						height: "var(--radix-accordion-content-height)",
					},
				},

				"accordion-up": {
					from: {
						height: "var(--radix-accordion-content-height)",
					},
					to: {
						height: "0",
					},
				},
			},

			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
			},
		},
	},

	plugins: [
		function ({ addComponents }: PluginAPI) {
			addComponents({
				".layout-standard": {
					maxWidth: "1536px",
					width: "90%",
					marginLeft: "auto",
					marginRight: "auto",
				},

				".dashboard-layout-standard": {
					width: "95%",
					marginLeft: "auto",
					marginRight: "auto",
				},

				".animation-standard": {
					transition: "all 0.5s ease-in-out",
				},

				".section-padding-standard": {
					paddingTop: "2rem",
					paddingBottom: "2rem",

					"@screen md": {
						paddingTop: "2.5rem",
						paddingBottom: "2.5rem",
					},

					"@screen lg": {
						paddingTop: "3rem",
						paddingBottom: "3rem",
					},

					"@screen xl": {
						paddingTop: "4rem",
						paddingBottom: "4rem",
					},
				},

				".section-margin-standard": {
					marginTop: "3rem",
					marginBottom: "3rem",

					"@screen md": {
						marginTop: "3.5rem",
						marginBottom: "3.5rem",
					},

					"@screen lg": {
						marginTop: "4rem",
						marginBottom: "4rem",
					},

					"@screen xl": {
						marginTop: "5rem",
						marginBottom: "5rem",
					},
				},

				".flex-center": {
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
				},

				".standard-card-styling": {
					width: "100%",
					borderRadius: "0.5rem",
					border: "1px solid var(--border)",
					boxShadow: "0 0.375rem 1rem rgba(0, 0, 0, 0.1)",
				},
			});
		},

		tailwindcssAnimate,
	],
} satisfies Config;
