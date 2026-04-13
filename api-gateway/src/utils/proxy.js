const AppError = require('./appError');

function buildTargetUrl(baseUrl, wildcard = '', query = {}) {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  const normalizedWildcard = wildcard ? `/${String(wildcard).replace(/^\/+/, '')}` : '';
  const url = new URL(`${normalizedBaseUrl}${normalizedWildcard}`);

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    url.searchParams.set(key, String(value));
  });

  return url;
}

async function proxyRequest(request, reply, targetBaseUrl) {
  const wildcard = request.params?.['*'] || '';
  const targetUrl = buildTargetUrl(targetBaseUrl, wildcard, request.query);

  const headers = {
    accept: 'application/json',
  };

  if (request.headers.authorization) {
    headers.authorization = request.headers.authorization;
  }

  if (request.headers['content-type']) {
    headers['content-type'] = request.headers['content-type'];
  }

  const requestOptions = {
    method: request.method,
    headers,
  };

  if (!['GET', 'HEAD'].includes(request.method.toUpperCase()) && request.body !== undefined) {
    requestOptions.body = JSON.stringify(request.body);
  }

  let serviceResponse;

  try {
    serviceResponse = await fetch(targetUrl, requestOptions);
  } catch (error) {
    throw new AppError(502, 'ExGW502', 'No se pudo contactar el microservicio', {
      target: targetUrl.toString(),
    });
  }

  const responseText = await serviceResponse.text();
  let payload = responseText;

  try {
    payload = responseText ? JSON.parse(responseText) : null;
  } catch (error) {
    payload = responseText;
  }

  const contentType = serviceResponse.headers.get('content-type');
  if (contentType) {
    reply.header('content-type', contentType);
  }

  return reply.code(serviceResponse.status).send(payload);
}

module.exports = {
  proxyRequest,
};
