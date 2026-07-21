import { HttpException } from './http.exception'

/** 400 Bad Request — the request is malformed or has invalid parameters. */
export class BadRequestException extends HttpException {
  constructor(message = 'Bad Request') { super(400, message) }
}

/** 401 Unauthorized — authentication is required or has failed. */
export class UnauthorizedException extends HttpException {
  constructor(message = 'Unauthorized') { super(401, message) }
}

/** 403 Forbidden — the client does not have permission to access the resource. */
export class ForbiddenException extends HttpException {
  constructor(message = 'Forbidden') { super(403, message) }
}

/** 404 Not Found — the requested resource does not exist. */
export class NotFoundException extends HttpException {
  constructor(message = 'Not Found') { super(404, message) }
}

/** 405 Method Not Allowed — the HTTP method is not supported for this route. */
export class MethodNotAllowedException extends HttpException {
  constructor(message = 'Method Not Allowed') { super(405, message) }
}

/** 408 Request Timeout — the server timed out waiting for the request. */
export class RequestTimeoutException extends HttpException {
  constructor(message = 'Request Timeout') { super(408, message) }
}

/** 409 Conflict — the request conflicts with the current state of the resource. */
export class ConflictException extends HttpException {
  constructor(message = 'Conflict') { super(409, message) }
}

/** 410 Gone — the resource is no longer available and will not be available again. */
export class GoneException extends HttpException {
  constructor(message = 'Gone') { super(410, message) }
}

/** 422 Unprocessable Entity — the request is well-formed but contains semantic errors. */
export class UnprocessableEntityException extends HttpException {
  constructor(message = 'Unprocessable Entity') { super(422, message) }
}

/** 429 Too Many Requests — the client has sent too many requests in a given time. */
export class TooManyRequestsException extends HttpException {
  constructor(message = 'Too Many Requests') { super(429, message) }
}

/** 500 Internal Server Error — an unexpected error occurred on the server. */
export class InternalServerErrorException extends HttpException {
  constructor(message = 'Internal Server Error') { super(500, message) }
}

/** 501 Not Implemented — the server does not support the requested functionality. */
export class NotImplementedException extends HttpException {
  constructor(message = 'Not Implemented') { super(501, message) }
}

/** 503 Service Unavailable — the server is temporarily unable to handle the request. */
export class ServiceUnavailableException extends HttpException {
  constructor(message = 'Service Unavailable') { super(503, message) }
}
