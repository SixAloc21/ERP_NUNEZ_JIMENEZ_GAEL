function buildResponse(statusCode, intOpCode, data) {
  return {
    statusCode,
    intOpCode,
    data,
  };
}

module.exports = {
  buildResponse,
};
