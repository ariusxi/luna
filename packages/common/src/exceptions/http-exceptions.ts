import { HttpException } from './http.exception'

/** Optional extra fields merged into the JSON error body by the adapter. */
type ExceptionDetails = Record<string, unknown>

/** 400 Bad Request — the request is malformed or has invalid parameters. */
export class BadRequestException extends HttpException {
  constructor(message = 'Bad Request', details?: ExceptionDetails) { super(400, message, details) }
}

/** 401 Unauthorized — authentication is required or has failed. */
export class UnauthorizedException extends HttpException {
  constructor(message = 'Unauthorized', details?: ExceptionDetails) { super(401, message, details) }
}

/** 403 Forbidden — the client does not have permission to access the resource. */
export class ForbiddenException extends HttpException {
  constructor(message = 'Forbidden', details?: ExceptionDetails) { super(403, message, details) }
}

/** 404 Not Found — the requested resource does not exist. */
export class NotFoundException extends HttpException {
  constructor(message = 'Not Found', details?: ExceptionDetails) { super(404, message, details) }
}

/** 405 Method Not Allowed — the HTTP method is not supported for this route. */
export class MethodNotAllowedException extends HttpException {
  constructor(message = 'Method Not Allowed', details?: ExceptionDetails) { super(405, message, details) }
}

/** 408 Request Timeout — the server timed out waiting for the request. */
export class RequestTimeoutException extends HttpException {
  constructor(message = 'Request Timeout', details?: ExceptionDetails) { super(408, message, details) }
}

/** 409 Conflict — the request conflicts with the current state of the resource. */
export class ConflictException extends HttpException {
  constructor(message = 'Conflict', details?: ExceptionDetails) { super(409, message, details) }
}

/** 410 Gone — the resource is no longer available and will not be available again. */
export class GoneException extends HttpException {
  constructor(message = 'Gone', details?: ExceptionDetails) { super(410, message, details) }
}

/** 422 Unprocessable Entity — the request is well-formed but contains semantic errors. */
export class UnprocessableEntityException extends HttpException {
  constructor(message = 'Unprocessable Entity', details?: ExceptionDetails) { super(422, message, details) }
}

/** 429 Too Many Requests — the client has sent too many requests in a given time. */
export class TooManyRequestsException extends HttpException {
  constructor(message = 'Too Many Requests', details?: ExceptionDetails) { super(429, message, details) }
}

/** 500 Internal Server Error — an unexpected error occurred on the server. */
export class InternalServerErrorException extends HttpException {
  constructor(message = 'Internal Server Error', details?: ExceptionDetails) { super(500, message, details) }
}

/** 501 Not Implemented — the server does not support the requested functionality. */
export class NotImplementedException extends HttpException {
  constructor(message = 'Not Implemented', details?: ExceptionDetails) { super(501, message, details) }
}

/** 503 Service Unavailable — the server is temporarily unable to handle the request. */
export class ServiceUnavailableException extends HttpException {
  constructor(message = 'Service Unavailable', details?: ExceptionDetails) { super(503, message, details) }
}
