export type ResponseObject<K extends string, T> = {
  [P in K]: T;
};

enum Result {
  SUCCESS = 'SUCCESS',
  FAIL = 'FAIL',
}

export enum ErrorCode {
  COMMON_SYSTEM_ERROR = '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  COMMON_INVALID_PARAMETER = '요청한 값이 올바르지 않습니다.',
  COMMON_ENTITY_NOT_FOUND = '존재하지 않는 엔티티입니다.',
  COMMON_ILLEGAR_STATUS = '잘못된 상태 값입니다.',
}

export interface ICommonResponse<T> {
  result: Result;
  data: T;
  message: string;
  errorCode: string | null;
}

export class CommonResponse<T> {
  private result: Result;
  private data: T;
  private message: string;
  private errorCode: string | null;

  constructor(builder) {
    this.result = builder.result;
    this.data = builder.data;
    this.message = builder.message;
    this.errorCode = builder.errorCode;
  }

  static builder() {
    return new CommonResponseBuilder();
  }

  static success<T>(data: T, message?: string): CommonResponse<T> {
    return CommonResponse.builder()
      .setResult(Result.SUCCESS)
      .setData(data)
      .setMessage(message)
      .setErrorCode(null)
      .build();
  }

  static fail(message: string, errorCode: string, error?: ErrorCode) {
    if (error) {
      const getErrorName = (error: ErrorCode) => {
        for (const enumMember in ErrorCode) {
          if (ErrorCode[enumMember] === error) return enumMember;
        }
      };
      return CommonResponse.builder()
        .setResult(Result.FAIL)
        .setMessage(error)
        .setErrorCode(getErrorName(error))
        .build();
    } else {
      return CommonResponse.builder()
        .setResult(Result.FAIL)
        .setMessage(message)
        .setErrorCode(errorCode)
        .build();
    }
  }
}

export class CommonResponseBuilder<T> {
  private result;
  private data: T;
  private message;
  private errorCode;

  setResult(result) {
    this.result = result;
    return this;
  }

  setData(data: T) {
    this.data = data;
    return this;
  }

  setMessage(message) {
    this.message = message;
    return this;
  }

  setErrorCode(errorCode) {
    this.errorCode = errorCode;
    return this;
  }

  build<T>(): CommonResponse<T> {
    return new CommonResponse(this);
  }
}
