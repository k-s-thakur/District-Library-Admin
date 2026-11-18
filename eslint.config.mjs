import nextConfig from "eslint-config-next";

const config = [
  ...nextConfig,
  {
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "import/no-anonymous-default-export": "warn",
    },
  },
];

export default config;
