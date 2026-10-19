import next from "eslint-config-next"

const config = [
  { ignores: [".next/**", "node_modules/**", "e2e/**", "test/**", "coverage/**"] },
  ...next,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]

export default config
