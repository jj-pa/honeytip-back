export type ResponseObject<K extends string, T> = {
  [P in K]: T;
};

enum Result {
  SUCCESS = 'SUCCESS',
  FAIL = 'FAIL',
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

  static fail(message: string, errorCode: string) {
    return CommonResponse.builder()
      .setResult(Result.FAIL)
      .setMessage(message)
      .setErrorCode(errorCode)
      .build();
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
