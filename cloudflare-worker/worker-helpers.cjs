function shouldServeStatusPage(method = '') {
  return String(method).toUpperCase() === 'GET';
}

function buildStatusPayload(path = '/') {
  return {
    ok: true,
    service: 'rail-proxy',
    path,
    message: 'Worker is running',
    usage: 'Use POST requests for VerifyOtp, SendOtp, and OrderSeatForTrip.',
  };
}

module.exports = {
  shouldServeStatusPage,
  buildStatusPayload,
};
