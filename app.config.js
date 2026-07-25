module.exports = ({ config }) => {
  const sentryBuildConfigured = [
    process.env.SENTRY_ORG,
    process.env.SENTRY_PROJECT,
    process.env.SENTRY_AUTH_TOKEN,
  ].every(Boolean);

  if (!sentryBuildConfigured) return config;

  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      [
        '@sentry/react-native/expo',
        {
          organization: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
        },
      ],
    ],
  };
};
