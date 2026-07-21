export {
  HttpException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  MethodNotAllowedException,
  RequestTimeoutException,
  ConflictException,
  GoneException,
  UnprocessableEntityException,
  TooManyRequestsException,
  InternalServerErrorException,
  NotImplementedException,
  ServiceUnavailableException,
} from '@lunafw/common'

/** Shape of the JSON body sent by the Express adapter for HTTP error responses. */
export interface HttpExceptionResponse {
  statusCode: number
  message: string
}
