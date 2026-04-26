// Enable bearer-token forwarding for the shared AWS backend.
// The React app reuses the same local/session storage token key as the
// existing frontend, so the deployed site can authenticate without
// provisioning a second identity system.
window.__awsConfig = {
  authEnabled: true,
};
