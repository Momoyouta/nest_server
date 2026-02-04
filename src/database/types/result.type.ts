export class Result<T = any> {
  code: number;
  msg: string;
  data: T;

  constructor(code: number, msg: string, data: T) {
    this.code = code;
    this.msg = msg;
    this.data = data;
  }

  static success<T>( msg = 'success', data: T | null = null) {
    return new Result(200, msg, data);
  }

  static error(msg = 'error', code = 500) {
    return new Result(code, msg, null);
  }
}