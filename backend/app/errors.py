class ApiException(Exception):
    def __init__(self, status: int, message: str, details: object | None = None):
        super().__init__(message)
        self.status = status
        self.message = message
        self.details = details


class BadRequest(ApiException):
    def __init__(self, message: str, details: object | None = None):
        super().__init__(400, message, details)


class Unauthorized(ApiException):
    def __init__(self, message: str, details: object | None = None):
        super().__init__(401, message, details)


class Forbidden(ApiException):
    def __init__(self, message: str, details: object | None = None):
        super().__init__(403, message, details)


class NotFound(ApiException):
    def __init__(self, message: str, details: object | None = None):
        super().__init__(404, message, details)
